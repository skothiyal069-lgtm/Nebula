/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#0D0D0D',
          charcoal: '#1A1A1A',
          gray: '#262626',
          orange: '#FF5500',
          amber: '#802000',
          gold: '#FFB300'
        }
      },
      boxShadow: {
        'glow-orange': '0 0 15px rgba(255, 85, 0, 0.45)',
        'glow-orange-lg': '0 0 25px rgba(255, 85, 0, 0.65)',
        'glow-amber': '0 0 15px rgba(128, 32, 0, 0.45)',
        'glow-green': '0 0 12px rgba(16, 185, 129, 0.55)'
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 4s linear infinite',
      }
    },
  },
  plugins: [],
}
