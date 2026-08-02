import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";

export default function Toast() {
  const { toast, setToast } = useApp();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!toast) {
      setIsClosing(false);
      return;
    }

    // Auto dismiss after 3.8s
    const timer = setTimeout(() => {
      handleClose();
    }, 3800);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setToast(null);
      setIsClosing(false);
    }, 250);
  };

  if (!toast) return null;

  const type = toast.type || "success";

  const renderIcon = () => {
    switch (type) {
      case "error":
        return (
          <div className="toast-icon-wrapper toast-icon-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="toast-icon-wrapper toast-icon-warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        );
      case "info":
        return (
          <div className="toast-icon-wrapper toast-icon-info">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
        );
      case "success":
      default:
        return (
          <div className="toast-icon-wrapper toast-icon-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        );
    }
  };

  const getTitle = () => {
    if (toast.title) return toast.title;
    switch (type) {
      case "error": return "Error";
      case "warning": return "Attention";
      case "info": return "Information";
      case "success":
      default:
        return "Success";
    }
  };

  return (
    <div
      className={`modern-toast-container ${isClosing ? "closing" : "opening"}`}
      role="alert"
      aria-live="assertive"
    >
      <div className={`modern-toast-card toast-${type}`}>
        {/* Status Indicator / Icon */}
        {renderIcon()}

        {/* Content */}
        <div className="toast-content-wrapper">
          <div className="toast-title-text">{getTitle()}</div>
          <div className="toast-message-text">{toast.message}</div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          className="toast-dismiss-btn"
          onClick={handleClose}
          aria-label="Dismiss notification"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Progress Bar Animation */}
        <div className={`toast-progress-bar bar-${type}`} />
      </div>
    </div>
  );
}
