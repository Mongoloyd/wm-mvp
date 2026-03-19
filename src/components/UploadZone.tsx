import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && containerRef.current) {
      setTimeout(() => { containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 450);
    }
  }, [isVisible]);

  const handleFile = useCallback((f: File) => {
    setFileError(null);
    if (f.size > MAX_FILE_SIZE) { setFileError("File too large. Maximum size is 10MB."); return; }
    if (!ALLOWED_TYPES.includes(f.type)) { setFileError("Unsupported file type. Please upload a PDF or image (JPG, PNG, WEBP, HEIC)."); return; }
    setFile(f);
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }, [handleFile]);

  const handleScan = async () => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const filePath = `${sessionId || crypto.randomUUID()}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("quotes").upload(filePath, file);
      if (uploadError) { console.error("Storage upload failed:", uploadError); toast.error("Upload failed. Please try again."); setUploading(false); return; }
      let leadId: string | null = null;
      if (sessionId) { const { data: leads } = await supabase.rpc("get_lead_by_session", { p_session_id: sessionId }); leadId = leads?.[0]?.id || null; }
      const quoteFileId = crypto.randomUUID();
      const { error: qfError } = await supabase.from("quote_files").insert({ id: quoteFileId, lead_id: leadId, storage_path: filePath, status: "pending" });
      if (qfError) { console.error("quote_files insert failed:", qfError); toast.error("Failed to register your file. Please try again."); setUploading(false); return; }
      const scanSessionId = crypto.randomUUID();
      const { error: ssError } = await supabase.from("scan_sessions").insert({ id: scanSessionId, status: "uploading", lead_id: leadId, quote_file_id: qfData.id });
      if (ssError) { console.error("scan_sessions insert failed:", ssError); toast.error("Failed to start scan session. Please try again."); setUploading(false); return; }
      onScanStart?.(file.name, scanSessionId);
      const { error: fnError } = await supabase.functions.invoke("scan-quote", { body: { scan_session_id: scanSessionId } });
      if (fnError) {
        console.error("scan-quote invoke failed:", fnError);
        toast.error("Scan encountered an issue. We'll retry automatically.");
        await supabase.from("event_logs").insert({ event_name: "scan_invoke_failed", session_id: sessionId || null, metadata: { scan_session_id: scanSessionId, quote_file_id: qfData.id, error_message: fnError.message || String(fnError), file_name: file.name, file_size: file.size, timestamp: new Date().toISOString() } });
      }
    } catch (err) { console.error("Scan error:", err); toast.error("Something went wrong. Please try again."); } finally { setUploading(false); }
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
              PDF, photo, or screenshot — any format works.
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => { if (inputRef.current) { inputRef.current.value = ""; inputRef.current.click(); } }}
              style={{
                border: `2px dashed ${isDragOver ? "#2563EB" : "#1A1A1A"}`,
                borderRadius: 0,
                padding: "48px 32px",
                background: isDragOver ? "rgba(37,99,235,0.06)" : "#0A0A0A",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <input ref={inputRef} type="file" accept=".pdf,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} style={{ display: "none" }} />

              {!file ? (
                <>
                  <Upload size={48} style={{ color: "#E5E7EB", margin: "0 auto 12px" }} />
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E5E5E5", fontWeight: 600 }}>Drag your quote here</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E5E7EB", marginTop: 4 }}>or click to browse files</p>
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

            {file && (
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
