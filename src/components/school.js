import React from "react";
import { useSearchParams } from "react-router-dom";
import http from "../http_common";
import Carousel from "./carousel";
import "./common.css";

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
    let photos = [];
    if (photo) {
      photos = photo.split(",");
    }
    photos.push("img_mountains_wide.jpeg");
    photos.push("img_nature_wide.jpeg");
    return photos;
  };

  return (
    <div className="container">
      {school && <> <Carousel pics={genPhotos(school.photo)} />
          <p className="title">{school.name}</p>
          <div className="text_content">{school.introduce}</div>
          </>
      }
    </div>
  );
}
