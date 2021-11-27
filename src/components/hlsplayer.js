import Hls from "hls.js";
import React from "react";
import PropTypes from "prop-types";
import browser from "../utils/browser";
import is from "../utils/is";
import {
  FaPlay,
  FaPause,
  FaExpand,
  FaExpandAlt,
  FaVolumeUp,
  FaVolumeMute,
  FaExternalLinkAlt,
  FaBars
} from "react-icons/fa";
import "./normalize.css";
import "./hlsplayer.css";

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

// Determine if native supported
function is_native_fullscreen() {
  return !!(
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullscreenEnabled
  );
}

/**
 * [fn.is_fullscreen] 检测是否全屏状态
 */
function is_fullscreen() {
  return !!(
    document.fullscreenElement ||
    document.msFullscreenElement ||
    document.mozFullScreenElement ||
    document.webkitFullscreenElement
  );
}

/** Not fullscreen api supported */
function toggle_fullscreen_fallback(toggle = false) {
  // Store or restore scroll position
  let scrollPosition = { x: 0, y: 0 };
  if (toggle) {
    scrollPosition = {
      x: window.scrollX || 0,
      y: window.scrollY || 0
    };
  } else {
    window.scrollTo(scrollPosition.x, scrollPosition.y);
  }

  // Toggle scroll
  document.body.style.overflow = toggle ? "hidden" : "";

  // Toggle class hook
  toggleClass(
    this.target,
    this.player.config.classNames.fullscreen.fallback,
    toggle
  );

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
      this.cleanupViewport = !hasProperty;

      if (!hasProperty) {
        viewport.content += `,${property}`;
      }
    } else if (this.cleanupViewport) {
      viewport.content = viewport.content
        .split(",")
        .filter((part) => part.trim() !== property)
        .join(",");
    }
  }
}

