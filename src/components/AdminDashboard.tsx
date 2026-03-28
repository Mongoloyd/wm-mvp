/**
 * AdminDashboard.tsx — WindowMan Operator Command Center
 *
 * Four tabs:
 *   1. CALL QUEUE — existing lead triage (preserved)
 *   2. CONTRACTOR QUEUE — routing console for contractor opportunities
 *   3. RELEASE REVIEW — interest/approval/release decisions
 *   4. REVENUE — billable intros, billing status, outcomes
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ROUTE_STATUS, RELEASE_STATUS, BILLING_STATUS, BILLING_MODEL, EVENTS, APPOINTMENT_STATUS, QUOTE_STATUS, DEAL_STATUS } from '@/lib/statusConstants';
import VoiceFollowupsPanel from './admin/VoiceFollowupsPanel';

// Helper to call admin-data edge function (uses service_role server-side)
async function adminFetch(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action, ...payload },
  });
  if (error) {
    console.error(`[AdminDashboard] admin-data ${action} failed`, error);
    return null;
  }
  return data;
}

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
  release_ready: boolean; last_interest_at: string | null;
  last_release_at: string | null;
  // Phase 3.4A fields
  suggested_contractor_id: string | null;
  suggested_match_generated_at: string | null;
  suggested_match_confidence: string | null;
  suggested_match_reasons: string[] | null;
  suggested_match_snapshot: Record<string, unknown> | null;
  suggested_match_top_candidates: unknown[] | null;
  suggested_match_overridden: boolean;
  suggested_match_overridden_at: string | null;
  suggested_match_override_reason: string | null;
  last_call_intent: string | null;
  last_call_requested_at: string | null;
  last_call_webhook_status: string | null;
  last_call_webhook_error: string | null;
  cta_source: string | null;
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
  interested_at: string | null; interest_notes: string | null;
  release_status: string; release_requested_at: string | null;
  release_reviewed_at: string | null; release_reviewed_by: string | null;
  release_denial_reason: string | null;
}

interface BillableIntro {
  id: string; created_at: string; updated_at: string;
  opportunity_id: string; route_id: string; contractor_id: string;
  lead_id: string; analysis_id: string | null;
  release_approved_at: string | null; contact_released_at: string | null;
  billing_status: string; billing_model: string | null;
  fee_amount: number | null; currency: string;
  invoice_reference: string | null;
  paid_at: string | null; waived_at: string | null;
  refunded_at: string | null; disputed_at: string | null;
  released_by: string | null; notes: string | null;
}

interface ContractorOutcome {
  id: string; created_at: string; updated_at: string;
  billable_intro_id: string; opportunity_id: string;
  route_id: string | null; contractor_id: string | null;
  appointment_status: string | null; appointment_booked_at: string | null;
  quote_status: string | null; replacement_quote_range: string | null;
  did_beat_price: boolean | null; did_improve_warranty: boolean | null;
  did_fix_scope_gaps: boolean | null;
  deal_status: string | null; deal_value: number | null;
  closed_at: string | null; outcome_notes: string | null;
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
  if (status !== 'new') return { color: '#A0B8D8' };
  if (seconds < 300) return { color: '#10B981', fontWeight: 700 };
  if (seconds < 900) return { color: '#F59E0B', fontWeight: 700 };
  if (seconds < 3600) return { color: '#F97316', fontWeight: 700 };
  return { color: '#A0B8D8' };
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
  return { label: '—', bg: 'transparent', color: '#A0B8D8' };
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
    // Release statuses
    none: { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
    pending_review: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
    approved: { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
    denied: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
    released: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
    // Billing statuses
    pending: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
    billable: { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
    invoiced: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
    paid: { bg: 'rgba(16,185,129,0.25)', color: '#10B981' },
    waived: { bg: 'rgba(107,114,128,0.15)', color: '#6B7280' },
    refunded: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444' },
    disputed: { bg: 'rgba(220,38,38,0.15)', color: '#DC2626' },
    void: { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
    // Route statuses
    interested: { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
    sent: { bg: 'rgba(6,182,212,0.15)', color: '#06B6D4' },
    suggested: { bg: 'rgba(107,114,128,0.12)', color: '#A0B8D8' },
  };
  const style = colorMap[status] || { bg: 'rgba(107,114,128,0.15)', color: '#6B7280' };
  return (
    <span style={{
      fontFamily: monoFont, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '3px 8px', background: style.bg, color: style.color, borderRadius: 2,
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span style={{ color: '#A0B8D8' }}>—</span>;
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
        <div style={{ fontFamily: monoFont, fontSize: 12, color: '#A0B8D8', userSelect: 'none' }}>{expanded ? '▼' : '▶'}</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{lead.first_name}</span>
            <span style={{ fontFamily: monoFont, fontSize: 11, padding: '2px 6px', borderRadius: 2, background: flowBadge.bg, color: flowBadge.color, letterSpacing: '0.08em' }}>{flowBadge.label}</span>
            {lead.grade && <span style={{ fontFamily: dispFont, fontSize: 16, fontWeight: 900, color: lead.grade === 'F' || lead.grade === 'D' ? '#DC2626' : lead.grade === 'C' ? '#F59E0B' : '#10B981' }}>{lead.grade}</span>}
          </div>
          <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.08em' }}>{lead.county_name || '—'} · {lead.quote_range || 'no range'} · {lead.window_count || '—'}</div>
        </div>
        <div style={{ fontFamily: monoFont, fontSize: 11, color: '#C8DEFF' }}>{lead.phone_verified ? '✓' : '○'} {lead.phone.slice(-4).padStart(lead.phone.length, '•')}</div>
        <div style={{ fontFamily: monoFont, fontSize: 12, ...ageStyle, textAlign: 'right' }}>{formatAge(seconds)} ago</div>
        <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 15, color: lead.dollar_delta ? '#DC2626' : '#A0B8D8', textTransform: 'uppercase', textAlign: 'right' }}>{lead.dollar_delta ? `+$${lead.dollar_delta.toLocaleString()}` : '—'}</div>
        <select value={lead.status} onChange={(e) => { e.stopPropagation(); onStatusChange(lead.id, e.target.value as Lead['status']); }} onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: monoFont, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#161C28', border: '1px solid #2E3A50', color: '#C8DEFF', padding: '4px 6px', cursor: 'pointer', borderRadius: 0 }}>
          {['new', 'called', 'appointment', 'closed', 'dead'].map(s => (<option key={s} value={s}>{s.toUpperCase()}</option>))}
        </select>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
          {isTier1New ? (
            <button onClick={(e) => { e.stopPropagation(); onCallNow(lead); }}
              style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 11, color: '#FFFFFF', background: '#DC2626', border: 'none', padding: '6px 12px', borderRadius: 2, cursor: 'pointer', whiteSpace: 'nowrap', animation: 'pulse-red 1.5s ease-in-out infinite' }}>CALL NOW</button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onCallNow(lead); }}
              style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12, color: '#FFFFFF', background: '#0B60C5', border: 'none', padding: '5px 10px', borderRadius: 2, cursor: 'pointer' }}>CALL</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onSMS(lead); }}
            style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 12, color: '#C8DEFF', background: 'transparent', border: '1px solid #2E3A50', padding: '5px 8px', borderRadius: 2, cursor: 'pointer' }}>SMS</button>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid #1C1C1C', padding: '14px 14px 14px 38px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.1em', marginBottom: 8 }}>OPENING SCRIPT</div>
            <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#C8DEFF', lineHeight: 1.65, background: '#0A0A0A', padding: 12, borderLeft: '2px solid #1D4ED8', marginBottom: 10 }}>"{script}"</div>
            <button onClick={copyScript} style={{ fontFamily: monoFont, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: copyFeedback ? '#10B981' : '#1D4ED8', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>{copyFeedback || '⊕ COPY SCRIPT'}</button>
          </div>
          <div>
            <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.1em', marginBottom: 8 }}>INTELLIGENCE PAYLOAD</div>
            {[
              ['Phone', lead.phone, lead.phone_verified ? '#10B981' : '#F59E0B'],
              ['Email', lead.email, '#C8DEFF'],
              ['Project', lead.project_type || '—', '#C8DEFF'],
              ['Process', lead.process_stage || '—', '#C8DEFF'],
              ['Campaign', lead.utm_campaign || 'direct', '#A0B8D8'],
              ['Top Flag', lead.top_flag_title || 'none found', lead.top_flag_title ? '#F97316' : '#A0B8D8'],
            ].map(([label, value, color]) => (
              <div key={label as string} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', width: 60, flexShrink: 0, letterSpacing: '0.08em', textTransform: 'uppercase', paddingTop: 1 }}>{label as string}</div>
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
          <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.12em', marginBottom: 6 }}>{label}</div>
          <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTRACTOR QUEUE — OPPORTUNITY ROW
// ══════════════════════════════════════════════════════════════════════════════

function OpportunityRow({ opp, onOpenDetail }: { opp: Opportunity; onOpenDetail: (opp: Opportunity) => void; }) {
  const age = secondsSince(opp.intro_requested_at);
  return (
    <div style={{ background: '#111418', border: '1px solid #2E3A50', borderLeft: `3px solid ${opp.priority_score >= 60 ? '#DC2626' : opp.priority_score >= 35 ? '#F59E0B' : '#2E3A50'}`, marginBottom: 6, cursor: 'pointer' }} onClick={() => onOpenDetail(opp)}>
      <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 80px 100px 120px', gap: 0, alignItems: 'center', padding: '12px 14px' }}>
        <div style={{ fontFamily: dispFont, fontWeight: 900, fontSize: 22, color: opp.priority_score >= 60 ? '#DC2626' : opp.priority_score >= 35 ? '#F59E0B' : '#A0B8D8' }}>{opp.priority_score}</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
            <GradeBadge grade={opp.grade} />
            <span style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{opp.county || '—'} County</span>
            <StatusPill status={opp.status} />
          </div>
          <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.08em' }}>{opp.project_type || '—'} · {opp.window_count ?? '—'} windows · {opp.quote_range || '—'}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.08em', marginBottom: 2 }}>FLAGS</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {opp.red_flag_count > 0 && <span style={{ fontFamily: monoFont, fontSize: 11, color: '#DC2626', fontWeight: 700 }}>{opp.red_flag_count}R</span>}
            {opp.amber_flag_count > 0 && <span style={{ fontFamily: monoFont, fontSize: 11, color: '#F59E0B', fontWeight: 700 }}>{opp.amber_flag_count}A</span>}
            {opp.flag_count === 0 && <span style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8' }}>0</span>}
          </div>
        </div>
        <div style={{ fontFamily: monoFont, fontSize: 12, color: '#C8DEFF', textAlign: 'right' }}>{formatAge(age)} ago</div>
        <div style={{ textAlign: 'center' }}>
          {opp.routed_at ? <span style={{ fontFamily: monoFont, fontSize: 11, color: '#10B981', letterSpacing: '0.08em' }}>ROUTED</span> : <span style={{ fontFamily: monoFont, fontSize: 11, color: '#F59E0B', letterSpacing: '0.08em' }}>PENDING</span>}
        </div>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
          <button onClick={(e) => { e.stopPropagation(); onOpenDetail(opp); }} style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12, color: '#FFFFFF', background: '#0B60C5', border: 'none', padding: '5px 12px', borderRadius: 2, cursor: 'pointer' }}>OPEN BRIEF</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OPPORTUNITY DETAIL PANEL (with Phase 3.4 interest/release actions)
// ══════════════════════════════════════════════════════════════════════════════

function OpportunityDetail({
  opp, contractors, routes, onClose, onRoute, onMarkInterested, onReviewRelease, onReleaseContact, onMarkDead, onRefresh,
}: {
  opp: Opportunity; contractors: Contractor[]; routes: Route[];
  onClose: () => void;
  onRoute: (oppId: string, contractorId: string) => void;
  onMarkInterested: (routeId: string, oppId: string, contractorId: string) => void;
  onReviewRelease: (routeId: string, decision: 'approve' | 'deny', reason?: string) => void;
  onReleaseContact: (routeId: string, oppId: string, contractorId: string, leadId: string, analysisId: string) => void;
  onMarkDead: (oppId: string) => void;
  onRefresh: () => void;
}) {
  const [releaseModel, setReleaseModel] = useState('flat_fee');
  const [releaseFee, setReleaseFee] = useState('');
  const [denyReason, setDenyReason] = useState('');
  const briefJson = opp.brief_json as Record<string, unknown> | null;

  const suggested = contractors.filter(c => {
    if (c.status !== 'active' || !c.is_vetted) return false;
    const countyMatch = !opp.county || c.service_counties.length === 0 || c.service_counties.some(sc => sc.toLowerCase() === opp.county?.toLowerCase());
    const projectMatch = !opp.project_type || c.project_types.length === 0 || c.project_types.some(pt => pt.toLowerCase() === opp.project_type?.toLowerCase());
    const windowFit = (!c.min_window_count || (opp.window_count ?? 0) >= c.min_window_count) && (!c.max_window_count || (opp.window_count ?? 999) <= c.max_window_count);
    const gradeOk = c.accepts_low_grade_leads || (opp.grade === 'A' || opp.grade === 'B');
    return countyMatch && projectMatch && windowFit && gradeOk;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 40, overflowY: 'auto' }}>
      <div style={{ background: '#0E1117', border: '1px solid #2E3A50', width: '100%', maxWidth: 850, maxHeight: '90vh', overflowY: 'auto', padding: '28px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <GradeBadge grade={opp.grade} />
              <span style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 24, color: '#FFFFFF', textTransform: 'uppercase' }}>{opp.county || '—'} County Opportunity</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <StatusPill status={opp.status} />
              <span style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.08em' }}>PRIORITY: {opp.priority_score}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ fontFamily: monoFont, fontSize: 14, color: '#A0B8D8', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        {/* Brief — contractor-safe data only */}
        <div style={{ background: '#161C28', border: '1px solid #2E3A50', padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ fontFamily: monoFont, fontSize: 11, color: '#2563EB', letterSpacing: '0.12em', marginBottom: 12 }}>CONTRACTOR-SAFE BRIEF</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Grade', opp.grade || '—'], ['County', opp.county || '—'],
              ['Project', opp.project_type || '—'], ['Windows', opp.window_count?.toString() || '—'],
              ['Quote Range', opp.quote_range || '—'], ['Total Flags', opp.flag_count.toString()],
              ['Red Flags', opp.red_flag_count.toString()], ['Amber Flags', opp.amber_flag_count.toString()],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', width: 80, flexShrink: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontFamily: monoFont, fontSize: 11, color: '#C8DEFF' }}>{value}</span>
              </div>
            ))}
          </div>
          {briefJson?.flag_summary && Array.isArray(briefJson.flag_summary) && (
            <div style={{ marginTop: 16, borderTop: '1px solid #2E3A50', paddingTop: 12 }}>
              <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.1em', marginBottom: 8 }}>FLAG SUMMARY</div>
              {(briefJson.flag_summary as Array<{ title: string; severity: string }>).slice(0, 8).map((f, i) => (
                <div key={i} style={{ fontFamily: monoFont, fontSize: 12, color: f.severity === 'Critical' || f.severity === 'High' ? '#DC2626' : f.severity === 'Medium' ? '#F59E0B' : '#C8DEFF', marginBottom: 4 }}>
                  [{f.severity}] {f.title}
                </div>
              ))}
            </div>
          )}
          {opp.brief_text && (
            <div style={{ marginTop: 12 }}>
              <button onClick={() => navigator.clipboard.writeText(opp.brief_text || '')} style={{ fontFamily: monoFont, fontSize: 11, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>📋 COPY FULL BRIEF</button>
            </div>
          )}
        </div>

        {/* Internal-only section — PII warning */}
        <div style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.2)', padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontFamily: monoFont, fontSize: 11, color: '#DC2626', letterSpacing: '0.12em', marginBottom: 8 }}>⚠ INTERNAL OPERATOR ONLY — NOT CONTRACTOR-SAFE</div>
          <div style={{ fontFamily: monoFont, fontSize: 12, color: '#A0B8D8' }}>Lead ID: {opp.lead_id.slice(0, 8)}… · Session: {opp.scan_session_id.slice(0, 8)}…</div>
          {opp.homeowner_contact_released_at && (
            <div style={{ fontFamily: monoFont, fontSize: 12, color: '#F59E0B', marginTop: 4 }}>Contact released: {new Date(opp.homeowner_contact_released_at).toLocaleString()}</div>
          )}
          {opp.cta_source && <div style={{ fontFamily: monoFont, fontSize: 12, color: '#C8DEFF', marginTop: 4 }}>CTA Source: {opp.cta_source}</div>}
          {opp.last_call_intent && <div style={{ fontFamily: monoFont, fontSize: 12, color: '#C8DEFF', marginTop: 4 }}>Call Intent: {opp.last_call_intent} · Webhook: <span style={{ color: opp.last_call_webhook_status === 'sent' ? '#10B981' : opp.last_call_webhook_status === 'failed' ? '#EF4444' : '#F59E0B' }}>{opp.last_call_webhook_status || '—'}</span></div>}
        </div>

        {/* Suggested Match (Phase 3.4A) */}
        {opp.suggested_match_generated_at && (
          <div style={{ background: 'rgba(200,149,42,0.04)', border: '1px solid rgba(200,149,42,0.2)', padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ fontFamily: monoFont, fontSize: 11, color: '#C8952A', letterSpacing: '0.12em', marginBottom: 8 }}>SUGGESTED MATCH</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Contractor', opp.suggested_contractor_id ? (contractors.find(c => c.id === opp.suggested_contractor_id)?.company_name || opp.suggested_contractor_id.slice(0, 8) + '…') : '—'],
                ['Confidence', opp.suggested_match_confidence?.toUpperCase() || '—'],
                ['Generated', opp.suggested_match_generated_at ? new Date(opp.suggested_match_generated_at).toLocaleString() : '—'],
                ['Overridden', opp.suggested_match_overridden ? '✗ YES' : 'No'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', width: 80, flexShrink: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
                  <span style={{ fontFamily: monoFont, fontSize: 11, color: '#C8DEFF' }}>{value}</span>
                </div>
              ))}
            </div>
            {opp.suggested_match_reasons && Array.isArray(opp.suggested_match_reasons) && (
              <div style={{ marginTop: 8, fontFamily: monoFont, fontSize: 12, color: '#C8DEFF' }}>
                Reasons: {(opp.suggested_match_reasons as string[]).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Suggested Contractors */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.12em', marginBottom: 10 }}>SUGGESTED CONTRACTORS ({suggested.length})</div>
          {suggested.length === 0 ? (
            <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#A0B8D8', padding: 12, background: '#111418', border: '1px solid #2E3A50' }}>No matching contractors found.</div>
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
                    <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.06em', marginTop: 2 }}>{c.service_counties.join(', ') || '—'} · {c.project_types.join(', ') || 'all types'}</div>
                  </div>
                  {alreadyRouted ? <span style={{ fontFamily: monoFont, fontSize: 11, color: '#10B981', letterSpacing: '0.08em' }}>ROUTED</span> : (
                    <button onClick={() => onRoute(opp.id, c.id)} style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12, color: '#FFFFFF', background: '#0B60C5', border: 'none', padding: '5px 12px', borderRadius: 2, cursor: 'pointer' }}>ROUTE BRIEF</button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Routing History with Phase 3.4 actions */}
        {routes.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.12em', marginBottom: 10 }}>ROUTING HISTORY ({routes.length})</div>
            {routes.map(r => {
              const contractor = contractors.find(c => c.id === r.contractor_id);
              return (
                <div key={r.id} style={{ padding: '12px 14px', background: '#111418', border: '1px solid #2E3A50', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#FFFFFF' }}>{contractor?.company_name || 'Unknown'}</span>
                      <StatusPill status={r.route_status} />
                      <StatusPill status={r.release_status} />
                    </div>
                  </div>
                  {/* Action buttons based on lifecycle state */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {/* Mark Interested */}
                    {r.route_status === 'sent' && (
                      <button onClick={() => onMarkInterested(r.id, opp.id, r.contractor_id)}
                        style={{ fontFamily: monoFont, fontSize: 11, color: '#10B981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.06em' }}>
                        MARK INTERESTED
                      </button>
                    )}
                    {/* Approve / Deny release */}
                    {r.release_status === 'pending_review' && (
                      <>
                        <button onClick={() => onReviewRelease(r.id, 'approve')}
                          style={{ fontFamily: monoFont, fontSize: 11, color: '#10B981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.06em' }}>
                          APPROVE RELEASE
                        </button>
                        <button onClick={() => { const reason = denyReason || undefined; onReviewRelease(r.id, 'deny', reason); }}
                          style={{ fontFamily: monoFont, fontSize: 11, color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.06em' }}>
                          DENY
                        </button>
                        <input value={denyReason} onChange={e => setDenyReason(e.target.value)} placeholder="denial reason..."
                          style={{ fontFamily: monoFont, fontSize: 11, color: '#C8DEFF', background: '#161C28', border: '1px solid #2E3A50', padding: '3px 8px', borderRadius: 0, width: 160 }} />
                      </>
                    )}
                    {/* Release Contact — explicit, requires approval first */}
                    {r.release_status === 'approved' && !r.contact_released && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.04)', padding: '6px 10px' }}>
                        <select value={releaseModel} onChange={e => setReleaseModel(e.target.value)}
                          style={{ fontFamily: monoFont, fontSize: 11, background: '#161C28', border: '1px solid #2E3A50', color: '#C8DEFF', padding: '3px 6px', borderRadius: 0 }}>
                          {Object.entries(BILLING_MODEL).map(([k, v]) => <option key={v} value={v}>{k}</option>)}
                        </select>
                        <input value={releaseFee} onChange={e => setReleaseFee(e.target.value)} placeholder="fee $" type="number"
                          style={{ fontFamily: monoFont, fontSize: 11, color: '#C8DEFF', background: '#161C28', border: '1px solid #2E3A50', padding: '3px 6px', width: 70, borderRadius: 0 }} />
                        <button onClick={() => onReleaseContact(r.id, opp.id, r.contractor_id, opp.lead_id, opp.analysis_id)}
                          style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', padding: '5px 12px', borderRadius: 2, cursor: 'pointer' }}>
                          ⚠ RELEASE HOMEOWNER CONTACT
                        </button>
                      </div>
                    )}
                    {r.contact_released && <span style={{ fontFamily: monoFont, fontSize: 11, color: '#10B981' }}>✓ CONTACT RELEASED {r.contact_released_at ? new Date(r.contact_released_at).toLocaleDateString() : ''}</span>}
                    {r.release_status === 'denied' && <span style={{ fontFamily: monoFont, fontSize: 11, color: '#EF4444' }}>✗ DENIED {r.release_denial_reason ? `(${r.release_denial_reason})` : ''}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #2E3A50', paddingTop: 16 }}>
          {opp.status !== 'dead' && (
            <button onClick={() => onMarkDead(opp.id)}
              style={{ fontFamily: monoFont, fontSize: 12, letterSpacing: '0.08em', color: '#DC2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', padding: '7px 14px', borderRadius: 2, cursor: 'pointer' }}>
              MARK DEAD
            </button>
          )}
          <button onClick={onClose}
            style={{ fontFamily: monoFont, fontSize: 12, letterSpacing: '0.08em', color: '#A0B8D8', background: 'transparent', border: '1px solid #2E3A50', padding: '7px 14px', borderRadius: 2, cursor: 'pointer', marginLeft: 'auto' }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BILLABLE INTRO ROW
// ══════════════════════════════════════════════════════════════════════════════

function BillableIntroRow({
  intro, contractors, outcomes, onStatusChange, onOpenOutcome,
}: {
  intro: BillableIntro;
  contractors: Contractor[];
  outcomes: ContractorOutcome[];
  onStatusChange: (id: string, status: string) => void;
  onOpenOutcome: (intro: BillableIntro) => void;
}) {
  const contractor = contractors.find(c => c.id === intro.contractor_id);
  const outcome = outcomes.find(o => o.billable_intro_id === intro.id);
  const age = secondsSince(intro.created_at);

  return (
    <div style={{ background: '#111418', border: '1px solid #2E3A50', borderLeft: `3px solid ${intro.billing_status === 'paid' ? '#10B981' : intro.billing_status === 'billable' ? '#F59E0B' : '#2E3A50'}`, marginBottom: 6, padding: '12px 14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 140px', gap: 8, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{contractor?.company_name || 'Unknown Contractor'}</div>
          <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', marginTop: 2 }}>
            {intro.billing_model?.replace(/_/g, ' ').toUpperCase() || '—'} · {formatAge(age)} ago
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          {intro.fee_amount != null ? (
            <span style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 18, color: '#F59E0B' }}>${intro.fee_amount}</span>
          ) : (
            <span style={{ fontFamily: monoFont, fontSize: 12, color: '#A0B8D8' }}>—</span>
          )}
        </div>
        <div><StatusPill status={intro.billing_status} /></div>
        <div>
          {outcome && (
            <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8' }}>
              {outcome.deal_status?.toUpperCase() || 'OPEN'} · {outcome.appointment_status?.toUpperCase() || 'PENDING'}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <select value={intro.billing_status} onChange={e => onStatusChange(intro.id, e.target.value)}
            style={{ fontFamily: monoFont, fontSize: 11, background: '#161C28', border: '1px solid #2E3A50', color: '#C8DEFF', padding: '3px 6px', borderRadius: 0 }}>
            {Object.values(BILLING_STATUS).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
          <button onClick={() => onOpenOutcome(intro)}
            style={{ fontFamily: monoFont, fontSize: 11, color: '#2563EB', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.3)', padding: '4px 8px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.06em' }}>
            OUTCOME
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OUTCOME EDITOR MODAL
// ══════════════════════════════════════════════════════════════════════════════

function OutcomeEditor({
  intro, outcome, contractors, onSave, onClose,
}: {
  intro: BillableIntro;
  outcome: ContractorOutcome | null;
  contractors: Contractor[];
  onSave: (data: Partial<ContractorOutcome>) => void;
  onClose: () => void;
}) {
  const contractor = contractors.find(c => c.id === intro.contractor_id);
  const [apptStatus, setApptStatus] = useState(outcome?.appointment_status || 'pending');
  const [apptDate, setApptDate] = useState(outcome?.appointment_booked_at?.split('T')[0] || '');
  const [quoteStatus, setQuoteStatus] = useState(outcome?.quote_status || 'pending');
  const [replRange, setReplRange] = useState(outcome?.replacement_quote_range || '');
  const [beatPrice, setBeatPrice] = useState(outcome?.did_beat_price || false);
  const [improvedWarranty, setImprovedWarranty] = useState(outcome?.did_improve_warranty || false);
  const [fixedGaps, setFixedGaps] = useState(outcome?.did_fix_scope_gaps || false);
  const [dealStatus, setDealStatus] = useState(outcome?.deal_status || 'open');
  const [dealValue, setDealValue] = useState(outcome?.deal_value?.toString() || '');
  const [notes, setNotes] = useState(outcome?.outcome_notes || '');

  const handleSave = () => {
    onSave({
      appointment_status: apptStatus,
      appointment_booked_at: apptDate ? new Date(apptDate).toISOString() : undefined,
      quote_status: quoteStatus,
      replacement_quote_range: replRange || undefined,
      did_beat_price: beatPrice,
      did_improve_warranty: improvedWarranty,
      did_fix_scope_gaps: fixedGaps,
      deal_status: dealStatus,
      deal_value: dealValue ? parseFloat(dealValue) : undefined,
      outcome_notes: notes || undefined,
    } as Partial<ContractorOutcome>);
  };

  const fieldRow = (label: string, children: React.ReactNode) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
      <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', width: 110, flexShrink: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  );

  const selectStyle: React.CSSProperties = { fontFamily: monoFont, fontSize: 12, background: '#161C28', border: '1px solid #2E3A50', color: '#C8DEFF', padding: '4px 8px', borderRadius: 0 };
  const inputStyle: React.CSSProperties = { fontFamily: monoFont, fontSize: 12, background: '#161C28', border: '1px solid #2E3A50', color: '#C8DEFF', padding: '4px 8px', borderRadius: 0, width: 160 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#0E1117', border: '1px solid #2E3A50', width: '100%', maxWidth: 520, padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 20, color: '#FFFFFF', textTransform: 'uppercase' }}>OUTCOME TRACKING</div>
            <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', marginTop: 4 }}>
              Contractor: {contractor?.company_name || '—'} · Intro: {intro.id.slice(0, 8)}…
            </div>
          </div>
          <button onClick={onClose} style={{ fontFamily: monoFont, fontSize: 14, color: '#A0B8D8', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        {fieldRow('APPOINTMENT', (
          <select value={apptStatus} onChange={e => setApptStatus(e.target.value)} style={selectStyle}>
            {Object.values(APPOINTMENT_STATUS).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
        ))}
        {fieldRow('BOOKED DATE', <input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} style={inputStyle} />)}
        {fieldRow('QUOTE STATUS', (
          <select value={quoteStatus} onChange={e => setQuoteStatus(e.target.value)} style={selectStyle}>
            {Object.values(QUOTE_STATUS).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
        ))}
        {fieldRow('REPL. RANGE', <input value={replRange} onChange={e => setReplRange(e.target.value)} placeholder="e.g. $8,000-$12,000" style={inputStyle} />)}
        {fieldRow('BEAT PRICE', <input type="checkbox" checked={beatPrice} onChange={e => setBeatPrice(e.target.checked)} />)}
        {fieldRow('BETTER WARRANTY', <input type="checkbox" checked={improvedWarranty} onChange={e => setImprovedWarranty(e.target.checked)} />)}
        {fieldRow('FIXED GAPS', <input type="checkbox" checked={fixedGaps} onChange={e => setFixedGaps(e.target.checked)} />)}
        {fieldRow('DEAL STATUS', (
          <select value={dealStatus} onChange={e => setDealStatus(e.target.value)} style={selectStyle}>
            {Object.values(DEAL_STATUS).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
        ))}
        {fieldRow('DEAL VALUE', <input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} placeholder="$" style={inputStyle} />)}
        {fieldRow('NOTES', <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />)}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, borderTop: '1px solid #2E3A50', paddingTop: 16 }}>
          <button onClick={onClose} style={{ fontFamily: monoFont, fontSize: 12, color: '#A0B8D8', background: 'transparent', border: '1px solid #2E3A50', padding: '7px 14px', borderRadius: 2, cursor: 'pointer' }}>CANCEL</button>
          <button onClick={handleSave} style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 11, color: '#FFFFFF', background: '#0B60C5', border: 'none', padding: '7px 18px', borderRadius: 2, cursor: 'pointer' }}>SAVE OUTCOME</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

function AdminPasswordGate({ children }: { children: React.ReactNode }) {
  const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;
  const [authed, setAuthed] = useState(() => {
    if (!ADMIN_SECRET) return true;
    return sessionStorage.getItem("wm_admin_authed") === "1";
  });
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  if (authed) return <>{children}</>;

  const tryAuth = () => {
    if (pwInput === ADMIN_SECRET) {
      sessionStorage.setItem("wm_admin_authed", "1");
      setAuthed(true);
    } else {
      setPwError(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#111418", border: "1px solid #2E3A50", padding: "40px 32px", maxWidth: 360, width: "100%" }}>
        <div style={{ fontFamily: dispFont, fontSize: 22, fontWeight: 900, color: "#C8DEFF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>OPERATOR ACCESS</div>
        <div style={{ fontFamily: monoFont, fontSize: 12, color: "#A0B8D8", letterSpacing: "0.1em", marginBottom: 24 }}>WINDOWMAN COMMAND CENTER</div>
        <input type="password" value={pwInput} onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") tryAuth(); }}
          placeholder="Enter access code"
          style={{ width: "100%", fontFamily: monoFont, fontSize: 13, background: "#0A0E14", border: `1px solid ${pwError ? "#DC2626" : "#2E3A50"}`, color: "#C8DEFF", padding: "12px 14px", marginBottom: 12, outline: "none", boxSizing: "border-box" }}
          autoFocus
        />
        {pwError && <div style={{ fontFamily: monoFont, fontSize: 12, color: "#DC2626", marginBottom: 12 }}>ACCESS DENIED</div>}
        <button onClick={tryAuth}
          style={{ width: "100%", fontFamily: bodyFont, fontWeight: 700, fontSize: 13, color: "#FFFFFF", background: "#0B60C5", border: "none", padding: "10px 0", cursor: "pointer" }}>
          AUTHENTICATE
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'calls' | 'contractor' | 'release' | 'revenue'>('calls');

  // ── Call Queue State ────
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'tier1'>('tier1');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DailyStats>({ totalLeads: 0, tier1Leads: 0, verifiedLeads: 0, appointmentsToday: 0, projectedRevenue: 0 });

  // ── Contractor Queue State ────
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [oppRoutes, setOppRoutes] = useState<Route[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [oppFilter, setOppFilter] = useState<'all' | 'pending' | 'routed'>('all');
  const [oppLoading, setOppLoading] = useState(true);

  // ── Release Review State ────
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [releaseLoading, setReleaseLoading] = useState(true);

  // ── Revenue State ────
  const [billableIntros, setBillableIntros] = useState<BillableIntro[]>([]);
  const [outcomes, setOutcomes] = useState<ContractorOutcome[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [outcomeEditorIntro, setOutcomeEditorIntro] = useState<BillableIntro | null>(null);
  const [revDateFrom, setRevDateFrom] = useState('');
  const [revDateTo, setRevDateTo] = useState('');

  // ── Release model state (for the detail modal) ────
  const [releaseModel, setReleaseModel] = useState('flat_fee');
  const [releaseFee, setReleaseFee] = useState('');

  // ── Voice AI State ────
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Fetch functions ────
  const fetchLeads = useCallback(async () => {
    const result = await adminFetch('fetch_leads');
    if (result?.data) {
      const data = result.data;
      setLeads(data as unknown as Lead[]);
      const todayLeads = data as unknown as Lead[];
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

  const fetchOpportunities = useCallback(async () => {
    setOppLoading(true);
    const oppResult = await adminFetch('fetch_opportunities');
    if (oppResult?.data) setOpportunities(oppResult.data as Opportunity[]);
    const cResult = await adminFetch('fetch_contractors');
    if (cResult?.data) setContractors(cResult.data as Contractor[]);
    setOppLoading(false);
  }, []);

  const fetchRoutesForOpp = useCallback(async (oppId: string) => {
    const result = await adminFetch('fetch_routes', { opportunity_id: oppId });
    if (result?.data) setOppRoutes(result.data as Route[]);
  }, []);

  const fetchAllRoutes = useCallback(async () => {
    setReleaseLoading(true);
    const result = await adminFetch('fetch_routes');
    if (result?.data) setAllRoutes(result.data as Route[]);
    setReleaseLoading(false);
  }, []);

  const fetchBillableIntros = useCallback(async () => {
    setRevenueLoading(true);
    const result = await adminFetch('fetch_billable');
    if (result?.intros) setBillableIntros(result.intros as BillableIntro[]);
    if (result?.outcomes) setOutcomes(result.outcomes as ContractorOutcome[]);
    setRevenueLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchOpportunities();
    fetchAllRoutes();
    fetchBillableIntros();
    channelRef.current = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => fetchLeads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contractor_opportunities' }, () => fetchOpportunities())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contractor_opportunity_routes' }, () => { fetchAllRoutes(); if (selectedOpp) fetchRoutesForOpp(selectedOpp.id); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billable_intros' }, () => fetchBillableIntros())
      .subscribe();
    return () => { channelRef.current?.unsubscribe(); };
  }, [fetchLeads, fetchOpportunities, fetchAllRoutes, fetchBillableIntros]);

  useEffect(() => { if (selectedOpp) fetchRoutesForOpp(selectedOpp.id); }, [selectedOpp, fetchRoutesForOpp]);

  // ── Call Queue Actions ────
  const handleStatusChange = async (id: string, status: Lead['status']) => {
    await adminFetch('update_lead_status', { lead_id: id, status });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };
  const handleCallNow = (lead: Lead) => { window.open(`tel:${lead.phone}`, '_self'); handleStatusChange(lead.id, 'called'); };
  const handleSMS = (lead: Lead) => { window.open(`sms:${lead.phone}?body=${encodeURIComponent(buildSMSScript(lead))}`, '_self'); };

  // ── Contractor Queue Actions ────
  const handleRoute = async (oppId: string, contractorId: string) => {
    const scanSessionId = opportunities.find(o => o.id === oppId)?.scan_session_id || null;
    await adminFetch('route_opportunity', { opportunity_id: oppId, contractor_id: contractorId, scan_session_id: scanSessionId });
    fetchOpportunities(); fetchAllRoutes();
    if (selectedOpp?.id === oppId) fetchRoutesForOpp(oppId);
  };

  // ── Phase 3.4 Actions (via edge function) ────
  const invokeAction = async (action: string, payload: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase.functions.invoke('contractor-actions', { body: { action, ...payload } });
      if (error || !data?.success) {
        console.error(`[AdminDashboard] ${action} failed`, error || data);
        return false;
      }
      return data;
    } catch (err) {
      console.error(`[AdminDashboard] ${action} error`, err);
      return false;
    }
  };

  const handleMarkInterested = async (routeId: string, oppId: string, contractorId: string) => {
    const result = await invokeAction('mark_interest', { route_id: routeId, opportunity_id: oppId, contractor_id: contractorId });
    if (result) { fetchOpportunities(); fetchAllRoutes(); if (selectedOpp) fetchRoutesForOpp(selectedOpp.id); }
  };

  const handleReviewRelease = async (routeId: string, decision: 'approve' | 'deny', reason?: string) => {
    const result = await invokeAction('review_release', { route_id: routeId, decision, reviewer: 'operator', reason });
    if (result) { fetchAllRoutes(); if (selectedOpp) fetchRoutesForOpp(selectedOpp.id); }
  };

  const handleReleaseContact = async (routeId: string, oppId: string, contractorId: string, leadId: string, analysisId: string) => {
    if (!confirm('⚠ This will release homeowner contact information to the contractor and create a billable intro. Continue?')) return;
    const result = await invokeAction('release_contact', {
      route_id: routeId, opportunity_id: oppId, contractor_id: contractorId, lead_id: leadId, analysis_id: analysisId,
      billing_model: releaseModel, fee_amount: releaseFee ? parseFloat(releaseFee) : null, released_by: 'operator',
    });
    if (result) { fetchOpportunities(); fetchAllRoutes(); fetchBillableIntros(); if (selectedOpp) fetchRoutesForOpp(selectedOpp.id); }
  };

  const handleMarkDead = async (oppId: string) => {
    const scanSessionId = opportunities.find(o => o.id === oppId)?.scan_session_id || null;
    await adminFetch('mark_dead', { opportunity_id: oppId, scan_session_id: scanSessionId });
    setSelectedOpp(null); fetchOpportunities();
  };

  const handleBillingStatusChange = async (introId: string, newStatus: string) => {
    await invokeAction('update_billing_status', { billable_intro_id: introId, billing_status: newStatus });
    fetchBillableIntros();
  };

  const handleOutcomeSave = async (data: Partial<ContractorOutcome>) => {
    if (!outcomeEditorIntro) return;
    await invokeAction('update_outcome', { billable_intro_id: outcomeEditorIntro.id, ...data });
    setOutcomeEditorIntro(null);
    fetchBillableIntros();
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

  const pendingReviewRoutes = allRoutes.filter(r => r.release_status === 'pending_review');
  const approvedRoutes = allRoutes.filter(r => r.release_status === 'approved' && !r.contact_released);

  // ── Tab badge counts ────
  const pendingOppCount = opportunities.filter(o => !o.routed_at && o.status !== 'dead').length;
  const pendingReleaseCount = pendingReviewRoutes.length + approvedRoutes.length;
  const activeBillingCount = billableIntros.filter(i => i.billing_status === 'billable' || i.billing_status === 'invoiced').length;

  return (
    <AdminPasswordGate>
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
          <div style={{ fontFamily: dispFont, fontWeight: 900, fontSize: 28, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>OPERATOR COMMAND CENTER</div>
          <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.12em', marginTop: 2 }}>WINDOWMAN · LEAD & CONTRACTOR OPS · REVENUE · REALTIME</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse-red 2s infinite' }} />
          <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8' }}>LIVE</div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, flexWrap: 'wrap' }}>
        {([
          ['calls', 'CALL QUEUE', 0] as const,
          ['contractor', 'CONTRACTOR QUEUE', pendingOppCount] as const,
          ['release', 'RELEASE REVIEW', pendingReleaseCount] as const,
          ['revenue', 'REVENUE', activeBillingCount] as const,
        ]).map(([key, label, badge]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              fontFamily: monoFont, fontSize: 12, letterSpacing: '0.1em', padding: '10px 20px', border: 'none', cursor: 'pointer',
              background: activeTab === key ? '#1D4ED8' : '#161C28', color: activeTab === key ? '#FFFFFF' : '#A0B8D8',
              borderBottom: activeTab === key ? '2px solid #3B82F6' : '2px solid transparent',
            }}>
            {label}
            {badge > 0 && <span style={{ marginLeft: 8, background: '#DC2626', color: '#FFFFFF', padding: '1px 6px', borderRadius: 8, fontSize: 11 }}>{badge}</span>}
          </button>
        ))}
      </div>

      {/* ═══ CALL QUEUE TAB ═══ */}
      {activeTab === 'calls' && (
        <>
          <StatsHeader stats={stats} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
            {(['tier1', 'new', 'all'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: monoFont, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 12px', border: 'none', borderRadius: 2, cursor: 'pointer', background: filter === f ? '#1D4ED8' : '#161C28', color: filter === f ? '#FFFFFF' : '#A0B8D8' }}>{f === 'tier1' ? 'TIER 1 ONLY' : f.toUpperCase()}</button>
            ))}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ fontFamily: bodyFont, fontSize: 12, color: '#FFFFFF', background: '#161C28', border: '1px solid #2E3A50', padding: '6px 12px', borderRadius: 0, outline: 'none', flex: 1, maxWidth: 280 }} />
          </div>
          {loading ? <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', padding: 20 }}>LOADING...</div> :
            filteredLeads.length === 0 ? <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', padding: 20 }}>NO LEADS MATCH FILTER</div> :
            filteredLeads.map(lead => <LeadRow key={lead.id} lead={lead} onStatusChange={handleStatusChange} onCallNow={handleCallNow} onSMS={handleSMS} />)}

          {/* ── VOICE AI SECTION ────────────────────────────── */}
          <div style={{ marginTop: 32, borderTop: '1px solid #2E3A50', paddingTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 800, fontSize: 20, color: '#FFFFFF',
                  textTransform: 'uppercase', letterSpacing: '-0.01em',
                }}>
                  VOICE AI ACTIVITY
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11, color: '#A0B8D8', letterSpacing: '0.12em', marginTop: 2,
                }}>
                  AUTOMATED CALL LOGS · MANUAL TRIGGERS
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11, color: '#10B981', letterSpacing: '0.08em',
                  background: 'rgba(16,185,129,0.1)',
                  padding: '3px 8px', borderRadius: 2,
                }}>
                  CALL LOG
                </span>
                <button
                  onClick={() => setShowVoicePanel(!showVoicePanel)}
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '6px 12px', border: 'none', borderRadius: 2, cursor: 'pointer',
                    background: showVoicePanel ? '#1D4ED8' : '#161C28',
                    color: showVoicePanel ? '#FFFFFF' : '#A0B8D8',
                  }}
                >
                  {showVoicePanel ? 'HIDE PANEL' : 'SHOW PANEL'}
                </button>
              </div>
            </div>

            {showVoicePanel && (
              <>
                {!adminPassword ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="password"
                      placeholder="Admin password for voice functions..."
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      style={{
                        fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#FFFFFF',
                        background: '#161C28', border: '1px solid #2E3A50',
                        padding: '6px 12px', borderRadius: 0, outline: 'none', width: 280,
                      }}
                    />
                  </div>
                ) : (
                  <VoiceFollowupsPanel adminPassword={adminPassword} />
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ═══ CONTRACTOR QUEUE TAB ═══ */}
      {activeTab === 'contractor' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#2E3A50', marginBottom: 20 }}>
            {[
              { label: 'TOTAL OPPORTUNITIES', value: opportunities.length, color: '#C8DEFF' },
              { label: 'PENDING ROUTING', value: opportunities.filter(o => !o.routed_at && o.status !== 'dead').length, color: '#F59E0B' },
              { label: 'ROUTED', value: opportunities.filter(o => !!o.routed_at).length, color: '#10B981' },
              { label: 'AVG PRIORITY', value: opportunities.length > 0 ? Math.round(opportunities.reduce((s, o) => s + o.priority_score, 0) / opportunities.length) : 0, color: '#3B82F6' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#111418', padding: '14px 16px' }}>
                <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.12em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['all', 'pending', 'routed'] as const).map(f => (
              <button key={f} onClick={() => setOppFilter(f)} style={{ fontFamily: monoFont, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 12px', border: 'none', borderRadius: 2, cursor: 'pointer', background: oppFilter === f ? '#1D4ED8' : '#161C28', color: oppFilter === f ? '#FFFFFF' : '#A0B8D8' }}>{f.toUpperCase()}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 80px 100px 120px', padding: '6px 14px', marginBottom: 4 }}>
            {['PRI', 'OPPORTUNITY', 'FLAGS', 'AGE', 'STATUS', ''].map(h => (
              <div key={h} style={{ fontFamily: monoFont, fontSize: 8, color: '#A0B8D8', letterSpacing: '0.12em' }}>{h}</div>
            ))}
          </div>
          {oppLoading ? <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', padding: 20 }}>LOADING QUEUE...</div> :
            filteredOpps.length === 0 ? <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', padding: 20 }}>NO OPPORTUNITIES IN QUEUE</div> :
            filteredOpps.map(opp => <OpportunityRow key={opp.id} opp={opp} onOpenDetail={(o) => setSelectedOpp(o)} />)}
        </>
      )}

      {/* ═══ RELEASE REVIEW TAB ═══ */}
      {activeTab === 'release' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#2E3A50', marginBottom: 20 }}>
            {[
              { label: 'PENDING REVIEW', value: pendingReviewRoutes.length, color: '#F59E0B' },
              { label: 'APPROVED (UNRELEASED)', value: approvedRoutes.length, color: '#10B981' },
              { label: 'TOTAL RELEASES', value: allRoutes.filter(r => r.contact_released).length, color: '#3B82F6' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#111418', padding: '14px 16px' }}>
                <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.12em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Pending review */}
          {pendingReviewRoutes.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: monoFont, fontSize: 11, color: '#F59E0B', letterSpacing: '0.12em', marginBottom: 10 }}>AWAITING RELEASE DECISION ({pendingReviewRoutes.length})</div>
              {pendingReviewRoutes.map(r => {
                const opp = opportunities.find(o => o.id === r.opportunity_id);
                const contractor = contractors.find(c => c.id === r.contractor_id);
                return (
                  <div key={r.id} style={{ background: '#111418', border: '1px solid rgba(245,158,11,0.3)', borderLeft: '3px solid #F59E0B', marginBottom: 6, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{contractor?.company_name || '—'}</span>
                        <span style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', marginLeft: 12 }}>→ {opp?.county || '—'} County</span>
                        {opp && <GradeBadge grade={opp.grade} />}
                      </div>
                      <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8' }}>
                        Interest: {r.interested_at ? formatAge(secondsSince(r.interested_at)) + ' ago' : '—'}
                      </div>
                    </div>
                    {opp && (
                      <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', marginBottom: 8 }}>
                        Priority: {opp.priority_score} · {opp.red_flag_count}R {opp.amber_flag_count}A flags · {opp.window_count ?? '—'} windows · {opp.quote_range || '—'}
                      </div>
                    )}
                    {r.interest_notes && <div style={{ fontFamily: monoFont, fontSize: 12, color: '#C8DEFF', marginBottom: 8, fontStyle: 'italic' }}>"{r.interest_notes}"</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleReviewRelease(r.id, 'approve')}
                        style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12, color: '#10B981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', padding: '5px 14px', borderRadius: 2, cursor: 'pointer' }}>
                        ✓ APPROVE RELEASE
                      </button>
                      <button onClick={() => handleReviewRelease(r.id, 'deny')}
                        style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12, color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', padding: '5px 14px', borderRadius: 2, cursor: 'pointer' }}>
                        ✗ DENY
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Approved but unreleased */}
          {approvedRoutes.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: monoFont, fontSize: 11, color: '#10B981', letterSpacing: '0.12em', marginBottom: 10 }}>APPROVED — READY TO RELEASE ({approvedRoutes.length})</div>
              {approvedRoutes.map(r => {
                const opp = opportunities.find(o => o.id === r.opportunity_id);
                const contractor = contractors.find(c => c.id === r.contractor_id);
                return (
                  <div key={r.id} style={{ background: '#111418', border: '1px solid rgba(16,185,129,0.3)', borderLeft: '3px solid #10B981', marginBottom: 6, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{contractor?.company_name || '—'}</span>
                        <span style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', marginLeft: 12 }}>→ {opp?.county || '—'} County</span>
                      </div>
                      <StatusPill status="approved" />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                      <select value={releaseModel} onChange={e => setReleaseModel(e.target.value)}
                        style={{ fontFamily: monoFont, fontSize: 11, background: '#161C28', border: '1px solid #2E3A50', color: '#C8DEFF', padding: '3px 6px', borderRadius: 0 }}>
                        {Object.entries(BILLING_MODEL).map(([k, v]) => <option key={v} value={v}>{k}</option>)}
                      </select>
                      <input value={releaseFee} onChange={e => setReleaseFee(e.target.value)} placeholder="fee $" type="number"
                        style={{ fontFamily: monoFont, fontSize: 11, color: '#C8DEFF', background: '#161C28', border: '1px solid #2E3A50', padding: '3px 6px', width: 70, borderRadius: 0 }} />
                      <button onClick={() => opp && handleReleaseContact(r.id, opp.id, r.contractor_id, opp.lead_id, opp.analysis_id)}
                        style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', padding: '5px 14px', borderRadius: 2, cursor: 'pointer' }}>
                        ⚠ RELEASE HOMEOWNER CONTACT
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pendingReviewRoutes.length === 0 && approvedRoutes.length === 0 && !releaseLoading && (
            <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', padding: 40, textAlign: 'center' }}>NO RELEASES PENDING</div>
          )}
        </>
      )}

      {/* ═══ REVENUE TAB ═══ */}
      {activeTab === 'revenue' && (() => {
        const filtered = billableIntros.filter(i => {
          if (revDateFrom && i.created_at < revDateFrom) return false;
          if (revDateTo && i.created_at > revDateTo + 'T23:59:59.999Z') return false;
          return true;
        });
        const paidIntros = filtered.filter(i => i.billing_status === 'paid');
        const totalRevenue = paidIntros.reduce((s, i) => s + (i.fee_amount || 0), 0);

        const exportCSV = () => {
          const header = ['ID','Contractor','Billing Model','Fee','Status','Invoice Ref','Created','Paid At','Deal Status','Deal Value','Appointment'];
          const rows = filtered.map(intro => {
            const c = contractors.find(x => x.id === intro.contractor_id);
            const out = outcomes.find(o => o.billable_intro_id === intro.id);
            return [
              intro.id,
              c?.company_name || '',
              intro.billing_model || '',
              intro.fee_amount?.toString() || '',
              intro.billing_status,
              intro.invoice_reference || '',
              intro.created_at,
              intro.paid_at || '',
              out?.deal_status || '',
              out?.deal_value?.toString() || '',
              out?.appointment_status || '',
            ];
          });
          const csv = [header, ...rows].map(r => r.map(c => `"${(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url;
          a.download = `windowman-revenue-${new Date().toISOString().slice(0,10)}.csv`;
          a.click(); URL.revokeObjectURL(url);
        };

        return (
          <>
            {/* Date filter + Export */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.08em' }}>FROM</div>
              <input type="date" value={revDateFrom} onChange={e => setRevDateFrom(e.target.value)}
                style={{ fontFamily: monoFont, fontSize: 12, background: '#161C28', border: '1px solid #2E3A50', color: '#C8DEFF', padding: '5px 8px', borderRadius: 0 }} />
              <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.08em' }}>TO</div>
              <input type="date" value={revDateTo} onChange={e => setRevDateTo(e.target.value)}
                style={{ fontFamily: monoFont, fontSize: 12, background: '#161C28', border: '1px solid #2E3A50', color: '#C8DEFF', padding: '5px 8px', borderRadius: 0 }} />
              {(revDateFrom || revDateTo) && (
                <button onClick={() => { setRevDateFrom(''); setRevDateTo(''); }}
                  style={{ fontFamily: monoFont, fontSize: 11, color: '#EF4444', background: 'none', border: '1px solid rgba(239,68,68,0.3)', padding: '5px 10px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.08em' }}>CLEAR</button>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={exportCSV}
                style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12, color: '#FFFFFF', background: '#0B60C5', border: 'none', padding: '6px 14px', borderRadius: 2, cursor: 'pointer' }}>
                ⬇ EXPORT CSV
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#2E3A50', marginBottom: 20 }}>
              {[
                { label: 'TOTAL INTROS', value: filtered.length, color: '#C8DEFF' },
                { label: 'BILLABLE', value: filtered.filter(i => i.billing_status === 'billable').length, color: '#F59E0B' },
                { label: 'PAID', value: paidIntros.length, color: '#10B981' },
                { label: 'REVENUE', value: `$${totalRevenue.toLocaleString()}`, color: '#F59E0B' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#111418', padding: '14px 16px' }}>
                  <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.12em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', letterSpacing: '0.12em', marginBottom: 10 }}>BILLABLE INTROS ({filtered.length})</div>
            {revenueLoading ? <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', padding: 20 }}>LOADING...</div> :
              filtered.length === 0 ? <div style={{ fontFamily: monoFont, fontSize: 11, color: '#A0B8D8', padding: 40, textAlign: 'center' }}>NO BILLABLE INTROS {revDateFrom || revDateTo ? 'IN DATE RANGE' : 'YET'}</div> :
              filtered.map(intro => (
                <BillableIntroRow key={intro.id} intro={intro} contractors={contractors} outcomes={outcomes}
                  onStatusChange={handleBillingStatusChange} onOpenOutcome={setOutcomeEditorIntro} />
              ))}
          </>
        );
      })()}

      {/* Opportunity Detail Modal */}
      {selectedOpp && (
        <OpportunityDetail
          opp={selectedOpp} contractors={contractors} routes={oppRoutes}
          onClose={() => { setSelectedOpp(null); setOppRoutes([]); }}
          onRoute={handleRoute}
          onMarkInterested={handleMarkInterested}
          onReviewRelease={handleReviewRelease}
          onReleaseContact={(routeId, oppId, contractorId, leadId, analysisId) => handleReleaseContact(routeId, oppId, contractorId, leadId, analysisId)}
          onMarkDead={handleMarkDead}
          onRefresh={fetchOpportunities}
        />
      )}

      {/* Outcome Editor Modal */}
      {outcomeEditorIntro && (
        <OutcomeEditor
          intro={outcomeEditorIntro}
          outcome={outcomes.find(o => o.billable_intro_id === outcomeEditorIntro.id) || null}
          contractors={contractors}
          onSave={handleOutcomeSave}
          onClose={() => setOutcomeEditorIntro(null)}
        />
      )}
    </div>
    </AdminPasswordGate>
  );
}
