import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { initialProjects } from "../data/initialData";
import logoImg from "../assets/logo.png";

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

export default function ProjectsView() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { 
    projects, 
    addProject, 
    updateProject, 
    addProjectDiscussion, 
    addProjectVisit,
    addProjectScheduledEvent,
    toggleProjectChecklistItem,
    users, 
    expenses, 
    currentUser, 
    isAuthenticated,
    setToast 
  } = useApp();

  const [statusFilter, setStatusFilter] = useState("All"); // 'All', 'Active', 'Completed', 'On Hold'
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

  // Auth Protection Check
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/auth/login" replace />;
  }

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
      businessModel: biz.businessModel || "Pure Retailer",
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
    businessModel: "Pure Retailer",
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

  // New Discussion Form
  const [discText, setDiscText] = useState("");
  const [discCategory, setDiscCategory] = useState("Client Update");

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

  // New Project Form (matches exact Create project drawer design)
  const [assignedConsultantId, setAssignedConsultantId] = useState("");
  const [newName, setNewName] = useState("");
  const [pocName, setPocName] = useState("");
  const [pocContact, setPocContact] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newStatus, setNewStatus] = useState("In Progress");
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

  // Filtered projects
  const filteredProjects = roleScopedProjects.filter(p => {
    const matchesStatus = statusFilter === "All" || p.status === statusFilter || (statusFilter === "Active" && p.status === "In Progress");
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      !q || 
      p.name?.toLowerCase().includes(q) || 
      p.code?.toLowerCase().includes(q) || 
      (p.pocName && p.pocName.toLowerCase().includes(q)) ||
      (p.client && p.client.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // Calculate high-level stats
  const activeCount = roleScopedProjects.filter(p => p.status === "Active" || p.status === "In Progress").length;
  const totalBudget = roleScopedProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalDiscussions = roleScopedProjects.reduce((sum, p) => sum + (p.discussions?.length || 0), 0);

  // Handlers
  const handleCreateProjectSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) {
      setToast({ message: "Please fill required fields (Project name & Project code).", type: "error" });
      return;
    }

    const assignedUser = (users || []).find(u => u.id === assignedConsultantId);
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
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || "",
      description: description || "",
      linkExpensesEnabled: linkExpensesEnabled
    });

    setToast({ message: `Project '${newName}' created successfully!`, type: "success" });
    setNewName("");
    setAssignedConsultantId("");
    setPocName("");
    setPocContact("");
    setNewCode("");
    setNewStatus("In Progress");
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
        businessModel: bizDetails.businessModel || "Pure Retailer",
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
                  <span style={{
                    background: (effectiveProject.status || "Active").toLowerCase() === "active" ? "#dcfce7" : "#fff7ed",
                    color: (effectiveProject.status || "Active").toLowerCase() === "active" ? "#16a34a" : "#d97706",
                    padding: "2px 10px", borderRadius: "14px", fontSize: "0.75rem", fontWeight: "800"
                  }}>
                    ● {effectiveProject.status || "Active"}
                  </span>
                </div>

                {/* Subtitle with Started on & Dynamic Owner */}
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span>Started on {effectiveProject.startDate || "2026-07-01"}</span>
                  <span>•</span>
                  <span>Owner: <strong style={{ color: "#0f172a" }}>{effectiveProject.owner || (effectiveProject.assignedConsultants && effectiveProject.assignedConsultants[0]) || currentUser?.name || "Darla Manikanta"}</strong></span>
                  {!isConsultant && (
                    <button onClick={handleStartEditBusiness} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "700", padding: "0 4px", display: "inline-flex", alignItems: "center" }} title="Edit Business Details">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons & Right Close ✕ Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              
              {/* Assign Consultant Dropdown Widget - ADMIN ONLY */}
              {!isConsultant ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "4px 10px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                    👤 Assign Consultant:
                  </span>
                  <select
                    value={effectiveProject.assignedConsultantId || (effectiveProject.assignedConsultants && effectiveProject.assignedConsultants[0]) || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedUser = (users || []).find(u => u.id === selectedId || u.empCode === selectedId || u.emp_code === selectedId);
                      const consultantName = selectedUser ? selectedUser.name : "";
                      const assignedList = selectedUser 
                        ? Array.from(new Set([selectedUser.id, selectedUser.empCode, selectedUser.emp_code, selectedUser.email, selectedUser.name].filter(Boolean)))
                        : [];
                      
                      updateProject(effectiveProject.id, {
                        assignedConsultantId: selectedId,
                        assignedConsultantName: consultantName,
                        assignedConsultant: consultantName,
                        assignedConsultants: assignedList
                      });

                      const updated = projects.find(p => p.id === selectedProject.id);
                      if (updated) {
                        setSelectedProject({ 
                          ...updated, 
                          assignedConsultantId: selectedId, 
                          assignedConsultantName: consultantName,
                          assignedConsultant: consultantName,
                          assignedConsultants: assignedList
                        });
                      }

                      if (setToast) {
                        setToast({ 
                          message: selectedId ? `✓ Project assigned to ${consultantName}! It will now appear on all devices.` : "Consultant assignment removed.", 
                          type: "success" 
                        });
                      }
                    }}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.82rem",
                      fontWeight: "800",
                      background: "#ffffff",
                      color: "#0f172a",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="">-- Select Active Consultant --</option>
                    {(users || []).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role || "Consultant"} • {u.email || u.empCode || u.id})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "6px 12px", fontSize: "0.82rem", fontWeight: "700", color: "#166534" }}>
                  <span>👤 Assigned Lead:</span>
                  <strong style={{ color: "#15803d" }}>{effectiveProject.assignedConsultantName || effectiveProject.assignedConsultant || currentUser?.name || "Consultant"}</strong>
                </div>
              )}
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
          {/* RED MARKED DETAILS CARD (MOVED INSIDE UPPER CARD ABOVE TAB BAR) */}
          {/* ------------------------------------------------------------- */}
          <div style={{ margin: "16px 0 14px 0", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "0.85rem", color: "#475569", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>
                <span style={{ color: "#64748b" }}>Business Model:</span>
                <strong style={{ color: "#0f172a" }}>{bizDetails.businessModel || "Pure Retailer"}</strong>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ color: "#64748b" }}>HQ Location:</span>
                <strong style={{ color: "#0f172a" }}>{bizDetails.headOffice || (effectiveProject.location && effectiveProject.location !== "HQ / Client Site" ? effectiveProject.location : "") || "HQ / Client Site"}</strong>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/></svg>
                <span style={{ color: "#64748b" }}>Showrooms:</span>
                <strong style={{ color: "#0f172a" }}>{bizDetails.showroomCount || "1"}</strong>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderTop: "1px solid #e2e8f0", paddingTop: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800", textTransform: "uppercase" }}>PRODUCT LINE / SKILLS:</span>
              {(bizDetails.productLine ? bizDetails.productLine.split(",") : ["Fine Diamond Jewellery", "High-Carat Gold Ornaments", "Polki Solitaires"]).map((tag, tIdx) => (
                <span key={tIdx} style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", padding: "2px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* RECTANGLE PILL TAB NAVIGATION BAR (WITH SEPARATE ACCENT COLOR) */}
          {/* ------------------------------------------------------------- */}
          <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "12px", paddingBottom: "14px", overflowX: "auto" }}>
            {[
              { id: "business", label: "Business Details" },
              { id: "audit", label: "Audit Report" },
              { id: "plan", label: "Project Plan" },
              { id: "tasks", label: `Tasks & Planner (${totalTasksCount})` },
              { id: "visits", label: `Visit & Review History (${effectiveProject.clientVisits?.length || 5})` },
              { id: "documents", label: "Documents & Deliverables" },
              { id: "team", label: "Assigned Team" },
              { id: "discussions", label: "Discussions & Logs" },
              { id: "expenses", label: `Linked Expenses (${linkedExps.length})` }
            ].map(tab => (
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
                        {bizDetails.businessModel || "Pure Retailer"}
                      </p>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>BOUTIQUES & HEAD OFFICE</span>
                      <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                        {bizDetails.showroomCount || "1"} Showroom{Number(bizDetails.showroomCount || 1) !== 1 ? "s" : ""} ({bizDetails.headOffice || (effectiveProject.location && effectiveProject.location !== "HQ / Client Site" ? effectiveProject.location : "") || "Main Showroom"})
                      </p>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>ANNUAL REVENUE & HEADCOUNT</span>
                      <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                        {bizDetails.revenueBracket && bizDetails.revenueBracket !== "Select Range..." ? bizDetails.revenueBracket : "—"} {bizDetails.headcount ? `(${bizDetails.headcount} Staff)` : ""}
                      </p>
                    </div>

                    {/* Store Location GPS Coordinates Card */}
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "10px", gridColumn: "span 3" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: "800", textTransform: "uppercase" }}>STORE LOCATION GPS COORDINATES (AUDIT TARGET)</span>
                            <p style={{ margin: "2px 0 0 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                              {bizDetails.headOfficeCoordinates?.lat ? (
                                <>
                                  {bizDetails.headOfficeCoordinates.lat}° N, {bizDetails.headOfficeCoordinates.lng}° E
                                  <span style={{ marginLeft: "10px", fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>
                                    ({bizDetails.headOfficeCoordinates.address || bizDetails.headOffice || effectiveProject.location || "Store Location"})
                                  </span>
                                </>
                              ) : (
                                <span style={{ color: "#475569", fontSize: "0.88rem", fontWeight: "600" }}>
                                  📍 {bizDetails.headOffice || (effectiveProject.location && effectiveProject.location !== "HQ / Client Site" ? effectiveProject.location : "") || "Location address registered in profile"}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {bizDetails.headOfficeCoordinates?.lat ? (
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${bizDetails.headOfficeCoordinates.lat}&mlon=${bizDetails.headOfficeCoordinates.lng}#map=16/${bizDetails.headOfficeCoordinates.lat}/${bizDetails.headOfficeCoordinates.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ background: "#ffffff", color: "#16a34a", border: "1px solid #86efac", padding: "6px 14px", borderRadius: "6px", fontWeight: "800", fontSize: "0.78rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            View Store on Map
                          </a>
                        ) : (
                          <button
                            onClick={handleStartEditBusiness}
                            style={{ background: "#ffffff", color: "#16a34a", border: "1px solid #86efac", padding: "6px 14px", borderRadius: "6px", fontWeight: "800", fontSize: "0.78rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                          >
                            ✏️ Add GPS Coordinates
                          </button>
                        )}
                      </div>
                    </div>
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
                          { name: effectiveProject.pocName || "Store Director", designation: "Managing Director / POC", contact: effectiveProject.pocContact || "—" }
                        ]).map((s, sIdx) => (
                          <tr key={sIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px", fontWeight: "700", color: "#0f172a" }}>{s.name}</td>
                            <td style={{ padding: "8px", color: "#2563eb", fontWeight: "600" }}>{s.designation}</td>
                            <td style={{ padding: "8px", color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                              {s.contact || "—"}
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
                      {bizDetails.purposeOfApproach || effectiveProject.engagementPurpose || "Client approached for consulting advisory, stock reconciliation, and retail growth."}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#1e3a8a", fontStyle: "italic" }}>
                      "Challenge: {bizDetails.primaryChallenge || "Describe how metal weight variance, inventory reconciliation, or sales tracking issues affect daily workflow..."}"
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
                              <select value={bizForm.businessModel} onChange={e => setBizForm({...bizForm, businessModel: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}>
                                <option>Pure Retailer</option>
                                <option>Wholesaler</option>
                                <option>Manufacturer</option>
                                <option>Omnichannel Retail + Wholesale</option>
                                <option>Bespoke Atelier</option>
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

            {/* TAB 2: AUDIT REPORT */}
            {activeProjectTab === "audit" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleDirectFileUpload}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  style={{ display: "none" }}
                />

                {auditDocs.length === 0 ? (
                  /* EMPTY STATE WHEN NO DOCUMENT IS UPLOADED INITIALY */
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "50px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </div>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>No Audit Document Uploaded</h3>
                    <p style={{ margin: "0 0 20px 0", fontSize: "0.85rem", color: "#64748b", maxWidth: "420px" }}>
                      No audit report has been uploaded for this client yet. Click below to select and upload your audit document directly.
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

                        // PDF / DEFAULT DOCUMENT VIEWER:
                        // 1. MOBILE PHONE (Android / iOS): Use MobilePdfViewer (HTML5 Canvas via PDF.js)
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

                        // 2. LAPTOP / DESKTOP (UNCHANGED): Render clean inline iframe web viewer
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

            {/* OTHER TABS (PLAN, TASKS, VISITS, DOCUMENTS, TEAM, DISCUSSIONS, EXPENSES) */}
            {activeProjectTab === "plan" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", margin: "0 0 16px 0" }}>Project Implementation Plan Roadmap</h3>
                <div style={{ width: "100%", height: "12px", background: "#f1f5f9", borderRadius: "6px", overflow: "hidden" }}>
                  <div style={{ width: "75%", height: "100%", background: "#2563eb" }} />
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

            {activeProjectTab === "discussions" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Discussions & Team Activity Logs</h3>
              </div>
            )}

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

        </div>

      </div>
    );
  }

  return (
    <div className="projects-view-container" style={{ padding: "4px 0", display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            {isConsultant ? "My Assigned Client Projects Hub" : "Projects & Client Hub"}
          </h2>
          <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
            {isConsultant 
              ? "Track your assigned clients, store locations, site visits, deliverables, and linked expense claims"
              : "Track client engagements, project discussions, assigned teams, and linked expense claims"}
          </p>
        </div>
        {!isConsultant && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: "#4c478a",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "9px 18px",
              fontWeight: "600",
              fontSize: "0.84rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 4px rgba(76, 71, 138, 0.15)"
            }}
          >
            <span>＋</span> Register New Project
          </button>
        )}
      </div>

      {/* Summary KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "4px", border: "1px solid #e2e8f0", borderLeft: "4px solid #4c478a" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {isConsultant ? "MY ASSIGNED CLIENTS / PROJECTS" : "TOTAL PROJECTS"}
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
            {roleScopedProjects.length} <span style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: "500" }}>({activeCount} Active)</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "4px", border: "1px solid #e2e8f0", borderLeft: "4px solid #7c3aed" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            PROJECT DISCUSSIONS
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
            {totalDiscussions} <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "400" }}>notes logged</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "4px", border: "1px solid #e2e8f0", borderLeft: "4px solid #d97706" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {isConsultant ? "ACTIVE STORE LOCATIONS" : "ASSIGNED CONSULTANTS"}
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
            {isConsultant ? roleScopedProjects.length : consultants.length} <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "400" }}>{isConsultant ? "active sites" : "active leads"}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: "4px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {["All", "Active", "Completed", "On Hold"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "5px 14px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: statusFilter === st ? "600" : "500",
                cursor: "pointer",
                border: statusFilter === st ? "1px solid #4c478a" : "1px solid #cbd5e1",
                background: statusFilter === st ? "#f5f3ff" : "#ffffff",
                color: statusFilter === st ? "#4c478a" : "#475569"
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search project, code or client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: "7px 12px 7px 32px",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
              width: "280px",
              fontSize: "0.82rem",
              outline: "none",
              background: "#ffffff"
            }}
          />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: "absolute", left: "10px", top: "9px" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      </div>

      {/* Minimalistic Projects Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        {filteredProjects.map(proj => {
          const projExpenses = expenses.filter(e => e.projectId === proj.id || e.projectName === proj.name);

          return (
            <div
              key={proj.id}
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "4px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "16px",
                transition: "all 0.15s ease",
                cursor: "pointer"
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
                        fontWeight: "700",
                        letterSpacing: "0.05em",
                        color: "#4c478a",
                        background: "#f5f3ff",
                        border: "1px solid #ddd6fe",
                        padding: "2px 8px",
                        borderRadius: "3px"
                      }}
                    >
                      {proj.code}
                    </span>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#0f172a", margin: "8px 0 4px 0" }}>
                      {proj.name}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0, fontWeight: "500" }}>
                      Client: <strong style={{ color: "#334155" }}>{proj.client}</strong>
                    </p>
                  </div>

                  {/* Clean Status Badge */}
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: "500",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      background: proj.status === "Active" ? "#f0fdf4" : proj.status === "On Hold" ? "#fff7ed" : "#f0f9ff",
                      border: proj.status === "Active" ? "1px solid #bbf7d0" : proj.status === "On Hold" ? "1px solid #fed7aa" : "1px solid #bae6fd",
                      color: proj.status === "Active" ? "#16a34a" : proj.status === "On Hold" ? "#ea580c" : "#0284c7"
                    }}
                  >
                    ● {proj.status}
                  </span>
                </div>

                {/* Details Pills */}
                <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "12px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <span>📍 {proj.location || "On-site"}</span>
                  <span>💬 {proj.discussions?.length || 0} Discussions</span>
                  <span>💸 {projExpenses.length} Expense Claims</span>
                </div>
              </div>

              {/* Minimalistic Footer Row (Sourcing Budget Removed) */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectProject(proj);
                  }}
                  style={{
                    background: "#4c478a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "7px 16px",
                    fontWeight: "600",
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
          <div className="glass-card" style={{ gridColumn: "1 / -1", padding: "32px", textAlign: "center", color: "#64748b" }}>
            No projects found matching your query. Click "+ Register New Project" to add one!
          </div>
        )}
      </div>

      {/* ── CREATE NEW PROJECT SLIDE-OVER DRAWER ── */}
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
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "#111827" }}>Create project</h2>
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
            <form onSubmit={handleCreateProjectSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", flexGrow: 1 }}>
              
              {/* Project Name */}
              <div>
                <input
                  type="text"
                  placeholder="Enter project name (e.g. Heerabhai Jewellers Store Expansion)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
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
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                  POC
                </label>
                <input
                  type="text"
                  placeholder="Enter POC name (e.g. Heerabhai Kothari)"
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
                <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px", display: "block" }}>
                  This cannot be changed later.
                </span>
              </div>

              {/* POC Contact Details (Numbers only up to 10 digits) */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                  POC Contact Details
                </label>
                <input
                  type="text"
                  placeholder="Enter 10-digit mobile number"
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

              {/* Two Column: Project code & Project status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    Project code <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>ⓘ</span>
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
                    Project status
                  </label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
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
                    <option value="In Progress">In Progress</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Optional Description */}
              <div>
                {!showDescription ? (
                  <button
                    type="button"
                    onClick={() => setShowDescription(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    + Project description (optional)
                  </button>
                ) : (
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                      Project description
                    </label>
                    <textarea
                      placeholder="Add description regarding scope, deliverables, or objectives..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows="3"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "0.88rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        outline: "none",
                        resize: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Section: Duration */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: "700", color: "#111827" }}>
                  Duration
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                      Project start date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "0.88rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                      Project end date (optional)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "0.88rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
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
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)"
                  }}
                >
                  Create
                </button>
              </div>

            </form>
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
