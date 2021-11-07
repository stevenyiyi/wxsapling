import React from "react";
import { useSearchParams } from "react-router-dom";
import { FaList, FaAngleLeft, FaAngleRight, FaTimes } from "react-icons/fa";
import http from "../http_common";
import "./common.css";
export default function Teachers(props) {
  const [searchParams] = useSearchParams();
  const schoolid = searchParams.get("schoolid");
  const [teachers, setTeachers] = React.useState(null);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const refList = React.useRef();
  const refPrev = React.useRef();
  const refNext = React.useRef();

  React.useEffect(() => {
    if (schoolid) {
      http
        .get(`/sapling/get_teachers?schoolid=${schoolid}`)
        .then((response) => {
          if (response.data.result === 0) {
            setTeachers(response.data.teachers);
            if (response.data.teachers.length > 0) {
              setActiveIdx(0);
              if (response.data.teacher.length > 1) {
                refNext.current.disabled = false;
              }
            }
          } else {
            console.log(`Server response error:${response.data.result}`);
          }
        })
        .catch((e) => console.log(e.toJSON().message));
    }
  }, [schoolid]);
  console.log(`schoolid:${schoolid}`);
  const handleClickTeacher = (event) => {
    setActiveIdx(event.target.id);
  };

  const handleClose = (event) => {
    refList.current.classList.toggle("show");
  };

  const handleListClick = (event) => {
    refList.current.classList.toggle("show");
  };

  const handlePrevClick = (event) => {
    let curidx = activeIdx - 1;
    if (curidx === 0) {
      refPrev.current.disabled = true;
    }
    if (refNext.current.disabled) {
      refNext.current.disabled = false;
    }
    setActiveIdx(curidx);
  };

  const handleNextClick = (event) => {
    let curidx = activeIdx + 1;
    if (curidx === teachers.length) {
      refNext.current.disabled = true;
    }
    if (refPrev.current.disabled) {
      refPrev.current.disabled = false;
    }
    setActiveIdx(curidx);
  };

  const genTeachersList = () => {
    return (
      <div className="user-list__container">
        {teachers &&
          teachers.map((teacher, index) => (
            <div
              className={
                index === 0 ? "user-item__selected" : "user-item__wrapper"
              }
              key={teacher.username}
              id={index}
              onClick={handleClickTeacher}
            >
              <div className="user-item__name-wrapper">
                <div className="user-item__name">{teacher.nick_name}</div>
              </div>
              <p>{teacher.classes.join()}</p>
            </div>
          ))}
      </div>
    );
  };

  const genTeacherPhoto = () => {
    let uri = "http://localhost/imgs/img_avatar_unknow.png";
    if (teachers && teachers[activeIdx].photo) {
      uri = `imgs/${teachers[activeIdx].photo}`;
    }
    return uri;
  };

  return (
    <div className="container">
      <div className="topbar">
        <button className="circle_btn" onClick={handleListClick}>
          <FaList />
        </button>
        <h3>教师介绍</h3>
        <div>
          <button
            ref={refPrev}
            className="circle_btn"
            disabled={true}
            onClick={handlePrevClick}
          >
            <FaAngleLeft />
          </button>
          <button
            ref={refNext}
            className="circle_btn"
            disabled={true}
            onClick={handleNextClick}
          >
            <FaAngleRight />
          </button>
        </div>
      </div>
      <div className="card">
        <img src={genTeacherPhoto()} alt="teacher" style={{ width: "100%" }} />
        <p className="title">{teachers ? teachers[activeIdx].name : "测试"}</p>
        <div className="text_content">
          {teachers ? teachers[activeIdx].note : ""}
        </div>
      </div>
      <div ref={refList} className="sidenav">
        <div className="navbar">
          <p>教师列表</p>
          <button className="circle_btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>
        {genTeachersList}
      </div>
    </div>
  );
}
