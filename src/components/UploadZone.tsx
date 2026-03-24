import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Lock, Mail, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/trackEvent";
import { toast } from "sonner";
import { isValidEmail, isValidName } from "@/utils/formatPhone";

interface UploadZoneProps {
  isVisible: boolean;
  onScanStart?: (fileName: string, scanSessionId: string) => void;
  sessionId?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const UploadZone = ({ isVisible, onScanStart, sessionId }: UploadZoneProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [gateWarning, setGateWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nameValid = isValidName(firstName);
  const emailValid = isValidEmail(email);
  const fieldsComplete = nameValid && emailValid;

  useEffect(() => {
    if (isVisible && containerRef.current) {
      setTimeout(() => { containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 450);
    }
  }, [isVisible]);

  // Clear gate warning when fields become valid
  useEffect(() => {
    if (fieldsComplete) setGateWarning(false);
  }, [fieldsComplete]);

  const handleFile = useCallback((f: File) => {
    setFileError(null);
    if (f.size > MAX_FILE_SIZE) { setFileError("File too large. Maximum size is 10MB."); return; }
    if (!ALLOWED_TYPES.includes(f.type)) { setFileError("Unsupported file type. Please upload a PDF or image (JPG, PNG, WEBP, HEIC)."); return; }
    setFile(f);
    setIsDragOver(false);
  }, []);

  const handleDropzoneInteraction = useCallback(() => {
    if (!fieldsComplete) {
      setGateWarning(true);
      return;
    }
    if (inputRef.current) { inputRef.current.value = ""; inputRef.current.click(); }
  }, [fieldsComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!fieldsComplete) { setGateWarning(true); return; }
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile, fieldsComplete]);

  const handleScan = async () => {
    if (!file || uploading || !fieldsComplete) return;
    setUploading(true);
    try {
      const filePath = `${sessionId || crypto.randomUUID()}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("quotes").upload(filePath, file);
      if (uploadError) { console.error("Storage upload failed:", uploadError); toast.error("Upload failed. Please try again."); setUploading(false); return; }

      // ── Resolve or create lead — scan_sessions MUST have a non-null lead_id ──
      let leadId: string | null = null;
      if (sessionId) {
        const { data: leads } = await supabase.rpc("get_lead_by_session", { p_session_id: sessionId });
        leadId = leads?.[0]?.id || null;

        // Update the existing lead with name+email if we found one
        if (leadId) {
          await supabase.from("leads").update({
            first_name: firstName.trim(),
            email: email.trim(),
          }).eq("id", leadId);
        }
      }
      if (!leadId) {
        const fallbackLeadId = crypto.randomUUID();
        const fallbackSessionId = sessionId || crypto.randomUUID();
        const { error: leadErr } = await supabase
          .from("leads")
          .insert({
            id: fallbackLeadId,
            session_id: fallbackSessionId,
            source: "direct_upload",
            first_name: firstName.trim(),
            email: email.trim(),
          });
        if (leadErr) {
          console.error("Failed to create fallback lead:", leadErr);
          toast.error("Failed to initialize session. Please try again.");
          setUploading(false);
          return;
        }
        leadId = fallbackLeadId;
        console.log("[UploadZone] Created fallback lead:", leadId);
      }

      const quoteFileId = crypto.randomUUID();
      const { error: qfError } = await supabase.from("quote_files").insert({ id: quoteFileId, lead_id: leadId, storage_path: filePath, status: "pending" });
      if (qfError) { console.error("quote_files insert failed:", qfError); toast.error("Failed to register your file. Please try again."); setUploading(false); return; }
      const scanSessionId = crypto.randomUUID();
      const { error: ssError } = await supabase.from("scan_sessions").insert({ id: scanSessionId, status: "uploading", lead_id: leadId, quote_file_id: quoteFileId });
      if (ssError) { console.error("scan_sessions insert failed:", ssError); toast.error("Failed to start scan session. Please try again."); setUploading(false); return; }
      trackEvent({ event_name: "upload_completed", session_id: sessionId, metadata: { scan_session_id: scanSessionId, file_name: file.name, file_size: file.size } });
      onScanStart?.(file.name, scanSessionId);
      const { error: fnError } = await supabase.functions.invoke("scan-quote", { body: { scan_session_id: scanSessionId } });
      if (fnError) {
        console.error("scan-quote invoke failed:", fnError);
        toast.error("Scan encountered an issue. We'll retry automatically.");
        await supabase.from("event_logs").insert({ event_name: "scan_invoke_failed", session_id: sessionId || null, metadata: { scan_session_id: scanSessionId, quote_file_id: quoteFileId, error_message: fnError.message || String(fnError), file_name: file.name, file_size: file.size, timestamp: new Date().toISOString() } });
      }
    } catch (err) { console.error("Scan error:", err); toast.error("Something went wrong. Please try again."); } finally { setUploading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 48,
    background: "#0A0A0A",
    border: "1.5px solid #1A1A1A",
    borderRadius: 0,
    padding: "0 16px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "#E5E5E5",
    outline: "none",
    transition: "border-color 0.15s ease",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "#6B7280",
    letterSpacing: "0.08em",
    marginBottom: 6,
    display: "block",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div ref={containerRef} initial={{ opacity: 0, height: 0, y: 20 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden max-w-2xl mx-auto mt-6">
          <div style={{ background: "#111111", border: "1px solid #1A1A1A", borderRadius: 0, padding: "40px 32px", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.4)" }}>
            <span style={{ display: "inline-block", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#2563EB", letterSpacing: "0.1em", background: "rgba(37,99,235,0.1)", borderRadius: 0, padding: "4px 12px", marginBottom: 20 }}>
              STEP 3 OF 3 — UPLOAD YOUR QUOTE
            </span>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, color: "#E5E5E5", fontWeight: 800, letterSpacing: "0.02em", textTransform: "uppercase", marginBottom: 8 }}>
              Drop your quote to start the scan.
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E5E7EB", marginBottom: 28 }}>
              Enter your details first, then upload your file.
            </p>

            {/* ── Name + Email gate fields ── */}
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label style={labelStyle}>FIRST NAME</label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6B7280", pointerEvents: "none" }} />
                  <input
                    type="text"
                    placeholder="Your first name"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 40 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#2563EB"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1A1A1A"; }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>EMAIL ADDRESS</label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6B7280", pointerEvents: "none" }} />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 40 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#2563EB"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1A1A1A"; }}
                  />
                </div>
              </div>
            </div>

            {/* ── Gate warning ── */}
            {gateWarning && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "rgba(249,115,22,0.08)",
                  border: "1px solid rgba(249,115,22,0.3)",
                  borderRadius: 0,
                  padding: "12px 16px",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Lock size={16} style={{ color: "#F97316", flexShrink: 0 }} />
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#F97316", fontWeight: 600 }}>
                  Please enter your name and email to unlock the scanner.
                </p>
              </motion.div>
            )}

            {/* ── Dropzone ── */}
            <div
              onDragOver={(e) => { e.preventDefault(); if (fieldsComplete) setIsDragOver(true); else setGateWarning(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={handleDropzoneInteraction}
              style={{
                border: `2px dashed ${!fieldsComplete ? "#1A1A1A" : isDragOver ? "#2563EB" : "#1A1A1A"}`,
                borderRadius: 0,
                padding: "48px 32px",
                background: !fieldsComplete ? "rgba(10,10,10,0.5)" : isDragOver ? "rgba(37,99,235,0.06)" : "#0A0A0A",
                textAlign: "center",
                cursor: fieldsComplete ? "pointer" : "not-allowed",
                transition: "all 0.15s ease",
                opacity: fieldsComplete ? 1 : 0.45,
                position: "relative",
              }}
            >
              <input ref={inputRef} type="file" accept=".pdf,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} style={{ display: "none" }} />

              {!file ? (
                <>
                  {!fieldsComplete ? (
                    <Lock size={48} style={{ color: "#6B7280", margin: "0 auto 12px" }} />
                  ) : (
                    <Upload size={48} style={{ color: "#E5E7EB", margin: "0 auto 12px" }} />
                  )}
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: fieldsComplete ? "#E5E5E5" : "#6B7280", fontWeight: 600 }}>
                    {fieldsComplete ? "Drag your quote here" : "Enter your details above to unlock"}
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E5E7EB", marginTop: 4, opacity: fieldsComplete ? 1 : 0.5 }}>
                    {fieldsComplete ? "or click to browse files" : "Name and email required"}
                  </p>
                </>
              ) : (
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center mx-auto" style={{ width: 48, height: 48, borderRadius: 0, background: "rgba(37,99,235,0.1)", marginBottom: 12 }}>
                    <span style={{ color: "#2563EB", fontSize: 24, fontWeight: 700 }}>✓</span>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E5E5E5", fontWeight: 600 }}>{file.name}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#E5E7EB", marginTop: 2 }}>{formatSize(file.size)}</p>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#2563EB", background: "none", border: "none", textDecoration: "underline", cursor: "pointer", marginTop: 8 }}>
                    Change file
                  </button>
                </div>
              )}
            </div>

            {fileError && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#F97316", textAlign: "center", marginTop: 12, fontWeight: 500 }}>{fileError}</p>}

            {file && fieldsComplete && (
              <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={handleScan} disabled={uploading}
                style={{ width: "100%", height: 54, background: "#2563EB", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, borderRadius: 0, border: "none", boxShadow: "0 4px 16px rgba(37, 99, 235, 0.3)", cursor: uploading ? "not-allowed" : "pointer", marginTop: 20, opacity: uploading ? 0.7 : 1 }}>
                {uploading ? "Uploading..." : "Start My AI Scan →"}
              </motion.button>
            )}

            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E5E7EB", textAlign: "center", marginTop: 16 }}>
              Don't have a digital copy?{" "}
              <button onClick={() => console.log({ event: "wm_photo_option_clicked" })} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#2563EB", background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}>
                Take a photo with your phone →
              </button>
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#E5E7EB", textAlign: "center", marginTop: 16 }}>
              Accepted: PDF, JPG, PNG, HEIC · Max file size: 10MB
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadZone;
