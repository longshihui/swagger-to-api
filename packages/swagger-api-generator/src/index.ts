import { definePackageMetadata } from "@lsh/shared";
import type { PackageMetadata } from "@lsh/shared";

export const swaggerApiGeneratorMetadata: PackageMetadata =
  definePackageMetadata({
    name: "@lsh/swagger-api-generator",
    description: "API 文件生成器",
  });

export { generateApiCode } from "./generator";
export { convertOpenApiDocumentToEndpoints } from "./openapi";
export { selectApiResponse } from "./response";
export { schemaToType as createTypeLiteralFromSchema } from "./schema";
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
