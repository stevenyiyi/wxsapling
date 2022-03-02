import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";

import React from "react";
import ReactDOM from "react-dom";
import Cookies from "js-cookie";
import http from "./http_common";
import App from "./App";

(async () => {
  const path = "/sapling/login";
  let user = {
    username: undefined,
    token: undefined,
    role: undefined,
    is_login: false
  };
  if (Cookies.get("username")) {
    user.username = Cookies.get("username");
    user.token = Cookies.get("token");
    user.role = Cookies.get("role");
    await http
      .get(path)
      .then((response) => {
        let result = response.data.result;
        if (result === 0) {
          user.is_login = true;
        } else {
          user.is_login = false;
        }
      })
      .catch((e) => {
        console.log("Error:", e);
        user.is_login = false;
      });
  }
  const rootElement = document.getElementById("root");
  ReactDOM.render(
    <React.StrictMode>
      <App userCookie={user} />
    </React.StrictMode>,
    rootElement
  );
})();
