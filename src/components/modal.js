import React from "react";
import { FaTimesCircle } from "react-icons/fa";
import { PropTypes } from "prop-types";
import "./modal.css";
export default function Modal(props) {
  const { title, show, onClose, children } = props;
  const refModal = React.useRef();
  React.useEffect(() => {
    if (show) {
      refModal.current.style.display = "block";
    } else {
      refModal.current.style.display = "none";
    }
  }, [show]);

  const handleCloseClick = (e) => {
    refModal.current.style.display = "none";
    onClose();
  };

  return (
    <div ref={refModal} className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <span className="close" onClick={handleCloseClick}>
            <FaTimesCircle />
          </span>
          <span style={{ fontSize: "20px" }}>{title}</span>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

Modal.defaultProps = {
  title: "班级修改",
  show: true,
  onClose: () => {}
};
