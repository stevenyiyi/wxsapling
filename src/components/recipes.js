import React from "react";
import { useSearchParams } from "react-router-dom";
import http from "../http_common";
import "./common.css";

export default function Recipes(props) {
  const [searchParams] = useSearchParams();
  const schoolid = searchParams.get("schoolid");
  const [recipes, setRecipes] = React.useState(null);

  React.useEffect(() => {
    if (schoolid) {
      http
        .get(`/sapling/get_recipes?schoolid=${schoolid}`)
        .then((response) => {
          if (response.data.result === 0) {
            setRecipes(response.data.recipes);
          } else {
            console.log(`Server response code:${response.data.result}`);
          }
        })
        .catch((e) => console.log(e.toJSON().message));
    }
  });
  return (
    <div className="tableContainer">
      <table>
        <thead>
          <tr>
            <th>星期</th>
            <th>食谱</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>星期一</td>
            <td>{recipes ? recipes.monday : ""}</td>
          </tr>
          <tr>
            <td>星期二</td>
            <td>{recipes ? recipes.tuesday : ""}</td>
          </tr>
          <tr>
            <td>星期三</td>
            <td>{recipes ? recipes.wednesday : ""}</td>
          </tr>
          <tr>
            <td>星期四</td>
            <td>{recipes ? recipes.thursday : ""}</td>
          </tr>
          <tr>
            <td>星期五</td>
            <td>{recipes ? recipes.friday : ""}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
