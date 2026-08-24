import React, { useEffect } from 'react';

export default function Alert({ type, message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`books-alert books-alert-${type}`}>
      <span>{message}</span>
      <button onClick={onClose}>x</button>
    </div>
  );
}
