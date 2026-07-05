import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdaff',
          300: '#8ec3ff',
          400: '#59a1ff',
          500: '#327dfb',
          600: '#1b5ef0',
          700: '#1649dc',
          800: '#183cb2',
          900: '#19388c',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
