import React, { useState, useRef, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";

export default function SecurityEntry() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Refs
  const inputRef = useRef(null);
  const successBeep = useRef(null);
  const errorBeep = useRef(null);

  // ---------------------------
  // Focus Management (Kiosk Mode)
  // ---------------------------
  const keepFocus = useCallback(() => {
    // Immediate focus attempt
    if (inputRef.current) inputRef.current.focus();

    // Redundant focus attempt (for after UI interactions/animations)
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  }, []);

  // ---------------------------
  // Lifecycle & Global Listeners
  // ---------------------------
  useEffect(() => {
    // Initialize audio
    successBeep.current = new Audio("/beep-success.mp3");
    errorBeep.current = new Audio("/beep-error.mp3");

    // Initial focus
    keepFocus();

    // 1. Re-focus on any click anywhere in the window
    const handleGlobalClick = () => keepFocus();

    // 2. Capture any keystroke to ensure input receives scan data
    // (Even if focus was somehow lost, typing brings it back)
    const handleGlobalKeydown = (e) => {
      if (loading) return;
      if (document.activeElement !== inputRef.current) {
        keepFocus();
      }
    };

    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleGlobalKeydown);

    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleGlobalKeydown);
    };
  }, [keepFocus, loading]);

  // Ensure focus restores after loading state clears
  useEffect(() => {
    if (!loading) keepFocus();
  }, [loading, keepFocus]);

  // ---------------------------
  // Handle scan / manual entry
  // ---------------------------
  const handleEntry = async () => {
    if (!code.trim()) {
      errorBeep.current?.play().catch(() => {});
      
      Swal.fire({
        title: "Missing ID",
        text: "Please scan ID card",
        icon: "warning",
        timer: 1000,
        showConfirmButton: false,
        willClose: keepFocus,
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${BASE_URL}/attendance-logs/entry/manual`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            unique_code: code.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Entry failed");
      }

      successBeep.current?.play().catch(() => {});

      Swal.fire({
        title: data.entry_type === "IN" ? "ENTRY IN" : "ENTRY OUT",
        html: `
          <div style="text-align:left;font-size:18px;line-height:1.6;padding:10px 0;">
            <b>Name:</b> ${data.name}<br/>
            <b>Type:</b> ${data.person_type}<br/>
            <b>Status:</b> ${
              data.is_late 
              ? "<span style='color:#dc2626;font-weight:bold'>Late</span>" 
              : "<span style='color:#16a34a;font-weight:bold'>On Time</span>"
            }<br/>
            ${
              data.is_late
                ? `<b>Late Minutes:</b> ${data.late_minutes}<br/>`
                : ""
            }
          </div>
        `,
        icon: data.is_late ? "warning" : "success",
        timer: 2000,
        showConfirmButton: false,
        willClose: keepFocus,
      });

      setCode("");
    } catch (err) {
      console.error(err);
      errorBeep.current?.play().catch(() => {});

      Swal.fire({
        title: "Invalid Card",
        text: err.message || "Scan failed",
        icon: "error",
        timer: 1500,
        showConfirmButton: false,
        willClose: keepFocus,
      });

      setCode("");
    } finally {
      setLoading(false);
      keepFocus();
    }
  };

  // ---------------------------
  // Styles (Enterprise Kiosk)
  // ---------------------------
  const styles = {
    // Fullscreen Overlay
    container: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "#f3f4f6",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      zIndex: 9999, // Ensure it sits on top of everything
    },
    card: {
      backgroundColor: "#ffffff",
      borderRadius: "20px",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      width: "90%",
      maxWidth: "500px",
      padding: "48px",
      textAlign: "center",
      border: "1px solid #e5e7eb",
    },
    // Header Section
    headerIcon: {
      width: "64px",
      height: "64px",
      backgroundColor: "#eff6ff",
      color: "#3b82f6",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 24px auto",
    },
    title: {
      fontSize: "32px",
      fontWeight: "800",
      color: "#111827",
      margin: "0 0 16px 0",
      letterSpacing: "-0.025em",
    },
    subtitle: {
      fontSize: "18px",
      color: "#6b7280",
      marginBottom: "40px",
    },
    // Input Section
    inputWrapper: {
      position: "relative",
      marginBottom: "24px",
    },
    input: {
      width: "100%",
      padding: "20px",
      fontSize: "20px",
      fontWeight: "600",
      textAlign: "center",
      border: "2px solid #e5e7eb",
      borderRadius: "12px",
      outline: "none",
      backgroundColor: "#f9fafb",
      color: "#111827",
      transition: "all 0.2s ease",
      boxSizing: "border-box",
      letterSpacing: "0.05em",
    },
    inputActive: {
      borderColor: "#3b82f6",
      backgroundColor: "#ffffff",
      boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.15)",
    },
    // Button Section
    button: {
      width: "100%",
      padding: "18px",
      fontSize: "18px",
      fontWeight: "600",
      color: "#ffffff",
      backgroundColor: loading ? "#93c5fd" : "#2563eb",
      border: "none",
      borderRadius: "12px",
      cursor: loading ? "not-allowed" : "pointer",
      transition: "background-color 0.2s",
    },
    // Footer
    footer: {
      marginTop: "32px",
      fontSize: "14px",
      color: "#9ca3af",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    indicator: {
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      backgroundColor: loading ? "#eab308" : "#22c55e",
      display: "inline-block",
    }
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div style={styles.container} onClick={keepFocus}>
      <div style={styles.card}>
        
        {/* Icon */}
        <div style={styles.headerIcon}>
          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4h-4v-3h-4v3H4v-4H2m6-11v1m0-1a2 2 0 114 0v1m-4 0h4m-4 0v5m4-5v5m-9 0h14v8a1 1 0 01-1 1H4a1 1 0 01-1-1v-8z" />
          </svg>
        </div>

        <h1 style={styles.title}>Security Access</h1>
        <p style={styles.subtitle}>
          System Ready. Scan Card.
        </p>

        {/* Input */}
        <div style={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Scanning..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEntry()}
            onBlur={keepFocus}
            disabled={loading}
            autoComplete="off"
            autoFocus
            style={{
              ...styles.input,
              ...(loading ? {} : styles.inputActive)
            }}
          />
        </div>

        {/* Action Button */}
        <button 
          onClick={handleEntry} 
          disabled={loading} 
          style={styles.button}
        >
          {loading ? "Processing..." : "Manual Entry"}
        </button>

        {/* System Status Footer */}
        <div style={styles.footer}>
          <span style={styles.indicator}></span>
          <span>{loading ? "Verifying with server..." : "Active • Type anywhere to scan"}</span>
        </div>

      </div>
    </div>
  );
}