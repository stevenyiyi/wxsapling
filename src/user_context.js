import React from "react";
export const UserContext = React.createContext({
  user: null,
  useNavbar: false,
  update: (user, f) => {}
});
