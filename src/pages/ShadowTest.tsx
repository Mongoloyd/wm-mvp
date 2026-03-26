/**
 * /shadow-test — Side-by-side comparison of old vs new shadow system.
 * Left column renders buttons with hardcoded OLD shadows.
 * Right column renders buttons with the live design-system classes.
 */
const oldBtnShadow =
  'inset 0 1px 0 rgba(255,255,255,0.25), 2px 3px 6px rgba(10,25,55,0.14), 3px 6px 16px rgba(37,99,235,0.28)';
const oldBtnHoverShadow =
  'inset 0 1px 0 rgba(255,255,255,0.3), 3px 5px 10px rgba(10,25,55,0.16), 4px 10px 28px rgba(37,99,235,0.32)';
const oldCardShadow =
  'inset 0 1px 0 rgba(255,255,255,0.85), 2px 3px 4px rgba(10,25,55,0.08), 3px 6px 14px rgba(10,25,55,0.1), 4px 10px 28px rgba(10,25,55,0.06)';

export default function ShadowTest() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold text-foreground mb-8 text-center font-display">
        Shadow System Comparison
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* ── OLD (hardcoded directional) ── */}
        <div className="space-y-8">
          <h2 className="text-lg font-semibold text-muted-foreground text-center uppercase tracking-wider">
            A — Original (directional)
          </h2>

          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-muted-foreground font-mono">btn-depth-primary</p>
            <button
              className="inline-flex items-center justify-center overflow-hidden text-white font-bold text-base px-8 py-4 cursor-pointer"
              style={{
                background: 'linear-gradient(180deg, #6BB8FF 0%, #4A9BF5 12%, #2563EB 40%, #1D4ED8 75%, #162FA0 100%)',
                border: '1px solid #1a4fc0',
                borderTop: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 'var(--radius-btn)',
                boxShadow: oldBtnShadow,
                textShadow: '0 1px 0 rgba(255,255,255,0.12), 0 -1px 0 rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.35), 0 4px 8px rgba(15,40,100,0.2)',
              }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.boxShadow = oldBtnHoverShadow; (e.target as HTMLButtonElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.boxShadow = oldBtnShadow; (e.target as HTMLButtonElement).style.transform = 'none'; }}
            >
              Scan My Quote — It's Free
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-muted-foreground font-mono">card-raised</p>
            <div
              className="p-6 w-full max-w-sm"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
                border: '1px solid hsl(214 30% 82%)',
                borderRadius: 'var(--radius-card)',
                boxShadow: oldCardShadow,
              }}
            >
              <p className="text-sm text-foreground font-semibold">Sample Grade Card</p>
              <p className="text-xs text-muted-foreground mt-2">Old directional shadow system with x-offsets.</p>
            </div>
          </div>
        </div>

        {/* ── B — Current design system ── */}
        <div className="space-y-8">
          <h2 className="text-lg font-semibold text-muted-foreground text-center uppercase tracking-wider">
            B — Current (centered, 5-layer)
          </h2>

          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-muted-foreground font-mono">btn-depth-primary</p>
            <button className="btn-depth-primary px-8 py-4">
              Scan My Quote — It's Free
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-muted-foreground font-mono">card-raised</p>
            <div className="card-raised p-6 w-full max-w-sm">
              <p className="text-sm text-foreground font-semibold">Sample Grade Card</p>
              <p className="text-xs text-muted-foreground mt-2">New centered shadow system — coherent lighting.</p>
            </div>
          </div>
        </div>

        {/* ── C — Proposed tactile (user spec) ── */}
        <div className="space-y-8">
          <h2 className="text-lg font-semibold text-muted-foreground text-center uppercase tracking-wider">
            C — Proposed (6-layer tactile)
          </h2>

          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-muted-foreground font-mono">btn-depth-primary (proposed)</p>
            <button
              className="inline-flex items-center justify-center overflow-hidden text-white font-bold text-base px-8 py-4 cursor-pointer transition-transform"
              style={{
                background: 'linear-gradient(180deg, #6BB8FF 0%, #3B82F6 40%, #1D4ED8 100%)',
                border: '1px solid #1a4fc0',
                borderTop: '1px solid rgba(255,255,255,0.35)',
                borderRadius: 'var(--radius-btn)',
                boxShadow: '0 1px 1px rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.18), 0 10px 24px rgba(0,0,0,0.08), 0 4px 16px rgba(37,99,235,0.18), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.15)',
                textShadow: '0 1px 2px rgba(0,0,0,0.25)',
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.transform = 'translateY(-3px)';
                btn.style.boxShadow = '0 2px 2px rgba(0,0,0,0.28), 0 6px 14px rgba(0,0,0,0.2), 0 16px 36px rgba(0,0,0,0.1), 0 6px 20px rgba(37,99,235,0.22), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.transform = 'none';
                btn.style.boxShadow = '0 1px 1px rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.18), 0 10px 24px rgba(0,0,0,0.08), 0 4px 16px rgba(37,99,235,0.18), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.15)';
              }}
              onMouseDown={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.transform = 'translateY(1px)';
                btn.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.25), inset 0 1px 2px rgba(0,0,0,0.2)';
              }}
              onMouseUp={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.transform = 'translateY(-3px)';
                btn.style.boxShadow = '0 2px 2px rgba(0,0,0,0.28), 0 6px 14px rgba(0,0,0,0.2), 0 16px 36px rgba(0,0,0,0.1), 0 6px 20px rgba(37,99,235,0.22), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.12)';
              }}
            >
              Scan My Quote — It's Free
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-muted-foreground font-mono">card-raised (same as B)</p>
            <div className="card-raised p-6 w-full max-w-sm">
              <p className="text-sm text-foreground font-semibold">Sample Grade Card</p>
              <p className="text-xs text-muted-foreground mt-2">Card unchanged — comparing buttons only.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary button comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mt-12">
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground font-mono">btn-secondary (A)</p>
          <button
            className="inline-flex items-center justify-center font-semibold text-sm px-6 py-3 cursor-pointer"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F0F4F8 100%)',
              color: 'hsl(217 91% 48%)',
              border: '1px solid hsl(214 30% 78%)',
              borderRadius: 'var(--radius-btn)',
              boxShadow: oldCardShadow,
            }}
          >
            Watch Live Demo
          </button>
        </div>
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground font-mono">btn-secondary (B)</p>
          <button className="btn-secondary-tactile px-6 py-3">
            Watch Live Demo
          </button>
        </div>
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground font-mono">btn-secondary (C — same as B)</p>
          <button className="btn-secondary-tactile px-6 py-3">
            Watch Live Demo
          </button>
        </div>
      </div>
    </div>
  );
}
