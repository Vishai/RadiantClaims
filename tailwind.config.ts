import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        // Warm earth tone palette
        terracotta: {
          50: "#fdf6f4",
          100: "#fae8e1",
          200: "#f5d1c4",
          300: "#ebb09d",
          400: "#de866c",
          500: "#d4674f",
          600: "#c04a37",
          700: "#a03a2c",
          800: "#853329",
          900: "#6f2e27",
        },
        sage: {
          50: "#f6f7f6",
          100: "#e3e7e3",
          200: "#c7cfc8",
          300: "#a3b0a5",
          400: "#7a8c7e",
          500: "#5f7262",
          600: "#4a594d",
          700: "#3d4a3f",
          800: "#323d34",
          900: "#2b342d",
        },
        cream: {
          50: "#fdfcfb",
          100: "#faf7f3",
          200: "#f5ede3",
          300: "#ede0cf",
          400: "#e3cab1",
          500: "#d8b08f",
          600: "#c89267",
          700: "#b47751",
          800: "#956145",
          900: "#79513c",
        },
        peach: {
          50: "#fef8f5",
          100: "#fceee6",
          200: "#f9d9ca",
          300: "#f4bda4",
          400: "#ed9472",
          500: "#e57150",
          600: "#d35535",
          700: "#b1412a",
          800: "#923827",
          900: "#783225",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
