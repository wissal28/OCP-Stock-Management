/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          50: "#f7f8f7",
          100: "#e8ebe8",
          300: "#a9b1aa",
          500: "#627067",
          700: "#313c36",
          900: "#121714"
        },
        mineral: {
          500: "#0f766e",
          600: "#0b635d",
          700: "#084c47"
        },
        saffron: {
          400: "#f4b63f",
          500: "#d89517"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(18, 23, 20, 0.12)"
      },
      fontFamily: {
        sans: [
          "Manrope",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ],
        display: ["Fraunces", "ui-serif", "Georgia", "Cambria", "serif"],
        serif: ["Fraunces", "ui-serif", "Georgia", "Cambria", "serif"]
      }
    }
  },
  plugins: []
};
