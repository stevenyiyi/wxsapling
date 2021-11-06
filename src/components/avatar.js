import React, { useEffect, useState } from "react";
import "./avatar.scss";
/**
 * A round avatar image with fallback to username's first letter
 */
export default function Avatar(props) {
  const {
    image,
    name = "",
    onClick = () => undefined,
    onMouseOver = () => undefined,
    shape = "circle",
    size = 32,
    position = "left"
  } = props;

  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [image]);

  const initials = (name?.toString() || "").charAt(0);

  return (
    <div
      className={`str-chat__avatar str-chat__avatar--${shape} str-chat__avatar--${position}`}
      data-testid="avatar"
      onClick={onClick}
      onMouseOver={onMouseOver}
      style={{
        flexBasis: `${size}px`,
        fontSize: `${size / 2}px`,
        height: `${size}px`,
        lineHeight: `${size}px`,
        width: `${size}px`
      }}
      title={name}
    >
      {image && !error ? (
        <img
          alt={initials}
          className={`str-chat__avatar-image${
            loaded ? " str-chat__avatar-image--loaded" : ""
          }`}
          data-testid="avatar-img"
          onError={() => setError(true)}
          onLoad={() => setLoaded(true)}
          src={image}
          style={{
            flexBasis: `${size}px`,
            height: `${size}px`,
            objectFit: "cover",
            width: `${size}px`
          }}
        />
      ) : (
        <div
          className="str-chat__avatar-fallback"
          data-testid="avatar-fallback"
        >
          {initials}
        </div>
      )}
    </div>
  );
}
