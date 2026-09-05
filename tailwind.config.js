/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7F2",
        "cream-deep": "#F4EDE4",
        surface: "#FFFFFF",
        ink: "#2B2422",
        muted: "#7A6C64",
        line: "#E9E0D6",
        rose: "#A96B76",
        "rose-deep": "#8E545F",
        "rose-soft": "#EFDCDF",
        gold: "#B99A6B",
        "gold-soft": "#EADCC4",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Jost"', '"Century Gothic"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(43,36,34,.04), 0 8px 24px -10px rgba(43,36,34,.10)",
        lift: "0 2px 4px rgba(43,36,34,.05), 0 18px 40px -16px rgba(43,36,34,.18)",
        modal: "0 40px 80px -24px rgba(43,36,34,.35)",
      },
      borderRadius: {
        card: "18px",
      },
      animation: {
        "fade-up": "fadeUp .6s cubic-bezier(.22,.61,.36,1) both",
        "fade-in": "fadeIn .5s ease both",
        "scale-in": "scaleIn .45s cubic-bezier(.22,.61,.36,1) both",
        "slide-left": "slideLeft .45s cubic-bezier(.22,.61,.36,1) both",
        "slide-right": "slideRight .45s cubic-bezier(.22,.61,.36,1) both",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        slideLeft: {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideRight: {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".55" },
        },
      },
    },
  },
  plugins: [],
};
