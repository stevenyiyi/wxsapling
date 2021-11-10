import React from "react";
import Hls from "hls.js";
import http from "../http_common";
import { UserContext } from "../user_context";
import "./live_player.css";

function reducer(message, action) {
  switch (action.type) {
    case "close":
      return { ...message, open: false };
    case "update":
      return {
        ...message,
        open: action.open,
        variant: action.variant,
        text: action.text
      };
    default:
      throw new Error("Unexpected action");
  }
}
export default function LivePlayer(props) {
  const ERR_NO_ACCOUNT = 0x800000f;
  const ERR_INVALID_PWD = ERR_NO_ACCOUNT + 1;
  const ERR_OVERDUE = ERR_INVALID_PWD + 1;
  const userCtx = React.useContext(UserContext);
  const [streamUri, setStreamUri] = React.useState("");
  const [groups, setGroups] = React.useState(null);
  const [cameras, setCameras] = React.useState(null);
  const [isMainStream, setIsMainStream] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [playerRefreshId, setPlayerRefreshId] = React.useState(0);
  const [camsRefreshId, setCamsRefreshId] = React.useState(0);
  const [message, dispatch] = React.useReducer(reducer, {
    open: false,
    variant: "error",
    text: ""
  });
  const timer = React.useRef();
  const refVideo = React.useRef();
  const mpdCheckUri = React.useRef("");
  const supportsMediaSource = () => {
    let hasWebKit = "WebKitMediaSource" in window;
    let hasMediaSource = "MediaSource" in window;
    return hasWebKit || hasMediaSource;
  };

  /** 根据oid产生播放地址 */
  const genPlayUri = (oid) => {
    let uri = "/live/" + oid + "_master.m3u8";
    return uri;
  };
  /** 给每一个camera 增加属性 'selected' 并返回默认选择播放的url及是否用主码流*/
  const fixCameraList = (camlist) => {
    // 预处理 camlist
    let obj = { playuri: "", is_main_stream: true };
    if (camlist.cameras) {
      let dcams = camlist.cameras.map((cam) => {
        if (cam.status === 1 && !obj.playuri) {
          cam["selected"] = true;
          obj.playuri = genPlayUri(cam.oid);
          obj.is_main_stream = cam.is_main_stream;
        } else {
          cam["selected"] = false;
        }
        return cam;
      });
      camlist.cameras = dcams;
    }
    if (camlist.groups) {
      let cgroups = camlist.groups.map((group) => {
        group.cameras.forEach((cam, index, theArray) => {
          if (cam.status === 1 && !obj.playuri) {
            theArray[index].selected = true;
            obj.playuri = genPlayUri(cam.oid);
            obj.is_main_stream = cam.is_main_stream;
          } else {
            theArray[index].selected = false;
          }
        });
        return { ...group, unfold: true };
      });
      camlist.groups = cgroups;
    }
    return obj;
  };

  const triggerPlayerTimer = React.useCallback(
    (uri) => {
      mpdCheckUri.current = uri;
      if (!timer.current || timer.current === 0) {
        timer.current = setInterval(() => {
          if (supportsMediaSource()) {
            tryPullMediaMpd(mpdCheckUri.current, false);
          } else {
            setPlayerRefreshId((playerRefreshId) => playerRefreshId + 1);
          }
        }, 20000);
      }
    },
    [tryPullMediaMpd]
  );

  /** 处理播放错误 */
  const handlePlayerError = React.useCallback(
    (error) => {
      let msg = "";
      let variant = "";
      if (error instanceof MediaError) {
        let ecode = error.code;
        switch (ecode) {
          case MediaError.MEDIA_ERR_NETWORK:
            variant = "error";
            msg = "播放超时，将重新刷新观看列表...";
            setCamsRefreshId((rid) => rid + 1);
            break;
          case MediaError.MEDIA_ERR_DECODE:
            variant = "error";
            msg = "浏览器不支持播放该视频格式!";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            variant = "error";
            msg = "不支持的播放格式，将重刷新列表...";
            setCamsRefreshId((rid) => rid + 1);
            break;
          case MediaError.MEDIA_ERR_ABORTED:
            variant = "info";
            msg = "请求播放终止.";
            break;
          default:
            variant = "error";
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
              variant = "warning";
              msg = "检测到您的帐户正在观看,请先退出,20秒后将自动重新连接...";
              console.log("url:" + error.url);
              triggerPlayerTimer(error.url);
            } else if (rcode === 404) {
              variant = "error";
              msg = "观看的流已经下线，将重新刷新观看列表!";
              setCamsRefreshId((rid) => rid + 1);
            } else {
              variant = "error";
              msg = "服务器出了点问题,请稍候再试!错误代码:" + rcode;
            }
          } else if (
            details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
            details === Hls.ErrorDetails.KEY_LOAD_TIMEOUT ||
            details === Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT
          ) {
            variant = "error";
            msg = "加载文件超时，请检查网络是否正常...";
            setCamsRefreshId((rid) => rid + 1);
          } else if (
            details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR ||
            details === Hls.ErrorDetails.LEVEL_EMPTY_ERROR
          ) {
            variant = "error";
            msg = "解析mainfest错误:" + error.reason;
          } else {
            variant = "error";
            msg = "服务器出了点问题，请稍候再试!";
            setCamsRefreshId((rid) => rid + 1);
          }
        } else {
          variant = "error";
          msg =
            "无法播放此视频,错误类型：" +
            error.type +
            ",错误代码:" +
            error.details +
            ",描述:" +
            error.reason;
        }
      }
      dispatch({ type: "update", open: true, variant: variant, text: msg });
    },
    [camsRefreshId, triggerPlayerTimer]
  );

  const tryPullMediaMpd = React.useCallback(
    (playUrl, isUriChanged) => {
      /**Player uri or refreshMpdId changed */
      setLoading(true);
      fetch(playUrl, {
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
              url: playUrl,
              response: { code: response.status }
            };
            handlePlayerError(err);
          } else {
            setStreamUri(playUrl);
            if (!isUriChanged) {
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
    },
    [handlePlayerError]
  );

  React.useEffect(() => {
    http
      .get(`/sapling/get_camera_list?ts=${Date.now()}`)
      .then((response) => {
        if (response.data.result === 0) {
          let clist = response.data.cameras;
          let robj = fixCameraList(clist);
          let puri = robj.playuri;
          setIsMainStream(robj.is_main_stream);
          if (clist.groups) setGroups(clist.groups);
          else setGroups(null);
          if (clist.cameras) setCameras(clist.cameras);
          else setCameras(null);
          if (supportsMediaSource() && puri) {
            tryPullMediaMpd(puri, true);
          } else {
            setStreamUri(puri);
          }
        } else if (response.data.result === ERR_NO_ACCOUNT) {
          console.log("帐户不存在!");
        } else if (response.data.result === ERR_INVALID_PWD) {
          console.log("口令错误");
        } else if (response.data.result === ERR_OVERDUE) {
          console.log("帐户已过期!");
        } else {
          console.log(
            `get_camera_list response error code:${response.data.response}`
          );
        }
      })
      .catch((e) => console.error("Error:", e));
  });

  return (
    <div className="container">
      <div className="player"></div>
      <div className="user-list__container"></div>
    </div>
  );
}
