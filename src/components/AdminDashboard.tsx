/**
 * AdminDashboard.tsx — WindowMan Call Queue Command Center
 *
 * This is not a list view. It's a real-time triage tool.
 *
 * SUPABASE REALTIME: Subscribes to INSERT/UPDATE on leads table.
 * New leads appear instantly. Status changes reflect immediately.
 *
 * TIME DECAY SYSTEM:
 *   0–5 min:   Green border — optimal connect window
 *   5–15 min:  Amber border — connect rate declining
 *   >15 min:   Orange border (#F97316) — connect rate critically low
 *   >60 min:   Gray border — call but expect voicemail
 *
 * TIER SYSTEM:
 *   Tier 1 (Flow C): contractor visit imminent or verbal quote
 *     → Pinned to top. Large "CALL NOW" button. Red urgency.
 *   Tier 2 (Flow A): has written quote
 *     → Standard row. Cobalt CTA.
 *   Tier 3 (Flow B): research phase
 *     → Amber CTA. Call within 2 hours.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface Lead {
  id:            string;
  first_name:    string;
  phone:         string;
  email:         string;
  county_name:   string;
  window_count:  string | null;
  project_type:  string | null;
  quote_range:   string | null;
  process_stage: string | null;
  active_flow:   'A' | 'B' | 'C' | null;
  lead_tier:     number;
  grade:         string | null;
  dollar_delta:  number | null;
  top_flag_title:string | null;
  top_flag_body: string | null;
  phone_verified:boolean;
  status:        'new' | 'called' | 'appointment' | 'closed' | 'dead';
  utm_campaign:  string | null;
  created_at:    string;
  updated_at:    string;
}

interface DailyStats {
  totalLeads:         number;
  tier1Leads:         number;
  verifiedLeads:      number;
  appointmentsToday:  number;
  projectedRevenue:   number;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function secondsSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
}

function formatAge(seconds: number): string {
  if (seconds < 60)  return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function getAgeStyle(seconds: number, status: string): React.CSSProperties {
  if (status !== 'new') return { color: '#7D9DBB' };
  if (seconds < 300)  return { color: '#10B981', fontWeight: 700 };
  if (seconds < 900)  return { color: '#F59E0B', fontWeight: 700 };
  if (seconds < 3600) return { color: '#F97316', fontWeight: 700 };
  return { color: '#7D9DBB' };
}

function getRowBorderColor(lead: Lead, seconds: number): string {
  if (lead.status !== 'new') return '#2E3A50';
  if (lead.lead_tier === 1 && seconds < 300) return '#DC2626';
  if (seconds < 300)  return '#10B981';
  if (seconds < 900)  return '#F59E0B';
  if (seconds < 3600) return '#F97316';
  return '#2E3A50';
}

function getFlowBadge(flow: string | null, tier: number) {
  if (tier === 1) return { label: 'TIER 1', bg: 'rgba(220,38,38,0.18)', color: '#F87171' };
  if (flow === 'A') return { label: 'FLOW A', bg: 'rgba(29,78,216,0.18)', color: '#60A5FA' };
  if (flow === 'B') return { label: 'FLOW B', bg: 'rgba(245,158,11,0.18)', color: '#F59E0B' };
  if (flow === 'C') return { label: 'FLOW C', bg: 'rgba(249,115,22,0.18)', color: '#F97316' };
  return { label: '—', bg: 'transparent', color: '#7D9DBB' };
}

function buildCallScript(lead: Lead): string {
  const lines = [
    `Hi ${lead.first_name}, this is Pete from WindowMan.`,
    `You just submitted your impact window quote for review.`,
    lead.county_name ? `I have your ${lead.county_name} County market data pulled up.` : '',
    lead.quote_range ? `You mentioned a quote around ${lead.quote_range}.` : '',
    lead.top_flag_title ? `I can already see a flag: ${lead.top_flag_title}.` : '',
    `Do you still have the quote nearby? Takes about 8 minutes.`,
  ];
  return lines.filter(Boolean).join(' ');
}

function buildSMSScript(lead: Lead): string {
  return `Hi ${lead.first_name}, it's Pete from WindowMan. Your ${lead.county_name || 'FL'} quote review is ready — do you still have your quote nearby? (WindowMan.pro)`;
}

// ── LEAD ROW COMPONENT ────────────────────────────────────────────────────────

function LeadRow({
  lead,
  onStatusChange,
  onCallNow,
  onSMS,
}: {
  lead: Lead;
  onStatusChange: (id: string, status: Lead['status']) => void;
  onCallNow: (lead: Lead) => void;
  onSMS: (lead: Lead) => void;
}) {
  const [seconds, setSeconds] = useState(() => secondsSince(lead.created_at));
  const [expanded, setExpanded] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setSeconds(secondsSince(lead.created_at)), 1000);
    return () => clearInterval(interval);
  }, [lead.created_at]);

  const flowBadge   = getFlowBadge(lead.active_flow, lead.lead_tier);
  const borderColor = getRowBorderColor(lead, seconds);
  const ageStyle    = getAgeStyle(seconds, lead.status);
  const isTier1New  = lead.lead_tier === 1 && lead.status === 'new';
  const script      = buildCallScript(lead);

  const copyScript = () => {
    navigator.clipboard.writeText(script);
    setCopyFeedback('COPIED');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const monoFont = "'JetBrains Mono',monospace";
  const bodyFont = "'DM Sans',sans-serif";
  const dispFont = "'Barlow Condensed',sans-serif";

  return (
    <div style={{
      background: isTier1New ? 'rgba(220,38,38,0.04)' : '#111418',
      border: `1px solid ${borderColor}`,
      borderLeft: `3px solid ${borderColor}`,
      marginBottom: 6,
      transition: 'border-color 1s ease',
    }}>
      {/* Main row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '24px 1fr 80px 100px 80px 110px 160px',
          gap: 0, alignItems: 'center', padding: '10px 14px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand toggle */}
        <div style={{ fontFamily: monoFont, fontSize: 10, color: '#7D9DBB', userSelect: 'none' }}>
          {expanded ? '▼' : '▶'}
        </div>

        {/* Name + county */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>
              {lead.first_name}
            </span>
            <span style={{
              fontFamily: monoFont, fontSize: 9, padding: '2px 6px', borderRadius: 2,
              background: flowBadge.bg, color: flowBadge.color,
              letterSpacing: '0.08em',
            }}>
              {flowBadge.label}
            </span>
            {lead.grade && (
              <span style={{
                fontFamily: dispFont, fontSize: 16, fontWeight: 900,
                color: lead.grade === 'F' || lead.grade === 'D' ? '#DC2626' :
                       lead.grade === 'C' ? '#F59E0B' : '#10B981',
              }}>
                {lead.grade}
              </span>
            )}
          </div>
          <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.08em' }}>
            {lead.county_name || '—'} · {lead.quote_range || 'no range'} · {lead.window_count || '—'}
          </div>
        </div>

        {/* Phone */}
        <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8' }}>
          {lead.phone_verified ? '✓' : '○'} {lead.phone.slice(-4).padStart(lead.phone.length, '•')}
        </div>

        {/* Time since capture */}
        <div style={{ fontFamily: monoFont, fontSize: 12, ...ageStyle, textAlign: 'right' }}>
          {formatAge(seconds)} ago
        </div>

        {/* Dollar delta */}
        <div style={{
          fontFamily: dispFont, fontWeight: 800, fontSize: 15,
          color: lead.dollar_delta ? '#DC2626' : '#7D9DBB',
          textTransform: 'uppercase', textAlign: 'right',
        }}>
          {lead.dollar_delta ? `+$${lead.dollar_delta.toLocaleString()}` : '—'}
        </div>

        {/* Status selector */}
        <select
          value={lead.status}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(lead.id, e.target.value as Lead['status']);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontFamily: monoFont, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
            background: '#161C28', border: '1px solid #2E3A50', color: '#A0B8D8',
            padding: '4px 6px', cursor: 'pointer', borderRadius: 0,
          }}
        >
          {['new','called','appointment','closed','dead'].map(s => (
            <option key={s} value={s}>{s.toUpperCase()}</option>
          ))}
        </select>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
          {isTier1New ? (
            <button
              onClick={(e) => { e.stopPropagation(); onCallNow(lead); }}
              style={{
                fontFamily: bodyFont, fontWeight: 700, fontSize: 11, color: '#FFFFFF',
                background: '#DC2626', border: 'none', padding: '6px 12px',
                borderRadius: 2, cursor: 'pointer', whiteSpace: 'nowrap',
                animation: 'pulse-red 1.5s ease-in-out infinite',
              }}
            >
              CALL NOW
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onCallNow(lead); }}
              style={{
                fontFamily: bodyFont, fontWeight: 700, fontSize: 10, color: '#FFFFFF',
                background: '#0B60C5', border: 'none', padding: '5px 10px',
                borderRadius: 2, cursor: 'pointer',
              }}
            >
              CALL
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onSMS(lead); }}
            style={{
              fontFamily: bodyFont, fontWeight: 600, fontSize: 10, color: '#A0B8D8',
              background: 'transparent', border: '1px solid #2E3A50', padding: '5px 8px',
              borderRadius: 2, cursor: 'pointer',
            }}
          >
            SMS
          </button>
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div style={{
          borderTop: '1px solid #1C1C1C',
          padding: '14px 14px 14px 38px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
        }}>
          {/* Call script */}
          <div>
            <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.1em', marginBottom: 8 }}>
              OPENING SCRIPT
            </div>
            <div style={{
              fontFamily: bodyFont, fontSize: 13, color: '#A0B8D8',
              lineHeight: 1.65, background: '#0A0A0A', padding: 12,
              borderLeft: '2px solid #1D4ED8', marginBottom: 10,
            }}>
              "{script}"
            </div>
            <button
              onClick={copyScript}
              style={{
                fontFamily: monoFont, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: copyFeedback ? '#10B981' : '#1D4ED8', background: 'transparent', border: 'none',
                cursor: 'pointer', padding: 0,
              }}
            >
              {copyFeedback || '⊕ COPY SCRIPT'}
            </button>
          </div>

          {/* Lead intelligence */}
          <div>
            <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.1em', marginBottom: 8 }}>
              INTELLIGENCE PAYLOAD
            </div>
            {[
              ['Phone',      lead.phone,                           lead.phone_verified ? '#10B981' : '#F59E0B'],
              ['Email',      lead.email,                           '#A0B8D8'],
              ['Project',    lead.project_type || '—',             '#A0B8D8'],
              ['Process',    lead.process_stage || '—',            '#A0B8D8'],
              ['Campaign',   lead.utm_campaign || 'direct',        '#7D9DBB'],
              ['Top Flag',   lead.top_flag_title || 'none found',  lead.top_flag_title ? '#F97316' : '#7D9DBB'],
            ].map(([label, value, color]) => (
              <div key={label as string} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', width: 60, flexShrink: 0, letterSpacing: '0.08em', textTransform: 'uppercase', paddingTop: 1 }}>
                  {label as string}
                </div>
                <div style={{ fontFamily: monoFont, fontSize: 11, color: color as string }}>
                  {value as string}
                </div>
              </div>
            ))}
          </div>

          {/* Manual webhook trigger */}
          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #1C1C1C', paddingTop: 12 }}>
            <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.1em', marginBottom: 8 }}>
              MANUAL ACTIONS
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  // Re-fire the webhook manually for this lead
                  fetch(import.meta.env.VITE_LEAD_WEBHOOK_URL || '', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      event: 'manual_callback_trigger',
                      leadId: lead.id,
                      firstName: lead.first_name,
                      phone: lead.phone,
                      countyName: lead.county_name,
                      windowCount: lead.window_count,
                      projectType: lead.project_type,
                      quoteRange: lead.quote_range,
                      processStage: lead.process_stage,
                      flow: lead.active_flow,
                      leadTier: lead.lead_tier,
                    }),
                  }).then(() => onStatusChange(lead.id, 'called'));
                }}
                style={{
                  fontFamily: monoFont, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#FFFFFF', background: '#BB2D00', border: 'none',
                  padding: '7px 14px', borderRadius: 2, cursor: 'pointer',
                }}
              >
                ⚡ TRIGGER AI CALLER WEBHOOK
              </button>
              <button
                onClick={() => {
                  const text = `Contractor Briefing for ${lead.first_name}:\nCounty: ${lead.county_name}\nQuote Range: ${lead.quote_range}\nKey Flag: ${lead.top_flag_title || 'none'}\nFlag Detail: ${lead.top_flag_body || 'none'}\nGrade: ${lead.grade || 'pending'}`;
                  navigator.clipboard.writeText(text);
                }}
                style={{
                  fontFamily: monoFont, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#A0B8D8', background: 'transparent', border: '1px solid #2E3A50',
                  padding: '7px 14px', borderRadius: 2, cursor: 'pointer',
                }}
              >
                📋 COPY CONTRACTOR BRIEFING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STATS HEADER ──────────────────────────────────────────────────────────────

