/**
 * MarketBaselineTool.tsx — Flow B Interactive Baseline Builder
 *
 * THE ENDOWMENT EFFECT IN CODE:
 * The homeowner BUILDS their ideal price by selecting:
 *   - Their county
 *   - Window brand (PGT vs CGI vs generic)
 *   - Window count
 *   - Installation method (fin vs full-frame)
 *   - Project type
 *
 * By configuring the tool themselves, they now feel like they OWN the
 * resulting number. When a contractor arrives and quotes higher, it's
 * not "the market says X" — it's "MY baseline says X."
 *
 * The baseline is saved to localStorage so it persists for their contractor visit.
 * A print/share button lets them send it to the contractor BEFORE the appointment.
 * This is how WindowMan owns the first-impression anchor.
 */

import { useState, useEffect } from 'react';
import { useFunnelStore } from '../store/useFunnelStore';
import { FLORIDA_COUNTIES, IMPACT_WINDOW_BRANDS, type CountyMarketData, type BrandData } from '../store/countyData';

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface BaselineConfig {
  county:        string;
  brand:         string;
  windowCount:   number;
  installMethod: 'fin' | 'full-frame';
  projectType:   string;
}

interface BaselineResult {
  fairFloor:     number;   // p25 per window × count
  fairCeiling:   number;   // p75 per window × count
  fairMid:       number;   // avg per window × count
  perWindow:     number;   // fair per window
  brandPremium:  number;   // premium over generic
  installAdder:  number;   // full-frame vs fin adder
  warningFlag:   string | null;
  countyData:    CountyMarketData | null;
  brandData:     BrandData | null;
  savedAt:       string;
}

// ── PRICING LOGIC ──────────────────────────────────────────────────────────────

const INSTALL_METHOD_MULTIPLIER = { fin: 1.0, 'full-frame': 1.12 };

function calculateBaseline(config: BaselineConfig): BaselineResult {
  const countyData = FLORIDA_COUNTIES.find(c => c.county === config.county) ?? null;
  const brandData  = IMPACT_WINDOW_BRANDS.find(b => b.name === config.brand) ?? null;

  const basePerWindow = countyData?.avgPerWindow ?? 1100;
  const brandAdj      = brandData ? (brandData.avgPerWindow / 1100) : 1;
  const installMult   = INSTALL_METHOD_MULTIPLIER[config.installMethod];

  const adjustedPerWindow = Math.round(basePerWindow * brandAdj * installMult);
  const p25PerWindow      = Math.round((countyData?.p25 ?? 860)  * brandAdj * installMult);
  const p75PerWindow      = Math.round((countyData?.p75 ?? 1440) * brandAdj * installMult);

  const n = config.windowCount;

  return {
    fairFloor:    p25PerWindow * n,
    fairCeiling:  p75PerWindow * n,
    fairMid:      adjustedPerWindow * n,
    perWindow:    adjustedPerWindow,
    brandPremium: brandData ? Math.round((brandData.avgPerWindow - 640) * n) : 0,
    installAdder: config.installMethod === 'full-frame'
      ? Math.round(basePerWindow * 0.12 * n) : 0,
    warningFlag: brandData?.tier === 'economy'
      ? 'Generic brand selected — contractor can substitute any quality level after signing. Ask for a specific brand name.'
      : !brandData
      ? 'No brand selected yet — specify a brand before signing any contract.'
      : null,
    countyData,
    brandData,
    savedAt: new Date().toISOString(),
  };
}

// ── SAVED BASELINE ALERT ────────────────────────────────────────────────────

