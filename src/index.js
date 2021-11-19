import React from "react";
import ReactDOM from "react-dom";
import Cookies from "js-cookie";
import App from "./App";

let user = {};
user.username = Cookies.get("username");
user.token = Cookies.get("token");
user.role = Cookies.get("role");

const rootElement = document.getElementById("root");
ReactDOM.render(<App user={user} />, rootElement);
