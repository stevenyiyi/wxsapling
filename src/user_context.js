import React from "react";
import Cookies from "js-cookie";
import http from "./http_common";
const path = "/sapling/login";
export const userCookie = {
  username: Cookies.get("username"),
  token: Cookies.get("token"),
  role: Cookies.get("role"),
  is_login: (async () => {
    if (!Cookies.get("username")) {
      return false;
    }
    let has_login = false;
    let qparams = { ts: Date.now() };
    qparams.username = Cookies.get("username");
    qparams.token = Cookies.get("token");
    await http
      .get(path, { params: qparams })
      .then((response) => {
        let result = response.data.result;
        if (result === 0) {
          has_login = true;
        } else {
          has_login = false;
        }
      })
      .catch((e) => {
        console.log("Error:", e);
        has_login = false;
      });
    return has_login;
  })()
};
export const UserContext = React.createContext({
  user: null,
  update_user: (user) => {}
});
