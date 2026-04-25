/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05070A",
        panel: "#0E1116",
        cyan: "#6AE3FF",
        coral: "#FF6B6B",
        sand: "#F2E8CF"
      },
      boxShadow: {
        glow: "0 0 20px rgba(106, 227, 255, 0.25)",
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
