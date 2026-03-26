/**
 * MarketBaselineTool.tsx — Flow B Interactive Baseline Builder
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
  fairFloor:     number;
  fairCeiling:   number;
  fairMid:       number;
  perWindow:     number;
  brandPremium:  number;
  installAdder:  number;
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
  return (
    <div className="flex items-center gap-2 p-2 px-3 mb-3 wm-surface-card" style={{ borderLeft: '2px solid hsl(var(--color-emerald))' }}>
      <span className="wm-eyebrow text-emerald-600" style={{ fontSize: 10 }}>
        ✓ BASELINE SAVED — Returns when you visit again
      </span>
      <span className="wm-type-mono text-muted-foreground ml-auto" style={{ fontSize: 9 }}>
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
    <div id="market-baseline" className="bg-background text-foreground" style={{ minHeight: '100vh', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="flex items-center gap-2 mb-3 wm-eyebrow wm-scan-cyan" style={{ fontSize: 9 }}>
          <div className="bg-primary" style={{ width: 18, height: 1 }} />
          MARKET BASELINE TOOL — FLOW B
        </div>
        <div className="wm-title-xl mb-2" style={{ fontSize: 'clamp(26px,5vw,42px)' }}>
          BUILD YOUR FAIR-MARKET BASELINE
        </div>
        <div className="wm-body-muted mb-6" style={{ fontSize: 14, maxWidth: 540 }}>
          Configure your project below. The moment your contractor opens their briefcase, you'll already know the number they're hoping you don't.
        </div>

        {justSaved && <SavedBaselineAlert savedAt={result.savedAt} />}

        {/* Tabs */}
        <div className="flex border-b border-border mb-5">
          {(['build','compare','checklist'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`wm-eyebrow px-4 py-2.5 bg-transparent border-none cursor-pointer transition-all ${
                activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground border-b-2 border-transparent'
              }`}
              style={{ fontSize: 10 }}
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
                <div className="wm-eyebrow text-muted-foreground mb-1.5" style={{ fontSize: 9 }}>COUNTY</div>
                <select
                  value={config.county}
                  onChange={e => update('county', e.target.value)}
                  aria-label="County"
                  title="County"
                  className="wm-input-well text-foreground outline-none"
                  style={{ fontSize: 13, borderRadius: 0 }}
                >
                  {FLORIDA_COUNTIES
                    .filter(c => c.avgScansMonth > 10)
                    .sort((a, b) => b.avgScansMonth - a.avgScansMonth)
                    .map(c => <option key={c.slug} value={c.county}>{c.county}</option>)
                  }
                </select>
              </div>

              {/* Brand */}
              <div>
                <div className="wm-eyebrow text-muted-foreground mb-1.5" style={{ fontSize: 9 }}>WINDOW BRAND</div>
                {IMPACT_WINDOW_BRANDS.map(brand => (
                  <button
                    key={brand.name}
                    onClick={() => update('brand', brand.name)}
                    className={`w-full text-left border transition-all flex justify-between items-center mb-1 cursor-pointer ${
                      config.brand === brand.name
                        ? 'bg-primary/5 border-primary text-primary shadow-[var(--wm-shadow-blue)]'
                        : 'border-border text-foreground wm-surface-card'
                    }`}
                    style={{ padding: '10px 12px', fontSize: 13, borderRadius: 0 }}
                  >
                    <span className="wm-body-strong" style={{ fontWeight: config.brand === brand.name ? 600 : 400, fontSize: 13 }}>
                      {brand.name}
                    </span>
                    <span className="wm-type-mono" style={{
                      fontSize: 9,
                      color: brand.tier === 'premium' ? 'hsl(var(--color-emerald))' :
                             brand.tier === 'mid'     ? 'hsl(var(--color-gold-accent))' : 'hsl(var(--color-vivid-orange))',
                    }}>
                      ${brand.avgPerWindow}/win · {brand.tier.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>

              {/* Window count slider */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <div className="wm-eyebrow text-muted-foreground" style={{ fontSize: 9 }}>WINDOW COUNT</div>
                  <div className="wm-type-display" style={{ fontSize: 20 }}>{config.windowCount}</div>
                </div>
                <input
                  type="range" min={1} max={40} step={1}
                  value={config.windowCount}
                  onChange={e => update('windowCount', parseInt(e.target.value))}
                  aria-label="Window count"
                  title="Window count"
                  style={{ width: '100%', accentColor: 'hsl(var(--primary))' }}
                />
                <div className="flex justify-between wm-type-mono mt-0.5" style={{ fontSize: 9 }}>
                  <span>1</span><span>20</span><span>40</span>
                </div>
              </div>

              {/* Install method */}
              <div>
                <div className="wm-eyebrow text-muted-foreground mb-1.5" style={{ fontSize: 9 }}>INSTALLATION METHOD</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['fin', 'full-frame'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => update('installMethod', method)}
                      className={`border transition-all cursor-pointer ${
                        config.installMethod === method
                          ? 'bg-primary/10 border-primary text-primary shadow-[var(--wm-shadow-blue)]'
                          : 'border-border text-foreground wm-surface-card'
                      }`}
                      style={{ padding: '10px', fontSize: 12, borderRadius: 0, fontWeight: config.installMethod === method ? 600 : 400 }}
                    >
                      <div className="wm-body-strong" style={{ fontSize: 12 }}>{method === 'fin' ? 'Fin Installation' : 'Full Frame'}</div>
                      <div className="wm-type-mono mt-0.5" style={{ fontSize: 9 }}>
                        {method === 'fin' ? 'Standard · Lower cost' : '+12% · More thorough'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Live result */}
            <div>
              <div className="wm-instrument-panel p-5 mb-3" style={{ borderTop: '2px solid hsl(var(--primary))' }}>
                <div className="wm-eyebrow text-muted-foreground mb-4" style={{ fontSize: 9 }}>
                  YOUR FAIR-MARKET RANGE
                </div>
                <div className="mb-4">
                  <div className="wm-eyebrow text-muted-foreground mb-1" style={{ fontSize: 10 }}>FAIR FLOOR (25th pct)</div>
                  <div className="wm-type-display" style={{ fontSize: 28, color: 'hsl(var(--color-emerald))' }}>
                    ${result.fairFloor.toLocaleString()}
                  </div>
                </div>
                <div className="wm-divider-track my-3" />
                <div className="mb-3">
                  <div className="wm-eyebrow text-primary mb-1" style={{ fontSize: 10 }}>YOUR FAIR MIDPOINT</div>
                  <div className="wm-type-display text-foreground" style={{ fontSize: 40 }}>
                    ${result.fairMid.toLocaleString()}
                  </div>
                  <div className="wm-type-mono mt-0.5" style={{ fontSize: 9 }}>
                    ${result.perWindow.toLocaleString()}/window · {config.windowCount} windows
                  </div>
                </div>
                <div className="wm-divider-track my-3" />
                <div className="mb-4">
                  <div className="wm-eyebrow text-muted-foreground mb-1" style={{ fontSize: 10 }}>FAIR CEILING (75th pct)</div>
                  <div className="wm-type-display" style={{ fontSize: 28, color: 'hsl(var(--color-gold-accent))' }}>
                    ${result.fairCeiling.toLocaleString()}
                  </div>
                </div>

                {result.installAdder > 0 && (
                  <div className="wm-body-muted" style={{ fontSize: 12 }}>
                    Full-frame install adds ~<span style={{ color: 'hsl(var(--color-gold-accent))' }}>${result.installAdder.toLocaleString()}</span>
                  </div>
                )}

                {result.warningFlag && (
                  <div style={{
                    background: 'hsl(var(--color-vivid-orange) / 0.06)', border: '1px solid hsl(var(--color-vivid-orange) / 0.2)',
                    borderLeft: '2px solid hsl(var(--color-vivid-orange))', padding: '10px 12px', marginTop: 12,
                  }}>
                    <div className="wm-eyebrow mb-1" style={{ fontSize: 9, color: 'hsl(var(--color-vivid-orange))' }}>▲ FLAG</div>
                    <div className="wm-body-muted" style={{ fontSize: 12 }}>{result.warningFlag}</div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={saveBaseline}
                  className="wm-btn wm-btn-blue flex-1"
                  style={{
                    fontSize: 13, padding: '11px', borderRadius: 2,
                    background: justSaved ? 'hsl(var(--color-emerald))' : undefined,
                  }}
                >
                  {justSaved ? '✓ SAVED' : 'SAVE BASELINE'}
                </button>
                <button
                  onClick={printBaseline}
                  className="wm-surface-card wm-body-strong text-muted-foreground hover:bg-muted transition-colors cursor-pointer whitespace-nowrap"
                  style={{ fontSize: 12, padding: '11px 14px', borderRadius: 2 }}
                >
                  ⬇ DOWNLOAD
                </button>
              </div>
              <div className="wm-type-mono text-center mt-2" style={{ fontSize: 9 }}>
                Share this baseline with your contractor before they quote
              </div>
            </div>
          </div>
        )}

        {/* ── BRAND COMPARE TAB ─────────────────────────────────────────── */}
        {activeTab === 'compare' && (
          <div>
            <div className="wm-eyebrow text-muted-foreground mb-4" style={{ fontSize: 10 }}>
              BRAND COMPARISON FOR {config.windowCount} WINDOWS · {config.county.toUpperCase()}
            </div>
            {IMPACT_WINDOW_BRANDS.map(brand => {
              const brandResult = calculateBaseline({ ...config, brand: brand.name });
              const isSelected  = config.brand === brand.name;
              return (
                <div
                  key={brand.name}
                  onClick={() => update('brand', brand.name)}
                  className={`border transition-all cursor-pointer mb-1 ${
                    isSelected ? 'bg-primary/5 border-primary' : 'bg-card border-border'
                  }`}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 60px',
                    padding: '12px 14px', alignItems: 'center',
                  }}
                >
                  <div>
                    <div className={`wm-body-strong text-[13px] ${isSelected ? 'text-primary' : ''}`}>
                      {brand.name}
                    </div>
                    <div className="wm-type-mono mt-0.5" style={{ fontSize: 9 }}>
                      {brand.warranty}yr warranty · NOA: {brand.noaStatus}
                    </div>
                  </div>
                  <div className="wm-type-display text-right" style={{ fontSize: 16,
                    color: brand.tier === 'premium' ? 'hsl(var(--color-emerald))' : brand.tier === 'mid' ? 'hsl(var(--color-gold-accent))' : 'hsl(var(--color-vivid-orange))' }}>
                    ${brandResult.perWindow.toLocaleString()}
                  </div>
                  <div className="wm-type-display text-foreground text-right" style={{ fontSize: 14 }}>
                    ${brandResult.fairMid.toLocaleString()}
                  </div>
                  <div className="wm-type-mono text-right" style={{ fontSize: 9 }}>
                    {brand.tier.toUpperCase()}
                  </div>
                  {isSelected && (
                    <div className="wm-type-mono text-primary text-right" style={{ fontSize: 9 }}>
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
            <div className="wm-body-muted mb-5" style={{ fontSize: 14 }}>
              Print or save this. When the contractor arrives, ask these five questions before accepting any quote.
            </div>
            {[
              {
                badge: '▲ CRITICAL',   badgeColor: 'hsl(var(--color-danger))',
                q: 'What specific brand AND model number are you installing?',
                why: 'Without a named brand, your contractor can install any quality after signing. The brand is the product you\'re actually buying.',
                script: '"Please add the brand, model, and NOA number to the contract before I sign."',
              },
              {
                badge: '▲ CRITICAL',   badgeColor: 'hsl(var(--color-danger))',
                q: 'Is the permit listed as a separate line item with a dollar amount?',
                why: '"Permit included" is one of the most expensive phrases in a window contract. Without a dollar amount, they control whether a permit is pulled.',
                script: '"Can you show me the permit as a separate line item? I\'d like to confirm it\'s being pulled before work begins."',
              },
              {
                badge: '⚡ IMPORTANT', badgeColor: 'hsl(var(--color-gold-accent))',
                q: 'What is the labor warranty period?',
                why: 'Florida state minimum is 3 years for full replacement. Many contractors quote 1 year. That gap is not an accident.',
                script: '"What is the labor warranty and does it remain valid if I file a manufacturer warranty claim?"',
              },
              {
                badge: '⚡ IMPORTANT', badgeColor: 'hsl(var(--color-gold-accent))',
                q: 'Is this a fin installation, full frame replacement, or something else?',
                why: 'Installation method affects energy efficiency, water intrusion risk, and cost. If not specified, they choose the cheapest method after signing.',
                script: '"Please add the installation method to the contract language."',
              },
              {
                badge: '◎ TECHNICAL', badgeColor: 'hsl(var(--primary))',
                q: 'Is the installation crew licensed and insured in Florida?',
                why: 'Unlicensed subcontractors void your homeowner\'s insurance in Florida if damage occurs during installation.',
                script: '"Can you provide the license number and COI for the crew installing the windows?"',
              },
            ].map((item, i) => (
              <div key={i} className="wm-surface-card p-4 mb-2" style={{ borderLeft: `2px solid ${item.badgeColor}` }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="wm-eyebrow px-1.5 py-0.5 rounded-sm" style={{
                    fontSize: 9, color: item.badgeColor,
                    background: `color-mix(in srgb, ${item.badgeColor} 8%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${item.badgeColor} 25%, transparent)`,
                  }}>
                    {item.badge}
                  </span>
                </div>
                <div className="wm-body-strong mb-2" style={{ fontSize: 14 }}>
                  {item.q}
                </div>
                <div className="wm-body-muted mb-2.5" style={{ fontSize: 13 }}>
                  {item.why}
                </div>
                <div className="bg-muted text-secondary-foreground italic" style={{
                  fontSize: 12, padding: '8px 12px', borderLeft: '2px solid hsl(var(--primary))',
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
