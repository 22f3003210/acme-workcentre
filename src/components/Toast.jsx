import React, { useEffect } from "react";
import { useApp } from "../context/AppContext";

export default function Toast() {
  const { toast, setToast } = useApp();

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast, setToast]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case "error":
        return "⚠️";
      case "warning":
        return "🔔";
      case "info":
        return "ℹ️";
      case "success":
      default:
        return "🏆";
    }
  };

  return (
    <div className={`toast-notification ${toast.type || "success"}`}>
      <span className="toast-icon">{getIcon()}</span>
      <p className="toast-message">{toast.message}</p>
      <button className="toast-close" onClick={() => setToast(null)}>×</button>
    </div>
  );
}
