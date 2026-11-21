/** @type {import('tailwindcss').Config} */
// Tariff colour tokens are used everywhere so the same slot always has the same colour.
// solar = green, normal = grey/blue, peak = red/orange, offpeak = indigo.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        solar: { DEFAULT: '#16a34a', light: '#dcfce7', dark: '#166534' },
        normal: { DEFAULT: '#64748b', light: '#e2e8f0', dark: '#334155' },
        peak: { DEFAULT: '#ea580c', light: '#ffedd5', dark: '#9a3412' },
        offpeak: { DEFAULT: '#4f46e5', light: '#e0e7ff', dark: '#3730a3' },
      },
    },
  },
  plugins: [],
}
