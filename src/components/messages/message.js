import React from "react";
import "./message.css";
import ReactEmoji from "react-emoji";
import Avatar from "../avatar";
import { FaDownload } from "react-icons/fa";
import PropTypes from "prop-types";

const Message = (props) => {
  const { to, from, type, content, ts, filename } = props;
  let isSentByCurrentUser = false;

  if (from === to) {
    isSentByCurrentUser = true;
  }

  const genMessageContent = (type, content, filename) => {
    if (type.startsWith("text")) {
      return <p>{ReactEmoji.emojify(content)}</p>;
    } else if (type.startsWith("image")) {
      let fb = new Blob([content], { type: type, name: filename });
      let imgUrl = (window.URL || window.webkitURL).createObjectURL(fb);
      return (
        <div className="messageContainer--image">
          <img src={imgUrl} alt="assets" />
        </div>
      );
    } else if (type.startsWith("video") || type.startsWith("audio")) {
      let fb = new Blob([content], { type: type, name: filename });
      let avUrl = (window.URL || window.webkitURL).createObjectURL(fb);
      return (
        <div className="messageContainer--video">
          <video autoPlay muted controls>
            <source src={avUrl} type={type} />
            您的浏览器不支持HTML5视频播放.
          </video>
        </div>
      );
    } else {
      let fb = new Blob([content], { type: type, name: filename });
      let fileUrl = (window.URL || window.webkitURL).createObjectURL(fb);
      return (
        <p>
          <a href={fileUrl} download>
            <FaDownload />
            <span>{filename}</span>
          </a>
        </p>
      );
    }
  };

  return isSentByCurrentUser ? (
    <div className="messageContainer">
      <Avatar name={from} size={48} position="left" />
      {genMessageContent(type, content, filename)}
      <span className="time-right">{`${from}  ${new Date(
        ts
      ).toLocaleString()}`}</span>
    </div>
  ) : (
    <div className="messageContainer darker">
      <Avatar name={from} size={48} position="right" />
      {genMessageContent(type, content, filename)}
      <span className="time-left">{`${from}  ${new Date(
        Number(ts)
      ).toLocaleString()}`}</span>
    </div>
  );
};

Message.propTypes = {
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  content: PropTypes.string || PropTypes.object,
  ts: PropTypes.number.isRequired
};

Message.defaultProps = {
  from: "成怡",
  to: "成怡",
  type: "text",
  content: "今天还好吗?",
  ts: Date.now()
};

export default Message;
