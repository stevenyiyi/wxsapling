import React from "react";
import PropTypes from "prop-types";
import "./modal.css";
import "./confirm.css";
export default function Confirm(props) {
  const { show, message, onCancel, onOK } = props;
  return (
    <div className="modal" style={{ display: show ? "block" : "none" }}>
      <div className="modal-content">
        <div className="modal-body">
          <p>{message}</p>
          <div className="buts_content">
            <button onClick={onCancel}>终止</button>
            <button onClick={onOK}>确定</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Confirm.propTypes = {
  show: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onOK: PropTypes.func.isRequired
};

Confirm.defaultProps = {
  show: true,
  message:
    "fsdafadfadfafasdfasaffafasffsafasdfadfaasdfasdafsdafadfafafdafasffasdfafasf",
  onCancel: () => {},
  onOK: () => {}
};
