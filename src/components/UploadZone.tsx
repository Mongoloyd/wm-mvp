import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UploadZoneProps {
  isVisible: boolean;
  onScanStart?: (fileName: string) => void;
  sessionId?: string;
}

const UploadZone = ({ isVisible, onScanStart, sessionId }: UploadZoneProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 450);
    }
  }, [isVisible]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
  ];

  const [fileError, setFileError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    setFileError(null);
    if (f.size > MAX_FILE_SIZE) {
      setFileError("File too large. Maximum size is 10MB.");
      return;
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError("Unsupported file type. Please upload a PDF or image (JPG, PNG, WEBP, HEIC).");
      return;
    }
    setFile(f);
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleScan = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const filePath = `${sessionId || crypto.randomUUID()}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('quotes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert record into quote_files
      if (sessionId) {
        // Look up lead_id by session_id
        const { data: leads } = await supabase
          .from('leads')
          .select('id')
          .eq('session_id', sessionId)
          .limit(1);

        const leadId = leads?.[0]?.id || null;

        await supabase.from('quote_files').insert({
          lead_id: leadId,
          storage_path: filePath,
          status: 'pending',
        });
      }

      onScanStart?.(file.name);
    } catch (err) {
      console.error('Upload error:', err);
      // Still proceed with scan for UX
      onScanStart?.(file.name);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, height: 0, y: 20 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="overflow-hidden max-w-2xl mx-auto mt-6"
        >
          <div
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #E5E7EB",
              borderRadius: 16,
              padding: "40px 32px",
              boxShadow: "0 4px 24px rgba(15, 31, 53, 0.08)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: "#0099BB",
                letterSpacing: "0.1em",
                background: "#E8F7FB",
                borderRadius: 6,
                padding: "4px 12px",
                marginBottom: 20,
              }}
            >
              STEP 3 OF 3 — UPLOAD YOUR QUOTE
            </span>

            <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: 26, color: "#0F1F35", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
              Drop your quote to start the scan.
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#6B7280", marginBottom: 28 }}>
              PDF, photo, or screenshot — any format works.
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => { if (inputRef.current) { inputRef.current.value = ""; inputRef.current.click(); } }}
              style={{
                border: `2px dashed ${isDragOver ? "#C8952A" : "#D1D5DB"}`,
                borderRadius: 12,
                padding: "48px 32px",
                background: isDragOver ? "#FDF3E3" : "#F9FAFB",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                style={{ display: "none" }}
              />

              {!file ? (
                <>
                  <Upload size={48} style={{ color: "#9CA3AF", margin: "0 auto 12px" }} />
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#374151", fontWeight: 600 }}>
                    Drag your quote here
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
                    or click to browse files
                  </p>
                </>
              ) : (
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center mx-auto" style={{ width: 48, height: 48, borderRadius: "50%", background: "#ECFDF5", marginBottom: 12 }}>
                    <span style={{ color: "#059669", fontSize: 24, fontWeight: 700 }}>✓</span>
            </div>

            {fileError && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#DC2626", textAlign: "center", marginTop: 12, fontWeight: 500 }}>
                {fileError}
              </p>
            )}
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#0F1F35", fontWeight: 600 }}>
                    {file.name}
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    {formatSize(file.size)}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#0099BB", background: "none", border: "none", textDecoration: "underline", cursor: "pointer", marginTop: 8 }}
                  >
                    Change file
                  </button>
                </div>
              )}
            </div>

            {file && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleScan}
                disabled={uploading}
                style={{
                  width: "100%",
                  height: 54,
                  background: "#059669",
                  color: "#FFFFFF",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  borderRadius: 10,
                  border: "none",
                  boxShadow: "0 4px 16px rgba(5, 150, 105, 0.3)",
                  cursor: uploading ? "not-allowed" : "pointer",
                  marginTop: 20,
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? "Uploading..." : "Start My AI Scan →"}
              </motion.button>
            )}

            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 16 }}>
              Don't have a digital copy?{" "}
              <button
                onClick={() => console.log({ event: "wm_photo_option_clicked" })}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#0099BB", background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}
              >
                Take a photo with your phone →
              </button>
            </p>

            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 16 }}>
              Accepted: PDF, JPG, PNG, HEIC · Max file size: 25MB
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadZone;
