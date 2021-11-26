import React from "react";
import {
  FaPlay,
  FaPause,
  FaExpand,
  FaExpandAlt,
  FaVolumeUp,
  FaVolumeOff,
  FaVolumeMute,
  FaVolumeDown,
  FaBars
} from "react-icons/fa";
import "./normalize.css";
import "./hlsplayer.css";
export default function Test(props) {
  const [seekval, setSeekval] = React.useState(0);
  const [volume, setVolume] = React.useState(1.0);
  const refToggle = React.useRef();
  const handleClick = (event) => {
    refToggle.current.classList.toggle("activeNav");
  };
  return (
    <div className="flexbox-parent">
      <div className="video__container">
        <video
          id="myvideo"
          poster="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3/poster-img.jpg"
          preload="metadata"
        >
          <source src="https://d.pr/f/On5R8M+" type="video/webM" />
          <p>Your browser does not support the HTML5 Video Element</p>
        </video>

        <div className="video__controls">
          <button id="playpause">
            <FaPlay />
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
            <button id="mute">
              <FaVolumeUp />
            </button>
            <input
              type="range"
              id="volumebar"
              className="volumebar"
              value={volume}
              min={0}
              max={1.0}
              step={0.1}
              onChange={(e) => setVolume(e.target.value)}
            />
          </div>
          <button id="fullscreen">
            <FaExpand />
          </button>
          <button id="menu-more">
            <FaBars />
          </button>
        </div>
      </div>
    </div>
  );
}
