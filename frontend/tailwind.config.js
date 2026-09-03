/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-color': '#0F172A', // Midnight Obsidian
        'primary-dark': '#020617',
        'primary-light': '#1E293B',
        'accent-color': '#2563EB', // Sapphire Blue
        'secondary-color': '#64748B', // Cool Slate
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}