/**
 * AdminDashboard.tsx — WindowMan Operator Command Center
 *
 * Two tabs:
 *   1. CALL QUEUE — existing lead triage (preserved)
 *   2. CONTRACTOR QUEUE — new routing console for contractor opportunities
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Use service-role for admin operations (read contractor tables)
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ══════════════════════════════════════════════════════════════════════════════
// SHARED TYPES & HELPERS
// ══════════════════════════════════════════════════════════════════════════════

const monoFont = "'JetBrains Mono',monospace";
const bodyFont = "'DM Sans',sans-serif";
const dispFont = "'Barlow Condensed',sans-serif";

interface Lead {
  id: string; first_name: string; phone: string; email: string;
  county_name: string; window_count: string | null; project_type: string | null;
  quote_range: string | null; process_stage: string | null;
  active_flow: 'A' | 'B' | 'C' | null; lead_tier: number;
  grade: string | null; dollar_delta: number | null;
  top_flag_title: string | null; top_flag_body: string | null;
  phone_verified: boolean;
  status: 'new' | 'called' | 'appointment' | 'closed' | 'dead';
  utm_campaign: string | null; created_at: string; updated_at: string;
}

interface Opportunity {
  id: string; created_at: string; updated_at: string;
  lead_id: string; scan_session_id: string; analysis_id: string;
  status: string; intro_requested_at: string;
  brief_generated_at: string | null; brief_json: Record<string, unknown> | null;
  brief_text: string | null; county: string | null;
  project_type: string | null; window_count: number | null;
  quote_range: string | null; grade: string | null;
  flag_count: number; red_flag_count: number; amber_flag_count: number;
  assigned_operator: string | null; internal_notes: string | null;
  priority_score: number; routed_at: string | null;
  homeowner_contact_released_at: string | null;
}

interface Contractor {
  id: string; company_name: string; contact_name: string | null;
  status: string; service_counties: string[]; project_types: string[];
  is_vetted: boolean; min_window_count: number | null;
  max_window_count: number | null; accepts_low_grade_leads: boolean;
  notes: string | null;
}

interface Route {
  id: string; opportunity_id: string; contractor_id: string;
  route_status: string; sent_at: string | null;
  contact_released: boolean; contact_released_at: string | null;
  assigned_by: string | null; routing_reason: string | null;
}

interface DailyStats {
  totalLeads: number; tier1Leads: number; verifiedLeads: number;
  appointmentsToday: number; projectedRevenue: number;
}

function secondsSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function getAgeStyle(seconds: number, status: string): React.CSSProperties {
  if (status !== 'new') return { color: '#7D9DBB' };
  if (seconds < 300) return { color: '#10B981', fontWeight: 700 };
  if (seconds < 900) return { color: '#F59E0B', fontWeight: 700 };
  if (seconds < 3600) return { color: '#F97316', fontWeight: 700 };
  return { color: '#7D9DBB' };
}

function getRowBorderColor(lead: Lead, seconds: number): string {
  if (lead.status !== 'new') return '#2E3A50';
  if (lead.lead_tier === 1 && seconds < 300) return '#DC2626';
  if (seconds < 300) return '#10B981';
  if (seconds < 900) return '#F59E0B';
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
  return [
    `Hi ${lead.first_name}, this is Pete from WindowMan.`,
    `You just submitted your impact window quote for review.`,
    lead.county_name ? `I have your ${lead.county_name} County market data pulled up.` : '',
    lead.quote_range ? `You mentioned a quote around ${lead.quote_range}.` : '',
    lead.top_flag_title ? `I can already see a flag: ${lead.top_flag_title}.` : '',
    `Do you still have the quote nearby? Takes about 8 minutes.`,
  ].filter(Boolean).join(' ');
}

function buildSMSScript(lead: Lead): string {
  return `Hi ${lead.first_name}, it's Pete from WindowMan. Your ${lead.county_name || 'FL'} quote review is ready — do you still have your quote nearby? (WindowMan.pro)`;
}

// ══════════════════════════════════════════════════════════════════════════════
// STATUS PILLS
// ══════════════════════════════════════════════════════════════════════════════

function StatusPill({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; color: string }> = {
    intro_requested: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
    brief_generating: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
    brief_ready: { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
    queued: { bg: 'rgba(59,130,246,0.15)', color: '#60A5FA' },
    assigned_internal: { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6' },
    sent_to_contractor: { bg: 'rgba(6,182,212,0.15)', color: '#06B6D4' },
    contractor_interested: { bg: 'rgba(16,185,129,0.2)', color: '#10B981' },
    contractor_declined: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
    homeowner_contact_released: { bg: 'rgba(245,158,11,0.2)', color: '#F59E0B' },
    closed_won: { bg: 'rgba(16,185,129,0.25)', color: '#10B981' },
    closed_lost: { bg: 'rgba(107,114,128,0.2)', color: '#6B7280' },
    dead: { bg: 'rgba(107,114,128,0.15)', color: '#6B7280' },
  };
  const style = colorMap[status] || { bg: 'rgba(107,114,128,0.15)', color: '#6B7280' };
  return (
    <span style={{
      fontFamily: monoFont, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '3px 8px', background: style.bg, color: style.color, borderRadius: 2,
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span style={{ color: '#7D9DBB' }}>—</span>;
  const color = grade === 'F' || grade === 'D' ? '#DC2626' :
    grade === 'C' ? '#F59E0B' : '#10B981';
  return (
    <span style={{ fontFamily: dispFont, fontSize: 20, fontWeight: 900, color }}>
      {grade}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LEAD ROW (preserved from original)
// ══════════════════════════════════════════════════════════════════════════════

function LeadRow({
  lead, onStatusChange, onCallNow, onSMS,
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

  const flowBadge = getFlowBadge(lead.active_flow, lead.lead_tier);
  const borderColor = getRowBorderColor(lead, seconds);
  const ageStyle = getAgeStyle(seconds, lead.status);
  const isTier1New = lead.lead_tier === 1 && lead.status === 'new';
  const script = buildCallScript(lead);

  const copyScript = () => {
    navigator.clipboard.writeText(script);
    setCopyFeedback('COPIED');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  return (
    <div style={{
      background: isTier1New ? 'rgba(220,38,38,0.04)' : '#111418',
      border: `1px solid ${borderColor}`, borderLeft: `3px solid ${borderColor}`,
      marginBottom: 6, transition: 'border-color 1s ease',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '24px 1fr 80px 100px 80px 110px 160px',
        gap: 0, alignItems: 'center', padding: '10px 14px', cursor: 'pointer',
      }} onClick={() => setExpanded(!expanded)}>
        <div style={{ fontFamily: monoFont, fontSize: 10, color: '#7D9DBB', userSelect: 'none' }}>{expanded ? '▼' : '▶'}</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{lead.first_name}</span>
            <span style={{ fontFamily: monoFont, fontSize: 9, padding: '2px 6px', borderRadius: 2, background: flowBadge.bg, color: flowBadge.color, letterSpacing: '0.08em' }}>{flowBadge.label}</span>
            {lead.grade && <span style={{ fontFamily: dispFont, fontSize: 16, fontWeight: 900, color: lead.grade === 'F' || lead.grade === 'D' ? '#DC2626' : lead.grade === 'C' ? '#F59E0B' : '#10B981' }}>{lead.grade}</span>}
          </div>
          <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.08em' }}>{lead.county_name || '—'} · {lead.quote_range || 'no range'} · {lead.window_count || '—'}</div>
        </div>
        <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8' }}>{lead.phone_verified ? '✓' : '○'} {lead.phone.slice(-4).padStart(lead.phone.length, '•')}</div>
        <div style={{ fontFamily: monoFont, fontSize: 12, ...ageStyle, textAlign: 'right' }}>{formatAge(seconds)} ago</div>
        <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 15, color: lead.dollar_delta ? '#DC2626' : '#7D9DBB', textTransform: 'uppercase', textAlign: 'right' }}>{lead.dollar_delta ? `+$${lead.dollar_delta.toLocaleString()}` : '—'}</div>
        <select value={lead.status} onChange={(e) => { e.stopPropagation(); onStatusChange(lead.id, e.target.value as Lead['status']); }} onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: monoFont, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#161C28', border: '1px solid #2E3A50', color: '#A0B8D8', padding: '4px 6px', cursor: 'pointer', borderRadius: 0 }}>
          {['new', 'called', 'appointment', 'closed', 'dead'].map(s => (<option key={s} value={s}>{s.toUpperCase()}</option>))}
        </select>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
          {isTier1New ? (
            <button onClick={(e) => { e.stopPropagation(); onCallNow(lead); }}
              style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 11, color: '#FFFFFF', background: '#DC2626', border: 'none', padding: '6px 12px', borderRadius: 2, cursor: 'pointer', whiteSpace: 'nowrap', animation: 'pulse-red 1.5s ease-in-out infinite' }}>CALL NOW</button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onCallNow(lead); }}
              style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 10, color: '#FFFFFF', background: '#0B60C5', border: 'none', padding: '5px 10px', borderRadius: 2, cursor: 'pointer' }}>CALL</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onSMS(lead); }}
            style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 10, color: '#A0B8D8', background: 'transparent', border: '1px solid #2E3A50', padding: '5px 8px', borderRadius: 2, cursor: 'pointer' }}>SMS</button>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid #1C1C1C', padding: '14px 14px 14px 38px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.1em', marginBottom: 8 }}>OPENING SCRIPT</div>
            <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#A0B8D8', lineHeight: 1.65, background: '#0A0A0A', padding: 12, borderLeft: '2px solid #1D4ED8', marginBottom: 10 }}>"{script}"</div>
            <button onClick={copyScript} style={{ fontFamily: monoFont, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: copyFeedback ? '#10B981' : '#1D4ED8', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>{copyFeedback || '⊕ COPY SCRIPT'}</button>
          </div>
          <div>
            <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.1em', marginBottom: 8 }}>INTELLIGENCE PAYLOAD</div>
            {[
              ['Phone', lead.phone, lead.phone_verified ? '#10B981' : '#F59E0B'],
              ['Email', lead.email, '#A0B8D8'],
              ['Project', lead.project_type || '—', '#A0B8D8'],
              ['Process', lead.process_stage || '—', '#A0B8D8'],
              ['Campaign', lead.utm_campaign || 'direct', '#7D9DBB'],
              ['Top Flag', lead.top_flag_title || 'none found', lead.top_flag_title ? '#F97316' : '#7D9DBB'],
            ].map(([label, value, color]) => (
              <div key={label as string} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', width: 60, flexShrink: 0, letterSpacing: '0.08em', textTransform: 'uppercase', paddingTop: 1 }}>{label as string}</div>
                <div style={{ fontFamily: monoFont, fontSize: 11, color: color as string }}>{value as string}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STATS HEADER
// ══════════════════════════════════════════════════════════════════════════════

function StatsHeader({ stats }: { stats: DailyStats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 1, background: '#2E3A50', marginBottom: 20 }}>
      {[
        { label: 'LEADS TODAY', value: stats.totalLeads, color: '#C8DEFF' },
        { label: 'TIER 1 (CALL NOW)', value: stats.tier1Leads, color: '#F87171' },
        { label: 'VERIFIED PHONE', value: stats.verifiedLeads, color: '#10B981' },
        { label: 'APPOINTMENTS', value: stats.appointmentsToday, color: '#00D9FF' },
        { label: 'PROJ. REVENUE', value: `$${(stats.projectedRevenue).toLocaleString()}`, color: '#F59E0B' },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ background: '#111418', padding: '14px 16px' }}>
          <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.12em', marginBottom: 6 }}>{label}</div>
          <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTRACTOR QUEUE — OPPORTUNITY ROW
// ══════════════════════════════════════════════════════════════════════════════

function OpportunityRow({
  opp, onOpenDetail,
}: {
  opp: Opportunity;
  onOpenDetail: (opp: Opportunity) => void;
}) {
  const age = secondsSince(opp.intro_requested_at);

  return (
    <div
      style={{
        background: '#111418', border: '1px solid #2E3A50',
        borderLeft: `3px solid ${opp.priority_score >= 60 ? '#DC2626' : opp.priority_score >= 35 ? '#F59E0B' : '#2E3A50'}`,
        marginBottom: 6, cursor: 'pointer',
      }}
      onClick={() => onOpenDetail(opp)}
    >
      <div style={{
        display: 'grid', gridTemplateColumns: '50px 1fr 100px 80px 100px 120px',
        gap: 0, alignItems: 'center', padding: '12px 14px',
      }}>
        {/* Priority */}
        <div style={{
          fontFamily: dispFont, fontWeight: 900, fontSize: 22,
          color: opp.priority_score >= 60 ? '#DC2626' : opp.priority_score >= 35 ? '#F59E0B' : '#7D9DBB',
        }}>
          {opp.priority_score}
        </div>

        {/* Grade + county + project */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
            <GradeBadge grade={opp.grade} />
            <span style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>
              {opp.county || '—'} County
            </span>
            <StatusPill status={opp.status} />
          </div>
          <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.08em' }}>
            {opp.project_type || '—'} · {opp.window_count ?? '—'} windows · {opp.quote_range || '—'}
          </div>
        </div>

        {/* Flags */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.08em', marginBottom: 2 }}>FLAGS</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {opp.red_flag_count > 0 && <span style={{ fontFamily: monoFont, fontSize: 11, color: '#DC2626', fontWeight: 700 }}>{opp.red_flag_count}R</span>}
            {opp.amber_flag_count > 0 && <span style={{ fontFamily: monoFont, fontSize: 11, color: '#F59E0B', fontWeight: 700 }}>{opp.amber_flag_count}A</span>}
            {opp.flag_count === 0 && <span style={{ fontFamily: monoFont, fontSize: 11, color: '#7D9DBB' }}>0</span>}
          </div>
        </div>

        {/* Age */}
        <div style={{ fontFamily: monoFont, fontSize: 12, color: '#A0B8D8', textAlign: 'right' }}>
          {formatAge(age)} ago
        </div>

        {/* Routed? */}
        <div style={{ textAlign: 'center' }}>
          {opp.routed_at ? (
            <span style={{ fontFamily: monoFont, fontSize: 9, color: '#10B981', letterSpacing: '0.08em' }}>ROUTED</span>
          ) : (
            <span style={{ fontFamily: monoFont, fontSize: 9, color: '#F59E0B', letterSpacing: '0.08em' }}>PENDING</span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetail(opp); }}
            style={{
              fontFamily: bodyFont, fontWeight: 700, fontSize: 10, color: '#FFFFFF',
              background: '#0B60C5', border: 'none', padding: '5px 12px',
              borderRadius: 2, cursor: 'pointer',
            }}
          >
            OPEN BRIEF
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OPPORTUNITY DETAIL PANEL
// ══════════════════════════════════════════════════════════════════════════════

function OpportunityDetail({
  opp, contractors, routes, onClose, onRoute, onReleaseContact, onMarkDead, onRefresh,
}: {
  opp: Opportunity;
  contractors: Contractor[];
  routes: Route[];
  onClose: () => void;
  onRoute: (oppId: string, contractorId: string) => void;
  onReleaseContact: (oppId: string, routeId: string) => void;
  onMarkDead: (oppId: string) => void;
  onRefresh: () => void;
}) {
  const briefJson = opp.brief_json as Record<string, unknown> | null;

  // Suggested contractors: match county, project type, vetting status
  const suggested = contractors.filter(c => {
    if (c.status !== 'active' || !c.is_vetted) return false;
    const countyMatch = !opp.county || c.service_counties.length === 0 ||
      c.service_counties.some(sc => sc.toLowerCase() === opp.county?.toLowerCase());
    const projectMatch = !opp.project_type || c.project_types.length === 0 ||
      c.project_types.some(pt => pt.toLowerCase() === opp.project_type?.toLowerCase());
    const windowFit = (!c.min_window_count || (opp.window_count ?? 0) >= c.min_window_count) &&
      (!c.max_window_count || (opp.window_count ?? 999) <= c.max_window_count);
    const gradeOk = c.accepts_low_grade_leads || (opp.grade === 'A' || opp.grade === 'B');
    return countyMatch && projectMatch && windowFit && gradeOk;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 40, overflowY: 'auto' }}>
      <div style={{ background: '#0E1117', border: '1px solid #2E3A50', width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', padding: '28px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <GradeBadge grade={opp.grade} />
              <span style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 24, color: '#FFFFFF', textTransform: 'uppercase' }}>
                {opp.county || '—'} County Opportunity
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <StatusPill status={opp.status} />
              <span style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.08em' }}>
                PRIORITY: {opp.priority_score}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ fontFamily: monoFont, fontSize: 14, color: '#7D9DBB', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        {/* Brief — contractor-safe data only */}
        <div style={{ background: '#161C28', border: '1px solid #2E3A50', padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ fontFamily: monoFont, fontSize: 9, color: '#2563EB', letterSpacing: '0.12em', marginBottom: 12 }}>CONTRACTOR-SAFE BRIEF</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Grade', opp.grade || '—'],
              ['County', opp.county || '—'],
              ['Project', opp.project_type || '—'],
              ['Windows', opp.window_count?.toString() || '—'],
              ['Quote Range', opp.quote_range || '—'],
              ['Total Flags', opp.flag_count.toString()],
              ['Red Flags', opp.red_flag_count.toString()],
              ['Amber Flags', opp.amber_flag_count.toString()],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', width: 80, flexShrink: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontFamily: monoFont, fontSize: 11, color: '#C8DEFF' }}>{value}</span>
              </div>
            ))}
          </div>
          {/* Flag summary */}
          {briefJson?.flag_summary && Array.isArray(briefJson.flag_summary) && (
            <div style={{ marginTop: 16, borderTop: '1px solid #2E3A50', paddingTop: 12 }}>
              <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.1em', marginBottom: 8 }}>FLAG SUMMARY</div>
              {(briefJson.flag_summary as Array<{ title: string; severity: string }>).slice(0, 8).map((f, i) => (
                <div key={i} style={{ fontFamily: monoFont, fontSize: 10, color: f.severity === 'Critical' || f.severity === 'High' ? '#DC2626' : f.severity === 'Medium' ? '#F59E0B' : '#A0B8D8', marginBottom: 4 }}>
                  [{f.severity}] {f.title}
                </div>
              ))}
            </div>
          )}
          {/* Brief text */}
          {opp.brief_text && (
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => { navigator.clipboard.writeText(opp.brief_text || ''); }}
                style={{ fontFamily: monoFont, fontSize: 9, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                📋 COPY FULL BRIEF
              </button>
            </div>
          )}
        </div>

        {/* Internal-only section — PII warning */}
        <div style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.2)', padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontFamily: monoFont, fontSize: 9, color: '#DC2626', letterSpacing: '0.12em', marginBottom: 8 }}>
            ⚠ INTERNAL OPERATOR ONLY — NOT CONTRACTOR-SAFE
          </div>
          <div style={{ fontFamily: monoFont, fontSize: 10, color: '#7D9DBB' }}>
            Lead ID: {opp.lead_id.slice(0, 8)}… · Session: {opp.scan_session_id.slice(0, 8)}…
          </div>
          {opp.homeowner_contact_released_at && (
            <div style={{ fontFamily: monoFont, fontSize: 10, color: '#F59E0B', marginTop: 4 }}>
              Contact released: {new Date(opp.homeowner_contact_released_at).toLocaleString()}
            </div>
          )}
        </div>

        {/* Suggested Contractors */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.12em', marginBottom: 10 }}>
            SUGGESTED CONTRACTORS ({suggested.length})
          </div>
          {suggested.length === 0 ? (
            <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7D9DBB', padding: 12, background: '#111418', border: '1px solid #2E3A50' }}>
              No matching contractors found. Check contractor registry.
            </div>
          ) : (
            suggested.map(c => {
              const alreadyRouted = routes.some(r => r.contractor_id === c.id);
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#111418', border: '1px solid #2E3A50', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>
                      {c.company_name}
                      {c.is_vetted && <span style={{ fontFamily: monoFont, fontSize: 8, color: '#10B981', marginLeft: 8, letterSpacing: '0.08em' }}>✓ VETTED</span>}
                    </div>
                    <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.06em', marginTop: 2 }}>
                      {c.service_counties.join(', ') || '—'} · {c.project_types.join(', ') || 'all types'}
                    </div>
                  </div>
                  {alreadyRouted ? (
                    <span style={{ fontFamily: monoFont, fontSize: 9, color: '#10B981', letterSpacing: '0.08em' }}>ROUTED</span>
                  ) : (
                    <button
                      onClick={() => onRoute(opp.id, c.id)}
                      style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 10, color: '#FFFFFF', background: '#0B60C5', border: 'none', padding: '5px 12px', borderRadius: 2, cursor: 'pointer' }}
                    >
                      ROUTE BRIEF
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Existing routes */}
        {routes.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.12em', marginBottom: 10 }}>
              ROUTING HISTORY ({routes.length})
            </div>
            {routes.map(r => {
              const contractor = contractors.find(c => c.id === r.contractor_id);
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: '#111418', border: '1px solid #2E3A50', marginBottom: 4 }}>
                  <div>
                    <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#FFFFFF' }}>{contractor?.company_name || 'Unknown'}</span>
                    <span style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', marginLeft: 8 }}>{r.route_status.toUpperCase()}</span>
                  </div>
                  {!r.contact_released && (
                    <button
                      onClick={() => onReleaseContact(opp.id, r.id)}
                      style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 10, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '5px 12px', borderRadius: 2, cursor: 'pointer' }}
                    >
                      RELEASE CONTACT
                    </button>
                  )}
                  {r.contact_released && (
                    <span style={{ fontFamily: monoFont, fontSize: 9, color: '#10B981' }}>CONTACT RELEASED</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #2E3A50', paddingTop: 16 }}>
          {opp.status !== 'dead' && (
            <button onClick={() => onMarkDead(opp.id)}
              style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.08em', color: '#DC2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', padding: '7px 14px', borderRadius: 2, cursor: 'pointer' }}>
              MARK DEAD
            </button>
          )}
          <button onClick={onClose}
            style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.08em', color: '#7D9DBB', background: 'transparent', border: '1px solid #2E3A50', padding: '7px 14px', borderRadius: 2, cursor: 'pointer', marginLeft: 'auto' }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'calls' | 'contractor'>('calls');

  // ── Call Queue State ────
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'tier1'>('tier1');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DailyStats>({
    totalLeads: 0, tier1Leads: 0, verifiedLeads: 0, appointmentsToday: 0, projectedRevenue: 0,
  });

  // ── Contractor Queue State ────
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [oppRoutes, setOppRoutes] = useState<Route[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [oppFilter, setOppFilter] = useState<'all' | 'pending' | 'routed'>('all');
  const [oppLoading, setOppLoading] = useState(true);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Call Queue Fetch ────
  const fetchLeads = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data as Lead[]);
      const todayLeads = data as Lead[];
      setStats({
        totalLeads: todayLeads.length,
        tier1Leads: todayLeads.filter((l: any) => l.lead_tier === 1).length,
        verifiedLeads: todayLeads.filter((l: any) => l.phone_verified).length,
        appointmentsToday: todayLeads.filter((l: any) => l.status === 'appointment').length,
        projectedRevenue: Math.round(todayLeads.filter((l: any) => l.status === 'appointment').length * 4800 * 0.38),
      });
    }
    setLoading(false);
  }, []);

  // ── Contractor Queue Fetch ────
  const fetchOpportunities = useCallback(async () => {
    setOppLoading(true);
    const { data, error } = await supabase
      .from('contractor_opportunities')
      .select('*')
      .order('priority_score', { ascending: false });

    if (!error && data) {
      setOpportunities(data as Opportunity[]);
    }

    const { data: contractorData } = await supabase
      .from('contractors')
      .select('*')
      .eq('status', 'active');
    if (contractorData) setContractors(contractorData as Contractor[]);

    setOppLoading(false);
  }, []);

  const fetchRoutesForOpp = useCallback(async (oppId: string) => {
    const { data } = await supabase
      .from('contractor_opportunity_routes')
      .select('*')
      .eq('opportunity_id', oppId)
      .order('created_at', { ascending: false });
    if (data) setOppRoutes(data as Route[]);
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchOpportunities();

    channelRef.current = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => fetchLeads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contractor_opportunities' }, () => fetchOpportunities())
      .subscribe();

    return () => { channelRef.current?.unsubscribe(); };
  }, [fetchLeads, fetchOpportunities]);

  useEffect(() => {
    if (selectedOpp) fetchRoutesForOpp(selectedOpp.id);
  }, [selectedOpp, fetchRoutesForOpp]);

  // ── Call Queue Actions ────
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

  // ── Contractor Queue Actions ────
  const handleRoute = async (oppId: string, contractorId: string) => {
    const now = new Date().toISOString();
    await supabase.from('contractor_opportunity_routes').insert({
      opportunity_id: oppId,
      contractor_id: contractorId,
      route_status: 'sent',
      sent_at: now,
      assigned_by: 'operator',
      routing_reason: 'manual_assignment',
    });
    await supabase.from('contractor_opportunities').update({
      status: 'sent_to_contractor',
      routed_at: now,
    }).eq('id', oppId);

    await supabase.from('event_logs').insert({
      event_name: 'contractor_intro_routed',
      session_id: opportunities.find(o => o.id === oppId)?.scan_session_id || null,
      route: '/admin',
      metadata: { opportunity_id: oppId, contractor_id: contractorId, timestamp: now },
    });

    fetchOpportunities();
    if (selectedOpp?.id === oppId) fetchRoutesForOpp(oppId);
  };

  const handleReleaseContact = async (oppId: string, routeId: string) => {
    const now = new Date().toISOString();
    await supabase.from('contractor_opportunity_routes').update({
      contact_released: true,
      contact_released_at: now,
    }).eq('id', routeId);

    await supabase.from('contractor_opportunities').update({
      status: 'homeowner_contact_released',
      homeowner_contact_released_at: now,
    }).eq('id', oppId);

    await supabase.from('event_logs').insert({
      event_name: 'contractor_contact_released',
      session_id: opportunities.find(o => o.id === oppId)?.scan_session_id || null,
      route: '/admin',
      metadata: { opportunity_id: oppId, route_id: routeId, timestamp: now },
    });

    fetchOpportunities();
    fetchRoutesForOpp(oppId);
  };

  const handleMarkDead = async (oppId: string) => {
    await supabase.from('contractor_opportunities').update({ status: 'dead' }).eq('id', oppId);
    await supabase.from('event_logs').insert({
      event_name: 'contractor_opportunity_marked_dead',
      session_id: opportunities.find(o => o.id === oppId)?.scan_session_id || null,
      route: '/admin',
      metadata: { opportunity_id: oppId },
    });
    setSelectedOpp(null);
    fetchOpportunities();
  };

  // ── Filtering ────
  const filteredLeads = leads.filter(l => {
    const matchesFilter = filter === 'all' ? true : filter === 'new' ? l.status === 'new' : filter === 'tier1' ? (l as any).lead_tier === 1 : true;
    const matchesSearch = !search || l.first_name?.toLowerCase().includes(search.toLowerCase()) || (l as any).county_name?.toLowerCase().includes(search.toLowerCase()) || (l as any).phone?.includes(search);
    return matchesFilter && matchesSearch;
  });

  const filteredOpps = opportunities.filter(o => {
    if (oppFilter === 'pending') return !o.routed_at && o.status !== 'dead';
    if (oppFilter === 'routed') return !!o.routed_at;
    return true;
  });

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
          <div style={{ fontFamily: dispFont, fontWeight: 900, fontSize: 28, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            OPERATOR COMMAND CENTER
          </div>
          <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.12em', marginTop: 2 }}>
            WINDOWMAN · LEAD & CONTRACTOR OPS · REALTIME
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse-red 2s infinite' }} />
          <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB' }}>LIVE</div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20 }}>
        {([['calls', 'CALL QUEUE'], ['contractor', 'CONTRACTOR QUEUE']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              fontFamily: monoFont, fontSize: 10, letterSpacing: '0.1em',
              padding: '10px 20px', border: 'none', cursor: 'pointer',
              background: activeTab === key ? '#1D4ED8' : '#161C28',
              color: activeTab === key ? '#FFFFFF' : '#7D9DBB',
              borderBottom: activeTab === key ? '2px solid #3B82F6' : '2px solid transparent',
            }}>
            {label}
            {key === 'contractor' && opportunities.filter(o => !o.routed_at && o.status !== 'dead').length > 0 && (
              <span style={{ marginLeft: 8, background: '#DC2626', color: '#FFFFFF', padding: '1px 6px', borderRadius: 8, fontSize: 9 }}>
                {opportunities.filter(o => !o.routed_at && o.status !== 'dead').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ CALL QUEUE TAB ═══ */}
      {activeTab === 'calls' && (
        <>
          <StatsHeader stats={stats} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
            {(['tier1', 'new', 'all'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ fontFamily: monoFont, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 12px', border: 'none', borderRadius: 2, cursor: 'pointer', background: filter === f ? '#1D4ED8' : '#161C28', color: filter === f ? '#FFFFFF' : '#7D9DBB' }}>
                {f === 'tier1' ? 'TIER 1 ONLY' : f.toUpperCase()}
              </button>
            ))}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, county, phone..."
              style={{ fontFamily: bodyFont, fontSize: 12, color: '#FFFFFF', background: '#161C28', border: '1px solid #2E3A50', padding: '6px 12px', borderRadius: 0, outline: 'none', flex: 1, maxWidth: 280 }} />
          </div>
          {loading ? (
            <div style={{ fontFamily: monoFont, fontSize: 11, color: '#7D9DBB', padding: 20 }}>LOADING...</div>
          ) : filteredLeads.length === 0 ? (
            <div style={{ fontFamily: monoFont, fontSize: 11, color: '#7D9DBB', padding: 20 }}>NO LEADS MATCH FILTER</div>
          ) : (
            filteredLeads.map(lead => (
              <LeadRow key={lead.id} lead={lead} onStatusChange={handleStatusChange} onCallNow={handleCallNow} onSMS={handleSMS} />
            ))
          )}
        </>
      )}

      {/* ═══ CONTRACTOR QUEUE TAB ═══ */}
      {activeTab === 'contractor' && (
        <>
          {/* Queue stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#2E3A50', marginBottom: 20 }}>
            {[
              { label: 'TOTAL OPPORTUNITIES', value: opportunities.length, color: '#C8DEFF' },
              { label: 'PENDING ROUTING', value: opportunities.filter(o => !o.routed_at && o.status !== 'dead').length, color: '#F59E0B' },
              { label: 'ROUTED', value: opportunities.filter(o => !!o.routed_at).length, color: '#10B981' },
              { label: 'AVG PRIORITY', value: opportunities.length > 0 ? Math.round(opportunities.reduce((s, o) => s + o.priority_score, 0) / opportunities.length) : 0, color: '#3B82F6' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#111418', padding: '14px 16px' }}>
                <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.12em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['all', 'pending', 'routed'] as const).map(f => (
              <button key={f} onClick={() => setOppFilter(f)}
                style={{ fontFamily: monoFont, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 12px', border: 'none', borderRadius: 2, cursor: 'pointer', background: oppFilter === f ? '#1D4ED8' : '#161C28', color: oppFilter === f ? '#FFFFFF' : '#7D9DBB' }}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 80px 100px 120px', padding: '6px 14px', marginBottom: 4 }}>
            {['PRI', 'OPPORTUNITY', 'FLAGS', 'AGE', 'STATUS', ''].map(h => (
              <div key={h} style={{ fontFamily: monoFont, fontSize: 8, color: '#7D9DBB', letterSpacing: '0.12em' }}>{h}</div>
            ))}
          </div>

          {oppLoading ? (
            <div style={{ fontFamily: monoFont, fontSize: 11, color: '#7D9DBB', padding: 20 }}>LOADING QUEUE...</div>
          ) : filteredOpps.length === 0 ? (
            <div style={{ fontFamily: monoFont, fontSize: 11, color: '#7D9DBB', padding: 20 }}>
              NO OPPORTUNITIES IN QUEUE
            </div>
          ) : (
            filteredOpps.map(opp => (
              <OpportunityRow key={opp.id} opp={opp} onOpenDetail={(o) => setSelectedOpp(o)} />
            ))
          )}
        </>
      )}

      {/* Opportunity Detail Modal */}
      {selectedOpp && (
        <OpportunityDetail
          opp={selectedOpp}
          contractors={contractors}
          routes={oppRoutes}
          onClose={() => { setSelectedOpp(null); setOppRoutes([]); }}
          onRoute={handleRoute}
          onReleaseContact={handleReleaseContact}
          onMarkDead={handleMarkDead}
          onRefresh={fetchOpportunities}
        />
      )}
    </div>
  );
}
