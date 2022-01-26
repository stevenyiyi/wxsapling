/**
import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
*/

import React from "react";
import ReactDOM from "react-dom";
import Cookies from "js-cookie";
import http from "./http_common";
import App from "./App";

(() => {
  const path = "/sapling/login";
  const user = {
    username: Cookies.get("username"),
    token: Cookies.get("token"),
    role: Cookies.get("role"),
    is_login: (() => {
      if (!Cookies.get("username")) {
        return false;
      }
      let qparams = { ts: Date.now() };
      qparams.username = Cookies.get("username");
      qparams.token = Cookies.get("token");
      http.get(path, { params: qparams }).then((response) => {
        let result = response.data.result;
        if (result === 0) {
          return true;
        } else {
          return false;
        }
      });
    })()
  };
  const rootElement = document.getElementById("root");
  ReactDOM.render(
    <React.StrictMode>
      <App user={user} />
    </React.StrictMode>,
    rootElement
  );
})();
