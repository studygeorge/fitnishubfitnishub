/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // только класс, системную тему игнорим
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        'fitness-blue': { light: '#93D8FF', DEFAULT: '#4A3BFF' },
        'fitness-white': '#FFFFFF',
        'fitness-gray': '#828282',
        'fitness-dark': '#1D2939',
      },
      borderRadius: { 'fitness': '28px' },
      boxShadow: {
        'fitness': '0 10px 30px rgba(0,0,0,.15)',
        'fitness-hover': '0 15px 40px rgba(0,0,0,.25)',
      },
    },
  },
  plugins: [],
}
