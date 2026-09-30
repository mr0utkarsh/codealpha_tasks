/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce7fd',
          200: '#c0d4fc',
          300: '#94b8fa',
          400: '#6192f5',
          500: '#3b71ec',
          600: '#2559d8',
          700: '#1e48b0',
          800: '#203a87',
          900: '#1f3564',
          950: '#17203d',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.08)',
        pop: '0 8px 24px rgba(16,24,40,.12)',
      },
      borderRadius: { xl2: '1.125rem' },
    },
  },
  plugins: [],
};
