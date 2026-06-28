/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        soft: '#DBEAFE',
        deep: '#1E3A8A',
        appbg: '#F5FAFF',
        borderblue: '#D8E7F7'
      },
      borderRadius: { '2xl': '1rem' }
    }
  },
  plugins: []
}
