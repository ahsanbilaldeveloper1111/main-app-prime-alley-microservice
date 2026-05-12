import js from "@eslint/js";

const eslintConfig = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        process: "readonly",
        globalThis: "readonly",
        sessionStorage: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        URLSearchParams: "readonly",
        URL: "readonly",
        Blob: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        atob: "readonly",
        btoa: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-empty": "off",
      "no-prototype-builtins": "off",
      "no-undef": "off",
      "no-redeclare": "off",
      "no-irregular-whitespace": "off",
      "no-useless-escape": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".vite/**",
      "build/**",
      ".next/**",
      "coverage/**",
      "public/**",
      "scripts/**",
      "src/assets/js/**",
      "**/*.min.js",
    ],
  },
];

export default eslintConfig;
