import React from "react";
import { useSearchParams } from "react-router-dom";
import { UserContext } from "../user_context";
import http from "../http_common";
import "./school.css";
import Carousel from "./carousel";

export default function School(props) {
  const userCtx = React.useContext(UserContext);
  const [searchParams] = useSearchParams();
  const [schoolid, setSchoolid] = React.useState(searchParams.get("schoolid"));
  const [school, setSchool] = React.useState(null);
  React.useEffect(() => {
    if (schoolid) {
      http
        .get(`/sapling/get_school?schoolid=${schoolid}`)
        .then((response) => {
          if (response.data.result === 0) {
            setSchool(response.data.school);
          } else {
            console.log(`Server respsone error code:${response.data.result}`);
          }
        })
        .catch((error) => console.log(error.toJSON().message));
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
  console.log(`schoolid:${schoolid}`);
  const genPhotos = (photo) => {
    let photos = null;
    if (photo) {
      photos = photo.split(",");
      photos = photos.map((photo) => `${schoolid}_image_${photo}`);
    }
    return photos;
  };

  return school ? (
    <div className="school_container">
      <Carousel pics={genPhotos(school.photo)} />
      <p className="title">{school.name}</p>
      <div className="introduce">{school.introduce}</div>
    </div>
  ) : (
    <div></div>
  );
}
