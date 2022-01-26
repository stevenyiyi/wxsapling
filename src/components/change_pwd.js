import React from "react";
import Modal from "./modal";
import ASTooltip from "./as_tooltip";
import CryptoJS from "crypto-js";
import http from "../http_common";
import "./common.css";
import "./floating_input.css";

export default function ChangePassword(props) {
  const { username, password, show, onClose } = props;
  const [oldPwd, setOldPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [message, setMessage] = React.useState({
    show: false,
    text: ""
  });
  const refBut = React.useRef();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (newPwd !== confirmPwd) {
      setMessage({
        ...message,
        show: true,
        text: "重复输入的新口令与新口令不一致!"
      });
      return;
    }

    if (oldPwd !== password) {
      setMessage({
        ...message,
        show: true,
        text: "老口令错误!"
      });
      return;
    }

    let bkey = CryptoJS.MD5(username + ":" + oldPwd);
    let t = Date.now();
    console.log(t);
    let st = t.toString(16).padStart(32, "0");
    console.log(st);
    let bt = CryptoJS.enc.Hex.parse(st);
    console.log(bt);
    console.log(newPwd);
    let benc = CryptoJS.AES.encrypt(newPwd, bkey, {
      iv: bt,
      mode: CryptoJS.mode.CTR,
      padding: CryptoJS.pad.NoPadding
    });
    console.log(benc);
    let senc = benc.ciphertext.toString();
    console.log(senc);
    http
      .get(`/sapling/change_password?newpwd=${senc}&counter=${t}`)
      .then((response) => {
        const ERR_NO_ACCOUNT = 0x800000f;
        const ERR_PWD = 0x8000010;
        const ERR_ACCESS_DEINED = 0x8000014;
        if (response.data.result === 0) {
          setMessage({
            ...message,
            show: true,
            text: "修改口令成功!"
          });
          setTimeout(() => {
            onClose();
          }, 3000);
        } else if (response.data.result === ERR_NO_ACCOUNT) {
          setMessage({
            ...message,
            show: true,
            text: "帐户不存在!"
          });
        } else if (response.data.result === ERR_PWD) {
          setMessage({
            ...message,
            show: true,
            text: "老口令错误!"
          });
        } else if (response.data.result === ERR_ACCESS_DEINED) {
          setMessage({
            ...message,
            show: true,
            text: "此帐户无权修改!"
          });
        } else {
          setMessage({
            ...message,
            show: true,
            text: "未知错误!"
          });
        }
      })
      .catch((e) =>
        setMessage({
          ...message,
          show: true,
          text: e.toJSON().message
        })
      );
  };

  return (
    <Modal title="口令修改" show={show} onClose={onClose}>
      <form className="formContainer" onSubmit={handleSubmit}>
        <div className="form__div">
          <input
            id="oldpwd"
            type="password"
            required
            className="form__input"
            placeholder=" "
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value.trim())}
          />
          <label htmlFor="oldpwd" className="form__label">
            请输入原口令
          </label>
        </div>
        <div className="form__div">
          <input
            id="newpwd"
            required
            type="password"
            className="form__input"
            placeholder=" "
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value.trim())}
          />
          <label htmlFor="newpwd" className="form__label">
            请输入新口令
          </label>
        </div>
        <div className="form__div">
          <input
            id="repeatpwd"
            type="password"
            required
            className="form__input"
            placeholder=" "
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value.trim())}
          />
          <label htmlFor="repeatpwd" className="form__label">
            请再输入一次新口令
          </label>
        </div>
        <button ref={refBut} type="submit" className="full_btn">
          确认
        </button>
      </form>
      <ASTooltip
        ref={refBut}
        delay={5000}
        show={message.show}
        onClose={() => setMessage({ ...message, show: false })}
      >
        <p>{message.text}</p>
      </ASTooltip>
    </Modal>
  );
}
