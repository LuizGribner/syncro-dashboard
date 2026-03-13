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
        brand: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          500: "#3b5bdb",
          600: "#2f4ac8",
          700: "#2340b0",
          900: "#0f1f6b",
        },
        surface: {
          0: "#ffffff",
          50: "#f8f9fc",
          100: "#f0f2f8",
          200: "#e2e6f0",
          800: "#1a1f36",
          900: "#0d1117",
        }
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
