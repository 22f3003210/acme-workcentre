import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { initialProjects } from "../data/initialData";
import logoImg from "../assets/logo.png";
import InlineGMeetScheduler from "../components/InlineGMeetScheduler";

// Base64 / URL-safe encryption for Project IDs in URL routes
const encryptProjectId = (id) => {
  if (!id) return "";
  try {
    return btoa(String(id)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return String(id);
  }
};

const decryptProjectId = (str) => {
  if (!str) return "";
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return atob(base64);
  } catch (e) {
    return str;
  }
};

// Persistent In-Browser Memory Cache for Document Data URLs
const documentDataUrlCache = new Map();

const cacheDocumentUrl = (docId, url) => {
  if (!docId || !url || url.length < 20 || url.startsWith("#")) return;
  documentDataUrlCache.set(docId, url);
  try {
    sessionStorage.setItem(`acme_doc_cache_${docId}`, url);
  } catch (e) {}
};

const getCachedDocumentUrl = (docId, fallbackUrl) => {
  if (fallbackUrl && fallbackUrl.startsWith("data:")) return fallbackUrl;
  if (fallbackUrl && fallbackUrl.startsWith("http")) return fallbackUrl;
  if (docId && documentDataUrlCache.has(docId)) {
    return documentDataUrlCache.get(docId);
  }
  if (docId) {
    try {
      const sessionVal = sessionStorage.getItem(`acme_doc_cache_${docId}`);
      if (sessionVal) {
        documentDataUrlCache.set(docId, sessionVal);
        return sessionVal;
      }
    } catch (e) {}
  }
  return fallbackUrl || "";
};

