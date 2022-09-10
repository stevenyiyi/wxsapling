import React from "react";
import { NavLink } from "react-router-dom";
import "./sidebar.css";
const HeaderBar = () => {
  return (
    <div className="sidebar">
      <NavLink to="/player">直播</NavLink>
      <NavLink to="/recipes">食谱</NavLink>
      <NavLink to="/chat">家园互动</NavLink>
      <NavLink to="/school">园所介绍</NavLink>
      <NavLink to="/teachers">教师风采</NavLink>
    </div>
  );
};

export default HeaderBar;
