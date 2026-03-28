import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { trackGtmEvent } from '@/lib/trackConversion';

interface VoiceFollowup {
  id: string;
  created_at: string;
  phone_e164: string;
  lead_id: string;
  scan_session_id: string | null;
  opportunity_id: string | null;
}

interface Props {
  adminPassword: string;
}

const monoFont = "'JetBrains Mono',monospace";
const bodyFont = "'DM Sans',sans-serif";

export default function VoiceFollowupsPanel({ adminPassword }: Props) {
  const [followups, setFollowups] = useState<VoiceFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callingId, setCallingId] = useState<string | null>(null);

  useEffect(() => {
    if (!adminPassword) return;

    const fetchFollowups = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke('admin-data', {
        body: {
          action: 'fetch_voice_followups',
          password: adminPassword,
        },
      });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setFollowups(data?.data || []);
      }

      setLoading(false);
    };

    fetchFollowups();
  }, [adminPassword]);

  const handleManualCall = async (log: VoiceFollowup) => {
    setCallingId(log.id);
    setError(null);
    try {
      const { error } = await supabase.functions.invoke('admin-data', {
        body: {
          action: 'trigger_voice_followup',
          password: adminPassword,
          scan_session_id: log.scan_session_id,
          phone_e164: log.phone_e164,
          opportunity_id: log.opportunity_id,
        },
      });
      if (error) {
        setError("Call failed: " + error.message);
      } else {
        alert("Voice AI Call Triggered!");
        trackGtmEvent("voice_call_triggered", {
          lead_id: log.lead_id,
          trigger: "manual_admin",
        });
      }
    } catch (err: unknown) {
      setError("Call failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setCallingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: monoFont, fontSize: 13, color: '#A0B8D8', padding: 20 }}>
        Loading voice logs…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily: monoFont, fontSize: 13, color: '#DC2626', padding: 20 }}>
        {error}
      </div>
    );
  }

  if (followups.length === 0) {
    return (
      <div style={{ fontFamily: monoFont, fontSize: 13, color: '#A0B8D8', padding: 40, textAlign: 'center' }}>
        No recent voice follow-ups found.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: bodyFont, fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#111418' }}>
            {['Date & Time', 'Phone Number', 'Lead ID', 'Opportunity ID', 'Actions'].map(col => (
              <th key={col} style={{
                fontFamily: monoFont,
                fontSize: 11,
                color: '#A0B8D8',
                letterSpacing: '0.12em',
                textAlign: 'left',
                padding: '8px 12px',
                borderBottom: '1px solid #2E3A50',
                fontWeight: 500,
                textTransform: 'uppercase',
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {followups.map(log => (
            <tr key={log.id} style={{ borderBottom: '1px solid #1C1C1C' }}>
              <td style={{ padding: '10px 12px', color: '#C8DEFF', fontFamily: monoFont, fontSize: 13 }}>
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td style={{ padding: '10px 12px', color: '#00D9FF', fontFamily: monoFont, fontSize: 13 }}>
                {log.phone_e164}
              </td>
              <td style={{ padding: '10px 12px', color: '#C8DEFF', fontFamily: monoFont, fontSize: 13 }}>
                {log.lead_id ? log.lead_id.slice(0, 8) + '…' : '—'}
              </td>
              <td style={{ padding: '10px 12px', color: '#C8DEFF', fontFamily: monoFont, fontSize: 13 }}>
                {log.opportunity_id ? log.opportunity_id.slice(0, 8) + '…' : '—'}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <button
                  onClick={() => handleManualCall(log)}
                  disabled={callingId === log.id || !log.scan_session_id}
                  title={!log.scan_session_id ? 'No scan session — cannot trigger call' : callingId === log.id ? 'Call in progress…' : undefined}
                  style={{
                    fontFamily: monoFont,
                    fontSize: 12,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '5px 10px',
                    border: 'none',
                    borderRadius: 0,
                    cursor: (callingId === log.id || !log.scan_session_id) ? 'not-allowed' : 'pointer',
                    background: (callingId === log.id || !log.scan_session_id) ? '#2E3A50' : '#1D4ED8',
                    color: !log.scan_session_id ? '#A0B8D8' : '#FFFFFF',
                  }}
                >
                  {callingId === log.id ? 'Dialing…' : 'Call Now'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
