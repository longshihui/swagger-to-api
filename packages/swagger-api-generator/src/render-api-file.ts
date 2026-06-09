import { formatPropertyAccess } from "./naming";
import { createGeneratedFileHeader } from "./generated-file";
import { filterParameters, hasRequiredParameter } from "./endpoint-context";
import type { ApiEndpointModel, ApiTemplateEndpointContext } from "./types";
import type { ApiTemplateContext } from "./types";

export const createDefaultApiFile = (context: ApiTemplateContext): string => {
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
