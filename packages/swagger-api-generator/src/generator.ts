import {
  formatPropertyAccess,
  toCamelCase,
  toKebabCase,
  toPascalCase,
} from "./naming";
import {
  createParameterInterface,
  createSchemaDeclaration,
  schemaToType,
  type TypeDeclarationModel,
} from "./schema";
import type {
  ApiEndpointModel,
  ApiGeneratedGroup,
  ApiGeneratorRequestConfig,
  ApiResponseModel,
  ApiSchemaModel,
  ApiTemplateContext,
  ApiTemplateEndpointContext,
  GenerateApiCodeOptions,
  GenerateApiCodeResult,
} from "./types";
import { ApiGeneratorError } from "./types";

const DEFAULT_REQUEST_CONFIG: ApiGeneratorRequestConfig = {
  importFrom: "@cm/shared-http",
  clientName: "request",
};

const RESPONSE_PRIORITY = ["200", "201", "default"];

export const generateApiCode = (
  options: GenerateApiCodeOptions,
): GenerateApiCodeResult => {
  const request = createRequestConfig(options.request);
  const groups = groupEndpoints(options);
  validateGroups(groups);

  const files = groups.flatMap((group) => {
    const context = createTemplateContext(group, request);

    return [
      {
        path: `${group.directoryName}/types.ts`,
        content:
          options.templates?.typeFile?.(context) ??
          createDefaultTypeFile(context),
      },
      {
        path: `${group.directoryName}/api.ts`,
        content:
          options.templates?.apiFile?.(context) ??
          createDefaultApiFile(context),
      },
    ];
  });

  files.push({
    path: "index.ts",
    content:
      options.templates?.indexFile?.(groups) ?? createDefaultIndexFile(groups),
  });

  return {
    files,
    groups,
  };
};

export const selectApiResponse = (
  endpoint: ApiEndpointModel,
): ApiResponseModel => {
  for (const statusCode of RESPONSE_PRIORITY) {
    const response = endpoint.responses.find(
      (item) => item.statusCode === statusCode && item.schema !== undefined,
    );

    if (response) {
      return response;
    }
  }

  const response = endpoint.responses.find((item) => item.schema !== undefined);

  if (!response) {
    throw new ApiGeneratorError(
      `接口 ${endpoint.id} 缺少可用于生成类型的 response schema`,
    );
  }

  return response;
};

const createRequestConfig = (
  request?: Partial<ApiGeneratorRequestConfig>,
): ApiGeneratorRequestConfig => ({
  importFrom: request?.importFrom ?? DEFAULT_REQUEST_CONFIG.importFrom,
  clientName: request?.clientName ?? DEFAULT_REQUEST_CONFIG.clientName,
  ...(request?.unwrapData === undefined
    ? {}
    : { unwrapData: request.unwrapData }),
});

const groupEndpoints = (
  options: GenerateApiCodeOptions,
): readonly ApiGeneratedGroup[] => {
  const defaultGroupName = options.defaultGroupName ?? "default";
  const groupMap = new Map<string, ApiEndpointModel[]>();

  for (const endpoint of options.endpoints) {
    const groupName = endpoint.tags[0] ?? defaultGroupName;
    const endpoints = groupMap.get(groupName) ?? [];
    endpoints.push(endpoint);
    groupMap.set(groupName, endpoints);
  }

  return Array.from(groupMap.entries()).map(([groupName, endpoints]) => ({
    groupName,
    directoryName: toKebabCase(groupName),
    endpoints,
  }));
};

