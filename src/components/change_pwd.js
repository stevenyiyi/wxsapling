import React from "react";
import Modal from "./modal";
import "./common.css";
export default function ChangePassword(props) {
  const [oldPwd, setOldPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");

  return (
    <Modal title="口令修改" show={true}>
      <form className="formContainer">
        <input
          id="oldpwd"
          type="password"
          className="full_input"
          placeholder="请输入原口令"
          onChange={(e) => setOldPwd(e.target.value.trim())}
        />
        <input
          id="newpwd"
          type="password"
          className="full_input"
          placeholder="请输入新口令"
          onChange={(e) => setNewPwd(e.target.value.trim())}
        />
        <input
          id="repeatpwd"
          type="password"
          className="full_input"
          placeholder="请再输入一次新口令"
          onChange={(e) => setConfirmPwd(e.target.value.trim())}
        />
        <button className="full_btn">确认</button>
      </form>
    </Modal>
  );
}
