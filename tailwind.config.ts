import type { Config } from "tailwindcss";

// 디자인 시스템(04_디자인_시스템.md)의 토큰을 Tailwind에 매핑
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
        },
        surface: "#F8FAFC",
        ink: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
        },
        line: "#E2E8F0",
        // 마커/상태 색 (기획서 12번 규칙과 일치)
        marker: {
          danger: "#EF4444",
          warn: "#F97316",
          facility: "#3B82F6",
          env: "#22C55E",
          resolved: "#9CA3AF",
          etc: "#8B5CF6",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "20px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
        float: "0 4px 16px rgba(0,0,0,0.16)",
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
