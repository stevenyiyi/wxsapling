import React from "react";
import PropTypes from "prop-types";
import "./as_tooltip.css";
const ASTooltip = (props) => {
  const { placement, delay, show, onClose, children } = props;
  const refThis = React.useRef();
  React.useEffect(() => {
    let timerId = 0;
    if (show) {
      refThis.current.classList.add("show");
      if (delay > 0) {
        timerId = setInterval(() => {
          onClose();
        }, delay);
      }
    } else {
      refThis.current.classList.remove("show");
    }
    return () => {
      if (timerId > 0) {
        clearInterval(timerId);
      }
    };
  }, [delay, show, onClose]);
  return (
    <div ref={refThis} className={`tooltiptext ${placement}`}>
      {children}
    </div>
  );
};

ASTooltip.propTypes = {
  placement: PropTypes.oneOf(["top", "bottom", "left", "right"]),
  delay: PropTypes.number.isRequired,
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

ASTooltip.defaultProps = {
  placement: "top",
  delay: 0,
  show: false,
  onClose: () => {}
};

export default ASTooltip;
