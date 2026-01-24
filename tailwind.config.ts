import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#0B0F15",
          surface: "#131927",
          hover: "#1C2438",
          border: "rgba(255, 255, 255, 0.08)",
        },
        brand: {
          primary: "#8B5CF6",
          secondary: "#3B82F6",
          pink: "#EC4899",
        },
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#06B6D4",
          again: "#F43F5E",
          hard: "#F59E0B",
          good: "#10B981",
          easy: "#06B6D4",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(139, 92, 246, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
