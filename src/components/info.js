import React from "react";
import browser from "../utils/browser";
import { useOutsideClick } from "../utils/hook";
import "./info.css";
export default function Info(props) {
  const { open, onOutsideClick } = props;
  const refSelf = React.useRef();
  useOutsideClick(refSelf, onOutsideClick);
  React.useEffect(() => {
    if (open) refSelf.current.style.display = "flex";
    else refSelf.current.style.display = "none";
  }, [open]);
  return (
    <div>
      <div ref={refSelf} className="sideinfo">
        <p>{`浏览器：${window.navigator.userAgent}`}</p>
        <p>{`MSE支持：${browser.supportsMediaSource}`}</p>
        <p>{`原生全屏API支持：${browser.supportsNativeFullscreen}`}</p>
        <p>{`ShadowDOM支持：${browser.supportsShadowDOM}`}</p>
        <p>{`WebAssembly支持：${browser.supportsWASM}`}</p>
        <p>{`画中画播放支持：${browser.pip}`}</p>
        <p>{`AirPlay播放支持：${browser.airplay}`}</p>
        <p>{`X5内核：${browser.isX5}`}</p>
      </div>
    </div>
  );
}