function StatsHeader({ stats }: { stats: DailyStats }) {
  const monoFont = "'JetBrains Mono',monospace";
  const dispFont = "'Barlow Condensed',sans-serif";

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 1, background: '#2E3A50', marginBottom: 20 }}>
      {[
        { label: 'LEADS TODAY',        value: stats.totalLeads,         color: '#C8DEFF' },
        { label: 'TIER 1 (CALL NOW)',   value: stats.tier1Leads,         color: '#F87171' },
        { label: 'VERIFIED PHONE',      value: stats.verifiedLeads,      color: '#10B981' },
        { label: 'APPOINTMENTS',        value: stats.appointmentsToday,  color: '#00D9FF' },
        {
          label: 'PROJ. REVENUE',
          value: `$${(stats.projectedRevenue).toLocaleString()}`,
          color: '#F59E0B',
        },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ background: '#111418', padding: '14px 16px' }}>
          <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.12em', marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN ADMIN DASHBOARD ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [filter, setFilter]       = useState<'all' | 'new' | 'tier1'>('tier1');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [stats, setStats]         = useState<DailyStats>({
    totalLeads: 0, tier1Leads: 0, verifiedLeads: 0, appointmentsToday: 0, projectedRevenue: 0,
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchLeads = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('lead_tier', { ascending: true })      // Tier 1 first
      .order('created_at', { ascending: false });   // Newest within tier

    if (!error && data) {
      setLeads(data as Lead[]);
      const todayLeads = data as Lead[];
      setStats({
        totalLeads:        todayLeads.length,
        tier1Leads:        todayLeads.filter(l => l.lead_tier === 1).length,
        verifiedLeads:     todayLeads.filter(l => l.phone_verified).length,
        appointmentsToday: todayLeads.filter(l => l.status === 'appointment').length,
        projectedRevenue:  Math.round(
          todayLeads.filter(l => l.status === 'appointment').length * 4800 * 0.38
        ),
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();

    // Supabase Realtime — new leads appear instantly
    channelRef.current = supabase
      .channel('leads-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
      }, () => fetchLeads())
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [fetchLeads]);

  const handleStatusChange = async (id: string, status: Lead['status']) => {
    await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const handleCallNow = (lead: Lead) => {
    window.open(`tel:${lead.phone}`, '_self');
    handleStatusChange(lead.id, 'called');
  };

  const handleSMS = (lead: Lead) => {
    window.open(`sms:${lead.phone}?body=${encodeURIComponent(buildSMSScript(lead))}`, '_self');
  };

  const filteredLeads = leads.filter(l => {
    const matchesFilter = filter === 'all' ? true :
      filter === 'new'   ? l.status === 'new' :
      filter === 'tier1' ? l.lead_tier === 1  : true;
    const matchesSearch = !search || 
      l.first_name.toLowerCase().includes(search.toLowerCase()) ||
      l.county_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  const monoFont = "'JetBrains Mono',monospace";
  const bodyFont = "'DM Sans',sans-serif";

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', padding: '24px 20px', fontFamily: bodyFont }}>
      <style>{`
        @keyframes pulse-red {
          0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(220,38,38,0); }
        }
        select option { background: #161C28; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 28, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            CALL QUEUE
          </div>
          <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.12em', marginTop: 2 }}>
            WINDOWMAN · LEAD COMMAND CENTER · REALTIME
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Realtime indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse-red 2s infinite' }} />
            <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB' }}>LIVE</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsHeader stats={stats} />

      {/* Filters + Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        {(['tier1', 'new', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontFamily: monoFont, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '6px 12px', border: 'none', borderRadius: 2, cursor: 'pointer',
              background: filter === f ? '#1D4ED8' : '#161C28',
              color: filter === f ? '#FFFFFF' : '#7D9DBB',
            }}
          >
            {f === 'tier1' ? 'TIER 1 ONLY' : f.toUpperCase()}
          </button>
        ))}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, county, phone..."
          style={{
            fontFamily: bodyFont, fontSize: 12, color: '#FFFFFF',
            background: '#161C28', border: '1px solid #2E3A50', padding: '6px 12px',
            borderRadius: 0, outline: 'none', flex: 1, maxWidth: 280,
          }}
        />
      </div>

      {/* Tier 1 urgency header */}
      {filteredLeads.some(l => l.lead_tier === 1 && l.status === 'new') && (
        <div style={{
          fontFamily: monoFont, fontSize: 9, color: '#F87171', letterSpacing: '0.14em',
          padding: '6px 12px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
          marginBottom: 8,
        }}>
          ▲ {filteredLeads.filter(l => l.lead_tier === 1 && l.status === 'new').length} TIER 1 LEADS NEED IMMEDIATE ATTENTION
        </div>
      )}

      {/* Lead rows */}
      {loading ? (
        <div style={{ fontFamily: monoFont, fontSize: 11, color: '#7D9DBB', padding: 20 }}>LOADING...</div>
      ) : filteredLeads.length === 0 ? (
        <div style={{ fontFamily: monoFont, fontSize: 11, color: '#7D9DBB', padding: 20 }}>NO LEADS MATCH FILTER</div>
      ) : (
        filteredLeads.map(lead => (
          <LeadRow
            key={lead.id}
            lead={lead}
            onStatusChange={handleStatusChange}
            onCallNow={handleCallNow}
            onSMS={handleSMS}
          />
        ))
      )}
    </div>
  );
}
