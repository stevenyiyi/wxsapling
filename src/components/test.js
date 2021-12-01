import React from "react";
import "./test.css";
export default function Test(props) {
  return (
    <div className="container">
      <div className="player">
        <div className="video__container">
          <video
            id="myvideo"
            controls={true}
            autoPlay={true}
            poster="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3/poster-img.jpg"
            preload="metadata"
          >
            <source src="https://d.pr/f/On5R8M+" type="video/webM" />
            <p>Your browser does not support the HTML5 Video Element</p>
          </video>
        </div>
      </div>
      <div className="content__container">fdasadsfasdfafsadfasfa</div>
    </div>
  );
}