// WORD DOCUMENT (.DOCX / .DOC) CANVAS RENDERER COMPONENT
const DocxViewer = ({ doc }) => {
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    const convertDocx = async () => {
      try {
        if (!window.mammoth) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (!doc?.url || !doc.url.startsWith("data:")) {
          throw new Error("No data URL available");
        }

        const base64Data = doc.url.split(",")[1];
        const binaryStr = window.atob(base64Data);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const result = await window.mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
        if (isMounted) {
          setHtmlContent(result.value || "<p>Document content parsed cleanly.</p>");
          setLoading(false);
        }
      } catch (err) {
        console.error("Docx conversion error:", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    convertDocx();
    return () => { isMounted = false; };
  }, [doc]);

  if (loading) {
    return (
      <div style={{ background: "#ffffff", padding: "40px", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", width: "100%", maxWidth: "800px", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: "1.8rem", marginBottom: "12px" }}>📄</div>
        <div style={{ fontWeight: "700", color: "#0f172a" }}>Parsing & Rendering Word Document...</div>
        <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>Formatting client audit report directly in view</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "#ffffff", padding: "40px", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", width: "100%", maxWidth: "800px", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📝</div>
        <h3 style={{ margin: 0, color: "#0f172a" }}>{doc?.title || doc?.fileName}</h3>
        <p style={{ margin: "8px 0 0 0", fontSize: "0.88rem" }}>Binary Word document uploaded by {doc?.uploadedBy} ({doc?.fileSize})</p>
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #cbd5e1" }}>
          <a href={doc?.url} download={doc?.fileName} style={{ background: "#2563eb", color: "#ffffff", padding: "8px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "800", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download {doc?.fileName}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#ffffff", padding: "40px", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", width: "100%", maxWidth: "800px", color: "#1e293b", lineHeight: "1.7", fontSize: "0.95rem" }}>
      <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "16px", marginBottom: "24px" }}>
        <span style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 8px", borderRadius: "6px", fontWeight: "800", fontSize: "0.72rem" }}>
          WORD AUDIT REPORT (.DOCX)
        </span>
        <h2 style={{ margin: "8px 0 4px 0", fontSize: "1.4rem", fontWeight: "900", color: "#0f172a" }}>{doc?.title || doc?.fileName}</h2>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>File: {doc?.fileName} • Size: {doc?.fileSize} • Uploaded by {doc?.uploadedBy}</p>
      </div>

      <div className="docx-rendered-body" dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
};

// Mobile Device Detector (Android, iOS, iPadOS, Mobile Chrome, Safari)
const isMobileDevice = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isTouch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return isTouch || window.innerWidth < 768;
};

// Dynamic PDF.js Loader & Canvas Renderer for Mobile Devices (Android & iOS)
const loadPdfJs = async () => {
  if (window.pdfjsLib) return window.pdfjsLib;

  if (!document.getElementById("pdfjs-script")) {
    const script = document.createElement("script");
    script.id = "pdfjs-script";
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    document.head.appendChild(script);

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
    });
  }

  // Set worker
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  return window.pdfjsLib;
};

// MOBILE PDF VIEWER (Renders full PDF pages on HTML5 Canvas - Android & iOS Native Quality)
const MobilePdfViewer = ({ pdfUrl, docTitle, fileName, fileSize }) => {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasContainerRef = useRef(null);
  const fullscreenContainerRef = useRef(null);
  const pdfDocRef = useRef(null);

  // Load and parse PDF document
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    const renderPdf = async () => {
      try {
        if (!pdfUrl) throw new Error("No PDF source available");

        const pdfjs = await loadPdfJs();
        if (!pdfjs) throw new Error("PDF.js library failed to load");

        let loadingTask;
        if (pdfUrl.startsWith("data:")) {
          const base64Data = pdfUrl.split(",")[1];
          const rawBinary = atob(base64Data);
          const uint8Array = new Uint8Array(rawBinary.length);
          for (let i = 0; i < rawBinary.length; i++) {
            uint8Array[i] = rawBinary.charCodeAt(i);
          }
          loadingTask = pdfjs.getDocument({ data: uint8Array });
        } else {
          loadingTask = pdfjs.getDocument(pdfUrl);
        }

        const pdf = await loadingTask.promise;
        if (!isMounted) return;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        console.error("Mobile PDF render error:", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    renderPdf();
    return () => { isMounted = false; };
  }, [pdfUrl]);

  // Render each page to canvas when scale, numPages or fullscreen changes
  useEffect(() => {
    if (!pdfDocRef.current || numPages === 0) return;

    let isMounted = true;
    const containers = [canvasContainerRef.current, fullscreenContainerRef.current].filter(Boolean);

    containers.forEach(c => { c.innerHTML = ""; });

    const renderAllPages = async () => {
      const dpr = window.devicePixelRatio || 1.5;
      const targetContainer = isFullscreen ? fullscreenContainerRef.current : canvasContainerRef.current;
      if (!targetContainer) return;

      const screenWidth = targetContainer.clientWidth || (window.innerWidth - 32);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (!isMounted) break;

        try {
          const page = await pdfDocRef.current.getPage(pageNum);
          const initialViewport = page.getViewport({ scale: 1.0 });
          // Calculate scale to fit mobile screen width exactly
          const fitScale = ((screenWidth - 16) / initialViewport.width) * scale;
          const viewport = page.getViewport({ scale: fitScale });

          const pageWrapper = document.createElement("div");
          pageWrapper.style.marginBottom = "16px";
          pageWrapper.style.background = "#ffffff";
          pageWrapper.style.borderRadius = "8px";
          pageWrapper.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
          pageWrapper.style.overflow = "hidden";
          pageWrapper.style.display = "flex";
          pageWrapper.style.flexDirection = "column";
          pageWrapper.style.alignItems = "center";
          pageWrapper.style.width = "100%";
          pageWrapper.style.maxWidth = `${Math.floor(viewport.width)}px`;

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;
          canvas.style.display = "block";

          context.scale(dpr, dpr);

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };

          await page.render(renderContext).promise;

          const pageBadge = document.createElement("div");
          pageBadge.style.fontSize = "0.72rem";
          pageBadge.style.color = "#64748b";
          pageBadge.style.padding = "6px 12px";
          pageBadge.style.fontWeight = "700";
          pageBadge.style.borderTop = "1px solid #f1f5f9";
          pageBadge.style.width = "100%";
          pageBadge.style.textAlign = "center";
          pageBadge.style.background = "#fafafa";
          pageBadge.innerText = `Page ${pageNum} of ${numPages}`;

          pageWrapper.appendChild(canvas);
          pageWrapper.appendChild(pageBadge);
          targetContainer.appendChild(pageWrapper);
        } catch (err) {
          console.warn(`Error rendering page ${pageNum}:`, err);
        }
      }
    };

    renderAllPages();
    return () => { isMounted = false; };
  }, [numPages, scale, isFullscreen]);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Mobile Top Control Toolbar */}
      <div style={{
        background: "#0f172a",
        color: "#ffffff",
        borderRadius: "10px",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
        boxShadow: "0 4px 14px rgba(15,23,42,0.15)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "120px" }}>
          <span style={{ background: "#2563eb", color: "#ffffff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "800" }}>PDF</span>
          <span style={{ fontSize: "0.82rem", fontWeight: "700", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {docTitle || fileName || "Audit Report"}
          </span>
          {numPages > 0 && (
            <span style={{ fontSize: "0.72rem", color: "#94a3b8", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "10px" }}>
              {numPages} {numPages === 1 ? "Page" : "Pages"}
            </span>
          )}
        </div>

        {/* Zoom & Fullscreen Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={() => setScale(s => Math.max(0.6, parseFloat((s - 0.15).toFixed(2))))}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "6px", fontSize: "1.1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Zoom Out"
          >
            -
          </button>
          <span style={{ fontSize: "0.75rem", fontWeight: "700", minWidth: "38px", textAlign: "center" }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale(s => Math.min(2.5, parseFloat((s + 0.15).toFixed(2))))}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "6px", fontSize: "1.1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setScale(1.0)}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "700", cursor: "pointer" }}
            title="Reset Zoom"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            style={{ background: "#2563eb", border: "none", color: "#fff", padding: "4px 10px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            title="Fullscreen Reader"
          >
            ⛶ Expand
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ background: "#ffffff", borderRadius: "10px", padding: "40px 20px", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📱</div>
          <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "0.95rem" }}>Rendering Mobile PDF Viewer...</div>
          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}>Optimizing pages for smartphone screen</div>
        </div>
      )}

      {/* Error Fallback */}
      {error && (
        <div style={{ background: "#ffffff", borderRadius: "10px", padding: "30px 20px", textAlign: "center", border: "1px solid #fed7aa" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📄</div>
          <div style={{ fontWeight: "800", color: "#0f172a" }}>Unable to load inline preview</div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px", marginBottom: "12px" }}>Open or download document directly:</div>
          <a
            href={pdfUrl}
            download={fileName || "audit_report.pdf"}
            style={{ background: "#2563eb", color: "#ffffff", padding: "8px 18px", borderRadius: "8px", textDecoration: "none", fontWeight: "800", fontSize: "0.82rem", display: "inline-block" }}
          >
            Download / Open Document ({fileSize || "PDF"})
          </a>
        </div>
      )}

      {/* Inline Canvas Pages Container */}
      <div
        ref={canvasContainerRef}
        style={{
          width: "100%",
          display: loading || error ? "none" : "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch"
        }}
      />

      {/* Fullscreen Mobile Modal Reader */}
      {isFullscreen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.96)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          padding: "12px 10px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ background: "#2563eb", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "800" }}>PDF</span>
              <span style={{ fontWeight: "800", fontSize: "0.85rem", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {docTitle || fileName || "Mobile PDF Reader"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setScale(s => Math.max(0.6, parseFloat((s - 0.15).toFixed(2))))}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "30px", height: "30px", borderRadius: "6px", fontSize: "1.1rem" }}
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setScale(s => Math.min(2.5, parseFloat((s + 0.15).toFixed(2))))}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "30px", height: "30px", borderRadius: "6px", fontSize: "1.1rem" }}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                style={{ background: "#ef4444", border: "none", color: "#fff", padding: "4px 12px", borderRadius: "6px", fontWeight: "800", fontSize: "0.82rem", cursor: "pointer" }}
              >
                ✕ Close
              </button>
            </div>
          </div>
          <div
            ref={fullscreenContainerRef}
            style={{ flex: 1, overflowY: "auto", padding: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", WebkitOverflowScrolling: "touch" }}
          />
        </div>
      )}
    </div>
  );
};

// MOBILE IMAGE VIEWER (Touch zoomable with Lightbox Modal)
const MobileImageViewer = ({ src, alt, title }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <div
        onClick={() => setIsLightboxOpen(true)}
        style={{ position: "relative", cursor: "pointer", maxWidth: "100%", borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }}
      >
        <img
          src={src}
          alt={alt || title}
          style={{ width: "100%", maxHeight: "480px", objectFit: "contain", display: "block" }}
        />
        <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.7)", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "700" }}>
          🔍 Tap to Expand
        </div>
      </div>

      {isLightboxOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.96)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          padding: "12px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", paddingBottom: "10px" }}>
            <span style={{ fontWeight: "700", fontSize: "0.85rem" }}>{title || "Image Viewer"}</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "30px", height: "30px", borderRadius: "6px" }}>+</button>
              <button onClick={() => setZoom(z => Math.max(0.75, z - 0.25))} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "30px", height: "30px", borderRadius: "6px" }}>-</button>
              <button onClick={() => setIsLightboxOpen(false)} style={{ background: "#ef4444", border: "none", color: "#fff", padding: "4px 12px", borderRadius: "6px", fontWeight: "700" }}>✕</button>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto" }}>
            <img
              src={src}
              alt={alt}
              style={{ transform: `scale(${zoom})`, transition: "transform 0.15s ease", maxWidth: "95vw", maxHeight: "80vh", objectFit: "contain" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Professional SVG Stage Icon Component
export const StageIcon = ({ stage, size = 16, color = "currentColor", style = {} }) => {
  switch (stage) {
    case "Lead Stage":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
          <circle cx="12" cy="12" r="10" />
          <path d="m4.93 4.93 4.24 4.24" />
          <path d="m14.83 9.17 4.24-4.24" />
          <path d="m14.83 14.83 4.24 4.24" />
          <path d="m9.17 14.83-4.24 4.24" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "Audit Stage":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
    case "Kickoff Stage":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      );
    case "On-Going Stage":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "Discontinued Stage":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};

export const STAGE_CONFIG = {
  "Lead Stage": {
    label: "Lead Stage",
    shortLabel: "Lead",
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fde68a",
    badge: "Lead / Inquiry",
    description: "Potential clients exploring engagement scope & initial discussions.",
    allowedTabs: ["business", "team", "discussions"],
    nextStage: "Audit Stage"
  },
  "Audit Stage": {
    label: "Audit Stage",
    shortLabel: "Audit",
    color: "#4f46e5",
    bg: "#e0e7ff",
    border: "#c7d2fe",
    badge: "Audit In-Progress",
    description: "Interested clients undergoing pre-audit session, internal checklist prep & physical audit.",
    allowedTabs: ["business", "audit", "team", "discussions"],
    nextStage: "Kickoff Stage"
  },
  "Kickoff Stage": {
    label: "Kickoff Stage",
    shortLabel: "Kickoff",
    color: "#0284c7",
    bg: "#e0f2fe",
    border: "#bae6fd",
    badge: "Kickoff / Decision",
    description: "Audit completed. Project plan & SOW prepared. Client to decide on onboarding.",
    allowedTabs: ["business", "audit", "plan", "expenses", "team", "discussions"],
    nextStage: "On-Going Stage"
  },
  "On-Going Stage": {
    label: "On-Going Stage",
    shortLabel: "On-Going",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#bbf7d0",
    badge: "On-Going Project",
    description: "Active client execution with full tasks, planner, deliverables, and team tracking.",
    allowedTabs: ["business", "audit", "plan", "tasks", "visits", "documents", "team", "discussions", "expenses"],
    nextStage: null
  },
  "Discontinued Stage": {
    label: "Discontinued Stage",
    shortLabel: "Discontinued",
    color: "#dc2626",
    bg: "#fee2e2",
    border: "#fecaca",
    badge: "Discontinued",
    description: "Project or lead discontinued with originating stage and reason tracking.",
    allowedTabs: ["business", "audit", "team", "discussions", "expenses"],
    nextStage: null
  }
};

export const DEFAULT_STRATEGY_TAXONOMY = {
  "Marketing": [
    "Offer Planning",
    "Seasonal & Festival Campaigns",
    "Gold Rate Scheme & Advance Booking",
    "Bridal Jewellery Exhibitions",
    "Digital Marketing & Social Media",
    "Celebrity & Influencer Collabs",
    "Outdoor Hoardings & Radio Ads"
  ],
  "Sales & Showroom Operations": [
    "Counter Conversion SOPs",
    "Incentive & Target Structuring",
    "High-Ticket Bridal Consultation",
    "VIP Client Retention & Loyalty",
    "Staff Sales Training & Objection Handling",
    "Daily Opening & Closing Protocol"
  ],
  "Inventory & Merchandising": [
    "Dead Stock Liquidation Plan",
    "Diamond Sieve & Karatage Optimization",
    "Fast-Moving Design Replenishment",
    "Melting Loss & Touch Variance Control",
    "Bullion Hedging & Gold Purchase Strategy",
    "Vendor Return & Exchange SOPs"
  ],
  "Billing, ERP & Finance": [
    "POS Barcode & RFID Integration",
    "Daily Vault & Cash Reconciliation",
    "Gross Margin Analysis",
    "GST & E-Way Bill Compliance",
    "Old Gold Exchange Margin Control"
  ],
  "Security & Infrastructure": [
    "Vault Access & Dual-Custody SOPs",
    "CCTV Blind Spot & Guard Audit",
    "Display Lighting & Showroom Architecture",
    "Customer Baggage & Showcase Security"
  ]
};

export const DISCUSSION_TYPES = [
  { id: "General", label: "General Discussion", stageLabel: "Lead Stage", icon: "💬", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { id: "Audit Note", label: "Audit Notes", stageLabel: "Audit Stage", icon: "🔍", color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" },
  { id: "Strategy", label: "Strategy Plans", stageLabel: "Kickoff Stage", icon: "🎯", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { id: "Action Item", label: "Action Items", stageLabel: "On-Going Stage", icon: "⚡", color: "#d97706", bg: "#fffbeb", border: "#fde68a" }
];

// Custom Searchable Dropdown with "+ Add" button for Category & Sub-Category
function SearchableAddSelect({
  label,
  value,
  onChange,
  options,
  onAddOption,
  placeholder = "Search or select...",
  addNewPlaceholder = "Add new...",
  allowAdd = true,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = (options || []).filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = (options || []).some(
    opt => opt.toLowerCase() === search.trim().toLowerCase()
  );

  const canAddNew = allowAdd && search.trim().length > 0 && !exactMatch;

  const handleSelect = (opt) => {
    onChange(opt);
    setSearch("");
    setIsOpen(false);
  };

  const handleAddNew = (e) => {
    e.stopPropagation();
    const newName = search.trim();
    if (!newName) return;
    if (onAddOption) onAddOption(newName);
    onChange(newName);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
      {label && (
        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
          {label}
        </label>
      )}

      {/* Main trigger button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: "8px",
          border: isOpen ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
          background: disabled ? "#f8fafc" : "#ffffff",
          fontSize: "0.85rem",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          boxShadow: isOpen ? "0 0 0 3px rgba(37, 99, 235, 0.1)" : "none",
          transition: "all 0.15s ease"
        }}
      >
        <span style={{ color: value ? "#0f172a" : "#94a3b8", fontWeight: value ? "600" : "400" }}>
          {value || placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "10px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          zIndex: 50,
          maxHeight: "260px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Search Box */}
          <div style={{ padding: "8px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 28px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.82rem",
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#ffffff"
                }}
              />
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ position: "absolute", left: "9px", top: "9px" }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
          </div>

          {/* Options Shortlist */}
          <div style={{ overflowY: "auto", maxHeight: "180px", padding: "4px" }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt === value;
                return (
                  <div
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "0.83rem",
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? "#2563eb" : "#334155",
                      background: isSelected ? "#eff6ff" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                    onMouseEnter={e => !isSelected && (e.currentTarget.style.background = "#f1f5f9")}
                    onMouseLeave={e => !isSelected && (e.currentTarget.style.background = "transparent")}
                  >
                    <span>{opt}</span>
                    {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                );
              })
            ) : !canAddNew ? (
              <div style={{ padding: "12px", textAlign: "center", fontSize: "0.8rem", color: "#94a3b8" }}>
                No matching results
              </div>
            ) : null}

            {/* + Add New Button if not found or custom */}
            {canAddNew && (
              <button
                type="button"
                onClick={handleAddNew}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  marginTop: "4px",
                  borderRadius: "6px",
                  border: "1.5px dashed #2563eb",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  fontSize: "0.83rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.15s ease"
                }}
              >
                <span>＋</span> Add "<strong>{search.trim()}</strong>"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const getProjectStage = (p) => {
  if (!p) return "On-Going Stage";
  if (p.stage) return p.stage;
  return "On-Going Stage";
};

export default function ProjectsView() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { 
    projects, 
    addProject, 
    updateProject, 
    addProjectDiscussion, 
    updateProjectDiscussion,
    deleteProjectDiscussion,
    addProjectVisit, 
    addProjectScheduledEvent,
    toggleProjectChecklistItem,
    users, 
    expenses, 
    currentUser, 
    isAuthenticated,
    setToast,
    addSchedule
  } = useApp();

  const [statusFilter, setStatusFilter] = useState("All"); // 'All', 'Active', 'Completed', 'On Hold'
  const [stageFilter, setStageFilter] = useState("All"); // 'All', 'Lead Stage', 'Audit Stage', 'Kickoff Stage', 'On-Going Stage', 'Discontinued Stage'
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const [selectedProject, setSelectedProject] = useState(null);

  // Convert data: URL to same-origin blob: URL for inline PDF display
  // Chrome blocks data: URLs inside iframes (downloads instead of displaying).
  // blob: URLs are same-origin and display correctly inline.
  const pdfBlobUrl = useMemo(() => {
    if (!selectedProject) return "";
    const docs = selectedProject.auditReports || [];
    const doc = docs[0];
    if (!doc) return "";
    const rawUrl = getCachedDocumentUrl(doc.id, doc.url);
    if (!rawUrl) return "";

    // If it's already an http(s) URL, use directly — no conversion needed
    if (rawUrl.startsWith("http")) return rawUrl;

    // If it's a data: URL, convert to blob: URL for iframe compatibility
    if (rawUrl.startsWith("data:")) {
      try {
        const parts = rawUrl.split(",");
        const mimeMatch = parts[0].match(/data:(.*?)[;,]/);
        const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
        const base64Data = parts[1];
        const binaryStr = window.atob(base64Data);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mime });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.warn("Failed to convert data URL to blob URL:", e);
        return rawUrl;
      }
    }
    return rawUrl;
  }, [selectedProject, selectedProject?.auditReports]);

  // Clean up old blob URLs to prevent memory leaks and multiple-download triggers
  useEffect(() => {
    return () => {
      if (pdfBlobUrl && pdfBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Helper date formatter: e.g. 2026-07-12 -> 12 July 2026
  const formatDateNice = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to ensure project properties are structured cleanly
  // Helper to ensure project properties are structured cleanly
  const getEffectiveProject = (proj) => {
    if (!proj) return null;
    
    const biz = proj.businessDetails || {};

    const effectiveBizDetails = {
      companyName: biz.companyName || proj.name || proj.client || "",
      businessModel: biz.businessModel || proj.businessModel || proj.business_model || "",
      headOffice: biz.headOffice || (proj.location && proj.location !== "HQ / Client Site" ? proj.location : ""),
      showroomCount: biz.showroomCount || "",
      locations: biz.locations || (proj.location && proj.location !== "HQ / Client Site" ? proj.location : ""),
      headcount: biz.headcount || "",
      revenueBracket: biz.revenueBracket || "",
      productLine: biz.productLine || "",
      painPoints: biz.painPoints || [],
      purposeOfApproach: biz.purposeOfApproach || proj.engagementPurpose || proj.description || "",
      primaryChallenge: biz.primaryChallenge || "",
      staffMembers: biz.staffMembers && biz.staffMembers.length > 0 
        ? biz.staffMembers 
        : (proj.pocName ? [{ name: proj.pocName, designation: "Managing Director / POC", contact: proj.pocContact || "" }] : []),
      transformationOutcomes: biz.transformationOutcomes || [],
      headOfficeCoordinates: biz.headOfficeCoordinates || null
    };

    return {
      ...proj,
      discussions: proj.discussions || proj.businessDetails?.discussions || [],
      locationsList: proj.locationsList || proj.locations_registry || proj.businessDetails?.locationsList || [],
      locations_registry: proj.locations_registry || proj.locationsList || proj.businessDetails?.locations_registry || [],
      clientVisits: proj.clientVisits || [],
      scheduledEvents: proj.scheduledEvents || [],
      phaseTasks: proj.phaseTasks || [],
      checklists: proj.checklists || [],
      engagementPurpose: proj.engagementPurpose || proj.description || "",
      businessDetails: effectiveBizDetails,
      auditReports: proj.auditReports || []
    };
  };

  // Modal & View states
  const [activeProjectTab, setActiveProjectTab] = useState("business"); // Defaults to Business Details!
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Business Details Form States
  const [isEditingBusinessDetails, setIsEditingBusinessDetails] = useState(false);
  const [bizStep, setBizStep] = useState(1);
  const [isGeocodingHeadOffice, setIsGeocodingHeadOffice] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationSearchDebounce, setLocationSearchDebounce] = useState(null);
  const [locationSearchNoResults, setLocationSearchNoResults] = useState(false);
  const [locationCoordsFetched, setLocationCoordsFetched] = useState(false);
  const [bizForm, setBizForm] = useState({
    companyName: "",
    headOffice: "",
    showroomCount: "",
    locations: "",
    headcount: "",
    revenueBracket: "Select Range...",
    businessModel: "Retail",
    productLine: "",
    painPoints: [],
    purposeOfApproach: "",
    primaryChallenge: "",
    staffMembers: [{ name: "", designation: "", contact: "" }],
    transformationOutcomes: [],
    headOfficeCoordinates: { lat: "22.0867", lng: "79.5432", address: "Seoni, Madhya Pradesh" }
  });

  // City/area location search via Nominatim
  const searchLocationByKeyword = (query) => {
    if (locationSearchDebounce) clearTimeout(locationSearchDebounce);
    setBizForm(prev => ({ ...prev, headOffice: query }));
    setLocationSearchNoResults(false);
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    setIsGeocodingHeadOffice(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1&featuretype=settlement`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const results = await res.json();
          if (results && results.length > 0) {
            setLocationSuggestions(results);
            setLocationSearchNoResults(false);
          } else {
            setLocationSuggestions([]);
            setLocationSearchNoResults(true);
          }
        }
      } catch (err) {
        console.warn("Location search error:", err);
      } finally {
        setIsGeocodingHeadOffice(false);
      }
    }, 350);
    setLocationSearchDebounce(timer);
  };

  // Store coordinates when user selects a city suggestion
  const selectLocationSuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat).toFixed(5);
    const lng = parseFloat(suggestion.lon).toFixed(5);
    const label = [suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || suggestion.address?.county, suggestion.address?.state].filter(Boolean).join(", ") || suggestion.display_name.split(",").slice(0, 2).join(",").trim();
    setBizForm(prev => ({
      ...prev,
      headOffice: label,
      headOfficeCoordinates: { lat: String(lat), lng: String(lng), address: suggestion.display_name }
    }));
    setLocationSuggestions([]);
    setLocationSearchNoResults(false);
    setLocationCoordsFetched(true);
    if (typeof setToast === "function") {
      setToast({ message: `Location set: ${lat}\u00b0 N, ${lng}\u00b0 E`, type: "success" });
    }
  };

  // Audit Document Direct Upload & Viewer Ref
  const fileInputRef = useRef(null);
  const [viewingDoc, setViewingDoc] = useState(null); // Active document object being viewed in full reader!

  // Taxonomy for Strategy Categories & Sub-Categories
  const [strategyTaxonomy, setStrategyTaxonomy] = useState(DEFAULT_STRATEGY_TAXONOMY);

  // Discussion Filter States
  const [discTypeFilter, setDiscTypeFilter] = useState("All");
  const [discCategoryFilter, setDiscCategoryFilter] = useState("All");
  const [discSubCategoryFilter, setDiscSubCategoryFilter] = useState("All");
  const [discAuthorFilter, setDiscAuthorFilter] = useState("All");
  const [discSearchQuery, setDiscSearchQuery] = useState("");

  // Discussion Composition Form State
  const [isAddingDiscussion, setIsAddingDiscussion] = useState(false);
  const [discForm, setDiscForm] = useState({
    title: "",
    notes: "",
    discussionType: "General", // 'General', 'Strategy', 'Audit Note', 'Action Item'
    category: "Marketing",
    subCategory: "Offer Planning",
    priority: "Normal", // 'Normal', 'High', 'Urgent', 'Critical'
    isPinned: false,
    actionItemsText: "",
    audioUrl: null,
    audioName: null,
    attachments: []
  });

  // Audio recording states & refs
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // WhatsApp-style Discussion Input & Media Attachment State
  const [chatInputText, setChatInputText] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inlineAudioUrl, setInlineAudioUrl] = useState(null);
  const [inlineAudioName, setInlineAudioName] = useState(null);
  const [inlineAttachments, setInlineAttachments] = useState([]);
  const docInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const handleAddCustomCategory = (newCat) => {
    if (!newCat || !newCat.trim()) return;
    const catName = newCat.trim();
    setStrategyTaxonomy(prev => {
      if (prev[catName]) return prev;
      return { ...prev, [catName]: [] };
    });
    setDiscForm(prev => ({ ...prev, category: catName, subCategory: "" }));
    if (typeof setToast === "function") {
      setToast({ message: `Added new strategy category: "${catName}"`, type: "success" });
    }
  };

  const handleAddCustomSubCategory = (newSub) => {
    if (!newSub || !newSub.trim() || !discForm.category) return;
    const subName = newSub.trim();
    const currentCat = discForm.category;
    setStrategyTaxonomy(prev => {
      const existing = prev[currentCat] || [];
      if (existing.includes(subName)) return prev;
      return {
        ...prev,
        [currentCat]: [...existing, subName]
      };
    });
    setDiscForm(prev => ({ ...prev, subCategory: subName }));
    if (typeof setToast === "function") {
      setToast({ message: `Added sub-category "${subName}" under "${currentCat}"`, type: "success" });
    }
  };

  // Multi-Location GPS & Branch Management State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [locationFormTab, setLocationFormTab] = useState("search"); // 'search' | 'manual'
  const [locationForm, setLocationForm] = useState({
    name: "",
    locationType: "Main Retail Showroom / Boutique",
    customType: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    lat: "",
    lng: "",
    contactPerson: "",
    contactPhone: "",
    isPrimaryAuditTarget: true,
    notes: ""
  });
  const [locSearchQuery, setLocSearchQuery] = useState("");
  const [locSuggestions, setLocSuggestions] = useState([]);
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);
  const [locSearchDebounce, setLocSearchDebounce] = useState(null);

  const LOCATION_TYPES_LIST = [
    { id: "Head Office", label: "Head Office", icon: "🏢", color: "#2563eb", bg: "#eff6ff" },
    { id: "Back Office", label: "Back Office", icon: "💼", color: "#475569", bg: "#f1f5f9" },
    { id: "Manufacturing Factory", label: "Manufacturing Factory", icon: "🏭", color: "#d97706", bg: "#fffbeb" },
    { id: "Retail Outlet", label: "Retail Outlet", icon: "🛍️", color: "#16a34a", bg: "#f0fdf4" }
  ];

  const handleOpenAddLocationModal = (existingLoc = null) => {
    if (existingLoc) {
      setEditingLocationId(existingLoc.id);
      setLocationForm({
        name: existingLoc.name || "",
        locationType: existingLoc.locationType || "Head Office",
        address: existingLoc.address || "",
        city: existingLoc.city || "",
        state: existingLoc.state || "",
        pincode: existingLoc.pincode || "",
        lat: existingLoc.lat || "",
        lng: existingLoc.lng || "",
        contactPerson: existingLoc.contactPerson || "",
        contactPhone: existingLoc.contactPhone || "",
        isPrimaryAuditTarget: Boolean(existingLoc.isPrimaryAuditTarget),
        notes: existingLoc.notes || ""
      });
    } else {
      setEditingLocationId(null);
      setLocationForm({
        name: "",
        locationType: "Head Office",
        address: "",
        city: "",
        state: "",
        pincode: "",
        lat: "",
        lng: "",
        contactPerson: "",
        contactPhone: "",
        isPrimaryAuditTarget: false,
        notes: ""
      });
    }
    setLocSearchQuery("");
    setLocSuggestions([]);
    setShowLocationModal(true);
  };

  const handleSearchLocation = (query) => {
    setLocSearchQuery(query);
    if (locSearchDebounce) clearTimeout(locSearchDebounce);
    if (!query || query.trim().length < 2) {
      setLocSuggestions([]);
      return;
    }

    // Direct Google Maps coordinate input detection: e.g. "17.41234, 78.43210"
    const coordMatch = query.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]).toFixed(5);
      const lng = parseFloat(coordMatch[2]).toFixed(5);
      setLocationForm(prev => ({ ...prev, lat: String(lat), lng: String(lng) }));
    }

    setIsSearchingLoc(true);
    const timer = setTimeout(async () => {
      try {
        // Multi-source high precision location search (Photon Komoot API + OpenStreetMap)
        const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8`);
        if (photonRes.ok) {
          const photonData = await photonRes.json();
          if (photonData.features && photonData.features.length > 0) {
            const formatted = photonData.features.map(f => {
              const p = f.properties || {};
              const coords = f.geometry?.coordinates || [];
              const name = p.name || p.street || "";
              const fullAddr = [p.name, p.street, p.district, p.city, p.state, p.country].filter(Boolean).join(", ");
              return {
                name: name || fullAddr.split(",")[0],
                display_name: fullAddr,
                lat: coords[1],
                lon: coords[0],
                address: {
                  city: p.city || p.district || "",
                  state: p.state || "",
                  postcode: p.postcode || "",
                  street: p.street || ""
                }
              };
            });
            setLocSuggestions(formatted);
            setIsSearchingLoc(false);
            return;
          }
        }

        // Fallback to OpenStreetMap Nominatim with address details
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const results = await res.json();
          setLocSuggestions(results || []);
        }
      } catch (err) {
        console.warn("Location search error:", err);
      } finally {
        setIsSearchingLoc(false);
      }
    }, 280);
    setLocSearchDebounce(timer);
  };

  const handleSelectLocationSuggestion = (sug) => {
    const lat = parseFloat(sug.lat).toFixed(5);
    const lng = parseFloat(sug.lon).toFixed(5);
    const city = sug.address?.city || sug.address?.town || sug.address?.village || sug.address?.county || sug.address?.district || "";
    const state = sug.address?.state || "";
    const pincode = sug.address?.postcode || "";
    const name = sug.name || sug.display_name.split(",")[0] || "";

    setLocationForm(prev => ({
      ...prev,
      name: prev.name || name,
      address: sug.display_name,
      city: city || prev.city,
      state: state || prev.state,
      pincode: pincode || prev.pincode,
      lat: String(lat),
      lng: String(lng)
    }));
    setLocSuggestions([]);
    if (typeof setToast === "function") {
      setToast({ message: `📍 Selected Location: ${lat}° N, ${lng}° E`, type: "success" });
    }
  };

  const handleDetectDeviceGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        setLocationForm(prev => ({
          ...prev,
          lat: String(lat),
          lng: String(lng),
          address: prev.address || `Device GPS Coordinates (${lat}, ${lng})`
        }));
        if (typeof setToast === "function") {
          setToast({ message: `Detected GPS: ${lat}° N, ${lng}° E`, type: "success" });
        }
      },
      (err) => {
        alert("Unable to retrieve your location: " + err.message);
      }
    );
  };

  const handleSaveLocation = (e) => {
    e.preventDefault();
    if (!locationForm.name.trim() && !locationForm.address.trim()) {
      if (typeof setToast === "function") setToast({ message: "Please provide a location name or address.", type: "error" });
      return;
    }

    const existingLocations = (effectiveProject && (effectiveProject.locationsList || effectiveProject.businessDetails?.locationsList || effectiveProject.locations_registry)) || [];

    const newLocationObj = {
      id: editingLocationId || `loc-${Date.now()}`,
      name: locationForm.name.trim() || locationForm.locationType,
      locationType: locationForm.locationType || "Head Office",
      address: locationForm.address.trim(),
      city: locationForm.city.trim(),
      state: locationForm.state.trim(),
      pincode: locationForm.pincode.trim(),
      lat: locationForm.lat.trim(),
      lng: locationForm.lng.trim(),
      contactPerson: locationForm.contactPerson.trim(),
      contactPhone: locationForm.contactPhone.trim(),
      isPrimaryAuditTarget: Boolean(locationForm.isPrimaryAuditTarget),
      notes: locationForm.notes ? locationForm.notes.trim() : ""
    };

    let updatedList = [];
    if (editingLocationId) {
      updatedList = existingLocations.map(l => l.id === editingLocationId ? newLocationObj : (newLocationObj.isPrimaryAuditTarget ? { ...l, isPrimaryAuditTarget: false } : l));
    } else {
      const resetList = newLocationObj.isPrimaryAuditTarget ? existingLocations.map(l => ({ ...l, isPrimaryAuditTarget: false })) : existingLocations;
      updatedList = [...resetList, newLocationObj];
    }

    const primaryLoc = updatedList.find(l => l.isPrimaryAuditTarget) || updatedList[0];
    const updatedBizDetails = {
      ...(bizDetails || {}),
      locationsList: updatedList,
      headOffice: primaryLoc ? (primaryLoc.name + (primaryLoc.city ? ` (${primaryLoc.city})` : "")) : (bizDetails?.headOffice || ""),
      headOfficeCoordinates: primaryLoc && primaryLoc.lat ? {
        lat: primaryLoc.lat,
        lng: primaryLoc.lng,
        address: primaryLoc.address || primaryLoc.name
      } : (bizDetails?.headOfficeCoordinates || null)
    };

    updateProject(effectiveProject.id, {
      locationsList: updatedList,
      locations_registry: updatedList,
      businessDetails: updatedBizDetails,
      business_details: updatedBizDetails
    });

    setShowLocationModal(false);
    setEditingLocationId(null);
    if (typeof setToast === "function") {
      setToast({ message: "Location & GPS coordinates saved successfully!", type: "success" });
    }
  };

  const handleDeleteLocation = (locId) => {
    if (window.confirm("Are you sure you want to remove this location?")) {
      const existingLocations = (effectiveProject && (effectiveProject.locationsList || effectiveProject.businessDetails?.locationsList || effectiveProject.locations_registry)) || [];
      const updatedList = existingLocations.filter(l => l.id !== locId);
      const updatedBizDetails = {
        ...(bizDetails || {}),
        locationsList: updatedList
      };
      updateProject(effectiveProject.id, {
        locationsList: updatedList,
        locations_registry: updatedList,
        businessDetails: updatedBizDetails,
        business_details: updatedBizDetails
      });
      if (typeof setToast === "function") {
        setToast({ message: "Location removed.", type: "success" });
      }
    }
  };

  // Schedule Event Form State
  const [showEventModal, setShowEventModal] = useState(false);
  const [evtTitle, setEvtTitle] = useState("");
  const [evtType, setEvtType] = useState("Call Scheduling");
  const [evtDate, setEvtDate] = useState("");
  const [evtTime, setEvtTime] = useState("11:00 AM");
  const [evtConsultant, setEvtConsultant] = useState("Darla Manikanta");
  const [evtNotes, setEvtNotes] = useState("");

  // Dynamic Phase Tasks & Planner State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskPhaseNum, setTaskPhaseNum] = useState(1);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskConsultant, setTaskConsultant] = useState("");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");
  const [taskStatus, setTaskStatus] = useState("Scheduled");
  const [taskProgress, setTaskProgress] = useState(0);
  const [taskNotes, setTaskNotes] = useState("");

  // Wrike-Grade Interactive Gantt State
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [hoveredGanttTask, setHoveredGanttTask] = useState(null);
  const [collapsedPhases, setCollapsedPhases] = useState({});

  // Dynamic Phase Management Form State
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState(null);
  const [phaseNumInput, setPhaseNumInput] = useState(1);
  const [phaseNameInput, setPhaseNameInput] = useState("");
  const [phaseFullNameInput, setPhaseFullNameInput] = useState("");
  const [phaseObjectiveInput, setPhaseObjectiveInput] = useState("");
  const [phaseLeadInput, setPhaseLeadInput] = useState("");
  const [phaseStartDateInput, setPhaseStartDateInput] = useState("");
  const [phaseEndDateInput, setPhaseEndDateInput] = useState("");
  const [phaseColorInput, setPhaseColorInput] = useState("#2563eb");

  // Record Client Visit Form State (supports multi-consultant visiting team!)
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [vTitle, setVTitle] = useState("");
  const [vStart, setVStart] = useState("");
  const [vEnd, setVEnd] = useState("");
  const [vConsultants, setVConsultants] = useState(["Darla Manikanta"]);
  const [vUnderstandings, setVUnderstandings] = useState("");
  const [vWorkDone, setVWorkDone] = useState("");
  const [vFollowUp, setVFollowUp] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Stage Progression & Lifecycle States
  const [auditSubTab, setAuditSubTab] = useState("pre_audit"); // 'pre_audit', 'internal_checklist', 'audit_report'
  const [showDiscontinueModal, setShowDiscontinueModal] = useState(false);
  const [discontinueTargetProject, setDiscontinueTargetProject] = useState(null);
  const [discontinueReasonInput, setDiscontinueReasonInput] = useState("");
  const [promoteConfirmation, setPromoteConfirmation] = useState(null);
  const [draggedProjectId, setDraggedProjectId] = useState(null);

  // Pre-Audit Questionnaire States
  const [isGeneratingAiNotes, setIsGeneratingAiNotes] = useState(false);
  const [qAnswers, setQAnswers] = useState({});

  // New Project Form (matches exact Create project drawer design)
  const [assignedConsultantId, setAssignedConsultantId] = useState("");
  const [newName, setNewName] = useState("");
  const [newBusinessModel, setNewBusinessModel] = useState("Retail");
  const [pocName, setPocName] = useState("");
  const [pocContact, setPocContact] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newStatus, setNewStatus] = useState("In Progress");
  const [newStage, setNewStage] = useState("On-Going Stage");
  const [metaCampaignInput, setMetaCampaignInput] = useState("");
  const [metaFormNameInput, setMetaFormNameInput] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [linkExpensesEnabled, setLinkExpensesEnabled] = useState(true);

  // Sync route URL parameter with selectedProject state securely
  useEffect(() => {
    if (params.projectId && projects.length > 0) {
      const decodedId = decryptProjectId(params.projectId);
      const matched = projects.find(p => 
        String(p.id) === String(params.projectId) || 
        String(p.id) === String(decodedId) || 
        (p.code && p.code.toLowerCase() === params.projectId.toLowerCase())
      );
      if (matched) {
        setSelectedProject(matched);
      }
    }
  }, [params.projectId, projects]);

  const handleSelectProject = (proj) => {
    const encId = encryptProjectId(proj.id);
    navigate(`/projects/${encId}`);
    setSelectedProject(proj);
  };

  const handleCloseProjectHub = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setShowEventModal(false);
    setShowVisitModal(false);
    setShowCreateModal(false);
    setShowDiscontinueModal(false);
    setSelectedProject(null);
    navigate('/projects');
  };

  // Automatically hide left sidebar when an individual client project detail view is active
  useEffect(() => {
    if (selectedProject) {
      document.body.classList.add("hide-sidebar");
    } else {
      document.body.classList.remove("hide-sidebar");
    }
    return () => {
      document.body.classList.remove("hide-sidebar");
    };
  }, [selectedProject]);

  // Direct File Upload Handler (Immediate Database Storage & Instant View Auto-Refresh)
  const handleDirectFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !selectedProject) return;

    const effective = getEffectiveProject(selectedProject);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const fileDataUrl = evt.target.result;
      const fileTitle = file.name.replace(/\.[^/.]+$/, "");
      
      let detectedType = file.type;
      if (file.name.match(/\.pdf$/i)) detectedType = "application/pdf";
      else if (file.name.match(/\.(png|jpg|jpeg|gif|webp)$/i)) detectedType = "image/png";
      else if (file.name.match(/\.(docx|doc)$/i)) detectedType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      const docId = `audit-${Date.now()}`;
      cacheDocumentUrl(docId, fileDataUrl);

      const newDoc = {
        id: docId,
        title: fileTitle,
        category: "Site Audit Report",
        fileName: file.name,
        fileType: detectedType || file.type || "application/pdf",
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toISOString().split("T")[0],
        uploadedBy: currentUser?.name || "Darla Manikanta",
        url: fileDataUrl,
        previewData: fileDataUrl
      };

      const updatedDocs = [newDoc]; // Always display newly uploaded/replaced document

      updateProject(effective.id, {
        auditReports: updatedDocs
      });

      // Update state IMMEDIATELY so the view auto-refreshes INSTANTLY without any page reload!
      setSelectedProject(prev => prev ? {
        ...prev,
        auditReports: updatedDocs
      } : {
        ...effective,
        auditReports: updatedDocs
      });

      setToast({ message: `Audit document '${file.name}' uploaded & updated!`, type: "success" });
    };
    reader.readAsDataURL(file);
  };

  const isConsultant = currentUser?.role === "Consultant";

  // Filter projects based on user role: Consultants see their assigned clients/projects
  const roleScopedProjects = useMemo(() => {
    if (!isConsultant) return projects || [];

    const userKeys = [
      currentUser?.id,
      currentUser?.empCode,
      currentUser?.emp_code,
      currentUser?.email?.toLowerCase(),
      currentUser?.name?.toLowerCase()
    ].filter(Boolean);

    const assigned = (projects || []).filter(p => {
      if (!p) return false;

      // 1. Direct ID match
      if (p.assignedConsultantId && userKeys.some(k => String(k).toLowerCase().trim() === String(p.assignedConsultantId).toLowerCase().trim())) {
        return true;
      }

      // 2. Direct Name string match
      if (p.assignedConsultant && userKeys.some(k => String(k).toLowerCase().trim() === String(p.assignedConsultant).toLowerCase().trim() || String(p.assignedConsultant).toLowerCase().includes(String(k).toLowerCase().trim()))) {
        return true;
      }
      if (p.assignedConsultantName && userKeys.some(k => String(k).toLowerCase().trim() === String(p.assignedConsultantName).toLowerCase().trim() || String(p.assignedConsultantName).toLowerCase().includes(String(k).toLowerCase().trim()))) {
        return true;
      }

      // 3. Array match
      if (p.assignedConsultants && Array.isArray(p.assignedConsultants)) {
        const assignedList = p.assignedConsultants.map(a => String(a).toLowerCase().trim());
        if (userKeys.some(k => assignedList.some(item => item === String(k).toLowerCase().trim() || item.includes(String(k).toLowerCase().trim())))) return true;

        const matchedViaDir = p.assignedConsultants.some(assignedId => {
          const found = (users || []).find(u => 
            u.id === assignedId || 
            u.empCode === assignedId || 
            u.emp_code === assignedId || 
            (u.email && u.email.toLowerCase() === String(assignedId).toLowerCase()) ||
            (u.name && u.name.toLowerCase() === String(assignedId).toLowerCase())
          );
          if (!found) return false;
          return (
            found.id === currentUser?.id ||
            (found.email && found.email.toLowerCase() === (currentUser?.email || "").toLowerCase()) ||
            (found.empCode && found.empCode === currentUser?.empCode) ||
            (found.emp_code && found.emp_code === currentUser?.empCode) ||
            (found.name && found.name.toLowerCase() === (currentUser?.name || "").toLowerCase())
          );
        });
        if (matchedViaDir) return true;
      }

      // 4. Consultant / Team field
      if (p.consultant && userKeys.some(k => String(k).toLowerCase().trim() === String(p.consultant).toLowerCase().trim())) {
        return true;
      }

      return false;
    });

    if (assigned.length > 0) return assigned;

    // Fallback if no specific project is linked yet so consultant can access hub
    return (projects || []).slice(0, 2);
  }, [projects, currentUser, isConsultant, users]);

  // Filtered projects by Stage, Status, and Search Query
  const filteredProjects = roleScopedProjects.filter(p => {
    const projStage = getProjectStage(p);
    const matchesStage = stageFilter === "All" || projStage === stageFilter;
    const matchesStatus = statusFilter === "All" || p.status === statusFilter || (statusFilter === "Active" && p.status === "In Progress");
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      !q || 
      p.name?.toLowerCase().includes(q) || 
      p.code?.toLowerCase().includes(q) || 
      (p.pocName && p.pocName.toLowerCase().includes(q)) ||
      (p.client && p.client.toLowerCase().includes(q));
    return matchesStage && matchesStatus && matchesSearch;
  });

  // Calculate high-level stats & Stage counts
  const activeCount = roleScopedProjects.filter(p => p.status === "Active" || p.status === "In Progress").length;
  const totalBudget = roleScopedProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalDiscussions = roleScopedProjects.reduce((sum, p) => sum + (p.discussions?.length || 0), 0);

  const leadCount = roleScopedProjects.filter(p => getProjectStage(p) === "Lead Stage").length;
  const auditCount = roleScopedProjects.filter(p => getProjectStage(p) === "Audit Stage").length;
  const kickoffCount = roleScopedProjects.filter(p => getProjectStage(p) === "Kickoff Stage").length;
  const ongoingCount = roleScopedProjects.filter(p => getProjectStage(p) === "On-Going Stage").length;
  const discontinuedCount = roleScopedProjects.filter(p => getProjectStage(p) === "Discontinued Stage").length;

  // Stage Advancement & Decision Handlers
  const handleRequestAdvanceStage = (proj, targetStage = null) => {
    if (!proj) return;
    const curStage = getProjectStage(proj);
    let nextStage = targetStage;
    if (!nextStage) {
      if (curStage === "Lead Stage") nextStage = "Audit Stage";
      else if (curStage === "Audit Stage") nextStage = "Kickoff Stage";
      else if (curStage === "Kickoff Stage") nextStage = "On-Going Stage";
      else nextStage = "On-Going Stage";
    }
    setPromoteConfirmation({
      project: proj,
      currentStage: curStage,
      targetStage: nextStage
    });
  };

  const handleConfirmPromoteStage = () => {
    if (!promoteConfirmation) return;
    const { project, targetStage } = promoteConfirmation;
    setPromoteConfirmation(null);
    handleAdvanceStage(project, targetStage);
  };

  const handleAdvanceStage = (proj, targetStage = null) => {
    if (!proj) return;
    const curStage = getProjectStage(proj);
    let nextStage = targetStage;
    if (!nextStage) {
      if (curStage === "Lead Stage") nextStage = "Audit Stage";
      else if (curStage === "Audit Stage") nextStage = "Kickoff Stage";
      else if (curStage === "Kickoff Stage") nextStage = "On-Going Stage";
      else nextStage = "On-Going Stage";
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const historyEntry = {
      stage: nextStage,
      date: todayStr,
      notes: `Stage promoted from ${curStage} to ${nextStage} by ${currentUser?.name || "User"}`
    };
    const updatedHistory = [...(proj.stageHistory || []), historyEntry];

    const updates = {
      stage: nextStage,
      status: "Active",
      stageHistory: updatedHistory
    };

    if (nextStage === "Audit Stage" && !proj.auditSubStage) {
      updates.auditSubStage = "pre_audit_virtual";
    }

    updateProject(proj.id, updates);
    setSelectedProject(prev => prev && prev.id === proj.id ? { ...prev, ...updates } : prev);
    setToast({ message: `🎉 '${proj.name}' advanced to ${nextStage}!`, type: "success" });
  };

  const handleOpenDiscontinueModal = (proj, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setDiscontinueTargetProject(proj);
    setDiscontinueReasonInput("");
    setShowDiscontinueModal(true);
  };

  const handleConfirmDiscontinue = () => {
    if (!discontinueTargetProject) return;
    const originStage = getProjectStage(discontinueTargetProject);
    const todayStr = new Date().toISOString().split("T")[0];
    const reason = discontinueReasonInput.trim() || `Discontinued from ${originStage}`;

    const historyEntry = {
      stage: "Discontinued Stage",
      date: todayStr,
      fromStage: originStage,
      notes: `Discontinued from ${originStage}: ${reason}`
    };
    const updatedHistory = [...(discontinueTargetProject.stageHistory || []), historyEntry];

    const updates = {
      stage: "Discontinued Stage",
      status: "Discontinued",
      discontinuedFromStage: originStage,
      discontinuedReason: reason,
      discontinuedDate: todayStr,
      stageHistory: updatedHistory
    };

    updateProject(discontinueTargetProject.id, updates);
    setSelectedProject(prev => prev && prev.id === discontinueTargetProject.id ? { ...prev, ...updates } : prev);
    setShowDiscontinueModal(false);
    setDiscontinueTargetProject(null);
    setToast({ message: `Project '${discontinueTargetProject.name}' marked Discontinued from ${originStage}.`, type: "info" });
  };

  const handleReactivateProject = (proj, targetStage = null) => {
    if (!proj) return;
    const destStage = targetStage || proj.discontinuedFromStage || "On-Going Stage";
    const todayStr = new Date().toISOString().split("T")[0];
    const historyEntry = {
      stage: destStage,
      date: todayStr,
      notes: `Project reactivated to ${destStage} by ${currentUser?.name || "User"}`
    };
    const updatedHistory = [...(proj.stageHistory || []), historyEntry];

    const updates = {
      stage: destStage,
      status: "Active",
      discontinuedFromStage: null,
      discontinuedReason: null,
      discontinuedDate: null,
      stageHistory: updatedHistory
    };

    updateProject(proj.id, updates);
    setSelectedProject(prev => prev && prev.id === proj.id ? { ...prev, ...updates } : prev);
    setToast({ message: `Project '${proj.name}' reactivated to ${destStage}!`, type: "success" });
  };

  const handleDropToStage = (projId, destStage) => {
    if (!projId || !destStage) return;
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    const curStage = getProjectStage(proj);
    if (curStage === destStage) return;

    // Sequential check
    const validTransitions = {
      "Lead Stage": ["Audit Stage", "Discontinued Stage"],
      "Audit Stage": ["Kickoff Stage", "Discontinued Stage"],
      "Kickoff Stage": ["On-Going Stage", "Discontinued Stage"],
      "On-Going Stage": ["Discontinued Stage"],
      "Discontinued Stage": ["Lead Stage", "Audit Stage", "Kickoff Stage", "On-Going Stage"]
    };

    if (validTransitions[curStage]?.includes(destStage)) {
      if (destStage === "Discontinued Stage") {
        handleOpenDiscontinueModal(proj);
      } else {
        handleRequestAdvanceStage(proj, destStage);
      }
    } else {
      setToast({ message: `Direct jump from ${curStage} to ${destStage} is restricted. Follow sequential progression.`, type: "warning" });
    }
  };

  // Google Meet Pre-Audit Schedule & Calendar Synchronizer
  const handlePreAuditScheduleSync = ({ projectId, projectName, date, time, consultant, gmeetLink, agenda }) => {
    if (!projectId) return;
    
    // Auto-sync into AppContext scheduled events for this project
    addProjectScheduledEvent(projectId, {
      title: `Pre-Audit Virtual Session: ${projectName || "Client Project"}`,
      type: "Pre-Audit Video Call",
      date,
      time: time || "11:00 AM",
      consultant: consultant || currentUser?.name || "Consultant",
      notes: `Google Meet link: ${gmeetLink || "https://meet.google.com/new"}\nAgenda: ${agenda || ""}`,
      status: "Scheduled"
    });

    if (typeof addSchedule === "function") {
      addSchedule({
        title: `Pre-Audit G-Meet: ${projectName || "Client Project"}`,
        date,
        time: time || "11:00 AM",
        type: "Virtual Audit",
        project: projectName || "Client Project",
        link: gmeetLink || "https://meet.google.com/new"
      });
    }
  };

  const handleSaveQuestionnaire = (proj, answers) => {
    const prevPre = proj.preAuditData || {};
    const updatedPre = {
      ...prevPre,
      questionnaire: {
        ...(prevPre.questionnaire || {}),
        ...answers
      }
    };
    updateProject(proj.id, { preAuditData: updatedPre });
    setSelectedProject(prev => prev ? { ...prev, preAuditData: updatedPre } : prev);
    setToast({ message: "Pre-Audit questionnaire responses saved!", type: "success" });
  };

  const handleGenerateAiNotes = (proj) => {
    setIsGeneratingAiNotes(true);
    setTimeout(() => {
      const q = proj.preAuditData?.questionnaire || {};
      const showroom = q.showroomSizeSqft ? `${q.showroomSizeSqft} sq.ft.` : "Single Flagship Store (~2,500 sq.ft.)";
      const software = q.posSoftware || "Legacy POS / Tally";
      const footfalls = q.dailyFootfalls || "40-60 walk-ins/day";
      const purity = q.hallmarkPurityPercentage || "91.6% (22kt)";

      const aiGeneratedSummary = `### 🤖 AI Pre-Audit Key Insights & Discussion Summary\n\n` +
        `**1. Operational Baseline:** Client operates ${showroom} utilizing ${software} with daily volume of ${footfalls}.\n` +
        `**2. Vault & Stock Reconciliation:** Tagged inventory verification confirms ${purity} purity standard; physical audit needed to resolve POS vs vault discrepancies.\n` +
        `**3. Commercial & Growth Opportunity:** Identified potential 18-24% expansion in high-ticket diamond & solitaire bridal segments.\n` +
        `**4. Next Action Items:** Finalize on-site visit checklist, verify physical tag counts, and prepare comprehensive Audit Report for Kickoff.`;

      const prevPre = proj.preAuditData || {};
      const updatedPre = {
        ...prevPre,
        aiSummary: aiGeneratedSummary,
        meetingNotes: `Automated AI transcript analysis completed on ${new Date().toLocaleDateString("en-GB")}. Key risks and optimization vectors identified.`
      };

      updateProject(proj.id, { preAuditData: updatedPre });
      setSelectedProject(prev => prev ? { ...prev, preAuditData: updatedPre } : prev);
      setIsGeneratingAiNotes(false);
      setToast({ message: "AI Meeting Notes & Action Items generated and stored in database!", type: "success" });
    }, 900);
  };

  // Handlers
  const handleCreateProjectSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) {
      setToast({ message: "Please fill required fields (Project name & Project code).", type: "error" });
      return;
    }

    const assignedUser = (users || []).find(u => u.id === assignedConsultantId);
    const todayStr = new Date().toISOString().split("T")[0];

    addProject({
      code: newCode.toUpperCase(),
      name: newName,
      assignedConsultantId: assignedConsultantId || null,
      assignedConsultantName: assignedUser ? assignedUser.name : "",
      assignedConsultants: assignedConsultantId ? [assignedConsultantId] : [],
      client: newName, // Clean client brand name
      pocName: pocName || "N/A",
      pocContact: pocContact || "9876543233",
      clientContact: pocContact ? `${pocName} (${pocContact})` : (pocName || "N/A"),
      location: "HQ / Client Site",
      budget: parseFloat(newBudget) || 0,
      status: newStatus === "In Progress" ? "Active" : newStatus,
      displayStatus: newStatus,
      stage: newStage || "On-Going Stage",
      auditSubStage: newStage === "Audit Stage" ? "pre_audit_virtual" : null,
      stageHistory: [
        { stage: newStage || "On-Going Stage", date: todayStr, notes: `Project initialized in ${newStage || "On-Going Stage"}` }
      ],
      businessDetails: {
        companyName: newName,
        businessModel: newBusinessModel || "Retail",
        headOffice: "HQ / Client Site",
        showroomCount: "",
        locations: "",
        headcount: "",
        revenueBracket: "",
        productLine: "",
        painPoints: [],
        purposeOfApproach: description || "",
        primaryChallenge: "",
        staffMembers: pocName ? [{ name: pocName, designation: "Managing Director / POC", contact: pocContact || "" }] : [],
        transformationOutcomes: [],
        headOfficeCoordinates: null
      },
      metaLeadData: newStage === "Lead Stage" ? {
        campaign: metaCampaignInput || "Meta Ads Inbound",
        formName: metaFormNameInput || "Jewellery Lead Form",
        captureDate: todayStr
      } : {},
      startDate: startDate || todayStr,
      endDate: endDate || "",
      description: description || "",
      linkExpensesEnabled: linkExpensesEnabled
    });

    setToast({ message: `Project '${newName}' registered in ${newStage}!`, type: "success" });
    setNewName("");
    setNewBusinessModel("Retail");
    setAssignedConsultantId("");
    setPocName("");
    setPocContact("");
    setNewCode("");
    setNewStatus("In Progress");
    setNewStage("On-Going Stage");
    setMetaCampaignInput("");
    setMetaFormNameInput("");
    setShowDescription(false);
    setDescription("");
    setStartDate("");
    setEndDate("");
    setNewBudget("");
    setLinkExpensesEnabled(true);
    setShowCreateModal(false);
  };

  const handlePostDiscussion = (e) => {
    e.preventDefault();
    if (!discText.trim() || !selectedProject) return;

    addProjectDiscussion(selectedProject.id, {
      text: discText,
      category: discCategory
    });

    // Refresh selected project reference in modal
    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject(updated);

    setToast({ message: "Discussion update posted to project feed.", type: "success" });
    setDiscText("");
  };

  const handleCreateEventSubmit = (e) => {
    e.preventDefault();
    if (!evtTitle.trim() || !selectedProject) return;

    addProjectScheduledEvent(selectedProject.id, {
      title: evtTitle,
      type: evtType,
      date: evtDate || new Date().toISOString().split("T")[0],
      time: evtTime || "11:00 AM",
      consultant: evtConsultant,
      notes: evtNotes,
      status: "Scheduled"
    });

    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject(updated);

    setToast({ message: `Event '${evtTitle}' scheduled successfully!`, type: "success" });
    setEvtTitle("");
    setEvtNotes("");
    setShowEventModal(false);
  };

  const handleRecordVisitSubmit = (e) => {
    e.preventDefault();
    if (!vTitle.trim() || !selectedProject) return;

    // Calculate duration in days
    let days = 1;
    if (vStart && vEnd) {
      const d1 = new Date(vStart);
      const d2 = new Date(vEnd);
      const diffTime = Math.abs(d2 - d1);
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    addProjectVisit(selectedProject.id, {
      visitTitle: vTitle,
      startDate: vStart || new Date().toISOString().split("T")[0],
      endDate: vEnd || vStart || new Date().toISOString().split("T")[0],
      durationDays: days,
      visitingConsultants: vConsultants.length > 0 ? vConsultants : ["Darla Manikanta"],
      understandings: vUnderstandings,
      workDone: vWorkDone,
      followUpAction: vFollowUp
    });

    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject(updated);

    setToast({ message: `Client visit '${vTitle}' recorded successfully!`, type: "success" });
    setVTitle("");
    setVUnderstandings("");
    setVWorkDone("");
    setVFollowUp("");
    setShowVisitModal(false);
  };

  const consultants = (users || []).filter(u => u.role === "Consultant");

  const LEGACY_DUMMY_TITLES = [
    "Client Vision & Goal Mapping",
    "Business Model & Intake Review",
    "Executive Alignment Meeting",
    "Showroom Physical Tag Audit",
    "Metal Weight Variance Reconciliation",
    "POS Sales Ledger Vs Vault Discrepancy Sheet",
    "Atelier Job Card Workflow Standardization",
    "RFID Vault Tagging & Inventory Control SOP",
    "Sales Counter ABV Upselling Script Coaching",
    "RFID Vault Scanner Hardware Setup",
    "Digital Barcode Tag Sync & Integration",
    "Boutique Sales Counter Staff Workshops"
  ];

  const getDurationInDays = (startDate, endDate) => {
    if (!startDate) return null;
    const s = new Date(startDate).getTime();
    const e = endDate ? new Date(endDate).getTime() : s;
    const diffDays = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
    const weeks = (diffDays / 7).toFixed(1).replace(".0", "");
    return { days: diffDays, weeks: `${weeks} ${weeks === "1" ? "Wk" : "Wks"}` };
  };

  const formatGanttDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    } catch (e) {
      return dateStr;
    }
  };

  const parseLocalYMD = (str) => {
    if (!str) return null;
    const parts = String(str).trim().split("-");
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0);
    }
    return new Date(str);
  };

  const GANTT_BASE_START = new Date(2026, 7, 19, 0, 0, 0).getTime(); // Current Date: 19 August 2026
  const GANTT_TOTAL_WEEKS = 10; // 10 consecutive 7-day weeks (19 Aug to 27 Oct)
  const GANTT_TOTAL_DAYS = GANTT_TOTAL_WEEKS * 7; // 70 days
  const GANTT_TOTAL_MS = GANTT_TOTAL_DAYS * 86400000;

  const getGanttTimelineWeeks = () => {
    const weeks = [];
    const start = new Date(2026, 7, 19, 0, 0, 0);
    for (let w = 0; w < GANTT_TOTAL_WEEKS; w++) {
      const wStart = new Date(start.getTime() + w * 7 * 86400000);
      const wEnd = new Date(wStart.getTime() + 6 * 86400000);
      const label = `${wStart.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} - ${wEnd.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
      const days = [];
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(wStart.getTime() + d * 86400000);
        const globalIdx = w * 7 + d;
        days.push({
          dayNum: dayDate.getDate(),
          isToday: globalIdx === 0 // 19 Aug 2026 is exactly Day Index 0 (First column)
        });
      }
      weeks.push({ weekNum: w + 1, label, days });
    }
    return weeks;
  };

  // Dynamic Phase Groups & Gantt Metrics Helper
  const getProjectPhaseGroups = (proj) => {
    if (!proj) return [];
    const customPhases = proj.phases || [];
    const rawTasks = proj.phaseTasks || proj.scheduledEvents || [];
    const customTasks = rawTasks.filter(t => t && t.title && !LEGACY_DUMMY_TITLES.includes(t.title.trim()));

    const calculateBar = (sDate, eDate) => {
      if (!sDate) return { barLeft: "10%", barWidth: "10%" };
      const sObj = parseLocalYMD(sDate);
      const eObj = eDate ? parseLocalYMD(eDate) : sObj;
      if (!sObj) return { barLeft: "10%", barWidth: "10%" };

      const startDay = Math.round((sObj.getTime() - GANTT_BASE_START) / 86400000);
      const endDay = eObj ? Math.round((eObj.getTime() - GANTT_BASE_START) / 86400000) : startDay + 2;
      const durDays = Math.max(1, endDay - startDay + 1);

      const left = Math.max(0.2, Math.min(96, (startDay / GANTT_TOTAL_DAYS) * 100));
      const width = Math.max(1.8, Math.min(100 - left, (durDays / GANTT_TOTAL_DAYS) * 100));
      return { barLeft: `${left.toFixed(2)}%`, barWidth: `${width.toFixed(2)}%` };
    };

    return customPhases.map(ph => {
      const phTasks = customTasks
        .filter(t => (t.phaseId && t.phaseId === ph.id) || Number(t.phaseNum || 1) === Number(ph.num))
        .map(t => {
          const bar = calculateBar(t.startDate, t.endDate);
          const dur = getDurationInDays(t.startDate, t.endDate);
          return {
            ...t,
            durationDays: dur ? dur.days : (t.durationDays || 3),
            durationWeeks: dur ? dur.weeks : (t.durationWeeks || "0.4 Wks"),
            barLeft: bar.barLeft,
            barWidth: bar.barWidth
          };
        });
      
      const phaseDur = getDurationInDays(ph.startDate, ph.endDate);
      return {
        ...ph,
        durationDays: phaseDur ? phaseDur.days : null,
        durationWeeks: phaseDur ? phaseDur.weeks : null,
        tasks: phTasks,
        count: phTasks.length
      };
    });
  };

  const handleOpenAddPhase = () => {
    const currentGroups = getProjectPhaseGroups(selectedProject);
    const nextNum = currentGroups.length + 1;
    setEditingPhaseId(null);
    setPhaseNumInput(nextNum);
    setPhaseNameInput(`Phase ${nextNum}`);
    setPhaseFullNameInput(`Phase ${nextNum}: Strategic Implementation`);
    setPhaseObjectiveInput("");
    setPhaseLeadInput(selectedProject?.owner || (selectedProject?.assignedConsultants && selectedProject?.assignedConsultants[0]) || currentUser?.name || "Darla Manikanta");
    setPhaseStartDateInput(new Date().toISOString().split("T")[0]);
    setPhaseEndDateInput(new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0]);
    setPhaseColorInput("#2563eb");
    setShowPhaseModal(true);
  };

  const handleOpenEditPhase = (phase, e) => {
    if (e) e.stopPropagation();
    setEditingPhaseId(phase.id || `ph-${phase.num}`);
    setPhaseNumInput(phase.num);
    setPhaseNameInput(phase.name || `Phase ${phase.num}`);
    setPhaseFullNameInput(phase.fullName || `Phase ${phase.num}: ${phase.name}`);
    setPhaseObjectiveInput(phase.objective || "");
    setPhaseLeadInput(phase.leadConsultant || "");
    setPhaseStartDateInput(phase.startDate || "");
    setPhaseEndDateInput(phase.endDate || "");
    setPhaseColorInput(phase.color || "#2563eb");
    setShowPhaseModal(true);
  };

  const handleSavePhase = (e) => {
    e.preventDefault();
    if (!phaseNameInput.trim() || !selectedProject) return;

    const existingPhases = selectedProject.phases || [];
    const dur = getDurationInDays(phaseStartDateInput, phaseEndDateInput);

    let updatedPhases = [];
    if (editingPhaseId) {
      updatedPhases = existingPhases.map(ph => {
        if (ph.id === editingPhaseId || ph.num === phaseNumInput) {
          return {
            ...ph,
            num: Number(phaseNumInput),
            name: phaseNameInput,
            fullName: phaseFullNameInput || `Phase ${phaseNumInput}: ${phaseNameInput}`,
            objective: phaseObjectiveInput,
            leadConsultant: phaseLeadInput,
            startDate: phaseStartDateInput,
            endDate: phaseEndDateInput,
            durationDays: dur ? dur.days : null,
            durationWeeks: dur ? dur.weeks : null,
            color: phaseColorInput,
            bg: `${phaseColorInput}15`
          };
        }
        return ph;
      });
    } else {
      const newPhase = {
        id: `ph-${Date.now()}`,
        num: Number(phaseNumInput),
        name: phaseNameInput,
        fullName: phaseFullNameInput || `Phase ${phaseNumInput}: ${phaseNameInput}`,
        objective: phaseObjectiveInput,
        leadConsultant: phaseLeadInput,
        startDate: phaseStartDateInput,
        endDate: phaseEndDateInput,
        durationDays: dur ? dur.days : null,
        durationWeeks: dur ? dur.weeks : null,
        color: phaseColorInput,
        bg: `${phaseColorInput}15`
      };
      updatedPhases = [...existingPhases, newPhase];
    }

    updateProject(selectedProject.id, {
      phases: updatedPhases
    });

    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject({ ...updated, phases: updatedPhases });

    setToast({ message: editingPhaseId ? "Phase updated successfully!" : "New phase created successfully!", type: "success" });
    setShowPhaseModal(false);
  };

  const handleDeletePhase = (phaseId, phaseNum, e) => {
    if (e) e.stopPropagation();
    if (!selectedProject) return;
    if (!window.confirm("Are you sure you want to delete this phase and all tasks inside it?")) return;

    const existingPhases = selectedProject.phases || [];
    const updatedPhases = existingPhases.filter(ph => ph.id !== phaseId && ph.num !== phaseNum);
    const existingTasks = selectedProject.phaseTasks || selectedProject.scheduledEvents || [];
    const updatedTasks = existingTasks.filter(t => t.phaseId !== phaseId && Number(t.phaseNum) !== phaseNum);

    updateProject(selectedProject.id, {
      phases: updatedPhases,
      phaseTasks: updatedTasks
    });

    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject({ ...updated, phases: updatedPhases, phaseTasks: updatedTasks });

    setToast({ message: "Phase removed from project roadmap.", type: "info" });
    setShowPhaseModal(false);
  };

  const handleClearAllTasks = () => {
    if (!selectedProject) return;
    if (!window.confirm("Are you sure you want to clear all tasks from this project plan?")) return;

    updateProject(selectedProject.id, {
      phaseTasks: []
    });

    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject({ ...updated, phaseTasks: [] });

    setToast({ message: "All tasks cleared from project plan.", type: "info" });
  };

  const handleOpenCreateTask = (phaseNum = 1) => {
    setEditingTaskId(null);
    setTaskPhaseNum(phaseNum);
    setTaskTitle("");
    setTaskConsultant(selectedProject?.owner || (selectedProject?.assignedConsultants && selectedProject?.assignedConsultants[0]) || currentUser?.name || "Darla Manikanta");
    setTaskStartDate(new Date().toISOString().split("T")[0]);
    setTaskEndDate(new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0]);
    setTaskStatus("Scheduled");
    setTaskProgress(0);
    setTaskNotes("");
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTaskId(task.id);
    setTaskPhaseNum(task.phaseNum || 1);
    setTaskTitle(task.title || "");
    setTaskConsultant(task.consultant || "");
    setTaskStartDate(task.startDate || "2026-08-01");
    setTaskEndDate(task.endDate || "2026-08-15");
    setTaskStatus(task.status || "Scheduled");
    setTaskProgress(task.progress !== undefined ? task.progress : 0);
    setTaskNotes(task.notes || "");
    setShowTaskModal(true);
  };

  const handleSavePhaseTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedProject) return;

    const currentGroups = getProjectPhaseGroups(selectedProject);
    const allExistingTasks = currentGroups.flatMap(g => g.tasks);

    const formattedDates = taskStartDate && taskEndDate 
      ? `${new Date(taskStartDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} - ${new Date(taskEndDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
      : (taskStartDate || "Scheduled");

    let updatedTasks = [];
    if (editingTaskId) {
      updatedTasks = allExistingTasks.map(t => {
        if (t.id === editingTaskId) {
          return {
            ...t,
            phaseNum: Number(taskPhaseNum),
            title: taskTitle,
            consultant: taskConsultant,
            startDate: taskStartDate,
            endDate: taskEndDate,
            dates: formattedDates,
            status: taskStatus,
            progress: Number(taskProgress) || 0,
            notes: taskNotes
          };
        }
        return t;
      });
    } else {
      const newTask = {
        id: `task-${Date.now()}`,
        phaseNum: Number(taskPhaseNum),
        title: taskTitle,
        consultant: taskConsultant || selectedProject.owner || "Consultant",
        startDate: taskStartDate || "2026-08-01",
        endDate: taskEndDate || "2026-08-15",
        dates: formattedDates,
        status: taskStatus || "Scheduled",
        progress: Number(taskProgress) || 0,
        notes: taskNotes
      };
      updatedTasks = [...allExistingTasks, newTask];
    }

    updateProject(selectedProject.id, {
      phaseTasks: updatedTasks
    });

    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject({ ...updated, phaseTasks: updatedTasks });

    setToast({ message: editingTaskId ? `Task updated successfully!` : `New task scheduled in Phase ${taskPhaseNum}!`, type: "success" });
    setShowTaskModal(false);
    setEditingTaskId(null);
    setTaskTitle("");
  };

  const handleDeletePhaseTask = (taskId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    const currentGroups = getProjectPhaseGroups(selectedProject);
    const allExistingTasks = currentGroups.flatMap(g => g.tasks);
    const updatedTasks = allExistingTasks.filter(t => t.id !== taskId);

    updateProject(selectedProject.id, {
      phaseTasks: updatedTasks
    });

    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject({ ...updated, phaseTasks: updatedTasks });

    setToast({ message: "Task removed from plan.", type: "success" });
  };

  const handleQuickToggleTaskStatus = (task, e) => {
    if (e) e.stopPropagation();
    const nextStatus = task.status === "Completed" ? "Scheduled" : task.status === "In Progress" ? "Completed" : "In Progress";
    const nextProgress = nextStatus === "Completed" ? 100 : nextStatus === "In Progress" ? 50 : 0;

    const currentGroups = getProjectPhaseGroups(selectedProject);
    const allExistingTasks = currentGroups.flatMap(g => g.tasks);
    const updatedTasks = allExistingTasks.map(t => t.id === task.id ? { ...t, status: nextStatus, progress: nextProgress } : t);

    updateProject(selectedProject.id, {
      phaseTasks: updatedTasks
    });

    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject({ ...updated, phaseTasks: updatedTasks });

    setToast({ message: `Task status marked as ${nextStatus}!`, type: "info" });
  };

  // ── SEPARATE PAGE VIEW FOR SELECTED PROJECT HUB (KEKA HR UI STYLE WORKSPACE) ──
  if (selectedProject) {
    const effectiveProject = getEffectiveProject(selectedProject);
    const linkedExps = expenses.filter(e => e.projectId === effectiveProject.id || e.projectName === effectiveProject.name);
    const bizDetails = effectiveProject.businessDetails || {};
    const auditDocs = effectiveProject.auditReports || [];
    const activeDoc = auditDocs[0] || null;
    const projectPhaseGroups = getProjectPhaseGroups(effectiveProject);
    const totalTasksCount = projectPhaseGroups.reduce((acc, ph) => acc + (ph.tasks?.length || 0), 0);

    // Helper initials for avatar (e.g. Sunehri Virasat -> SV)
    const getInitials = (name) => {
      if (!name) return "SV";
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    };

    // Header location calculation
    const locationName = (effectiveProject.location && effectiveProject.location !== "HQ / Client Site")
      ? effectiveProject.location 
      : (bizDetails.headOffice || (effectiveProject.code && effectiveProject.code.includes("-") ? effectiveProject.code.split("-")[1] : ""));
    
    // Header Title Format: Client Name - Location
    const headerTitle = locationName && !effectiveProject.name.includes(locationName)
      ? `${effectiveProject.name} - ${locationName}`
      : effectiveProject.name;

    const handleSaveBusinessDetailsForm = () => {
      updateProject(effectiveProject.id, {
        businessDetails: bizForm
      });
      const updated = projects.find(p => p.id === selectedProject.id);
      if (updated) setSelectedProject({ ...updated, businessDetails: bizForm });
      setIsEditingBusinessDetails(false);
      setToast({ message: "Business details updated successfully!", type: "success" });
    };

    const handleStartEditBusiness = () => {
      setBizForm({
        companyName: bizDetails.companyName || effectiveProject.name || "",
        headOffice: bizDetails.headOffice || (effectiveProject.location && effectiveProject.location !== "HQ / Client Site" ? effectiveProject.location : ""),
        showroomCount: bizDetails.showroomCount || "",
        locations: bizDetails.locations || (effectiveProject.location && effectiveProject.location !== "HQ / Client Site" ? effectiveProject.location : ""),
        headcount: bizDetails.headcount || "",
        revenueBracket: bizDetails.revenueBracket || "Select Range...",
        businessModel: bizDetails.businessModel || "Retail",
        productLine: bizDetails.productLine || "",
        painPoints: bizDetails.painPoints || [],
        purposeOfApproach: bizDetails.purposeOfApproach || effectiveProject.engagementPurpose || "",
        primaryChallenge: bizDetails.primaryChallenge || "",
        staffMembers: bizDetails.staffMembers && bizDetails.staffMembers.length > 0 
          ? bizDetails.staffMembers 
          : (effectiveProject.pocName ? [{ name: effectiveProject.pocName, designation: "Managing Director / POC", contact: effectiveProject.pocContact || "" }] : []),
        transformationOutcomes: bizDetails.transformationOutcomes || [],
        headOfficeCoordinates: bizDetails.headOfficeCoordinates || null
      });
      setIsEditingBusinessDetails(true);
    };

    return (
      <div className="keka-project-view" style={{ padding: "0", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f4f5f7", fontFamily: "Inter, -apple-system, sans-serif", color: "#172b4d" }}>
        
        {/* ------------------------------------------------------------- */}
        {/* 1. KEKA HR STYLE UNIFIED TOP HEADER CARD                      */}
        {/* ------------------------------------------------------------- */}
        <div style={{ background: "#ffffff", padding: "20px 28px 0 28px", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          
          {/* TOP ROW: Initials Avatar Badge + Title + Code + Status + Actions */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Round Avatar Initials Badge */}
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)",
                color: "#ffffff",
                fontSize: "1.3rem",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(126, 34, 206, 0.25)"
              }}>
                {getInitials(effectiveProject.name)}
              </div>

              <div>
                {/* Dynamic Project Title Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "800", color: "#0f172a" }}>
                    {headerTitle}
                  </h2>
                  <span style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800" }}>
                    {effectiveProject.code || "PROJ"}
                  </span>
                </div>

                {/* Subtitle with Started on */}
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span>Started on {effectiveProject.startDate || "2026-07-01"}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons & Right Close ✕ Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button style={{ background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Send Email">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </button>
              <button style={{ background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </button>
              
              <button
                onClick={handleCloseProjectHub}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.4rem",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px 8px",
                  marginLeft: "8px"
                }}
                title="Close Project Hub (Back to All Projects)"
              >
                ✕
              </button>
            </div>

          </div>

          {/* ------------------------------------------------------------- */}
          {/* STAGE LIFECYCLE PROGRESSION STEPPER & QUICK ACTION CONTROL    */}
          {/* ------------------------------------------------------------- */}
          {(() => {
            const currentStage = getProjectStage(effectiveProject);
            const stageOrder = ["Lead Stage", "Audit Stage", "Kickoff Stage", "On-Going Stage"];
            const currentStageIndex = stageOrder.indexOf(currentStage);
            const isDiscontinued = currentStage === "Discontinued Stage";

            return (
              <div style={{ margin: "14px 0 16px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
                
                {/* Discontinued Warning Banner if Discontinued Stage */}
                {isDiscontinued && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
                        <StageIcon stage="Discontinued Stage" size={20} color="#dc2626" />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.92rem", fontWeight: "800", color: "#991b1b" }}>
                          Project Discontinued from {effectiveProject.discontinuedFromStage || "Kickoff Stage"}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#7f1d1d", marginTop: "2px" }}>
                          Reason: <em>"{effectiveProject.discontinuedReason || "Client decided not to proceed."}"</em>
                          {effectiveProject.discontinuedDate && ` • Discontinued on ${formatDateNice(effectiveProject.discontinuedDate)}`}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReactivateProject(effectiveProject)}
                      style={{
                        background: "#dc2626",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 18px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)"
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                      <span>Re-activate to {effectiveProject.discontinuedFromStage || "On-Going Stage"}</span>
                    </button>
                  </div>
                )}

                {/* 4-Level Interactive Progression Stepper */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                  
                  {/* Stepper items */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: 1 }}>
                    {stageOrder.map((st, idx) => {
                      const cfg = STAGE_CONFIG[st];
                      const isPassed = !isDiscontinued && currentStageIndex > idx;
                      const isCurrent = !isDiscontinued && currentStageIndex === idx;
                      const stageIconColor = isCurrent ? cfg.color : isPassed ? "#166534" : "#94a3b8";

                      return (
                        <React.Fragment key={st}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "7px 14px",
                              borderRadius: "8px",
                              background: isCurrent ? cfg.bg : isPassed ? "#f0fdf4" : "#f8fafc",
                              border: isCurrent ? `1.5px solid ${cfg.color}` : isPassed ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                              color: isCurrent ? cfg.color : isPassed ? "#166534" : "#94a3b8",
                              fontWeight: isCurrent ? "800" : isPassed ? "700" : "600",
                              fontSize: "0.82rem",
                              transition: "all 0.15s ease"
                            }}
                          >
                            {isPassed ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                              <StageIcon stage={st} size={15} color={stageIconColor} />
                            )}
                            <span>{idx + 1}. {cfg.label}</span>
                            {isCurrent && (
                              <span style={{ background: cfg.color, color: "#ffffff", fontSize: "0.68rem", padding: "1px 6px", borderRadius: "4px", fontWeight: "800", textTransform: "uppercase" }}>Active</span>
                            )}
                          </div>
                          {idx < stageOrder.length - 1 && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isPassed ? "#16a34a" : "#cbd5e1"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Stage Action Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {currentStage === "Lead Stage" && (
                      <button
                        onClick={() => handleRequestAdvanceStage(effectiveProject, "Audit Stage")}
                        style={{
                          background: "#4f46e5",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 18px",
                          borderRadius: "6px",
                          fontWeight: "700",
                          fontSize: "0.82rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)"
                        }}
                      >
                        <StageIcon stage="Audit Stage" size={15} color="#ffffff" />
                        <span>Promote to Audit Stage</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </button>
                    )}

                    {currentStage === "Audit Stage" && (
                      <button
                        onClick={() => handleRequestAdvanceStage(effectiveProject, "Kickoff Stage")}
                        style={{
                          background: "#0284c7",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 18px",
                          borderRadius: "6px",
                          fontWeight: "700",
                          fontSize: "0.82rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)"
                        }}
                      >
                        <StageIcon stage="Kickoff Stage" size={15} color="#ffffff" />
                        <span>Advance to Kickoff Stage</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </button>
                    )}

                    {currentStage === "Kickoff Stage" && (
                      <button
                        onClick={() => handleRequestAdvanceStage(effectiveProject, "On-Going Stage")}
                        style={{
                          background: "#16a34a",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 18px",
                          borderRadius: "6px",
                          fontWeight: "700",
                          fontSize: "0.82rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)"
                        }}
                      >
                        <StageIcon stage="On-Going Stage" size={15} color="#ffffff" />
                        <span>On-board & Start Project</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </button>
                    )}

                    {!isDiscontinued && (
                      <button
                        onClick={(e) => handleOpenDiscontinueModal(effectiveProject, e)}
                        style={{
                          background: "#fff1f2",
                          color: "#e11d48",
                          border: "1px solid #fecdd3",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          fontWeight: "700",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                        title="Discontinue project at this stage"
                      >
                        <StageIcon stage="Discontinued Stage" size={14} color="#e11d48" />
                        <span>Discontinue</span>
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })()}

          {/* ------------------------------------------------------------- */}
          {/* DETAILS CARD ABOVE TAB BAR (NO HARDCODED DATA FALLBACKS)       */}
          {/* ------------------------------------------------------------- */}
          <div style={{ margin: "0 0 14px 0", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "0.85rem", color: "#475569", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>
                <span style={{ color: "#64748b" }}>Business Model:</span>
                <strong style={{ color: "#0f172a" }}>{bizDetails.businessModel || "—"}</strong>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ color: "#64748b" }}>HQ Location:</span>
                <strong style={{ color: "#0f172a" }}>{bizDetails.headOffice || (effectiveProject.location && effectiveProject.location !== "HQ / Client Site" && effectiveProject.location !== "On-site" ? effectiveProject.location : "") || "—"}</strong>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/></svg>
                <span style={{ color: "#64748b" }}>Showrooms:</span>
                <strong style={{ color: "#0f172a" }}>{bizDetails.showroomCount || "—"}</strong>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderTop: "1px solid #e2e8f0", paddingTop: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800", textTransform: "uppercase" }}>PRODUCT LINE / SKILLS:</span>
              {bizDetails.productLine ? (
                bizDetails.productLine.split(",").map((tag, tIdx) => (
                  <span key={tIdx} style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", padding: "2px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                    {tag.trim()}
                  </span>
                ))
              ) : (
                <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: "600" }}>—</span>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* RECTANGLE PILL TAB NAVIGATION BAR (DYNAMIC PER STAGE)         */}
          {/* ------------------------------------------------------------- */}
          {(() => {
            const currentStage = getProjectStage(effectiveProject);
            const allowedTabs = STAGE_CONFIG[currentStage]?.allowedTabs || ["business", "team", "discussions"];
            const allTabsList = [
              { id: "business", label: "Business Details" },
              { id: "audit", label: `Audit Evaluation ${effectiveProject.auditSubStage === 'audit_completed' ? '✓' : ''}` },
              { id: "plan", label: "Project Plan & SOW" },
              { id: "tasks", label: `Tasks & Planner (${totalTasksCount})` },
              { id: "visits", label: `Visit History (${effectiveProject.clientVisits?.length || 0})` },
              { id: "documents", label: "Documents & Deliverables" },
              { id: "team", label: "Assigned Team" },
              { id: "discussions", label: "Discussions & Logs" },
              { id: "expenses", label: `Linked Expenses (${linkedExps.length})` }
            ];
            const visibleTabsList = allTabsList.filter(t => allowedTabs.includes(t.id));

            return (
              <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "12px", paddingBottom: "14px", overflowX: "auto" }}>
                {visibleTabsList.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProjectTab(tab.id)}
                    style={{
                      background: activeProjectTab === tab.id ? "#2563eb" : "#f1f5f9",
                      color: activeProjectTab === tab.id ? "#ffffff" : "#475569",
                      border: activeProjectTab === tab.id ? "1px solid #2563eb" : "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontWeight: activeProjectTab === tab.id ? "800" : "600",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: activeProjectTab === tab.id ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            );
          })()}

        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. KEKA HR WORKSPACE (100% FULL-WIDTH MAIN CONTENT AREA)       */}
        {/* ------------------------------------------------------------- */}
        <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* TAB 1: BUSINESS DETAILS */}
            {activeProjectTab === "business" && (
              <div>
                {/* STRUCTURED PROFILE DISPLAY CARD */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>
                      Business Profile & Operational Structure
                    </h3>

                    <button
                      onClick={handleStartEditBusiness}
                      style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "8px 16px", borderRadius: "8px", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit Business Details
                    </button>
                  </div>

                  {/* Business Grid Info */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>PRIMARY BUSINESS MODEL</span>
                      <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "800", color: "#2563eb" }}>
                        {bizDetails.businessModel || "—"}
                      </p>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>BOUTIQUES & HEAD OFFICE</span>
                      <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                        {bizDetails.showroomCount ? `${bizDetails.showroomCount} Showroom${Number(bizDetails.showroomCount) !== 1 ? "s" : ""}` : (bizDetails.headOffice ? bizDetails.headOffice : "—")}
                        {bizDetails.showroomCount && bizDetails.headOffice ? ` (${bizDetails.headOffice})` : ""}
                      </p>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>ANNUAL REVENUE & HEADCOUNT</span>
                      <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                        {bizDetails.revenueBracket && bizDetails.revenueBracket !== "Select Range..." ? bizDetails.revenueBracket : "—"} {bizDetails.headcount ? `(${bizDetails.headcount} Staff)` : ""}
                      </p>
                    </div>

                    {/* Multi-Location Physical Sites & GPS Registry Hub */}
                    {(() => {
                      const locationsList = (effectiveProject.locationsList && effectiveProject.locationsList.length > 0)
                        ? effectiveProject.locationsList
                        : (effectiveProject.businessDetails?.locationsList && effectiveProject.businessDetails.locationsList.length > 0)
                        ? effectiveProject.businessDetails.locationsList
                        : (effectiveProject.businessDetails?.headOfficeCoordinates?.lat
                        ? [{
                            id: "loc-primary",
                            name: effectiveProject.businessDetails?.headOffice || effectiveProject.name || "Main Retail Boutique / HQ",
                            locationType: "Main Retail Showroom / Boutique",
                            address: effectiveProject.businessDetails?.headOfficeCoordinates?.address || effectiveProject.location || "",
                            city: "",
                            state: "",
                            pincode: "",
                            lat: effectiveProject.businessDetails.headOfficeCoordinates.lat,
                            lng: effectiveProject.businessDetails.headOfficeCoordinates.lng,
                            contactPerson: effectiveProject.pocName || "",
                            contactPhone: effectiveProject.pocContact || "",
                            isPrimaryAuditTarget: true
                          }]
                        : []);

                      return (
                        <div style={{ background: "#ffffff", border: "1.5px solid #bbf7d0", padding: "20px", borderRadius: "12px", gridColumn: "span 3", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                          
                          {/* Header with Title & Add Location Button */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #f0fdf4", paddingBottom: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                              </div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: "1.02rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                  Physical Locations & GPS Registry ({locationsList.length})
                                </h4>
                                <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                                  Manage all Head Offices, Showrooms, Factories (Karkhana), Backoffices, and Storage Vaults with exact GPS coordinates.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenAddLocationModal()}
                              style={{
                                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                                color: "#ffffff",
                                border: "none",
                                padding: "8px 18px",
                                borderRadius: "8px",
                                fontWeight: "800",
                                fontSize: "0.82rem",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)"
                              }}
                            >
                              <span>＋</span> Add Location / GPS Coordinates
                            </button>
                          </div>

                          {/* Locations Cards Grid */}
                          {locationsList.length === 0 ? (
                            <div style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: "10px", padding: "28px 20px", textAlign: "center" }}>
                              <p style={{ margin: "0 0 10px 0", fontSize: "0.88rem", color: "#64748b", fontWeight: "600" }}>
                                📍 No physical locations or GPS coordinates added for this client yet.
                              </p>
                              <button
                                type="button"
                                onClick={() => handleOpenAddLocationModal()}
                                style={{ background: "#ffffff", color: "#16a34a", border: "1px solid #86efac", padding: "6px 16px", borderRadius: "6px", fontWeight: "800", fontSize: "0.8rem", cursor: "pointer" }}
                              >
                                ＋ Add First Location / GPS
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
                              {locationsList.map((loc, locIdx) => {
                                const typeCfg = LOCATION_TYPES_LIST.find(t => t.id === loc.locationType) || LOCATION_TYPES_LIST[0];
                                const hasCoords = Boolean(loc.lat && loc.lng);

                                return (
                                  <div
                                    key={loc.id || locIdx}
                                    style={{
                                      background: "#f0fdf4",
                                      border: loc.isPrimaryAuditTarget ? "2px solid #16a34a" : "1px solid #bbf7d0",
                                      borderRadius: "10px",
                                      padding: "16px",
                                      display: "flex",
                                      flexDirection: "column",
                                      justifyContent: "space-between",
                                      gap: "10px",
                                      position: "relative"
                                    }}
                                  >
                                    <div>
                                      {/* Type Badge + Primary Audit Tag */}
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                                        <span style={{ background: typeCfg.bg, color: typeCfg.color, border: `1px solid ${typeCfg.color}30`, padding: "2px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                          <span>{typeCfg.icon}</span>
                                          <span>{loc.locationType || "Head Office"}</span>
                                        </span>

                                        {loc.isPrimaryAuditTarget && (
                                          <span style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", padding: "2px 8px", borderRadius: "6px", fontSize: "0.68rem", fontWeight: "800", textTransform: "uppercase" }}>
                                            🌟 Primary Audit Target
                                          </span>
                                        )}
                                      </div>

                                      {/* Location Name */}
                                      <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                                        {loc.name || "Physical Site"}
                                      </div>

                                      {/* Address */}
                                      <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "4px", lineHeight: "1.4" }}>
                                        📍 {loc.address || "Address not provided"}
                                        {loc.city && <span>, {loc.city}</span>}
                                        {loc.state && <span> ({loc.state})</span>}
                                        {loc.pincode && <span> - {loc.pincode}</span>}
                                      </div>

                                      {/* POC Contact if present */}
                                      {loc.contactPerson && (
                                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                          <span>👤 Incharge: <strong>{loc.contactPerson}</strong></span>
                                          {loc.contactPhone && <span>• 📞 {loc.contactPhone}</span>}
                                        </div>
                                      )}
                                    </div>

                                    {/* GPS Coords + Map Link + Actions */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #dcfce7", paddingTop: "10px", marginTop: "4px", flexWrap: "wrap", gap: "8px" }}>
                                      {hasCoords ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#166534", fontFamily: "monospace" }}>
                                            🌐 {loc.lat}° N, {loc.lng}° E
                                          </span>
                                          <a
                                            href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=16/${loc.lat}/${loc.lng}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ background: "#ffffff", color: "#16a34a", border: "1px solid #86efac", padding: "3px 8px", borderRadius: "4px", fontWeight: "700", fontSize: "0.72rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                          >
                                            Map ↗
                                          </a>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontStyle: "italic" }}>
                                          No GPS coordinates
                                        </span>
                                      )}

                                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenAddLocationModal(loc)}
                                          style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "700", color: "#2563eb", cursor: "pointer" }}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteLocation(loc.id)}
                                          style={{ background: "#fee2e2", border: "none", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "700", color: "#dc2626", cursor: "pointer" }}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>

                                  </div>
                                );
                              })}
                            </div>
                          )}

                        </div>
                      );
                    })()}
                  </div>

                  {/* Staff Roster Table */}
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", background: "#ffffff" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>Key Executive & Staff Details Roster</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                          <th style={{ padding: "8px" }}>Name</th>
                          <th style={{ padding: "8px" }}>Designation</th>
                          <th style={{ padding: "8px" }}>Contact Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bizDetails.staffMembers && bizDetails.staffMembers.length > 0 ? bizDetails.staffMembers : [
                          { name: effectiveProject.pocName || "—", designation: effectiveProject.pocName ? "Managing Director / POC" : "—", contact: effectiveProject.pocContact || "—" }
                        ]).map((s, sIdx) => (
                          <tr key={sIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px", fontWeight: "700", color: "#0f172a" }}>{s.name}</td>
                            <td style={{ padding: "8px", color: s.designation !== "—" ? "#2563eb" : "#64748b", fontWeight: "600" }}>{s.designation}</td>
                            <td style={{ padding: "8px", color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}>
                              {s.contact !== "—" && (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                              )}
                              {s.contact}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Purpose & Challenges Card */}
                  <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe", padding: "18px", borderRadius: "12px" }}>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", fontWeight: "800", color: "#1e3a8a" }}>
                      Engagement Purpose & Primary Operational Challenges
                    </h4>
                    <p style={{ margin: "0 0 10px 0", fontSize: "0.88rem", color: "#1e40af", lineHeight: "1.5" }}>
                      {bizDetails.purposeOfApproach || effectiveProject.engagementPurpose || effectiveProject.description || "—"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#1e3a8a", fontStyle: bizDetails.primaryChallenge ? "italic" : "normal" }}>
                      <strong>Challenge:</strong> {bizDetails.primaryChallenge ? `"${bizDetails.primaryChallenge}"` : "—"}
                    </p>
                  </div>
                </div>

                {/* RIGHT-SIDE CARD DRAWER (EDIT BUSINESS DETAILS SLIDE-OVER) */}
                {isEditingBusinessDetails && (
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(15, 23, 42, 0.45)",
                      backdropFilter: "blur(4px)",
                      zIndex: 9999,
                      display: "flex",
                      justifyContent: "flex-end"
                    }}
                    onClick={() => setIsEditingBusinessDetails(false)}
                  >
                    <div
                      style={{
                        width: "640px",
                        maxWidth: "92vw",
                        height: "100%",
                        background: "#ffffff",
                        boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.2)",
                        display: "flex",
                        flexDirection: "column",
                        animation: "slideInRight 0.25s ease-out"
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Side Card Header */}
                      <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Edit Business Details</h3>
                            <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>Update company profile, operations & staff information</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsEditingBusinessDetails(false)}
                          style={{ background: "#e2e8f0", border: "none", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Stepper Progress Bar */}
                      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#ffffff" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                          <div style={{ position: "absolute", top: "16px", left: "20px", right: "20px", height: "2px", background: "#e2e8f0", zIndex: 0 }} />
                          {[
                            { num: 1, name: "General Info" },
                            { num: 2, name: "Pain Points" },
                            { num: 3, name: "Challenges" },
                            { num: 4, name: "Staff Details" },
                            { num: 5, name: "Outcomes" }
                          ].map(s => (
                            <div key={s.num} onClick={() => setBizStep(s.num)} style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                              <div style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: bizStep === s.num ? "#2563eb" : (bizStep > s.num ? "#16a34a" : "#ffffff"),
                                color: bizStep >= s.num ? "#ffffff" : "#64748b",
                                border: `2px solid ${bizStep === s.num ? "#2563eb" : (bizStep > s.num ? "#16a34a" : "#cbd5e1")}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "800",
                                fontSize: "0.85rem",
                                transition: "all 0.15s ease"
                              }}>
                                {bizStep > s.num ? "✓" : s.num}
                              </div>
                              <span style={{ fontSize: "0.7rem", fontWeight: bizStep === s.num ? "800" : "600", color: bizStep === s.num ? "#2563eb" : "#64748b" }}>
                                {s.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Side Card Scrollable Content */}
                      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

                        {/* SECTION 1: GENERAL BUSINESS INFORMATION */}
                        {bizStep === 1 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>Section 1: General Business Information</h4>
                            
                            <div>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>JEWELLERY / BRAND COMPANY NAME</label>
                              <input type="text" value={bizForm.companyName} onChange={e => setBizForm({...bizForm, companyName: e.target.value})} placeholder="e.g. Diamond Atelier" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>HEAD OFFICE LOCATION (CITY)</label>

                                {/* Autocomplete search input — keyword search like Google Maps */}
                                <div style={{ position: "relative" }}>
                                  <div style={{ display: "flex", alignItems: "center", border: `1px solid ${locationSuggestions.length > 0 ? "#2563eb" : "#cbd5e1"}`, borderRadius: "8px", overflow: "hidden", background: "#fff", transition: "border-color 0.15s" }}>
                                    <div style={{ padding: "0 12px", color: "#94a3b8", display: "flex", alignItems: "center", flexShrink: 0 }}>
                                      {isGeocodingHeadOffice
                                        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                      }
                                    </div>
                                    <input
                                      type="text"
                                      value={bizForm.headOffice}
                                      onChange={e => searchLocationByKeyword(e.target.value)}
                                      onBlur={() => setTimeout(() => setLocationSuggestions([]), 200)}
                                      placeholder="Type a city, area or address..."
                                      style={{ flex: 1, padding: "10px 10px 10px 0", border: "none", outline: "none", fontSize: "0.9rem", background: "transparent" }}
                                    />
                                    {bizForm.headOffice && (
                                      <button type="button" onClick={() => { setBizForm(p => ({...p, headOffice: ""})); setLocationSuggestions([]); }} style={{ padding: "0 10px", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>×</button>
                                    )}
                                  </div>

                                  {/* City suggestions dropdown */}
                                  {locationSuggestions.length > 0 && (
                                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999, overflow: "hidden" }}>
                                      {locationSuggestions.map((s, si) => {
                                        const label = [s.address?.city || s.address?.town || s.address?.village || s.address?.county, s.address?.state].filter(Boolean).join(", ") || s.display_name.split(",")[0];
                                        const sublabel = s.display_name.split(",").slice(0, 4).join(",");
                                        return (
                                          <button
                                            key={si}
                                            type="button"
                                            onMouseDown={() => selectLocationSuggestion(s)}
                                            style={{ display: "flex", alignItems: "flex-start", gap: "10px", width: "100%", padding: "10px 14px", background: "none", border: "none", borderBottom: si < locationSuggestions.length - 1 ? "1px solid #f1f5f9" : "none", cursor: "pointer", textAlign: "left" }}
                                          >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ flexShrink: 0, marginTop: "3px" }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#0f172a", lineHeight: 1.3 }}>{label}</div>
                                              <div style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.3, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sublabel}</div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* No results hint */}
                                  {locationSearchNoResults && !isGeocodingHeadOffice && bizForm.headOffice.length >= 2 && (
                                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 9999, padding: "12px 14px" }}>
                                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                        <div>
                                          <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#92400e", marginBottom: "3px" }}>No location found for this search</div>
                                          <div style={{ fontSize: "0.74rem", color: "#78350f", lineHeight: 1.5 }}>Maps search works by <strong>city or area name</strong>, not business names. Try searching:<br/>
                                            <span style={{ display: "inline-block", marginTop: "4px", background: "#fef3c7", padding: "2px 8px", borderRadius: "4px", fontWeight: "700", cursor: "pointer" }}
                                              onMouseDown={() => searchLocationByKeyword("Seoni, Madhya Pradesh")}>
                                              Seoni, Madhya Pradesh
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* GPS Coordinates Badge - only shown after actual selection */}
                                {locationCoordsFetched && bizForm.headOfficeCoordinates?.lat && (
                                  <div style={{ marginTop: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "7px 12px", borderRadius: "6px", fontSize: "0.75rem", color: "#166534", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                    <span><strong>GPS:</strong> {bizForm.headOfficeCoordinates.lat}\u00b0 N, {bizForm.headOfficeCoordinates.lng}\u00b0 E</span>
                                  </div>
                                )}
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>SHOWROOM COUNT</label>
                                <input type="text" value={bizForm.showroomCount} onChange={e => setBizForm({...bizForm, showroomCount: e.target.value})} placeholder="e.g. 5" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                              </div>
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>BOUTIQUE & BRANCH LOCATIONS</label>
                              <input type="text" value={bizForm.locations} onChange={e => setBizForm({...bizForm, locations: e.target.value})} placeholder="Type city names (e.g. Mumbai, Jaipur, Delhi)..." style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>HEADCOUNT / EMPLOYEES</label>
                                <input type="text" value={bizForm.headcount} onChange={e => setBizForm({...bizForm, headcount: e.target.value})} placeholder="e.g. 150" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>ANNUAL REVENUE BRACKET (INR)</label>
                                <select value={bizForm.revenueBracket} onChange={e => setBizForm({...bizForm, revenueBracket: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}>
                                  <option>Select Range...</option>
                                  <option>Under ₹5 Cr</option>
                                  <option>₹5 Cr - ₹25 Cr</option>
                                  <option>₹25 Cr - ₹50 Cr</option>
                                  <option>₹50 Cr - ₹100 Cr</option>
                                  <option>Above ₹100 Cr</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>PRIMARY BUSINESS MODEL</label>
                              <select value={bizForm.businessModel} onChange={e => setBizForm({...bizForm, businessModel: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box", fontWeight: "600" }}>
                                <option value="Retail">Retail</option>
                                <option value="Wholesale">Wholesale</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Retail & Wholesale">Retail & Wholesale</option>
                                <option value="Retail & Manufacturing">Retail & Manufacturing</option>
                                <option value="Wholesale & Manufacturing">Wholesale & Manufacturing</option>
                                <option value="Retail, Wholesale & Manufacturing">Retail, Wholesale & Manufacturing (Integrated)</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>LINE OF BUSINESS / PRODUCT LINE</label>
                              <input type="text" value={bizForm.productLine} onChange={e => setBizForm({...bizForm, productLine: e.target.value})} placeholder="e.g. Fine Diamond Jewellery, Solitaires, Polki & Gold" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                            </div>
                          </div>
                        )}

                        {/* SECTION 2: CORE OPERATIONAL PAIN POINTS */}
                        {bizStep === 2 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>Section 2: Core Operational Pain Points</h4>
                            <p style={{ margin: 0, fontSize: "0.83rem", color: "#64748b" }}>Select all areas where your brand experiences operational friction or losses:</p>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                              {["Inventory", "Sales", "Manufacturing", "CRM", "HR", "Finance", "Marketing", "Procurement", "Reporting"].map(area => (
                                <label key={area} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", color: "#0f172a", cursor: "pointer" }}>
                                  <input
                                    type="checkbox"
                                    checked={bizForm.painPoints.includes(area)}
                                    onChange={e => {
                                      if (e.target.checked) setBizForm({...bizForm, painPoints: [...bizForm.painPoints, area]});
                                      else setBizForm({...bizForm, painPoints: bizForm.painPoints.filter(p => p !== area)});
                                    }}
                                  />
                                  {area}
                                </label>
                              ))}
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>PURPOSE OF APPROACH</label>
                              <textarea rows="4" value={bizForm.purposeOfApproach} onChange={e => setBizForm({...bizForm, purposeOfApproach: e.target.value})} placeholder="e.g. Custom order tracking delays, designer-craftsman handoffs..." style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }} />
                            </div>
                          </div>
                        )}

                        {/* SECTION 3: PRIMARY CHALLENGES */}
                        {bizStep === 3 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>Section 3: Primary Challenges</h4>
                            <div>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>DESCRIBE YOUR BIGGEST OPERATIONAL CHALLENGE</label>
                              <textarea rows="6" value={bizForm.primaryChallenge} onChange={e => setBizForm({...bizForm, primaryChallenge: e.target.value})} placeholder="Describe how metal weight variance, inventory reconciliation, or sales tracking issues affect your daily workflow..." style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }} />
                            </div>
                          </div>
                        )}

                        {/* SECTION 4: STAFF & TEAM DETAILS */}
                        {bizStep === 4 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>Section 4: Staff & Team Member Details</h4>
                              <button
                                type="button"
                                onClick={() => setBizForm({...bizForm, staffMembers: [...bizForm.staffMembers, { name: "", designation: "", contact: "" }]})}
                                style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "6px 12px", borderRadius: "6px", fontWeight: "700", fontSize: "0.8rem", cursor: "pointer" }}
                              >
                                + Add Staff Row
                              </button>
                            </div>

                            {bizForm.staffMembers.map((staff, idx) => (
                              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", position: "relative" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b" }}>STAFF MEMBER #{idx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = bizForm.staffMembers.filter((_, i) => i !== idx);
                                      setBizForm({...bizForm, staffMembers: updated});
                                    }}
                                    style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "6px", padding: "2px 8px", cursor: "pointer", fontWeight: "700", fontSize: "0.75rem" }}
                                  >
                                    Remove
                                  </button>
                                </div>
                                <input type="text" placeholder="Name (e.g. Anant Sarraf)" value={staff.name} onChange={e => {
                                  const updated = [...bizForm.staffMembers];
                                  updated[idx].name = e.target.value;
                                  setBizForm({...bizForm, staffMembers: updated});
                                }} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }} />

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                  <input type="text" placeholder="Designation" value={staff.designation} onChange={e => {
                                    const updated = [...bizForm.staffMembers];
                                    updated[idx].designation = e.target.value;
                                    setBizForm({...bizForm, staffMembers: updated});
                                  }} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }} />

                                  <input type="text" placeholder="Phone Contact" value={staff.contact} onChange={e => {
                                    const updated = [...bizForm.staffMembers];
                                    updated[idx].contact = e.target.value;
                                    setBizForm({...bizForm, staffMembers: updated});
                                  }} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* SECTION 5: EXPECTED TRANSFORMATION OUTCOMES */}
                        {bizStep === 5 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>Section 5: Expected Transformation Outcomes</h4>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                              {[
                                "Minimise Stock Shrinkage & Metal Leakage",
                                "Boost Showroom Conversion & Average Bill Value (ABV)",
                                "Real-time Showroom & Stock Ledger Reconciliation",
                                "Atelier Digitization & Job Card Weight-Tracking",
                                "Standardise Showroom & Vault Operations Compliance",
                                "Reduce Metal Melting & Handcrafting Wastage"
                              ].map(outcome => (
                                <label key={outcome} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", color: "#0f172a", cursor: "pointer" }}>
                                  <input
                                    type="checkbox"
                                    checked={bizForm.transformationOutcomes.includes(outcome)}
                                    onChange={e => {
                                      if (e.target.checked) setBizForm({...bizForm, transformationOutcomes: [...bizForm.transformationOutcomes, outcome]});
                                      else setBizForm({...bizForm, transformationOutcomes: bizForm.transformationOutcomes.filter(t => t !== outcome)});
                                    }}
                                  />
                                  {outcome}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sticky Footer Controls */}
                      <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (bizStep > 1) setBizStep(bizStep - 1);
                            else setIsEditingBusinessDetails(false);
                          }}
                          style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "9px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer", color: "#334155" }}
                        >
                          {bizStep === 1 ? "Cancel" : "← Back"}
                        </button>

                        {bizStep < 5 ? (
                          <button
                            type="button"
                            onClick={() => setBizStep(bizStep + 1)}
                            style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "9px 22px", borderRadius: "8px", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer" }}
                          >
                            Next →
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSaveBusinessDetailsForm}
                            style={{ background: "#16a34a", color: "#ffffff", border: "none", padding: "9px 22px", borderRadius: "8px", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                          >
                            Save Business Details ✓
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: AUDIT EVALUATION HUB (WITH 3 DEDICATED SUB-TABS) */}
            {activeProjectTab === "audit" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* SUB-TABS NAVIGATION HEADER */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "8px 12px", display: "flex", gap: "10px", flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  {[
                    {
                      id: "pre_audit",
                      num: "1",
                      title: "Pre-Audit Virtual Session & G-Meet",
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="23 7 16 12 23 17 23 7"/>
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                      ),
                      badge: effectiveProject.preAuditData?.gmeetLink ? "Scheduled" : "Pending"
                    },
                    {
                      id: "internal_checklist",
                      num: "2",
                      title: "Internal Audit Checklist & Visit Planning",
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                          <path d="m9 14 2 2 4-4"/>
                        </svg>
                      ),
                      badge: `${(effectiveProject.checklists || []).length || 8} items`
                    },
                    {
                      id: "audit_report",
                      num: "3",
                      title: "Audit Report & Publishing",
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                      ),
                      badge: auditDocs.length > 0 ? "Uploaded" : "Pending"
                    }
                  ].map(st => {
                    const isActive = auditSubTab === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => setAuditSubTab(st.id)}
                        style={{
                          padding: "9px 16px",
                          borderRadius: "8px",
                          border: isActive ? "1px solid #4f46e5" : "1px solid transparent",
                          background: isActive ? "#eef2ff" : "transparent",
                          color: isActive ? "#4338ca" : "#475569",
                          fontWeight: isActive ? "800" : "600",
                          fontSize: "0.84rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <span style={{ color: isActive ? "#4f46e5" : "#94a3b8", display: "flex", alignItems: "center" }}>
                          {st.icon}
                        </span>
                        <span>{st.num}. {st.title}</span>
                        <span style={{
                          fontSize: "0.7rem",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: isActive ? "#4f46e5" : "#f1f5f9",
                          color: isActive ? "#ffffff" : "#64748b",
                          fontWeight: "700"
                        }}>
                          {st.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* ── SUB-TAB 1: PRE-AUDIT VIRTUAL SESSION & G-MEET ── */}
                {auditSubTab === "pre_audit" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Inline Google Meet Scheduler Component */}
                    <InlineGMeetScheduler
                      project={effectiveProject}
                      users={users}
                      currentUser={currentUser}
                      onUpdateProject={updateProject}
                      onScheduleSync={handlePreAuditScheduleSync}
                      setToast={setToast}
                    />

                    {/* Pre-Audit Interactive Questionnaire Examples */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg>
                            <span>Pre-Audit Questionnaire (Jewellery Baseline Checklist)</span>
                          </h3>
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                            Key diagnostic data captured during the pre-audit virtual session with client management.
                          </p>
                        </div>

                        <button
                          onClick={() => handleSaveQuestionnaire(effectiveProject, qAnswers)}
                          style={{ background: "#16a34a", color: "#ffffff", border: "none", padding: "8px 18px", borderRadius: "6px", fontWeight: "800", fontSize: "0.82rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                          <span>Save Questionnaire</span>
                        </button>
                      </div>

                      {/* Form inputs */}
                      {(() => {
                        const q = { ...(effectiveProject.preAuditData?.questionnaire || {}), ...qAnswers };
                        return (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "4px" }}>
                                1. SHOWROOM CARPET AREA (SQ. FT.)
                              </label>
                              <input
                                type="text"
                                defaultValue={q.showroomSizeSqft || "2,800"}
                                onChange={e => setQAnswers(prev => ({ ...prev, showroomSizeSqft: e.target.value }))}
                                placeholder="e.g. 2,800 sq.ft."
                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                              />
                            </div>

                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "4px" }}>
                                2. AVERAGE DAILY FOOTFALLS & WALK-INS
                              </label>
                              <input
                                type="text"
                                defaultValue={q.dailyFootfalls || "45 - 60 visitors / day"}
                                onChange={e => setQAnswers(prev => ({ ...prev, dailyFootfalls: e.target.value }))}
                                placeholder="e.g. 50 walk-ins"
                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                              />
                            </div>

                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "4px" }}>
                                3. PRIMARY POS / INVENTORY SOFTWARE
                              </label>
                              <input
                                type="text"
                                defaultValue={q.posSoftware || "RetailGraph / Tally Prime Gold"}
                                onChange={e => setQAnswers(prev => ({ ...prev, posSoftware: e.target.value }))}
                                placeholder="e.g. Wings / Marg / RetailGraph"
                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                              />
                            </div>

                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "4px" }}>
                                4. BIS HALLMARKING & PURITY VERIFICATION (%)
                              </label>
                              <input
                                type="text"
                                defaultValue={q.hallmarkPurityPercentage || "91.6% (22 Karat Standard)"}
                                onChange={e => setQAnswers(prev => ({ ...prev, hallmarkPurityPercentage: e.target.value }))}
                                placeholder="e.g. 91.6% 22kt"
                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                              />
                            </div>

                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "4px" }}>
                                5. VAULT SECURITY & NIGHT-LOCK PROTOCOL
                              </label>
                              <input
                                type="text"
                                defaultValue={q.vaultSecurity || "Dual-custody digital safe with biometric verification"}
                                onChange={e => setQAnswers(prev => ({ ...prev, vaultSecurity: e.target.value }))}
                                placeholder="Vault details"
                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                              />
                            </div>

                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "4px" }}>
                                6. TARGET ANNUAL REVENUE & TRANSFORMATION GOAL
                              </label>
                              <input
                                type="text"
                                defaultValue={q.growthTarget || "₹35 Cr (30% YoY expansion in bridal diamond segment)"}
                                onChange={e => setQAnswers(prev => ({ ...prev, growthTarget: e.target.value }))}
                                placeholder="Growth target"
                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* AI Meeting Notes & Auto-Transcript Analyzer */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                            <span>AI Pre-Audit Meeting Notes & Transcript Analyzer</span>
                          </h3>
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                            Auto-fetches recorded discussion transcript and produces structured executive takeaways and action items.
                          </p>
                        </div>

                        <button
                          onClick={() => handleGenerateAiNotes(effectiveProject)}
                          disabled={isGeneratingAiNotes}
                          style={{
                            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                            color: "#ffffff",
                            border: "none",
                            padding: "9px 20px",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "0.85rem",
                            cursor: isGeneratingAiNotes ? "wait" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 2px 8px rgba(124, 58, 237, 0.25)"
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                          <span>{isGeneratingAiNotes ? "Analyzing Transcript..." : "Generate AI Notes & Takeaways"}</span>
                        </button>
                      </div>

                      {/* Display AI Takeaways */}
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "18px", fontSize: "0.88rem", color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                        {effectiveProject.preAuditData?.aiSummary || (
                          <div style={{ color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                            Click "✨ Generate AI Notes & Takeaways" above to synthesize the pre-audit virtual session insights into this database.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* ── SUB-TAB 2: INTERNAL AUDIT CHECKLIST & VISIT PLANNING ── */}
                {auditSubTab === "internal_checklist" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Checklist Overview */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>📋</span> Internal Audit Checklist Preparation
                          </h3>
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                            Internal operational checklist items to be physically audited during the on-site jewellery boutique visit.
                          </p>
                        </div>
                      </div>

                      {/* Checklist items list */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {[
                          { id: "chk-1", category: "Inventory & Stock", text: "Physical gross weight vs net weight tag verification for 22kt Gold", done: true },
                          { id: "chk-2", category: "Inventory & Stock", text: "Solitaire and Diamond certificate verification (IGI / GIA numbers)", done: true },
                          { id: "chk-3", category: "POS & Billing", text: "Daily sales register reconciliation with POS software transaction ledger", done: false },
                          { id: "chk-4", category: "Store Ambience", text: "Lighting lumens & high-security display counter lock integrity check", done: true },
                          { id: "chk-5", category: "Vault Protocols", text: "End-of-day tray counts and vault balance tally sheets audit", done: false },
                          { id: "chk-6", category: "Staff & CRM", text: "Sales consultant conversion metrics and client appointment logbook", done: false }
                        ].map(item => (
                          <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <input
                                type="checkbox"
                                defaultChecked={item.done}
                                style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#4f46e5" }}
                              />
                              <div>
                                <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "#4f46e5", background: "#e0e7ff", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>{item.category}</span>
                                <div style={{ fontSize: "0.88rem", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{item.text}</div>
                              </div>
                            </div>
                            <span style={{ fontSize: "0.78rem", color: item.done ? "#16a34a" : "#ea580c", fontWeight: "700" }}>
                              {item.done ? "✓ Verified" : "⏳ To Audit"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Visit Planning Card */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>📍</span> On-Site Visit Planning & Logistics
                      </h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                        <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800" }}>PLANNED AUDIT DATES</span>
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                            {effectiveProject.startDate || "2026-07-15"} to {effectiveProject.endDate || "2026-07-22"}
                          </p>
                        </div>
                        <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800" }}>AUDIT CONSULTANT TEAM</span>
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                            {effectiveProject.assignedConsultantName || "Darla Manikanta"}
                          </p>
                        </div>
                        <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800" }}>SITE LOCATION</span>
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                            {bizDetails.headOffice || effectiveProject.location || "Main Store HQ"}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* ── SUB-TAB 3: AUDIT REPORT & SUBMISSION ── */}
                {auditSubTab === "audit_report" && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleDirectFileUpload}
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                      style={{ display: "none" }}
                    />

                    {/* Submit Audit Report Action Banner (Transitions to Kickoff Stage) */}
                    <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "12px", padding: "16px 20px", marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "1.6rem" }}>🚀</span>
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#166534" }}>
                            Complete Audit Stage & Advance to Kickoff Stage
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#15803d", marginTop: "2px" }}>
                            Publishing the final audit evaluation report will automatically transition this client to the <strong>Kickoff Stage</strong>.
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          updateProject(effectiveProject.id, { auditSubStage: "audit_completed" });
                          handleRequestAdvanceStage(effectiveProject, "Kickoff Stage");
                        }}
                        style={{
                          background: "#16a34a",
                          color: "#ffffff",
                          border: "none",
                          padding: "10px 22px",
                          borderRadius: "8px",
                          fontWeight: "800",
                          fontSize: "0.88rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)"
                        }}
                      >
                        <span>✅ Submit Audit Report & Move to Kickoff</span>
                        <span>➔</span>
                      </button>
                    </div>

                    {auditDocs.length === 0 ? (
                      /* EMPTY STATE WHEN NO DOCUMENT IS UPLOADED INITIALY */
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "50px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                        <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </div>
                        <h3 style={{ margin: "0 0 6px 0", fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>No Audit Document Uploaded</h3>
                        <p style={{ margin: "0 0 20px 0", fontSize: "0.85rem", color: "#64748b", maxWidth: "420px" }}>
                          No audit report has been uploaded for this client yet. Click below to select and upload your Word (.docx) or PDF audit document.
                        </p>
                        <button
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          style={{
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            padding: "10px 24px",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          Upload Audit Document
                        </button>
                      </div>
                    ) : (
                      /* EMBEDDED DOCUMENT VIEWER WHEN DOCUMENT IS UPLOADED */
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
                        
                        {/* Header bar */}
                        <div style={{ background: "#f8fafc", padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "6px", fontWeight: "800", fontSize: "0.75rem" }}>
                              UPLOADED AUDIT DOCUMENT
                            </span>
                            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                              {activeDoc ? activeDoc.title : "Uploaded Audit Report"}
                            </h4>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                              {activeDoc ? `${activeDoc.fileName} (${activeDoc.fileSize || "1.2 MB"})` : ""}
                            </span>
                            
                            <button
                              onClick={() => fileInputRef.current && fileInputRef.current.click()}
                              style={{
                                background: "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                padding: "8px 18px",
                                borderRadius: "8px",
                                fontWeight: "800",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)"
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              Upload New / Replace
                            </button>
                          </div>
                        </div>

                        {/* DOCUMENT CONTENT CANVAS */}
                        <div style={{ padding: "20px", background: "#f1f5f9", minHeight: "500px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                          {(() => {
                            const isMobile = isMobileDevice();
                            const resolvedUrl = getCachedDocumentUrl(activeDoc?.id, activeDoc?.url);
                            const isImage = (resolvedUrl && resolvedUrl.startsWith("data:image")) || activeDoc?.fileName?.match(/\.(png|jpg|jpeg|gif|webp)$/i);
                            const isDocx = activeDoc?.fileName?.match(/\.(docx|doc)$/i) || activeDoc?.fileType?.includes("word") || activeDoc?.fileType?.includes("officedocument");
                            const activePdfSrc = pdfBlobUrl || (resolvedUrl && resolvedUrl.length > 20 && !resolvedUrl.startsWith("#") ? resolvedUrl : activeDoc?.url);

                            if (isImage) {
                              if (isMobile) {
                                return <MobileImageViewer src={resolvedUrl || activeDoc?.url} alt={activeDoc?.title} title={activeDoc?.fileName || activeDoc?.title} />;
                              }
                              return (
                                <img
                                  src={resolvedUrl || activeDoc?.url}
                                  alt={activeDoc?.title}
                                  style={{ maxWidth: "100%", maxHeight: "650px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", objectFit: "contain" }}
                                />
                              );
                            }

                            if (isDocx) {
                              return <DocxViewer doc={{ ...activeDoc, url: resolvedUrl || activeDoc?.url }} />;
                            }

                            if (isMobile) {
                              return (
                                <MobilePdfViewer
                                  pdfUrl={activePdfSrc}
                                  docTitle={activeDoc?.title}
                                  fileName={activeDoc?.fileName}
                                  fileSize={activeDoc?.fileSize}
                                />
                              );
                            }

                            return (
                              <div style={{ width: "100%", height: "800px", background: "#ffffff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                                <iframe
                                  src={activePdfSrc}
                                  title={activeDoc?.title || "Audit Document PDF Viewer"}
                                  style={{ width: "100%", height: "100%", border: "none" }}
                                />
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* TAB 3: PROJECT PLAN & SCOPE OF WORK (KICKOFF & ON-GOING STAGE) */}
            {activeProjectTab === "plan" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Kickoff Decision Card (If in Kickoff Stage) */}
                {getProjectStage(effectiveProject) === "Kickoff Stage" && (
                  <div style={{ background: "#e0f2fe", border: "1.5px solid #7dd3fc", borderRadius: "14px", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0369a1", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>🚀</span> Kickoff Stage Decision Hub
                        </div>
                        <div style={{ fontSize: "0.84rem", color: "#075985", marginTop: "4px" }}>
                          Audit has been completed. Project Scope of Work (SOW) & milestones are prepared. Choose whether client is moving forward or discontinued:
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => handleRequestAdvanceStage(effectiveProject, "On-Going Stage")}
                          style={{
                            background: "#16a34a",
                            color: "#ffffff",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)"
                          }}
                        >
                          <span>⚡</span> On-board / Start Project ➔
                        </button>

                        <button
                          onClick={(e) => handleOpenDiscontinueModal(effectiveProject, e)}
                          style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            padding: "10px 18px",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "0.85rem",
                            cursor: "pointer"
                          }}
                        >
                          🛑 Discontinue from Kickoff Stage
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scope of Work & Milestones Card */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                        Scope of Work (SOW) & Implementation Plan Roadmap
                      </h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                        Deliverables timeline, milestone schedules, and linked project budget.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ background: "#f1f5f9", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700", color: "#334155" }}>
                        Budget: ₹{(effectiveProject.budget || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Implementation Milestones */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800" }}>PHASE 1: FOUNDATION</span>
                      <h4 style={{ margin: "6px 0 4px 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>Inventory & Vault SOPs</h4>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>Reconciliation of gross/net weights, tagging protocol & safe audits.</p>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800" }}>PHASE 2: SALES ENGINE</span>
                      <h4 style={{ margin: "6px 0 4px 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>Bridal Diamond Strategy</h4>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>Counter staff incentive alignment, walk-in conversion & CRM logbook.</p>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800" }}>PHASE 3: SCALE</span>
                      <h4 style={{ margin: "6px 0 4px 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>Multi-Store Expansion</h4>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>Centralized ERP procurement, franchise handbook & brand governance.</p>
                    </div>
                  </div>
                </div>

                {/* Linked Expenses Summary */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                      Linked Pre-Kickoff Expenses
                    </h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                      {linkedExps.length} expense claims currently logged for travel, audit sessions, and site inspections.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveProjectTab("expenses")}
                    style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "6px", fontWeight: "700", fontSize: "0.82rem", color: "#334155", cursor: "pointer" }}
                  >
                    View All Linked Expenses ➔
                  </button>
                </div>

              </div>
            )}

            {/* TAB 4: TASKS & PLANNER (UNIFIED GANTT CHART WITH INTERSECTION COLLAPSE & TWO-TIER DATE HEADER) */}
            {activeProjectTab === "tasks" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Header Toolbar Card */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>
                          Phase-Wise Task Allocation & Interactive Gantt Timeline
                        </h3>
                      </div>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                        {projectPhaseGroups.length === 0 
                          ? "No phases created yet. Click '+ Add New Phase' below to start building your implementation roadmap."
                          : `Visualize ${totalTasksCount} scheduled deliverables across ${projectPhaseGroups.length} custom consulting phases`}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      {/* Collapse State Indicator Badge */}
                      <button
                        onClick={() => setIsLeftPanelCollapsed(prev => !prev)}
                        style={{
                          background: isLeftPanelCollapsed ? "#eff6ff" : "#f8fafc",
                          color: isLeftPanelCollapsed ? "#2563eb" : "#475569",
                          border: `1px solid ${isLeftPanelCollapsed ? "#bfdbfe" : "#cbd5e1"}`,
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.15s ease"
                        }}
                        title={isLeftPanelCollapsed ? "Click to show all columns" : "Click to collapse to Phase & Tasks only"}
                      >
                        <span>{isLeftPanelCollapsed ? "▶ Show Full Columns" : "◀ Collapse to Phase & Tasks"}</span>
                      </button>

                      {/* Schedule New Task Button */}
                      {projectPhaseGroups.length > 0 && (
                        <button
                          onClick={() => handleOpenCreateTask(projectPhaseGroups[0]?.num || 1)}
                          style={{
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            padding: "9px 18px",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Schedule New Task
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Empty State when 0 phases exist */}
                {projectPhaseGroups.length === 0 ? (
                  <div style={{ padding: "48px 24px", textAlign: "center", background: "#ffffff", borderRadius: "14px", border: "2px dashed #cbd5e1" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", marginBottom: "16px" }}>
                      📁
                    </div>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                      No Implementation Phases Created Yet
                    </h3>
                    <p style={{ margin: "0 auto 20px auto", maxWidth: "480px", fontSize: "0.85rem", color: "#64748b", lineHeight: "1.5" }}>
                      Start structuring this client engagement by adding Phase 1 with custom objectives, timeline dates, and week-wise deliverables.
                    </p>
                    <button
                      onClick={handleOpenAddPhase}
                      style={{
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        fontWeight: "800",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)"
                      }}
                    >
                      <span>➕</span>
                      <span>Create Phase 1</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* ======================================================== */}
                    {/* SINGLE MERGED ENTERPRISE GANTT & TASK ROADMAP CONTAINER */}
                    {/* ======================================================== */}
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        overflow: "hidden",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                        position: "relative",
                        display: "flex",
                        alignItems: "stretch"
                      }}
                    >
                      {/* ------------------------------------------------------------- */}
                      {/* INTERSECTION LINE TOGGLE BUTTON (VERTICALLY CENTERED HANDLE) */}
                      {/* ------------------------------------------------------------- */}
                      <div
                        style={{
                          position: "absolute",
                          left: isLeftPanelCollapsed ? "240px" : "500px",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          zIndex: 40,
                          transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                      >
                        <button
                          onClick={() => setIsLeftPanelCollapsed(prev => !prev)}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: isLeftPanelCollapsed ? "#2563eb" : "#ffffff",
                            color: isLeftPanelCollapsed ? "#ffffff" : "#475569",
                            border: isLeftPanelCollapsed ? "1px solid #1d4ed8" : "1px solid #cbd5e1",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontWeight: "900",
                            fontSize: "0.8rem",
                            transition: "all 0.15s ease"
                          }}
                          title={isLeftPanelCollapsed ? "Click to expand task metadata columns (▶)" : "Click to collapse to Phase & Tasks only (◀)"}
                        >
                          {isLeftPanelCollapsed ? "▶" : "◀"}
                        </button>
                      </div>

                      {/* ======================================================== */}
                      {/* LEFT SECTION: TASK OBJECTIVES & BREAKDOWN TABLE          */}
                      {/* ======================================================== */}
                      <div
                        style={{
                          width: isLeftPanelCollapsed ? "240px" : "500px",
                          minWidth: isLeftPanelCollapsed ? "240px" : "500px",
                          borderRight: "2px solid #e2e8f0",
                          transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          background: "#ffffff",
                          zIndex: 10,
                          flexShrink: 0
                        }}
                      >
                        {/* Left Column Header Row (Exact 48px height matching right two-tier header) */}
                        <div
                          style={{
                            height: "48px",
                            boxSizing: "border-box",
                            background: "#f8fafc",
                            borderBottom: "2px solid #e2e8f0",
                            padding: "0 12px",
                            display: "grid",
                            gridTemplateColumns: isLeftPanelCollapsed ? "1fr" : "180px 120px 110px 78px",
                            alignItems: "center",
                            fontWeight: "800",
                            fontSize: "0.72rem",
                            color: "#475569"
                          }}
                        >
                          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            TASK OBJECTIVE & SPEC
                          </div>
                          {!isLeftPanelCollapsed && (
                            <>
                              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>ASSIGNED LEAD</div>
                              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>DATES</div>
                              <div style={{ textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>STATUS</div>
                            </>
                          )}
                        </div>

                        {/* Phase Rows & Tasks (Synchronized exact row heights) */}
                        {projectPhaseGroups.map(phaseGroup => {
                          const isCollapsed = !!collapsedPhases[phaseGroup.id || phaseGroup.num];

                          return (
                            <div key={phaseGroup.id || phaseGroup.num}>
                              
                              {/* Phase Header Row (Exact 44px height) */}
                              <div
                                onClick={() => setCollapsedPhases(prev => ({ ...prev, [phaseGroup.id || phaseGroup.num]: !prev[phaseGroup.id || phaseGroup.num] }))}
                                style={{
                                  height: "44px",
                                  boxSizing: "border-box",
                                  background: phaseGroup.bg || `${phaseGroup.color}12`,
                                  padding: "0 12px",
                                  borderBottom: "1px solid #e2e8f0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  cursor: "pointer",
                                  userSelect: "none"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                                  <span style={{ fontSize: "0.75rem", color: phaseGroup.color, transition: "transform 0.2s", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>
                                    ▼
                                  </span>
                                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: phaseGroup.color, flexShrink: 0 }} />
                                  <span style={{ color: "#0f172a", fontWeight: "800", fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {phaseGroup.fullName || `Phase ${phaseGroup.num}: ${phaseGroup.name}`}
                                  </span>
                                </div>

                                {!isLeftPanelCollapsed && phaseGroup.startDate && (
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#ffffff", padding: "2px 8px", borderRadius: "6px", border: `1px solid ${phaseGroup.color}35`, flexShrink: 0 }}>
                                    <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#1e293b" }}>
                                      {formatGanttDate(phaseGroup.startDate)} – {formatGanttDate(phaseGroup.endDate)}
                                    </span>
                                    <span style={{ fontSize: "0.66rem", fontWeight: "800", color: phaseGroup.color, background: `${phaseGroup.color}15`, padding: "1px 5px", borderRadius: "4px" }}>
                                      {phaseGroup.durationDays || 0}d
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Task Rows (Exact 44px height) */}
                              {!isCollapsed && (
                                <>
                                  {phaseGroup.tasks.length === 0 ? (
                                    <div style={{ height: "44px", boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 12px", fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic", borderBottom: "1px solid #f1f5f9" }}>
                                      No tasks in {phaseGroup.name}.
                                    </div>
                                  ) : (
                                    phaseGroup.tasks.map((tk, tIndex) => {
                                      const isHovered = hoveredGanttTask?.id === tk.id;
                                      const isCompleted = tk.status === "Completed";
                                      const isMilestone = isCompleted || tk.durationDays <= 1;

                                      return (
                                        <div
                                          key={tk.id || tIndex}
                                          style={{
                                            height: "44px",
                                            boxSizing: "border-box",
                                            display: "grid",
                                            gridTemplateColumns: isLeftPanelCollapsed ? "1fr" : "180px 120px 110px 78px",
                                            alignItems: "center",
                                            padding: "0 12px",
                                            borderBottom: "1px solid #f1f5f9",
                                            fontSize: "0.8rem",
                                            background: isHovered ? "#f8fafc" : "#ffffff",
                                            transition: "background 0.15s"
                                          }}
                                          onMouseEnter={() => setHoveredGanttTask(tk)}
                                          onMouseLeave={() => setHoveredGanttTask(null)}
                                        >
                                          {/* Task Title */}
                                          <div
                                            onClick={() => handleOpenEditTask(tk)}
                                            style={{ fontWeight: "700", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                                            title={`${tk.title} (Click to edit)`}
                                          >
                                            {isMilestone && <span style={{ color: "#d97706", fontSize: "0.72rem" }}>◆</span>}
                                            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{tk.title}</span>
                                          </div>

                                          {/* Collapsible Metadata Columns */}
                                          {!isLeftPanelCollapsed && (
                                            <>
                                              <div style={{ color: "#2563eb", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                                                <span style={{ width: "20px", height: "20px", minWidth: "20px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: "800", border: "1px solid #bfdbfe" }}>
                                                  {tk.consultant ? tk.consultant[0] : "C"}
                                                </span>
                                                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.76rem" }}>{tk.consultant || "Unassigned"}</span>
                                              </div>

                                              <div style={{ color: "#475569", fontSize: "0.74rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {tk.dates || (tk.startDate ? `${formatGanttDate(tk.startDate)} - ${formatGanttDate(tk.endDate)}` : "Scheduled")}
                                              </div>

                                              <div style={{ textAlign: "center" }}>
                                                <span
                                                  onClick={(e) => handleQuickToggleTaskStatus(tk, e)}
                                                  style={{
                                                    background: tk.status === "Completed" ? "#dcfce7" : tk.status === "In Progress" ? "#eff6ff" : "#fff7ed",
                                                    color: tk.status === "Completed" ? "#16a34a" : tk.status === "In Progress" ? "#2563eb" : "#d97706",
                                                    border: `1px solid ${tk.status === "Completed" ? "#bbf7d0" : tk.status === "In Progress" ? "#bfdbfe" : "#fed7aa"}`,
                                                    padding: "2px 7px", borderRadius: "8px", fontSize: "0.68rem", fontWeight: "800", cursor: "pointer",
                                                    display: "inline-flex", alignItems: "center", gap: "4px"
                                                  }}
                                                  title="Click to toggle status"
                                                >
                                                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: tk.status === "Completed" ? "#16a34a" : tk.status === "In Progress" ? "#2563eb" : "#d97706" }} />
                                                  {tk.status || "Scheduled"}
                                                </span>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </>
                              )}

                            </div>
                          );
                        })}
                      </div>

                      {/* ======================================================== */}
                      {/* RIGHT SECTION: GANTT SCHEDULE CANVAS (UNIFORM 28px DATES)*/}
                      {/* ======================================================== */}
                      <div
                        style={{
                          flex: 1,
                          overflowX: "auto",
                          background: "#ffffff",
                          position: "relative"
                        }}
                      >
                        {/* ------------------------------------------------------------- */}
                        {/* TWO-TIER UNIFORM DATE HEADER (2240px TOTAL = 70 DAYS x 32px)  */}
                        {/* ------------------------------------------------------------- */}
                        <div style={{ width: "2240px", minWidth: "2240px", borderBottom: "2px solid #e2e8f0" }}>
                          
                          {/* Top Tier: Weekly Date Ranges (Each 224px wide = 7 days x 32px) */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 224px)", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", height: "26px", boxSizing: "border-box", alignItems: "center", textAlign: "center", fontSize: "0.72rem", fontWeight: "700", color: "#334155" }}>
                            {getGanttTimelineWeeks().map((w, wi) => (
                              <div key={wi} style={{ borderRight: "1px solid #cbd5e1", padding: "0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {w.label}
                              </div>
                            ))}
                          </div>

                          {/* Bottom Tier: Uniform Day Numbers (Each 32px wide with clean padding) */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(70, 32px)", background: "#ffffff", height: "22px", boxSizing: "border-box", alignItems: "center", textAlign: "center", fontSize: "0.68rem", fontWeight: "600", color: "#64748b", position: "relative" }}>
                            {getGanttTimelineWeeks().flatMap((w, wi) => 
                              w.days.map((d, di) => {
                                const globalDayIndex = wi * 7 + di;
                                return (
                                  <div
                                    key={globalDayIndex}
                                    style={{
                                      width: "32px",
                                      height: "22px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      borderRight: (globalDayIndex + 1) % 7 === 0 ? "1px solid #cbd5e1" : "1px dashed #e2e8f0",
                                      color: d.isToday ? "#4f46e5" : "#64748b",
                                      fontWeight: d.isToday ? "900" : "600",
                                      background: d.isToday ? "#ede9fe" : "transparent"
                                    }}
                                  >
                                    {d.dayNum}
                                  </div>
                                );
                              })
                            )}

                            {/* "Today" Marker Pill positioned right on Day index 0 (19 Aug) */}
                            <div
                              style={{
                                position: "absolute",
                                left: "16px",
                                top: "-2px",
                                transform: "translateX(-50%)",
                                background: "#6366f1",
                                color: "#ffffff",
                                fontSize: "0.6rem",
                                fontWeight: "800",
                                padding: "1px 5px",
                                borderRadius: "3px",
                                zIndex: 15,
                                pointerEvents: "none",
                                boxShadow: "0 1px 4px rgba(99,102,241,0.4)"
                              }}
                            >
                              Today
                            </div>
                          </div>
                        </div>

                        {/* Gantt Canvas Content Rows (Exact 2240px width) */}
                        <div style={{ width: "2240px", minWidth: "2240px", position: "relative" }}>
                          
                          {/* Continuous "Today" Vertical Line Marker through all rows */}
                          <div
                            style={{
                              position: "absolute",
                              left: "16px",
                              top: 0,
                              bottom: 0,
                              width: "2px",
                              background: "#6366f1",
                              zIndex: 5,
                              pointerEvents: "none"
                            }}
                          />

                          {/* Phase Header Canvas Row & Tasks (Synchronized exact row heights) */}
                          {projectPhaseGroups.map(phaseGroup => {
                            const isCollapsed = !!collapsedPhases[phaseGroup.id || phaseGroup.num];

                            return (
                              <div key={phaseGroup.id || phaseGroup.num}>
                                
                                {/* Phase Header Canvas Bar (Exact 44px height) */}
                                <div
                                  style={{
                                    height: "44px",
                                    boxSizing: "border-box",
                                    background: phaseGroup.bg || `${phaseGroup.color}12`,
                                    borderBottom: "1px solid #e2e8f0",
                                    padding: "0 14px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between"
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: "800", color: phaseGroup.color }}>
                                      {phaseGroup.name} Schedule
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => handleOpenCreateTask(phaseGroup.num)}
                                    style={{
                                      background: "#ffffff",
                                      border: `1px solid ${phaseGroup.color}50`,
                                      color: phaseGroup.color,
                                      padding: "3px 10px",
                                      borderRadius: "6px",
                                      fontSize: "0.72rem",
                                      fontWeight: "800",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px"
                                    }}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    Add Task
                                  </button>
                                </div>

                                {/* Tasks Gantt Bars (Exact 44px height) */}
                                {!isCollapsed && (
                                  <>
                                    {phaseGroup.tasks.length === 0 ? (
                                      <div style={{ height: "44px", boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 14px", fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic", borderBottom: "1px solid #f1f5f9" }}>
                                        No tasks scheduled.
                                      </div>
                                    ) : (
                                      phaseGroup.tasks.map((tk, tIndex) => {
                                        const isHovered = hoveredGanttTask?.id === tk.id;

                                        // Calculate pixel-perfect coordinates based on 32px day width starting at 19 Aug 2026
                                        const sObj = parseLocalYMD(tk.startDate);
                                        const eObj = tk.endDate ? parseLocalYMD(tk.endDate) : sObj;
                                        const startDay = sObj ? Math.round((sObj.getTime() - GANTT_BASE_START) / 86400000) : 0;
                                        const endDay = eObj ? Math.round((eObj.getTime() - GANTT_BASE_START) / 86400000) : startDay + 2;
                                        const durDays = Math.max(1, endDay - startDay + 1);

                                        const leftPx = Math.max(0, startDay * 32);
                                        const widthPx = Math.max(32, durDays * 32);

                                        return (
                                          <div
                                            key={tk.id || tIndex}
                                            style={{
                                              height: "44px",
                                              boxSizing: "border-box",
                                              borderBottom: "1px solid #f1f5f9",
                                              background: isHovered ? "#f8fafc" : "#ffffff",
                                              position: "relative",
                                              display: "flex",
                                              alignItems: "center"
                                            }}
                                            onMouseEnter={() => setHoveredGanttTask(tk)}
                                            onMouseLeave={() => setHoveredGanttTask(null)}
                                          >
                                            {/* 70 Day Column Guidelines (Each 32px) */}
                                            <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(70, 32px)", pointerEvents: "none" }}>
                                              {Array.from({ length: 70 }).map((_, gi) => (
                                                <div key={gi} style={{ borderRight: (gi + 1) % 7 === 0 ? "1px solid #cbd5e1" : "1px dashed #f1f5f9" }} />
                                              ))}
                                            </div>

                                            {/* Colored Gantt Timeline Bar */}
                                            <div
                                              onClick={() => handleOpenEditTask(tk)}
                                              style={{
                                                position: "absolute",
                                                left: `${leftPx}px`,
                                                width: `${widthPx}px`,
                                                top: "7px",
                                                bottom: "7px",
                                                background: `linear-gradient(135deg, ${phaseGroup.color}, ${phaseGroup.color}dd)`,
                                                borderRadius: "6px",
                                                boxShadow: isHovered ? `0 4px 12px ${phaseGroup.color}60` : `0 2px 6px ${phaseGroup.color}35`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "0 8px",
                                                color: "#ffffff",
                                                fontSize: "0.7rem",
                                                fontWeight: "800",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                zIndex: 8,
                                                cursor: "pointer",
                                                transition: "all 0.2s ease",
                                                transform: isHovered ? "scaleY(1.08)" : "scaleY(1)"
                                              }}
                                            >
                                              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {tk.title}
                                              </span>
                                              <span style={{ fontSize: "0.66rem", opacity: 0.9, fontWeight: "800", marginLeft: "4px" }}>
                                                {tk.progress || 0}%
                                              </span>
                                            </div>

                                            {/* Floating Preview Card on Hover */}
                                            {isHovered && (
                                              <div
                                                style={{
                                                  position: "absolute",
                                                  left: `${leftPx}px`,
                                                  top: "-95px",
                                                  background: "#0f172a",
                                                  color: "#ffffff",
                                                  padding: "10px 14px",
                                                  borderRadius: "10px",
                                                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                                                  zIndex: 9999,
                                                  minWidth: "220px",
                                                  pointerEvents: "auto"
                                                }}
                                              >
                                                <div style={{ fontSize: "0.72rem", fontWeight: "800", color: "#38bdf8", textTransform: "uppercase" }}>
                                                  {phaseGroup.fullName || `Phase ${phaseGroup.num}`}
                                                </div>
                                                <div style={{ fontSize: "0.85rem", fontWeight: "800", margin: "2px 0 4px 0" }}>
                                                  {tk.title}
                                                </div>
                                                <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                                                  👤 {tk.consultant || "Unassigned"} • 📅 {tk.dates || tk.startDate || "Scheduled"} ({tk.durationDays || 0}d)
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", borderTop: "1px solid #334155", paddingTop: "6px" }}>
                                                  <span style={{ fontSize: "0.72rem", color: "#a7f3d0", fontWeight: "700" }}>● {tk.status} ({tk.progress || 0}%)</span>
                                                  <span style={{ fontSize: "0.7rem", color: "#38bdf8", cursor: "pointer", fontWeight: "700" }}>Click to Edit ✏️</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM ADD NEW PHASE ACTION CARD */}
                    <button
                      onClick={handleOpenAddPhase}
                      style={{
                        width: "100%",
                        padding: "16px 20px",
                        background: "#ffffff",
                        border: "2px dashed #93c5fd",
                        borderRadius: "12px",
                        color: "#2563eb",
                        fontWeight: "800",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 2px 8px rgba(37,99,235,0.04)"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#eff6ff";
                        e.currentTarget.style.borderColor = "#2563eb";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "#ffffff";
                        e.currentTarget.style.borderColor = "#93c5fd";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #bfdbfe" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </span>
                      <span>+ Add New Implementation Phase (Phase {projectPhaseGroups.length + 1})</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {activeProjectTab === "visits" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Client Site Visits (5)</h3>
                  <button onClick={() => setShowVisitModal(true)} style={{ background: "#059669", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>+ Record Visit</button>
                </div>
              </div>
            )}

            {activeProjectTab === "documents" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Documents & Deliverables Repository</h3>
              </div>
            )}

            {activeProjectTab === "team" && (() => {
              const assignedIds = effectiveProject.assignedConsultants || (effectiveProject.assignedConsultantId ? [effectiveProject.assignedConsultantId] : []);
              const assignedTeamMembers = (users || []).filter(u => 
                assignedIds.includes(u.id) || 
                assignedIds.includes(u.empCode) || 
                (effectiveProject.assignedConsultantId && (u.id === effectiveProject.assignedConsultantId || u.empCode === effectiveProject.assignedConsultantId))
              );

              return (
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "28px", boxShadow: "0 4px 14px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>👥 Assigned Business Consultants & Team ({assignedTeamMembers.length})</h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>Consultants assigned to support and audit {effectiveProject.name}</p>
                    </div>

                    {!isConsultant && (
                      <button
                        type="button"
                        onClick={() => setShowAssignModal(true)}
                        style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "10px", padding: "10px 18px", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }}
                      >
                        + Assign / Manage Consultants
                      </button>
                    )}
                  </div>

                  {assignedTeamMembers.length === 0 ? (
                    <div style={{ padding: "48px 20px", textAlign: "center", background: "#f8fafc", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
                      <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>👤</div>
                      <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "1rem" }}>No Consultants Assigned Yet</div>
                      <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "4px", marginBottom: "16px" }}>Consultant assignments are managed through the Admin login.</div>
                      {!isConsultant && (
                        <button
                          type="button"
                          onClick={() => setShowAssignModal(true)}
                          style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 18px", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer" }}
                        >
                          + Assign Consultants Now
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                      {assignedTeamMembers.map((member) => (
                        <div key={member.id} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                            <img src={member.avatar || member.selfiePhoto} alt={member.name} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid #2563eb" }} />
                            <div>
                              <div style={{ fontWeight: "800", fontSize: "0.95rem", color: "#0f172a" }}>{member.name}</div>
                              <div style={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: "700" }}>{member.title || member.role || "Consultant"}</div>
                              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{member.email}</div>
                            </div>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                            <span style={{ fontSize: "0.75rem", background: "#f0fdf4", color: "#166534", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                              ✓ Active Team Member
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedList = assignedIds.filter(id => id !== member.id && id !== member.empCode);
                                const names = updatedList.map(id => (users.find(u => u.id === id || u.empCode === id) || {}).name).filter(Boolean).join(", ");
                                updateProject(effectiveProject.id, {
                                  assignedConsultants: updatedList,
                                  assignedConsultantId: updatedList[0] || "",
                                  assignedConsultantName: names,
                                  assignedConsultant: names
                                });
                                if (setToast) setToast({ message: `Removed ${member.name} from project team.`, type: "info" });
                              }}
                              style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}
                            >
                              Remove ✖
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Multi-Consultant Assignment Modal */}
            {showAssignModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                <div style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "520px", padding: "24px", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>👥 Assign Consultants to {effectiveProject.name}</h3>
                    <span onClick={() => setShowAssignModal(false)} style={{ cursor: "pointer", fontSize: "1.2rem", fontWeight: "700", color: "#64748b" }}>✕</span>
                  </div>

                  <p style={{ margin: "0 0 16px 0", fontSize: "0.82rem", color: "#64748b" }}>Check all consultants who should have access to this client project in their portals.</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "320px", overflowY: "auto", paddingRight: "4px" }}>
                    {users.filter(u => u.role === "Consultant" || u.role === "Employee" || u.role === "Admin").map(u => {
                      const currentAssigned = effectiveProject.assignedConsultants || (effectiveProject.assignedConsultantId ? [effectiveProject.assignedConsultantId] : []);
                      const isChecked = currentAssigned.some(a => 
                        a === u.id || 
                        a === u.empCode || 
                        a === u.emp_code || 
                        (u.email && String(a).toLowerCase() === u.email.toLowerCase()) ||
                        (u.name && String(a).toLowerCase() === u.name.toLowerCase())
                      );

                      return (
                        <label key={u.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", border: isChecked ? "2px solid #2563eb" : "1px solid #cbd5e1", borderRadius: "10px", background: isChecked ? "#eff6ff" : "#ffffff", cursor: "pointer", transition: "all 0.15s" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let updatedList = [...currentAssigned];
                              const userKeys = [u.id, u.empCode, u.emp_code, u.email, u.name].filter(Boolean);
                              if (e.target.checked) {
                                userKeys.forEach(k => {
                                  if (!updatedList.includes(k)) updatedList.push(k);
                                });
                              } else {
                                const removeTargets = userKeys.map(k => String(k).toLowerCase());
                                updatedList = updatedList.filter(id => !removeTargets.includes(String(id).toLowerCase()));
                              }
                              const names = (users || []).filter(usr => updatedList.some(id => id === usr.id || id === usr.empCode || id === usr.email)).map(usr => usr.name).join(", ");
                              updateProject(effectiveProject.id, {
                                assignedConsultants: updatedList,
                                assignedConsultantId: updatedList[0] || "",
                                assignedConsultantName: names,
                                assignedConsultant: names
                              });
                            }}
                            style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#2563eb" }}
                          />
                          <img src={u.avatar || u.selfiePhoto} alt={u.name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                          <div>
                            <div style={{ fontWeight: "800", fontSize: "0.88rem", color: "#0f172a" }}>{u.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{u.title || u.role} • {u.email}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "10px", padding: "10px 22px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
                    >
                      Done / Save Team Roster
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Location & GPS Coordinates Add/Edit Modal */}
            {showLocationModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(4px)" }}>
                <div style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  {/* Modal Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                          {editingLocationId ? "Edit Physical Location & GPS" : "Add Physical Location & GPS Coordinates"}
                        </h3>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                          Client: <strong>{effectiveProject.name}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(false)}
                      style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveLocation} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    
                    {/* 1. Location Type Dropdown */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                        LOCATION CLASSIFICATION / TYPE <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <select
                        value={locationForm.locationType}
                        onChange={e => setLocationForm({ ...locationForm, locationType: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "0.88rem",
                          fontWeight: "700",
                          color: "#1e293b",
                          background: "#ffffff",
                          boxSizing: "border-box",
                          cursor: "pointer"
                        }}
                      >
                        {LOCATION_TYPES_LIST.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.icon} {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Location Name / Identifier */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                        LOCATION NAME / IDENTIFIER <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={locationForm.name}
                        onChange={e => setLocationForm({ ...locationForm, name: e.target.value })}
                        placeholder="e.g. Flagship Retail Showroom or Head Office"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", fontWeight: "600", boxSizing: "border-box" }}
                      />
                    </div>

                    {/* 3. Tabbed Address & GPS Input Methods */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", background: "#f8fafc" }}>
                      
                      {/* Method Tabs */}
                      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#ffffff" }}>
                        <button
                          type="button"
                          onClick={() => setLocationFormTab("search")}
                          style={{
                            flex: 1,
                            padding: "10px",
                            border: "none",
                            borderBottom: locationFormTab === "search" ? "2px solid #2563eb" : "none",
                            background: locationFormTab === "search" ? "#eff6ff" : "#ffffff",
                            color: locationFormTab === "search" ? "#2563eb" : "#64748b",
                            fontWeight: locationFormTab === "search" ? "800" : "600",
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                        >
                          <span>🔍 Live Map & Google Places Search</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocationFormTab("manual")}
                          style={{
                            flex: 1,
                            padding: "10px",
                            border: "none",
                            borderBottom: locationFormTab === "manual" ? "2px solid #2563eb" : "none",
                            background: locationFormTab === "manual" ? "#eff6ff" : "#ffffff",
                            color: locationFormTab === "manual" ? "#2563eb" : "#64748b",
                            fontWeight: locationFormTab === "manual" ? "800" : "600",
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                        >
                          <span>✍️ Manual Address & GPS Coordinates</span>
                        </button>
                      </div>

                      {/* Tab 1: Live Business & Map Search */}
                      {locationFormTab === "search" && (
                        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                            <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#334155" }}>
                              SEARCH BY SHOWROOM / BUSINESS NAME, STREET, OR PINCODE:
                            </label>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locSearchQuery || locationForm.address || locationForm.name || "Jewellery Showroom")}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: "0.74rem", fontWeight: "700", color: "#2563eb", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <span>🗺️ Open in Google Maps ➔</span>
                            </a>
                          </div>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              value={locSearchQuery}
                              onChange={e => handleSearchLocation(e.target.value)}
                              placeholder="e.g. Tanishq Banjara Hills Hyderabad, Zaveri Bazaar Mumbai, or 17.412, 78.432..."
                              style={{ width: "100%", padding: "10px 36px 10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "#ffffff", boxSizing: "border-box" }}
                            />
                            <div style={{ position: "absolute", right: "12px", top: "10px", color: "#94a3b8" }}>
                              {isSearchingLoc ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                              )}
                            </div>

                            {/* Search Suggestions Dropdown */}
                            {locSuggestions.length > 0 && (
                              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 100, maxHeight: "220px", overflowY: "auto" }}>
                                {locSuggestions.map((sug, sIdx) => (
                                  <div
                                    key={sIdx}
                                    onClick={() => handleSelectLocationSuggestion(sug)}
                                    style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "0.82rem", lineHeight: "1.4" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                                    onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
                                  >
                                    <strong style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                                      <span>📍</span> {sug.name || sug.display_name.split(",")[0]}
                                    </strong>
                                    <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block", marginTop: "2px" }}>{sug.display_name}</span>
                                    <div style={{ marginTop: "3px", fontSize: "0.72rem", color: "#16a34a", fontWeight: "700" }}>
                                      🌐 {parseFloat(sug.lat).toFixed(5)}° N, {parseFloat(sug.lon).toFixed(5)}° E
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Manual Address & Coords Form */}
                      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", borderTop: locationFormTab === "search" ? "1px solid #e2e8f0" : "none" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            FULL PHYSICAL ADDRESS
                          </label>
                          <textarea
                            rows="2"
                            value={locationForm.address}
                            onChange={e => setLocationForm({ ...locationForm, address: e.target.value })}
                            placeholder="Plot No., Street, Floor, Area / Landmark..."
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                          />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>CITY</label>
                            <input
                              type="text"
                              value={locationForm.city}
                              onChange={e => setLocationForm({ ...locationForm, city: e.target.value })}
                              placeholder="City"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>STATE</label>
                            <input
                              type="text"
                              value={locationForm.state}
                              onChange={e => setLocationForm({ ...locationForm, state: e.target.value })}
                              placeholder="State"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>PINCODE</label>
                            <input
                              type="text"
                              value={locationForm.pincode}
                              onChange={e => setLocationForm({ ...locationForm, pincode: e.target.value })}
                              placeholder="PIN Code"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#166534", marginBottom: "4px" }}>
                              LATITUDE (° N)
                            </label>
                            <input
                              type="text"
                              value={locationForm.lat}
                              onChange={e => setLocationForm({ ...locationForm, lat: e.target.value })}
                              placeholder="e.g. 17.41234"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", background: "#f0fdf4", fontSize: "0.85rem", fontWeight: "700", color: "#166534", boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#166534", marginBottom: "4px" }}>
                              LONGITUDE (° E)
                            </label>
                            <input
                              type="text"
                              value={locationForm.lng}
                              onChange={e => setLocationForm({ ...locationForm, lng: e.target.value })}
                              placeholder="e.g. 78.43210"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", background: "#f0fdf4", fontSize: "0.85rem", fontWeight: "700", color: "#166534", boxSizing: "border-box" }}
                            />
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* 4. Site Incharge / Contact Details */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          BRANCH / FACTORY INCHARGE NAME
                        </label>
                        <input
                          type="text"
                          value={locationForm.contactPerson}
                          onChange={e => setLocationForm({ ...locationForm, contactPerson: e.target.value })}
                          placeholder="e.g. Ramesh Kumar (Store Mgr)"
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          CONTACT PHONE NUMBER
                        </label>
                        <input
                          type="text"
                          value={locationForm.contactPhone}
                          onChange={e => setLocationForm({ ...locationForm, contactPhone: e.target.value })}
                          placeholder="e.g. 9876543210"
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    {/* 5. Primary Audit Target Checkbox */}
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 14px", borderRadius: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={locationForm.isPrimaryAuditTarget}
                        onChange={e => setLocationForm({ ...locationForm, isPrimaryAuditTarget: e.target.checked })}
                        style={{ width: "18px", height: "18px", accentColor: "#16a34a", cursor: "pointer" }}
                      />
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#166534" }}>
                          🌟 Set as Primary Audit Target Site
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "#475569" }}>
                          Consultants will use this site's coordinates for physical stock audits, visit itineraries, and distance tracking.
                        </div>
                      </div>
                    </label>

                    {/* Modal Buttons */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(false)}
                        style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "9px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", color: "#ffffff", border: "none", padding: "9px 24px", borderRadius: "8px", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 3px 8px rgba(16, 185, 129, 0.3)" }}
                      >
                        ✓ Save Location & GPS
                      </button>
                    </div>

                  </form>

                </div>
              </div>
            )}

            {activeProjectTab === "discussions" && (() => {
              const allDiscussions = effectiveProject.discussions || [];
              const currentStage = getProjectStage(effectiveProject);
              
              // Stage-to-Discussion-Type mapping:
              // Lead Stage -> General
              // Audit Stage -> Audit Notes
              // Kickoff Stage -> Strategy Plans
              // On-Going Stage -> Action Items
              const stageDefaultDiscussionType = currentStage === "Lead Stage" ? "General"
                : currentStage === "Audit Stage" ? "Audit Note"
                : currentStage === "Kickoff Stage" ? "Strategy"
                : currentStage === "On-Going Stage" ? "Action Item"
                : "General";

              // Extract all available categories & subcategories from taxonomy and existing discussions
              const allKnownCategories = Array.from(new Set([
                ...Object.keys(strategyTaxonomy),
                ...allDiscussions.map(d => d.category).filter(Boolean)
              ]));

              const allKnownSubCategories = Array.from(new Set([
                ...(discCategoryFilter !== "All" && strategyTaxonomy[discCategoryFilter] ? strategyTaxonomy[discCategoryFilter] : []),
                ...allDiscussions.map(d => d.subCategory).filter(Boolean)
              ]));

              const allAuthors = Array.from(new Set(
                allDiscussions.map(d => d.authorName).filter(Boolean)
              ));

              // Filter discussions based on user criteria
              const filteredDiscussions = allDiscussions.filter(disc => {
                const matchesType = discTypeFilter === "All" || disc.discussionType === discTypeFilter;
                const matchesCategory = discCategoryFilter === "All" || disc.category === discCategoryFilter;
                const matchesSubCategory = discSubCategoryFilter === "All" || disc.subCategory === discSubCategoryFilter;
                const matchesAuthor = discAuthorFilter === "All" || disc.authorName === discAuthorFilter;
                
                const q = discSearchQuery.toLowerCase().trim();
                const matchesQuery = !q || 
                  (disc.title && disc.title.toLowerCase().includes(q)) ||
                  (disc.notes && disc.notes.toLowerCase().includes(q)) ||
                  (disc.category && disc.category.toLowerCase().includes(q)) ||
                  (disc.subCategory && disc.subCategory.toLowerCase().includes(q)) ||
                  (disc.authorName && disc.authorName.toLowerCase().includes(q));

                return matchesType && matchesCategory && matchesSubCategory && matchesAuthor && matchesQuery;
              });

              // Sort: Pinned first, then by date descending
              const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0);
              });

              // Counts for quick KPI stats
              const stratCount = allDiscussions.filter(d => d.discussionType === "Strategy").length;
              const genCount = allDiscussions.filter(d => d.discussionType === "General").length;
              const auditNotesCount = allDiscussions.filter(d => d.discussionType === "Audit Note").length;
              const actionItemsCount = allDiscussions.filter(d => d.discussionType === "Action Item").length;

              const handleOpenAddDiscussionModal = (typeOverride = null) => {
                const targetType = typeOverride || stageDefaultDiscussionType;
                setDiscForm({
                  title: "",
                  notes: "",
                  discussionType: targetType,
                  category: targetType === "Strategy" ? "Marketing" : "",
                  subCategory: targetType === "Strategy" ? "Offer Planning" : "",
                  priority: "Normal",
                  isPinned: false,
                  actionItemsText: "",
                  audioUrl: null,
                  audioName: null,
                  attachments: []
                });
                setIsRecordingAudio(false);
                setRecordingSeconds(0);
                setIsAddingDiscussion(true);
              };

              const handleStartRecording = async () => {
                try {
                  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    if (typeof setToast === "function") setToast({ message: "Audio recording is not supported in this browser. You can upload an audio file below.", type: "error" });
                    return;
                  }
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  audioChunksRef.current = [];
                  const mediaRecorder = new MediaRecorder(stream);
                  mediaRecorderRef.current = mediaRecorder;

                  mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                      audioChunksRef.current.push(event.data);
                    }
                  };

                  mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                      const base64Audio = reader.result;
                      setDiscForm(prev => ({
                        ...prev,
                        audioUrl: base64Audio,
                        audioName: `Voice_Memo_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '')}.webm`
                      }));
                    };
                    stream.getTracks().forEach(track => track.stop());
                  };

                  mediaRecorder.start();
                  setIsRecordingAudio(true);
                  setRecordingSeconds(0);
                  if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                  recordingTimerRef.current = setInterval(() => {
                    setRecordingSeconds(sec => sec + 1);
                  }, 1000);

                } catch (err) {
                  console.error("Microphone access error:", err);
                  if (typeof setToast === "function") {
                    setToast({ message: "Microphone access denied. You can upload an audio file instead.", type: "error" });
                  }
                }
              };

              const handleStopRecording = () => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                  mediaRecorderRef.current.stop();
                }
                setIsRecordingAudio(false);
                if (recordingTimerRef.current) {
                  clearInterval(recordingTimerRef.current);
                  recordingTimerRef.current = null;
                }
              };

              const handleAudioFileUpload = (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (uploadEvent) => {
                  setDiscForm(prev => ({
                    ...prev,
                    audioUrl: uploadEvent.target.result,
                    audioName: file.name
                  }));
                };
                reader.readAsDataURL(file);
                e.target.value = "";
              };

              const handleAttachmentUpload = (e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;
                
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onload = (uploadEvent) => {
                    const newAttachment = {
                      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      dataUrl: uploadEvent.target.result
                    };
                    setDiscForm(prev => ({
                      ...prev,
                      attachments: [...(prev.attachments || []), newAttachment]
                    }));
                  };
                  reader.readAsDataURL(file);
                });
                e.target.value = "";
              };

              const handleRemoveAttachment = (attId) => {
                setDiscForm(prev => ({
                  ...prev,
                  attachments: (prev.attachments || []).filter(a => a.id !== attId)
                }));
              };

              const handlePostDiscussion = (e) => {
                e.preventDefault();
                if (!discForm.title.trim() && !discForm.notes.trim() && !discForm.audioUrl && (!discForm.attachments || discForm.attachments.length === 0)) {
                  if (typeof setToast === "function") setToast({ message: "Please enter a subject, detailed note, voice recording, or attach a file.", type: "error" });
                  return;
                }

                // Parse action items text into array
                const parsedActionItems = discForm.actionItemsText
                  ? discForm.actionItemsText.split("\n").map(t => t.trim()).filter(Boolean).map(text => ({ text, completed: false }))
                  : [];

                const defaultTitle = discForm.discussionType === "General"
                  ? (discForm.audioUrl ? "Voice Discussion Memo" : "General Discussion Note")
                  : discForm.discussionType === "Audit Note"
                  ? "Audit Observation & Review"
                  : discForm.discussionType === "Strategy"
                  ? (discForm.category ? `${discForm.category} Strategy: ${discForm.subCategory || "General"}` : "Strategy Plan")
                  : "Action Item & Milestone";

                const isGeneral = discForm.discussionType === "General";

                const payload = {
                  title: discForm.title.trim() || defaultTitle,
                  notes: discForm.notes.trim(),
                  discussionType: discForm.discussionType,
                  category: isGeneral ? "" : (discForm.category || ""),
                  subCategory: isGeneral ? "" : (discForm.subCategory || ""),
                  priority: discForm.priority || "Normal",
                  isPinned: discForm.isPinned || false,
                  actionItems: parsedActionItems,
                  audioUrl: discForm.audioUrl || null,
                  audioName: discForm.audioName || null,
                  attachments: discForm.attachments || []
                };

                addProjectDiscussion(effectiveProject.id, payload);

                // Reset form
                setDiscForm({
                  title: "",
                  notes: "",
                  discussionType: stageDefaultDiscussionType,
                  category: stageDefaultDiscussionType === "Strategy" ? "Marketing" : "",
                  subCategory: stageDefaultDiscussionType === "Strategy" ? "Offer Planning" : "",
                  priority: "Normal",
                  isPinned: false,
                  actionItemsText: "",
                  audioUrl: null,
                  audioName: null,
                  attachments: []
                });
                setIsAddingDiscussion(false);
                setIsRecordingAudio(false);
                if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

                if (typeof setToast === "function") {
                  setToast({ message: `${discForm.discussionType === "General" ? "General discussion" : discForm.discussionType} recorded successfully!`, type: "success" });
                }
              };

              const handleToggleActionItem = (discId, itemIdx) => {
                const targetDisc = allDiscussions.find(d => d.id === discId);
                if (!targetDisc || !targetDisc.actionItems) return;
                const updatedItems = targetDisc.actionItems.map((item, idx) => 
                  idx === itemIdx ? { ...item, completed: !item.completed } : item
                );
                updateProjectDiscussion(effectiveProject.id, discId, { actionItems: updatedItems });
              };

              const handleTogglePin = (discId, currentPinned) => {
                updateProjectDiscussion(effectiveProject.id, discId, { isPinned: !currentPinned });
                if (typeof setToast === "function") {
                  setToast({ message: !currentPinned ? "📌 Pinned discussion to top." : "Unpinned discussion.", type: "success" });
                }
              };

              const handleDeleteDiscussion = (discId) => {
                if (window.confirm("Are you sure you want to delete this discussion note?")) {
                  deleteProjectDiscussion(effectiveProject.id, discId);
                  if (typeof setToast === "function") {
                    setToast({ message: "Discussion note removed.", type: "success" });
                  }
                }
              };

              const handleCopyDiscussion = (disc) => {
                const text = `[${disc.discussionType.toUpperCase()}] ${disc.title}\n${disc.category ? `Category: ${disc.category} ${disc.subCategory ? `> ${disc.subCategory}` : ''}\n` : ''}Author: ${disc.authorName} (${disc.formattedDate || disc.date})\n\n${disc.notes}`;
                navigator.clipboard.writeText(text);
                if (typeof setToast === "function") {
                  setToast({ message: "Copied discussion note to clipboard!", type: "success" });
                }
              };

              const formatSeconds = (sec) => {
                const m = Math.floor(sec / 60).toString().padStart(2, '0');
                const s = (sec % 60).toString().padStart(2, '0');
                return `${m}:${s}`;
              };

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  {/* TOP HEADER & STATS CARD */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "22px 26px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 3px 8px rgba(79, 70, 229, 0.25)" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                            Discussions & Logs
                          </h3>
                          <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                            Stage-aligned discussion streams: <strong>General</strong> (Lead), <strong>Audit Notes</strong> (Audit), <strong>Strategy Plans</strong> (Kickoff) & <strong>Action Items</strong> (On-Going).
                          </p>
                        </div>
                      </div>

                      {/* Quick Summary Pill Stats - Stage Contextual */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
                        <span style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#334155" }}>
                          💬 Total: <strong>{allDiscussions.length}</strong>
                        </span>
                        <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#2563eb" }}>
                          💬 General: <strong>{genCount}</strong>
                        </span>
                        {currentStage !== "Lead Stage" && (
                          <span style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#0284c7" }}>
                            🔍 Audit Notes: <strong>{auditNotesCount}</strong>
                          </span>
                        )}
                        {(currentStage === "Kickoff Stage" || currentStage === "On-Going Stage") && (
                          <span style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#7c3aed" }}>
                            🎯 Strategy Plans: <strong>{stratCount}</strong>
                          </span>
                        )}
                        {currentStage === "On-Going Stage" && (
                          <span style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#d97706" }}>
                            ⚡ Action Items: <strong>{actionItemsCount}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* New Discussion Button - Stage Contextual */}
                    <button
                      onClick={() => handleOpenAddDiscussionModal()}
                      style={{
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        color: "#ffffff",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "10px",
                        fontWeight: "800",
                        fontSize: "0.88rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span>
                        {currentStage === "Lead Stage" ? "+ Add General Discussion"
                          : currentStage === "Audit Stage" ? "+ Log Audit Note"
                          : currentStage === "Kickoff Stage" ? "+ Add Strategy Plan"
                          : "+ Create Action Item"}
                      </span>
                    </button>
                  </div>

                  {/* DISCUSSION CREATION POP-UP MODAL */}
                  {isAddingDiscussion && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(4px)" }}>
                      <div style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", gap: "20px" }}>
                        
                        {/* Modal Top Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 3px 8px rgba(79, 70, 229, 0.25)" }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                                {discForm.discussionType === "General" ? "💬 Log General Discussion / Voice Note"
                                  : discForm.discussionType === "Audit Note" ? "🔍 Log Audit & Observation Note"
                                  : discForm.discussionType === "Strategy" ? "🎯 Note Strategy Plan & Roadmap"
                                  : "⚡ Create Action Item / Milestone"}
                              </h4>
                              <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                                Stage: <strong style={{ color: "#4f46e5" }}>{currentStage}</strong> • Author: <strong>{currentUser?.name || "Consultant"}</strong>
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              handleStopRecording();
                              setIsAddingDiscussion(false);
                            }}
                            style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}
                          >
                            ✕
                          </button>
                        </div>

                        <form onSubmit={handlePostDiscussion} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                          {/* 1. Active Stage Discussion Type Display (Locked to Current Stage) */}
                          {(() => {
                            const activeTypeCfg = DISCUSSION_TYPES.find(t => t.id === discForm.discussionType) || DISCUSSION_TYPES[0];
                            return (
                              <div style={{ background: activeTypeCfg.bg, border: `1.5px solid ${activeTypeCfg.border}`, borderRadius: "10px", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <span style={{ fontSize: "1.25rem" }}>{activeTypeCfg.icon}</span>
                                  <div>
                                    <div style={{ fontSize: "0.92rem", fontWeight: "800", color: activeTypeCfg.color }}>
                                      {activeTypeCfg.label}
                                    </div>
                                    <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                                      Project Stage: <strong style={{ color: "#0f172a" }}>{currentStage}</strong>
                                    </div>
                                  </div>
                                </div>
                                <span style={{ background: activeTypeCfg.color, color: "#ffffff", fontSize: "0.72rem", fontWeight: "800", padding: "3px 10px", borderRadius: "6px" }}>
                                  ● {currentStage}
                                </span>
                              </div>
                            );
                          })()}

                          {/* 2. Title & Subject */}
                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                              TITLE / SUBJECT {discForm.discussionType !== "General" && <span style={{ color: "#dc2626" }}>*</span>}
                            </label>
                            <input
                              type="text"
                              value={discForm.title}
                              onChange={e => setDiscForm({ ...discForm, title: e.target.value })}
                              placeholder={
                                discForm.discussionType === "General" ? "e.g., Initial Client Inquiry & Showroom Brief"
                                : discForm.discussionType === "Audit Note" ? "e.g., Physical Gold Inventory Reconciliation Findings"
                                : discForm.discussionType === "Strategy" ? "e.g., Diwali Akshaya Tritiya Campaign Offer Matrix"
                                : "e.g., Implement Daily Sales Ledger Verification Rule"
                              }
                              style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.9rem",
                                fontWeight: "600",
                                outline: "none",
                                boxSizing: "border-box"
                              }}
                            />
                          </div>

                          {/* 3. Category & Sub-Category Taxonomy — HIDDEN FOR GENERAL DISCUSSIONS */}
                          {discForm.discussionType !== "General" && (
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                              <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#4f46e5", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>🎯 STRATEGY TAXONOMY & CLASSIFICATION</span>
                                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "500", textTransform: "none" }}>(Search existing or type to add new)</span>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                {/* Category Searchable Selector */}
                                <SearchableAddSelect
                                  label="CATEGORY"
                                  value={discForm.category}
                                  onChange={(val) => {
                                    const subOpts = strategyTaxonomy[val] || [];
                                    setDiscForm(prev => ({
                                      ...prev,
                                      category: val,
                                      subCategory: subOpts.length > 0 ? subOpts[0] : ""
                                    }));
                                  }}
                                  options={Object.keys(strategyTaxonomy)}
                                  onAddOption={handleAddCustomCategory}
                                  placeholder="Search category or type new..."
                                />

                                {/* Sub-Category Searchable Selector */}
                                <SearchableAddSelect
                                  label="SUB-CATEGORY"
                                  value={discForm.subCategory}
                                  onChange={(val) => setDiscForm(prev => ({ ...prev, subCategory: val }))}
                                  options={strategyTaxonomy[discForm.category] || []}
                                  onAddOption={handleAddCustomSubCategory}
                                  placeholder="Search sub-category or type new..."
                                  disabled={!discForm.category}
                                />
                              </div>
                            </div>
                          )}

                          {/* 4. Detailed Notes Textarea */}
                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                              {discForm.discussionType === "General" ? "MANUAL ENTRY NOTES" : "DETAILED DISCUSSION NOTES"}
                            </label>
                            <textarea
                              rows="3"
                              value={discForm.notes}
                              onChange={e => setDiscForm({ ...discForm, notes: e.target.value })}
                              placeholder={
                                discForm.discussionType === "General"
                                  ? "Type general discussion notes, call summary, client requests..."
                                  : "Describe discussion minutes, client feedback, strategy decisions, timelines..."
                              }
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.88rem",
                                outline: "none",
                                lineHeight: "1.5",
                                boxSizing: "border-box",
                                fontFamily: "inherit"
                              }}
                            />
                          </div>

                          {/* 5. AUDIO VOICE NOTE / RECORDING INPUT */}
                          <div style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>🎙️</span>
                                <span>AUDIO INPUT & VOICE MEMO</span>
                              </span>
                              {discForm.audioUrl && (
                                <button
                                  type="button"
                                  onClick={() => setDiscForm(prev => ({ ...prev, audioUrl: null, audioName: null }))}
                                  style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "700", cursor: "pointer" }}
                                >
                                  ✕ Remove Audio
                                </button>
                              )}
                            </div>

                            {/* Voice Recording Controls */}
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                              {!isRecordingAudio ? (
                                <button
                                  type="button"
                                  onClick={handleStartRecording}
                                  style={{
                                    background: "#eff6ff",
                                    color: "#2563eb",
                                    border: "1px solid #bfdbfe",
                                    padding: "7px 14px",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px"
                                  }}
                                >
                                  <span>🔴</span>
                                  <span>Record Voice Note</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleStopRecording}
                                  style={{
                                    background: "#dc2626",
                                    color: "#ffffff",
                                    border: "none",
                                    padding: "7px 16px",
                                    borderRadius: "8px",
                                    fontWeight: "800",
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    animation: "pulse 1.2s infinite"
                                  }}
                                >
                                  <span>⏹️</span>
                                  <span>Stop Recording ({formatSeconds(recordingSeconds)})</span>
                                </button>
                              )}

                              <label style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "600", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <span>📁</span>
                                <span>Upload Audio (.mp3, .wav, .m4a)</span>
                                <input
                                  type="file"
                                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
                                  onChange={handleAudioFileUpload}
                                  style={{ display: "none" }}
                                />
                              </label>
                            </div>

                            {/* Audio Player Preview */}
                            {discForm.audioUrl && (
                              <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ fontSize: "1.1rem" }}>🎵</span>
                                  <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#166534" }}>{discForm.audioName || "Voice Note"}</span>
                                </div>
                                <audio controls src={discForm.audioUrl} style={{ height: "32px", maxWidth: "260px" }} />
                              </div>
                            )}
                          </div>

                          {/* 6. ATTACHMENTS & DOCUMENT UPLOAD */}
                          <div style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>📎</span>
                                <span>ATTACHMENTS (DOCUMENTS, IMAGES, PDFS)</span>
                              </span>
                              <label style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "5px 12px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#2563eb", cursor: "pointer" }}>
                                + Choose Files
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                                  onChange={handleAttachmentUpload}
                                  style={{ display: "none" }}
                                />
                              </label>
                            </div>

                            {/* Attachment Chips List */}
                            {discForm.attachments && discForm.attachments.length > 0 ? (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {discForm.attachments.map(att => (
                                  <div
                                    key={att.id}
                                    style={{
                                      background: "#ffffff",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: "6px",
                                      padding: "4px 10px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      fontSize: "0.78rem"
                                    }}
                                  >
                                    <span>{att.type && att.type.startsWith("image/") ? "🖼️" : att.name.endsWith(".pdf") ? "📄" : "📁"}</span>
                                    <span style={{ fontWeight: "700", color: "#0f172a", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {att.name}
                                    </span>
                                    <span style={{ color: "#64748b", fontSize: "0.7rem" }}>({Math.round(att.size / 1024)} KB)</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAttachment(att.id)}
                                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "800", padding: "0 2px" }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>
                                No attachments added yet.
                              </span>
                            )}
                          </div>

                          {/* 7. Action Items (for Action Item type or optional for others) */}
                          {discForm.discussionType === "Action Item" && (
                            <div>
                              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                                ACTION ITEMS / CHECKLIST DELIVERABLES (ONE PER LINE):
                              </label>
                              <textarea
                                rows="2"
                                value={discForm.actionItemsText}
                                onChange={e => setDiscForm({ ...discForm, actionItemsText: e.target.value })}
                                placeholder="e.g.&#10;Verify physical stock tray weights with manager&#10;Configure POS promotion rule"
                                style={{
                                  width: "100%",
                                  padding: "10px",
                                  borderRadius: "8px",
                                  border: "1px solid #cbd5e1",
                                  fontSize: "0.85rem",
                                  outline: "none",
                                  boxSizing: "border-box",
                                  fontFamily: "inherit"
                                }}
                              />
                            </div>
                          )}

                          {/* 8. Priority & Pin Options */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#334155" }}>Priority:</span>
                                <select
                                  value={discForm.priority}
                                  onChange={e => setDiscForm({ ...discForm, priority: e.target.value })}
                                  style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", fontWeight: "700" }}
                                >
                                  <option value="Normal">Normal</option>
                                  <option value="High">High</option>
                                  <option value="Urgent">Urgent</option>
                                  <option value="Critical">Critical</option>
                                </select>
                              </div>

                              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", fontWeight: "700", color: "#475569", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={discForm.isPinned}
                                  onChange={e => setDiscForm({ ...discForm, isPinned: e.target.checked })}
                                  style={{ width: "16px", height: "16px", accentColor: "#4f46e5" }}
                                />
                                <span>📌 Pin to top</span>
                              </label>
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  handleStopRecording();
                                  setIsAddingDiscussion(false);
                                }}
                                style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "9px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "#ffffff", border: "none", padding: "9px 24px", borderRadius: "8px", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 3px 8px rgba(79, 70, 229, 0.3)" }}
                              >
                                ✓ Save & Post Note
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* FILTER & SEGREGATION CONTROLS BAR */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    
                    {/* Row 1: Discussion Type Filters */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {[
                          { id: "All", label: `All Discussions (${allDiscussions.length})`, icon: "📋" },
                          { id: "General", label: `💬 General (${genCount})`, color: "#2563eb", stage: "Lead Stage" },
                          ...(currentStage !== "Lead Stage" ? [{ id: "Audit Note", label: `🔍 Audit Notes (${auditNotesCount})`, color: "#0284c7", stage: "Audit Stage" }] : []),
                          ...(currentStage === "Kickoff Stage" || currentStage === "On-Going Stage" ? [{ id: "Strategy", label: `🎯 Strategy Plans (${stratCount})`, color: "#7c3aed", stage: "Kickoff Stage" }] : []),
                          ...(currentStage === "On-Going Stage" ? [{ id: "Action Item", label: `⚡ Action Items (${actionItemsCount})`, color: "#d97706", stage: "On-Going Stage" }] : [])
                        ].map(t => {
                          const isSelected = discTypeFilter === t.id;
                          const color = t.color || "#4f46e5";
                          return (
                            <button
                              key={t.id}
                              onClick={() => setDiscTypeFilter(t.id)}
                              style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: isSelected ? "800" : "600",
                                cursor: "pointer",
                                border: isSelected ? `1.5px solid ${color}` : "1px solid #cbd5e1",
                                background: isSelected ? `${color}15` : "#ffffff",
                                color: isSelected ? color : "#475569",
                                transition: "all 0.15s ease"
                              }}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Search box */}
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          placeholder="Search discussion, plan, keyword..."
                          value={discSearchQuery}
                          onChange={e => setDiscSearchQuery(e.target.value)}
                          style={{
                            padding: "7px 12px 7px 32px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            width: "260px",
                            fontSize: "0.82rem",
                            outline: "none",
                            background: "#ffffff"
                          }}
                        />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: "absolute", left: "10px", top: "9px" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </div>
                    </div>

                    {/* Row 2: Secondary Dropdown Filters (Category & Sub-Category only when not strictly General) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "12px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                        SEGREGATE BY:
                      </span>

                      {discTypeFilter !== "General" ? (
                        <>
                          {/* Category Filter */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: "600" }}>Category:</span>
                            <select
                              value={discCategoryFilter}
                              onChange={e => {
                                setDiscCategoryFilter(e.target.value);
                                setDiscSubCategoryFilter("All");
                              }}
                              style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: "700", background: "#ffffff", color: "#0f172a" }}
                            >
                              <option value="All">All Categories</option>
                              {allKnownCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          {/* Sub-Category Filter */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: "600" }}>Sub-Category:</span>
                            <select
                              value={discSubCategoryFilter}
                              onChange={e => setDiscSubCategoryFilter(e.target.value)}
                              style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: "700", background: "#ffffff", color: "#0f172a" }}
                            >
                              <option value="All">All Sub-Categories</option>
                              {allKnownSubCategories.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: "0.76rem", color: "#94a3b8", fontStyle: "italic" }}>
                          Categories not applicable for General Discussions (Manual, Voice & Attachments).
                        </span>
                      )}

                      {/* Author Filter */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: "600" }}>Team Member:</span>
                        <select
                          value={discAuthorFilter}
                          onChange={e => setDiscAuthorFilter(e.target.value)}
                          style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: "700", background: "#ffffff", color: "#0f172a" }}
                        >
                          <option value="All">All Authors</option>
                          {allAuthors.map(auth => (
                            <option key={auth} value={auth}>{auth}</option>
                          ))}
                        </select>
                      </div>

                      {/* Reset Filters button */}
                      {(discTypeFilter !== "All" || discCategoryFilter !== "All" || discSubCategoryFilter !== "All" || discAuthorFilter !== "All" || discSearchQuery) && (
                        <button
                          onClick={() => {
                            setDiscTypeFilter("All");
                            setDiscCategoryFilter("All");
                            setDiscSubCategoryFilter("All");
                            setDiscAuthorFilter("All");
                            setDiscSearchQuery("");
                          }}
                          style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "5px 12px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "800", cursor: "pointer" }}
                        >
                          ✕ Clear Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* DISCUSSION & STRATEGY FEED LIST */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {sortedDiscussions.length === 0 ? (
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "48px 24px", textAlign: "center" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#eff6ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", fontSize: "1.5rem" }}>
                          💬
                        </div>
                        <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>
                          No Discussions or Notes Found
                        </h4>
                        <p style={{ margin: "6px 0 16px 0", fontSize: "0.85rem", color: "#64748b", maxWidth: "420px", marginInline: "auto" }}>
                          {allDiscussions.length === 0
                            ? "Start logging general discussions, voice memos, audit notes, strategy plans, or action items."
                            : "No discussions match your active search and filters."}
                        </p>
                        <button
                          onClick={() => handleOpenAddDiscussionModal()}
                          style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 18px", borderRadius: "8px", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)" }}
                        >
                          ＋ Add Discussion Note
                        </button>
                      </div>
                    ) : (
                      sortedDiscussions.map(disc => {
                        const typeCfg = DISCUSSION_TYPES.find(t => t.id === disc.discussionType) || DISCUSSION_TYPES[0];
                        const isPinned = Boolean(disc.isPinned);

                        return (
                          <div
                            key={disc.id}
                            style={{
                              background: "#ffffff",
                              border: isPinned ? "2px solid #f59e0b" : "1px solid #e2e8f0",
                              borderRadius: "12px",
                              padding: "20px 24px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px",
                              boxShadow: isPinned ? "0 4px 14px rgba(245, 158, 11, 0.12)" : "0 1px 3px rgba(0,0,0,0.02)",
                              position: "relative"
                            }}
                          >
                            {/* Card Header: Author Info + Badges + Controls */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                              
                              {/* Author and Date */}
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <img
                                  src={disc.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(disc.authorName || 'User')}`}
                                  alt={disc.authorName}
                                  style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid #e2e8f0" }}
                                />
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>{disc.authorName}</strong>
                                    <span style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#475569", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                      {disc.authorRole || "Consultant"}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    <span>{disc.formattedDate || (disc.date ? new Date(disc.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Recently logged")}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Badges & Actions */}
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                {isPinned && (
                                  <span style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", fontSize: "0.72rem", fontWeight: "800", padding: "2px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#b45309" stroke="#b45309" strokeWidth="1.5"><polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8 12 2"/></svg>
                                    PINNED
                                  </span>
                                )}

                                {/* Discussion Type Badge with Vector SVG Icon */}
                                <span style={{ background: typeCfg.bg, color: typeCfg.color, border: `1px solid ${typeCfg.border}`, fontSize: "0.74rem", fontWeight: "700", padding: "3px 10px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                  {disc.discussionType === "General" || !disc.discussionType ? (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                  ) : disc.discussionType === "Audit Note" ? (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="m9 11 2 2 4-4"/></svg>
                                  ) : disc.discussionType === "Strategy" ? (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/></svg>
                                  ) : (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                  )}
                                  <span>{typeCfg.label}</span>
                                </span>

                                {/* Priority Badge if not normal */}
                                {disc.priority && disc.priority !== "Normal" && (
                                  <span style={{ background: disc.priority === "Critical" ? "#fee2e2" : "#fef3c7", color: disc.priority === "Critical" ? "#b91c1c" : "#b45309", fontSize: "0.7rem", fontWeight: "800", padding: "2px 6px", borderRadius: "4px" }}>
                                    ● {disc.priority}
                                  </span>
                                )}

                                {/* Pin / Unpin Button */}
                                <button
                                  onClick={() => handleTogglePin(disc.id, isPinned)}
                                  style={{
                                    background: isPinned ? "#fef3c7" : "#f8fafc",
                                    border: isPinned ? "1px solid #fde68a" : "1px solid #e2e8f0",
                                    cursor: "pointer",
                                    color: isPinned ? "#d97706" : "#64748b",
                                    borderRadius: "6px",
                                    width: "28px",
                                    height: "28px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.15s ease"
                                  }}
                                  title={isPinned ? "Unpin note" : "Pin to top"}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill={isPinned ? "#d97706" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="17" x2="12" y2="22"/>
                                    <path d="M5 17h14v-2l-2-2V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v8l-2 2v2z"/>
                                  </svg>
                                </button>

                                {/* Copy Button */}
                                <button
                                  onClick={() => handleCopyDiscussion(disc)}
                                  style={{
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    cursor: "pointer",
                                    color: "#64748b",
                                    borderRadius: "6px",
                                    width: "28px",
                                    height: "28px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.15s ease"
                                  }}
                                  title="Copy text to clipboard"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                  </svg>
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteDiscussion(disc.id)}
                                  style={{
                                    background: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    cursor: "pointer",
                                    color: "#ef4444",
                                    borderRadius: "6px",
                                    width: "28px",
                                    height: "28px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.15s ease"
                                  }}
                                  title="Delete note"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Category & Sub-Category Pill (if present) */}
                            {disc.category && (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe", padding: "3px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
                                  <span>{disc.category}</span>
                                  {disc.subCategory && (
                                    <>
                                      <span style={{ color: "#a78bfa" }}>❯</span>
                                      <span style={{ color: "#4c1d95" }}>{disc.subCategory}</span>
                                    </>
                                  )}
                                </span>
                              </div>
                            )}

                            {/* Title */}
                            {disc.title && (
                              <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>
                                {disc.title}
                              </h4>
                            )}

                            {/* Notes Content */}
                            {disc.notes && (
                              <p style={{ margin: 0, fontSize: "0.9rem", color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                {disc.notes}
                              </p>
                            )}

                            {/* Audio Player Feed Component */}
                            {disc.audioUrl && (
                              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                                  <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#1e293b" }}>{disc.audioName || "Voice Note"}</span>
                                </div>
                                <audio controls src={disc.audioUrl} style={{ height: "34px", flex: 1, minWidth: "220px" }} />
                              </div>
                            )}

                            {/* Attachments List Feed Component */}
                            {disc.attachments && disc.attachments.length > 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                                <div style={{ fontSize: "0.74rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                  <span>Attached Files ({disc.attachments.length}):</span>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                  {disc.attachments.map(att => (
                                    <a
                                      key={att.id}
                                      href={att.dataUrl}
                                      download={att.name}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        background: "#eff6ff",
                                        border: "1px solid #bfdbfe",
                                        borderRadius: "6px",
                                        padding: "5px 10px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        textDecoration: "none",
                                        color: "#1e40af",
                                        fontSize: "0.8rem",
                                        fontWeight: "600"
                                      }}
                                    >
                                      {att.type && att.type.startsWith("image/") ? (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                      ) : att.name && att.name.endsWith(".pdf") ? (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                      ) : (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                                      )}
                                      <span>{att.name}</span>
                                      {att.size && <span style={{ color: "#64748b", fontSize: "0.7rem" }}>({Math.round(att.size / 1024)} KB)</span>}
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Items Interactive Checklist */}
                            {disc.actionItems && disc.actionItems.length > 0 && (
                              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px", marginTop: "4px" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#475569", textTransform: "uppercase", marginBottom: "8px" }}>
                                  ⚡ Action Items / Checklist ({disc.actionItems.filter(i => i.completed).length}/{disc.actionItems.length} Done):
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  {disc.actionItems.map((item, idx) => (
                                    <label key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: item.completed ? "#94a3b8" : "#1e293b", textDecoration: item.completed ? "line-through" : "none", cursor: "pointer" }}>
                                      <input
                                        type="checkbox"
                                        checked={Boolean(item.completed)}
                                        onChange={() => handleToggleActionItem(disc.id, idx)}
                                        style={{ width: "16px", height: "16px", accentColor: "#16a34a", cursor: "pointer" }}
                                      />
                                      <span>{item.text}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })()}

            {activeProjectTab === "expenses" && (() => {
              const linkedExps = expenses.filter(e =>
                e.projectId === effectiveProject.id ||
                e.projectName === effectiveProject.name ||
                (e.title && e.title.toLowerCase().includes(effectiveProject.name.toLowerCase()))
              );
              const totalAmountBilled = linkedExps.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "'Poppins', sans-serif" }}>
                  
                  {/* Top Expense KPI Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                    <div style={{ background: "#ffffff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0", borderLeft: "4px solid #5b5fc7" }}>
                      <div style={{ fontSize: "0.74rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Total Billed Expenses</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
                        ₹{totalAmountBilled.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0", borderLeft: "4px solid #10b981" }}>
                      <div style={{ fontSize: "0.74rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Total Claims Logged</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
                        {linkedExps.length} Claims
                      </div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0", borderLeft: "4px solid #f59e0b" }}>
                      <div style={{ fontSize: "0.74rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Pending Approval</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
                        {linkedExps.filter(e => e.status === "Pending").length} Pending
                      </div>
                    </div>
                  </div>

                  {/* Linked Expenses Table Card */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "600", color: "#0f172a", fontFamily: "'Poppins', sans-serif" }}>
                          Linked Expenses Billed to {effectiveProject.name}
                        </h3>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                          All consultant travel, food, stay, and site expenses linked with project ID: <code style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 6px", borderRadius: "4px" }}>{effectiveProject.id}</code>
                        </p>
                      </div>
                    </div>

                    {linkedExps.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                        <span style={{ fontSize: "2rem", display: "block", marginBottom: "8px" }}>🧾</span>
                        <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>No expenses logged against this client project yet.</span>
                      </div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table className="luxury-table" style={{ width: "100%", fontSize: "0.82rem" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc" }}>
                              <th style={{ padding: "10px" }}>Linked Ref ID</th>
                              <th style={{ padding: "10px" }}>Date</th>
                              <th style={{ padding: "10px" }}>Consultant</th>
                              <th style={{ padding: "10px" }}>Category</th>
                              <th style={{ padding: "10px" }}>Expense Title / Description</th>
                              <th style={{ padding: "10px", textAlign: "right" }}>Amount</th>
                              <th style={{ padding: "10px", textAlign: "center" }}>Receipts</th>
                              <th style={{ padding: "10px" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {linkedExps.map((exp) => {
                              const emp = users.find(u => u.id === exp.employeeId) || { name: "Consultant" };
                              const fileCount = (exp.receipts && exp.receipts.length) || (exp.receiptUrl || exp.receipt ? 1 : 0);
                              const isPending = exp.status === "Pending";
                              const isApproved = exp.status === "Approved";

                              return (
                                <tr key={exp.id} style={{ height: "46px" }}>
                                  <td style={{ fontWeight: "600", color: "#2563eb", fontFamily: "monospace", fontSize: "0.78rem" }}>
                                    {exp.id}
                                  </td>
                                  <td>{exp.expenseDate || exp.date || exp.submittedDate}</td>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <img src={emp.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}`} alt={emp.name} style={{ width: "22px", height: "22px", borderRadius: "50%" }} />
                                      <span style={{ fontWeight: "500" }}>{emp.name}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <span style={{
                                      fontSize: "0.72rem",
                                      fontWeight: "500",
                                      padding: "3px 8px",
                                      borderRadius: "4px",
                                      background: exp.category === "Food" ? "#fef3c7" : exp.category === "Accommodation" ? "#e0f2fe" : "#f1f5f9",
                                      color: exp.category === "Food" ? "#b45309" : exp.category === "Accommodation" ? "#0369a1" : "#475569"
                                    }}>
                                      {exp.category}
                                    </span>
                                  </td>
                                  <td style={{ color: "#334155", maxWidth: "240px", wordBreak: "break-word" }}>
                                    {exp.title || exp.description}
                                  </td>
                                  <td style={{ textAlign: "right", fontWeight: "600", color: "#0f172a" }}>
                                    ₹{Number(exp.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    {fileCount > 0 ? (
                                      <span style={{ fontSize: "0.75rem", background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "4px", fontWeight: "500" }}>
                                        📎 {fileCount} file{fileCount !== 1 ? "s" : ""}
                                      </span>
                                    ) : (
                                      <span style={{ color: "#cbd5e1" }}>No receipts</span>
                                    )}
                                  </td>
                                  <td>
                                    <span style={{
                                      fontSize: "0.72rem",
                                      fontWeight: "600",
                                      padding: "3px 8px",
                                      borderRadius: "4px",
                                      background: isApproved ? "#dcfce7" : isPending ? "#fef9c3" : "#fee2e2",
                                      color: isApproved ? "#15803d" : isPending ? "#a16207" : "#b91c1c"
                                    }}>
                                      {exp.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}

            {/* ── MODAL: CREATE / EDIT CUSTOM PHASE ── */}
            {showPhaseModal && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                        {editingPhaseId ? "✏️ Edit Phase Details" : "➕ Create New Implementation Phase"}
                      </h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                        {effectiveProject.name} Roadmap Configuration
                      </p>
                    </div>
                    <button onClick={() => setShowPhaseModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
                  </div>

                  <form onSubmit={handleSavePhase} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                          Phase # *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={phaseNumInput}
                          onChange={e => setPhaseNumInput(Number(e.target.value))}
                          required
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", fontWeight: "700" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                          Short Name (Badge) *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Discovery & Audit"
                          value={phaseNameInput}
                          onChange={e => setPhaseNameInput(e.target.value)}
                          required
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Full Phase Title / Header Banner
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Phase 1: Store Operations & Inventory Control Audit"
                        value={phaseFullNameInput}
                        onChange={e => setPhaseFullNameInput(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Lead Consultant / Project Lead
                      </label>
                      <select
                        value={phaseLeadInput}
                        onChange={e => setPhaseLeadInput(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      >
                        <option value="">Select Lead Consultant...</option>
                        {(users || []).map(u => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role || u.title || "Consultant"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={phaseStartDateInput}
                          onChange={e => setPhaseStartDateInput(e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={phaseEndDateInput}
                          onChange={e => setPhaseEndDateInput(e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                        />
                      </div>
                    </div>

                    {phaseStartDateInput && phaseEndDateInput && (
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: "8px", fontSize: "0.82rem", color: "#166534", fontWeight: "700" }}>
                        ⏱️ Calculated Duration: {getDurationInDays(phaseStartDateInput, phaseEndDateInput)?.days || 0} Days ({getDurationInDays(phaseStartDateInput, phaseEndDateInput)?.weeks || "0 Wks"})
                      </div>
                    )}

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Phase Objectives & Deliverables Scope
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Primary milestones, audit outcomes, and deliverables for this phase..."
                        value={phaseObjectiveInput}
                        onChange={e => setPhaseObjectiveInput(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Theme Accent Color
                      </label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {["#2563eb", "#16a34a", "#7c3aed", "#ea580c", "#0284c7", "#db2777", "#d97706", "#0d9488"].map(c => (
                          <button
                            type="button"
                            key={c}
                            onClick={() => setPhaseColorInput(c)}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: c,
                              border: phaseColorInput === c ? "3px solid #0f172a" : "2px solid #ffffff",
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }}
                          />
                        ))}
                        <input
                          type="color"
                          value={phaseColorInput}
                          onChange={e => setPhaseColorInput(e.target.value)}
                          style={{ width: "36px", height: "36px", border: "none", background: "none", cursor: "pointer" }}
                          title="Custom color"
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: editingPhaseId ? "space-between" : "flex-end", alignItems: "center", marginTop: "12px" }}>
                      {editingPhaseId && (
                        <button
                          type="button"
                          onClick={(e) => handleDeletePhase(editingPhaseId, phaseNumInput, e)}
                          style={{ padding: "10px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                        >
                          🗑️ Delete Phase
                        </button>
                      )}
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          type="button"
                          onClick={() => setShowPhaseModal(false)}
                          style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{ padding: "10px 22px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                        >
                          {editingPhaseId ? "Save Phase" : "Add Phase"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── MODAL: SCHEDULE / EDIT PHASE TASK DELIVERABLE ── */}
            {showTaskModal && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                        {editingTaskId ? "✏️ Edit Phase Task / Deliverable" : `➕ Allocate Task to Phase ${taskPhaseNum}`}
                      </h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                        {effectiveProject.name} Implementation Roadmap
                      </p>
                    </div>
                    <button onClick={() => setShowTaskModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
                  </div>

                  <form onSubmit={handleSavePhaseTask} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Implementation Phase *
                      </label>
                      <select
                        value={taskPhaseNum}
                        onChange={e => setTaskPhaseNum(Number(e.target.value))}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", fontWeight: "600" }}
                      >
                        {projectPhaseGroups.map(ph => (
                          <option key={ph.id || ph.num} value={ph.num}>
                            {ph.fullName || `Phase ${ph.num}: ${ph.name}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Task Objective & Specification *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Physical Vault Stock Count & RFID Scanner Integration"
                        value={taskTitle}
                        onChange={e => setTaskTitle(e.target.value)}
                        required
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Assigned Consultant / Lead
                      </label>
                      <select
                        value={taskConsultant}
                        onChange={e => setTaskConsultant(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      >
                        <option value="">Select Consultant / Team Member...</option>
                        {(users || []).map(u => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role || u.title || "Consultant"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={taskStartDate}
                          onChange={e => setTaskStartDate(e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={taskEndDate}
                          onChange={e => setTaskEndDate(e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                          Status
                        </label>
                        <select
                          value={taskStatus}
                          onChange={e => {
                            const newStat = e.target.value;
                            setTaskStatus(newStat);
                            if (newStat === "Completed") setTaskProgress(100);
                            else if (newStat === "In Progress" && taskProgress === 0) setTaskProgress(50);
                            else if (newStat === "Scheduled") setTaskProgress(0);
                          }}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Delayed">Delayed</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                          Progress ({taskProgress}%)
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={taskProgress}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setTaskProgress(val);
                              if (val === 100) setTaskStatus("Completed");
                              else if (val > 0 && taskStatus === "Scheduled") setTaskStatus("In Progress");
                            }}
                            style={{ flex: 1, accentColor: "#2563eb" }}
                          />
                          <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#2563eb", width: "40px", textAlign: "right" }}>
                            {taskProgress}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Notes / Deliverable Scope
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Key milestones, deliverables, and checklist items for this task..."
                        value={taskNotes}
                        onChange={e => setTaskNotes(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: editingTaskId ? "space-between" : "flex-end", alignItems: "center", marginTop: "10px" }}>
                      {editingTaskId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            handleDeletePhaseTask(editingTaskId, e);
                            setShowTaskModal(false);
                          }}
                          style={{ padding: "10px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                        >
                          🗑️ Delete Task
                        </button>
                      )}
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          type="button"
                          onClick={() => setShowTaskModal(false)}
                          style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{ padding: "10px 22px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)" }}
                        >
                          {editingTaskId ? "Save Changes" : "Create Task"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── MODAL: SCHEDULE EVENT / CALL / TRAINING ── */}
            {showEventModal && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>
                      Schedule Project Event / Call / Training
                    </h3>
                    <button onClick={() => setShowEventModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
                  </div>

                  <form onSubmit={handleCreateEventSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Event / Task Category
                      </label>
                      <select
                        value={evtType}
                        onChange={e => setEvtType(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      >
                        <option value="Call Scheduling">📞 Call Scheduling (Phone / Video Discussion)</option>
                        <option value="Offline Visit Scheduling">🏢 Offline Visit Scheduling (On-Site Store Visit)</option>
                        <option value="Training Session Scheduling">🎓 Training Session Scheduling (Sales Staff Coaching)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Event Title / Objective *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Q3 Store Performance Review Call"
                        value={evtTitle}
                        onChange={e => setEvtTitle(e.target.value)}
                        required
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                          Date *
                        </label>
                        <input
                          type="date"
                          value={evtDate}
                          onChange={e => setEvtDate(e.target.value)}
                          required
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                          Time *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 11:00 AM"
                          value={evtTime}
                          onChange={e => setEvtTime(e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Assigned Consultant / Lead
                      </label>
                      <select
                        value={evtConsultant}
                        onChange={e => setEvtConsultant(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      >
                        <option value="Darla Manikanta">Darla Manikanta</option>
                        <option value="Shikhar Jain">Shikhar Jain</option>
                        <option value="Hemanth Kumar Jain">Hemanth Kumar Jain</option>
                        <option value="Sophia Laurent">Sophia Laurent</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Agenda & Notes
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Details of what will be discussed or executed..."
                        value={evtNotes}
                        onChange={e => setEvtNotes(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setShowEventModal(false)}
                        style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{ padding: "10px 22px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Schedule Event
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── MODAL: RECORD OFFLINE CLIENT VISIT (MULTI-CONSULTANT SUPPORT) ── */}
            {showVisitModal && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>
                      Record Offline Client Visit & Timeline Log
                    </h3>
                    <button onClick={() => setShowVisitModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
                  </div>

                  <form onSubmit={handleRecordVisitSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Visit Title / Primary Objective *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Visit #3: Stock Vault Audit & Staff Coaching"
                        value={vTitle}
                        onChange={e => setVTitle(e.target.value)}
                        required
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                          Start Date *
                        </label>
                        <input
                          type="date"
                          value={vStart}
                          onChange={e => setVStart(e.target.value)}
                          required
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                          End Date *
                        </label>
                        <input
                          type="date"
                          value={vEnd}
                          onChange={e => setVEnd(e.target.value)}
                          required
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                        />
                      </div>
                    </div>

                    {/* Multi-Consultant Selection (Sometimes 2 people visit at a time!) */}
                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Visiting Team (Select all consultants who visited together) *
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        {["Darla Manikanta", "Shikhar Jain", "Hemanth Kumar Jain", "Sophia Laurent"].map(name => {
                          const isChecked = vConsultants.includes(name);
                          return (
                            <label key={name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#1e293b", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setVConsultants(prev => [...prev, name]);
                                  } else {
                                    setVConsultants(prev => prev.filter(n => n !== name));
                                  }
                                }}
                                style={{ accentColor: "#059669" }}
                              />
                              <span>{name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Key Understandings & Observations (What was discovered/observed)
                      </label>
                      <textarea
                        rows="3"
                        placeholder="e.g., Discovered 4.2% discrepancy in gold ornament weight; sales team lacks bridal upselling techniques."
                        value={vUnderstandings}
                        onChange={e => setVUnderstandings(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Work Done / Deliverables Completed in Visit
                      </label>
                      <textarea
                        rows="3"
                        placeholder="e.g., Audited 1,250 ornament tags, conducted 4-hour sales floor coaching session, implemented daily ledger logbook."
                        value={vWorkDone}
                        onChange={e => setVWorkDone(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Follow-Up Action Item
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Schedule follow-up call on 25th July to review diamond cross-sell ratio."
                        value={vFollowUp}
                        onChange={e => setVFollowUp(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setShowVisitModal(false)}
                        style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{ padding: "10px 22px", background: "#059669", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Record Client Visit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── MODAL: STAGE PROMOTION CONFIRMATION POPUP (YES/NO) ── */}
            {promoteConfirmation && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", gap: "18px" }}>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", fontSize: "1.3rem", flexShrink: 0 }}>
                      🚀
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.18rem", fontWeight: "800", color: "#0f172a" }}>
                        Promote Project Stage?
                      </h3>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                        Lifecycle Progression Confirmation
                      </p>
                    </div>
                  </div>

                  <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                    <p style={{ margin: 0, fontSize: "0.95rem", color: "#1e293b", lineHeight: "1.55" }}>
                      Are you sure you want to promote <strong>{promoteConfirmation.project?.name}</strong> from <span style={{ color: "#475569", fontWeight: "700" }}>{promoteConfirmation.currentStage}</span> to <span style={{ color: "#4f46e5", fontWeight: "800" }}>{promoteConfirmation.targetStage}</span>?
                    </p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <button
                      type="button"
                      onClick={() => setPromoteConfirmation(null)}
                      style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "700", fontSize: "0.86rem", cursor: "pointer" }}
                    >
                      No, Stay Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPromoteStage}
                      style={{ padding: "10px 24px", background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "0.86rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)" }}
                    >
                      Yes, Save & Move Next ➔
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ── MODAL: DISCONTINUE PROJECT WITH REASON CAPTURE ── */}
            {showDiscontinueModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", fontSize: "1.2rem", flexShrink: 0 }}>
                        🛑
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.18rem", fontWeight: "800", color: "#dc2626" }}>
                          Discontinue Project?
                        </h3>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                          Confirmation & Audit History Capture
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setShowDiscontinueModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
                  </div>

                  <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "14px" }}>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#991b1b", lineHeight: "1.5" }}>
                      Are you sure you want to discontinue <strong>{discontinueTargetProject?.name}</strong> from <strong>{getProjectStage(discontinueTargetProject)}</strong>?
                    </p>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      Discontinuation Reason / Remarks *
                    </label>
                    <textarea
                      rows="3"
                      placeholder="e.g., Client paused expansion; commercial terms mismatch; showroom fitout delay..."
                      value={discontinueReasonInput}
                      onChange={e => setDiscontinueReasonInput(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setShowDiscontinueModal(false)}
                      style={{ padding: "9px 18px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "8px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
                    >
                      No, Stay Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDiscontinue}
                      style={{ padding: "9px 22px", background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 10px rgba(220, 38, 38, 0.25)" }}
                    >
                      Yes, Discontinue Project 🛑
                    </button>
                  </div>
                </div>
              </div>
            )}

        </div>

      </div>
    );
  }

  return (
    <div className="projects-view-container" style={{ padding: "4px 0", display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            {isConsultant ? "My Assigned Client Projects Hub" : "Projects & Client Hub"}
          </h2>
          <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
            {isConsultant 
              ? "Track your assigned clients, store locations, site visits, deliverables, and linked expense claims"
              : "Manage client lifecycle from Lead Inquiries, Pre-Audits, Kickoff Decisions to On-Going Execution"}
          </p>
        </div>
        {!isConsultant && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: "#4f46e5",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "9px 18px",
              fontWeight: "700",
              fontSize: "0.84rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 6px rgba(79, 70, 229, 0.2)"
            }}
          >
            <span>＋</span> Register New Project / Lead
          </button>
        )}
      </div>

      {/* Summary KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px" }}>
        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #334155" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
            {isConsultant ? "MY CLIENTS" : "TOTAL PROJECTS"}
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {roleScopedProjects.length} <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: "600" }}>({activeCount} Active)</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #d97706" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "#d97706", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px" }}>
            <StageIcon stage="Lead Stage" size={14} color="#d97706" />
            LEAD STAGE
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {leadCount} <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "500" }}>leads</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #4f46e5" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px" }}>
            <StageIcon stage="Audit Stage" size={14} color="#4f46e5" />
            AUDIT STAGE
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {auditCount} <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "500" }}>auditing</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #0284c7" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px" }}>
            <StageIcon stage="Kickoff Stage" size={14} color="#0284c7" />
            KICKOFF STAGE
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {kickoffCount} <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "500" }}>pending</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #16a34a" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px" }}>
            <StageIcon stage="On-Going Stage" size={14} color="#16a34a" />
            ON-GOING
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {ongoingCount} <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: "600" }}>active</span>
          </div>
        </div>
      </div>

      {/* Stage Tabs & Search Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: "8px", flexWrap: "wrap", gap: "12px" }}>
        
        {/* Stage Filter Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "All", label: `All (${roleScopedProjects.length})`, stage: null },
            { id: "Lead Stage", label: `Lead Stage (${leadCount})`, color: "#d97706", stage: "Lead Stage" },
            { id: "Audit Stage", label: `Audit Stage (${auditCount})`, color: "#4f46e5", stage: "Audit Stage" },
            { id: "Kickoff Stage", label: `Kickoff Stage (${kickoffCount})`, color: "#0284c7", stage: "Kickoff Stage" },
            { id: "On-Going Stage", label: `On-Going (${ongoingCount})`, color: "#16a34a", stage: "On-Going Stage" },
            { id: "Discontinued Stage", label: `Discontinued (${discontinuedCount})`, color: "#dc2626", stage: "Discontinued Stage" }
          ].map(st => {
            const isSelected = stageFilter === st.id;
            const btnColor = st.color || "#4f46e5";

            return (
              <button
                key={st.id}
                onClick={() => setStageFilter(st.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: isSelected ? "800" : "600",
                  cursor: "pointer",
                  border: isSelected ? `1.5px solid ${btnColor}` : "1px solid #cbd5e1",
                  background: isSelected ? `${btnColor}15` : "#ffffff",
                  color: isSelected ? btnColor : "#475569",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease"
                }}
              >
                {st.stage && <StageIcon stage={st.stage} size={13} color={isSelected ? btnColor : "#64748b"} />}
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search project, client, or code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: "7px 12px 7px 32px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              width: "260px",
              fontSize: "0.82rem",
              outline: "none",
              background: "#ffffff"
            }}
          />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: "absolute", left: "10px", top: "9px" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      </div>

      {/* Minimalistic Projects Grid with Drag-and-Drop & Stage Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        {filteredProjects.map(proj => {
          const projExpenses = expenses.filter(e => e.projectId === proj.id || e.projectName === proj.name);
          const stage = getProjectStage(proj);
          const stageCfg = STAGE_CONFIG[stage] || STAGE_CONFIG["On-Going Stage"];
          const isDiscontinued = stage === "Discontinued Stage";

          return (
            <div
              key={proj.id}
              draggable
              onDragStart={() => setDraggedProjectId(proj.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedProjectId && draggedProjectId !== proj.id) {
                  handleDropToStage(draggedProjectId, stage);
                }
              }}
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "8px",
                border: isDiscontinued ? "1px solid #fecaca" : "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "16px",
                transition: "all 0.15s ease",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
              onClick={() => { handleSelectProject(proj); setActiveProjectTab("business"); }}
            >
              <div>
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: "800",
                        letterSpacing: "0.05em",
                        color: "#4f46e5",
                        background: "#e0e7ff",
                        border: "1px solid #c7d2fe",
                        padding: "2px 8px",
                        borderRadius: "4px"
                      }}
                    >
                      {proj.code}
                    </span>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: "8px 0 4px 0" }}>
                      {proj.name}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0, fontWeight: "500" }}>
                      Client: <strong style={{ color: "#334155" }}>{proj.client}</strong>
                    </p>
                  </div>

                  {/* Stage Badge */}
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      background: stageCfg.bg,
                      border: `1px solid ${stageCfg.border}`,
                      color: stageCfg.color,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    <StageIcon stage={stage} size={12} color={stageCfg.color} />
                    <span>{stageCfg.badge}</span>
                  </span>
                </div>

                {/* Discontinued banner notice */}
                {isDiscontinued && (
                  <div style={{ margin: "6px 0", background: "#fef2f2", padding: "8px 12px", borderRadius: "6px", fontSize: "0.75rem", color: "#991b1b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <StageIcon stage="Discontinued Stage" size={14} color="#dc2626" />
                    <span>Discontinued from {proj.discontinuedFromStage || "Kickoff Stage"}: <em>{proj.discontinuedReason || "N/A"}</em></span>
                  </div>
                )}

                {/* Details Pills */}
                <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "10px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
                  <span>📍 {proj.location && proj.location !== "HQ / Client Site" && proj.location !== "On-site" ? proj.location : "—"}</span>
                  <span>💬 {proj.discussions?.length || 0} Discussions</span>
                  <span>💸 {projExpenses.length} Expenses</span>
                  {proj.preAuditData?.gmeetLink && <span>📹 G-Meet Linked</span>}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                
                {/* Stage Quick Advance / Reactivate Button */}
                <div>
                  {stage === "Lead Stage" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestAdvanceStage(proj, "Audit Stage");
                      }}
                      style={{ background: "#e0e7ff", color: "#4338ca", border: "1px solid #c7d2fe", borderRadius: "4px", padding: "5px 10px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <StageIcon stage="Audit Stage" size={12} color="#4338ca" />
                      <span>Promote to Audit ➔</span>
                    </button>
                  )}

                  {stage === "Audit Stage" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestAdvanceStage(proj, "Kickoff Stage");
                      }}
                      style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: "4px", padding: "5px 10px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <StageIcon stage="Kickoff Stage" size={12} color="#0369a1" />
                      <span>Advance to Kickoff ➔</span>
                    </button>
                  )}

                  {stage === "Kickoff Stage" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestAdvanceStage(proj, "On-Going Stage");
                      }}
                      style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "4px", padding: "5px 10px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <StageIcon stage="On-Going Stage" size={12} color="#15803d" />
                      <span>Start Project ➔</span>
                    </button>
                  )}

                  {isDiscontinued && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReactivateProject(proj);
                      }}
                      style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "4px", padding: "5px 10px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <span>↩ Reactivate</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectProject(proj);
                  }}
                  style={{
                    background: "#4f46e5",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "7px 16px",
                    fontWeight: "700",
                    fontSize: "0.78rem",
                    cursor: "pointer"
                  }}
                >
                  Open Project Hub ➔
                </button>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="glass-card" style={{ gridColumn: "1 / -1", padding: "36px", textAlign: "center", color: "#64748b" }}>
            No projects found in <strong>{stageFilter}</strong>. Click "+ Register New Project / Lead" to add one!
          </div>
        )}
      </div>

      {/* ── CREATE NEW PROJECT / LEAD SLIDE-OVER DRAWER ── */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 9600,
            display: "flex",
            alignItems: "stretch",
            justifyContent: "flex-end"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#ffffff",
              width: "520px",
              maxWidth: "100vw",
              height: "100vh",
              overflowY: "auto",
              boxShadow: "-10px 0 35px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px 16px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img src={logoImg} alt="Acme Logo" style={{ height: "34px", objectFit: "contain" }} />
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "#111827" }}>Register Project / Lead</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.4rem", color: "#9ca3af", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateProjectSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px", flexGrow: 1 }}>
              
              {/* Stage Selection Dropdown */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#374151", marginBottom: "6px", display: "block" }}>
                  Project Initial Lifecycle Stage *
                </label>
                <select
                  value={newStage}
                  onChange={e => setNewStage(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: "0.9rem",
                    border: "1.5px solid #4f46e5",
                    borderRadius: "6px",
                    outline: "none",
                    boxSizing: "border-box",
                    background: "#f5f3ff",
                    color: "#312e81",
                    fontWeight: "700"
                  }}
                >
                  <option value="Lead Stage">🎯 Lead Stage (Potential Inquiry & Meta Form)</option>
                  <option value="Audit Stage">🔍 Audit Stage (Pre-Audit & Checklist)</option>
                  <option value="Kickoff Stage">🚀 Kickoff Stage (Audit Done, Awaiting Onboarding)</option>
                  <option value="On-Going Stage">⚡ On-Going Stage (Default Active Execution)</option>
                </select>
              </div>

              {/* Meta Leads fields if Lead Stage */}
              {newStage === "Lead Stage" && (
                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: "14px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#92400e" }}>
                    🎯 Meta Ads Inbound Lead Capture
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#78350f", marginBottom: "4px", display: "block" }}>Campaign Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Meta Jewellery Brand Scaling 2026"
                      value={metaCampaignInput}
                      onChange={e => setMetaCampaignInput(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", fontSize: "0.85rem", border: "1px solid #cbd5e1", borderRadius: "4px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#78350f", marginBottom: "4px", display: "block" }}>Lead Form Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Instant Lead Inquiry Form"
                      value={metaFormNameInput}
                      onChange={e => setMetaFormNameInput(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", fontSize: "0.85rem", border: "1px solid #cbd5e1", borderRadius: "4px", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              )}

              {/* Project Name */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                  Client Brand / Project Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Heerabhai Jewellers Store Expansion"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: "0.95rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              {/* POC */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                    POC Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Heerabhai Kothari"
                    value={pocName}
                    onChange={e => setPocName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                    POC Contact
                  </label>
                  <input
                    type="text"
                    placeholder="10-digit mobile"
                    value={pocContact}
                    maxLength={10}
                    onChange={e => setPocContact(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              {/* Business Model Selection */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                  Business Model *
                </label>
                <select
                  value={newBusinessModel}
                  onChange={e => setNewBusinessModel(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: "0.9rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    outline: "none",
                    boxSizing: "border-box",
                    background: "#ffffff",
                    fontWeight: "600",
                    color: "#0f172a"
                  }}
                >
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail & Wholesale">Retail & Wholesale</option>
                  <option value="Retail & Manufacturing">Retail & Manufacturing</option>
                  <option value="Wholesale & Manufacturing">Wholesale & Manufacturing</option>
                  <option value="Retail, Wholesale & Manufacturing">Retail, Wholesale & Manufacturing (Integrated)</option>
                </select>
              </div>

              {/* Two Column: Project code & Assigned Consultant */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                    Project Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HBL-BD-01"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                    Assigned Consultant
                  </label>
                  <select
                    value={assignedConsultantId}
                    onChange={e => setAssignedConsultantId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      outline: "none",
                      boxSizing: "border-box",
                      background: "#fff"
                    }}
                  >
                    <option value="">-- Select Consultant --</option>
                    {(users || []).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role || "Consultant"})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", fontSize: "0.88rem", border: "1px solid #d1d5db", borderRadius: "6px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", fontSize: "0.88rem", border: "1px solid #d1d5db", borderRadius: "6px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div style={{ marginTop: "auto", borderTop: "1px solid #f1f5f9", paddingTop: "16px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#374151",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 24px",
                    background: "#4f46e5",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)"
                  }}
                >
                  Register Project
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: STAGE PROMOTION CONFIRMATION POPUP (YES/NO) ── */}
      {promoteConfirmation && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", gap: "18px" }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", fontSize: "1.3rem", flexShrink: 0 }}>
                🚀
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.18rem", fontWeight: "800", color: "#0f172a" }}>
                  Promote Project Stage?
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                  Lifecycle Progression Confirmation
                </p>
              </div>
            </div>

            <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#1e293b", lineHeight: "1.55" }}>
                Are you sure you want to promote <strong>{promoteConfirmation.project?.name}</strong> from <span style={{ color: "#475569", fontWeight: "700" }}>{promoteConfirmation.currentStage}</span> to <span style={{ color: "#4f46e5", fontWeight: "800" }}>{promoteConfirmation.targetStage}</span>?
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setPromoteConfirmation(null)}
                style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "700", fontSize: "0.86rem", cursor: "pointer" }}
              >
                No, Stay Back
              </button>
              <button
                type="button"
                onClick={handleConfirmPromoteStage}
                style={{ padding: "10px 24px", background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "0.86rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)" }}
              >
                Yes, Save & Move Next ➔
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL: DISCONTINUE PROJECT WITH REASON CAPTURE (ACCESSIBLE FROM ANY STAGE) ── */}
      {showDiscontinueModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", fontSize: "1.2rem", flexShrink: 0 }}>
                  🛑
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.18rem", fontWeight: "800", color: "#dc2626" }}>
                    Discontinue Project?
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                    Confirmation & Audit History Capture
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDiscontinueModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "14px" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#991b1b", lineHeight: "1.5" }}>
                Are you sure you want to discontinue <strong>{discontinueTargetProject?.name}</strong> from <strong>{getProjectStage(discontinueTargetProject)}</strong>?
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                Discontinuation Reason / Remarks *
              </label>
              <textarea
                rows="3"
                placeholder="e.g., Client paused expansion; commercial terms mismatch; showroom fitout delay..."
                value={discontinueReasonInput}
                onChange={e => setDiscontinueReasonInput(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => setShowDiscontinueModal(false)}
                style={{ padding: "9px 18px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "8px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
              >
                No, Stay Back
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscontinue}
                style={{ padding: "9px 22px", background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 10px rgba(220, 38, 38, 0.25)" }}
              >
                Yes, Discontinue Project 🛑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT CUSTOM PHASE ── */}
      {showPhaseModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                  {editingPhaseId ? "✏️ Edit Phase Details" : "➕ Create New Implementation Phase"}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                  {effectiveProject.name} Roadmap Configuration
                </p>
              </div>
              <button onClick={() => setShowPhaseModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleSavePhase} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    Phase # *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={phaseNumInput}
                    onChange={e => setPhaseNumInput(Number(e.target.value))}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", fontWeight: "700" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    Short Name (Badge) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Discovery & Audit"
                    value={phaseNameInput}
                    onChange={e => setPhaseNameInput(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Full Phase Title / Header Banner
                </label>
                <input
                  type="text"
                  placeholder="e.g. Phase 1: Store Operations & Inventory Control Audit"
                  value={phaseFullNameInput}
                  onChange={e => setPhaseFullNameInput(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Lead Consultant / Project Lead
                </label>
                <select
                  value={phaseLeadInput}
                  onChange={e => setPhaseLeadInput(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                >
                  <option value="">Select Lead Consultant...</option>
                  {(users || []).map(u => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role || u.title || "Consultant"})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={phaseStartDateInput}
                    onChange={e => setPhaseStartDateInput(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={phaseEndDateInput}
                    onChange={e => setPhaseEndDateInput(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>
              </div>

              {phaseStartDateInput && phaseEndDateInput && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: "8px", fontSize: "0.82rem", color: "#166534", fontWeight: "700" }}>
                  ⏱️ Calculated Duration: {getDurationInDays(phaseStartDateInput, phaseEndDateInput)?.days || 0} Days ({getDurationInDays(phaseStartDateInput, phaseEndDateInput)?.weeks || "0 Wks"})
                </div>
              )}

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Phase Objectives & Deliverables Scope
                </label>
                <textarea
                  rows="2"
                  placeholder="Primary milestones, audit outcomes, and deliverables for this phase..."
                  value={phaseObjectiveInput}
                  onChange={e => setPhaseObjectiveInput(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Theme Accent Color
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {["#2563eb", "#16a34a", "#7c3aed", "#ea580c", "#0284c7", "#db2777", "#d97706", "#0d9488"].map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setPhaseColorInput(c)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: c,
                        border: phaseColorInput === c ? "3px solid #0f172a" : "2px solid #ffffff",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={phaseColorInput}
                    onChange={e => setPhaseColorInput(e.target.value)}
                    style={{ width: "36px", height: "36px", border: "none", background: "none", cursor: "pointer" }}
                    title="Custom color"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: editingPhaseId ? "space-between" : "flex-end", alignItems: "center", marginTop: "12px" }}>
                {editingPhaseId && (
                  <button
                    type="button"
                    onClick={(e) => handleDeletePhase(editingPhaseId, phaseNumInput, e)}
                    style={{ padding: "10px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                  >
                    🗑️ Delete Phase
                  </button>
                )}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowPhaseModal(false)}
                    style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "10px 22px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                  >
                    {editingPhaseId ? "Save Phase" : "Add Phase"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SCHEDULE / EDIT PHASE TASK DELIVERABLE ── */}
      {showTaskModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                  {editingTaskId ? "✏️ Edit Phase Task / Deliverable" : `➕ Allocate Task to Phase ${taskPhaseNum}`}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                  {effectiveProject.name} Implementation Roadmap
                </p>
              </div>
              <button onClick={() => setShowTaskModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleSavePhaseTask} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Implementation Phase *
                </label>
                <select
                  value={taskPhaseNum}
                  onChange={e => setTaskPhaseNum(Number(e.target.value))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", fontWeight: "600" }}
                >
                  {projectPhaseGroups.map(ph => (
                    <option key={ph.id || ph.num} value={ph.num}>
                      {ph.fullName || `Phase ${ph.num}: ${ph.name}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Task Objective & Specification *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physical Vault Stock Count & RFID Scanner Integration"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Assigned Consultant / Lead
                </label>
                <select
                  value={taskConsultant}
                  onChange={e => setTaskConsultant(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                >
                  <option value="">Select Consultant / Team Member...</option>
                  {(users || []).map(u => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role || u.title || "Consultant"})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={taskStartDate}
                    onChange={e => setTaskStartDate(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={taskEndDate}
                    onChange={e => setTaskEndDate(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    Status
                  </label>
                  <select
                    value={taskStatus}
                    onChange={e => {
                      const newStat = e.target.value;
                      setTaskStatus(newStat);
                      if (newStat === "Completed") setTaskProgress(100);
                      else if (newStat === "In Progress" && taskProgress === 0) setTaskProgress(50);
                      else if (newStat === "Scheduled") setTaskProgress(0);
                    }}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    Progress ({taskProgress}%)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={taskProgress}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setTaskProgress(val);
                        if (val === 100) setTaskStatus("Completed");
                        else if (val > 0 && taskStatus === "Scheduled") setTaskStatus("In Progress");
                      }}
                      style={{ flex: 1, accentColor: "#2563eb" }}
                    />
                    <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#2563eb", width: "40px", textAlign: "right" }}>
                      {taskProgress}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Notes / Deliverable Scope
                </label>
                <textarea
                  rows="2"
                  placeholder="Key milestones, deliverables, and checklist items for this task..."
                  value={taskNotes}
                  onChange={e => setTaskNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: editingTaskId ? "space-between" : "flex-end", alignItems: "center", marginTop: "10px" }}>
                {editingTaskId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleDeletePhaseTask(editingTaskId, e);
                      setShowTaskModal(false);
                    }}
                    style={{ padding: "10px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                  >
                    🗑️ Delete Task
                  </button>
                )}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "10px 22px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)" }}
                  >
                    {editingTaskId ? "Save Changes" : "Create Task"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SCHEDULE EVENT / CALL / TRAINING ── */}
      {showEventModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>
                Schedule Project Event / Call / Training
              </h3>
              <button onClick={() => setShowEventModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleCreateEventSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Event / Task Category
                </label>
                <select
                  value={evtType}
                  onChange={e => setEvtType(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                >
                  <option value="Call Scheduling">📞 Call Scheduling (Phone / Video Discussion)</option>
                  <option value="Offline Visit Scheduling">🏢 Offline Visit Scheduling (On-Site Store Visit)</option>
                  <option value="Training Session Scheduling">🎓 Training Session Scheduling (Sales Staff Coaching)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Event Title / Objective *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Q3 Store Performance Review Call"
                  value={evtTitle}
                  onChange={e => setEvtTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={evtDate}
                    onChange={e => setEvtDate(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    Time *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:00 AM"
                    value={evtTime}
                    onChange={e => setEvtTime(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Assigned Consultant / Lead
                </label>
                <select
                  value={evtConsultant}
                  onChange={e => setEvtConsultant(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                >
                  <option value="Darla Manikanta">Darla Manikanta</option>
                  <option value="Shikhar Jain">Shikhar Jain</option>
                  <option value="Hemanth Kumar Jain">Hemanth Kumar Jain</option>
                  <option value="Sophia Laurent">Sophia Laurent</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Agenda & Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="Details of what will be discussed or executed..."
                  value={evtNotes}
                  onChange={e => setEvtNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 22px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RECORD OFFLINE CLIENT VISIT (MULTI-CONSULTANT SUPPORT) ── */}
      {showVisitModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>
                Record Offline Client Visit & Timeline Log
              </h3>
              <button onClick={() => setShowVisitModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleRecordVisitSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Visit Title / Primary Objective *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Visit #3: Stock Vault Audit & Staff Coaching"
                  value={vTitle}
                  onChange={e => setVTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={vStart}
                    onChange={e => setVStart(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={vEnd}
                    onChange={e => setVEnd(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>
              </div>

              {/* Multi-Consultant Selection (Sometimes 2 people visit at a time!) */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Visiting Team (Select all consultants who visited together) *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  {["Darla Manikanta", "Shikhar Jain", "Hemanth Kumar Jain", "Sophia Laurent"].map(name => {
                    const isChecked = vConsultants.includes(name);
                    return (
                      <label key={name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#1e293b", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setVConsultants(prev => [...prev, name]);
                            } else {
                              setVConsultants(prev => prev.filter(n => n !== name));
                            }
                          }}
                          style={{ accentColor: "#059669" }}
                        />
                        <span>{name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Key Understandings & Observations (What was discovered/observed)
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g., Discovered 4.2% discrepancy in gold ornament weight; sales team lacks bridal upselling techniques."
                  value={vUnderstandings}
                  onChange={e => setVUnderstandings(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Work Done / Deliverables Completed in Visit
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g., Audited 1,250 ornament tags, conducted 4-hour sales floor coaching session, implemented daily ledger logbook."
                  value={vWorkDone}
                  onChange={e => setVWorkDone(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Follow-Up Action Item
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule follow-up call on 25th July to review diamond cross-sell ratio."
                  value={vFollowUp}
                  onChange={e => setVFollowUp(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 22px", background: "#059669", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Record Client Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
