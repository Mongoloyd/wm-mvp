import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",

        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },

        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },

        /* Legacy / compatibility tokens still used in old components */
        obsidian: "var(--color-obsidian)",
        surface: "var(--color-surface)",
        "surface-border": "var(--color-surface-border)",
        cobalt: "var(--color-cobalt)",
        "cobalt-dim": "var(--color-cobalt-dim)",
        "vivid-orange": "var(--color-vivid-orange)",
        "gold-accent": "var(--color-gold-accent)",
        emerald: "var(--color-emerald)",
        danger: "var(--color-danger)",
        gold: "var(--color-gold-accent)",

        /* New WindowMan light-theme tokens */
        "wm-blue": "var(--wm-blue)",
        "wm-orange": "var(--wm-orange)",
        "wm-gold": "var(--wm-gold)",
        "wm-ink": "var(--wm-ink)",
        "wm-ink-soft": "var(--wm-ink-soft)",
      },

      borderRadius: {
        lg: "14px",
        md: "8px",
        sm: "4px",
      },

      fontFamily: {
        sans: ["Barlow", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Barlow", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Barlow Condensed", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 24px rgba(37, 99, 235, 0.06)",
        card: "0 1px 0 rgba(255,255,255,0.65) inset, 0 10px 25px rgba(15, 23, 42, 0.06), 0 18px 44px rgba(37, 99, 235, 0.10)",
        float: "0 1px 0 rgba(255,255,255,0.8) inset, 0 20px 50px rgba(15, 23, 42, 0.08), 0 30px 80px rgba(37, 99, 235, 0.14)",
        focus: "0 0 0 1px rgba(37, 99, 235, 0.14), 0 18px 40px rgba(37, 99, 235, 0.18), 0 0 40px rgba(96, 165, 250, 0.18)",
        "blue-glow": "0 0 0 1px rgba(37, 99, 235, 0.10), 0 12px 34px rgba(37, 99, 235, 0.16), 0 0 50px rgba(96, 165, 250, 0.18)",
        "orange-glow": "0 0 0 1px rgba(249, 115, 22, 0.12), 0 14px 34px rgba(249, 115, 22, 0.18), 0 0 42px rgba(251, 146, 60, 0.16)",
      },

      backgroundImage: {
        "wm-hero-gradient":
          "linear-gradient(180deg, #f8fbff 0%, #eef6ff 48%, #f8fbff 100%)",
        "wm-grid":
          "linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        fadeInUp: {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
            filter: "blur(4px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
            filter: "blur(0)",
          },
        },
        shimmerLight: {
          "0%": { backgroundPosition: "-220% 0" },
          "100%": { backgroundPosition: "220% 0" },
        },
        pulseBorderBlue: {
          "0%, 100%": { borderColor: "rgba(37, 99, 235, 0.14)" },
          "50%": { borderColor: "rgba(37, 99, 235, 0.30)" },
        },
        pulseBorderOrange: {
          "0%, 100%": { borderColor: "rgba(249, 115, 22, 0.14)" },
          "50%": { borderColor: "rgba(249, 115, 22, 0.28)" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float-y": "floatY 6s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "shimmer-light": "shimmerLight 2.5s linear infinite",
        "pulse-border-blue": "pulseBorderBlue 3s ease-in-out infinite",
        "pulse-border-orange": "pulseBorderOrange 3s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
}

export default config
