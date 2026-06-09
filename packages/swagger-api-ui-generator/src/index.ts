import { definePackageMetadata } from "@cm/shared";
import type { PackageMetadata } from "@cm/shared";

export const swaggerApiUiGeneratorMetadata: PackageMetadata =
  definePackageMetadata({
    name: "@cm/swagger-api-ui-generator",
    description: "API 文档 UI 生成器",
  });

export { generateApiDocs } from "./generator";
export type {
  ApiDocsGeneratedEndpoint,
  ApiDocsGeneratedGroup,
  ApiDocsGeneratorTemplates,
  ApiDocsSearchItem,
  GenerateApiDocsOptions,
  GenerateApiDocsResult,
  GeneratedApiDocsFile,
} from "./types";
export { ApiDocsGeneratorError } from "./types";
