/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dojo: {
          dark: '#121212',
          red: '#dc2626',
          gold: '#d97706',
          gray: '#1f2937'
        }
      }
    },
  },
  plugins: [],
}
