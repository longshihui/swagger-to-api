import type { SwaggerToApiConfig } from "@lsh/swagger-to-api-cli";

const source = process.env.PLAYGROUND_SWAGGER ?? "./swagger/sample.openapi.json";

export default {
  source,
  output: {
    apiDir: "./generated-api",
    docsDir: "./swagger-docs",
  },
  request: {
    importFrom: "@/shared/http",
    clientName: "request",
  },
  generate: {
    groupBy: "tag",
    operationName: "operationId",
    overwrite: true,
  },
} satisfies SwaggerToApiConfig;
