import React from "react";
import Messages from "./messages/messages";
import InfoBar from "./info_bar";
import Input from "./input";
import http from "../http_common";
import config from "../config";
import { tlv_serialize_object, tlv_unserialize_object } from "./tlv";
import Websocket from "./websocket";
import { UserContext } from "../user_context";
import { useSnackbar } from "./use_snackbar";
import "./chat.css";

const ENDPOINT = config.wssGroupChatUrl;

function users_reducer(users, action) {
  switch (action.type) {
    case "set":
      return action.users;
    case "online_users": {
      const cusers = [...users];
      action.uids.forEach((uid) => {
        cusers.forEach((user) => {
          if (user.username === uid) {
            user.online = true;
          }
        });
      });
      return cusers;
    }
    case "on_state_change": {
      const cusers = [...users];
      cusers.forEach((user) => {
        if (user.username === action.change.username) {
          user.online = action.change.state;
        }
      });
      return cusers;
    }
    case "reset": {
      const cusers = [...users];
      cusers.forEach((user) => (user.online = false));
      return cusers;
    }
    default:
      throw new Error("Unexpected action");
  }
}
const Chat = (props) => {
  const userCtx = React.useContext(UserContext);
  const username = userCtx.user.username;
  const ws = React.useRef(null);
  const [classes, setClasses] = React.useState(null);
  const [my, setMy] = React.useState(null);
  const [users, dispatch] = React.useReducer(users_reducer, []);
  const [messages, setMessages] = React.useState([]);
  const [unreadMessages, setUnreadMessages] = React.useState(0);
  const [wsState, setWsState] = React.useState(WebSocket.CONNECTING);
  const openSnackbar = React.useRef(useSnackbar()[0]);
  const ws_onopen = (e) => {
    console.log("websocket onopen,event:", e);
    setWsState(ws.current.readyState);
  };

  const ws_onclose = (e) => {
    console.log(`websocket onclose code:${e.code}`);
    setWsState(ws.current.readyState);
    dispatch({ type: "reset" });
    if (e.code === 4001) {
      openSnackbar.current(
        "我们检测到您的帐户已经在另一个设备上登录，请退出另外的设备再试!"
      );
    } else if (e.code === 4002) {
      openSnackbar.current(`帐户:${username} 不存在!`);
    } else if (e.code === 4003) {
      openSnackbar.current("参数错误!");
    }
  };

  const ws_onerror = (e) => {
    console.log("websocket onerror:", e);
    setWsState(ws.current.readyState);
  };

  const ws_onmessage = (data) => {
    const wsmsg = tlv_unserialize_object(data);
    for (const [key, value] of Object.entries(wsmsg)) {
      if (key === "on_message") {
        console.log(value);
        setMessages([...messages, value]);
      } else if (key === "online_users") {
        console.log(value);
        dispatch({ type: "online_users", uids: value });
      } else if (key === "on_state_change") {
        console.log(value);
        if (value.length > 0) {
          dispatch({
            type: "on_state_change",
            change: value[0]
          });
        }
      } else if (key === "unread_message_number") {
        setUnreadMessages(value);
      } else {
        console.log(`Unknown ws onmessage method:${key}`);
      }
    }
  };

  React.useEffect(() => {
    if (username) {
      /// Get class room information(classes/members/self)
      http
        .get("/sapling/get_class_chat_info")
        .then((response) => {
          if (response.data.result === 0) {
            /// Members
            const members = response.data.members.map((user) => {
              user.online = false;
              return user;
            });
            dispatch({ type: "set", users: members });
            /// Classes
            setClasses(response.data.classes);
            /// Self infomation
            setMy(response.data.self);
          } else {
            console.log(`Server response error:${response.data.result}`);
          }
        })
        .catch((e) => console.log(e.toJSON().message));
    }
  }, [username]);

  const handleGetRemainMessages = (event) => {
    if (unreadMessages === 0) return;
    /// 获取未读的消息
    let message = {
      to: "server",
      from: my.username,
      type: "text",
      content: "get_unread_messages"
    };

    /// Send to websocket server
    let binMsg = tlv_serialize_object(message);
    ws.current.sendMessage(binMsg, (result) => {
      if (result !== 0) {
        console.log("send get_unread_messages error!");
      } else {
        setUnreadMessages((prev) => (prev < 10 ? 0 : prev - 10));
      }
    });
  };

  const sendMessage = (message, callback) => {
    if (message) {
      if (message.to.length > 0) {
        if (my.role === 2 && message.to.length === users.length) {
          message.to = "all";
        } else {
          message.to = message.to.join();
        }
        /// Send to websocket server
        let binMsg = tlv_serialize_object(message);
        ws.current.sendMessage(binMsg, callback);
      } else {
        callback(0);
      }
      /// Reset message to display
      message.to = my.username;
      setMessages([...messages, message]);
    }
  };
  console.log("chat render!");
  return (
    <div className="chat_outer_container">
      {username && (
        <Websocket
          ref={ws}
          url={`${ENDPOINT}?username=${username}`}
          onOpen={ws_onopen}
          onMessage={ws_onmessage}
          onClose={ws_onclose}
          onError={ws_onerror}
          reconnect={true}
          debug={true}
          protocol="chat"
        />
      )}
      {classes && my && (
        <div className="chat_container">
          <InfoBar
            classes={classes}
            state={wsState}
            unReadMessages={unreadMessages}
            handleNotifications={handleGetRemainMessages}
          />
          <Messages messages={messages} name={my.nick_name} />
          <Input users={users} my={my} sendMessage={sendMessage} />
        </div>
      )}
    </div>
  );
};

export default Chat;
