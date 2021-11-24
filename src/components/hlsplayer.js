import Hls from "hls.js";
import React from "react";
import PropTypes from "prop-types";

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
      });
      refVideo.current.addEventListener(
        "error",
        () => {
          let err = refVideo.current.error;
          refVideo.current.pause();
          refVideo.current.src = "";
          refVideo.current.removeAttribute("src"); // empty source
          refVideo.current.load();
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
      }
      if (url) {
        createMsePlayer();
      }
    } else if (refVideo.current.canPlayType("application/vnd.apple.mpegurl")) {
      refVideo.current.pause();
      refVideo.current.src = ""; // empty source
      refVideo.current.removeAttribute("src");
      refVideo.current.load();
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
    return () => {
      if (refHls.current) {
        console.log("Destory hls!");
        refHls.current.stopLoad();
        refHls.current.detachMedia();
        refHls.current.destroy();
        refHls.current = null;
      }
    };
  }, [hlsConfig, url, autoplay, refreshId, onError, onSuccess]);
  console.log("HLSPlayer render!");
  return (
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
  url: "",
  controls: true,
  autoplay: false,
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
