/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fashion: {
          purple: '#a855f7',
          pink: '#ec4899',
          dark: '#0f0f1a',
        },
      },
    },
  },
  plugins: [],
}
