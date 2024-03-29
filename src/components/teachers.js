import React from "react";
import { useSearchParams } from "react-router-dom";
import { FaList, FaAngleLeft, FaAngleRight, FaTimes } from "react-icons/fa";
import http from "../http_common";
import config from "../config";
import { UserContext } from "../user_context";
import "./common.css";
import "./teachers.css";
export default function Teachers(props) {
  const userCtx = React.useContext(UserContext);
  const [searchParams] = useSearchParams();
  const [schoolid, setSchoolid] = React.useState(searchParams.get("schoolid"));
  const [teachers, setTeachers] = React.useState([]);
  const [classes, setClasses] = React.useState([]);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const refList = React.useRef();
  React.useEffect(() => {
    if (schoolid) {
      /// Get teachers for schoolid
      http
        .get(`/sapling/get_teachers?schoolid=${schoolid}`)
        .then((response) => {
          if (response.data.result === 0) {
            console.log(response.data.teachers);
            setTeachers(response.data.teachers);
          } else {
            console.log(`Server response error:${response.data.result}`);
          }
        })
        .catch((e) => console.log(e));
      /// Get classes from schoolid
      http
        .get(`/sapling/get_classes?schoolid=${schoolid}&simple=true`)
        .then((response) => {
          if (response.data.result === 0) {
            console.log(response.data.classes);
            setClasses(response.data.classes);
          } else {
            console.log(`Server response error:${response.data.result}`);
          }
        })
        .catch((e) => console.log(e));
    } else {
      if (userCtx.user.schoolid) {
        setSchoolid(userCtx.user.schoolid);
      } else if (
        userCtx.user.is_login &&
        (userCtx.user.role === "1" ||
          userCtx.user.role === "2" ||
          userCtx.user.role === "3")
      ) {
        http
          .get("/sapling/get_my_shcoolid")
          .then((response) => {
            if (response.data.result === 0) {
              /// Update context user
              let user = { ...userCtx.user };
              user.schoolid = response.data.schoolid;
              userCtx.update(user, userCtx.useNavbar);
              setSchoolid(response.data.schoolid);
            } else {
              console.log(`Server respsone error code:${response.data.result}`);
            }
          })
          .catch((error) => console.log(error.toJSON().message));
      }
    }
  }, [schoolid, userCtx]);

  const getClassNames = (classids) => {
    let names = [];
    for (const clsid of classids) {
      for (const cls of classes) {
        if (cls.classid === clsid) {
          names.push(cls.name);
          break;
        }
      }
    }
    return names.join();
  };

  const handleClickTeacher = (idx) => {
    setActiveIdx(idx);
  };

  const handleClose = (event) => {
    refList.current.classList.toggle("show");
  };

  const handleListClick = (event) => {
    refList.current.classList.toggle("show");
  };

  const handlePrevClick = (event) => {
    setActiveIdx((idx) => idx - 1);
  };

  const toggleNextDisabled = () => {
    let f = true;
    if (teachers.length > 0) {
      if (activeIdx < teachers.length - 1) {
        f = false;
      } else {
        f = true;
      }
    }
    return f;
  };

  const togglePrevDisabled = () => {
    return activeIdx === 0;
  };

  const handleNextClick = (event) => {
    setActiveIdx((idx) => idx + 1);
  };

  const genTeachersList = () => {
    return (
      <div className="user-list__container">
        {teachers.map((teacher, index) => (
          <div
            className={
              index === activeIdx
                ? "user-item__wrapper user-item__selected"
                : "user-item__wrapper"
            }
            key={teacher.username}
            id={index}
            onClick={() => {
              handleClickTeacher(index);
              handleClose();
            }}
          >
            <div className="user-item__name-wrapper">
              <div className="user-item__name">{teacher.nick_name}</div>
            </div>
            <p>{getClassNames(teacher.classes)}</p>
          </div>
        ))}
      </div>
    );
  };

  const genTeacherPhoto = () => {
    let uri = `${config.resBaseUrl}/imgs/img_avatar_unknow.png`;
    if (teachers.length > 0 && teachers[activeIdx].photo) {
      uri = `${config.resBaseUrl}/imgs/${teachers[activeIdx].username}.${teachers[activeIdx].photo}`;
    }
    return uri;
  };

  return (
    <div className="teachers_container">
      <div className="topbar">
        <button className="circle_btn" onClick={handleListClick}>
          <FaList />
        </button>
        <h3>教师介绍</h3>
        <div>
          <button
            className="circle_btn"
            disabled={togglePrevDisabled()}
            onClick={handlePrevClick}
          >
            <FaAngleLeft />
          </button>
          <button
            className="circle_btn"
            disabled={toggleNextDisabled()}
            onClick={handleNextClick}
          >
            <FaAngleRight />
          </button>
        </div>
      </div>
      <div className="card">
        <img src={genTeacherPhoto()} alt="teacher" style={{ width: "100%" }} />
        <p className="title">
          {teachers.length > 0 ? teachers[activeIdx].nick_name : "测试"}
        </p>
        <div className="note">
          {teachers.length > 0 ? teachers[activeIdx].note : ""}
        </div>
      </div>
      <div ref={refList} className="sidenav">
        <div className="navbar">
          <p>教师列表</p>
          <button className="circle_btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>
        {genTeachersList()}
      </div>
    </div>
  );
}
