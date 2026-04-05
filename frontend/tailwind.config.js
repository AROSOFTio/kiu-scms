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
          50: '#eefcf4',
          100: '#d7f7e3',
          200: '#b4eccb',
          300: '#81dab0',
          400: '#4bc08d',
          500: '#25a26e',
          600: '#178155', // Primary KIU color ~#008540 is closest to 700/600
          700: '#008540', // Exact Primary
          800: '#12553a',
          900: '#104631',
          950: '#08271c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
