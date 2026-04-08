

# Plan: Add Phone Scanner Image Below TruthGateFlow Questions

## What Changes

Copy the uploaded phone image into the project assets, then display it centered below the question card inside `TruthGateFlow.tsx` — after the progress card but still within the section wrapper.

## Layout

The image will sit below the card container (after line 776), centered, with constrained max-width (~280px on mobile, ~320px on desktop) and some top margin for breathing room. It will have a subtle fade-in animation using framer-motion.

## Files Modified

| File | Change |
|------|--------|
| `src/assets/cellphone.png` | Copy uploaded image into project |
| `src/components/TruthGateFlow.tsx` | Import the image asset, add an `<img>` below the card div (after line 776, before the closing `</div>`) with centered layout and fade-in animation |

## Technical Details

- Import: `import cellphoneImg from "@/assets/cellphone.png"`
- Placement: After the `card-dominant` div, inside the `max-w-2xl` container
- Styling: `mx-auto max-w-[280px] md:max-w-[320px] mt-8` with `motion.img` fade-in (`initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`)
- Alt text: "AI Document Scanner analyzing a contract"

