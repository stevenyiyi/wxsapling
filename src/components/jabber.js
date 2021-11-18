import React from "react";
import PropTypes from "prop-types";
import ScrollToBottom from "react-scroll-to-bottom";
import Avatar from "./avatar";
import ReactEmoji from "react-emoji";
import "./messages/messages.css";
import "./jabber.css";
export default function Jabber(props) {
  const { messages } = props;
  return (
    <ScrollToBottom>
      {messages &&
        messages.map((message, index) => (
          <div key={index}>
            <div className="jabberContainer">
              <Avatar name={message.from} size={24} position="left" />
              <span>{ReactEmoji.emojify(message.text)}</span>
            </div>
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