const validateGroups = (groups: readonly ApiGeneratedGroup[]): void => {
  for (const group of groups) {
    const functionNames = new Set<string>();
    const typeDeclarations = new Map<string, string>();

    for (const endpoint of group.endpoints) {
      const functionName = normalizeFunctionName(endpoint);

      if (functionNames.has(functionName)) {
        throw new ApiGeneratorError(
          `分组 ${group.groupName} 存在重复函数名 ${functionName}`,
        );
      }
      functionNames.add(functionName);

      validatePathParameters(endpoint);
      selectApiResponse(endpoint);

      const context = createEndpointContext(endpoint);
      const declarations = createEndpointTypeDeclarations(endpoint, context);

      for (const declaration of declarations) {
        const previousContent = typeDeclarations.get(declaration.name);

        if (previousContent && previousContent !== declaration.content) {
          throw new ApiGeneratorError(
            `分组 ${group.groupName} 存在冲突类型名 ${declaration.name}`,
          );
        }

        typeDeclarations.set(declaration.name, declaration.content);
      }
    }
  }
};

const validatePathParameters = (endpoint: ApiEndpointModel): void => {
  const pathParameters = endpoint.parameters.filter(
    (parameter) => parameter.in === "path",
  );

  for (const parameter of pathParameters) {
    const openApiPathPattern = `{${parameter.name}}`;
    const expressPathPattern = `:${parameter.name}`;

    if (
      !endpoint.path.includes(openApiPathPattern) &&
      !endpoint.path.includes(expressPathPattern)
    ) {
      throw new ApiGeneratorError(
        `接口 ${endpoint.id} 的 path 参数 ${parameter.name} 未出现在 URL 中`,
      );
    }
  }
};

const createTemplateContext = (
  group: ApiGeneratedGroup,
  request: ApiGeneratorRequestConfig,
): ApiTemplateContext => {
  const endpointContexts = group.endpoints.map(createEndpointContext);
  const imports = [
    {
      names: [request.clientName],
      from: request.importFrom,
    },
  ];

  return {
    groupName: group.groupName,
    endpoints: group.endpoints,
    request,
    imports,
    endpointContexts,
  };
};

const createEndpointContext = (
  endpoint: ApiEndpointModel,
): ApiTemplateEndpointContext => {
  const functionName = normalizeFunctionName(endpoint);
  const typeNamePrefix = toPascalCase(functionName);
  const pathParameters = filterParameters(endpoint, "path");
  const queryParameters = filterParameters(endpoint, "query");
  const headerParameters = filterParameters(endpoint, "header");
  return {
    endpoint,
    functionName,
    responseTypeName: `${typeNamePrefix}Response`,
    ...(pathParameters.length === 0
      ? {}
      : { pathTypeName: `${typeNamePrefix}PathParams` }),
    ...(queryParameters.length === 0
      ? {}
      : { queryTypeName: `${typeNamePrefix}QueryParams` }),
    ...(headerParameters.length === 0
      ? {}
      : { headerTypeName: `${typeNamePrefix}HeaderParams` }),
    ...(endpoint.requestBody === undefined
      ? {}
      : {
          requestBodyTypeName: endpoint.requestBody.name
            ? toPascalCase(endpoint.requestBody.name)
            : `${typeNamePrefix}RequestBody`,
        }),
  };
};

const createDefaultTypeFile = (context: ApiTemplateContext): string => {
  const declarations = new Map<string, string>();

  for (const endpointContext of context.endpointContexts) {
    const endpointDeclarations = createEndpointTypeDeclarations(
      endpointContext.endpoint,
      endpointContext,
    );

    for (const declaration of endpointDeclarations) {
      if (!declarations.has(declaration.name)) {
        declarations.set(declaration.name, declaration.content);
      }
    }
  }

  return [
    createGeneratedFileHeader(),
    ...Array.from(declarations.values()),
    "",
  ].join("\n\n");
};

