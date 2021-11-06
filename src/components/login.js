import React from "react";
import http from "../http_common";
import sha1 from "crypto-js/sha1";
import Cookies from "js-cookie";
import { UserContext } from "../user_context";
import { useSnackbar } from "react-simple-snackbar";
import { useLocation, useNavigate } from "react-router-dom";
import "./login.css";
const Login = (props) => {
  const ERR_NO_ACCOUNT = 0x800000f;
  const ERR_INVALID_PWD = ERR_NO_ACCOUNT + 1;
  const ERR_OVERDUE = ERR_INVALID_PWD + 1;
  const navigate = useNavigate();
  const [openSnackbar, closeSnackbar] = useSnackbar();
  const [state, setState] = React.useState({
    username: "",
    password: ""
  });

  const userCtx = React.useContext(UserContext);
  const location = useLocation();
  const handleChange = (e) => {
    const { id, value } = e.target;
    setState((prevState) => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleFormInvalid = () => {
    let formIsValid = true;
    if (
      !state.username.match(
        /^[1](([3][0-9])|([4][5-9])|([5][0-3,5-9])|([6][5,6])|([7][0-8])|([8][0-9])|([9][1,8,9]))[0-9]{8}$/
      )
    ) {
      formIsValid = false;
      openSnackbar("非法的用户名，请输入手机号！");
      return formIsValid;
    } else {
      closeSnackbar();
      formIsValid = true;
    }

    if (!state.password.match(/^[0-9a-zA-Z]{6,22}$/)) {
      formIsValid = false;
      openSnackbar("口令限制仅英文字母或数字组成，长度范围(6-22)个字符");
      return formIsValid;
    } else {
      closeSnackbar();
      formIsValid = true;
    }
    return formIsValid;
  };

  const redirectToCurrent = () => {
    if (location.state) {
      navigate(location.state.from);
    }
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    if (handleFormInvalid()) {
      let path = "/sapling/login";
      let h1 = sha1(state.username + ":" + state.password).toString();
      let h2 = sha1(state.password + ":" + path).toString();
      let h3 = sha1(
        state.username + ":" + state.password + ":" + path
      ).toString();
      let qparams = { ts: Date.now() };
      qparams.username = state.username;
      qparams.token = sha1(h1 + ":" + h2 + ":" + h3).toString();
      http
        .get(path, { params: qparams })
        .then((response) => {
          let result = response.data.result;
          if (result === 0) {
            userCtx.updateUser({
              username: state.username,
              role: Cookies.get("role"),
              token: Cookies.get("token")
            });
            /// Login Success
            openSnackbar("登录成功，将转向主页！");
            redirectToCurrent();
          } else if (result === ERR_NO_ACCOUNT) {
            /// 帐户不存在
            openSnackbar("帐户不存在，请先注册后再登录！");
          } else if (result === ERR_OVERDUE) {
            /// 帐户过期
            openSnackbar("帐户已过期！");
          } else if (result === ERR_INVALID_PWD) {
            /// 口令错误
            openSnackbar("口令错误！");
          }
        })
        .catch((e) => {
          /// 错误
          console.log(props.history);
          openSnackbar(e.toJSON().message);
          props.history.goForward();
        });
    }
  };
  return (
    <div className="loginOuterContainer">
      <div className="loginInnerContainer">
        <h1 className="heading">用户登录</h1>
        <div>
          <input
            placeholder="用户名"
            className="loginInput"
            id="username"
            type="text"
            onChange={handleChange}
          />
        </div>
        <div>
          <input
            placeholder="口令"
            className="loginInput mt-20"
            type="password"
            id="password"
            onChange={handleChange}
          />
        </div>
        <button
          className={"button mt-20"}
          type="submit"
          onClick={handleSubmitClick}
        >
          登 录
        </button>
      </div>
    </div>
  );
};
export default Login;
