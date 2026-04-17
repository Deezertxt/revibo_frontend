/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Agregamos "./app/**/*.{ts,tsx}" para que lea tus pantallas
  content: [
    "./App.tsx",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}", // Por si acaso usas una carpeta src
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
