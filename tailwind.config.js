/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/shared/components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}

