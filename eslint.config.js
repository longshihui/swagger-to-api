import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".cache/**",
      "dist/**",
      "coverage/**",
      "docs/.vitepress/.temp/**",
      "docs/.vitepress/cache/**",
      "docs/.vitepress/dist/**",
      "packages/swagger-to-api-playground/generated-api/**",
      "packages/swagger-to-api-playground/swagger-docs/**",
      "**/*.tsbuildinfo",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.node,
      sourceType: "module",
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
);
