// /components/dev/DevQuoteGenerator.tsx
// This component NEVER renders in production.

import { createMockQuote } from "@/test/createMockQuote";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SCENARIOS: Record<string, Record<string, unknown>> = {
  lowSafety: { missing_specs: ["HVHZ", "DP rating"], price_per_window: 299 },
  vagueScope: { missing_specs: ["flashing", "sealing", "disposal"] },
  missingWarranty: { warranty_length: null },
  overpaymentTrap: { price_per_window: 1200, warranty_length: "Lifetime" },
  cornerCutting: { price_per_window: 199, missing_specs: ["glass thickness", "lamination"] },
  insuranceSensitive: { missing_specs: ["stucco sealant"], user_context: { timeline: "ASAP" } },
  finePrintTrap: { missing_specs: ["change orders", "permit fees"] },
};

interface DevQuoteGeneratorProps {
  sessionId?: string | null;
  onScanStart?: (fileName: string, scanSessionId: string) => void;
}

export function DevQuoteGenerator({ sessionId, onScanStart }: DevQuoteGeneratorProps) {
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!import.meta.env.DEV) return null;

  const handleGenerate = async (scenarioKey: string) => {
    if (uploading) return;

    const overrides = SCENARIOS[scenarioKey];
    const mock = createMockQuote(overrides);
    console.log("🧪 Mock quote generated:", mock);

    // If no sessionId, just log — don't upload
    if (!sessionId) {
      setStatus(`Generated mock (no session): ${scenarioKey} (${mock.id.slice(0, 8)})`);
      return;
    }

    setUploading(true);
    setStatus(`Uploading ${scenarioKey}...`);

    try {
      // 1. Upload file to storage
      const filePath = `${sessionId}/${Date.now()}_${mock.file.name}`;
      const { error: uploadError } = await supabase.storage.from("quotes").upload(filePath, mock.file);
      if (uploadError) {
        console.error("🧪 Storage upload failed:", uploadError);
        toast.error("Dev upload failed: " + uploadError.message);
        setStatus(`❌ Upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      // 2. Get lead_id
      let leadId: string | null = null;
      const { data: leads } = await supabase.rpc("get_lead_by_session", { p_session_id: sessionId });
      leadId = leads?.[0]?.id || null;

      // 3. Insert quote_files
      const quoteFileId = crypto.randomUUID();
      const { error: qfError } = await supabase.from("quote_files").insert({
        id: quoteFileId,
        lead_id: leadId,
        storage_path: filePath,
        status: "pending",
      });
      if (qfError) {
        console.error("🧪 quote_files insert failed:", qfError);
        toast.error("Dev: quote_files insert failed");
        setStatus(`❌ quote_files failed`);
        setUploading(false);
        return;
      }

      // 4. Insert scan_sessions
      const scanSessionId = crypto.randomUUID();
      const { error: ssError } = await supabase.from("scan_sessions").insert({
        id: scanSessionId,
        status: "uploading",
        lead_id: leadId,
        quote_file_id: quoteFileId,
      });
      if (ssError) {
        console.error("🧪 scan_sessions insert failed:", ssError);
        toast.error("Dev: scan_sessions insert failed");
        setStatus(`❌ scan_sessions failed`);
        setUploading(false);
        return;
      }

      // 5. Notify parent
      onScanStart?.(mock.file.name, scanSessionId);

      // 6. Invoke scan-quote edge function
      setStatus(`⏳ Scanning ${scenarioKey}... (session: ${scanSessionId.slice(0, 8)})`);
      const { error: fnError } = await supabase.functions.invoke("scan-quote", {
        body: { scan_session_id: scanSessionId },
      });
      if (fnError) {
        console.error("🧪 scan-quote invoke failed:", fnError);
        toast.error("Dev: scan invoke failed — check edge function logs");
        setStatus(`⚠️ Scan invoked but errored: ${scanSessionId.slice(0, 8)}`);
      } else {
        setStatus(`✅ ${scenarioKey} → scan session ${scanSessionId.slice(0, 8)} started`);
        toast.success(`Dev scan started: ${scenarioKey}`);
      }
    } catch (err) {
      console.error("🧪 Dev scan error:", err);
      toast.error("Dev: unexpected error");
      setStatus(`❌ Error: ${String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 16, border: "1px dashed #555", marginTop: 24, background: "#0a0a0a" }}>
      <h3 style={{ color: "#e5e5e5", marginBottom: 8 }}>🧪 Dev Quote Generator</h3>
      <p style={{ color: "#999", fontSize: 13, marginBottom: 12 }}>
        {sessionId
          ? `Session: ${sessionId.slice(0, 8)}… — clicks will upload & trigger real scan`
          : "No session ID — complete the Truth Gate first to enable real uploads"}
      </p>
      {Object.keys(SCENARIOS).map((key) => (
        <button
          key={key}
          onClick={() => handleGenerate(key)}
          disabled={uploading}
          style={{
            marginRight: 8,
            marginBottom: 8,
            padding: "6px 12px",
            background: uploading ? "#333" : "#1a1a1a",
            color: "#e5e5e5",
            border: "1px solid #333",
            borderRadius: 4,
            cursor: uploading ? "not-allowed" : "pointer",
            fontSize: 13,
          }}
        >
          {key}
        </button>
      ))}
      <p style={{ marginTop: 12, fontStyle: "italic", color: "#999", fontSize: 13 }}>{status}</p>
    </div>
  );
}
