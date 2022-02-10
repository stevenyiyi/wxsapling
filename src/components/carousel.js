import React from "react";
import config from "../config";
import "./carousel.css";

export default function Carousel(props) {
  const { pics } = props;
  const [refSlides, setRefSlides] = React.useState([]);
  const [refDots, setRefDots] = React.useState([]);
  const [slideIndex, setSlideIndex] = React.useState(0);
  const showSlides = React.useCallback(() => {
    for (let i = 0; i < refSlides.length; i++) {
      refSlides[i].current.style.display = "none";
    }
    for (let i = 0; i < refDots.length; i++) {
      refDots[i].current.className = refDots[i].current.className.replace(
        " active",
        ""
      );
    }
    console.log(`Current index:${slideIndex}`);
    refSlides[slideIndex].current.style.display = "block";
    refDots[slideIndex].current.className += " active";

    let cidx = slideIndex + 1;
    setSlideIndex(cidx);
    if (cidx >= refSlides.length) {
      setSlideIndex(0);
    }
  }, [refSlides, refDots, slideIndex]);

  React.useEffect(() => {
    // add refs
    setRefSlides((elRefs) =>
      Array(pics.length)
        .fill()
        .map((_, i) => React.createRef())
    );
    setRefDots((elRefs) =>
      Array(pics.length)
        .fill()
        .map((_, i) => React.createRef())
    );
  }, [pics]);

  React.useEffect(() => {
    const timerid = setTimeout(showSlides, 3000); // Change image every 3 seconds
    return () => clearTimeout(timerid);
  });
  return (
    <div>
      <div className="slideshow-container">
        {pics &&
          pics.map((pic, i) => (
            <div ref={refSlides[i]} key={i} className="mySlides fade">
              <div className="numbertext">{`${i + 1} / ${pics.length}`}</div>
              <img
                src={`${config.resBaseUrl}/imgs/${pic}`}
                alt="carousel_image"
              />
              <div className="text">test</div>
            </div>
          ))}
      </div>
      <div className="dot-group">
        {pics &&
          pics.map((pic, i) => (
            <span ref={refDots[i]} key={i} className="dot"></span>
          ))}
      </div>
    </div>
  );
}
