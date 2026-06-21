import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      // 기존 화면들은 prop/URL 변경 시 로컬 폼 상태를 초기화한다.
      // React 19 마이그레이션과 무관한 구조 변경은 별도 작업으로 분리한다.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
