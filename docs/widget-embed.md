# WindowMan Website Widget — Slice 1

This first slice ships the **embed loader**, **modal shell**, and **tenant branding/config layer**.

It does **not** yet mount the live scan funnel inside the widget. The widget currently launches a branded hosted shell and routes users to the hosted scanner.

## Files added

- `public/windowman-widget.js`
- `public/widget-host.html`
- `docs/widget-embed.md`

## What this slice does

- Adds a copy-paste embeddable widget loader
- Renders a floating launcher on the contractor site
- Opens a modal iframe on click
- Loads a branded hosted shell page
- Supports tenant-specific branding through `data-*` script attributes

## Contractor install snippet

```html
<script
  src="https://YOUR-DOMAIN.com/windowman-widget.js"
  data-windowman-widget
  data-tenant-slug="broward-windows"
  data-brand-name="Broward Window Co."
  data-headline="Upload your competitor quote for a free Broward quote audit"
  data-subheadline="See hidden scope gaps, warranty traps, and fine-print issues before you sign."
  data-button-label="Free Quote Audit"
  data-accent-color="#22c55e"
  data-position="bottom-right"
></script>
```

## Supported loader attributes

- `data-tenant-slug`
- `data-brand-name`
- `data-headline`
- `data-subheadline`
- `data-button-label`
- `data-accent-color`
- `data-position` (`bottom-right` or `bottom-left`)
- `data-host-url` (optional alternate asset host)
- `data-width` (optional modal width)
- `data-height` (optional modal height)

## Local test steps

1. Start the Vite app.
2. Open `http://localhost:5173/widget-host.html`.
3. Confirm the branded shell renders.
4. Open any local HTML page and paste the loader snippet.
5. Confirm the launcher button appears and opens the modal.
6. Confirm close button and overlay click both dismiss the modal.

## Acceptance criteria

- Widget loads with zero React/router changes
- Launcher button is visible and clickable
- Modal iframe opens correctly
- Shell reads and applies brand config from URL params passed by loader
- Close interactions work on desktop and mobile
- Mobile launcher stretches full width near the bottom

## Next slice

Replace the static shell panel in `widget-host.html` with the live upload + lead capture flow currently used in the home funnel.
