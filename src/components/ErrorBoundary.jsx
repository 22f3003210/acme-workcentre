import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          padding: "24px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
          <div style={{
            maxWidth: "500px",
            width: "100%",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #e2e8f0",
            padding: "32px",
            textAlign: "center"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              margin: "0 auto 16px auto"
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "24px" }}>
              An unanticipated error occurred while rendering the application.
            </p>
            {this.state.error && (
              <div style={{
                backgroundColor: "#f1f5f9",
                borderRadius: "6px",
                padding: "12px",
                fontSize: "0.75rem",
                color: "#334155",
                textAlign: "left",
                fontFamily: "monospace",
                overflowX: "auto",
                marginBottom: "24px"
              }}>
                {this.state.error.toString()}
              </div>
            )}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
