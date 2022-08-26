import React from "react";
import { FaBell } from "react-icons/fa";
import { FaHistory } from "react-icons/fa";
import "./info_bar.css";

const InfoBar = ({
  classes,
  state,
  unReadMessages,
  handleNotifications,
  handleGetHistory
}) => {
  const genClassesName = (classes) => {
    const names = classes.map((cls) => cls.name);
    return names.join();
  };

  const convState = (state) => {
    switch (state) {
      case 1:
        return "online";
      default:
        return "offline";
    }
  };
  const convStateStr = (state) => {
    switch (state) {
      case 0:
        return "正在连接...";
      case 1:
        return "已经连接";
      case 2:
        return "连接正在关闭";
      case 3:
        return "连接已关闭";
      default:
        return "非法的状态码";
    }
  };
  return (
    <div className="infoBar">
      <div className="leftInnerContainer">
        <div className={`room__state ${convState(state)}`} />
        <h3>{classes ? genClassesName(classes) : "测试"}</h3>
        <p>{convStateStr(state)}</p>
      </div>
      <div className="rightInnerContainer">
        <div className="chat__history" onClick={handleGetHistory}>
          <FaHistory />
        </div>
        <div className="chat__notification" onClick={handleNotifications}>
          <FaBell />
          {unReadMessages > 0 ? (
            <span className="badge">{unReadMessages}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default InfoBar;
