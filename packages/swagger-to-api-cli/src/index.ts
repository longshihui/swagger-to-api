import { definePackageMetadata } from "@cm/shared";
import type { PackageMetadata } from "@cm/shared";

export const swaggerToApiCliMetadata: PackageMetadata = definePackageMetadata({
  name: "@cm/swagger-to-api-cli",
  description: "Swagger To API 命令行工具",
});

export { createCliHelpText, parseCliArgs, runSwaggerToApiCli } from "./cli";
export { loadSwaggerToApiConfig } from "./config";
export { createNodeCliRunner } from "./runner";
export { loadApiEndpoints } from "./source";
export type {
  SwaggerToApiCliCommand,
  SwaggerToApiCliResult,
  SwaggerToApiCliRunner,
  SwaggerToApiConfig,
} from "./types";
export { SwaggerToApiCliError } from "./types";
