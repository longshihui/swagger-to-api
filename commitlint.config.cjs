module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "root",
        "shared",
        "swagger-api-generator",
        "swagger-api-ui-generator",
        "swagger-to-api-cli",
        "deps",
        "docs",
      ],
    ],
  },
};
