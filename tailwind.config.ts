import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#111111",
        muted: "#717171",
        border: "#eeeeee",
        surface: "#f7f7f7",
        accent: {
          DEFAULT: "#f97316",
          soft: "#fff7ed",
        },
      },
      borderRadius: {
        card: "22px",
        panel: "28px",
        button: "999px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      spacing: {
        "page-desktop": "40px",
        "page-mobile": "20px",
      },
    },
  },
  plugins: [],
};

export default config;
