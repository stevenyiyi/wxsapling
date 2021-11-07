import React from "react";
import "./carousel.css";

export default function Carousel(props) {
  const { pics } = props;
  const refSlides = [
    React.useRef(),
    React.useRef(),
    React.useRef(),
    React.useRef()
  ];
  const refDots = [
    React.useRef(),
    React.useRef(),
    React.useRef(),
    React.useRef()
  ];
  const [slideIndex, setSlideIndex] = React.useState(0);
  const showSlides = () => {
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
  };

  React.useEffect(() => {
    refSlides.splice(pics.length);
    refDots.splice(pics.length);
  }, [refSlides, refDots, pics]);

  React.useEffect(() => {
    const timerid = setTimeout(showSlides, 3000); // Change image every 3 seconds
    return () => clearTimeout(timerid);
  });
  return (
    <>
      <div className="slideshow-container">
        {pics &&
          pics.map((pic, i) => (
            <div ref={refSlides[i]} key={i} className="mySlides fade">
              <div className="numbertext">{`${i + 1} / ${pics.length}`}</div>
              <img src={`http://localhost/imgs/${pic}`} alt="carousel_image" />
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
    </>
  );
}
