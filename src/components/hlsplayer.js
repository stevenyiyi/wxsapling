import Hls from "hls.js";
import React from "react";
import PropTypes from "prop-types";
import browser from "../utils/browser";
import is from "../utils/is";
import CameraList from "./camera_list";
import Jabber from "./jabber";
import { useOutsideClick } from "../utils/hook";
import { useSnackbar } from "./use_snackbar";

import {
  FaPlay,
  FaPause,
  FaExpand,
  FaExpandAlt,
  FaVolumeUp,
  FaVolumeMute,
  FaExternalLinkAlt,
  FaBars,
  FaTelegramPlane,
  FaOsi
} from "react-icons/fa";
import "./normalize.css";
import "./hlsplayer.css";
/* eslint-disable no-console */
const screen = window.screen;
screen.lockOrientationUniversal = (mode) =>
  (screen.orientation &&
    screen.orientation.lock(mode).then(
      () => {},
      (err) => console.log(err)
    )) ||
  (screen.mozLockOrientation && screen.mozLockOrientation(mode)) ||
  (screen.msLockOrientation && screen.msLockOrientation(mode));

const angle = () => {
  // iOS
  if (typeof window.orientation === "number") {
    return window.orientation;
  }
  // Android
  if (screen && screen.orientation && screen.orientation.angle) {
    return window.orientation;
  }
  console.log("angle unknown");
  return 0;
};

// Get the prefix for fullscreen api
function get_fullscreen_prefix() {
  // No prefix
  if (is.function(document.exitFullscreen)) {
    return "";
  }

  // Check for fullscreen support by vendor prefix
  let value = "";
  const prefixes = ["webkit", "moz", "ms"];

  prefixes.some((pre) => {
    if (
      is.function(document[`${pre}ExitFullscreen`]) ||
      is.function(document[`${pre}CancelFullScreen`])
    ) {
      value = pre;
      return true;
    }

    return false;
  });

  return value;
}
/// Get the name for fullscreen api
function get_fullscreen_name(prefix) {
  return prefix === "moz" ? "FullScreen" : "Fullscreen";
}

/**
 * [fn.is_fullscreen] 检测是否全屏状态
 */
function is_state_fullscreen() {
  return !!(
    document.fullscreenElement ||
    document.msFullscreenElement ||
    document.mozFullScreenElement ||
    document.webkitFullscreenElement
  );
}

function has_audio(media) {
  // Get audio tracks
  return (
    Boolean(media.mozHasAudio) ||
    Boolean(media.webkitAudioDecodedByteCount) ||
    Boolean(media.audioTracks && media.audioTracks.length)
  );
}

function get_duration(media) {
  // Media duration can be NaN or Infinity before the media has loaded
  const realDuration = (media || {}).duration;
  const duration =
    !is.number(realDuration) || realDuration === Infinity ? 0 : realDuration;

  // If config duration is funky, use regular duration
  return duration;
}

