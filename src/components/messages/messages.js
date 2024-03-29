import React from "react";

import ScrollToBottom from "react-scroll-to-bottom";

import Message from "./message";

import "./messages.css";

export default function Messages(props) {
  const { messages } = props;
  return (
    <div className="messages-container">
      <ScrollToBottom className="messages">
        {messages &&
          messages.map((message, i) => (
            <div key={i}>
              <Message
                to={message.to}
                from={message.from}
                type={message.type}
                content={message.content}
                ts={message.ts}
                filename={message.filename}
                history={message.history}
              />
            </div>
          ))}
      </ScrollToBottom>
    </div>
  );
}
