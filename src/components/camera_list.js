import React from "react";
import { FaVideo, FaVideoSlash, FaServer } from "react-icons/fa";
import "./camera_list.css";
export default function CameraList(props) {
  return (
    <div className="container">
      <div className="camera_container">
        <FaVideo className="icon" />
        <p>中一班</p>
      </div>
      <div className="camera_container">
        <FaVideo className="icon" />
        <p>中二班</p>
      </div>
      <div className="camera_container">
        <FaVideo className="icon" />
        <p>中三班</p>
      </div>
      <div className="camera_container">
        <FaVideo className="icon" />
        <p>中四班</p>
      </div>
      <div className="camera_container">
        <FaVideo className="icon" />
        <p>大一班</p>
      </div>
      <div className="camera_container">
        <FaVideo className="icon" />
        <p>大二班</p>
      </div>
      <div className="camera_container">
        <FaVideo className="icon" />
        <p>中一班</p>
      </div>
    </div>
  );
}
