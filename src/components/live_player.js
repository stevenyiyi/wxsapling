import React from "react";
import Hls from "hls.js";
import { UserContext } from "../user_context";
import HLSPlayer from "./hlsplayer";
import "./live_player.css";

// custom hook for getting previous value
function usePrevious(value) {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

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
  const userCtx = React.useContext(UserContext);
  const [streamUri, setStreamUri] = React.useState("");
  const [checkMpd, setCheckMpd] = React.useState("");
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [groups, setGroups] = React.useState(null);
  const [cameras, setCameras] = React.useState(null);
  const [isMainStream, setIsMainStream] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [playerRefreshId, setPlayerRefreshId] = React.useState(0);
  const [checkMpdRefreshId, setCheckMpdRefreshId] = React.useState(0);
  const [camsRefreshId, setCamsRefreshId] = React.useState(0);
  const [message, dispatch] = React.useReducer(reducer, {
    open: false,
    variant: "error",
    text: ""
  });

  /** Get previous  checkMpd */
  const prevCheckMpd = usePrevious(checkMpd);

  const timer = React.useRef();
  const refVideo = React.useRef();

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
              msg = "服务器出了点问题,请稍候刷新再试!错误代码:" + rcode;
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
    [triggerPlayerTimer]
  );

  /** 从服务器获取摄像头列表 */
  React.useEffect(() => {
    const ERR_NO_ACCOUNT = 0x800000f;
    const ERR_INVALID_PWD = ERR_NO_ACCOUNT + 1;
    const ERR_OVERDUE = ERR_INVALID_PWD + 1;
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

    const processResponse = (response) => {
      if (response.result === 0) {
        let clist = response.cameras;
        let robj = fixCameraList(clist);
        let puri = robj.playuri;
        setIsMainStream(robj.is_main_stream);
        if (clist.groups) setGroups(clist.groups);
        else setGroups(null);
        if (clist.cameras) setCameras(clist.cameras);
        else setCameras(null);
        if (supportsMediaSource() && puri) {
          setCheckMpd(puri);
        } else {
          setStreamUri(puri);
        }
      } else if (response.result === ERR_NO_ACCOUNT) {
        console.log("帐户不存在!");
      } else if (response.result === ERR_INVALID_PWD) {
        console.log("口令错误");
      } else if (response.result === ERR_OVERDUE) {
        console.log("帐户已过期!");
      } else {
        console.log(
          `get_camera_list response error code:${response.data.response}`
        );
      }
    };

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
          processResponse(response.json());
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

  function genCameraList(cameralist, nested) {
    const clist = cameralist.map((cam, index) => {
      const scam = JSON.stringify(cam);
      if (cam.status !== 1) {
        return (
          <div
            className={
              index === activeIdx
                ? "user-item__wrapper user-item__selected"
                : "user-item__wrapper"
            }
            key={cam.oid}
            id={index}
            onClick={() => {
              handleClickTeacher(index);
            }}
          >
            <ListItemIcon>
              <CamcorderOff />
            </ListItemIcon>
            <ListItemText primary={cam.name} />
          </div>
        );
      } else {
        return (
          <ListItem
            alignItems="flex-start"
            className={nested ? classes.nested : classes.normal}
            selected={cam.selected}
            button
            key={cam.oid}
            itemvalue={scam}
            onClick={(event) => onCameraClick(cam)}
          >
            <ListItemIcon>
              <Camcorder />
            </ListItemIcon>
            <ListItemText primary={cam.name} />
            {isAliveUser() && (
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={(event) => {
                    handleQueryRecord(cam);
                  }}
                  aria-label="query-channel-record"
                >
                  <QueryRelordListIcon />
                </IconButton>
              </ListItemSecondaryAction>
            )}
          </ListItem>
        );
      }
    });
    return clist;
  }

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
      <div className="user-list__container"></div>
    </div>
  );
}
