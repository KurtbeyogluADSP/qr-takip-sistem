/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#0f172a", // Deep Navy (Background/Text)
          800: "#1e3a8a", // Primary Band Color
          700: "#1d4ed8",
          600: "#2563eb",
          500: "#3b82f6", // Primary Action
          400: "#60a5fa",
          300: "#93c5fd",
          200: "#bfdbfe",
          100: "#dbeafe",
          50: "#eff6ff", // Light Background
        },
      },
    },
  },
  plugins: [],
}
