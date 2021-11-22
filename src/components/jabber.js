import React from "react";
import PropTypes from "prop-types";
import ScrollToBottom from "react-scroll-to-bottom";
import Avatar from "./avatar";
import ReactEmoji from "react-emoji";
import "./jabber.css";
export default function Jabber(props) {
  const { messages } = props;
  return (
    <ScrollToBottom className="messages">
      {messages &&
        messages.map((message, index) => (
          <div key={index} className="jabberContainer">
            <Avatar
              image={message.photo ? `/imgs/${message.photo}` : ""}
              name={message.from}
              size={24}
              position="left"
            />
            <span className="title">
              {new Date(message.ts).toLocaleTimeString("en-US", {
                hour12: false
              })}
            </span>
            <span className="title">{message.from}</span>
            <span>{ReactEmoji.emojify(message.text)}</span>
          </div>
        ))}
    </ScrollToBottom>
  );
}

Jabber.propTypes = {
  messages: PropTypes.array.isRequired
};

Jabber.defaultProps = {
  messages: [{ from: "成怡", text: "铴好的中华人民共和国", ts: Date.now() }]
};
