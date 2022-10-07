import React from "react";
import * as ReactDOMClient from "react-dom/client";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";
import Cookies from "js-cookie";
import http from "./http_common";
import App from "./App";

(async () => {
  const path = "/sapling/login";
  let user = {
    username: undefined,
    token: undefined,
    role: undefined,
    is_login: false,
    schoolid: undefined
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
  const container = document.getElementById("root");
  const root = ReactDOMClient.createRoot(container);
  root.render(<App userCookie={user} />);
  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://cra.link/PWA
  serviceWorkerRegistration.register();

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals();
})();
