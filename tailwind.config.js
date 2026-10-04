/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { brand: { 600: "#4338ca", 700: "#3730a3" } }
    }
  },
  plugins: []
};
