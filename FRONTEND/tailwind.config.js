/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#FFD700",
        warm: "#C5A000",
        bg: "#050505",
        surface: "#0F0F0B",
        border: "#22221A",
        text: "#FFFFFF",
        muted: "#8E8E82",
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
