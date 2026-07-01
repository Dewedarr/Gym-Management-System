/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gym: {
          bg: 'var(--gym-bg)',
          card: 'var(--gym-card)',
          border: 'var(--gym-border)',
          primary: '#f97316',
          'primary-dark': '#ea580c',
          gold: '#fbbf24',
          green: '#22c55e',
          text: 'var(--gym-text)',
          muted: 'var(--gym-muted)',
        }
      },
      fontFamily: {
        arabic: ['Cairo', 'sans-serif'],
      }
    }
  },
  plugins: []
}
