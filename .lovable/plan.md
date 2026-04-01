

## Plan: Move DevQuoteGenerator into DevPreviewPanel as a toggle button

### What changes

**1. `src/dev/DevPreviewPanel.tsx`** — Add a third button ("OCR") next to the existing BarChart3 and DEV buttons. Clicking it toggles the DevQuoteGenerator panel open/closed, same pattern as the other two. Import and render DevQuoteGenerator inside an AnimatePresence block. Add `sessionId` and `onScanStart` as props passed through from the parent.

**2. `src/pages/Index.tsx`** — Remove the standalone `<DevQuoteGenerator>` block (lines 359-369). Pass `sessionId` and `onScanStart` props to `<DevPreviewPanel>` so it can forward them to the generator.

### Technical details

- `DevPreviewPanel` gets new props: `sessionId?: string | null` and `onScanStart?: (fileName: string, scanSessionId: string) => void`
- New state: `const [showQuoteGen, setShowQuoteGen] = useState(false)`
- New button in the bottom button row with a test-tube icon (`FlaskConical` from lucide-react), labeled "OCR"
- The DevQuoteGenerator renders in a fixed-position AnimatePresence panel (like RubricComparison), positioned to avoid overlap
- Lazy import of DevQuoteGenerator stays intact via `React.lazy`

