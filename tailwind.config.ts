import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Canvas-specific colors
        "canvas-bg": "hsl(var(--canvas-bg))",
        "toolbar-bg": "hsl(var(--toolbar-bg))",
        "toolbar-border": "hsl(var(--toolbar-border))",
        "tool-active": "hsl(var(--tool-active))",
        "tool-hover": "hsl(var(--tool-hover))",
        // Drawing colors
        "color-red": "hsl(var(--color-red))",
        "color-orange": "hsl(var(--color-orange))",
        "color-yellow": "hsl(var(--color-yellow))",
        "color-green": "hsl(var(--color-green))",
        "color-blue": "hsl(var(--color-blue))",
        "color-purple": "hsl(var(--color-purple))",
        "color-pink": "hsl(var(--color-pink))",
        "color-black": "hsl(var(--color-black))",
        // Duolingo-inspired colors
        "duolingo-green": "hsl(var(--duolingo-green))",
        "duolingo-green-light": "hsl(var(--duolingo-green-light))",
        "duolingo-orange": "hsl(var(--duolingo-orange))",
        "duolingo-blue": "hsl(var(--duolingo-blue))",
        "duolingo-red": "hsl(var(--duolingo-red))",
        "duolingo-purple": "hsl(var(--duolingo-purple))",
        "duolingo-yellow": "hsl(var(--duolingo-yellow))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "shimmer": {
          "0%": {
            "background-position": "200% 0",
          },
          "100%": {
            "background-position": "-200% 0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
