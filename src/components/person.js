import React from "react";
import ChangePassword from "./change_pwd";
import http from "../http_common";
import { useSnackbar } from "./use_snackbar";
import "./common.css";
import "./personal.css";

/**
 * Hook that alerts clicks outside of the passed ref
 */
function useOutsideClick(ref, onOutsideClick) {
  React.useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClick(event);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, onOutsideClick]);
}

const Person = React.forwardRef((props, ref) => {
  const [openSnackbar, closeSnackbar] = useSnackbar();
  const { show, onClose } = props;
  const [user, setUser] = React.useState({
    username: "2523452345",
    nick_name: "成怡",
    end_ts: "2022-09-01"
  });
  const [showChangePwd, setShowChangePwd] = React.useState(false);
  const [photo, setPhoto] = React.useState(null);
  const refAvatar = React.useRef();
  const refSelf = React.useRef();
  useOutsideClick(refSelf, onClose);
  React.useEffect(() => {
    http
      .get("/sapling/get_user_info")
      .then((response) => {
        if (response.data.result === 0) {
          setUser(response.data.info);
          if (response.data.info.photo) {
            refAvatar.current.src = `imgs/${response.data.info.photo}`;
          } else {
            refAvatar.current.src = "imgs/img_avatar_unknow.png";
          }
        } else {
          openSnackbar(`Server respone error:${response.data.result}`);
        }
      })
      .catch((e) => openSnackbar(e.toJSON().message));
  }, []);

  React.useEffect(() => {
    if (show) {
      refSelf.current.style.display = "block";
    } else {
      refSelf.current.style.display = "none";
    }
  }, [show]);

  /// expose function getDisplayName
  React.useImperativeHandle(ref, () => ({
    getName: () => (user ? user.nick_name : ""),
    getEndts: () => (user ? user.end_ts : Date.now())
  }));

  /// 处理文件上传
  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile.size > 20 * 1024) {
      openSnackbar("选择的头像文件不能超过20KB！");
      return;
    }
    refAvatar.current.src = URL.createObjectURL(selectedFile);
    setPhoto(selectedFile);
  };

  /// 处理修改口令
  const handleChangePwd = (event) => {
    event.preventDefault();
    setShowChangePwd(true);
  };

  /// 切换登录
  const handleSwitchLogin = (event) => {
    event.preventDefault();
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
              src="http://localhost/imgs/img_avatar_unknow.png"
              className="personal-avatar"
              alt="avatar"
            />
            <figcaption className="personal-figcaption">
              <img
                src="http://localhost/imgs/img_camera_white.png"
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
        <button type="submit" className="full_btn">
          切换登录
        </button>
      </div>
      <ChangePassword
        show={showChangePwd}
        onClose={() => setShowChangePwd(false)}
      />
    </div>
  );
});
export default Person;
