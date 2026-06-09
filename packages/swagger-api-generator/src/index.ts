import { definePackageMetadata } from "@cm/shared";
import type { PackageMetadata } from "@cm/shared";

export const swaggerApiGeneratorMetadata: PackageMetadata =
  definePackageMetadata({
    name: "@cm/swagger-api-generator",
    description: "API 文件生成器",
  });

export {
  createTypeLiteralFromSchema,
  generateApiCode,
  selectApiResponse,
} from "./generator";
export { convertOpenApiDocumentToEndpoints } from "./openapi";
export type {
  ApiEndpointModel,
  ApiGeneratedGroup,
  ApiGeneratorRequestConfig,
  ApiGeneratorTemplates,
  ApiParameterLocation,
  ApiParameterModel,
  ApiResponseModel,
  ApiSchemaModel,
  ApiSchemaPrimitiveType,
  ApiTemplateContext,
  ApiTemplateEndpointContext,
  ApiTemplateImportModel,
  GenerateApiCodeOptions,
  GenerateApiCodeResult,
  GeneratedApiFile,
  HttpMethod,
} from "./types";
export { ApiGeneratorError } from "./types";
