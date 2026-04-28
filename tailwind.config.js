/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg:        "#000000",
        card:      "#0a0a0a",
        muted:     "#1a1a1a",
        text:      "#ffffff",
        subtle:    "#a1a1aa",
        border:    "rgba(255,255,255,0.10)",
        input:     "rgba(255,255,255,0.05)",

        primary:   "#00ff88",   // neon-green
        secondary: "#6366f1",   // indigo
        accent:    "#8b5cf6",   // purple
        neonblue:  "#06b6d4",
        gold:      "#ffd700",
        danger:    "#ef4444",
        warning:   "#f59e0b",

        // Faction colors (kept compatible with previous code)
        crimson:   "#E11D48",
        azure:     "#2563EB",
        verdant:   "#16A34A",
        amber:     "#F59E0B",
      },
      borderRadius: {
        DEFAULT: "16px",
        sm:      "12px",
        md:      "14px",
        lg:      "16px",
        xl:      "20px",
        "2xl":   "24px",
        "3xl":   "28px",
      },
      fontFamily: {
        sans:    ["System"],
        display: ["System"],
      },
    },
  },
  plugins: [],
};
