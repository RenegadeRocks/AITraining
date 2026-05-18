import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          50: "#f7f8fa",
          100: "#eef0f4",
          200: "#dde1e9",
          300: "#bcc3d0",
          400: "#8d97a8",
          500: "#5e6a7f",
          600: "#404a5d",
          700: "#2b3242",
          800: "#1a1f2c",
          900: "#0e121b",
        },
        accent: {
          50: "#eef4ff",
          100: "#dde9ff",
          200: "#b9d2ff",
          300: "#8eb4ff",
          400: "#5d8eff",
          500: "#3a6bff",
          600: "#2750e6",
          700: "#1f3eb8",
          800: "#1d358c",
          900: "#1c2f6e",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
