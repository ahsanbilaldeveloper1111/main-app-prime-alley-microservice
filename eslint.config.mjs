import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-html-link-for-pages": "off",
      "react-hooks/exhaustive-deps": "off",
      "prefer-const": "off",
      "react/jsx-key": "off",
      "react/no-children-prop": "off",
      "react/display-name": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-implicit-any-catch": "off",
      "@typescript-eslint/no-implicit-any": "off"
    }
  }
];

export default eslintConfig;
