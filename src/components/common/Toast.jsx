import { useEffect } from "react";

export default function Toast({ message, type = "error", onClose, duration = 5000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="toast-stack">
      <div className={`toast toast-${type}`}>
        <span>{message}</span>
        <button className="toast-close" onClick={onClose} aria-label="Dismiss">×</button>
      </div>
    </div>
  );
}