const createEndpointTypeDeclarations = (
  endpoint: ApiEndpointModel,
  context: ApiTemplateEndpointContext,
): readonly TypeDeclarationModel[] => {
  const declarations: TypeDeclarationModel[] = [];
  const pathParameters = filterParameters(endpoint, "path");
  const queryParameters = filterParameters(endpoint, "query");
  const headerParameters = filterParameters(endpoint, "header");

  if (context.pathTypeName) {
    declarations.push(
      createParameterInterface(context.pathTypeName, pathParameters),
    );
  }

  if (context.queryTypeName) {
    declarations.push(
      createParameterInterface(context.queryTypeName, queryParameters),
    );
  }

  if (context.headerTypeName) {
    declarations.push(
      createParameterInterface(context.headerTypeName, headerParameters),
    );
  }

  if (endpoint.requestBody && context.requestBodyTypeName) {
    declarations.push(
      ...createSchemaDeclarations(
        context.requestBodyTypeName,
        endpoint.requestBody,
      ),
    );
  }

  const response = selectApiResponse(endpoint);
  if (response.schema) {
    declarations.push(
      ...createSchemaDeclarations(context.responseTypeName, response.schema),
    );
  }

  return declarations;
};

const createSchemaDeclarations = (
  typeName: string,
  schema: ApiSchemaModel,
): readonly TypeDeclarationModel[] => {
  const declarations = new Map<string, string>();

  for (const namedSchema of collectNamedSchemas(schema)) {
    const namedSchemaTypeName = toPascalCase(namedSchema.name);
    const declaration = createSchemaDeclaration(
      namedSchemaTypeName,
      namedSchema,
    );
    declarations.set(declaration.name, declaration.content);
  }

  const rootDeclaration = createSchemaDeclaration(typeName, schema);
  declarations.set(rootDeclaration.name, rootDeclaration.content);

  return Array.from(declarations.entries()).map(([name, content]) => ({
    name,
    content,
  }));
};

const collectNamedSchemas = (
  schema: ApiSchemaModel,
): readonly (ApiSchemaModel & Required<Pick<ApiSchemaModel, "name">>)[] => {
  const schemas: ApiSchemaModel[] = [];
  collectNamedSchemaInto(schema, schemas);
  return schemas.filter(hasSchemaName);
};

const collectNamedSchemaInto = (
  schema: ApiSchemaModel,
  schemas: ApiSchemaModel[],
): void => {
  if (schema.name) {
    schemas.push(schema);
  }

  for (const childSchema of getChildSchemas(schema)) {
    collectNamedSchemaInto(childSchema, schemas);
  }
};

const getChildSchemas = (schema: ApiSchemaModel): readonly ApiSchemaModel[] => {
  const children: ApiSchemaModel[] = [];

  if (schema.items) {
    children.push(schema.items);
  }

  if (schema.additionalProperties && schema.additionalProperties !== true) {
    children.push(schema.additionalProperties);
  }

  if (schema.properties) {
    children.push(...Object.values(schema.properties));
  }

  children.push(...(schema.allOf ?? []));
  children.push(...(schema.anyOf ?? []));
  children.push(...(schema.oneOf ?? []));

  return children;
};

const hasSchemaName = (
  schema: ApiSchemaModel,
): schema is ApiSchemaModel & Required<Pick<ApiSchemaModel, "name">> =>
  schema.name !== undefined && schema.name !== "";

const createDefaultApiFile = (context: ApiTemplateContext): string => {
  const typeNames = context.endpointContexts.flatMap((endpointContext) =>
    [
      endpointContext.pathTypeName,
      endpointContext.queryTypeName,
      endpointContext.headerTypeName,
      endpointContext.requestBodyTypeName,
      endpointContext.responseTypeName,
    ].filter((typeName): typeName is string => typeName !== undefined),
  );

  return [
    createGeneratedFileHeader(),
    `import { ${context.request.clientName} } from "${context.request.importFrom}";`,
    `import type {\n${[...new Set(typeNames)]
      .sort()
      .map((typeName) => `  ${typeName},`)
      .join("\n")}\n} from "./types";`,
    "",
    context.endpointContexts.map(createRequestFunction).join("\n\n"),
    "",
  ].join("\n");
};

const createRequestFunction = (context: ApiTemplateEndpointContext): string => {
  const parameters = createFunctionParameters(context);
  const requestProperties = createRequestProperties(context);

  return [
    createEndpointJsDoc(context.endpoint),
    `export function ${context.functionName}(${parameters.join(", ")}): Promise<${context.responseTypeName}> {`,
    `  return request<${context.responseTypeName}>({`,
    requestProperties.map((property) => `    ${property},`).join("\n"),
    "  });",
    "}",
  ]
    .filter((line) => line !== "")
    .join("\n");
};

