/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "ft-bg":     "#0B0F1C",
        "ft-card":   "#141926",
        "ft-nav":    "#0D1120",
        "ft-green":  "#22C55E",
        "ft-amber":  "#F59E0B",
        "ft-red":    "#F87171",
        "ft-purple": "#A78BFA",
        "ft-text":   "#F1F5F9",
        "ft-sub":    "#64748B",
        "ft-sub2":   "#94A3B8",
        "ft-accent": "#4F8EF7",
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
}
