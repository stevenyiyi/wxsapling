import React from "react";
import ReactEmoji from "react-emoji";
import Avatar from "../avatar";
import { FaDownload } from "react-icons/fa";
import PropTypes from "prop-types";
import { parseFrom } from "../utils";
import config from "../../config";
import { UserContext } from "../../user_context";
import useClassUsers from "./../use_class_users";
import "./message.css";

const Message = (props) => {
  const { getNickName } = useClassUsers();
  const { to, from, type, content, ts, filename, history } = props;
  const username = React.useContext(UserContext).user.username;
  const ufrom = parseFrom(from);
  const refSrcBlobUrl = React.useRef();
  React.useEffect(() => {
    console.log("Message useEffect!");
    var blobUrl;
    if (!type.startsWith("text")) {
      let fb = new Blob([content], { type: type, name: filename });
      blobUrl = (window.URL || window.webkitURL).createObjectURL(fb);
      console.log(refSrcBlobUrl.current.tagName);
      if (refSrcBlobUrl.current.tagName === "A") {
        refSrcBlobUrl.current.setAttribute("href", blobUrl);
      } else {
        refSrcBlobUrl.current.setAttribute("src", blobUrl);
      }
    }
    return () => {
      console.log("Message useEffect destruct!");
      URL.revokeObjectURL(blobUrl);
    };
  }, [type, content, filename]);

  const genMessageContent = (type, content, filename) => {
    if (type.startsWith("text")) {
      return <p>{ReactEmoji.emojify(content)}</p>;
    } else if (type.startsWith("image")) {
      return (
        <div className="messageContainer--image">
          <img ref={refSrcBlobUrl} src="" alt="assets" />
        </div>
      );
    } else if (type.startsWith("video") || type.startsWith("audio")) {
      return (
        <div className="messageContainer--video">
          <video autoPlay muted controls>
            <source ref={refSrcBlobUrl} src="" type={type} />
            您的浏览器不支持HTML5视频播放.
          </video>
        </div>
      );
    } else {
      return (
        <p>
          <a ref={refSrcBlobUrl} href=" " download>
            <FaDownload />
            <span>{filename}</span>
          </a>
        </p>
      );
    }
  };

  const getToNames = () => {
    let names = "";
    if (to === "all") {
      names = "所有人";
    } else {
      let touser = to.split(",");
      for (const toid of touser) {
        if (names) {
          names += ",";
        }
        names += getNickName(toid);
      }
    }
    return names;
  };

  return ufrom.username === username ? (
    <div
      className={
        history ? "messageContainer history" : "messageContainer justifyStart"
      }
    >
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
      <p className="title">{`发送至：${getToNames()}`}</p>
      {genMessageContent(type, content, filename)}
      <span className="time-right">{`${ufrom.name}  ${new Date(
        ts
      ).toLocaleString()}`}</span>
    </div>
  ) : (
    <div
      className={
        history ? "messageContainer history" : "messageContainer darker"
      }
    >
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
