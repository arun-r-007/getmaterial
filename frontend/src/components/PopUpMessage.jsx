import React, { useState, useEffect } from "react";
import "./PopUpMessage.css";

const PopUpMessage = ({ message, type, duration, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      onClose && onClose();
    }, duration || 3000); // Default duration: 3 seconds

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`popup-message ${type || "info"} ${visible ? "show" : ""}`}>
      {message}
    </div>
  );
};

export default PopUpMessage;