const createFunctionParameters = (
  context: ApiTemplateEndpointContext,
): readonly string[] => {
  const parameters: string[] = [];
  const endpoint = context.endpoint;
  const queryParameters = filterParameters(endpoint, "query");
  const headerParameters = filterParameters(endpoint, "header");

  if (context.pathTypeName) {
    parameters.push(`path: ${context.pathTypeName}`);
  }

  if (context.queryTypeName) {
    parameters.push(
      `query${hasRequiredParameter(queryParameters) ? "" : "?"}: ${context.queryTypeName}`,
    );
  }

  if (context.requestBodyTypeName) {
    parameters.push(
      `body${endpoint.requestBodyRequired === true ? "" : "?"}: ${context.requestBodyTypeName}`,
    );
  }

  if (context.headerTypeName) {
    parameters.push(
      `headers${hasRequiredParameter(headerParameters) ? "" : "?"}: ${context.headerTypeName}`,
    );
  }

  return parameters;
};

const createRequestProperties = (
  context: ApiTemplateEndpointContext,
): readonly string[] => {
  const properties = [
    `url: ${createUrlExpression(context.endpoint)}`,
    `method: "${context.endpoint.method}"`,
  ];

  if (context.queryTypeName) {
    properties.push("params: query");
  }

  if (context.requestBodyTypeName) {
    properties.push("data: body");
  }

  if (context.headerTypeName) {
    properties.push("headers");
  }

  return properties;
};

const createUrlExpression = (endpoint: ApiEndpointModel): string => {
  const pathParameters = filterParameters(endpoint, "path");

  if (pathParameters.length === 0) {
    return JSON.stringify(endpoint.path);
  }

  const templatePath = pathParameters.reduce(
    (currentPath, parameter) =>
      currentPath
        .replaceAll(
          `{${parameter.name}}`,
          `\${${formatPropertyAccess("path", parameter.name)}}`,
        )
        .replaceAll(
          `:${parameter.name}`,
          `\${${formatPropertyAccess("path", parameter.name)}}`,
        ),
    endpoint.path,
  );

  return `\`${templatePath}\``;
};

const createEndpointJsDoc = (endpoint: ApiEndpointModel): string => {
  const lines = [endpoint.summary, endpoint.description].filter(
    (line): line is string => line !== undefined && line !== "",
  );

  if (lines.length === 0) {
    return "";
  }

  return ["/**", ...lines.map((line) => ` * ${line}`), " */"].join("\n");
};

const createDefaultIndexFile = (
  groups: readonly ApiGeneratedGroup[],
): string => {
  const exports = groups.flatMap((group) => [
    `export * from "./${group.directoryName}/api";`,
    `export * from "./${group.directoryName}/types";`,
  ]);

  return [createGeneratedFileHeader(), ...exports, ""].join("\n");
};

const normalizeFunctionName = (endpoint: ApiEndpointModel): string => {
  if (endpoint.functionName) {
    return toCamelCase(endpoint.functionName);
  }

  if (endpoint.operationId) {
    return toCamelCase(endpoint.operationId);
  }

  return toCamelCase(`${endpoint.method}-${endpoint.path}`);
};

const filterParameters = (
  endpoint: ApiEndpointModel,
  location: "header" | "path" | "query",
): readonly ApiEndpointModel["parameters"][number][] =>
  endpoint.parameters.filter((parameter) => parameter.in === location);

const hasRequiredParameter = (
  parameters: readonly ApiEndpointModel["parameters"][number][],
): boolean => parameters.some((parameter) => parameter.required);

const createGeneratedFileHeader = (): string =>
  [
    "/* eslint-disable */",
    "/* 该文件由 @cm/swagger-api-generator 自动生成，请勿手动修改。 */",
  ].join("\n");

export const createTypeLiteralFromSchema = schemaToType;
