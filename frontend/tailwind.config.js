/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'Cairo', 'system-ui', '-apple-system', 'sans-serif'],
        cairo: ['Cairo', 'sans-serif'],
        tajawal: ['Tajawal', 'sans-serif'],
        luxury: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        // Luxury Clinic & Spa Emerald / Deep Teal Palette
        emerald: {
          950: '#061a14',
          900: '#0b2e24',
          850: '#0d3429',
          800: '#0f3b2c',
          700: '#164e3b',
          600: '#1f6b52',
          500: '#2d8a6b',
          400: '#48aa89',
          100: '#e2f4ed',
          50: '#f0f9f5',
        },
        // Champagne & Imperial Gold Accents
        gold: {
          600: '#b89124',
          500: '#d4af37',
          400: '#dfba53',
          300: '#ebd07a',
          200: '#f5e4ab',
          100: '#faf2d6',
          50: '#fdfaf0',
        },
        // Warm Silk & Stone Backgrounds
        stone: {
          25: '#fdfcf9',
          50: '#fbf9f5',
          100: '#f6f3ed',
          150: '#ede8df',
        },
      },
      boxShadow: {
        'glass': '0 10px 30px -10px rgba(15, 59, 44, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        'luxury-hover': '0 12px 35px -8px rgba(15, 59, 44, 0.12), 0 4px 12px -2px rgba(212, 175, 55, 0.08)',
        'gold': '0 0 20px -3px rgba(212, 175, 55, 0.35)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
}
