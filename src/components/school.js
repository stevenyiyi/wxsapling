import React from "react";
import { useSearchParams } from "react-router-dom";
import http from "../http_common";
import "./school.css";
import Carousel from "./carousel";

export default function School(props) {
  const [searchParams] = useSearchParams();
  const schoolid = searchParams.get("schoolid");
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
    }
  }, [schoolid]);
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
      <div className="text_content">{school.introduce}</div>
    </div>
  ) : (
    <div></div>
  );
}
