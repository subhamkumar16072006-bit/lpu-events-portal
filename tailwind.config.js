/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A', // Dark background
        primary: '#FF6B00', // Orange accent
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming Inter or similar
      },
    },
  },
  plugins: [],
}