function SavedBaselineAlert({ savedAt }: { savedAt: string }) {
  const monoFont = "'JetBrains Mono',monospace";
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px',
      background: 'rgba(16,185,129,0.07)',
      border: '1px solid rgba(16,185,129,0.22)',
      borderLeft: '2px solid #10B981',
      marginBottom: 12,
    }}>
      <span style={{ fontFamily: monoFont, fontSize: 10, color: '#34D399', letterSpacing: '0.1em' }}>
        ✓ BASELINE SAVED — Returns when you visit again
      </span>
      <span style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', marginLeft: 'auto' }}>
        {new Date(savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
      </span>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function MarketBaselineTool() {
  const { county: storeCounty, windowCount: storeWindowCount } = useFunnelStore();

  const savedBaseline = (() => {
    try { return JSON.parse(localStorage.getItem('wm_baseline_config') || 'null'); } catch { return null; }
  })();

  const [config, setConfig] = useState<BaselineConfig>({
    county:        savedBaseline?.county       ?? storeCounty ?? 'Broward',
    brand:         savedBaseline?.brand        ?? 'PGT WinGuard',
    windowCount:   savedBaseline?.windowCount  ?? (storeWindowCount ? parseInt(storeWindowCount) : 10),
    installMethod: savedBaseline?.installMethod ?? 'fin',
    projectType:   savedBaseline?.projectType  ?? 'Full home replacement',
  });

  const [result, setResult]         = useState<BaselineResult>(() => calculateBaseline(config));
  const [justSaved, setJustSaved]   = useState(false);
  const [activeTab, setActiveTab]   = useState<'build' | 'compare' | 'checklist'>('build');

  const monoFont = "'JetBrains Mono',monospace";
  const bodyFont = "'DM Sans',sans-serif";
  const dispFont = "'Barlow Condensed',sans-serif";

  // Recalculate on any config change
  useEffect(() => {
    const newResult = calculateBaseline(config);
    setResult(newResult);
  }, [config]);

  const saveBaseline = () => {
    localStorage.setItem('wm_baseline_config',  JSON.stringify(config));
    localStorage.setItem('wm_baseline_result',  JSON.stringify(result));
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const printBaseline = () => {
    const text = [
      `WINDOWMAN MARKET BASELINE — ${config.county.toUpperCase()} COUNTY`,
      `Generated: ${new Date().toLocaleDateString()}`,
      ``,
      `YOUR CONFIGURATION:`,
      `  County:         ${config.county}`,
      `  Window Brand:   ${config.brand}`,
      `  Window Count:   ${config.windowCount}`,
      `  Install Method: ${config.installMethod === 'full-frame' ? 'Full Frame Replacement' : 'Fin Installation'}`,
      `  Project Type:   ${config.projectType}`,
      ``,
      `YOUR FAIR-MARKET RANGE:`,
      `  Floor (P25):  $${result.fairFloor.toLocaleString()}`,
      `  Midpoint:     $${result.fairMid.toLocaleString()}`,
      `  Ceiling (P75): $${result.fairCeiling.toLocaleString()}`,
      `  Per Window:   $${result.perWindow.toLocaleString()}`,
      ``,
      `QUESTIONS TO ASK YOUR CONTRACTOR:`,
      `  1. What specific brand and NOA number are you installing?`,
      `  2. Is the permit listed as a separate line item with a dollar amount?`,
      `  3. What is the labor warranty period?`,
      `  4. What installation method are you using (fin or full frame)?`,
      ``,
      `Powered by WindowMan.pro — AI-Powered Impact Window Quote Intelligence`,
    ].join('\n');

    const blob    = new Blob([text], { type: 'text/plain' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = `windowman_baseline_${config.county.replace(' ','-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const update = (key: keyof BaselineConfig, value: string | number) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  return (
    <div id="market-baseline" style={{
      background: '#0A0A0A', minHeight: '100vh',
      padding: '40px 20px', fontFamily: bodyFont,
      color: '#FFFFFF',
    }}>
      {/* Header */}
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontFamily: monoFont, fontSize: 9, color: '#00D9FF', letterSpacing: '0.16em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 1, background: '#00D9FF' }} />
          MARKET BASELINE TOOL — FLOW B
        </div>
        <div style={{ fontFamily: dispFont, fontWeight: 900, fontSize: 'clamp(26px,5vw,42px)', textTransform: 'uppercase', lineHeight: 1, marginBottom: 8 }}>
          BUILD YOUR FAIR-MARKET BASELINE
        </div>
        <div style={{ fontSize: 14, color: '#A0B8D8', lineHeight: 1.65, marginBottom: 24, maxWidth: 540 }}>
          Configure your project below. The moment your contractor opens their briefcase, you'll already know the number they're hoping you don't.
        </div>

        {justSaved && <SavedBaselineAlert savedAt={result.savedAt} />}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #2E3A50' }}>
          {(['build','compare','checklist'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontFamily: monoFont, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
                color: activeTab === tab ? '#00D9FF' : '#7D9DBB',
                borderBottom: activeTab === tab ? '2px solid #00D9FF' : '2px solid transparent',
                transition: 'all 0.12s ease',
              }}
            >
              {tab === 'build' ? 'BUILD' : tab === 'compare' ? 'BRAND COMPARE' : 'CONTRACTOR CHECKLIST'}
            </button>
          ))}
        </div>

        {/* ── BUILD TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'build' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* LEFT: Configuration */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* County */}
              <div>
                <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.1em', marginBottom: 6 }}>COUNTY</div>
                <select
                  value={config.county}
                  onChange={e => update('county', e.target.value)}
                  style={{
                    fontFamily: bodyFont, fontSize: 13, color: '#FFFFFF',
                    background: '#161C28', border: '1px solid #2E3A50',
                    padding: '10px 12px', width: '100%', borderRadius: 0, outline: 'none',
                  }}
                >
                  {FLORIDA_COUNTIES
                    .filter(c => c.avgScansMonth > 10) // only show counties with data
                    .sort((a, b) => b.avgScansMonth - a.avgScansMonth)
                    .map(c => <option key={c.slug} value={c.county}>{c.county}</option>)
                  }
                </select>
              </div>

              {/* Brand */}
              <div>
                <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.1em', marginBottom: 6 }}>WINDOW BRAND</div>
                {IMPACT_WINDOW_BRANDS.map(brand => (
                  <button
                    key={brand.name}
                    onClick={() => update('brand', brand.name)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 12px',
                      background: config.brand === brand.name ? 'rgba(0,217,255,0.07)' : '#161C28',
                      border: `1px solid ${config.brand === brand.name ? '#00D9FF' : '#2E3A50'}`,
                      color: config.brand === brand.name ? '#00D9FF' : '#C8DEFF',
                      fontFamily: bodyFont, fontSize: 13, cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: 4, borderRadius: 0, transition: 'all 0.12s ease',
                    }}
                  >
                    <span style={{ fontWeight: config.brand === brand.name ? 600 : 400 }}>
                      {brand.name}
                    </span>
                    <span style={{
                      fontFamily: monoFont, fontSize: 9,
                      color: brand.tier === 'premium' ? '#10B981' :
                             brand.tier === 'mid'     ? '#F59E0B' : '#F97316',
                      letterSpacing: '0.08em',
                    }}>
                      ${brand.avgPerWindow}/win · {brand.tier.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>

              {/* Window count slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.1em' }}>WINDOW COUNT</div>
                  <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 20, color: '#FFFFFF' }}>{config.windowCount}</div>
                </div>
                <input
                  type="range" min={1} max={40} step={1}
                  value={config.windowCount}
                  onChange={e => update('windowCount', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#1D4ED8' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', marginTop: 2 }}>
                  <span>1</span><span>20</span><span>40</span>
                </div>
              </div>

              {/* Install method */}
              <div>
                <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.1em', marginBottom: 6 }}>INSTALLATION METHOD</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {(['fin', 'full-frame'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => update('installMethod', method)}
                      style={{
                        padding: '10px', fontFamily: bodyFont, fontSize: 12, cursor: 'pointer', borderRadius: 0,
                        background: config.installMethod === method ? 'rgba(29,78,216,0.15)' : '#161C28',
                        border: `1px solid ${config.installMethod === method ? '#1D4ED8' : '#2E3A50'}`,
                        color: config.installMethod === method ? '#60A5FA' : '#C8DEFF',
                        fontWeight: config.installMethod === method ? 600 : 400,
                        transition: 'all 0.12s ease',
                      }}
                    >
                      <div>{method === 'fin' ? 'Fin Installation' : 'Full Frame'}</div>
                      <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', marginTop: 3 }}>
                        {method === 'fin' ? 'Standard · Lower cost' : '+12% · More thorough'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Live result */}
            <div>
              <div style={{
                background: '#111418', border: '1px solid #2E3A50',
                borderTop: '2px solid #1D4ED8', padding: 20, marginBottom: 12,
              }}>
                <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', letterSpacing: '0.1em', marginBottom: 16 }}>
                  YOUR FAIR-MARKET RANGE
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: monoFont, fontSize: 10, color: '#7D9DBB', marginBottom: 4 }}>FAIR FLOOR (25th pct)</div>
                  <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 28, color: '#10B981' }}>
                    ${result.fairFloor.toLocaleString()}
                  </div>
                </div>
                <div style={{ height: 1, background: '#2E3A50', margin: '12px 0' }} />
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: monoFont, fontSize: 10, color: '#00D9FF', marginBottom: 4 }}>YOUR FAIR MIDPOINT</div>
                  <div style={{ fontFamily: dispFont, fontWeight: 900, fontSize: 40, color: '#FFFFFF' }}>
                    ${result.fairMid.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', marginTop: 2 }}>
                    ${result.perWindow.toLocaleString()}/window · {config.windowCount} windows
                  </div>
                </div>
                <div style={{ height: 1, background: '#2E3A50', margin: '12px 0' }} />
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: monoFont, fontSize: 10, color: '#7D9DBB', marginBottom: 4 }}>FAIR CEILING (75th pct)</div>
                  <div style={{ fontFamily: dispFont, fontWeight: 800, fontSize: 28, color: '#F59E0B' }}>
                    ${result.fairCeiling.toLocaleString()}
                  </div>
                </div>

                {result.installAdder > 0 && (
                  <div style={{ fontSize: 12, color: '#A0B8D8', marginBottom: 6 }}>
                    Full-frame install adds ~<span style={{ color: '#F59E0B' }}>${result.installAdder.toLocaleString()}</span>
                  </div>
                )}

                {result.warningFlag && (
                  <div style={{
                    background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
                    borderLeft: '2px solid #F97316', padding: '10px 12px', marginTop: 12,
                  }}>
                    <div style={{ fontFamily: monoFont, fontSize: 9, color: '#F97316', letterSpacing: '0.1em', marginBottom: 4 }}>▲ FLAG</div>
                    <div style={{ fontSize: 12, color: '#A0B8D8' }}>{result.warningFlag}</div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={saveBaseline}
                  style={{
                    flex: 1, fontFamily: bodyFont, fontWeight: 700, fontSize: 13, color: '#FFFFFF',
                    background: justSaved ? '#065F46' : '#0B60C5', border: 'none',
                    padding: '11px', borderRadius: 2, cursor: 'pointer', transition: 'background 0.2s',
                  }}
                >
                  {justSaved ? '✓ SAVED' : 'SAVE BASELINE'}
                </button>
                <button
                  onClick={printBaseline}
                  style={{
                    fontFamily: bodyFont, fontWeight: 600, fontSize: 12, color: '#A0B8D8',
                    background: 'transparent', border: '1px solid #2E3A50',
                    padding: '11px 14px', borderRadius: 2, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ⬇ DOWNLOAD
                </button>
              </div>
              <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', marginTop: 8, textAlign: 'center', letterSpacing: '0.06em' }}>
                Share this baseline with your contractor before they quote
              </div>
            </div>
          </div>
        )}

        {/* ── BRAND COMPARE TAB ─────────────────────────────────────────── */}
        {activeTab === 'compare' && (
          <div>
            <div style={{ fontFamily: monoFont, fontSize: 10, color: '#7D9DBB', letterSpacing: '0.1em', marginBottom: 16 }}>
              BRAND COMPARISON FOR {config.windowCount} WINDOWS · {config.county.toUpperCase()}
            </div>
            {IMPACT_WINDOW_BRANDS.map(brand => {
              const brandResult = calculateBaseline({ ...config, brand: brand.name });
              const isSelected  = config.brand === brand.name;
              return (
                <div
                  key={brand.name}
                  onClick={() => update('brand', brand.name)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 60px',
                    gap: 0, background: isSelected ? 'rgba(0,217,255,0.05)' : '#111418',
                    border: `1px solid ${isSelected ? '#00D9FF' : '#2E3A50'}`,
                    padding: '12px 14px', marginBottom: 4, cursor: 'pointer',
                    alignItems: 'center', transition: 'all 0.12s ease',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: isSelected ? '#00D9FF' : '#FFFFFF' }}>
                      {brand.name}
                    </div>
                    <div style={{ fontFamily: monoFont, fontSize: 9, color: '#7D9DBB', marginTop: 2 }}>
                      {brand.warranty}yr warranty · NOA: {brand.noaStatus}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: dispFont, fontWeight: 800, fontSize: 16,
                    color: brand.tier === 'premium' ? '#10B981' : brand.tier === 'mid' ? '#F59E0B' : '#F97316' }}>
                    ${brandResult.perWindow.toLocaleString()}
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: dispFont, fontWeight: 700, fontSize: 14, color: '#C8DEFF' }}>
                    ${brandResult.fairMid.toLocaleString()}
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: monoFont, fontSize: 9, color: '#7D9DBB' }}>
                    {brand.tier.toUpperCase()}
                  </div>
                  {isSelected && (
                    <div style={{ fontFamily: monoFont, fontSize: 9, color: '#00D9FF', textAlign: 'right' }}>
                      ◈ SELECTED
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CONTRACTOR CHECKLIST TAB ───────────────────────────────────── */}
        {activeTab === 'checklist' && (
          <div>
            <div style={{ fontSize: 14, color: '#A0B8D8', lineHeight: 1.7, marginBottom: 20 }}>
              Print or save this. When the contractor arrives, ask these five questions before accepting any quote.
            </div>
            {[
              {
                badge: '▲ CRITICAL',   badgeColor: '#F87171',
                q: 'What specific brand AND model number are you installing?',
                why: 'Without a named brand, your contractor can install any quality after signing. The brand is the product you\'re actually buying.',
                script: '"Please add the brand, model, and NOA number to the contract before I sign."',
              },
              {
                badge: '▲ CRITICAL',   badgeColor: '#F87171',
                q: 'Is the permit listed as a separate line item with a dollar amount?',
                why: '"Permit included" is one of the most expensive phrases in a window contract. Without a dollar amount, they control whether a permit is pulled.',
                script: '"Can you show me the permit as a separate line item? I\'d like to confirm it\'s being pulled before work begins."',
              },
              {
                badge: '⚡ IMPORTANT', badgeColor: '#F59E0B',
                q: 'What is the labor warranty period?',
                why: 'Florida state minimum is 3 years for full replacement. Many contractors quote 1 year. That gap is not an accident.',
                script: '"What is the labor warranty and does it remain valid if I file a manufacturer warranty claim?"',
              },
              {
                badge: '⚡ IMPORTANT', badgeColor: '#F59E0B',
                q: 'Is this a fin installation, full frame replacement, or something else?',
                why: 'Installation method affects energy efficiency, water intrusion risk, and cost. If not specified, they choose the cheapest method after signing.',
                script: '"Please add the installation method to the contract language."',
              },
              {
                badge: '◎ TECHNICAL', badgeColor: '#60A5FA',
                q: 'Is the installation crew licensed and insured in Florida?',
                why: 'Unlicensed subcontractors void your homeowner\'s insurance in Florida if damage occurs during installation.',
                script: '"Can you provide the license number and COI for the crew installing the windows?"',
              },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#111418', border: '1px solid #2E3A50', borderLeft: '2px solid #2E3A50',
                padding: '16px', marginBottom: 8,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{
                    fontFamily: monoFont, fontSize: 9, color: item.badgeColor,
                    background: `${item.badgeColor}20`, border: `1px solid ${item.badgeColor}40`,
                    padding: '2px 7px', borderRadius: 2, letterSpacing: '0.1em',
                  }}>
                    {item.badge}
                  </span>
                </div>
                <div style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: '#FFFFFF', marginBottom: 8 }}>
                  {item.q}
                </div>
                <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7D9DBB', lineHeight: 1.65, marginBottom: 10 }}>
                  {item.why}
                </div>
                <div style={{
                  fontFamily: bodyFont, fontSize: 12, fontStyle: 'italic', color: '#A0B8D8',
                  background: '#0D1B35', padding: '8px 12px', borderLeft: '2px solid #1D4ED8',
                }}>
                  "{item.script}"
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
