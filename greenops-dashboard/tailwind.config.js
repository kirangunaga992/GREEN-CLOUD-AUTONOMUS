/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bgPrimary: "#0B0F14",
        panel: "#11161D",
        borderSubtle: "#1F2933",
        greenAccent: "#22C55E",
        yellowAccent: "#FACC15",
        redAccent: "#EF4444",
        blueAccent: "#3B82F6"
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "sans-serif"]
      }
    }
  },
  plugins: []
}
