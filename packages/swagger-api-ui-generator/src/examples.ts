import type {
  ApiEndpointModel,
  ApiResponseModel,
  ApiSchemaModel,
} from "@lsh/swagger-api-generator";

export const createExampleUrl = (endpoint: ApiEndpointModel): string => {
  const path = endpoint.parameters
    .filter((parameter) => parameter.in === "path")
    .reduce(
      (currentPath, parameter) =>
        currentPath.replaceAll(
          `{${parameter.name}}`,
          encodeURIComponent(
            String(parameter.example ?? createExampleValue(parameter.schema)),
          ),
        ),
      endpoint.path,
    );
  const query = endpoint.parameters.filter(
    (parameter) => parameter.in === "query",
  );

  if (query.length === 0) {
    return path;
  }

  return `${path}?${query
    .map(
      (parameter) =>
        `${encodeURIComponent(parameter.name)}=${encodeURIComponent(String(parameter.example ?? createExampleValue(parameter.schema)))}`,
    )
    .join("&")}`;
};

export const createResponseExample = (response: ApiResponseModel): unknown => {
  const examples = response.examples ? Object.values(response.examples) : [];
  const firstExample = examples[0];

  if (firstExample !== undefined) {
    return firstExample;
  }

  return response.schema ? createExampleValue(response.schema) : {};
};

export const createExampleValue = (schema: ApiSchemaModel): unknown => {
  if (schema.example !== undefined) {
    return schema.example;
  }

  if (schema.enum?.[0] !== undefined) {
    return schema.enum[0];
  }

  if (schema.properties) {
    return Object.fromEntries(
      Object.entries(schema.properties).map(
        ([propertyName, propertySchema]) => [
          propertyName,
          createExampleValue(propertySchema),
        ],
      ),
    );
  }

  switch (schema.type) {
    case "array":
      return [schema.items ? createExampleValue(schema.items) : {}];
    case "boolean":
      return true;
    case "integer":
    case "number":
      return 1;
    case "null":
      return null;
    case "object":
      return {};
    case "string":
      return "string";
    default:
      return schema.name ? {} : null;
  }
};
