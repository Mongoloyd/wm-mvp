## Apply Title Case to All Grade Messages

**Current state** (line 25-31 in `GradeReveal.tsx`):

- **A**: "Your Quote is Well-Structured and Without Obvious Red Flags." → sentence case
- **B**: "Your Quote is Acceptable With Minor Items Worth Addressing." → sentence case  
- **C**: "Your Quote Has Issues That Could Cost You Money." → already title case ✓
- **D**: "Do Not Sign Without Revisiting These Issues." → sentence case
- **F**: "This Quote Has Critical Problems. You are Likely Being Significantly Overcharged." → sentence case

**Changes** — update `gradeConfig` messages to title case:

- **A**: `"Your Quote Is Well-Structured and Competitively Priced."`
- **B**: `"Your Quote Is Acceptable with Minor Items Worth Addressing."`
- **C**: no change
- **D**: `"Do Not Sign Without Renegotiating These Issues."`
- **F**: `"This Quote Has Critical Problems. You Are Likely Being Significantly Overcharged."`

Single file edit: `src/components/GradeReveal.tsx`, lines 26-30.