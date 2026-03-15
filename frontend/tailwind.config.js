/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        teal: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        nepal: {
          red:  '#DC143C',
          blue: '#003893',
        },
        health: {
          high:   '#ef4444',
          medium: '#f59e0b',
          low:    '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.5s ease-out',
        'count-up':   'countUp 0.6s ease-out',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.455,0.03,0.515,0.955) infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        countUp:   { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseRing: {
          '0%':   { transform: 'scale(0.8)', opacity: 1 },
          '50%':  { transform: 'scale(1.2)', opacity: 0.5 },
          '100%': { transform: 'scale(0.8)', opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-teal':   '0 0 20px rgba(13, 148, 136, 0.3)',
        'glow-red':    '0 0 20px rgba(239, 68, 68, 0.25)',
        'glow-amber':  '0 0 20px rgba(245, 158, 11, 0.25)',
        'glow-green':  '0 0 20px rgba(16, 185, 129, 0.25)',
      },
    },
  },
  plugins: [],
}
