/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14171F',
          light: '#2A2E3A',
        },
        paper: '#FAFAF7',
        gold: {
          DEFAULT: '#C08A2E',
          dark: '#9C6F20',
          light: '#E4C078',
        },
        success: '#2F6F4E',
        danger: '#B23A34',
        hairline: '#E4E1D8',
      },
      fontFamily: {
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