export default function HLSPlayer(props) {
  const {
    url,
    controls,
    autoplay,
    hlsConfig,
    onError,
    onSuccess,
    width,
    height,
    poster,
    refreshId,
    videoProps
  } = props;
  const [seekval, setSeekval] = React.useState(0);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1.0);
  const [playOrPause, setPlayOrPause] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const refVidContainer = React.useRef();
  const refHls = React.useRef();
  const refVideo = React.useRef();

  React.useEffect(() => {
    const createMsePlayer = () => {
      let ohls = new Hls(hlsConfig);
      refHls.current = ohls;
      refHls.current.loadSource(url);
      refHls.current.attachMedia(refVideo.current);
      refHls.current.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoplay) {
          var playPromise = refVideo.current.play();
          if (playPromise) {
            playPromise.catch(function (error) {
              if (error.name === "NotAllowedError") {
                refVideo.current.muted = true;
                refVideo.current.play();
              }
            });
          }
          setPlayOrPause(true);
          console.log(`duration:${refVideo.current.duration}`);
          onSuccess && onSuccess(url);
        }
      });
      refHls.current.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            console.log("media error encountered, try to recover");
            refHls.current.recoverMediaError();
          } else {
            console.log("Error,type:" + data.type + " details:" + data.details);
            refHls.current.stopLoad();
            refHls.current.detachMedia();
            refHls.current.destroy();
            refHls.current = null;
            setPlayOrPause(true);
            onError && onError(data);
          }
        }
      });
    };
    const createHlsPlayer = () => {
      // hls.js is not supported on platforms that do not have Media Source Extensions (MSE) enabled.
      // When the browser has built-in HLS support (check using `canPlayType`), we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video element through the `src` property.
      // This is using the built-in support of the plain video element, without using hls.js.
      // Note: it would be more normal to wait on the 'canplay' event below however on Safari (where you are most likely to find built-in HLS support) the video.src URL must be on the user-driven
      // white-list before a 'canplay' event will be emitted; the last video event that can be reliably listened-for when the URL is not on the white-list is 'loadedmetadata'.
      console.log("Browser not support mse, but can play m3u8!");
      refVideo.current.src = url;
      refVideo.current.load();
      refVideo.current.addEventListener("canplaythrough", () => {
        if (autoplay) {
          refVideo.current.play();
        }
      });
      refVideo.current.addEventListener("play", () => {
        onSuccess && onSuccess(url);
        setPlayOrPause(true);
      });
      refVideo.current.addEventListener(
        "error",
        () => {
          let err = refVideo.current.error;
          refVideo.current.pause();
          refVideo.current.src = "";
          refVideo.current.removeAttribute("src"); // empty source
          refVideo.current.load();
          setPlayOrPause(false);
          onError && onError(err);
        },
        true
      );
    };
    console.log(
      `HLSPlayer useEffect,url:${url},refreshid:${refreshId},hls:${refHls.current},video:${refVideo.current}`
    );
    if (Hls.isSupported()) {
      if (refHls.current) {
        console.log("Destory hls!");
        refHls.current.stopLoad();
        refHls.current.detachMedia();
        refHls.current.destroy();
        refHls.current = null;
        setPlayOrPause(false);
      }
      if (url) {
        createMsePlayer();
      }
    } else if (refVideo.current.canPlayType("application/vnd.apple.mpegurl")) {
      refVideo.current.pause();
      refVideo.current.src = ""; // empty source
      refVideo.current.removeAttribute("src");
      refVideo.current.load();
      setPlayOrPause(false);
      if (url) {
        createHlsPlayer();
      }
    } else {
      let err = new MediaError();
      err.code = MediaError.MEDIA_ERR_DECODE;
      err.message =
        "浏览器太老了,请下载一款支持MediaSourceExtension功能的浏览器!";
      onError && onError(err);
    }

    if (refVideo.current) {
      setMuted(refVideo.current.muted);
      setVolume(refVideo.current.volume);
      /** 订阅文件播放完成事件 */
      refVideo.current.addEventListener("ended", (event) => {
        refVideo.current.pause();
        refVideo.current.currentTime = 0;
        setPlayOrPause(false);
      });
    }

    if (refVidContainer.current) {
      let prefix = get_fullscreen_prefix();
      let eventName =
        prefix === "ms" ? "MSFullscreenChange" : `${prefix}fullscreenchange`;

      /** 订阅全屏进入/退出事件 */
      document.addEventListener(eventName, (event) => {
        // document.fullscreenElement will point to the element that
        // is in fullscreen mode if there is one. If not, the value
        // of the property is null.
        if (is_fullscreen()) {
          console.log("entered fullscreen mode.");
          setIsFullScreen(true);
        } else {
          console.log("Leaving full-screen mode.");
          setIsFullScreen(false);
        }
      });
    }
    return () => {
      if (refHls.current) {
        console.log("Destory hls!");
        refHls.current.stopLoad();
        refHls.current.detachMedia();
        refHls.current.destroy();
        refHls.current = null;
        setPlayOrPause(false);
      }
    };
  }, [hlsConfig, url, autoplay, refreshId, onError, onSuccess]);

  /** Fullscreen API:
      https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
  */
  const enterFullscreen = () => {
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
  };

  const exitFullscreen = () => {
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
  };

  /** Player Controls event handle */
  /** 全屏处理 */
  const handleToggleFullscreen = (event) => {
    if (isFullScreen) {
      exitFullscreen();
    } else {
      enterFullscreen(refVidContainer.current);
    }
  };

  /** 画中画处理 */
  const handleTogglePip = (event) => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      if (document.pictureInPictureEnabled) {
        refVideo.current.requestPictureInPicture();
      }
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
    if (refVideo.current.paused) {
      refVideo.current.play();
      setPlayOrPause(true);
    } else {
      refVideo.current.pause();
      setPlayOrPause(false);
    }
  };

  console.log("HLSPlayer render!");
  return (
    <div ref={refVidContainer} className="video__container">
      <video
        ref={refVideo}
        width={width}
        hieght={height}
        controls={controls}
        crossOrigin="use-credentials"
        poster={poster}
        preload="auto"
        autoPlay
        webkit-playsinline="true"
        playsInline
        x5-video-player-type="h5-page"
        x-webkit-airplay="allow"
        {...videoProps}
      />
      <div className="video__controls">
        <button id="playpause" onClick={handlePlayOrPause}>
          {playOrPause ? <FaPause /> : <FaPlay />}
        </button>
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
        <button id="picture-in-picture" onClick={handleTogglePip}>
          <FaExternalLinkAlt />
        </button>
        <button id="fullscreen" onClick={handleToggleFullscreen}>
          {isFullScreen ? <FaExpandAlt /> : <FaExpand />}
        </button>
        <button id="menu-more">
          <FaBars />
        </button>
      </div>
    </div>
  );
}

HLSPlayer.propTypes = {
  url: PropTypes.string.isRequired,
  controls: PropTypes.bool,
  autoplay: PropTypes.bool,
  hlsConfig: PropTypes.object, //https://github.com/dailymotion/hls.js/blob/master/API.md#fine-tuning
  width: PropTypes.number,
  height: PropTypes.number,
  poster: PropTypes.string,
  videoProps: PropTypes.object,
  onError: PropTypes.func,
  onSuccess: PropTypes.func,
  refreshId: PropTypes.number
};

HLSPlayer.defaultProps = {
  url: "https://anylooker.com/live/51060300001310000006_master.m3u8",
  controls: false,
  autoplay: true,
  hlsConfig: {},
  width: 888,
  height: 500,
  poster: "",
  videoProps: {},
  onError: (data) => {
    return;
  },
  onSuccess: (url) => {
    return;
  },
  refreshId: 0
};
