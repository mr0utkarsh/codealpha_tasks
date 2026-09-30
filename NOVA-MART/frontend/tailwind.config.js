/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.125rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1320px',
      },
    },
    extend: {
      colors: {
        // NOVA MART primary - a refined indigo/violet used for accents only.
        brand: {
          50: '#F4F3FF',
          100: '#EBE8FF',
          200: '#D9D3FF',
          300: '#BBAEFF',
          400: '#9A85FF',
          500: '#7C5CFF',
          600: '#6538F5',
          700: '#5527D6',
          800: '#4720AC',
          900: '#3B1F87',
          950: '#231052',
        },
        ink: {
          50: '#F7F7F8',
          100: '#EDEDF1',
          200: '#D9D9E0',
          300: '#B9B9C4',
          400: '#8C8C9B',
          500: '#6E6E7C',
          600: '#565663',
          700: '#43434D',
          800: '#2A2A32',
          900: '#17171C',
          950: '#0B0B0F',
        },
        canvas: {
          light: '#FAFAF9',
          dark: '#08080B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: [
          '"Plus Jakarta Sans"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 24, 40, 0.04), 0 12px 32px -14px rgba(16, 24, 40, 0.12)',
        card: '0 1px 3px rgba(16, 24, 40, 0.05), 0 18px 40px -22px rgba(16, 24, 40, 0.18)',
        lift: '0 28px 60px -28px rgba(16, 24, 40, 0.32)',
        inset: 'inset 0 0 0 1px rgba(16, 24, 40, 0.06)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)' },
          '60%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.35s ease-out both',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-right': 'slide-in-right 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        pop: 'pop 0.3s ease-out both',
        float: 'float 4s ease-in-out infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
