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
    <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 border-l-2 border-l-emerald-500 rounded-lg mb-3">
      <span className="font-mono text-[10px] text-emerald-600 tracking-widest">
        ✓ BASELINE SAVED — Returns when you visit again
      </span>
      <span className="font-mono text-[9px] text-muted-foreground ml-auto">
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
      `  1. What specific brand AND model number are you installing?`,
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
    <div id="market-baseline" className="bg-muted min-h-screen py-10 px-5 font-body text-foreground">
      {/* Header */}
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-[18px] h-px bg-primary" />
          <span className="eyebrow text-primary">MARKET BASELINE TOOL — FLOW B</span>
        </div>
        <h1 className="display-hero text-foreground mb-2" style={{ fontSize: 'clamp(26px,5vw,42px)' }}>
          BUILD YOUR FAIR-MARKET BASELINE
        </h1>
        <p className="font-body text-[14px] text-muted-foreground leading-relaxed mb-6 max-w-[540px]">
          Configure your project below. The moment your contractor opens their briefcase, you'll already know the number they're hoping you don't.
        </p>

        {justSaved && <SavedBaselineAlert savedAt={result.savedAt} />}

        {/* Tabs */}
        <div className="flex gap-0 mb-5 border-b border-border">
          {(['build','compare','checklist'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-mono text-[10px] tracking-widest uppercase py-2.5 px-4 border-none bg-transparent cursor-pointer transition-all duration-150 ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-b-primary'
                  : 'text-muted-foreground border-b-2 border-b-transparent hover:text-foreground'
              }`}
            >
              {tab === 'build' ? 'BUILD' : tab === 'compare' ? 'BRAND COMPARE' : 'CONTRACTOR CHECKLIST'}
            </button>
          ))}
        </div>

        {/* ── BUILD TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'build' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* LEFT: Configuration */}
            <div className="flex flex-col gap-4">

              {/* County */}
              <div>
                <div className="font-mono text-[9px] text-muted-foreground tracking-widest mb-1.5">COUNTY</div>
                <select
                  value={config.county}
                  onChange={e => update('county', e.target.value)}
                  className="font-body text-[13px] text-foreground bg-card border border-border p-2.5 w-full rounded-lg outline-none"
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
                <div className="font-mono text-[9px] text-muted-foreground tracking-widest mb-1.5">WINDOW BRAND</div>
                {IMPACT_WINDOW_BRANDS.map(brand => (
                  <button
                    key={brand.name}
                    onClick={() => update('brand', brand.name)}
                    className={`w-full text-left p-2.5 border rounded-lg cursor-pointer flex justify-between items-center mb-1 transition-all duration-150 ${
                      config.brand === brand.name
                        ? 'bg-primary/5 border-primary text-primary'
                        : 'bg-card border-border text-foreground hover:border-primary/40'
                    }`}
                  >
                    <span className={`font-body text-[13px] ${config.brand === brand.name ? 'font-semibold' : ''}`}>
                      {brand.name}
                    </span>
                    <span className={`font-mono text-[9px] tracking-wider ${
                      brand.tier === 'premium' ? 'text-emerald-600' :
                      brand.tier === 'mid'     ? 'text-amber-600' : 'text-wm-orange'
                    }`}>
                      ${brand.avgPerWindow}/win · {brand.tier.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>

              {/* Window count slider */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <div className="font-mono text-[9px] text-muted-foreground tracking-widest">WINDOW COUNT</div>
                  <div className="font-display font-extrabold text-xl text-foreground">{config.windowCount}</div>
                </div>
                <input
                  type="range" min={1} max={40} step={1}
                  value={config.windowCount}
                  onChange={e => update('windowCount', parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between font-mono text-[9px] text-muted-foreground mt-0.5">
                  <span>1</span><span>20</span><span>40</span>
                </div>
              </div>

              {/* Install method */}
              <div>
                <div className="font-mono text-[9px] text-muted-foreground tracking-widest mb-1.5">INSTALLATION METHOD</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['fin', 'full-frame'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => update('installMethod', method)}
                      className={`p-2.5 font-body text-xs cursor-pointer rounded-lg transition-all duration-150 ${
                        config.installMethod === method
                          ? 'bg-primary/10 border border-primary text-primary font-semibold'
                          : 'bg-card border border-border text-foreground'
                      }`}
                    >
                      <div>{method === 'fin' ? 'Fin Installation' : 'Full Frame'}</div>
                      <div className="font-mono text-[9px] text-muted-foreground mt-0.5">
                        {method === 'fin' ? 'Standard · Lower cost' : '+12% · More thorough'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Live result */}
            <div>
              <div className="glass-card-strong shadow-xl border-t-2 border-t-primary p-5 mb-3">
                <div className="font-mono text-[9px] text-muted-foreground tracking-widest mb-4">
                  YOUR FAIR-MARKET RANGE
                </div>
                <div className="mb-4">
                  <div className="font-mono text-[10px] text-muted-foreground mb-1">FAIR FLOOR (25th pct)</div>
                  <div className="font-display font-extrabold text-[28px] text-emerald-600">
                    ${result.fairFloor.toLocaleString()}
                  </div>
                </div>
                <div className="h-px bg-border my-3" />
                <div className="mb-3">
                  <div className="font-mono text-[10px] text-primary mb-1">YOUR FAIR MIDPOINT</div>
                  <div className="font-display font-black text-[40px] text-foreground">
                    ${result.fairMid.toLocaleString()}
                  </div>
                  <div className="font-mono text-[9px] text-muted-foreground mt-0.5">
                    ${result.perWindow.toLocaleString()}/window · {config.windowCount} windows
                  </div>
                </div>
                <div className="h-px bg-border my-3" />
                <div className="mb-4">
                  <div className="font-mono text-[10px] text-muted-foreground mb-1">FAIR CEILING (75th pct)</div>
                  <div className="font-display font-extrabold text-[28px] text-amber-600">
                    ${result.fairCeiling.toLocaleString()}
                  </div>
                </div>

                {result.installAdder > 0 && (
                  <div className="text-xs text-muted-foreground mb-1.5">
                    Full-frame install adds ~<span className="text-amber-600">${result.installAdder.toLocaleString()}</span>
                  </div>
                )}

                {result.warningFlag && (
                  <div className="bg-wm-orange/5 border border-wm-orange/20 border-l-2 border-l-wm-orange rounded-lg p-2.5 mt-3">
                    <div className="font-mono text-[9px] text-wm-orange tracking-widest mb-1">▲ FLAG</div>
                    <div className="text-xs text-muted-foreground">{result.warningFlag}</div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={saveBaseline}
                  className={`flex-1 font-body font-bold text-[13px] text-white border-none py-2.5 rounded-lg cursor-pointer transition-colors duration-200 ${
                    justSaved ? 'bg-emerald-700' : 'btn-depth-primary'
                  }`}
                >
                  {justSaved ? '✓ SAVED' : 'SAVE BASELINE'}
                </button>
                <button
                  onClick={printBaseline}
                  className="font-body font-semibold text-xs text-muted-foreground bg-transparent border border-border py-2.5 px-3.5 rounded-lg cursor-pointer whitespace-nowrap hover:border-primary hover:text-primary transition-colors"
                >
                  ⬇ DOWNLOAD
                </button>
              </div>
              <div className="font-mono text-[9px] text-muted-foreground mt-2 text-center tracking-wider">
                Share this baseline with your contractor before they quote
              </div>
            </div>
          </div>
        )}

        {/* ── BRAND COMPARE TAB ─────────────────────────────────────────── */}
        {activeTab === 'compare' && (
          <div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-widest mb-4">
              BRAND COMPARISON FOR {config.windowCount} WINDOWS · {config.county.toUpperCase()}
            </div>
            {IMPACT_WINDOW_BRANDS.map(brand => {
              const brandResult = calculateBaseline({ ...config, brand: brand.name });
              const isSelected  = config.brand === brand.name;
              return (
                <div
                  key={brand.name}
                  onClick={() => update('brand', brand.name)}
                  className={`grid gap-0 p-3 mb-1 cursor-pointer items-center transition-all duration-150 rounded-lg border ${
                    isSelected ? 'bg-primary/5 border-primary' : 'bg-card border-border hover:border-primary/40'
                  }`}
                  style={{ gridTemplateColumns: '1fr 80px 80px 80px 60px' }}
                >
                  <div>
                    <div className={`font-body text-[13px] font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {brand.name}
                    </div>
                    <div className="font-mono text-[9px] text-muted-foreground mt-0.5">
                      {brand.warranty}yr warranty · NOA: {brand.noaStatus}
                    </div>
                  </div>
                  <div className={`text-right font-display font-extrabold text-[16px] ${
                    brand.tier === 'premium' ? 'text-emerald-600' : brand.tier === 'mid' ? 'text-amber-600' : 'text-wm-orange'
                  }`}>
                    ${brandResult.perWindow.toLocaleString()}
                  </div>
                  <div className="text-right font-display font-bold text-[14px] text-foreground">
                    ${brandResult.fairMid.toLocaleString()}
                  </div>
                  <div className="text-right font-mono text-[9px] text-muted-foreground">
                    {brand.tier.toUpperCase()}
                  </div>
                  {isSelected && (
                    <div className="font-mono text-[9px] text-primary text-right">
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
            <div className="font-body text-[14px] text-muted-foreground leading-relaxed mb-5">
              Print or save this. When the contractor arrives, ask these five questions before accepting any quote.
            </div>
            {[
              {
                badge: '▲ CRITICAL',   badgeColor: '#EF4444',
                q: 'What specific brand AND model number are you installing?',
                why: 'Without a named brand, your contractor can install any quality after signing. The brand is the product you\'re actually buying.',
                script: '"Please add the brand, model, and NOA number to the contract before I sign."',
              },
              {
                badge: '▲ CRITICAL',   badgeColor: '#EF4444',
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
                badge: '◎ TECHNICAL', badgeColor: '#3B82F6',
                q: 'Is the installation crew licensed and insured in Florida?',
                why: 'Unlicensed subcontractors void your homeowner\'s insurance in Florida if damage occurs during installation.',
                script: '"Can you provide the license number and COI for the crew installing the windows?"',
              },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border border-l-2 rounded-lg p-4 mb-2">
                <div className="flex gap-2 items-center mb-2.5">
                  <span
                    className="font-mono text-[9px] tracking-widest rounded px-1.5 py-0.5"
                    style={{
                      color: item.badgeColor,
                      background: `${item.badgeColor}15`,
                      border: `1px solid ${item.badgeColor}30`,
                    }}
                  >
                    {item.badge}
                  </span>
                </div>
                <div className="font-body text-[14px] font-semibold text-foreground mb-2">
                  {item.q}
                </div>
                <div className="font-body text-[13px] text-muted-foreground leading-relaxed mb-2.5">
                  {item.why}
                </div>
                <div className="font-body text-xs italic text-muted-foreground bg-muted p-2 rounded border-l-2 border-l-primary">
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
