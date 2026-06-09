export type HttpMethod =
  | "delete"
  | "get"
  | "head"
  | "options"
  | "patch"
  | "post"
  | "put"
  | "trace";

export type ApiParameterLocation = "cookie" | "header" | "path" | "query";

export type ApiSchemaPrimitiveType =
  | "array"
  | "boolean"
  | "integer"
  | "null"
  | "number"
  | "object"
  | "string";

export interface ApiSchemaModel {
  readonly name?: string;
  readonly type?: ApiSchemaPrimitiveType;
  readonly description?: string;
  readonly example?: unknown;
  readonly enum?: readonly unknown[];
  readonly nullable?: boolean;
  readonly properties?: Readonly<Record<string, ApiSchemaModel>>;
  readonly required?: readonly string[];
  readonly items?: ApiSchemaModel;
  readonly additionalProperties?: boolean | ApiSchemaModel;
  readonly allOf?: readonly ApiSchemaModel[];
  readonly anyOf?: readonly ApiSchemaModel[];
  readonly oneOf?: readonly ApiSchemaModel[];
}

export interface ApiParameterModel {
  readonly name: string;
  readonly in: ApiParameterLocation;
  readonly required: boolean;
  readonly description?: string;
  readonly example?: unknown;
  readonly schema: ApiSchemaModel;
}

export interface ApiResponseModel {
  readonly statusCode: string;
  readonly description?: string;
  readonly schema?: ApiSchemaModel;
  readonly examples?: Readonly<Record<string, unknown>>;
}

export interface ApiEndpointModel {
  readonly id: string;
  readonly operationId: string;
  readonly functionName: string;
  readonly summary?: string;
  readonly description?: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly tags: readonly string[];
  readonly parameters: readonly ApiParameterModel[];
  readonly requestBody?: ApiSchemaModel;
  readonly requestBodyRequired?: boolean;
  readonly responses: readonly ApiResponseModel[];
}

export interface ApiGeneratorRequestConfig {
  readonly importFrom: string;
  readonly clientName: string;
  readonly unwrapData?: boolean;
}

export interface ApiTemplateImportModel {
  readonly names: readonly string[];
  readonly from: string;
  readonly typeOnly?: boolean;
}

export interface ApiTemplateEndpointContext {
  readonly endpoint: ApiEndpointModel;
  readonly functionName: string;
  readonly responseTypeName: string;
  readonly pathTypeName?: string;
  readonly queryTypeName?: string;
  readonly headerTypeName?: string;
  readonly requestBodyTypeName?: string;
}

export interface ApiTemplateContext {
  readonly groupName: string;
  readonly endpoints: readonly ApiEndpointModel[];
  readonly request: ApiGeneratorRequestConfig;
  readonly imports: readonly ApiTemplateImportModel[];
  readonly endpointContexts: readonly ApiTemplateEndpointContext[];
}

export interface ApiGeneratorTemplates {
  readonly apiFile?: (context: ApiTemplateContext) => string;
  readonly typeFile?: (context: ApiTemplateContext) => string;
  readonly indexFile?: (groups: readonly ApiGeneratedGroup[]) => string;
}

export interface GenerateApiCodeOptions {
  readonly endpoints: readonly ApiEndpointModel[];
  readonly request?: Partial<ApiGeneratorRequestConfig>;
  readonly groupBy?: "tag";
  readonly defaultGroupName?: string;
  readonly templates?: ApiGeneratorTemplates;
}

export interface GeneratedApiFile {
  readonly path: string;
  readonly content: string;
}

export interface ApiGeneratedGroup {
  readonly groupName: string;
  readonly directoryName: string;
  readonly endpoints: readonly ApiEndpointModel[];
}

export interface GenerateApiCodeResult {
  readonly files: readonly GeneratedApiFile[];
  readonly groups: readonly ApiGeneratedGroup[];
}

export class ApiGeneratorError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ApiGeneratorError";
  }
}
