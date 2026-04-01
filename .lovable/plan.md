

## Problem

The Index page wrapper (`div.min-h-screen.bg-background.pb-[240px]`) has large bottom padding to prevent the Footer from being hidden behind the fixed StickyCTAFooter. This padding area uses `bg-background` (blue-gray `#EEF2F8`), creating a visible gray gap between the white Footer and the white sticky bar.

## Fix

**One change in `src/pages/Index.tsx` (line 150):**

Remove the bottom padding from the page wrapper div and instead add it directly to the `<Footer />` component's container. Specifically:

- Change line 150 from:
  `<div className="min-h-screen bg-background pb-[240px] sm:pb-[180px] lg:pb-32">`
  to:
  `<div className="min-h-screen bg-background">`

- Change the `<Footer />` on line 370 to wrap it so the footer's background extends through the padding area. Add the bottom padding to the Footer's parent wrapper with the footer's own background color:
  ```
  <div className="bg-card pb-[240px] sm:pb-[180px] lg:pb-32">
    <Footer />
  </div>
  ```

This ensures the padding zone matches the Footer's white (`bg-card`) background, eliminating the gray gap.

## Also fix build error

**`src/components/post-scan/PostScanReportSwitcher.test.tsx` line 70:** Remove the duplicate property in the object literal causing `TS1117`.

