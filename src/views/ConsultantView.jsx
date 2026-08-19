import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import ProjectsView from "./ProjectsView";

export default function ConsultantView({ activeTab }) {
  const { 
    currentUser, 
    users,
    expenses, 
    projects,
    addExpense, 
    checkInConsultant, 
    checkOutConsultant, 
    getEmployeeBalanceDetails,
    getEmployeeLedger,
    advanceRequests,
    requestAdvance,
    setToast,
    settings,
    leaveRequests,
    applyLeave,
    cancelLeave,
    getLeaveBalance,
    generatePayslip,
    updateUserProfile
  } = useApp();

  // Digital clock state
  const [time, setTime] = useState(new Date());

  // Form states
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [receiptPreviews, setReceiptPreviews] = useState([]);
  const [activeReceiptIdx, setActiveReceiptIdx] = useState(0);
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseProjectId, setExpenseProjectId] = useState("");
  const [punchRemarks, setPunchRemarks] = useState("");
  const [punchProjectId, setPunchProjectId] = useState("");

  const handleReceiptFileUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      Promise.all(
        fileList.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsDataURL(file);
          });
        })
      ).then((newImages) => {
        setReceiptPreviews((prev) => [...prev, ...newImages]);
      });
    }
  };

  const handleRemoveReceipt = (idxToRemove) => {
    setReceiptPreviews((prev) => {
      const updated = prev.filter((_, idx) => idx !== idxToRemove);
      if (activeReceiptIdx >= updated.length) {
        setActiveReceiptIdx(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const [advAmount, setAdvAmount] = useState("");
  const [advPurpose, setAdvPurpose] = useState("");

  // Modal profile & Keka Profile Tab states
  // All Modal States
  const [showCheckInWizard, setShowCheckInWizard] = useState(false);
  const [showCheckOutWizard, setShowCheckOutWizard] = useState(false);
  const [checkOutWizardStep, setCheckOutWizardStep] = useState(1);
  const [checkOutSelfiePhoto, setCheckOutSelfiePhoto] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSelfOnboardingModal, setShowSelfOnboardingModal] = useState(false);
  const [profileStep, setProfileStep] = useState(1);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedWizardProjectId, setSelectedWizardProjectId] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();

  // Profile & Sub-tab States
  const [ledgerViewMode, setLedgerViewMode] = useState("grid");
  const [mainNavTab, setMainNavTab] = useState("HOME");
  const [profileTab, setProfileTab] = useState("TIME");
  const [timeSubTab, setTimeSubTab] = useState("Attendance");
  const [statsRange, setStatsRange] = useState("Last Week");

  // Sync mainNavTab with activeTab prop or current URL route
  useEffect(() => {
    const path = (location.pathname || window.location.pathname || "").toLowerCase();
    if (activeTab === "projects" || path.includes("projects")) {
      setMainNavTab("PROJECTS");
    } else if (activeTab === "attendance" || activeTab === "punch" || path.includes("attendance")) {
      setMainNavTab("ATTENDANCE");
    } else if (activeTab === "expenses" || activeTab === "reports" || path.includes("expenses")) {
      setMainNavTab("EXPENSES");
    } else if (activeTab === "dashboard" || path.includes("dashboard")) {
      setMainNavTab("HOME");
    } else if (activeTab === "leaves" || path.includes("leaves")) {
      setMainNavTab("LEAVES");
    } else if (activeTab === "payslips" || path.includes("payslips")) {
      setMainNavTab("PAYSLIPS");
    }
  }, [activeTab, location.pathname]);

  // Step 1: Purpose & Scope of Work
  const [visitPurpose, setVisitPurpose] = useState("Client Site Advisory & Store Operations Audit");
  const [scopeTasks, setScopeTasks] = useState([]);
  const [newScopeInput, setNewScopeInput] = useState("");

  // Step 2: Location Detection (GPS) & Search
  const [gpsData, setGpsData] = useState({
    lat: null,
    lng: null,
    address: "",
    isVerified: false,
    isDetecting: false,
    errorMsg: ""
  });
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Real Camera & Selfie Capture States
  const [selfiePhoto, setSelfiePhoto] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [wizardCheckOutRemarks, setWizardCheckOutRemarks] = useState("");
  const [wizardCompletedTasks, setWizardCompletedTasks] = useState([]);
  const [wizardPendingTasks, setWizardPendingTasks] = useState([]);

  const formatClockTime = (dateObj) => {
    if (!dateObj) return "";
    return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatClockDate = (dateObj) => {
    if (!dateObj) return "";
    return dateObj.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" });
  };

  // Fallback default project for newly registered consultants
  const defaultGeneralProject = {
    id: "general-store-001",
    name: "ACME Retail Flagship Store (Seoni, MP)",
    code: "STORE-HQ",
    location: "Seoni, Madhya Pradesh",
    businessModel: "Retail & Client Advisory Store"
  };

  // Filter projects assigned STRICTLY to the logged in consultant across all devices
  const consultantAssignedProjects = (projects || []).filter(p => {
    if (!p || !currentUser) return false;

    const userKeys = [
      currentUser.id,
      currentUser.empCode,
      currentUser.emp_code,
      currentUser.email?.toLowerCase(),
      currentUser.name?.toLowerCase()
    ].filter(Boolean);

    // 1. Check direct assignedConsultantId
    if (p.assignedConsultantId) {
      const target = String(p.assignedConsultantId).toLowerCase().trim();
      if (userKeys.some(k => String(k).toLowerCase().trim() === target)) return true;
    }

    // 2. Check direct assignedConsultant string or assignedConsultantName
    if (p.assignedConsultant) {
      const target = String(p.assignedConsultant).toLowerCase().trim();
      if (userKeys.some(k => String(k).toLowerCase().trim() === target)) return true;
    }
    if (p.assignedConsultantName) {
      const target = String(p.assignedConsultantName).toLowerCase().trim();
      if (userKeys.some(k => String(k).toLowerCase().trim() === target)) return true;
    }

    // 3. Check assignedConsultants array
    if (p.assignedConsultants && Array.isArray(p.assignedConsultants)) {
      const assignedList = p.assignedConsultants.map(a => String(a).toLowerCase().trim());
      // Direct key match
      if (userKeys.some(k => assignedList.includes(String(k).toLowerCase().trim()))) return true;

      // Cross-referencing user directory match across devices
      const matchedViaDirectory = p.assignedConsultants.some(assignedId => {
        const found = (users || []).find(u => 
          u.id === assignedId || 
          u.empCode === assignedId || 
          u.emp_code === assignedId || 
          (u.email && u.email.toLowerCase() === String(assignedId).toLowerCase()) ||
          (u.name && u.name.toLowerCase() === String(assignedId).toLowerCase())
        );
        if (!found) return false;
        return (
          found.id === currentUser.id ||
          (found.email && found.email.toLowerCase() === (currentUser.email || "").toLowerCase()) ||
          (found.empCode && found.empCode === currentUser.empCode) ||
          (found.emp_code && found.emp_code === currentUser.empCode) ||
          (found.name && found.name.toLowerCase() === (currentUser.name || "").toLowerCase())
        );
      });
      if (matchedViaDirectory) return true;
    }

    return false;
  });

  const displayProjects = consultantAssignedProjects;

  const handleOpenCheckInWizard = () => {
    setSelectedWizardProjectId(""); // Mandatory: Starts unselected so user is forced to pick
    setWizardStep(1);
    setShowCheckInWizard(true);
  };

  const handleOpenCheckOutWizard = () => {
    setWizardCheckOutRemarks(punchRemarks || "");
    setCheckOutWizardStep(1);
    setSelfiePhoto("");
    setShowCheckOutWizard(true);
  };

  // Auto-connect camera stream to video element whenever step changes or modal opens
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.log("Video auto-play handled:", e));
    }
  }, [cameraStream, wizardStep, checkOutWizardStep, showCheckInWizard, showCheckOutWizard]);

  // Clean up camera stream on modal close
  useEffect(() => {
    if (!showCheckInWizard && !showCheckOutWizard && cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
      setCameraActive(false);
    }
  }, [showCheckInWizard, showCheckOutWizard]);

  // -------------------------------------------------------------
  // REAL CAMERA & REVERSE GEOCODING HELPERS
  // -------------------------------------------------------------
  const startCamera = async () => {
    setCameraActive(true);
    setCameraPermissionDenied(false);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log("Video play error:", e));
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraPermissionDenied(true);
      if (setToast) setToast({ message: "⚠️ Browser camera blocked or unavailable. You can use '📱 Open Phone Camera / Upload Photo' below.", type: "warning" });
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const captureSelfieSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      // Mirror the horizontal flip for front camera selfie
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setSelfiePhoto(dataUrl);
      if (showCheckOutWizard) {
        setCheckOutSelfiePhoto(dataUrl);
      }
      stopCamera();
      if (setToast) setToast({ message: "📸 Selfie photo captured & verified successfully!", type: "success" });
      return dataUrl;
    }
    return null;
  };

  const handleSelfieFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawData = event.target.result;
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setSelfiePhoto(compressedDataUrl);
          if (showCheckOutWizard) {
            setCheckOutSelfiePhoto(compressedDataUrl);
          }
          stopCamera();
          if (setToast) setToast({ message: "📸 Selfie photo verified & attached!", type: "success" });
        };
        img.src = rawData;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetectGpsLocation = () => {
    setGpsData({ lat: null, lng: null, address: "", isVerified: false, isDetecting: true, errorMsg: "" });
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          let exactAddr = `${lat}° N, ${lng}° E`;

          try {
            // Tier 1: Photon Hyper-Local Geocoding (100% Free, No Credit Card, Zero Billing Mandate)
            const photonRes = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
            const photonData = await photonRes.json();
            if (photonData && photonData.features && photonData.features.length > 0) {
              const p = photonData.features[0].properties;
              const place = p.name || "";
              const street = [p.housenumber, p.street].filter(Boolean).join(" ");
              const colony = p.locality || p.district || "";
              const city = p.city || "";
              const state = p.state || "";
              const postcode = p.postcode || "";
              const country = p.country || "India";

              const parts = [place, street, colony, city, state, postcode, country].filter(Boolean);
              const cleanParts = parts.filter((item, index, self) => self.indexOf(item) === index);
              if (cleanParts.length > 0) {
                exactAddr = `${cleanParts.join(", ")} (${lat}, ${lng})`;
              }
            }

            // Fallback to Nominatim if needed
            if (exactAddr === `${lat}° N, ${lng}° E` || exactAddr.length < 15) {
              const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1`, {
                headers: { "Accept-Language": "en" }
              });
              const nomData = await nomRes.json();
              if (nomData && nomData.address) {
                const a = nomData.address;
                const place = nomData.name || a.amenity || a.shop || a.building || a.office || "";
                const houseAndRoad = [a.house_number, a.road].filter(Boolean).join(" ");
                const colony = a.neighbourhood || a.suburb || a.residential || "";
                const city = a.city || a.town || a.village || "";
                const state = a.state || "";
                const postcode = a.postcode || "";
                const country = a.country || "India";
                
                const parts = [place, houseAndRoad, colony, city, state, postcode, country].filter(Boolean);
                const cleanParts = parts.filter((item, index, self) => self.indexOf(item) === index);
                exactAddr = `${cleanParts.join(", ")} (${lat}, ${lng})`;
              }
            }
          } catch (e) {
            console.log("Reverse geocode fetch error:", e);
            exactAddr = `Location Pin (${lat}, ${lng})`;
          }

          setGpsData({
            lat,
            lng,
            address: exactAddr,
            isVerified: true,
            isDetecting: false,
            errorMsg: ""
          });
          if (setToast) setToast({ message: `📍 Live Location Verified: ${exactAddr.substring(0, 45)}...`, type: "success" });
        },
        (err) => {
          console.warn("GPS Geolocation error:", err);
          let errorText = "Unable to retrieve device GPS coordinates.";
          if (err.code === 1) errorText = "Location access was denied. Please allow location permissions in your browser.";
          else if (err.code === 2) errorText = "GPS position unavailable. Please ensure Device Location / GPS is turned ON.";
          else if (err.code === 3) errorText = "GPS location request timed out.";

          setGpsData({
            lat: null,
            lng: null,
            address: "",
            isVerified: false,
            isDetecting: false,
            errorMsg: errorText
          });
          if (setToast) setToast({ message: `⚠️ ${errorText}`, type: "warning" });
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    } else {
      setGpsData({
        lat: null,
        lng: null,
        address: "",
        isVerified: false,
        isDetecting: false,
        errorMsg: "Browser geolocation is not supported on this device."
      });
    }
  };

  const handleSearchLocation = async (query) => {
    setLocationSearchQuery(query);
    if (!query || query.trim().length < 3) {
      setLocationSearchResults([]);
      return;
    }
    setIsSearchingLocation(true);
    try {
      // 100% Free Photon search with colony/building autocomplete
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&bbox=68.1,6.5,97.4,35.5`);
      const data = await res.json();
      if (data && data.features) {
        const formattedResults = data.features.map(f => {
          const p = f.properties;
          const coords = f.geometry.coordinates;
          const label = [p.name, p.housenumber, p.street, p.locality || p.district, p.city, p.state, p.postcode].filter(Boolean).join(", ");
          return {
            lat: coords[1],
            lon: coords[0],
            display_name: label || p.name || query
          };
        });
        setLocationSearchResults(formattedResults);
      }
    } catch (e) {
      console.error("Location search error:", e);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectLocationSearchResult = (item) => {
    const lat = parseFloat(parseFloat(item.lat).toFixed(6));
    const lng = parseFloat(parseFloat(item.lon).toFixed(6));
    const formatted = `${item.display_name} (${lat}, ${lng})`;
    setGpsData({
      lat,
      lng,
      address: formatted,
      isVerified: true,
      isDetecting: false,
      errorMsg: ""
    });
    setLocationSearchResults([]);
    setLocationSearchQuery("");
    if (setToast) setToast({ message: `📍 Selected Location: ${item.display_name.substring(0, 45)}...`, type: "success" });
  };

  const handleAddScopeTask = () => {
    if (!newScopeInput.trim()) return;
    setScopeTasks(prev => [...prev, { id: Date.now(), text: newScopeInput.trim(), done: true }]);
    setNewScopeInput("");
  };

  const handleToggleScopeTask = (id) => {
    setScopeTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleCompleteCheckInSubmit = (e) => {
    if (e) e.preventDefault();
    if (!currentUser?.id) {
      if (setToast) setToast({ message: "No active session found.", type: "error" });
      return;
    }
    if (displayProjects.length === 0 || !selectedWizardProjectId) {
      if (setToast) setToast({ message: "⚠️ Mandatory Field Missing: You must select an assigned Client Project Site to check in.", type: "error" });
      return;
    }
    if (!selfiePhoto) {
      if (setToast) setToast({ message: "⚠️ Mandatory: Please take or upload a selfie photo before starting your shift.", type: "error" });
      return;
    }
    const selProj = displayProjects.find(p => p.id === selectedWizardProjectId);
    if (!selProj) {
      if (setToast) setToast({ message: "⚠️ Mandatory Field Missing: Selected Client Project is invalid or unassigned.", type: "error" });
      return;
    }
    const projId = selProj.id;
    const projName = selProj.name || selProj.code || "Client Project Site";

    if (checkInConsultant) {
      checkInConsultant(currentUser.id, {
        remarks: `${visitPurpose} | Location: ${gpsData.address || "Client Project Site"}`,
        projectId: projId,
        projectName: projName,
        tasks: scopeTasks.filter(t => t.done).map(t => t.text),
        coordinates: gpsData.lat && gpsData.lng ? `${gpsData.lat}, ${gpsData.lng}` : null,
        address: gpsData.address || "Client Project Site",
        selfie: selfiePhoto
      });
      if (setToast) setToast({ message: `✓ Checked in successfully for ${projName}!`, type: "success" });
    }

    stopCamera();
    setShowCheckInWizard(false);
    setPunchRemarks("");
    setSelfiePhoto("");
  };

  const handleCompleteCheckOutSubmit = (e) => {
    if (e) e.preventDefault();
    if (!currentUser?.id) {
      if (setToast) setToast({ message: "No active session found.", type: "error" });
      return;
    }
    const finalSelfie = checkOutSelfiePhoto || selfiePhoto;
    if (!finalSelfie) {
      if (setToast) setToast({ message: "⚠️ Mandatory: Please take or upload a check-out selfie photo before closing your shift.", type: "error" });
      return;
    }
    if (checkOutConsultant) {
      checkOutConsultant(currentUser.id, {
        remarks: wizardCheckOutRemarks || punchRemarks || "Daily Shift Check Out",
        checkOutAddress: gpsData.address || "Client Project Site",
        checkOutCoordinates: gpsData.lat && gpsData.lng ? `${gpsData.lat}, ${gpsData.lng}` : null,
        checkOutSelfie: finalSelfie,
        completedTasks: wizardCompletedTasks,
        pendingTasks: wizardPendingTasks
      });
      if (setToast) setToast({ message: "✓ Checked out successfully. Shift logged with selfie & location!", type: "success" });
    }
    stopCamera();
    setShowCheckOutWizard(false);
    setPunchRemarks("");
    setSelfiePhoto("");
    setCheckOutSelfiePhoto("");
  };

  const handlePunchIn = () => {
    handleOpenCheckInWizard();
  };

  const handlePunchOut = () => {
    handleOpenCheckOutWizard();
  };

  const handleExpenseSubmit = (e, addAnother = false) => {
    if (e) e.preventDefault();
    if (!amount || !category || category === "Select a category") {
      if (setToast) setToast({ message: "⚠️ Mandatory: Please select an expense category and enter claim amount.", type: "error" });
      return;
    }

    addExpense({
      employeeId: currentUser.id,
      amount: parseFloat(amount),
      category,
      title: expenseTitle || `${category} Expense`,
      description: description || expenseTitle || `${category} Expense`,
      date: expenseDate || getTodayLocalStr(),
      projectId: expenseProjectId || null,
      paymentMode: paymentMode || "UPI",
      paidThrough: paymentMode || "UPI",
      currency: "INR",
      receipt: receiptPreviews.length > 0 ? receiptPreviews.join("|||") : null,
      receipts: receiptPreviews
    });

    if (setToast) setToast({ message: "Expense claim submitted successfully.", type: "success" });
    setAmount("");
    setDescription("");
    setExpenseTitle("");
    setReceiptPreviews([]);
    setActiveReceiptIdx(0);
    if (!addAnother) {
      setShowExpenseModal(false);
    }
  };

  const handleAdvanceSubmit = (e) => {
    e.preventDefault();
    if (!advAmount || !advPurpose.trim()) return;

    requestAdvance(currentUser.id, parseFloat(advAmount), advPurpose);
    setToast({ message: "Petty cash advance request submitted successfully.", type: "success" });
    setAdvAmount("");
    setAdvPurpose("");
  };

  const getTodayLocalStr = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Attendance & Punch calculations - retrieve live user from users state or currentUser
  const todayStr = getTodayLocalStr();
  const synchronizedUser = (users || []).find(u => 
    (currentUser?.id && (u.id === currentUser.id || u.empCode === currentUser.id || u.emp_code === currentUser.id)) ||
    (currentUser?.empCode && (u.empCode === currentUser.empCode || u.emp_code === currentUser.empCode || u.id === currentUser.empCode)) ||
    (currentUser?.email && u.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser?.name && u.name?.toLowerCase() === currentUser.name.toLowerCase())
  ) || currentUser;

  const myAttendance = useMemo(() => {
    const fromSync = synchronizedUser?.attendance || [];
    const fromCur = currentUser?.attendance || [];
    const attMap = new Map();
    [...fromCur, ...fromSync].forEach(a => {
      if (a && a.date) {
        attMap.set(a.date, { ...(attMap.get(a.date) || {}), ...a });
      }
    });
    return Array.from(attMap.values());
  }, [synchronizedUser, currentUser]);

  const unclosedPunch = (myAttendance || []).slice().reverse().find(a => !a.checkOut);
  const todayPunch = unclosedPunch || (myAttendance || []).slice().reverse().find(a => a.date === todayStr || (a.date && new Date(a.date).toDateString() === new Date().toDateString()));

  // Calculations for Attendance Dashboard
  const presentDays = myAttendance.filter(a => a.status === "Present" || a.status === "Late").length;
  const targetWorkingDays = settings.requiredWorkingDays || 22;
  const attendancePercentage = Math.min(100, Math.round((presentDays / targetWorkingDays) * 100));
  
  // Weekly Offs (July 2026 has 8 weekend days: 4, 5, 11, 12, 18, 19, 25, 26)
  const totalWeeklyOffs = 8;

  // Absent days: Loop from July 1 up to today (July 19)
  let absentDays = 0;
  for (let d = 1; d < 19; d++) {
    const isWeekOff = [6, 0].includes(new Date(2026, 6, d).getDay()); // 6 = Saturday, 0 = Sunday
    if (isWeekOff) continue;
    const dateStr = `2026-07-${d < 10 ? "0" + d : d}`;
    const record = myAttendance.find(a => a.date === dateStr);
    if (!record || record.status === "Absent") {
      absentDays++;
    }
  }

  // Dynamic Month Calendar Generator
  const generateMonthCalendar = () => {
    const calendarDays = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-based index

    for (let i = 0; i < firstDayIndex; i++) {
      calendarDays.push({ day: null, status: "empty" });
    }

    const todayDayNum = now.getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isWeekOff = [0, 6].includes(new Date(year, month, d).getDay());
      const record = myAttendance.find(a => a.date === dateStr);
      let status = "unmarked";

      if (record) {
        if (record.status === "Present" || record.status === "Late") {
          status = "present";
        } else if (record.status === "Absent") {
          status = "absent";
        }
      } else if (isWeekOff) {
        status = "weekoff";
      } else if (d < todayDayNum) {
        status = "absent";
      }

      calendarDays.push({ day: d, dateStr, status });
    }
    return calendarDays;
  };

  const calendarDays = generateMonthCalendar();

  // Filter expenses and advances submitted by this user
  const myExpenses = expenses.filter(e => e.employeeId === currentUser.id);
  const myAdvanceRequests = advanceRequests.filter(r => r.employeeId === currentUser.id);

  // Calculations for Expense Dashboard
  const myPendingExpenses = myExpenses.filter(e => e.status === "Pending");
  const myApprovedExpenses = myExpenses.filter(e => e.status === "Approved");
  const myRejectedExpenses = myExpenses.filter(e => e.status === "Rejected");
  const approvedExpenseTotal = myApprovedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Get balance details
  const balanceDetails = getEmployeeBalanceDetails(currentUser.id) || {
    initialAdvance: 0,
    totalSpent: 0,
    availableBalance: 0,
    categoriesSum: { "Food": 0, "Accommodation": 0, "Travel": 0 }
  };

  return (
    <div className="consultant-view-container">



      {/* 1. HOME DASHBOARD VIEW */}
      {mainNavTab === "HOME" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Ultra-Sleek Hero Welcome Banner */}
          <div style={{ position: "relative", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e5c 100%)", borderRadius: "20px", padding: "30px 36px", color: "#ffffff", overflow: "hidden", boxShadow: "0 20px 40px rgba(15,23,42,0.25)" }}>
            <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", position: "relative", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <img 
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"} 
                  alt={currentUser.name}
                  style={{ width: "80px", height: "80px", borderRadius: "50%", border: "3px solid rgba(255,255,255,0.4)", objectFit: "cover", boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}
                />
                <div>
                  <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.02em" }}>
                    Welcome back, {currentUser.name}!
                  </h1>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.92rem", color: "#c7d2fe" }}>
                    {currentUser.title || "Senior Systems Operator"} • {currentUser.department || "Consulting & Operations"}
                  </p>
                </div>
              </div>

              {/* Quick Action Buttons in Hero Banner */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <button 
                  type="button"
                  onClick={() => { setShowExpenseModal(true); setMainNavTab("EXPENSES"); }}
                  style={{
                    background: "rgba(255,255,255,0.14)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.25)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "10px",
                    padding: "11px 18px",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    transition: "all 0.15s ease"
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Expense Claim
                </button>
                <button 
                  type="button"
                  onClick={() => setMainNavTab("PROFILE")}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: "10px",
                    padding: "11px 18px",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease"
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  View Full Profile →
                </button>
              </div>
            </div>
          </div>

          {/* Metric Overview Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {/* 1. Today's Shift Status */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: todayPunch ? "#f0fdf4" : "#fef2f2", border: todayPunch ? "1px solid #bbf7d0" : "1px solid #fecaca", color: todayPunch ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.74rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Today's Shift Status</div>
                <div style={{ fontSize: "1.15rem", fontWeight: "900", color: todayPunch ? "#16a34a" : "#dc2626", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: todayPunch ? "#16a34a" : "#dc2626", display: "inline-block" }}></span>
                  {todayPunch ? (todayPunch.checkOut ? "Shift Completed" : "Currently In") : "Not Checked In"}
                </div>
              </div>
            </div>

            {/* 2. Petty Cash Balance */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#faf5ff", border: "1px solid #e9d5ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.74rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Petty Cash Balance</div>
                <div style={{ fontSize: "1.35rem", fontWeight: "900", color: "#0f172a", marginTop: "2px" }}>₹{balanceDetails.availableBalance.toLocaleString("en-IN")}</div>
              </div>
            </div>

            {/* 3. Total Approved Claims */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <polyline points="9 15 11 17 15 13" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.74rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Approved Claims Total</div>
                <div style={{ fontSize: "1.35rem", fontWeight: "900", color: "#16a34a", marginTop: "2px" }}>
                  ₹{approvedExpenseTotal.toLocaleString("en-IN")}
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", marginLeft: "6px" }}>({myApprovedExpenses.length} Approved)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Home Dashboard Layout */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
            
            {/* LEFT COLUMN: Assigned Client Projects Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>My Assigned Client Projects</h3>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>Active store locations and client assignments</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setMainNavTab("PROJECTS");
                      navigate("/my-projects");
                    }} 
                    style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    View All Projects →
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {displayProjects.length === 0 ? (
                    <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "14px", padding: "32px", textAlign: "center", color: "#64748b" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: "#64748b" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>No Client Projects Assigned Yet</h4>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem", color: "#64748b" }}>An Admin must assign you to a project in the Admin Panel before project details will be visible here.</p>
                    </div>
                  ) : displayProjects.map(proj => (
                    <div key={proj.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>{proj.name}</h4>
                            <span style={{ background: "#dcfce7", color: "#166534", border: "1px solid #86efac", padding: "2px 8px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "800" }}>ACTIVE SITE</span>
                          </div>
                          <div style={{ fontSize: "0.84rem", color: "#64748b", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{proj.location || "Seoni, Madhya Pradesh"} • {proj.businessModel || "Retail Advisory"}</span>
                          </div>
                        </div>

                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f0fdf4", color: "#166534", border: "1px solid #86efac", borderRadius: "8px", padding: "5px 10px", fontWeight: "700", fontSize: "0.78rem" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                          Store Site Assigned
                        </div>
                      </div>

                      {/* Scope Deliverables Progress Bar */}
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#334155" }}>Daily Scope Deliverables:</span>
                        <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#16a34a", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          3 / 3 Tasks Verified
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Attendance Control & Quick Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Digital Clock & Shift Control Card */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "22px", boxShadow: "0 4px 14px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ textAlign: "center", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "1.7rem", fontWeight: "900", color: "#0f172a", letterSpacing: "0.02em" }}>
                    {formatClockTime(time)}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "700", marginTop: "2px" }}>
                    {formatClockDate(time)}
                  </div>
                </div>

                {/* Permanent Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {!todayPunch ? (
                    <button 
                      type="button" 
                      onClick={handleOpenCheckInWizard}
                      style={{ background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "10px", padding: "12px", fontWeight: "800", fontSize: "0.9rem", cursor: "pointer", width: "100%", boxShadow: "0 4px 14px rgba(22,163,74,0.3)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      Check In Shift (Site Visit)
                    </button>
                  ) : !todayPunch.checkOut ? (
                    <button 
                      type="button" 
                      onClick={handleOpenCheckOutWizard}
                      style={{ background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "10px", padding: "12px", fontWeight: "800", fontSize: "0.9rem", cursor: "pointer", width: "100%", boxShadow: "0 4px 14px rgba(220,38,38,0.3)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Check Out Shift
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: "800", textAlign: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Shift Completed Today ({todayPunch.checkIn} - {todayPunch.checkOut})
                      </div>
                      <button 
                        type="button" 
                        onClick={handleOpenCheckInWizard}
                        style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "10px", padding: "12px", fontWeight: "800", fontSize: "0.88rem", cursor: "pointer", width: "100%", boxShadow: "0 4px 14px rgba(37,99,235,0.3)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Check In New Shift (Site Visit)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Shortcuts Card */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: "800", color: "#0f172a" }}>Quick Workspace Actions</h4>
                </div>
                <button type="button" onClick={() => setShowApplyLeaveModal(true)} style={{ textAlign: "left", padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#334155", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Apply for Leave
                </button>
                <button type="button" onClick={() => { setShowExpenseModal(true); setMainNavTab("EXPENSES"); }} style={{ textAlign: "left", padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#334155", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Request Petty Cash Advance
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 2. PROFILE & OTHER TAB VIEWS */}
      
      {/* 3. DEDICATED EXPENSES & PETTY CASH DESK VIEW */}
      {mainNavTab === "EXPENSES" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Header Card */}
          <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)", color: "#ffffff", padding: "26px 32px", borderRadius: "16px", boxShadow: "0 12px 30px rgba(15,23,42,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "18px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.74rem", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase", color: "#93c5fd", marginBottom: "8px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>Finance & Reimbursement</span>
              </div>
              <h2 style={{ margin: 0, fontSize: "1.65rem", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.02em" }}>Expenses & Petty Cash Desk</h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.86rem", color: "#cbd5e1" }}>Submit travel, food & client site visit expense claims for management approval</p>
            </div>
            
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", padding: "12px 20px", borderRadius: "12px", backdropFilter: "blur(8px)", minWidth: "160px" }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Available Petty Cash</div>
                <div style={{ fontSize: "1.35rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>₹{balanceDetails.availableBalance.toLocaleString("en-IN")}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", padding: "12px 20px", borderRadius: "12px", backdropFilter: "blur(8px)", minWidth: "160px" }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Approved Claims</div>
                <div style={{ fontSize: "1.35rem", fontWeight: "900", color: "#4ade80", marginTop: "2px" }}>₹{approvedExpenseTotal.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>

          {/* Grid Layout: Add Expense Claim Form + Expense Claims History */}
          <div style={{ display: "grid", gridTemplateColumns: "390px 1fr", gap: "24px", alignItems: "start" }}>
            
            {/* Form Column: Submit New Expense Claim */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "26px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.01em" }}>Submit Expense Claim</h3>
                  <button 
                    type="button" 
                    onClick={() => setShowExpenseModal(true)}
                    style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", borderRadius: "6px", padding: "5px 10px", fontSize: "0.72rem", fontWeight: "800", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Full Wizard
                  </button>
                </div>
                <p style={{ margin: "3px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>Enter expense claim details & attach receipt photos</p>
              </div>

              <form onSubmit={handleExpenseSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Category Chips */}
                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "800", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    EXPENSE CATEGORY
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {[
                      { 
                        id: "Food", 
                        label: "Food", 
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8" />
                            <line x1="6" y1="2" x2="6" y2="8" />
                            <line x1="10" y1="2" x2="10" y2="8" />
                            <line x1="14" y1="2" x2="14" y2="8" />
                            <line x1="18" y1="2" x2="18" y2="8" />
                            <line x1="12" y1="16" x2="12" y2="22" />
                          </svg>
                        )
                      },
                      { 
                        id: "Travel", 
                        label: "Travel", 
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                          </svg>
                        )
                      },
                      { 
                        id: "Stay", 
                        label: "Stay", 
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
                            <line x1="9" y1="6" x2="9" y2="6.01" />
                            <line x1="15" y1="6" x2="15" y2="6.01" />
                            <line x1="9" y1="10" x2="9" y2="10.01" />
                            <line x1="15" y1="10" x2="15" y2="10.01" />
                            <path d="M10 22v-4h4v4" />
                          </svg>
                        )
                      }
                    ].map(cat => {
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                            padding: "10px 6px",
                            borderRadius: "10px",
                            border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                            background: isSelected ? "#eff6ff" : "#ffffff",
                            color: isSelected ? "#1e40af" : "#475569",
                            fontWeight: isSelected ? "800" : "600",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <span style={{ color: isSelected ? "#2563eb" : "#64748b" }}>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "800", color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>AMOUNT (₹)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontWeight: "700", fontSize: "0.95rem" }}>₹</span>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      style={{ width: "100%", padding: "10px 12px 10px 28px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", boxSizing: "border-box", outline: "none", transition: "border 0.2s" }}
                      onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                      onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "800", color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>EXPENSE DATE</label>
                    <input 
                      type="date" 
                      value={expenseDate} 
                      onChange={(e) => setExpenseDate(e.target.value)}
                      style={{ width: "100%", padding: "9px 10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", color: "#0f172a", boxSizing: "border-box", fontWeight: "600" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "800", color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>PROJECT SITE</label>
                    <select 
                      value={expenseProjectId} 
                      onChange={(e) => setExpenseProjectId(e.target.value)}
                      style={{ width: "100%", padding: "9px 10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", color: "#0f172a", boxSizing: "border-box", fontWeight: "600" }}
                    >
                      <option value="">General Store HQ</option>
                      {displayProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "800", color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>DESCRIPTION / PURPOSE</label>
                  <textarea 
                    placeholder="Provide details about hotel, vendor, or travel..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box", resize: "none", outline: "none" }}
                  />
                </div>

                {/* Receipt Attachment Zone */}
                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "800", color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    RECEIPT PHOTO ATTACHMENTS ({receiptPreviews.length})
                  </label>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1.5px dashed #93c5fd",
                    background: "#f8fafc",
                    color: "#2563eb",
                    fontSize: "0.82rem",
                    fontWeight: "800",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}>
                    <span>📎 Click to Upload Receipts (Multiple Photos)</span>
                    <input type="file" multiple accept="image/*,.pdf" onChange={handleReceiptFileUpload} style={{ display: "none" }} />
                  </label>

                  {receiptPreviews.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px", overflowX: "auto", padding: "4px 0" }}>
                      {receiptPreviews.map((src, idx) => (
                        <div key={idx} style={{ position: "relative", width: "40px", height: "40px", borderRadius: "6px", overflow: "hidden", border: "1px solid #cbd5e1", flexShrink: 0 }}>
                          <img src={src} alt={`Receipt ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveReceipt(idx)} 
                            style={{ position: "absolute", top: "1px", right: "1px", background: "#ef4444", color: "#ffffff", border: "none", borderRadius: "50%", width: "14px", height: "14px", fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "10px", padding: "12px 18px", fontWeight: "800", fontSize: "0.92rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}
                >
                  <span>Submit Expense Claim</span>
                  <span>✓</span>
                </button>
              </form>
            </div>

            {/* Table Column: Expense Claims History */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "26px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.01em" }}>My Expense Claims Ledger</h3>
                  <p style={{ margin: "3px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>Live record of all claims submitted with verification status</p>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: "12px", background: "#f1f5f9", color: "#475569", fontSize: "0.75rem", fontWeight: "700" }}>
                  {myExpenses.length} Total Claims
                </span>
              </div>

              {myExpenses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", background: "#f8fafc", borderRadius: "12px", color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <strong style={{ fontSize: "0.95rem", color: "#1e293b" }}>No expense claims submitted yet</strong>
                  <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>Use the form on the left to submit a claim for food, travel, or stay</span>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                        <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Date</th>
                        <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Category</th>
                        <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Description</th>
                        <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Receipts</th>
                        <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Amount</th>
                        <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myExpenses.slice().reverse().map((exp, idx) => {
                        const receiptCount = Array.isArray(exp.receipts) && exp.receipts.length > 0 
                          ? exp.receipts.length 
                          : (exp.receipt && typeof exp.receipt === "string" && exp.receipt.includes("|||"))
                            ? exp.receipt.split("|||").length
                            : (exp.receipt || exp.receiptUrl ? 1 : 0);

                        return (
                          <tr key={exp.id || idx} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#ffffff" : "#fafafa", transition: "background 0.15s" }}>
                            <td style={{ padding: "12px 14px", fontWeight: "700", color: "#334155", whiteSpace: "nowrap" }}>
                              {exp.expenseDate || exp.date || "Today"}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "6px", 
                                padding: "4px 9px", 
                                borderRadius: "6px", 
                                fontSize: "0.74rem", 
                                fontWeight: "700",
                                background: exp.category === "Food" ? "#fff7ed" : exp.category === "Travel" ? "#eff6ff" : "#fdf4ff",
                                color: exp.category === "Food" ? "#c2410c" : exp.category === "Travel" ? "#1d4ed8" : "#86198f",
                                border: exp.category === "Food" ? "1px solid #fed7aa" : exp.category === "Travel" ? "1px solid #bfdbfe" : "1px solid #f5d0fe"
                              }}>
                                {exp.category === "Food" ? (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8" />
                                    <line x1="6" y1="2" x2="6" y2="8" />
                                    <line x1="10" y1="2" x2="10" y2="8" />
                                    <line x1="14" y1="2" x2="14" y2="8" />
                                    <line x1="18" y1="2" x2="18" y2="8" />
                                    <line x1="12" y1="16" x2="12" y2="22" />
                                  </svg>
                                ) : exp.category === "Travel" ? (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                                  </svg>
                                ) : (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
                                    <line x1="9" y1="6" x2="9" y2="6.01" />
                                    <line x1="15" y1="6" x2="15" y2="6.01" />
                                    <line x1="9" y1="10" x2="9" y2="10.01" />
                                    <line x1="15" y1="10" x2="15" y2="10.01" />
                                    <path d="M10 22v-4h4v4" />
                                  </svg>
                                )}
                                <span>{exp.category}</span>
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", color: "#475569", maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={exp.description || exp.reason}>
                              {exp.description || exp.reason || "Operational claim"}
                            </td>
                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: "0.76rem", color: receiptCount > 0 ? "#2563eb" : "#94a3b8", fontWeight: "700", background: receiptCount > 0 ? "#eff6ff" : "#f1f5f9", padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                  <circle cx="12" cy="13" r="4" />
                                </svg>
                                {receiptCount} {receiptCount === 1 ? "file" : "files"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: "900", color: "#0f172a", fontSize: "0.95rem", whiteSpace: "nowrap" }}>
                              ₹{Number(exp.amount || 0).toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                              <span style={{ 
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: exp.status === "Approved" ? "#f0fdf4" : exp.status === "Rejected" ? "#fef2f2" : "#fffbeb", 
                                color: exp.status === "Approved" ? "#166534" : exp.status === "Rejected" ? "#991b1b" : "#92400e", 
                                border: exp.status === "Approved" ? "1px solid #bbf7d0" : exp.status === "Rejected" ? "1px solid #fecaca" : "1px solid #fde68a",
                                padding: "4px 10px", 
                                borderRadius: "12px", 
                                fontSize: "0.74rem", 
                                fontWeight: "800" 
                              }}>
                                {exp.status === "Approved" ? (
                                  <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Approved
                                  </>
                                ) : exp.status === "Rejected" ? (
                                  <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    Rejected
                                  </>
                                ) : (
                                  <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10" />
                                      <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    Pending
                                  </>
                                )}
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
        </div>
      )}

      {/* 4. DEDICATED ASSIGNED CLIENT PROJECTS VIEW (ENTIRE PROJECT HUB) */}
      {mainNavTab === "PROJECTS" && (
        <ProjectsView />
      )}

      {/* 5. DEDICATED SHIFT ATTENDANCE REGISTER VIEW */}
      {mainNavTab === "ATTENDANCE" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ background: "linear-gradient(135deg, #15803d 0%, #166534 100%)", color: "#ffffff", padding: "26px 32px", borderRadius: "18px", boxShadow: "0 12px 30px rgba(21,128,61,0.25)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "900", color: "#ffffff" }}>Shift Attendance & Clock Register</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.88rem", color: "#bbf7d0" }}>View check-in logs, total working hours & monthly stats</p>
              </div>
            </div>
            {(!todayPunch || todayPunch.checkOut) ? (
              <button 
                type="button"
                onClick={handleOpenCheckInWizard}
                style={{ background: "#ffffff", color: "#166534", border: "none", borderRadius: "10px", padding: "12px 22px", fontWeight: "800", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.2)", display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Check In Shift (Site Visit)
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleOpenCheckOutWizard}
                style={{ background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "10px", padding: "12px 22px", fontWeight: "800", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.2)", display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Check Out Shift
              </button>
            )}
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Historical Attendance Register</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                  <th style={{ padding: "10px 12px" }}>Date</th>
                  <th style={{ padding: "10px 12px" }}>Store / Client Project</th>
                  <th style={{ padding: "10px 12px" }}>Check In</th>
                  <th style={{ padding: "10px 12px" }}>Check Out</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {myAttendance.slice().reverse().map((a, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px", fontWeight: "700" }}>{a.date}</td>
                    <td style={{ padding: "12px" }}>{a.projectName || "ACME Flagship Store"}</td>
                    <td style={{ padding: "12px", color: "#16a34a", fontWeight: "700" }}>{a.checkIn || "10:30 AM"}</td>
                    <td style={{ padding: "12px", color: "#dc2626", fontWeight: "700" }}>{a.checkOut || "In Shift"}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "800" }}>
                        {a.status || "Present"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mainNavTab === "PROFILE" && (
        <div>

          {/* Keka HR Style Employee Profile Top Banner Card */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", marginBottom: "20px" }}>
        
        {/* Purple Wavy Texture Background Banner */}
        <div style={{ position: "relative", height: "160px", background: "linear-gradient(135deg, #4c478a 0%, #312e5c 50%, #1e1b4b 100%)", overflow: "hidden" }}>
          
          {/* Decorative Pattern Lines */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.12, backgroundImage: "radial-gradient(circle at 20% 50%, #ffffff 0%, transparent 60%), radial-gradient(circle at 80% 20%, #ffffff 0%, transparent 50%)" }} />

          {/* Profile Basic Info Row Over Banner */}
          <div style={{ position: "absolute", bottom: "16px", left: "20px", display: "flex", alignItems: "center", gap: "20px" }}>
            
            {/* Avatar Photo */}
            <img 
              src={currentUser.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"} 
              alt={currentUser.name}
              style={{ width: "100px", height: "100px", borderRadius: "50%", border: "4px solid #ffffff", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
            />

            <div style={{ color: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ fontSize: "1.7rem", fontWeight: "700", margin: 0, color: "#ffffff" }}>{currentUser.name}</h1>
                <span style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", padding: "2px 8px", borderRadius: "3px", fontSize: "0.7rem", fontWeight: "700" }}>
                  IN
                </span>
                <span style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff", padding: "2px 8px", borderRadius: "3px", fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase" }}>
                  WEEKLY OFF
                </span>
              </div>

              <div style={{ fontSize: "0.88rem", color: "#e2e8f0", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <span>{currentUser.title || "Systems Operator"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Strip */}
        <div style={{ padding: "12px 20px", background: "#ffffff", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "24px", fontSize: "0.82rem", color: "#475569", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <span>{currentUser.email || "consultant@acme.com"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{currentUser.phone || "+91-9876543210"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{currentUser.location || "Mumbai / HQ"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span>{currentUser.empCode || "EMP-101"}</span>
          </div>
        </div>

        {/* Joining / Department / Reporting Manager Strip */}
        <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "48px", fontSize: "0.82rem" }}>
          <div>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>JOINING DATE</span>
            <span style={{ fontWeight: "600", color: "#0f172a", marginTop: "2px", display: "block" }}>{currentUser.joiningDate || "24 Jan 2025"}</span>
          </div>

          <div>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>DEPARTMENT</span>
            <span style={{ fontWeight: "600", color: "#0f172a", marginTop: "2px", display: "block" }}>{currentUser.department?.toUpperCase() || "GENERAL"}</span>
          </div>

          <div>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>REPORTING MANAGER</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80" alt="Manager" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
              <span style={{ fontWeight: "600", color: "#2563eb" }}>{currentUser.reportingManager || "ACME Management"}</span>
            </div>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <button
              type="button"
              onClick={() => setShowSelfOnboardingModal(true)}
              style={{ background: "#5b50a1", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "0.78rem", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile Details
            </button>
          </div>
        </div>

        {/* Main Profile Navigation Tabs Row */}
        <div style={{ display: "flex", gap: "24px", padding: "0 20px", background: "#ffffff", borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
          {["ABOUT", "PROFILE", "JOB", "TIME", "DOCUMENTS", "ASSETS", "FINANCES", "EXPENSES", "PERFORMANCE"].map(tab => {
            const isActive = profileTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setProfileTab(tab)}
                style={{
                  padding: "12px 0",
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? "2px solid #4c478a" : "2px solid transparent",
                  color: isActive ? "#4c478a" : "#64748b",
                  fontWeight: isActive ? "700" : "500",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Sub-Tabs Row under TIME */}
        {profileTab === "TIME" && (
          <div style={{ display: "flex", gap: "16px", padding: "10px 20px", background: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
            {["Attendance", "Leave"].map(subTab => {
              const isActive = timeSubTab === subTab;
              return (
                <button
                  key={subTab}
                  type="button"
                  onClick={() => setTimeSubTab(subTab)}
                  style={{
                    padding: "5px 16px",
                    background: isActive ? "#f3e8ff" : "#ffffff",
                    color: isActive ? "#6b21a8" : "#475569",
                    border: isActive ? "1px solid #d8b4fe" : "1px solid #e2e8f0",
                    borderRadius: "4px",
                    fontWeight: isActive ? "600" : "500",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  {subTab}
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* PROFILE / ABOUT Tab: Self-Service Details */}
      {(profileTab === "PROFILE" || profileTab === "ABOUT") && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "24px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>My Personal & Statutory Profile</h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>Identity cards, banking, emergency contacts, and personal information</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSelfOnboardingModal(true)}
                style={{ background: "#5b50a1", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 18px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Profile Details
              </button>
            </div>

            {/* Grid 1: Identity & Statutory Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>PAN CARD NUMBER</span>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>{currentUser.panNumber || "Not Provided"}</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>AADHAAR CARD NUMBER</span>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>{currentUser.aadhaarNumber || "Not Provided"}</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>BLOOD GROUP</span>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#dc2626", marginTop: "6px" }}>{currentUser.bloodGroup || "O+"}</div>
              </div>
            </div>

            {/* Grid 2: Bank Account Details */}
            <h4 style={{ fontSize: "0.92rem", fontWeight: "700", color: "#1e293b", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>Bank & Remittance Details</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "24px", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>BANK NAME</span>
                <strong style={{ color: "#0f172a" }}>{currentUser.bankName || "HDFC Bank"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>ACCOUNT NUMBER</span>
                <strong style={{ color: "#0f172a" }}>{currentUser.bankAccount || "XXXX-XXXX-4829"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>IFSC CODE</span>
                <strong style={{ color: "#0f172a" }}>{currentUser.ifscCode || "HDFC0000123"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>BRANCH NAME</span>
                <strong style={{ color: "#0f172a" }}>{currentUser.branchName || "BKC Main Branch"}</strong>
              </div>
            </div>

            {/* Grid 3: Emergency & Addresses */}
            <h4 style={{ fontSize: "0.92rem", fontWeight: "700", color: "#1e293b", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>Emergency Contact & Addresses</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>EMERGENCY CONTACT</span>
                <strong style={{ color: "#0f172a" }}>{currentUser.emergencyName || "Parent/Spouse"} ({currentUser.emergencyRelation || "Parent"})</strong>
                <div style={{ color: "#2563eb", marginTop: "2px" }}>📞 {currentUser.emergencyPhone || "+91-9876543210"}</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>CURRENT RESIDENTIAL ADDRESS</span>
                <div style={{ color: "#0f172a", marginTop: "2px" }}>{currentUser.currentAddress || "Mehdipatnam, Hyderabad, Telangana"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Content Grid (Matching Keka HR Screenshot) */}
      {profileTab === "TIME" && timeSubTab === "Attendance" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr 1fr", gap: "16px", marginBottom: "24px" }}>
          
          {/* Card 1: Attendance Stats */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Attendance Stats</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <select 
                    value={statsRange} 
                    onChange={(e) => setStatsRange(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "4px", padding: "3px 8px", fontSize: "0.75rem", color: "#475569", outline: "none" }}
                  >
                    <option>Last Week</option>
                    <option>This Week</option>
                    <option>This Month</option>
                  </select>
                  <span title="Attendance policy info" style={{ color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem" }}>ⓘ</span>
                </div>
              </div>

              {/* Row 1: Me */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.85rem" }}>
                    👤
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Me</span>
                </div>

                <div style={{ display: "flex", gap: "24px", textAlign: "right" }}>
                  <div>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600", display: "block" }}>AVG HRS / DAY</span>
                    <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>9h 3m</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600", display: "block" }}>ON TIME ARRIVAL</span>
                    <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>83%</span>
                  </div>
                </div>
              </div>

              {/* Row 2: My Team */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.85rem" }}>
                    👥
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>My Team</span>
                </div>

                <div style={{ display: "flex", gap: "24px", textAlign: "right" }}>
                  <div>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600", display: "block" }}>AVG HRS / DAY</span>
                    <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>8h 49m</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600", display: "block" }}>ON TIME ARRIVAL</span>
                    <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>81%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Timings */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>Timings</h3>

              {/* Days Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "0 10px" }}>
                {["M", "T", "W", "T", "F", "S", "S"].map((d, idx) => {
                  const isToday = idx === 1; // Tuesday
                  return (
                    <div 
                      key={idx}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: isToday ? "#38bdf8" : "#f1f5f9",
                        color: isToday ? "#ffffff" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: isToday ? "700" : "500"
                      }}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: "0.8rem", color: "#475569", fontWeight: "600", marginBottom: "10px" }}>
                Today (10:30 AM - 9:00 PM)
              </div>

              {/* Visual Shift Timeline Bar */}
              <div style={{ background: "#e0f2fe", height: "10px", borderRadius: "5px", overflow: "hidden", position: "relative", marginBottom: "12px" }}>
                <div style={{ background: "#38bdf8", width: "70%", height: "100%" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "#64748b" }}>
                <span>Duration: 10h 30m</span>
                <span>☕ 40 min</span>
              </div>
            </div>
          </div>

          {/* Card 3: Actions */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>Actions</h3>

              {/* Digital Clock Box */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "14px", background: "#f8fafc", textAlign: "center", marginBottom: "16px" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f172a", letterSpacing: "0.02em" }}>
                  {formatClockTime(time)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                  {formatClockDate(time)}
                </div>
              </div>

              {/* Punch Controls / Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {!todayPunch ? (
                  <button 
                    type="button" 
                    onClick={handleOpenCheckInWizard}
                    style={{ background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 14px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer", width: "100%", boxShadow: "0 4px 12px rgba(22,163,74,0.25)" }}
                  >
                    ✔ Check In Shift (Site Visit)
                  </button>
                ) : !todayPunch.checkOut ? (
                  <button 
                    type="button" 
                    onClick={handleOpenCheckOutWizard}
                    style={{ background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 14px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer", width: "100%", boxShadow: "0 4px 12px rgba(220,38,38,0.25)" }}
                  >
                    ✖ Check Out Shift
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: "700", textAlign: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "6px", borderRadius: "6px" }}>
                      ✓ Shift Completed Today ({todayPunch.checkIn} - {todayPunch.checkOut})
                    </div>
                    <button 
                      type="button" 
                      onClick={handleOpenCheckInWizard}
                      style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 14px", fontWeight: "700", fontSize: "0.82rem", cursor: "pointer", width: "100%" }}
                    >
                      + Check In New Shift (Site Visit)
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h3>My Attendance Register</h3>
            <p className="subtitle">Historical record of check-in times and remarks</p>
            <table className="luxury-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client Project</th>
                  <th>Checked In</th>
                  <th>Checked Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {myAttendance.slice().reverse().map((a, i) => (
                  <tr key={i}>
                    <td><strong>{a.date}</strong></td>
                    <td>
                      <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "4px" }}>
                        {a.projectName || a.projectId || "DCB Bank Sourcing Account"}
                      </span>
                    </td>
                    <td>{a.checkIn || "—"}</td>
                    <td>{a.checkOut || (a.checkIn ? <span className="warning-text">Active Shift</span> : "—")}</td>
                    <td>{a.hoursWorked ? `${a.hoursWorked} hrs` : "—"}</td>
                    <td>
                      <span className={`status-badge ${a.status.toLowerCase()}`}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{a.remarks || "—"}</td>
                  </tr>
                ))}
                {myAttendance.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">No attendance logs on record. Check in above to start.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {activeTab === "expenses" && (
        <div className="client-grid" style={{ gridTemplateColumns: "1.2fr 2fr", gap: "24px" }}>
          
          {/* Left Column: Upload forms */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Submit Expense Form */}
            <div className="glass-card" style={{ padding: "20px" }}>
              <h3>File Expense Claim</h3>
              <p className="subtitle">Submit operational costs for verification</p>
              <form onSubmit={handleExpenseSubmit} className="luxury-form" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label>Client Project</label>
                  <select
                    value={expenseProjectId}
                    onChange={(e) => setExpenseProjectId(e.target.value)}
                    className="luxury-select"
                  >
                    <option value="">General / Default Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name} ({p.client})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Expense Date</label>
                  <input 
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Amount (₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Expense Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="luxury-select">
                      <option value="Food">Food</option>
                      <option value="Accommodation">Accommodation</option>
                      <option value="Travel">Travel</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description & Reason</label>
                  <textarea 
                    placeholder="State invoice details, travel destination, or hotel name..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    style={{ height: "60px" }}
                  />
                </div>
                <div className="form-group">
                  <label>Receipt Upload</label>
                  <input type="file" className="luxury-select" required />
                  <span className="info-text" style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Mandatory receipt attachment required</span>
                </div>
                <button type="submit" className="luxury-button" style={{ width: "100%", background: "var(--bg-sidebar)", color: "#fff" }}>
                  Submit Expense
                </button>
              </form>
            </div>

            {/* Request Petty Cash Advance Form */}
            <div className="glass-card" style={{ padding: "20px" }}>
              <h3>Request Cash Advance</h3>
              <p className="subtitle">Request operational funds from Accounts manager</p>
              <form onSubmit={handleAdvanceSubmit} className="luxury-form" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label>Advance Amount (₹)</label>
                  <input 
                    type="number" 
                    step="1" 
                    placeholder="e.g. 5000" 
                    value={advAmount}
                    onChange={(e) => setAdvAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Purpose of Advance</label>
                  <textarea 
                    placeholder="State travel audits, hotel stay reservations, or operational needs..."
                    value={advPurpose}
                    onChange={(e) => setAdvPurpose(e.target.value)}
                    required
                    style={{ height: "60px" }}
                  />
                </div>
                <button type="submit" className="luxury-button" style={{ width: "100%", background: "var(--bg-sidebar)", color: "#fff", border: "1px solid var(--bg-sidebar)" }}>
                  Submit Advance Request
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Ledgers & Reports */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* KPI Cards on Top */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Claims Pending</span>
                <strong style={{ fontSize: "1.3rem", color: "var(--color-warning)" }}>{myPendingExpenses.length}</strong>
              </div>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Claims Approved</span>
                <strong style={{ fontSize: "1.3rem", color: "var(--color-success)" }}>{myApprovedExpenses.length}</strong>
              </div>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Monthly Sourced Total</span>
                <strong style={{ fontSize: "1.3rem", color: "var(--text-primary)" }}>₹{approvedExpenseTotal.toLocaleString()}</strong>
              </div>
            </div>

            {/* Claims History */}
            <div className="glass-card">
              <h3>My Sourcing Claims Ledger</h3>
              <p className="subtitle">Real-time status of your reimbursement requests</p>
              <div className="expense-claims-list" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px", maxHeight: "250px", overflowY: "auto" }}>
                {myExpenses.map((e) => (
                  <div key={e.id} className="expense-claim-item-card" style={{
                    padding: "12px",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px"
                  }}>
                    <div className="claim-item-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span className="claim-date" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Date filed: {e.submittedDate || e.date}</span>
                      <span className={`status-badge ${e.status.toLowerCase()}`}>{e.status}</span>
                    </div>
                    <div className="claim-item-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="claim-amount-box">
                        <span className="claim-val" style={{ fontSize: "1rem", fontWeight: "700" }}>₹{e.amount.toFixed(2)}</span>
                        <span className="claim-cat" style={{ fontSize: "0.7rem", color: "var(--gold-light)", display: "block" }}>{e.category}</span>
                      </div>
                      <p className="claim-desc" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", flex: "1", marginLeft: "16px" }}>{e.description}</p>
                    </div>
                    
                    {e.status === "Rejected" && (
                      <div className="claim-reviewer-alert rejection" style={{ padding: "8px", borderRadius: "4px", marginTop: "8px", fontSize: "0.75rem", backgroundColor: "var(--color-error-bg)", color: "var(--color-error)" }}>
                        <strong>⚠ REJECTION REMARKS:</strong> "{e.reviewerNotes || "No comments left."}" • <em>{e.reviewedBy}</em>
                      </div>
                    )}
                    {e.status === "Approved" && (
                      <div className="claim-reviewer-alert approval" style={{ padding: "8px", borderRadius: "4px", marginTop: "8px", fontSize: "0.75rem", backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" }}>
                        <strong>✓ APPROVED:</strong> {e.reviewerNotes || "Verified successfully."} • <em>Approved Date: {e.approvedDate || e.date}</em>
                      </div>
                    )}
                  </div>
                ))}
                {myExpenses.length === 0 && (
                  <p className="empty-message text-center" style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "20px 0" }}>No expense claims filed yet.</p>
                )}
              </div>
            </div>

            {/* Advance Requests History */}
            <div className="glass-card">
              <h3>My Cash Advance Requests</h3>
              <p className="subtitle">Monitor petty cash advances and payouts</p>
              <div className="advance-requests-list" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px", maxHeight: "250px", overflowY: "auto" }}>
                {myAdvanceRequests.map((r) => (
                  <div key={r.id} className="expense-claim-item-card" style={{
                    padding: "12px",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px"
                  }}>
                    <div className="claim-item-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span className="claim-date" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.date}</span>
                      <span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span>
                    </div>
                    <div className="claim-item-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="claim-amount-box">
                        <span className="claim-val" style={{ fontSize: "1rem", fontWeight: "700" }}>₹{r.amount.toFixed(2)}</span>
                        <span className="claim-cat" style={{ fontSize: "0.7rem", color: "var(--gold-light)", display: "block" }}>Cash Advance</span>
                      </div>
                      <p className="claim-desc" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", flex: "1", marginLeft: "16px" }}>{r.purpose}</p>
                    </div>
                    {r.reviewedBy && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "4px" }}>
                        Processed by: <strong>{r.reviewedBy}</strong>
                      </div>
                    )}
                  </div>
                ))}
                {myAdvanceRequests.length === 0 && (
                  <p className="empty-message text-center" style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "20px 0" }}>No cash advance requests filed yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === "ledger" && (
        <div className="expenses-section glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ textTransform: "uppercase", color: "var(--bg-sidebar)" }}>{currentUser.name} - Monthly Sourcing Ledger</h3>
              <p className="subtitle" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                Note: Please submit daily all bills on portal. Opening Balance: <strong>₹{getEmployeeLedger(currentUser.id).ledgerRows[0]?.opening.toLocaleString() || "0"}</strong>
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {/* Segmented Grid vs Calendar View Selector */}
              <div className="segmented-control">
                <button 
                  onClick={() => setLedgerViewMode("grid")}
                  className={`segmented-button ${ledgerViewMode === "grid" ? "active" : ""}`}
                >
                  📋 Grid View
                </button>
                <button 
                  onClick={() => setLedgerViewMode("calendar")}
                  className={`segmented-button ${ledgerViewMode === "calendar" ? "active" : ""}`}
                >
                  📅 Calendar View
                </button>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Period: <strong>July 2026</strong></span>
            </div>
          </div>

          {ledgerViewMode === "grid" ? (
            /* Grid Table View */
            <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr", gap: "24px", alignItems: "start" }}>
              
              {/* Ledger Table */}
              <div style={{ overflowX: "auto" }}>
                <table className="luxury-table" style={{ fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-tertiary)" }}>
                      <th style={{ padding: "8px" }}>SR. NO</th>
                      <th style={{ padding: "8px" }}>DATE</th>
                      <th style={{ padding: "8px" }}>DAY</th>
                      <th style={{ padding: "8px" }}>PARTICULARS</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>OPPINING</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>FOOD</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>STAY</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>TRAVEL</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>TOTAL</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>RECEIVED</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>BALANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const ledger = getEmployeeLedger(currentUser.id);
                      return (
                        <>
                          {ledger.ledgerRows.map((row) => (
                            <tr key={row.srNo} style={{ height: "32px" }}>
                              <td style={{ padding: "4px 8px", textAlign: "center" }}>{row.srNo}</td>
                              <td style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>{row.date}</td>
                              <td style={{ padding: "4px 8px", color: "var(--text-secondary)" }}>{row.day}</td>
                              <td style={{ padding: "4px 8px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.particulars}>
                                {row.particulars || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", color: row.opening < 0 ? "var(--color-error)" : "inherit" }}>
                                ₹{row.opening.toFixed(2)}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: row.food > 0 ? "600" : "400" }}>
                                {row.food > 0 ? `₹${row.food.toFixed(2)}` : "—"}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: row.stay > 0 ? "600" : "400" }}>
                                {row.stay > 0 ? `₹${row.stay.toFixed(2)}` : "—"}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: row.travel > 0 ? "600" : "400" }}>
                                {row.travel > 0 ? `₹${row.travel.toFixed(2)}` : "—"}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "600" }}>
                                {row.spent > 0 ? `₹${row.spent.toFixed(2)}` : "—"}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", color: "var(--color-success)", fontWeight: row.received > 0 ? "700" : "400" }}>
                                {row.received > 0 ? `₹${row.received.toFixed(2)}` : "—"}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "700", color: row.balance < 0 ? "var(--color-error)" : "var(--color-success)" }}>
                                ₹{row.balance.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          <tr style={{ background: "var(--bg-tertiary)", fontWeight: "700", borderTop: "2.5px double var(--border-color)" }}>
                            <td colSpan="5" style={{ padding: "10px", textAlign: "center" }}>TOTAL</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{ledger.totals.food.toFixed(2)}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{ledger.totals.stay.toFixed(2)}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{ledger.totals.travel.toFixed(2)}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{ledger.totals.spent.toFixed(2)}</td>
                            <td style={{ padding: "10px", textAlign: "right", color: "var(--color-success)" }}>₹{ledger.totals.received.toFixed(2)}</td>
                            <td style={{ padding: "10px", textAlign: "right", color: ledger.ledgerRows[ledger.ledgerRows.length - 1]?.balance < 0 ? "var(--color-error)" : "var(--color-success)" }}>
                              ₹{ledger.ledgerRows[ledger.ledgerRows.length - 1]?.balance.toFixed(2) || "0.00"}
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Refilling Details Box */}
              <div className="glass-card" style={{ padding: "16px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ textTransform: "uppercase", fontSize: "0.8rem", color: "var(--bg-sidebar)", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", marginBottom: "12px" }}>
                  Refilling Details
                </h4>
                <table className="luxury-table" style={{ fontSize: "0.75rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-tertiary)" }}>
                      <th>SR. NO</th>
                      <th>DATE</th>
                      <th style={{ textAlign: "right" }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const ledger = getEmployeeLedger(currentUser.id);
                      return (
                        <>
                          {ledger.refillingDetails.map((refill) => (
                            <tr key={refill.srNo}>
                              <td style={{ textAlign: "center" }}>{refill.srNo}</td>
                              <td>{refill.date}</td>
                              <td style={{ textAlign: "right", fontWeight: "600", color: "var(--color-success)" }}>₹{refill.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                          {ledger.refillingDetails.length === 0 && (
                            <tr>
                              <td colSpan="3" style={{ textAlign: "center", color: "var(--text-muted)" }}>No refill credits found.</td>
                            </tr>
                          )}
                          <tr style={{ background: "var(--bg-tertiary)", fontWeight: "700" }}>
                            <td colSpan="2">TOTAL</td>
                            <td style={{ textAlign: "right", color: "var(--color-success)" }}>₹{ledger.totals.received.toLocaleString()}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            /* Calendar Sheet Mode */
            <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr", gap: "24px", alignItems: "start" }}>
              
              <div className="report-calendar-grid">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(w => (
                  <div key={w} className="report-calendar-header">{w}</div>
                ))}
                {(() => {
                  const cells = [];
                  cells.push({ day: null, status: "empty" });
                  cells.push({ day: null, status: "empty" });

                  const ledger = getEmployeeLedger(currentUser.id);
                  ledger.ledgerRows.forEach((row) => {
                    cells.push({
                      day: row.srNo,
                      dateStr: row.date,
                      dayOfWeek: row.day,
                      row
                    });
                  });

                  return cells.map((c, idx) => {
                    if (c.day === null) {
                      return <div key={`empty-${idx}`} className="report-calendar-cell empty"></div>;
                    }

                    const isWeekend = ["Saturday", "Sunday"].includes(c.dayOfWeek);
                    const { row } = c;

                    return (
                      <div 
                        key={c.day} 
                        className={`report-calendar-cell tooltip-trigger ${isWeekend ? "weekoff" : ""}`}
                      >
                        <span className="calendar-day-num">{c.day}</span>
                        
                        <div className="calendar-cell-badges">
                          {row.spent > 0 && (
                            <span className="calendar-badge spent">
                              Spent: ₹{row.spent.toFixed(0)}
                            </span>
                          )}
                          {row.received > 0 && (
                            <span className="calendar-badge received">
                              Refill: +₹{row.received.toFixed(0)}
                            </span>
                          )}
                        </div>

                        {/* Tooltip on hover */}
                        <div className="tooltip-content" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.2)", paddingBottom: "4px", marginBottom: "4px", fontWeight: "700", color: "var(--gold-light)" }}>
                            📅 {row.date} ({c.dayOfWeek})
                          </div>
                          
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Opening Bal:</span>
                            <strong>₹{row.opening.toFixed(2)}</strong>
                          </div>
                          
                          {row.received > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-success)" }}>
                              <span>Payment (Refill):</span>
                              <strong>+₹{row.received.toFixed(2)}</strong>
                            </div>
                          )}
                          
                          {row.spent > 0 && (
                            <>
                              {row.food > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "0.68rem", color: "#CBD5E1" }}>
                                  <span>• Food spent:</span>
                                  <span>₹{row.food.toFixed(2)}</span>
                                </div>
                              )}
                              {row.stay > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "0.68rem", color: "#CBD5E1" }}>
                                  <span>• Stay spent:</span>
                                  <span>₹{row.stay.toFixed(2)}</span>
                                </div>
                              )}
                              {row.travel > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "0.68rem", color: "#CBD5E1" }}>
                                  <span>• Travel spent:</span>
                                  <span>₹{row.travel.toFixed(2)}</span>
                                </div>
                              )}
                              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-error)" }}>
                                <span>Total Spent:</span>
                                <strong>-₹{row.spent.toFixed(2)}</strong>
                              </div>
                            </>
                          )}
                          
                          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255, 255, 255, 0.2)", paddingTop: "4px", marginTop: "4px", fontWeight: "700" }}>
                            <span>Closing Bal:</span>
                            <strong style={{ color: row.balance < 0 ? "var(--color-error)" : "var(--color-success)" }}>
                              ₹{row.balance.toFixed(2)}
                            </strong>
                          </div>
                          
                          {row.particulars && (
                            <div style={{ fontSize: "0.65rem", color: "#E2E8F0", marginTop: "4px", fontStyle: "italic", whiteSpace: "normal" }}>
                              Particulars: {row.particulars}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Refilling Details Box */}
              <div className="glass-card" style={{ padding: "16px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ textTransform: "uppercase", fontSize: "0.8rem", color: "var(--bg-sidebar)", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", marginBottom: "12px" }}>
                  Refilling Details
                </h4>
                <table className="luxury-table" style={{ fontSize: "0.75rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-tertiary)" }}>
                      <th>SR. NO</th>
                      <th>DATE</th>
                      <th style={{ textAlign: "right" }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const ledger = getEmployeeLedger(currentUser.id);
                      return (
                        <>
                          {ledger.refillingDetails.map((refill) => (
                            <tr key={refill.srNo}>
                              <td style={{ textAlign: "center" }}>{refill.srNo}</td>
                              <td>{refill.date}</td>
                              <td style={{ textAlign: "right", fontWeight: "600", color: "var(--color-success)" }}>₹{refill.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                          {ledger.refillingDetails.length === 0 && (
                            <tr>
                              <td colSpan="3" style={{ textAlign: "center", color: "var(--text-muted)" }}>No refill credits found.</td>
                            </tr>
                          )}
                          <tr style={{ background: "var(--bg-tertiary)", fontWeight: "700" }}>
                            <td colSpan="2">TOTAL</td>
                            <td style={{ textAlign: "right", color: "var(--color-success)" }}>₹{ledger.totals.received.toLocaleString()}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      )}



      {activeTab === "leaves" && (() => {
        const leaveBal = getLeaveBalance(currentUser.id);
        const myLeaves = leaveRequests.filter(r => r.employeeId === currentUser.id);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header & Apply Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "20px 24px", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>My Leave Management</h2>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0 0" }}>Track leave balances, apply for leaves, and monitor approval status</p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyLeaveModal(true)}
                style={{ background: "#5b50a1", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 20px", fontWeight: "600", fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span>+</span> Apply for Leave
              </button>
            </div>

            {/* Leave Balance Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              <div style={{ background: "#ffffff", borderRadius: "8px", padding: "20px", border: "1px solid #e2e8f0", borderLeft: "4px solid #3b82f6" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em" }}>CASUAL LEAVE (CL)</span>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "8px 0" }}>{leaveBal.casual.available} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "#64748b" }}>/ {leaveBal.casual.total} Days</span></div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Used: {leaveBal.casual.used} Days</div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: "8px", padding: "20px", border: "1px solid #e2e8f0", borderLeft: "4px solid #10b981" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>SICK LEAVE (SL)</span>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "8px 0" }}>{leaveBal.sick.available} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "#64748b" }}>/ {leaveBal.sick.total} Days</span></div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Used: {leaveBal.sick.used} Days</div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: "8px", padding: "20px", border: "1px solid #e2e8f0", borderLeft: "4px solid #8b5cf6" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.05em" }}>EARNED LEAVE (EL)</span>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "8px 0" }}>{leaveBal.earned.available} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "#64748b" }}>/ {leaveBal.earned.total} Days</span></div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Used: {leaveBal.earned.used} Days</div>
              </div>
            </div>

            {/* Leave History Table */}
            <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>Leave Application History</h3>
              {myLeaves.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "#64748b", background: "#f8fafc", borderRadius: "6px" }}>
                  <p style={{ margin: 0 }}>No leave applications filed yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Applied Date</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Leave Type</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Dates</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Reason</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Status</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myLeaves.map(req => {
                        const statusColors = {
                          Pending: { bg: "#fef3c7", fg: "#d97706" },
                          Approved: { bg: "#dcfce7", fg: "#15803d" },
                          Rejected: { bg: "#fee2e2", fg: "#dc2626" },
                          Cancelled: { bg: "#f1f5f9", fg: "#64748b" }
                        };
                        const sc = statusColors[req.status] || statusColors.Pending;
                        return (
                          <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 14px" }}>{req.appliedOn}</td>
                            <td style={{ padding: "12px 14px", fontWeight: "600" }}>{req.type} {req.halfDay ? "(Half Day)" : ""}</td>
                            <td style={{ padding: "12px 14px" }}>{req.fromDate} to {req.toDate}</td>
                            <td style={{ padding: "12px 14px", color: "#475569" }}>{req.reason}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ background: sc.bg, color: sc.fg, padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" }}>
                                {req.status}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              {req.status === "Pending" && (
                                <button
                                  type="button"
                                  onClick={() => { cancelLeave(req.id); setToast({ message: "Leave application cancelled.", type: "info" }); }}
                                  style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "4px", padding: "4px 8px", fontSize: "0.78rem", cursor: "pointer" }}
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Apply Leave Modal */}
            {showApplyLeaveModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ background: "#ffffff", borderRadius: "8px", width: "500px", maxWidth: "90vw", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Apply for Leave</h3>
                    <button type="button" onClick={() => setShowApplyLeaveModal(false)} style={{ background: "none", border: "none", fontSize: "1.4rem", color: "#64748b", cursor: "pointer" }}>&times;</button>
                  </div>
                  <form onSubmit={handleApplyLeaveSubmit}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Leave Type *</label>
                        <select value={leaveType} onChange={e => setLeaveType(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }}>
                          <option value="Casual Leave">Casual Leave (CL)</option>
                          <option value="Sick Leave">Sick Leave (SL)</option>
                          <option value="Earned Leave">Earned Leave (EL)</option>
                          <option value="Comp Off">Compensatory Off</option>
                        </select>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>From Date *</label>
                          <input type="date" required value={leaveFrom} onChange={e => setLeaveFrom(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>To Date *</label>
                          <input type="date" required value={leaveTo} onChange={e => setLeaveTo(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                        </div>
                      </div>

                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#334155", cursor: "pointer" }}>
                        <input type="checkbox" checked={leaveHalfDay} onChange={e => setLeaveHalfDay(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#5b50a1" }} />
                        Apply as Half Day
                      </label>

                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Reason *</label>
                        <textarea required rows={3} placeholder="Please provide reason for leave request" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", resize: "vertical" }} />
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "16px", marginTop: "8px" }}>
                        <button type="button" onClick={() => setShowApplyLeaveModal(false)} style={{ padding: "8px 16px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem", cursor: "pointer" }}>Cancel</button>
                        <button type="submit" style={{ padding: "8px 20px", background: "#5b50a1", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}>Submit Application</button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === "payslips" && (() => {
        const payslipData = generatePayslip(currentUser.id, selectedPayslipMonth);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Top Bar: Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "20px 24px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>My Salary Slips</h2>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0 0" }}>View & download monthly salary breakdowns and tax deductions</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <select
                  value={selectedPayslipMonth}
                  onChange={e => setSelectedPayslipMonth(e.target.value)}
                  style={{ padding: "10px 16px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.88rem", background: "#ffffff", fontWeight: "600", color: "#0f172a" }}
                >
                  <option value="July 2026">July 2026</option>
                  <option value="June 2026">June 2026</option>
                  <option value="May 2026">May 2026</option>
                  <option value="April 2026">April 2026</option>
                  <option value="March 2026">March 2026</option>
                  <option value="February 2026">February 2026</option>
                </select>

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", fontSize: "0.88rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect width="12" height="8" x="6" y="14" />
                  </svg>
                  Print / Download PDF
                </button>
              </div>
            </div>

            {/* Payslip Document Card */}
            <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "40px", maxWidth: "880px", margin: "0 auto", width: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              {/* Header */}
              <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "20px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", margin: 0, textTransform: "uppercase", letterSpacing: "0.02em" }}>ACME WORKCENTRE PRIVATE LIMITED</h1>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>Plot 42, Advisory Towers, BKC, Mumbai - 400051</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 12px", borderRadius: "4px", fontSize: "0.82rem", fontWeight: "700", display: "inline-block" }}>PAYSLIP</span>
                  <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>{payslipData.month}</div>
                </div>
              </div>

              {/* Employee & Bank Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#f8fafc", padding: "16px 20px", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "24px", fontSize: "0.84rem" }}>
                <div>
                  <div style={{ marginBottom: "6px" }}><span style={{ color: "#64748b" }}>Employee Name:</span> <strong style={{ color: "#0f172a" }}>{payslipData.employeeName}</strong></div>
                  <div style={{ marginBottom: "6px" }}><span style={{ color: "#64748b" }}>Employee Code:</span> <strong style={{ color: "#0f172a" }}>{payslipData.empCode}</strong></div>
                  <div style={{ marginBottom: "6px" }}><span style={{ color: "#64748b" }}>Designation:</span> <strong style={{ color: "#0f172a" }}>{payslipData.designation}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Department:</span> <strong style={{ color: "#0f172a" }}>{payslipData.department}</strong></div>
                </div>
                <div>
                  <div style={{ marginBottom: "6px" }}><span style={{ color: "#64748b" }}>Bank Account:</span> <strong style={{ color: "#0f172a" }}>{payslipData.bankAccount}</strong></div>
                  <div style={{ marginBottom: "6px" }}><span style={{ color: "#64748b" }}>PF Number:</span> <strong style={{ color: "#0f172a" }}>{payslipData.pfNumber}</strong></div>
                  <div style={{ marginBottom: "6px" }}><span style={{ color: "#64748b" }}>PAN Number:</span> <strong style={{ color: "#0f172a" }}>{payslipData.panNumber}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Paid Days:</span> <strong style={{ color: "#0f172a" }}>{payslipData.paidDays} / {payslipData.workingDays}</strong></div>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                {/* Earnings Table */}
                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "#166534", background: "#dcfce7", padding: "8px 12px", borderRadius: "4px 4px 0 0", margin: 0 }}>EARNINGS</h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem", border: "1px solid #cbd5e1", borderTop: "none" }}>
                    <tbody>
                      {payslipData.earnings.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px", color: "#334155" }}>{item.title}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "600", color: "#0f172a" }}>₹{item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr style={{ background: "#f8fafc", fontWeight: "700" }}>
                        <td style={{ padding: "10px 12px", color: "#0f172a" }}>Gross Earnings</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "#166534" }}>₹{payslipData.grossEarnings.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Deductions Table */}
                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "#991b1b", background: "#fee2e2", padding: "8px 12px", borderRadius: "4px 4px 0 0", margin: 0 }}>DEDUCTIONS</h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem", border: "1px solid #cbd5e1", borderTop: "none" }}>
                    <tbody>
                      {payslipData.deductions.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px", color: "#334155" }}>{item.title}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "600", color: "#0f172a" }}>₹{item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr style={{ background: "#f8fafc", fontWeight: "700" }}>
                        <td style={{ padding: "10px 12px", color: "#0f172a" }}>Total Deductions</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "#991b1b" }}>₹{payslipData.totalDeductions.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Net Pay Card */}
              <div style={{ background: "#f0fdf4", border: "2px solid #bbf7d0", borderRadius: "6px", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#166534", textTransform: "uppercase" }}>NET TAKE HOME SALARY</span>
                  <div style={{ fontSize: "0.82rem", color: "#15803d", marginTop: "2px" }}>Directly deposited to bank account</div>
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#166534" }}>
                  ₹{payslipData.netSalary.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Profile & Petty Cash Allowance Modal */}
      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.4rem" }}>👤 Consultant Profile & Sourcing Balance</h2>
              <button onClick={() => setShowProfileModal(false)} style={{ fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
              <img src={currentUser.avatar} alt={currentUser.name} style={{ width: "80px", height: "80px", borderRadius: "50%", border: "2px solid var(--bg-sidebar)", objectFit: "cover" }} />
              <div>
                <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>{currentUser.name}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{currentUser.title}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>📱 {currentUser.phone || "No phone registered"}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>✉ {currentUser.email}</p>
              </div>
            </div>

            <h4 style={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--bg-sidebar)", fontSize: "0.85rem", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
              Petty Cash Advance Ledger
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              <div style={{ background: "var(--bg-tertiary)", padding: "12px", borderRadius: "6px", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Total Advance</span>
                <strong style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}>₹{balanceDetails.initialAdvance.toLocaleString()}</strong>
              </div>
              <div style={{ background: "var(--bg-tertiary)", padding: "12px", borderRadius: "6px", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Total Spent</span>
                <strong style={{ fontSize: "1.1rem", color: "var(--color-error)" }}>₹{balanceDetails.totalSpent.toLocaleString()}</strong>
              </div>
              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "12px", borderRadius: "6px", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--color-success)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>Available Balance</span>
                <strong style={{ fontSize: "1.1rem", color: "var(--color-success)" }}>₹{balanceDetails.availableBalance.toLocaleString()}</strong>
              </div>
            </div>

            <h4 style={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--bg-sidebar)", fontSize: "0.85rem", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
              Category Spend Breakdown (Approved)
            </h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {Object.entries(balanceDetails.categoriesSum).map(([cat, val]) => (
                <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-primary)", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-secondary)" }}>{cat}</span>
                  <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>₹{val.toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowProfileModal(false)}
              className="luxury-button"
              style={{ width: "100%", marginTop: "24px", backgroundColor: "var(--bg-sidebar)", color: "#fff" }}
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

      {/* Employee Profile Self-Service Onboarding Modal */}
      {showSelfOnboardingModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", borderRadius: "8px", width: "640px", maxWidth: "95vw", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Employee Profile Self-Service</h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "2px 0 0 0" }}>Fill out your statutory, identity, and personal contact details</p>
              </div>
              <button type="button" onClick={() => setShowSelfOnboardingModal(false)} style={{ background: "none", border: "none", fontSize: "1.4rem", color: "#64748b", cursor: "pointer" }}>&times;</button>
            </div>

            {/* Stepper Header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", background: "#f8fafc", padding: "12px 20px", borderRadius: "6px" }}>
              {[
                { step: 1, label: "1. Personal & Contact" },
                { step: 2, label: "2. PAN & Aadhaar" },
                { step: 3, label: "3. Bank Account" }
              ].map(s => (
                <span
                  key={s.step}
                  onClick={() => setProfileStep(s.step)}
                  style={{ fontSize: "0.82rem", fontWeight: profileStep === s.step ? "700" : "500", color: profileStep === s.step ? "#5b50a1" : "#64748b", cursor: "pointer" }}
                >
                  {s.label}
                </span>
              ))}
            </div>

            <form onSubmit={handleProfileSubmit}>
              {profileStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Personal Email</label>
                      <input type="email" placeholder="personal@email.com" value={personalEmail} onChange={e => setPersonalEmail(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Alternate Phone</label>
                      <input type="tel" placeholder="+91-9876543210" value={altPhone} onChange={e => setAltPhone(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Date of Birth</label>
                      <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Blood Group</label>
                      <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }}>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Gender</label>
                      <select value={gender} onChange={e => setGender(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "#1e293b", margin: "8px 0 0 0" }}>Emergency Contact & Address</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Contact Person Name *</label>
                      <input type="text" required placeholder="Parent / Spouse Name" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Relationship *</label>
                      <input type="text" required placeholder="Father / Spouse" value={emergencyRelation} onChange={e => setEmergencyRelation(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Emergency Phone *</label>
                      <input type="tel" required placeholder="+91-9876543210" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Current Residential Address *</label>
                    <textarea required rows={2} placeholder="Full current address" value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", resize: "vertical" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Permanent Address</label>
                    <textarea rows={2} placeholder="Permanent address (or same as current)" value={permanentAddress} onChange={e => setPermanentAddress(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", resize: "vertical" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                    <button type="button" onClick={() => setProfileStep(2)} style={{ padding: "10px 20px", background: "#5b50a1", color: "#ffffff", border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer" }}>Next: Identity Cards →</button>
                  </div>
                </div>
              )}

              {profileStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>PAN Card Number *</label>
                    <input type="text" required maxLength={10} placeholder="ABCDE1234F" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", letterSpacing: "0.08em", fontWeight: "700" }} />
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>10-character Permanent Account Number</span>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Aadhaar Card Number *</label>
                    <input type="text" required maxLength={14} placeholder="1234 5678 9012" value={aadhaarNumber} onChange={e => setAadhaarNumber(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", letterSpacing: "0.08em", fontWeight: "700" }} />
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>12-digit UIDAI Aadhaar number</span>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Passport Number (Optional)</label>
                    <input type="text" placeholder="A1234567" value={passportNumber} onChange={e => setPassportNumber(e.target.value.toUpperCase())} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                    <button type="button" onClick={() => setProfileStep(1)} style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}>← Back</button>
                    <button type="button" onClick={() => setProfileStep(3)} style={{ padding: "10px 20px", background: "#5b50a1", color: "#ffffff", border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer" }}>Next: Bank Account →</button>
                  </div>
                </div>
              )}

              {profileStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Bank Name *</label>
                      <select value={bankName} onChange={e => setBankName(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }}>
                        {["HDFC Bank", "ICICI Bank", "State Bank of India (SBI)", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank", "Other Bank"].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Branch Name</label>
                      <input type="text" placeholder="Branch location" value={branchName} onChange={e => setBranchName(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Bank Account Number *</label>
                    <input type="text" required placeholder="Enter bank account number" value={bankAccount} onChange={e => setBankAccount(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", fontWeight: "700" }} />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Re-enter Account Number *</label>
                    <input type="text" required placeholder="Re-enter bank account number" value={confirmBankAccount} onChange={e => setConfirmBankAccount(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", fontWeight: "700" }} />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>IFSC Code *</label>
                    <input type="text" required placeholder="HDFC0000123" value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", letterSpacing: "0.05em", fontWeight: "700" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                    <button type="button" onClick={() => setProfileStep(2)} style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}>← Back</button>
                    <button type="submit" style={{ padding: "10px 20px", background: "#22c55e", color: "#ffffff", border: "none", borderRadius: "4px", fontWeight: "700", cursor: "pointer" }}>Complete & Save Profile ✓</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Profile & Petty Cash Allowance Modal */}
    
      
      </div>
      )}

      
      {/* KEKA HR 2-COLUMN SPLIT ADD/UPDATE EXPENSES MODAL OVERLAY */}
      {showExpenseModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "12px", width: "95vw", maxWidth: "1000px", height: "90vh", maxHeight: "680px", overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column" }}>
            
            {/* Header */}
            <div style={{ padding: "14px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff" }}>
              <span style={{ fontSize: "1.05rem", fontWeight: "800", color: "#1e293b" }}>Add/Update Expenses</span>
              <span onClick={() => setShowExpenseModal(false)} style={{ cursor: "pointer", fontSize: "1.3rem", color: "#64748b", fontWeight: "700" }}>✕</span>
            </div>

            {/* Split 2-Column Layout Container */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "42% 58%", overflow: "hidden" }}>
              
              {/* Left Column: Dark Slate Multi-Receipt Preview Gallery */}
              <div style={{ background: "#3e4659", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", position: "relative", color: "#ffffff" }}>
                {receiptPreviews.length > 0 ? (
                  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center" }}>
                    
                    {/* Top Banner: Image Counter & Add More */}
                    <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: "800", background: "rgba(0,0,0,0.4)", padding: "4px 10px", borderRadius: "12px" }}>
                        🖼️ Photo {activeReceiptIdx + 1} of {receiptPreviews.length}
                      </span>
                      <label style={{ background: "#5b5fc7", color: "#ffffff", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        + Add More
                        <input type="file" multiple accept="image/*,.pdf" onChange={handleReceiptFileUpload} style={{ display: "none" }} />
                      </label>
                    </div>

                    {/* Main Image Container */}
                    <div style={{ position: "relative", width: "100%", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", margin: "6px 0" }}>
                      <img 
                        src={receiptPreviews[activeReceiptIdx] || receiptPreviews[0]} 
                        alt={`Receipt ${activeReceiptIdx + 1}`} 
                        style={{ maxWidth: "100%", maxHeight: "250px", objectFit: "contain", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }} 
                      />
                      
                      {/* Prev / Next controls */}
                      {receiptPreviews.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveReceiptIdx(prev => (prev > 0 ? prev - 1 : receiptPreviews.length - 1))}
                            style={{ position: "absolute", left: "4px", top: "50%", transform: "translateY(-50%)", background: "rgba(15,23,42,0.8)", color: "#ffffff", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", fontWeight: "800", fontSize: "1.1rem" }}
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveReceiptIdx(prev => (prev < receiptPreviews.length - 1 ? prev + 1 : 0))}
                            style={{ position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)", background: "rgba(15,23,42,0.8)", color: "#ffffff", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", fontWeight: "800", fontSize: "1.1rem" }}
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnails Row */}
                    <div style={{ width: "100%", display: "flex", gap: "8px", overflowX: "auto", padding: "6px 2px", alignItems: "center" }}>
                      {receiptPreviews.map((src, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setActiveReceiptIdx(idx)}
                          style={{ position: "relative", flexShrink: 0, cursor: "pointer", borderRadius: "6px", overflow: "hidden", border: activeReceiptIdx === idx ? "2px solid #60a5fa" : "1px solid rgba(255,255,255,0.3)", opacity: activeReceiptIdx === idx ? 1 : 0.65 }}
                        >
                          <img src={src} alt={`Thumb ${idx}`} style={{ width: "44px", height: "44px", objectFit: "cover" }} />
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveReceipt(idx);
                            }}
                            style={{ position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "#ffffff", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: "800" }}
                            title="Delete photo"
                          >
                            ✕
                          </span>
                        </div>
                      ))}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleRemoveReceipt(activeReceiptIdx)} 
                      style={{ marginTop: "8px", background: "#ef4444", color: "#ffffff", border: "none", borderRadius: "6px", padding: "5px 14px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}
                    >
                      Remove Selected Photo ✕
                    </button>

                  </div>
                ) : (
                  <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <label style={{ background: "#5b5fc7", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", fontWeight: "800", fontSize: "0.92rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(0,0,0,0.25)" }}>
                      📷 Upload Receipts (Multiple) <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>ⓘ</span>
                      <input type="file" multiple accept="image/*,.pdf" onChange={handleReceiptFileUpload} style={{ display: "none" }} />
                    </label>
                    <div style={{ fontSize: "0.82rem", color: "#cbd5e1", marginTop: "4px" }}>
                      Select multiple images or PDFs to attach
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Form Inputs */}
              <div style={{ padding: "24px 32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Expense Category (Food, Travel, Stay ONLY) */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>Expense Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "#ffffff", color: "#1e293b", fontWeight: "600" }}
                  >
                    <option value="">Select a category</option>
                    <option value="Food">Food</option>
                    <option value="Travel">Travel</option>
                    <option value="Stay">Stay</option>
                  </select>
                </div>

                {/* Project / Cost Center */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>Project / Cost Center</label>
                  <select 
                    value={expenseProjectId} 
                    onChange={(e) => setExpenseProjectId(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "#ffffff", color: "#1e293b", fontWeight: "600" }}
                  >
                    <option value="">Select a project</option>
                    {displayProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Expense Title & Expense Date Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>Expense Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Client Dinner, Hotel Booking" 
                      value={expenseTitle} 
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>Expense Date</label>
                    <input 
                      type="date" 
                      value={expenseDate} 
                      onChange={(e) => setExpenseDate(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                {/* Paid Through / Payment Mode & Amount Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>
                      Paid Through / Payment Mode *
                    </label>
                    <select 
                      value={paymentMode} 
                      onChange={(e) => setPaymentMode(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "#ffffff", fontWeight: "700" }}
                    >
                      <option value="UPI">UPI (GPay / PhonePe / Paytm / NetBanking)</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>Amount (₹) *</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      required
                      min="1"
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", fontWeight: "700", color: "#16a34a" }}
                    />
                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>Amount in Indian Rupees (INR)</div>
                  </div>
                </div>

                {/* Comment / Remarks */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>Comment</label>
                  <textarea 
                    rows="3" 
                    placeholder="Add description or comments..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
                  />
                </div>

                {/* Upload Receipt Link */}
                <div style={{ marginTop: "4px" }}>
                  <label style={{ color: "#5b5fc7", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    📎 Attach Multiple Receipts ({receiptPreviews.length} attached) ⓘ
                    <input type="file" multiple accept="image/*,.pdf" onChange={handleReceiptFileUpload} style={{ display: "none" }} />
                  </label>
                </div>

              </div>

            </div>

            {/* Bottom Footer Action Controls */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", background: "#ffffff", display: "flex", justifyContent: "flex-end", gap: "12px", alignItems: "center" }}>
              <button 
                type="button" 
                onClick={(e) => handleExpenseSubmit(e, false)} 
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #5b5fc7", background: "#ffffff", color: "#5b5fc7", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
              >
                Save Expense
              </button>
              <button 
                type="button" 
                onClick={(e) => handleExpenseSubmit(e, true)} 
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #5b5fc7", background: "#ffffff", color: "#5b5fc7", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
              >
                Save and Add Another
              </button>
              <button 
                type="button" 
                onClick={(e) => handleExpenseSubmit(e, false)} 
                style={{ padding: "8px 22px", borderRadius: "6px", border: "none", background: "#5b5fc7", color: "#ffffff", fontWeight: "800", fontSize: "0.88rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(91,95,199,0.3)" }}
              >
                Submit Claim
              </button>
            </div>

          </div>
        </div>
      )}


            {/* GUIDED CONSULTANT CHECK-IN WIZARD MODAL (LOCATION & SELFIE IN SAME STEP) */}
      {showCheckInWizard && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", width: "100%", maxWidth: "620px", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column" }}>
            
            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e5c 100%)", color: "#ffffff", padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(34,197,94,0.25)", color: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.2rem" }}>✓</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#ffffff" }}>Consultant Shift Check-In Form</h3>
                </div>
              </div>
              <button type="button" onClick={() => setShowCheckInWizard(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", borderRadius: "50%", width: "32px", height: "32px", fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Stepper Bar (2 Steps) */}
            <div style={{ background: "#f8fafc", padding: "12px 28px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {[
                { step: 1, title: "1. Purpose & Scope" },
                { step: 2, title: "2. Exact Location & Selfie Capture" }
              ].map((s) => {
                const isActive = wizardStep === s.step;
                const isPassed = wizardStep > s.step;
                return (
                  <div key={s.step} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "50%",
                      background: isActive ? "#2563eb" : isPassed ? "#16a34a" : "#cbd5e1",
                      color: "#ffffff", fontSize: "0.78rem", fontWeight: "800",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {isPassed ? "✓" : s.step}
                    </div>
                    <span style={{ fontSize: "0.82rem", fontWeight: isActive ? "800" : "600", color: isActive ? "#0f172a" : "#64748b" }}>
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step Body */}
            <div style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "22px", minHeight: "340px" }}>
              
              {/* STEP 1: PURPOSE & SCOPE OF WORK */}
              {wizardStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  
                  {/* Select Store / Project Site */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "800", color: "#1e293b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      📍 1. Select Store / Client Project Site Location <span style={{ color: "#dc2626" }}>(Required)*</span>
                    </label>
                    {displayProjects.length > 0 ? (
                      <select 
                        value={selectedWizardProjectId} 
                        onChange={(e) => setSelectedWizardProjectId(e.target.value)}
                        style={{ 
                          width: "100%", 
                          padding: "12px 14px", 
                          borderRadius: "10px", 
                          border: !selectedWizardProjectId ? "2px solid #ef4444" : "1px solid #cbd5e1", 
                          fontSize: "0.92rem", 
                          background: !selectedWizardProjectId ? "#fff5f5" : "#ffffff", 
                          color: "#0f172a", 
                          fontWeight: "700",
                          outline: "none"
                        }}
                      >
                        <option value="">-- Select Assigned Client Project Site --</option>
                        {displayProjects.map(p => (
                          <option key={p.id} value={p.id}>{p.name} — ({p.location || "Client Site"})</option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ padding: "12px 16px", background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "10px", color: "#c2410c", fontSize: "0.85rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>⚠️</span>
                        <span>No Client Projects Assigned Yet. (Projects will be visible here once assigned by Admin)</span>
                      </div>
                    )}
                  </div>

                  {/* Purpose of Shift / Site Visit */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "800", color: "#1e293b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      🎯 2. Purpose of Shift / Site Visit
                    </label>
                    <input
                      type="text"
                      value={visitPurpose}
                      onChange={(e) => setVisitPurpose(e.target.value)}
                      placeholder="e.g. Retail Store Advisory, Inventory Audit, Client Strategy Review"
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", fontWeight: "600" }}
                    />
                  </div>

                  {/* Scope of Work Checklist */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "800", color: "#1e293b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      📋 3. Scope of Work & Deliverables Checklist
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                      {scopeTasks.map(t => (
                        <label key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "#1e293b", cursor: "pointer", fontWeight: "500" }}>
                          <input 
                            type="checkbox" 
                            checked={t.done} 
                            onChange={() => handleToggleScopeTask(t.id)} 
                            style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                          />
                          <span style={{ textDecoration: t.done ? "none" : "line-through", color: t.done ? "#0f172a" : "#94a3b8" }}>{t.text}</span>
                        </label>
                      ))}

                      {/* Add new scope item */}
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <input 
                          type="text" 
                          placeholder="+ Add custom scope objective..." 
                          value={newScopeInput} 
                          onChange={(e) => setNewScopeInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddScopeTask(); } }}
                          style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.82rem" }}
                        />
                        <button type="button" onClick={handleAddScopeTask} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 14px", fontWeight: "700", fontSize: "0.8rem", cursor: "pointer" }}>Add</button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 2: COMBINED EXACT LOCATION DETECTION & SELFIE PHOTO CAPTURE */}
              {wizardStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  {/* Location Card with Live Google Maps Pin */}
                  <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.3rem" }}>📍</span>
                        <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0369a1" }}>Exact Live Location Capture</h4>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={handleDetectGpsLocation}
                          style={{ background: "#ffffff", border: "1px solid #93c5fd", color: "#0284c7", borderRadius: "8px", padding: "4px 10px", fontSize: "0.74rem", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <span>🔄 Refresh GPS</span>
                        </button>
                        <span style={{ background: gpsData.isDetecting ? "#fef3c7" : "#e0f2fe", color: gpsData.isDetecting ? "#b45309" : "#0369a1", border: "1px solid #bae6fd", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "800" }}>
                          {gpsData.isDetecting ? "⏳ Auto-Detecting..." : gpsData.lat ? "● GPS Verified" : "⚠️ Location Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Search / Refine Exact Location Search Input */}
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        value={locationSearchQuery}
                        onChange={(e) => handleSearchLocation(e.target.value)}
                        placeholder="🔍 Search exact colony, building, or area (e.g. Venkatadri Colony, Serene Heights, Masab Tank)..."
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #93c5fd", fontSize: "0.8rem", outline: "none", background: "#ffffff", boxSizing: "border-box" }}
                      />
                      {isSearchingLocation && (
                        <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#0284c7" }}>⏳ Searching...</span>
                      )}

                      {/* Search Results Dropdown */}
                      {locationSearchResults.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: "#ffffff", border: "1.5px solid #3b82f6", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.18)", marginTop: "4px", maxHeight: "180px", overflowY: "auto" }}>
                          {locationSearchResults.map((res, i) => (
                            <div
                              key={i}
                              onClick={() => handleSelectLocationSearchResult(res)}
                              style={{ padding: "9px 12px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "0.78rem", color: "#1e293b", transition: "background 0.15s" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#eff6ff"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
                            >
                              📍 <strong style={{ color: "#2563eb" }}>{res.display_name.split(",")[0]}</strong> — {res.display_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Live Google Map Frame when coordinates detected */}
                    {gpsData.lat && gpsData.lng ? (
                      <div style={{ width: "100%", height: "130px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1", position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                        <iframe
                          title="Live GPS Google Map Preview"
                          src={`https://maps.google.com/maps?q=${gpsData.lat},${gpsData.lng}&z=16&output=embed`}
                          style={{ width: "100%", height: "100%", border: 0 }}
                          loading="lazy"
                        />
                      </div>
                    ) : null}

                    <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#64748b" }}>
                        <span>GPS COORDINATES</span>
                        <strong style={{ color: "#0f172a", fontSize: "0.88rem" }}>
                          {gpsData.isDetecting ? "⏳ Fetching Device GPS..." : gpsData.lat ? `${gpsData.lat}° N, ${gpsData.lng}° E` : "Turn on Device Location"}
                        </strong>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", display: "block", marginBottom: "4px" }}>EXACT RECORDED AREA / LOCATION ADDRESS</label>
                        <input
                          type="text"
                          value={gpsData.address}
                          onChange={(e) => setGpsData(prev => ({ ...prev, address: e.target.value }))}
                          placeholder={gpsData.isDetecting ? "Fetching exact area..." : "e.g. Store Site / Client Location, City, State"}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #2563eb", fontSize: "0.88rem", fontWeight: "700", color: "#1e40af", background: "#eff6ff", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Real WebCam & Selfie Photo Capture Box (Overlays & Extensions Disabled) */}
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                    <div style={{ textAlign: "center" }}>
                      <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>📸 Live Webcam & Selfie Capture</h4>
                      <p style={{ margin: "3px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>Capture a real-time selfie photo for shift attendance log</p>
                    </div>

                    {/* Camera Permission Warning Banner */}
                    {cameraPermissionDenied && (
                      <div style={{ width: "100%", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 16px", color: "#991b1b", fontSize: "0.82rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ fontWeight: "800" }}>📷 Camera Permission Turned Off</div>
                        <div>Your browser camera permissions are turned off. Please allow camera access in your browser's address bar to turn on your webcam, or click below to retry.</div>
                        <button type="button" onClick={startCamera} style={{ background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: "800", fontSize: "0.8rem", cursor: "pointer", alignSelf: "center" }}>
                          🎥 Turn On Camera Permissions
                        </button>
                      </div>
                    )}

                    {/* Hidden Canvas element for snapping frame */}
                    <canvas ref={canvasRef} style={{ display: "none" }} />

                    {/* Camera Feed / Snapped Preview (No Picture-in-Picture or Translate Overlays) */}
                    <div style={{ position: "relative", width: "180px", height: "180px", borderRadius: "50%", overflow: "hidden", border: selfiePhoto ? "4px solid #16a34a" : "4px solid #2563eb", boxShadow: "0 8px 25px rgba(37,99,235,0.25)", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selfiePhoto ? (
                        <img 
                          src={selfiePhoto} 
                          alt="Captured Consultant Selfie" 
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          disablePictureInPicture
                          controlsList="nodownload nofullscreen noremoteplayback"
                          translate="no"
                          className="notranslate"
                          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", pointerEvents: "none" }}
                        />
                      )}
                    </div>

                    {/* Controls */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
                      {!selfiePhoto ? (
                        <>
                          {!cameraActive && (
                            <button 
                              type="button" 
                              onClick={startCamera} 
                              style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "9px 16px", fontSize: "0.82rem", fontWeight: "800", cursor: "pointer" }}
                            >
                              🎥 Turn On Camera
                            </button>
                          )}
                          <button 
                            type="button" 
                            onClick={captureSelfieSnapshot} 
                            style={{ background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "0.82rem", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}
                          >
                            📸 Snap Selfie Photo
                          </button>
                          <label style={{ background: "#334155", color: "#ffffff", border: "none", borderRadius: "8px", padding: "9px 16px", fontSize: "0.82rem", fontWeight: "800", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                            📱 Open Phone Camera / Upload Photo
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="user" 
                              onChange={handleSelfieFileUpload} 
                              style={{ display: "none" }} 
                            />
                          </label>
                        </>
                      ) : (
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <span style={{ padding: "6px 14px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: "0.82rem", fontWeight: "800" }}>
                            ✓ Selfie Ready & Verified
                          </span>
                          <button 
                            type="button" 
                            onClick={() => {
                              setSelfiePhoto("");
                              startCamera();
                            }} 
                            style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", fontWeight: "800", cursor: "pointer", color: "#334155", display: "inline-flex", alignItems: "center", gap: "6px" }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                            Retake Selfie Photo
                          </button>
                          <label style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", fontWeight: "800", cursor: "pointer", color: "#334155", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Upload Different Photo
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="user" 
                              onChange={handleSelfieFileUpload} 
                              style={{ display: "none" }} 
                            />
                          </label>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div style={{ padding: "18px 28px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {wizardStep > 1 ? (
                <button 
                  type="button" 
                  onClick={() => setWizardStep(prev => prev - 1)} 
                  style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  ← Previous Step
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setShowCheckInWizard(false)} 
                  style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
              )}

              {wizardStep === 1 ? (
                <button 
                  type="button" 
                  onClick={() => {
                    if (displayProjects.length === 0) {
                      if (setToast) setToast({ message: "⚠️ Cannot Proceed: No Client Project is assigned to your account by Admin.", type: "error" });
                      return;
                    }
                    if (!selectedWizardProjectId) {
                      if (setToast) setToast({ message: "⚠️ Mandatory Field Required: Please select an assigned Client Project Site location to proceed.", type: "error" });
                      return;
                    }
                    setWizardStep(2);
                    handleDetectGpsLocation();
                    startCamera();
                  }} 
                  style={{ 
                    padding: "10px 24px", 
                    background: (!selectedWizardProjectId || displayProjects.length === 0) ? "#94a3b8" : "#2563eb", 
                    color: "#ffffff", 
                    border: "none", 
                    borderRadius: "10px", 
                    fontWeight: "800", 
                    fontSize: "0.88rem", 
                    cursor: (!selectedWizardProjectId || displayProjects.length === 0) ? "not-allowed" : "pointer", 
                    boxShadow: (!selectedWizardProjectId || displayProjects.length === 0) ? "none" : "0 4px 14px rgba(37,99,235,0.3)" 
                  }}
                >
                  Next: Location & Selfie →
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleCompleteCheckInSubmit} 
                  style={{ 
                    padding: "10px 26px", 
                    background: selfiePhoto ? "#16a34a" : "#94a3b8", 
                    color: "#ffffff", 
                    border: "none", 
                    borderRadius: "10px", 
                    fontWeight: "800", 
                    fontSize: "0.9rem", 
                    cursor: selfiePhoto ? "pointer" : "not-allowed", 
                    boxShadow: selfiePhoto ? "0 4px 14px rgba(22,163,74,0.35)" : "none" 
                  }}
                >
                  {selfiePhoto ? "Complete Check In & Start Shift ✓" : "📸 Take/Upload Selfie to Complete Check In"}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

{/* GUIDED CONSULTANT CHECK-OUT WIZARD MODAL (2-STEP LOCATION & SELFIE CAPTURE) */}
      {showCheckOutWizard && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", width: "100%", maxWidth: "620px", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column" }}>
            
            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)", color: "#ffffff", padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(255,255,255,0.2)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.2rem" }}>✖</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#ffffff" }}>End Shift Check-Out Form</h3>
                </div>
              </div>
              <button type="button" onClick={() => { stopCamera(); setShowCheckOutWizard(false); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fca5a5", borderRadius: "50%", width: "32px", height: "32px", fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Stepper Bar (2 Steps) */}
            <div style={{ background: "#f8fafc", padding: "12px 28px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {[
                { step: 1, title: "1. Shift Summary & Remarks" },
                { step: 2, title: "2. Check-Out Location & Selfie" }
              ].map((s) => {
                const isActive = checkOutWizardStep === s.step;
                const isPassed = checkOutWizardStep > s.step;
                return (
                  <div key={s.step} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "50%",
                      background: isActive ? "#dc2626" : isPassed ? "#16a34a" : "#cbd5e1",
                      color: "#ffffff", fontSize: "0.78rem", fontWeight: "800",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {isPassed ? "✓" : s.step}
                    </div>
                    <span style={{ fontSize: "0.82rem", fontWeight: isActive ? "800" : "600", color: isActive ? "#0f172a" : "#64748b" }}>
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <div style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "340px" }}>
              
              {/* STEP 1: REMARKS */}
              {checkOutWizardStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "14px 18px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#991b1b" }}>Shift Check-In Summary</div>
                    <div style={{ fontSize: "0.8rem", color: "#7f1d1d", marginTop: "4px" }}>
                      Check In Time: <strong>{todayPunch?.checkIn || "10:30 AM"}</strong> • Check-In Date: <strong>{todayPunch?.date || todayStr}</strong>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "800", color: "#1e293b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      📝 End of Shift Remarks / Work Completed
                    </label>
                    <textarea
                      value={wizardCheckOutRemarks}
                      onChange={(e) => setWizardCheckOutRemarks(e.target.value)}
                      placeholder="Summary of advisory tasks and store objectives completed during shift..."
                      rows={4}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", fontWeight: "600" }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: LOCATION & SELFIE CAPTURE FOR CHECK OUT */}
              {checkOutWizardStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  {/* Location Card with Live Google Maps Pin */}
                  <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.3rem" }}>📍</span>
                        <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0369a1" }}>Check-Out Live Location</h4>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={handleDetectGpsLocation}
                          style={{ background: "#ffffff", border: "1px solid #93c5fd", color: "#0284c7", borderRadius: "8px", padding: "4px 10px", fontSize: "0.74rem", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <span>🔄 Refresh GPS</span>
                        </button>
                        <span style={{ background: gpsData.isDetecting ? "#fef3c7" : "#e0f2fe", color: gpsData.isDetecting ? "#b45309" : "#0369a1", border: "1px solid #bae6fd", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "800" }}>
                          {gpsData.isDetecting ? "⏳ Auto-Detecting..." : gpsData.lat ? "● GPS Verified" : "⚠️ Location Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Search / Refine Exact Location Search Input */}
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        value={locationSearchQuery}
                        onChange={(e) => handleSearchLocation(e.target.value)}
                        placeholder="🔍 Search exact colony, building, or area (e.g. Venkatadri Colony, Serene Heights, Masab Tank)..."
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #93c5fd", fontSize: "0.8rem", outline: "none", background: "#ffffff", boxSizing: "border-box" }}
                      />
                      {isSearchingLocation && (
                        <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#0284c7" }}>⏳ Searching...</span>
                      )}

                      {/* Search Results Dropdown */}
                      {locationSearchResults.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: "#ffffff", border: "1.5px solid #3b82f6", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.18)", marginTop: "4px", maxHeight: "180px", overflowY: "auto" }}>
                          {locationSearchResults.map((res, i) => (
                            <div
                              key={i}
                              onClick={() => handleSelectLocationSearchResult(res)}
                              style={{ padding: "9px 12px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "0.78rem", color: "#1e293b", transition: "background 0.15s" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#eff6ff"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
                            >
                              📍 <strong style={{ color: "#2563eb" }}>{res.display_name.split(",")[0]}</strong> — {res.display_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Live Google Map Frame when coordinates detected */}
                    {gpsData.lat && gpsData.lng ? (
                      <div style={{ width: "100%", height: "130px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1", position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                        <iframe
                          title="Live GPS Google Map Preview"
                          src={`https://maps.google.com/maps?q=${gpsData.lat},${gpsData.lng}&z=16&output=embed`}
                          style={{ width: "100%", height: "100%", border: 0 }}
                          loading="lazy"
                        />
                      </div>
                    ) : null}

                    <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#64748b" }}>
                        <span>GPS COORDINATES</span>
                        <strong style={{ color: "#0f172a", fontSize: "0.88rem" }}>
                          {gpsData.isDetecting ? "⏳ Fetching Device GPS..." : gpsData.lat ? `${gpsData.lat}° N, ${gpsData.lng}° E` : "Turn on Device Location"}
                        </strong>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", display: "block", marginBottom: "4px" }}>EXACT RECORDED AREA / LOCATION ADDRESS</label>
                        <input
                          type="text"
                          value={gpsData.address}
                          onChange={(e) => setGpsData(prev => ({ ...prev, address: e.target.value }))}
                          placeholder={gpsData.isDetecting ? "Fetching exact area..." : "e.g. Store Site / Client Location, City, State"}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #dc2626", fontSize: "0.88rem", fontWeight: "700", color: "#991b1b", background: "#fef2f2", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Real WebCam & Selfie Photo Capture Box */}
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                    <div style={{ textAlign: "center" }}>
                      <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>📸 Check-Out Live Selfie Capture</h4>
                      <p style={{ margin: "3px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>Capture a real-time selfie photo to verify shift completion</p>
                    </div>

                    {/* Camera Permission Warning Banner */}
                    {cameraPermissionDenied && (
                      <div style={{ width: "100%", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 16px", color: "#991b1b", fontSize: "0.82rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ fontWeight: "800" }}>📷 Camera Permission Turned Off</div>
                        <div>Your browser camera permissions are turned off. Please allow camera access in your browser's address bar to turn on your webcam, or click below to retry.</div>
                        <button type="button" onClick={startCamera} style={{ background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: "800", fontSize: "0.8rem", cursor: "pointer", alignSelf: "center" }}>
                          🎥 Turn On Camera Permissions
                        </button>
                      </div>
                    )}

                    <canvas ref={canvasRef} style={{ display: "none" }} />

                    {/* Camera Feed / Snapped Preview */}
                    <div style={{ position: "relative", width: "180px", height: "180px", borderRadius: "50%", overflow: "hidden", border: checkOutSelfiePhoto || selfiePhoto ? "4px solid #16a34a" : "4px solid #dc2626", boxShadow: "0 8px 25px rgba(220,38,38,0.25)", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {checkOutSelfiePhoto || selfiePhoto ? (
                        <img 
                          src={checkOutSelfiePhoto || selfiePhoto} 
                          alt="Captured Check-Out Selfie" 
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          disablePictureInPicture
                          controlsList="nodownload nofullscreen noremoteplayback"
                          translate="no"
                          className="notranslate"
                          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", pointerEvents: "none" }}
                        />
                      )}
                    </div>

                    {/* Controls */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
                      {!(checkOutSelfiePhoto || selfiePhoto) ? (
                        <>
                          {!cameraActive && (
                            <button 
                              type="button" 
                              onClick={startCamera} 
                              style={{ background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", padding: "9px 16px", fontSize: "0.82rem", fontWeight: "800", cursor: "pointer" }}
                            >
                              🎥 Turn On Camera
                            </button>
                          )}
                          <button 
                            type="button" 
                            onClick={() => {
                              captureSelfieSnapshot();
                              if (canvasRef.current && videoRef.current) {
                                const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.85);
                                setCheckOutSelfiePhoto(dataUrl);
                              }
                            }} 
                            style={{ background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "0.82rem", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}
                          >
                            📸 Snap Check-Out Selfie
                          </button>
                          <label style={{ background: "#334155", color: "#ffffff", border: "none", borderRadius: "8px", padding: "9px 16px", fontSize: "0.82rem", fontWeight: "800", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                            📱 Open Phone Camera / Upload Photo
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="user" 
                              onChange={handleSelfieFileUpload} 
                              style={{ display: "none" }} 
                            />
                          </label>
                        </>
                      ) : (
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <span style={{ padding: "6px 14px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: "0.82rem", fontWeight: "800" }}>
                            ✓ Check-Out Selfie Verified
                          </span>
                          <button 
                            type="button" 
                            onClick={() => {
                              setSelfiePhoto("");
                              setCheckOutSelfiePhoto("");
                              startCamera();
                            }} 
                            style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", fontWeight: "800", cursor: "pointer", color: "#334155", display: "inline-flex", alignItems: "center", gap: "6px" }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                            Retake Selfie Photo
                          </button>
                          <label style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", fontWeight: "800", cursor: "pointer", color: "#334155", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Upload Different Photo
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="user" 
                              onChange={handleSelfieFileUpload} 
                              style={{ display: "none" }} 
                            />
                          </label>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div style={{ padding: "18px 28px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {checkOutWizardStep > 1 ? (
                <button 
                  type="button" 
                  onClick={() => setCheckOutWizardStep(prev => prev - 1)} 
                  style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  ← Previous Step
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => { stopCamera(); setShowCheckOutWizard(false); }} 
                  style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
              )}

              {checkOutWizardStep === 1 ? (
                <button 
                  type="button" 
                  onClick={() => {
                    setCheckOutWizardStep(2);
                    handleDetectGpsLocation();
                    startCamera();
                  }} 
                  style={{ padding: "10px 24px", background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: "800", fontSize: "0.88rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(220,38,38,0.3)" }}
                >
                  Next: Location & Selfie →
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleCompleteCheckOutSubmit} 
                  style={{ 
                    padding: "10px 26px", 
                    background: (checkOutSelfiePhoto || selfiePhoto) ? "#dc2626" : "#94a3b8", 
                    color: "#ffffff", 
                    border: "none", 
                    borderRadius: "10px", 
                    fontWeight: "800", 
                    fontSize: "0.9rem", 
                    cursor: (checkOutSelfiePhoto || selfiePhoto) ? "pointer" : "not-allowed", 
                    boxShadow: (checkOutSelfiePhoto || selfiePhoto) ? "0 4px 14px rgba(220,38,38,0.35)" : "none" 
                  }}
                >
                  {(checkOutSelfiePhoto || selfiePhoto) ? "Complete Check Out & Close Shift ✖" : "📸 Take/Upload Selfie to Complete Check Out"}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

</div>
  );
}
