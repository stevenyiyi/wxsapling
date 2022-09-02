import React from "react";
function users_reducer(users, action) {
  switch (action.type) {
    case "set": {
      return action.users;
    }
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
const ClassUsersContext = React.createContext(null);
export function ClassUsersProvider({ children }) {
  const [users, dispatch] = React.useReducer(users_reducer, []);
  const setUsers = React.useCallback(
    (nuers) => dispatch({ type: "set", users: nuers }),
    []
  );
  const setOnlineUsers = (uids) =>
    dispatch({ type: "online_users", uids: uids });
  const onStateChange = (change) =>
    dispatch({ type: "on_state_change", change: change });
  const resetUsers = () => dispatch({ type: "reset" });
  const getNickName = (uid) => {
    let name = "";
    for (const user of users) {
      if (user.username === uid) {
        name = user.nick_name;
        break;
      }
    }
    return name;
  };
  return (
    <ClassUsersContext.Provider
      value={{
        users,
        setUsers,
        setOnlineUsers,
        onStateChange,
        resetUsers,
        getNickName
      }}
    >
      {children}
    </ClassUsersContext.Provider>
  );
}

export default function useClassUsers() {
  return React.useContext(ClassUsersContext);
}
