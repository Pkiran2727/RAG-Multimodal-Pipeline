/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {   // Green
          50: '#f0fdf4', 400: '#4ade80',
          500: '#22c55e', 600: '#16a34a', 700: '#15803d'
        },
        accent: {    // Violet
          50: '#f5f3ff', 400: '#a78bfa',
          500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9'
        },
        surface: {   // Dark base for dashboard
          900: '#0a0f0a', 800: '#111a11', 700: '#1a2b1a'
        }
      },
      boxShadow: {
        'glow-green':  '0 0 20px rgba(34,197,94,0.25)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.25)',
      }
    },
  },
  plugins: [],
}
