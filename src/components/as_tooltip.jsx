import React from "react";
import PropTypes from "prop-types";
import "./as_tooltip.css";
const ASTooltip = React.forwardRef((props, refAnchor) => {
  const { placement, delay, show, onClose, children } = props;
  const refThis = React.useRef();

  React.useEffect(() => {
    console.log("add tooltip element to refAnchor!");
    refAnchor.current.classList.add("tooltip");
    refAnchor.current.appendChild(refThis.current);
  }, [refAnchor]);

  React.useEffect(() => {
    let timerId = 0;
    if (show) {
      refThis.current.classList.add("visible");
      if (delay > 0) {
        timerId = setTimeout(() => {
          onClose();
        }, delay);
      }
    } else {
      refThis.current.classList.remove("visible");
    }
    return () => {
      if (timerId > 0) {
        clearTimeout(timerId);
      }
    };
  }, [delay, show, onClose]);
  return (
    <div ref={refThis} className={`tooltiptext ${placement}`}>
      {children}
    </div>
  );
});

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
