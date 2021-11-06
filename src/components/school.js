import React from "react";
import { useLocation } from "react-router-dom";
import queryString from "query-string";
import http from "../http_common";
import Carousel from "./carousel";

export default function School(props) {
  const { search } = useLocation();
  const { schoolid } = queryString.parse(search);
  const [school, setSchool] = React.useState(null);
  React.useEffect(() => {
    if (schoolid) {
      http
        .get(`/get_school?schoolid=${schoolid}`)
        .then((response) => {
          if (response.data.result === 0) {
            setSchool(response.data.school);
          } else {
            console.log(
              `Server respsone error code:${response.response.result}`
            );
          }
        })
        .catch((error) => console.log(error.toJSON().message));
    }
  }, [schoolid]);
  console.log(`schoolid:${schoolid}`);
  return (
    <div>
      <Carousel pics={JSON.parse(school.photos)} />
      <div>
        <h3>{school ? school.name : ""}</h3>
        <p>{school ? school.introduce : ""}</p>
      </div>
    </div>
  );
}
