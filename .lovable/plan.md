

You want the "What Homeowners Are Saying" heading to use two responsive sizes:

- **Mobile**: `text-lg` (18px)
- **Desktop** (`md:` breakpoint and up): `text-4xl` (36px)

The className should be: `"wm-title-section text-lg md:text-4xl text-foreground"`

This replaces the current `text-base` with `text-lg` for mobile, keeping `md:text-4xl` for desktop.

