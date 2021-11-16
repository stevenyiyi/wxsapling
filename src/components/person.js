import React from "react";
import http from "../http_common";
import { FaUserLock, FaUserCheck } from "react-icons";
import "./common.css";
export default function Person(props) {
  const [user, setUser] = React.useState({
    username: "2523452345",
    nick_name: "成怡",
    end_ts: "2022-09-01"
  });
  const genPhoto = () => {
    let uri = "http://localhost/imgs/img_avatar_unknow.png";
    if (user.photo) {
      uri = `imgs/${user.photo}`;
    }
    return uri;
  };

  React.useEffect(() => {
    http
      .get("/sapling/get_user_info")
      .then((response) => {
        if (response.data.result === 0) {
          setUser(response.data.info);
        } else {
          console.log(`Server respone error:${response.data.result}`);
        }
      })
      .catch((e) => console.error("Error:", e));
  });

  return (
    <div className="card">
      <img src={genPhoto()} alt="person" style={{ width: "100%" }} />
      <p className="title">{user.nick_name}</p>
      <p>{`登录用户名：${user.username}`}</p>
      <p>{`帐户截止日期：${user.end_ts}`}</p>
      <p>
        <button className="full_btn">修改口令</button>
      </p>
      <p>
        <button className="full_btn">切换登录</button>
      </p>
    </div>
  );
}
