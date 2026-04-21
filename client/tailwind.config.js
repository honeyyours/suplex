/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#d9e2f0',
          200: '#b3c5e1',
          300: '#8da8d2',
          400: '#5a7fb8',
          500: '#3a5f9e',
          600: '#2a4a80',
          700: '#1e3a66',
          800: '#15294a',
          900: '#0c1a33',
        },
      },
      fontFamily: {
        sans: ['"Pretendard"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
