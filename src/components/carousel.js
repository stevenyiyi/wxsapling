import React from "react";
import "./carousel.css";

export default function Carousel(props) {
  const { pics } = props;
  const [slideIndex, setSlideIndex] = React.useState(0);
  const showSlides = () => {
    let slides = document.getElementsByClassName("mySlides");
    let dots = document.getElementsByClassName("dot");
    for (let i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
    }
    setSlideIndex(slideIndex + 1);
    if (slideIndex > slides.length) {
      setSlideIndex(1);
    }
    for (let i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
  };
  React.useEffect(() => {
    const timerid = setTimeout(showSlides, 2000); // Change image every 2 seconds
    return () => clearTimeout(timerid);
  });
  return (
    <>
      <div className="slideshow-container">
        {pics &&
          pics.map((pic, i) => (
            <div className="mySlides fade">
              <div className="numbertext">{(i + 1) / pics.length}</div>
              <img src={pic.url} alt="carousel_image" />
              <div className="text">{pic.title}</div>
            </div>
          ))}
      </div>
      <br />
      <div className="dot-group">
        {pics && pics.map((pic, i) => <span class="dot"></span>)}
      </div>
    </>
  );
}
