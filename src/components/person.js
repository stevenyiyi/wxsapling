import React from "react";
import { useNavigate } from "react-router-dom";
import ChangePassword from "./change_pwd";
import http from "../http_common";
import { useSnackbar } from "./use_snackbar";
import { useOutsideClick } from "../utils/hook";
import PropTypes from "prop-types";
import "./common.css";
import "./personal.css";

const Person = React.forwardRef((props, ref) => {
  const navigate = useNavigate();
  const [openSnackbar] = useSnackbar();
  const { open, onOutsideClick } = props;
  const [user, setUser] = React.useState({
    username: "2523452345",
    nick_name: "成怡",
    end_ts: "2022-09-01"
  });
  const [showChangePwd, setShowChangePwd] = React.useState(false);
  const refAvatar = React.useRef();
  const refSelf = React.useRef();
  useOutsideClick(refSelf, onOutsideClick);
  React.useEffect(() => {
    http
      .get("/sapling/get_user_info")
      .then((response) => {
        if (response.data.result === 0) {
          setUser(response.data.info);
          if (response.data.info.photo) {
            refAvatar.current.src = `imgs/${response.data.info.username}.${response.data.info.photo}`;
          } else {
            refAvatar.current.src =
              "https://localhost/imgs/img_avatar_unknow.png";
          }
        } else {
          openSnackbar(
            `get_user_info,Server respone error:${response.data.result}`
          );
        }
      })
      .catch((e) => openSnackbar(e.toJSON().message));
  }, []);

  React.useEffect(() => {
    if (open) {
      refSelf.current.style.display = "flex";
    } else {
      refSelf.current.style.display = "none";
    }
  }, [open]);

  /// expose function getDisplayName
  React.useImperativeHandle(ref, () => ({
    getName: () => (user ? user.nick_name : ""),
    getEndts: () => (user ? user.end_ts : Date.now()),
    getPhoto: () => (user ? user.photo : "")
  }));

  /// 处理文件上传
  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile.size > 50 * 1024) {
      openSnackbar("选择的头像文件不能超过50KB！");
      return;
    }

    let ext = selectedFile.name.split(".").pop();
    if (!ext) {
      openSnackbar("选择的头像文件扩展名必须为png或jpg！");
      return;
    }

    refAvatar.current.src = URL.createObjectURL(selectedFile);

    let mfields = new FormData();
    mfields.append("username", user.username);
    let upload_file = `${user.username}.${ext}`;
    mfields.append("photo", selectedFile, upload_file);
    user.photo = ext;

    http
      .post("/sapling/modify_subuser", mfields)
      .then((response) => {
        if (response.data.result === 0) {
          /// Modify successed!
          openSnackbar("修改头像成功!");
        }
      })
      .catch((e) => openSnackbar(`修改头像失败:e.toJSON().message`));
  };

  /// 处理修改口令
  const handleChangePwd = (event) => {
    event.preventDefault();
    setShowChangePwd(true);
  };

  /// 切换登录
  const handleSwitchLogin = (event) => {
    event.preventDefault();
    navigate("/login", {
      replace: true,
      state: { from: "/player" }
    });
  };

  return (
    <div ref={refSelf} className="personal_card">
      <div className="personal-image">
        <label>
          <input
            type="file"
            id="modify-teacher-photo-file-upload"
            accept="image/png, image/jpeg"
            onChange={handleFileUpload}
          />
          <figure className="personal-figure">
            <img
              ref={refAvatar}
              src="https://localhost/imgs/img_avatar_unknow.png"
              className="personal-avatar"
              alt="avatar"
            />
            <figcaption className="personal-figcaption">
              <img
                src="https://localhost/imgs/img_camera_white.png"
                alt="avatar-camera"
              />
            </figcaption>
          </figure>
        </label>
      </div>
      <div className="personal-content">
        <h3>{user.nick_name}</h3>
        <p>{`登录用户名：${user.username}`}</p>
        <p>{`帐户截止日期：${user.end_ts}`}</p>
        <button type="submit" className="full_btn" onClick={handleChangePwd}>
          修改口令
        </button>
        <button type="submit" className="full_btn" onClick={handleSwitchLogin}>
          切换登录
        </button>
      </div>
      <ChangePassword
        username={user.username}
        password={user.password}
        show={showChangePwd}
        onClose={() => setShowChangePwd(false)}
      />
    </div>
  );
});
Person.propTypes = {
  open: PropTypes.bool.isRequired,
  onOutsideClick: PropTypes.func.isRequired
};
Person.defaultProps = {
  open: true,
  onOutsideClick: () => {}
};
export default Person;
