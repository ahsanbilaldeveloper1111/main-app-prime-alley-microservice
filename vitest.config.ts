import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@query/keys": path.resolve(__dirname, "src/query/keys.ts"),
      "@cti": path.resolve(__dirname, "src/cti/index.ts"),
      "@utils": path.resolve(__dirname, "src/utils"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      include: ["src/cti/**"],
    },
  },
});
