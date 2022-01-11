import React from "react";
import "./test.css";
import "./barrage.css";
export default function Test(props) {
  return (
    <div className="container">
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
        <div>
          <div className="track track-1">
            <span>柱子，你他娘了怎么不省点炮弹!</span>
          </div>
          <div className="track track-2">
            来，把老子的意大利炮抬上来，给柱子点个烟
          </div>
          <div className="track track-3">小的们，吃唐僧肉啦</div>
        </div>
      </div>
    </div>
  );
}
