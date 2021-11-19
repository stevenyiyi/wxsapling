import React from "react";
import "./test.css";
export default function Test(props) {
  return (
    <div className="flexbox-parent">
      <div>TOP</div>
      <div className="fill-area flexbox-item-grow">
        <div className="flexbox-item-grow">
          <div className="module">
            <div className="header"></div>
            <div className="scrolling">
              <p> Some Text</p>
              <p> Some Text</p>
              <p> Some Text</p>
              <p> Some Text</p>
              <p> Some Text</p>
              <p> Some Text</p>
              <p> Some Text</p>
              <p> Some Text</p>
              <p> Some Text</p>
              <p> Some Text</p>
              <p> Some Text</p>
            </div>
            <div className="footer"></div>
          </div>
        </div>
      </div>
      <div>BOTTOM</div>
    </div>
  );
}
