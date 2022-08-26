import React from "react";
import UserList from "./user_list";
import PropTypes from "prop-types";
import {
  FaTelegramPlane,
  FaUsers,
  FaPaperclip,
  FaSpinner
} from "react-icons/fa";
import "./input.css";

const Input = (props) => {
  const { users, my, sendMessage } = props;
  const [showUserList, setShowUserList] = React.useState(false);
  const [sendUsers, setSendUsers] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  // Create a reference to the hidden file input element
  const hiddenFileInput = React.useRef(null);

  React.useEffect(() => {
    const susers = users.map((user) => user.username);
    setSendUsers(susers);
  }, [users]);

  const handleShowUserList = (event) => {
    event.preventDefault();
    setShowUserList(!showUserList);
  };

  // Programatically click the hidden file input element
  // when the Button component is clicked
  const handleFileUploadClick = (event) => {
    event.preventDefault();
    hiddenFileInput.current.click();
  };

  const realSendMessage = (msg) => {
    setSending(true);
    sendMessage(msg)
      .then(() => {
        setSending(false);
        setMessage("");
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const handleFileChange = (event) => {
    let file = event.target.files[0];
    console.log(`File name:${file.name} size:${file.size} type:${file.type}`);
    let reader = new FileReader();
    reader.onload = (e) => {
      let msg = {};
      msg.to = sendUsers;
      msg.from = my.nick_name + ":" + my.photo + "@" + my.username;
      msg.type = file.type;
      msg.filename = file.name;
      msg.content = e.target.result;
      msg.ts = Date.now();
      realSendMessage(msg);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSendMessage = () => {
    if (message) {
      console.log(sendUsers);
      let msg = {};
      msg.to = sendUsers;
      msg.from = my.nick_name + ":" + my.photo + "@" + my.username;
      msg.type = "text";
      msg.content = message;
      msg.ts = Date.now();
      realSendMessage(msg);
    }
  };

  return (
    <form className="input__form__container">
      <input
        type="text"
        value={message}
        placeholder="输入消息"
        onChange={(event) => setMessage(event.target.value)}
        onKeyPress={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSendMessage();
          }
        }}
      />
      <button
        id="but-select-users"
        className="image-button"
        onClick={handleShowUserList}
      >
        <FaUsers size={24} />
      </button>

      <button
        id="file-select-message-button"
        className="image-button"
        onClick={handleFileUploadClick}
      >
        <FaPaperclip size={24} />
      </button>
      <input
        ref={hiddenFileInput}
        id="file-select-message-input"
        type="file"
        onChange={handleFileChange}
        hidden
      />

      <button
        id="but-send-message"
        className="image-button"
        onClick={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        disabled={sending ? true : false}
      >
        {sending ? (
          <FaSpinner size={24} className="spinner" />
        ) : (
          <FaTelegramPlane size={24} />
        )}
      </button>
      <UserList
        users={users}
        show={showUserList}
        onHide={() => setShowUserList(false)}
        selectedUsers={sendUsers}
        setSelectedUsers={setSendUsers}
      />
    </form>
  );
};
Input.propTypes = {
  users: PropTypes.array.isRequired,
  my: PropTypes.object.isRequired
};

Input.defaultProps = {
  users: [],
  my: {}
};

export default Input;
