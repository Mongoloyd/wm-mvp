

## What You're Describing (In Plain Terms)

Right now the backdrop is **fixed to the viewport** — the 4 blobs are pinned to the screen and never move when you scroll. This means:

1. **Blue is always on the left, orange is always on the right** — no matter where you are on the page, the same colors sit in the same corners. It looks like two static colored walls.
2. **Hard horizontal cuts** — because the blobs are positioned at fixed viewport percentages (5%, 25%, 55%, 78%), as you scroll past a blob's vertical center, the color abruptly fades to nothing. You see a visible "line" where color stops and plain white begins.
3. **No depth or movement feel** — since the blobs are fixed, they don't respond to scrolling at all. The page feels flat, like content sliding over a static wallpaper.

**What you want instead:**

- Blobs that live **inside the page content** (not fixed to the screen), placed at staggered vertical positions down the full page height
- **Alternating sides**: Section 1 has blue-left / orange-right, Section 2 flips to orange-left / blue-right, and so on down the page — a zigzag pattern
- **Soft vertical blending**: Each blob is so tall and so blurred that its color feathers into the blob above and below it, creating seamless gradual transitions with no visible horizontal line
- **Parallax feeling**: Because the blobs are taller than the sections they serve and overlap each other vertically, as you scroll the color appears to shift and drift — blue washing in from the left, then fading as orange washes in from the right. This creates a sense of layered depth even though it's 2D

## The Fix

### Change: `HomepageBackdrop.tsx`

1. **Switch from `fixed` to `absolute`** — blobs scroll with the page content instead of being pinned to the screen
2. **Make the container full page height** — instead of `inset-0` (viewport), size it to match the full scrollable document
3. **Place 6-8 blobs at staggered absolute positions** down the page, alternating sides:

```text
Position    Left Side       Right Side
─────────── ─────────────── ───────────────
~0%         BLUE blob       
~10%                        ORANGE blob
~25%        ORANGE blob     
~40%                        BLUE blob
~55%        BLUE blob       
~65%                        ORANGE blob
~80%        ORANGE blob     
~90%                        BLUE blob
```

4. **Overlap blobs vertically** — each blob is ~30-40vh tall with 150px+ blur, so colors feather into each other with no hard edge
5. **Keep the drift animations** — the subtle translate movement stays, giving organic life
6. **Wrapper uses `position: absolute; top: 0; left: 0; right: 0; bottom: 0`** inside a `relative` parent so it spans the full scrollable height

### Files touched
1. `src/components/HomepageBackdrop.tsx` — rewrite blob positions and container strategy
2. `src/pages/Index.tsx` — ensure the wrapper div has `relative` and `overflow-hidden` so blobs don't cause horizontal scroll

