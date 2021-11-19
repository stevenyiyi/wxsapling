import React from "react";
import Hls from "hls.js";
import { FaBars, FaUser, FaTelegramPlane } from "react-icons/fa";
import { UserContext } from "../user_context";
import HLSPlayer from "./hlsplayer";
import CameraList from "./camera_list";
import Person from "./person";
import Jabber from "./jabber";
import { tlv_serialize_object, tlv_unserialize_object } from "./tlv";
import Websocket from "./websocket";
import { useSnackbar } from "./use_snackbar";
import "./live_player.css";

const ENDPOINT = "ws://localhost/ws_jabber";
// custom hook for getting previous value
function usePrevious(value) {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default function LivePlayer(props) {
  const userCtx = React.useContext(UserContext);
  const username = userCtx.user.username;
  const ws = React.useRef(null);
  const [openSnackbar, closeSnackbar] = useSnackbar();
  const [streamUri, setStreamUri] = React.useState("");
  const [checkMpd, setCheckMpd] = React.useState("");
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [camlist, setCamlist] = React.useState(null);
  const [isMainStream, setIsMainStream] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [playerRefreshId, setPlayerRefreshId] = React.useState(0);
  const [checkMpdRefreshId, setCheckMpdRefreshId] = React.useState(0);
  const [camsRefreshId, setCamsRefreshId] = React.useState(0);
  const [showPerson, setShowPerson] = React.useState(false);
  const [chatText, setChatText] = React.useState("");
  const [messages, setMessages] = React.useState([]);

  /** Get previous  checkMpd */
  const prevCheckMpd = usePrevious(checkMpd);

  const timer = React.useRef();
  const refVideo = React.useRef();
  const refPerson = React.useRef();

  const supportsMediaSource = () => {
    let hasWebKit = "WebKitMediaSource" in window;
    let hasMediaSource = "MediaSource" in window;
    return hasWebKit || hasMediaSource;
  };

  const triggerPlayerTimer = React.useCallback((uri) => {
    if (!timer.current || timer.current === 0) {
      timer.current = setInterval(() => {
        if (supportsMediaSource()) {
          setCheckMpdRefreshId((previd) => previd + 1);
        } else {
          setPlayerRefreshId((playerRefreshId) => playerRefreshId + 1);
        }
      }, 20000);
    }
  }, []);

  /** 处理播放错误 */
  const handlePlayerError = React.useCallback(
    (error) => {
      let msg = "";
      if (error instanceof MediaError) {
        let ecode = error.code;
        switch (ecode) {
          case MediaError.MEDIA_ERR_NETWORK:
            msg = "播放超时，将重新刷新观看列表...";
            setCamsRefreshId((rid) => rid + 1);
            break;
          case MediaError.MEDIA_ERR_DECODE:
            msg = "浏览器不支持播放该视频格式!";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            msg = "不支持的播放格式，将重刷新列表...";
            setCamsRefreshId((rid) => rid + 1);
            break;
          case MediaError.MEDIA_ERR_ABORTED:
            msg = "请求播放终止.";
            break;
          default:
            msg = "未知错误!";
            setCamsRefreshId((rid) => rid + 1);
            break;
        }
      } else {
        if (error.type === Hls.ErrorTypes.NETWORK_ERROR) {
          let details = error.details;
          if (
            details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
            details === Hls.ErrorDetails.LEVEL_LOAD_ERROR ||
            details === Hls.ErrorDetails.AUDIO_TRACK_LOAD_ERROR ||
            details === Hls.ErrorDetails.FRAG_LOAD_ERROR ||
            details === Hls.ErrorDetails.KEY_LOAD_ERROR
          ) {
            let rcode = error.response.code;
            if (rcode === 403) {
              msg = "检测到您的帐户正在观看,请先退出,20秒后将自动重新连接...";
              console.log("url:" + error.url);
              triggerPlayerTimer(error.url);
            } else if (rcode === 404) {
              msg = "观看的流已经下线，将重新刷新观看列表!";
              setCamsRefreshId((rid) => rid + 1);
            } else {
              msg = "服务器出了点问题,请稍候刷新再试!错误代码:" + rcode;
            }
          } else if (
            details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
            details === Hls.ErrorDetails.KEY_LOAD_TIMEOUT ||
            details === Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT
          ) {
            msg = "加载文件超时，请检查网络是否正常...";
            setCamsRefreshId((rid) => rid + 1);
          } else if (
            details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR ||
            details === Hls.ErrorDetails.LEVEL_EMPTY_ERROR
          ) {
            msg = "解析mainfest错误:" + error.reason;
          } else {
            msg = "服务器出了点问题，请稍候再试!";
            setCamsRefreshId((rid) => rid + 1);
          }
        } else {
          msg =
            "无法播放此视频,错误类型：" +
            error.type +
            ",错误代码:" +
            error.details +
            ",描述:" +
            error.reason;
        }
      }
      openSnackbar(msg);
    },
    [triggerPlayerTimer, openSnackbar]
  );

  /** 从服务器获取摄像头列表 */
  React.useEffect(() => {
    const ERR_NO_ACCOUNT = 0x800000f;
    const ERR_INVALID_PWD = ERR_NO_ACCOUNT + 1;
    const ERR_OVERDUE = ERR_INVALID_PWD + 1;
    fetch(`/sapling/get_camera_list?ts=${Date.now()}`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json"
      },
      cache: "no-cache",
      method: "GET",
      mode: "cors"
    })
      .then((response) => {
        if (response.ok) {
          const resp = response.json();
          if (resp.result === 0) {
            setCamlist(resp.cameras);
          } else if (resp.result === ERR_NO_ACCOUNT) {
            console.log("帐户不存在!");
          } else if (resp.result === ERR_INVALID_PWD) {
            console.log("口令错误");
          } else if (resp.result === ERR_OVERDUE) {
            console.log("帐户已过期!");
          } else {
            console.log(`get_camera_list response error code:${resp.result}`);
            setCamlist({
              groups: [
                {
                  gid: "3214124121324",
                  name: "北碚紫荆花幼儿园",
                  cameras: [
                    { oid: "142313441234123", name: "中一班", status: 1 },
                    { oid: "142313441141231", name: "中二班", status: 1 },
                    { oid: "142313441141232", name: "中二班", status: 1 },
                    { oid: "142313441141233", name: "中二班", status: 1 },
                    { oid: "142313441141234", name: "中二班", status: 1 },
                    { oid: "142313441141235", name: "中二班", status: 1 },
                    { oid: "142313441141236", name: "中二班", status: 1 }
                  ]
                }
              ]
            });
          }
        } else {
          throw new Error(`Server repsone status:${response.status}`);
        }
      })
      .catch((e) => console.error("Error:", e));
  }, [camsRefreshId]);

  /** 检查播放地址（仅用于不支持MSE的浏览器） */
  React.useEffect(() => {
    if (checkMpd) {
      /**Player uri or refreshMpdId changed */
      setLoading(true);
      fetch(checkMpd, {
        credentials: "include",
        headers: {
          Accept: "application/x-mpegURL",
          "Content-type": "application/x-mpegURL"
        },
        cache: "no-cache",
        method: "GET",
        mode: "cors"
      })
        .then((response) => {
          setLoading(false);
          if (response.status !== 200) {
            /** Hls.ErrorDetails.MANIFEST_LOAD_ERROR -
             *  raised when manifest loading fails because of a network error -
             *  data: { type : NETWORK_ERROR, details : Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
             *  fatal : true, url : manifest URL,
             *  response : { code: error code, text: error text } }
             * */
            let err = {
              type: Hls.ErrorTypes.NETWORK_ERROR,
              details: Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
              fatal: true,
              url: checkMpd,
              response: { code: response.status }
            };
            handlePlayerError(err);
          } else {
            /** 检查成功 */
            if (prevCheckMpd.current !== checkMpd) {
              setStreamUri(checkMpd);
            } else {
              setPlayerRefreshId((playerRefreshId) => playerRefreshId + 1);
            }
          }
          return response.text();
        })
        .then((respText) => {
          console.log(`fetch mpd:${respText}`);
        })
        .catch((error) => {
          setLoading(false);
          console.error("fetch play uri error:", error.message);
        });
    }
  }, [checkMpd, checkMpdRefreshId, prevCheckMpd, handlePlayerError]);
  React.useLayoutEffect(() => {
    if (refVideo.current) {
      setDimensions({
        width: refVideo.current.offsetWidth,
        height: refVideo.current.offsetHeight
      });
      console.log(
        `useLayoutEffect, width:${refVideo.current.offsetWidth}, height:${refVideo.current.offsetHeight}`
      );
    }
  }, []);

  const handlePlayerSuccess = React.useCallback((uri) => {
    console.log(`playing ${uri} success!`);
    if (timer.current && timer.current > 0) {
      clearInterval(timer.current);
      timer.current = 0;
    }
    setPlayerRefreshId(0);
    setCheckMpd("");
  }, []);

  const handlePlayUri = (uri, is_main_stream) => {
    console.log(`Play uri:${uri}, is main stream:${isMainStream}`);
    if (supportsMediaSource()) {
      setStreamUri(uri);
    } else {
      setCheckMpd(uri);
    }
    setIsMainStream(is_main_stream);
  };

  /** 点击个人信息 */
  const handlePersonClick = (event) => {
    setShowPerson(!showPerson);
  };
  /** 个人信息关闭事件*/
  const handlePersonClose = (event) => {
    if (!refPerson.current.contains(event.target)) {
      setShowPerson(false);
    }
  };

  /** 点击聊天 */
  const handleJabber = (event) => {
    setMessages([
      ...messages,
      { from: "chengyi", text: chatText, ts: Date.now() }
    ]);
  };

  /** Websocket callbacks */
  const ws_onopen = (e) => {
    console.log(`websocket onopen,event:${e}`);
  };
  const ws_onclose = (e) => {
    console.log(`websocket onclose,code:${e.code}, reason:${e.reason}`);
  };
  const ws_onerror = (e) => {
    console.log(`websocket onclose,code:${e.code}, reason:${e.reason}`);
  };

  const ws_onmessage = (data) => {
    const wsmsg = tlv_unserialize_object(data);
    for (const [key, value] of Object.entries(wsmsg)) {
      if (key === "on_jabber") {
        console.log(value);
        setMessages([...messages, value]);
      } else {
        console.log(`Unknown ws onmessage method:${key}`);
      }
    }
  };

  const hlsconfig = React.useMemo(
    () => ({
      liveDurationInfinity: true,
      xhrSetup: function (xhr, url) {
        xhr.withCredentials = true; // do send cookies
      },
      fetchSetup: function (context, initParams) {
        // Always send cookies, even for cross-origin calls.
        initParams.credentials = "include";
        return new Request(context.url, initParams);
      }
    }),
    []
  );
  return (
    <div className="container">
      {username && (
        <Websocket
          ref={ws}
          url={`${ENDPOINT}?username=${username}`}
          onOpen={ws_onopen}
          onMessage={ws_onmessage}
          onClose={ws_onclose}
          onError={ws_onerror}
          reconnect={true}
          debug={true}
          protocol="chat"
        />
      )}
      <div className="player" ref={refVideo}>
        <HLSPlayer
          url={streamUri}
          width={dimensions.width}
          height={dimensions.height}
          autoplay={true}
          hlsConfig={hlsconfig}
          poster=""
          videoProps={{}}
          onError={handlePlayerError}
          onSuccess={handlePlayerSuccess}
          refreshId={playerRefreshId}
        />
      </div>
      <div className="content__container">
        {camlist && <CameraList camlist={camlist} onPlayUri={handlePlayUri} />}
        <Jabber messages={messages} />
      </div>
      <div className="navbar">
        <div className="icon">
          <FaBars />
        </div>
        <div ref={refPerson} className="icon" onClick={handlePersonClick}>
          <FaUser />
        </div>
        <input
          id="input-jabber-message"
          type="text"
          placeholder="说点什么？"
          value={chatText}
          onChange={(e) => setChatText(e.target.value.trim())}
        />
        <div className="icon" onClick={handleJabber}>
          <FaTelegramPlane />
        </div>
      </div>
      <Person show={showPerson} onClose={handlePersonClose} />
    </div>
  );
}
