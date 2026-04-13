

## Plan: Clean Dead Gemini/Modal Code from QuoteSpreadShowcase.tsx

Single file, single pass. No other files touched.

### Remove

| Lines | What |
|---|---|
| 3-4, 8-14 | Unused imports: `ShieldCheck`, `BarChart3`, `Layers`, `ScanLine`, `Activity`, `CheckCircle`, `AlertTriangle`, `Sparkles`, `X`, `Loader2`, `ClipboardCheck` |
| 159-164 | Dead state: `isModalOpen`, `inputText`, `aiResponse`, `isLoading`, `error` |
| 168 | `\|\| isModalOpen` guard in `handleMouseMove` |
| 182-245 | `callGemini`, `handleOpenModal`, `handleAnalyze` functions |
| 337-344 | `.glass-modal` CSS block |
| 351 | `${isModalOpen ? "scale-[0.98] opacity-50 blur-sm" : ""}` conditional |
| 406-480 | Entire modal JSX overlay |

### Keep (untouched)

- `quoteData`, `MockEstimate`, all 5 cards
- All animations/keyframes CSS
- `mousePos`, `isScanning`, `containerRef`, `handleMouseMove` (minus the dead guard)
- `onScanClick` button and prop signature
- `.btn-glossy-blue`, `.btn-glossy-orange`, all visual CSS

### Imports after cleanup

Only `ArrowRight` from lucide-react is actually used in the live JSX. `React`, `useState`, `useEffect`, `useRef` stay.

### Net result

~150 lines removed. Zero visual or behavioral change.

