import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@cm/shared": fileURLToPath(
        new URL("./packages/shared/src/index.ts", import.meta.url),
      ),
      "@cm/swagger-api-generator": fileURLToPath(
        new URL(
          "./packages/swagger-api-generator/src/index.ts",
          import.meta.url,
        ),
      ),
      "@cm/swagger-api-ui-generator": fileURLToPath(
        new URL(
          "./packages/swagger-api-ui-generator/src/index.ts",
          import.meta.url,
        ),
      ),
      "@cm/swagger-to-api-cli": fileURLToPath(
        new URL("./packages/swagger-to-api-cli/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["packages/**/__tests__/**/*.test.ts"],
  },
});
