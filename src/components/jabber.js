import React from "react";
import PropTypes from "prop-types";
import ScrollToBottom from "react-scroll-to-bottom";
import Avatar from "./avatar";
import ReactEmoji from "react-emoji";
import { parseFrom } from "./utils";
import "./jabber.css";
export default function Jabber(props) {
  const { messages } = props;
  return (
    <ScrollToBottom className="messagesContainer">
      {messages &&
        messages.map((message, index) => {
          let ufrom = parseFrom(message.from);
          return (
            <div key={index} className="jabberContainer">
              <Avatar
                image={
                  ufrom.avatar
                    ? `http://192.168.3.200/imgs/${ufrom.username}.${ufrom.avatar}`
                    : ""
                }
                name={ufrom.name}
                size={24}
                position="left"
              />
              <span className="title">
                {new Date(Number(message.ts)).toLocaleTimeString("en-US", {
                  hour12: false
                })}
              </span>
              <span className="title">{ufrom.name}</span>
              <span>{ReactEmoji.emojify(message.content)}</span>
            </div>
          );
        })}
    </ScrollToBottom>
  );
}

Jabber.propTypes = {
  messages: PropTypes.array.isRequired
};

Jabber.defaultProps = {
  messages: [
    {
      from: "系统消息:jpg@admin",
      text: "铴好的中华人民共和国",
      ts: Date.now()
    }
  ]
};
