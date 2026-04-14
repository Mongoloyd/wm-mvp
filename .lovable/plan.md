

## Fix: Update `Scenario` type and `useEffect` to use uppercase keys

**File**: `src/pages/DemoClassic.tsx`

### Changes

1. **Line 94** — Update type definition:
   ```tsx
   type Scenario = "No_Phone" | "Known_Phone" | "OTP_Sent";
   ```

2. **Line 98** — Update default state:
   ```tsx
   const [scenario, setScenario] = useState<Scenario>("No_Phone");
   ```

3. **Lines 123, 126** — Update useEffect comparisons:
   ```tsx
   if (scenario === "No_Phone") {
   ```
   ```tsx
   } else if (scenario === "Known_Phone") {
   ```
   (The `else` branch already handles the `OTP_Sent` case implicitly.)

Four lines changed. No other modifications.

