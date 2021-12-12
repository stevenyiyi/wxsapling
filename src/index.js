/**
import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
*/

import React from "react";
import ReactDOM from "react-dom";
import Cookies from "js-cookie";
import App from "./App";

(() => {
  let user = {};
  user.username = Cookies.get("username");
  user.token = Cookies.get("token");
  user.role = Cookies.get("role");

  const rootElement = document.getElementById("root");
  ReactDOM.render(
    <React.StrictMode>
      <App user={user} />
    </React.StrictMode>,
    rootElement
  );
})();
