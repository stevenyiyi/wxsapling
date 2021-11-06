import React from "react";
import Avatar from "./avatar";
import { FaTimes, FaCheck } from "react-icons/fa";
import "./common.css";
import "./user_list.css";
const UserItem = ({ user, sel, setSelectedUsers }) => {
  const [selected, setSelected] = React.useState(false);
  React.useEffect(() => {
    setSelected(sel);
  }, [sel]);
  const handleSelect = () => {
    if (selected) {
      setSelectedUsers((prevUsers) =>
        prevUsers.filter((prevUser) => prevUser !== user.username)
      );
    } else {
      setSelectedUsers((prevUsers) => [...prevUsers, user.username]);
    }
    setSelected((prevSelected) => !prevSelected);
  };

  return (
    <div className="user-item__wrapper" onClick={handleSelect}>
      <div className="user-item__name-wrapper">
        <Avatar
          image={user.image}
          name={user.nick_name || user.username}
          size={32}
        />
        <p className="user-item__name">{user.nick_name || user.username}</p>
      </div>
      {user.online ? (
        <div className="user-item__state-online" />
      ) : (
        <div className="user-item__state-offline" />
      )}
      <div className="user-item__invite-empty">{selected && <FaCheck />}</div>
    </div>
  );
};

export default function UserList({
  users,
  show,
  onHide,
  selectedUsers,
  setSelectedUsers
}) {
  const refSelf = React.useRef();
  const handleClose = (event) => {
    event.preventDefault();
    onHide();
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      let sels = [];
      users.forEach((element) => {
        sels.push(element.username);
      });
      setSelectedUsers(sels);
    } else {
      setSelectedUsers([]);
    }
  };

  React.useEffect(() => {
    if (show) {
      refSelf.current.style.display = "block";
    } else {
      refSelf.current.style.display = "none";
    }
  }, [show]);

  const genCheckUsers = () => {
    let selected =
      users && users.length === selectedUsers.length ? true : false;
    return React.createElement("input", {
      type: "checkbox",
      id: "chk-user-list-all",
      name: "chk-user-list-all",
      defaultChecked: { selected },
      onChange: toggleSelectAll
    });
  };

  return (
    <div ref={refSelf} className="sidenav">
      <div className="navbar">
        <label htmlFor="chk-user-list-all" className="switch">
          {genCheckUsers()}
          <span className="slider round"></span>
        </label>
        <button className="circle_btn" onClick={handleClose}>
          <FaTimes />
        </button>
      </div>
      <div className="user-list__container">
        {users &&
          users.map((user, i) => (
            <UserItem
              index={i}
              key={user.username}
              user={user}
              sel={selectedUsers.includes(user.username) ? true : false}
              setSelectedUsers={setSelectedUsers}
            />
          ))}
      </div>
    </div>
  );
}
