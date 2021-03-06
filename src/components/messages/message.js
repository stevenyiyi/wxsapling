import React from "react";
import ReactEmoji from "react-emoji";
import Avatar from "../avatar";
import { FaDownload } from "react-icons/fa";
import PropTypes from "prop-types";
import { parseFrom } from "../utils";
import config from "../../config";
import "./message.css";

const Message = (props) => {
  const { to, from, type, content, ts, filename } = props;
  let isSentByCurrentUser = false;
  let ufrom = parseFrom(from);
  if (ufrom.username === to) {
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
          <img
            src={imgUrl}
            onLoad={() =>
              (window.URL || window.webkitURL).revokeObjectURL(imgUrl)
            }
            alt="assets"
          />
        </div>
      );
    } else if (type.startsWith("video") || type.startsWith("audio")) {
      let fb = new Blob([content], { type: type, name: filename });
      let avUrl = (window.URL || window.webkitURL).createObjectURL(fb);
      return (
        <div className="messageContainer--video">
          <video autoPlay muted controls>
            <source
              src={avUrl}
              onLoad={() =>
                (window.URL || window.webkitURL).revokeObjectURL(avUrl)
              }
              type={type}
            />
            您的浏览器不支持HTML5视频播放.
          </video>
        </div>
      );
    } else {
      let fb = new Blob([content], { type: type, name: filename });
      let fileUrl = (window.URL || window.webkitURL).createObjectURL(fb);
      return (
        <p>
          <a
            href={fileUrl}
            download
            onClick={() => {
              setTimeout(() => {
                (window.URL || window.webkitURL).revokeObjectURL(fileUrl);
              }, 150);
            }}
          >
            <FaDownload />
            <span>{filename}</span>
          </a>
        </p>
      );
    }
  };

  return isSentByCurrentUser ? (
    <div className="messageContainer justifyStart">
      <Avatar
        image={
          ufrom.avatar
            ? `${config.resBaseUrl}/imgs/${ufrom.username}.${ufrom.avatar}`
            : ""
        }
        name={ufrom.name}
        size={48}
        position="left"
      />
      {genMessageContent(type, content, filename)}
      <span className="time-right">{`${ufrom.name}  ${new Date(
        ts
      ).toLocaleString()}`}</span>
    </div>
  ) : (
    <div className="messageContainer darker">
      <Avatar
        image={
          ufrom.avatar
            ? `${config.resBaseUrl}/imgs/${ufrom.username}.${ufrom.avatar}`
            : ""
        }
        name={ufrom.name}
        size={48}
        position="right"
      />
      {genMessageContent(type, content, filename)}
      <span className="time-left">{`${ufrom.name}  ${new Date(
        Number(ts)
      ).toLocaleString()}`}</span>
    </div>
  );
};

Message.propTypes = {
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  content: PropTypes.any,
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
