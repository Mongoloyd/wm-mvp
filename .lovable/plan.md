

## Plan: Enlarge Hero Image and Widen Column Spacing

### What
Make the WindowMan character image 2x larger and increase the separation between the two content columns below it.

### Changes

**Update `src/components/sections/HeroSection.tsx`**

1. **Double the image size** — change from `w-48 md:w-64 lg:w-72` to `w-96 md:w-[28rem] lg:w-[32rem]`, and increase bottom margin to `mb-16 lg:mb-24`
2. **Widen column gap** — change grid gap from `gap-20 lg:gap-24` to `gap-24 lg:gap-32 xl:gap-40`
3. **Expand container** — change `max-w-7xl` to `max-w-[90rem]` to give the wider gap room to breathe

No new files or dependencies.

