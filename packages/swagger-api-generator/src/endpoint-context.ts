import { toCamelCase, toPascalCase } from "./naming";
import type {
  ApiEndpointModel,
  ApiGeneratedGroup,
  ApiGeneratorRequestConfig,
  ApiParameterModel,
  ApiTemplateContext,
  ApiTemplateEndpointContext,
} from "./types";

export const createTemplateContext = (
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

export const createEndpointContext = (
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

export const normalizeFunctionName = (endpoint: ApiEndpointModel): string => {
  if (endpoint.functionName) {
    return toCamelCase(endpoint.functionName);
  }

  if (endpoint.operationId) {
    return toCamelCase(endpoint.operationId);
  }

  return toCamelCase(`${endpoint.method}-${endpoint.path}`);
};

export const filterParameters = (
  endpoint: ApiEndpointModel,
  location: "header" | "path" | "query",
): readonly ApiParameterModel[] =>
  endpoint.parameters.filter((parameter) => parameter.in === location);

export const hasRequiredParameter = (
  parameters: readonly ApiParameterModel[],
): boolean => parameters.some((parameter) => parameter.required);
