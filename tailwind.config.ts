import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { 50:"#eef2ff",100:"#e0e7ff",200:"#c7d2fe",300:"#a5b4fc",400:"#818cf8",500:"#6366f1",600:"#4f46e5",700:"#4338ca",800:"#3730a3",900:"#1e1b4b",950:"#0f0d2e" },
        navy: "#0B123B"
      },
      boxShadow: { soft: "0 8px 30px rgba(30,27,75,.08)", card: "0 2px 12px rgba(15,23,42,.06)" },
      borderRadius: { xl2: "1.25rem" }
    }
  },
  plugins: []
};
export default config;