export default function HLSPlayer(props) {
  const PLAYER_STATE_PAUSE = 0;
  const PLAYER_STATE_PLAY = 1;
  const PLAYER_STATE_PLAYING = 2;
  const PLAYER_STATE_ABORT = 3;
  const PLAYER_STATE_ERROR = 4;
  const PLAYER_STATE_WAITING = 5;
  const PLAYER_STATE_ENDED = 6;
  const PLAYER_STATE_SUSPEND = 7;
  const PLAYER_STATE_STALLED = 8;
  const PLAYER_STATE_EMPTIED = 9;
  const {
    url,
    controls,
    autoplay,
    hlsConfig,
    poster,
    videoProps,
    cameras,
    messages,
    onRefreshCamlist,
    onSendMessage,
    onPlayChange
  } = props;
  const [openSnackbar] = useSnackbar();
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [checkMpd, setCheckMpd] = React.useState("");
  const [streamUri, setStreamUri] = React.useState("");
  const [seekval, setSeekval] = React.useState(0);
  const [duration, setDuration] = React.useState(NaN);
  const [hasAudio, setHasAudio] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1.0);
  const [state, setState] = React.useState(PLAYER_STATE_PAUSE);
  const [loading, setLoading] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [scrollPosition, setScrollPosition] = React.useState({ x: 0, y: 0 });
  const [cleanupViewport, setCleanupViewport] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const refVidContainer = React.useRef();
  const refHls = React.useRef();
  const refVideo = React.useRef();
  const refControls = React.useRef();
  const refFsMenuBut = React.useRef();
  const refFsMenu = React.useRef();
  useOutsideClick(refFsMenu, (event) => {
    if (!refFsMenuBut.current.contains(event.target)) {
      refFsMenu.current.classList.remove("show");
    }
  });

  /** 尝试播放媒体 */
  const tryPlaying = React.useCallback((hasaudio) => {
    var playPromise = refVideo.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(function (error) {
        if (error.name === "NotAllowedError") {
          if (hasaudio) {
            refVideo.current.muted = true;
            tryPlaying();
          } else {
            /** 需要用户交互式播放 */
            setLoading(false);
            refControls.current.classList.toggle("show");
          }
        } else {
          setLoading(false);
          refControls.current.classList.toggle("show");
        }
      });
    }
  }, []);

  /** MSE load and playing */
  const msePlay = React.useCallback(
    (mutual) => {
      setLoading(true);
      if (refHls.current === null) {
        refHls.current = new Hls(hlsConfig);
        refHls.current.attachMedia(refVideo.current);
      }
      refHls.current.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log("video and hls.js are now bound together !");
        refHls.current.loadSource(streamUri);
        refHls.current.on(Hls.Events.MANIFEST_PARSED, () => {
          setDuration(get_duration(refVideo.current));
          let hasaudio = has_audio(refVideo.current);
          setHasAudio(hasaudio);

          if (autoplay || mutual) {
            tryPlaying(hasaudio);
            console.log(`duration:${refVideo.current.duration}`);
          }
        });
      });
      refHls.current.on(Hls.Events.ERROR, function (event, data) {
        setLoading(false);
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            console.log("media error encountered, try to recover");
            refHls.current.recoverMediaError();
          } else {
            console.log("Error,type:" + data.type + " details:" + data.details);
            refHls.current.stopLoad();
            ///refHls.current.detachMedia();
            ///refHls.current.destroy();
            /// Handling hls.js error
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              let details = data.details;
              if (
                details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
                details === Hls.ErrorDetails.LEVEL_LOAD_ERROR ||
                details === Hls.ErrorDetails.AUDIO_TRACK_LOAD_ERROR ||
                details === Hls.ErrorDetails.FRAG_LOAD_ERROR ||
                details === Hls.ErrorDetails.KEY_LOAD_ERROR
              ) {
                let rcode = data.response.code;
                if (rcode === 403) {
                  openSnackbar(
                    "我们已经检测到您的帐号已在其它设备上正在观看，请等待其它设备停止观看后再试!"
                  );
                  /// triggerPlayerTimer(error.url);
                } else if (rcode === 404) {
                  openSnackbar("观看的流已经下线，将重新刷新观看列表!");
                  onRefreshCamlist();
                } else {
                  openSnackbar(`服务器返回错误代码:${rcode}`);
                  onRefreshCamlist();
                }
              } else if (
                details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
                details === Hls.ErrorDetails.KEY_LOAD_TIMEOUT ||
                details === Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT
              ) {
                openSnackbar("加载文件超时，请检查网络是否正常...");
                onRefreshCamlist();
              } else if (
                details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR ||
                details === Hls.ErrorDetails.LEVEL_EMPTY_ERROR
              ) {
                openSnackbar(`解析mainfest错误: ${data.reason}`);
              } else {
                openSnackbar("服务器出了点问题，请稍候再试!");
              }
            } else {
              openSnackbar(
                "无法播放此视频,错误类型：" +
                  data.type +
                  ",错误代码:" +
                  data.details +
                  ",描述:" +
                  data.reason
              );
            }
          }
        }
      });
    },
    [autoplay, hlsConfig, onRefreshCamlist, streamUri, tryPlaying]
  );

  /** Native load and play */
  const nativePlay = React.useCallback(
    (mutual) => {
      // hls.js is not supported on platforms that do not have Media Source Extensions (MSE) enabled.
      // When the browser has built-in HLS support (check using `canPlayType`), we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video element through the `src` property.
      // This is using the built-in support of the plain video element, without using hls.js.
      // Note: it would be more normal to wait on the 'canplay' event below however on Safari (where you are most likely to find built-in HLS support) the video.src URL must be on the user-driven
      // white-list before a 'canplay' event will be emitted; the last video event that can be reliably listened-for when the URL is not on the white-list is 'loadedmetadata'.
      console.log("Browser not support mse, but can play m3u8!");
      setLoading(true);
      refVideo.current.src = streamUri;
      refVideo.current.load();
      refVideo.current.oncanplaythrough = (event) => {
        setDuration(get_duration(refVideo.current));
        let hasaudio = has_audio(refVideo.current);
        setHasAudio(hasaudio);
        if (autoplay || mutual) {
          tryPlaying(hasaudio);
        }
      };

      refVideo.current.onerror = (error) => {
        setLoading(false);
        refVideo.current.pause();
        refVideo.current.src = "";
        refVideo.current.removeAttribute("src"); // empty source
        refVideo.current.load();
        setState(PLAYER_STATE_ERROR);
        console.log(error);
        console.log(`Network status:${refVideo.networkState}`);
        /** Handle native video error */
        let ecode = error.code;
        let msg = "";
        switch (ecode) {
          case MediaError.MEDIA_ERR_NETWORK:
            msg = "播放超时，将重新刷新观看列表...";
            onRefreshCamlist();
            break;
          case MediaError.MEDIA_ERR_DECODE:
            msg = "浏览器不支持播放该视频格式!";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            msg = "不支持的播放格式，将重刷新列表...";
            onRefreshCamlist();
            break;
          case MediaError.MEDIA_ERR_ABORTED:
            msg = "请求播放终止.";
            break;
          default:
            msg = "未知错误!";
            break;
        }
        openSnackbar(`error:${msg}`);
      };
    },
    [autoplay, onRefreshCamlist, streamUri, tryPlaying]
  );

  React.useLayoutEffect(() => {
    if (refVidContainer.current) {
      setDimensions({
        width: refVidContainer.current.offsetWidth,
        height: refVidContainer.current.offsetHeight
      });
      console.log(
        `useLayoutEffect, width:${refVidContainer.current.offsetWidth}, height:${refVidContainer.current.offsetHeight}`
      );
    }
  }, []);

  React.useEffect(() => {
    if (browser.isIos) {
      refVideo.current.setAttribute("webkit-playsinline", true);
      refVideo.current.setAttribute("x-webkit-airplay", "allow");
    } else if (browser.isX5) {
      refVideo.current.setAttribute("x5-video-player-type", "h5-page");
      refVideo.current.setAttribute("x5-video-player-fullscreen", "true");
      refVideo.current.setAttribute("x5-video-orientation", "landscape");
    }
  }, []);

  React.useEffect(() => {
    if (checkMpd) {
      console.log(`check stream uri:${checkMpd}`);
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
          if (response.status === 404) {
            /// 直播流已经下线
            openSnackbar("直播流已经下线!");
            onRefreshCamlist();
          } else if (response.status === 403) {
            /// 多人同时观看
            openSnackbar(
              "我们已经检测到您的帐号已在其它设备上正在观看，请等待其它设备停止观看后再试!"
            );
          } else if (response.status === 200) {
            /** 检查成功 */
            setStreamUri(checkMpd);
          } else {
            /** 其它错误 */
            openSnackbar(`服务器返回错误代码:${response.status}`);
          }
          return response.text();
        })
        .then((respText) => {
          openSnackbar(`fetch mpd:${respText}`);
        })
        .catch((error) => {
          setLoading(false);
          openSnackbar("fetch play uri error:", error.message);
        });
    }
  }, [checkMpd, onRefreshCamlist]);

  React.useEffect(() => {
    console.log(
      `HLSPlayer useEffect,url:${url},hls:${refHls.current},video:${refVideo.current}`
    );
    if (url) {
      if (Hls.isSupported()) {
        setStreamUri(url);
      } else {
        /// Should setCheckMpd(url);but test
        setStreamUri(url);
      }
    }
  }, [url]);

  React.useEffect(() => {
    const handleVideoEvent = (event) => {
      if (event.type === "play") {
        setState(PLAYER_STATE_PLAY);
        console.log("play event!");
      } else if (event.type === "pause") {
        console.log("pause event!");
        setState(PLAYER_STATE_PAUSE);
      } else if (event.type === "abort") {
        console.log("abort event!");
        setLoading(false);
        setState(PLAYER_STATE_ABORT);
      } else if (event.type === "ended") {
        console.log("ended event!");
        refVideo.current.currentTime = 0;
        setLoading(false);
        setState(PLAYER_STATE_ENDED);
      } else if (event.type === "waiting") {
        console.log("waiting event!");
        setLoading(true);
        setState(PLAYER_STATE_WAITING);
      } else if (event.type === "playing") {
        console.log("playing event!");
        setState(PLAYER_STATE_PLAYING);
        setLoading(false);
        /// show controls delay 5 seconds
        refControls.current.classList.toggle("show");
        setTimeout(() => {
          refControls.current.classList.toggle("show");
        }, 5000);
      } else if (event.type === "suspend") {
        console.log("suspend event!");
        setState(PLAYER_STATE_SUSPEND);
        setLoading(false);
      } else if (event.type === "stalled") {
        console.log("stalled event!");
        setState(PLAYER_STATE_STALLED);
      } else if (event.type === "empied") {
        console.log("emptied event!");
        setState(PLAYER_STATE_EMPTIED);
        setLoading(false);
      }
    };

    const registerVideoEvents = () => {
      refVideo.current.addEventListener("play", handleVideoEvent);
      refVideo.current.addEventListener("pause", handleVideoEvent);
      refVideo.current.addEventListener("abort", handleVideoEvent);
      refVideo.current.addEventListener("playing", handleVideoEvent);
      refVideo.current.addEventListener("emptied", handleVideoEvent);
      refVideo.current.addEventListener("ended", handleVideoEvent);
      refVideo.current.addEventListener("stalled", handleVideoEvent);
      refVideo.current.addEventListener("suppend", handleVideoEvent);
    };

    const unregisterVideoEvents = () => {
      refVideo.current.removeEventListener("play", handleVideoEvent);
      refVideo.current.removeEventListener("pause", handleVideoEvent);
      refVideo.current.removeEventListener("abort", handleVideoEvent);
      refVideo.current.removeEventListener("playing", handleVideoEvent);
      refVideo.current.removeEventListener("emptied", handleVideoEvent);
      refVideo.current.removeEventListener("ended", handleVideoEvent);
      refVideo.current.removeEventListener("stalled", handleVideoEvent);
      refVideo.current.removeEventListener("suppend", handleVideoEvent);
    };
    const videoElement = refVideo.current;
    if (streamUri) {
      console.log(`play stream uri:${streamUri}`);
      setLoading(false);
      if (Hls.isSupported()) {
        if (refHls.current) {
          console.log("Destory hls!");
          refHls.current.stopLoad();
          refHls.current.detachMedia();
          refHls.current.destroy();
        }
        registerVideoEvents();
        msePlay(false);
      } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        videoElement.pause();
        videoElement.src = ""; // empty source
        videoElement.removeAttribute("src");
        videoElement.load();
        registerVideoEvents();
        nativePlay(false);
      } else {
        openSnackbar(
          "浏览器太老了,请下载一款支持MediaSourceExtension功能的浏览器!"
        );
      }
    }
    return () => {
      if (refHls.current) {
        console.log("Destory hls!");
        refHls.current.stopLoad();
        refHls.current.detachMedia();
        refHls.current.destroy();
      }
      if (
        Hls.isSupported() ||
        videoElement.canPlayType("application/vnd.apple.mpegurl")
      ) {
        unregisterVideoEvents();
      }
    };
  }, [streamUri, msePlay, nativePlay]);

  /** Not fullscreen api supported */
  const toggleDivFullscreen = React.useCallback(
    (toggle) => {
      // Store or restore scroll position
      if (toggle) {
        setScrollPosition({
          x: window.pageXOffset || 0,
          y: window.pageYOffset || 0
        });
      } else {
        window.scrollTo(scrollPosition.x, scrollPosition.y);
      }

      // Toggle scroll
      document.body.style.overflow = toggle ? "hidden" : "";

      // Toggle class hook
      refVidContainer.current.classList.toggle("div__fullscreen");

      // Force full viewport on iPhone X+
      if (browser.isIos) {
        let viewport = document.head.querySelector('meta[name="viewport"]');
        const property = "viewport-fit=cover";

        // Inject the viewport meta if required
        if (!viewport) {
          viewport = document.createElement("meta");
          viewport.setAttribute("name", "viewport");
        }

        // Check if the property already exists
        const hasProperty =
          is.string(viewport.content) && viewport.content.includes(property);

        if (toggle) {
          setCleanupViewport(!hasProperty);

          if (!hasProperty) {
            viewport.content += `,${property}`;
          }
        } else if (cleanupViewport) {
          viewport.content = viewport.content
            .split(",")
            .filter((part) => part.trim() !== property)
            .join(",");
        }
      }
      /// Dispatch fullscreen event to video container
      let fse = null;
      if (toggle) {
        fse = new CustomEvent("fullscreen", { detail: { state: "enter" } });
      } else {
        fse = new CustomEvent("fullscreen", { detail: { state: "exit" } });
      }
      console.log(`div entered fullscreen mode:${toggle}`);
      refVidContainer.current.dispatchEvent(fse);
    },
    [cleanupViewport, scrollPosition]
  );

  /** Fullscreen API:
      https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
  */
  const toggleNativeFullscreen = (toggle) => {
    if (toggle) {
      /// Enter fullscreen
      if (browser.isX5) {
        refVideo.current.x5RequestFullScreen();
      } else {
        if (refVideo.current.requestFullscreen) {
          refVidContainer.current.requestFullscreen().catch((err) => {
            console.error("Error:", err);
          });
        } else if (refVideo.current.msRequestFullscreen) {
          refVideo.current.msRequestFullscreen();
        } else if (refVideo.current.mozRequestFullScreen) {
          refVidContainer.current.mozRequestFullScreen();
        } else if (refVideo.current.webkitRequestFullscreen) {
          refVidContainer.current.webkitRequestFullscreen(
            Element.ALLOW_KEYBOARD_INPUT
          );
        } else {
          console.log("Browser not support fullscreen API!");
        }
      }
    } else {
      /// Exit fullscreen
      if (browser.isX5) {
        refVideo.current.x5CancelFullScreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.cancelFullScreen) {
          document.cancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else {
          console.log("Browser not support fullscreen API!");
        }
      }
    }
  };

  /** 移动设备屏幕切换处理 */
  const rotationHandler = React.useCallback(() => {
    const currentAngle = angle();

    if (currentAngle === 90 || currentAngle === 270 || currentAngle === -90) {
      if (refVideo.current.paused === false) {
        if (browser.supportsNativeFullscreen) {
          toggleNativeFullscreen(true);
        } else {
          toggleDivFullscreen(true);
        }
        screen.lockOrientationUniversal("landscape");
      }
    }
    if (currentAngle === 0 || currentAngle === 180) {
      if (isFullScreen) {
        if (browser.supportsNativeFullscreen) {
          toggleNativeFullscreen(false);
        } else {
          toggleDivFullscreen(false);
        }
      }
    }
  }, [isFullScreen, toggleDivFullscreen]);

  /** 全屏事件订阅 */
  React.useEffect(() => {
    setMuted(refVideo.current.muted);
    setVolume(refVideo.current.volume);

    let prefix = get_fullscreen_prefix();
    let eventName =
      prefix === "ms" ? "MSFullscreenChange" : `${prefix}fullscreenchange`;

    /** 订阅document全屏进入/退出事件 */
    document.addEventListener(eventName, (event) => {
      // document.fullscreenElement will point to the element that
      // is in fullscreen mode if there is one. If not, the value
      // of the property is null.
      let isfs = is_state_fullscreen();
      let fse = null;
      if (isfs) {
        fse = new CustomEvent("fullscreen", { detail: { state: "enter" } });
      } else {
        fse = new CustomEvent("fullscreen", { detail: { state: "exit" } });
      }
      console.log(`document entered fullscreen mode:${isfs}`);
      /// Notify video container fullscreen event
      refVidContainer.current.dispatchEvent(fse);
    });
  }, []);

  React.useEffect(() => {
    const handleFullscreenChange = (e) => {
      if (e.detail.state === "enter") {
        console.log("entered fullscreen mode.");
        setIsFullScreen(true);
        if (browser.isAndroid || browser.isIos) {
          /** 全屏模式下强制切换到横屏 */
          if (!angle()) {
            screen.lockOrientationUniversal("landscape");
          }
        }
      } else {
        console.log("Leaving full-screen mode.");
        setIsFullScreen(false);
        onPlayChange(streamUri);
      }
    };
    refVidContainer.current.addEventListener(
      "fullscreen",
      handleFullscreenChange
    );
    return () => {
      if (refVidContainer.current)
        refVidContainer.current.removeEventListener(
          "fullscreen",
          handleFullscreenChange
        );
    };
  }, [onPlayChange, streamUri]);

  React.useEffect(() => {
    if (browser.isAndroid || browser.isIos) {
      /** 订阅移动设备屏幕转换事件 */
      if (browser.isIos) {
        window.addEventListener("orientationchange", rotationHandler);
      } else if (screen && screen.orientation) {
        // addEventListener('orientationchange') is not a user interaction on Android
        screen.orientation.onchange = rotationHandler;
      }
    }
  }, [rotationHandler]);
  /** Player Controls event handle */
  /** 全屏处理 */
  const handleToggleFullscreen = (event) => {
    if (browser.supportsNativeFullscreen) {
      toggleNativeFullscreen(!isFullScreen);
    } else {
      console.log("Explorer not support fullscreen!");
      toggleDivFullscreen(!isFullScreen);
    }
  };

  /** 画中画处理 */
  const handleTogglePip = (event) => {
    /// safari
    if (is.function(refVideo.current.webkitSetPresentationMode)) {
      refVideo.current.webkitSetPresentationMode(
        refVideo.current.webkitPresentationMode === "picture-in-picture"
          ? "inline"
          : "picture-in-picture"
      );
      return;
    }
    /// chrome
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      if (document.pictureInPictureEnabled) {
        refVideo.current.requestPictureInPicture();
      }
    }
  };

  /** AirPlay 处理 */
  const handleAirplay = (event) => {
    // Show dialog if supported
    if (browser.airplay) {
      refVideo.current.webkitShowPlaybackTargetPicker();
    }
  };

  /** 音量处理 */
  const handleVolumeChange = (event) => {
    console.log(`volume:${event.target.value}`);
    refVideo.current.volume = event.target.value;
    setVolume(event.target.value);
    if (event.target.value === "0") {
      setMuted(true);
      refVideo.current.muted = true;
    } else {
      if (muted) {
        setMuted(false);
        refVideo.current.muted = false;
      }
    }
  };

  /** 静音处理 */
  const handleMuted = (event) => {
    refVideo.current.muted = !muted;
    setMuted((state) => !state);
    if (refVideo.current.muted) {
      setVolume(0.0);
    } else {
      setVolume(1.0);
    }
  };

  /** Play or pause 处理 */
  const handlePlayOrPause = (event) => {
    if (state === PLAYER_STATE_PAUSE) {
      tryPlaying(hasAudio);
    } else if (state === PLAYER_STATE_PLAYING) {
      refVideo.current.pause();
    } else {
      if (Hls.isSupported()) {
        refHls.current.startLoad();
      } else {
        nativePlay(true);
      }
    }
  };

  /** 全屏菜单处理 */
  const toggleFullscreenMenu = (event) => {
    refFsMenu.current.classList.toggle("show");
  };

  /** 处理用户点击播放列表 */
  const handlePlayUri = (playUri) => {
    console.log(`Screenfull play uri:${playUri}`);
    if (Hls.isSupported()) {
      setStreamUri(playUri);
    } else {
      setCheckMpd(playUri);
    }
  };

  /** 发送聊天消息 */
  const handleSendMessage = () => {
    if (message) {
      onSendMessage(message);
      setMessage("");
    }
  };

  console.log("HLSPlayer render!");
  return (
    <div ref={refVidContainer} className="video__container">
      <video
        ref={refVideo}
        width={dimensions.width}
        hieght={dimensions.height}
        controls={controls}
        crossOrigin="use-credentials"
        poster={poster}
        preload="auto"
        autoPlay
        playsInline
        {...videoProps}
      />
      {loading && (
        <div className="loader">
          <div />
          <div />
          <div />
        </div>
      )}
      <div ref={refControls} className="video__controls">
        <button id="playpause" onClick={handlePlayOrPause}>
          {state === PLAYER_STATE_PLAYING ? <FaPause /> : <FaPlay />}
        </button>
        {duration > 0 && (
          <div className="seeker">
            <progress
              id="progressbar"
              className="progressbar"
              max={100}
              defaultValue={seekval}
            ></progress>
            <input
              type="range"
              id="seekbar"
              value={seekval}
              className="seekbar"
              onChange={(e) => setSeekval(e.target.value)}
            />
          </div>
        )}
        {isFullScreen ? (
          <div className="chat__container">
            <input
              type="text"
              placeholder="说点什么？"
              onChange={(event) => setMessage(event.target.value.trim())}
              onKeyPress={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button id="chat" onClick={(e) => handleSendMessage()}>
              <FaTelegramPlane />
            </button>
          </div>
        ) : (
          <div className="chat__container" />
        )}
        {hasAudio && (
          <div className="volume__container">
            <button id="mute" onClick={handleMuted}>
              {muted ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <input
              type="range"
              id="volumebar"
              className="volumebar"
              value={volume}
              min={0}
              max={1.0}
              step={0.1}
              onChange={handleVolumeChange}
            />
          </div>
        )}
        {browser.pip && (
          <button id="picture-in-picture" onClick={handleTogglePip}>
            <FaExternalLinkAlt />
          </button>
        )}
        {browser.airplay && (
          <button id="airplay" onClick={handleAirplay}>
            <FaOsi />
          </button>
        )}
        <button id="fullscreen" onClick={handleToggleFullscreen}>
          {isFullScreen ? <FaExpandAlt /> : <FaExpand />}
        </button>
        <button
          ref={refFsMenuBut}
          id="menu-more"
          onClick={toggleFullscreenMenu}
        >
          <FaBars />
        </button>
      </div>
      <div ref={refFsMenu} className="sidedlg">
        {cameras && <CameraList camlist={cameras} onPlayUri={handlePlayUri} />}
        <Jabber messages={messages} />
      </div>
    </div>
  );
}

HLSPlayer.propTypes = {
  url: PropTypes.string.isRequired,
  controls: PropTypes.bool,
  autoplay: PropTypes.bool,
  hlsConfig: PropTypes.object, //https://github.com/dailymotion/hls.js/blob/master/API.md#fine-tuning
  poster: PropTypes.string,
  videoProps: PropTypes.object,
  cameras: PropTypes.object,
  messages: PropTypes.array,
  onRefreshCamlist: PropTypes.func,
  onSendMessage: PropTypes.func,
  onPlayChange: PropTypes.func
};

HLSPlayer.defaultProps = {
  url: "https://anylooker.com/live/51060300001310000308_master.m3u8",
  controls: false,
  autoplay: true,
  hlsConfig: {
    liveDurationInfinity: true,
    xhrSetup: function (xhr, url) {
      xhr.responseType = "text";
      xhr.withCredentials = true; // do send cookies
    },
    fetchSetup: function (context, initParams) {
      // Always send cookies, even for cross-origin calls.
      initParams.credentials = "include";
      return new Request(context.url, initParams);
    }
  },
  poster: "",
  videoProps: {},
  cameras: {},
  messages: [],
  onRefreshCamlist: () => {},
  onSendMessage: () => {},
  onPlayChange: () => {}
};
