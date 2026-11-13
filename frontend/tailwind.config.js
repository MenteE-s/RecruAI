/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gray: {
          0: "rgb(var(--gray-00) / <alpha-value>)",
          25: "rgb(var(--gray-25) / <alpha-value>)",
          50: "rgb(var(--gray-50) / <alpha-value>)",
          100: "rgb(var(--gray-100) / <alpha-value>)",
          200: "rgb(var(--gray-200) / <alpha-value>)",
          300: "rgb(var(--gray-300) / <alpha-value>)",
          400: "rgb(var(--gray-400) / <alpha-value>)",
          500: "rgb(var(--gray-500) / <alpha-value>)",
          600: "rgb(var(--gray-600) / <alpha-value>)",
          700: "rgb(var(--gray-700) / <alpha-value>)",
          800: "rgb(var(--gray-800) / <alpha-value>)",
          900: "rgb(var(--gray-900) / <alpha-value>)",
          "1k": "rgb(var(--gray-1k) / <alpha-value>)",
        },
        ink: "rgb(var(--gray-1k) / <alpha-value>)",
        surface: "rgb(var(--gray-00) / <alpha-value>)",
        canvas: "rgb(var(--gray-00) / <alpha-value>)",
        line: "rgb(var(--border) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          text: "rgb(var(--brand-text) / <alpha-value>)",
          action: "rgb(var(--brand-action) / <alpha-value>)",
          border: "rgb(var(--brand-border) / <alpha-value>)",
          underline: "rgb(var(--brand-underline) / <alpha-value>)",
          soft: "rgb(var(--brand) / 0.08)",
        },
        peach: {
          50: "rgb(var(--peach-50) / <alpha-value>)",
          100: "rgb(var(--peach-100) / <alpha-value>)",
          300: "rgb(var(--peach-300) / <alpha-value>)",
        },
      },
      borderColor: {
        DEFAULT: "rgb(var(--border) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['"Geist Variable"', "Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        s5: "0 1px 1px -0.5px rgb(0 0 0 / 0.03), 0 3px 3px -1.5px rgb(0 0 0 / 0.03)",
        s10: "0 1px 1px -0.5px rgb(0 0 0 / 0.03), 0 3px 3px -1.5px rgb(0 0 0 / 0.03), 0 6px 6px -3px rgb(0 0 0 / 0.03)",
        s15:
          "0 1px 1px -0.5px rgb(0 0 0 / 0.03), 0 3px 3px -1.5px rgb(0 0 0 / 0.03), 0 6px 6px -3px rgb(0 0 0 / 0.03), 0 12px 12px -6px rgb(0 0 0 / 0.06), 0 24px 24px -12px rgb(0 0 0 / 0.06)",
        focus: "0 0 0 4px rgb(225 228 232 / 0.5)",
        pop: "0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        popIn: {
          from: { opacity: "0", transform: "scale(0.97) translateY(4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        sheetIn: {
          from: { opacity: "0", transform: "translateY(8px) scale(0.995)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 160ms ease-out",
        popIn: "popIn 140ms ease-out",
        sheetIn: "sheetIn 180ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideUp: "slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};