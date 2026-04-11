

## Plan: Add Scroll-Stopping Red CTA Section Above Document in ForensicShift.jsx

### What Changes
Replace the small cyan FAB (lines 253-261) with a new full-width CTA banner inserted between the `<header>` (line 211) and `<main>` (line 223). The banner contains a headline with cyan-highlighted text and a large red pulsing button.

### File: `src/components/Forensicshift.jsx`

**1. Remove existing FAB** (lines 253-261) -- delete the cyan button entirely.

**2. Add CTA banner section** between `</header>` (line 221) and `<main>` (line 223):

```jsx
{/* Scroll-stopping CTA banner */}
<div className="relative py-8 px-4 flex flex-col items-center gap-5 bg-gradient-to-b from-[#253245] to-[#1e293b]">
  <p className="text-center text-white font-bold text-base sm:text-lg max-w-md leading-snug">
    Don't Sign Until You've Got Your Free{' '}
    <span className="text-cyan-400">WindowMan AI Truth Report</span> →
  </p>
  <button
    onClick={() => setShowModal(true)}
    className="w-32 h-32 rounded-full bg-red-600 hover:bg-red-500 flex flex-col items-center justify-center transition-colors animate-[red-glow_2s_ease-in-out_infinite]"
    style={{ border: '6px solid #1a1a2e' }}
  >
    <Sparkles className="w-6 h-6 text-white mb-1" />
    <span className="text-sm font-black uppercase text-white tracking-wider">Press</span>
    <span className="text-sm font-black uppercase text-white tracking-wider">HERE</span>
  </button>
</div>
```

**3. Add `red-glow` keyframe** to the existing `<style>` block (line 312-325):

```css
@keyframes red-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(220,38,38,0.4), 0 0 40px rgba(220,38,38,0.2);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 35px rgba(220,38,38,0.7), 0 0 60px rgba(220,38,38,0.4);
    transform: scale(1.08);
  }
}
```

### Why
- Places the CTA above the document so users see it before scrolling into the split-view
- Red button creates urgency and contrast against the dark/cyan palette
- Visible on all viewports (not just mobile) for consistent conversion
- `scale(1.08)` breathing effect draws tactile engagement
- Headline with "Don't Sign Until..." creates FOMO urgency

### Result
A bold red glowing button with "PRESS HERE" text and Sparkles icon, centered below an urgent headline, sitting above the forensic document on all screen sizes.

