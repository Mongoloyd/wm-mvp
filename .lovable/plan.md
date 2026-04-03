

# Adjust Spacing for Second SocialProofStrip

## Summary
Change the `mt-[150px]` spacer to approximately 2 inches (~192px) below the questions container. The current 150px value needs a bump to ~192px (2 inches at 96dpi).

## Change — `src/pages/Index.tsx`

Line 247: Replace `mt-[150px]` with `mt-48` (Tailwind's 12rem = 192px ≈ 2 inches).

