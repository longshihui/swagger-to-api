import { toCamelCase } from "./naming";
import type {
  ApiEndpointModel,
  ApiParameterLocation,
  ApiParameterModel,
  ApiResponseModel,
  ApiSchemaPrimitiveType,
  ApiSchemaModel,
  HttpMethod,
} from "./types";
import { ApiGeneratorError } from "./types";

type UnknownRecord = Record<string, unknown>;

const HTTP_METHODS = new Set<HttpMethod>([
  "delete",
  "get",
  "head",
  "options",
  "patch",
  "post",
  "put",
  "trace",
]);

const PARAMETER_LOCATIONS = new Set<ApiParameterLocation>([
  "cookie",
  "header",
  "path",
  "query",
]);

const JSON_MEDIA_TYPES = ["application/json", "application/*+json", "*/*"];

export const convertOpenApiDocumentToEndpoints = (
  document: unknown,
): readonly ApiEndpointModel[] => {
  const root = assertRecord(document, "OpenAPI 文档必须是对象");
  const paths = getRecord(root, "paths");

  if (!paths) {
    throw new ApiGeneratorError("OpenAPI 文档缺少 paths 对象");
  }

  const endpoints: ApiEndpointModel[] = [];

  for (const [path, pathItemValue] of Object.entries(paths)) {
    if (!isRecord(pathItemValue)) {
      continue;
    }

    const pathParameters = readParameters(pathItemValue.parameters, root);

    for (const [methodName, operationValue] of Object.entries(pathItemValue)) {
      if (!isHttpMethod(methodName) || !isRecord(operationValue)) {
        continue;
      }

      const operationParameters = readParameters(
        operationValue.parameters,
        root,
      );
      const operationId =
        getString(operationValue, "operationId") ?? `${methodName}-${path}`;
      const summary = getString(operationValue, "summary");
      const description = getString(operationValue, "description");

      const endpointBase = {
        id: `${methodName.toUpperCase()} ${path}`,
        operationId,
        functionName: toCamelCase(operationId),
        method: methodName,
        path,
        tags: readStringArray(operationValue.tags),
        parameters: mergeParameters(pathParameters, operationParameters),
        responses: readResponses(operationValue.responses, root),
      };

      endpoints.push({
        ...endpointBase,
        ...(summary === undefined ? {} : { summary }),
        ...(description === undefined ? {} : { description }),
        ...readRequestBody(operationValue.requestBody, root),
      });
    }
  }

  return endpoints;
};

const readParameters = (
  value: unknown,
  root: UnknownRecord,
): readonly ApiParameterModel[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => readParameter(item, root));
};

const readParameter = (
  value: unknown,
  root: UnknownRecord,
): ApiParameterModel => {
  const parameter = resolveMaybeRef(value, root);
  const name = getString(parameter, "name");
  const location = getString(parameter, "in");
  const description = getString(parameter, "description");

  if (!name || !isParameterLocation(location)) {
    throw new ApiGeneratorError("OpenAPI 参数缺少有效的 name 或 in 字段");
  }

  const schemaValue = parameter.schema;

  return {
    name,
    in: location,
    required: getBoolean(parameter, "required") ?? location === "path",
    schema: convertSchema(schemaValue, root),
    ...(description === undefined ? {} : { description }),
    ...(parameter.example === undefined ? {} : { example: parameter.example }),
  };
};

const readRequestBody = (
  value: unknown,
  root: UnknownRecord,
): Pick<ApiEndpointModel, "requestBody" | "requestBodyRequired"> => {
  if (value === undefined) {
    return {};
  }

  const requestBody = resolveMaybeRef(value, root);
  const schema = readContentSchema(requestBody.content, root);

  if (!schema) {
    return {};
  }

  const requestBodyRequired = getBoolean(requestBody, "required");

  return {
    requestBody: schema,
    ...(requestBodyRequired === undefined ? {} : { requestBodyRequired }),
  };
};

const readResponses = (
  value: unknown,
  root: UnknownRecord,
): readonly ApiResponseModel[] => {
  if (!isRecord(value)) {
    throw new ApiGeneratorError("OpenAPI operation 缺少 responses 对象");
  }

  return Object.entries(value).map(([statusCode, responseValue]) => {
    const response = resolveMaybeRef(responseValue, root);
    const schema = readContentSchema(response.content, root);
    const description = getString(response, "description");

    return {
      statusCode,
      ...(description === undefined ? {} : { description }),
      ...(schema === undefined ? {} : { schema }),
    };
  });
};

const readContentSchema = (
  value: unknown,
  root: UnknownRecord,
): ApiSchemaModel | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  for (const mediaType of JSON_MEDIA_TYPES) {
    const media = getRecord(value, mediaType);
    if (media?.schema !== undefined) {
      return convertSchema(media.schema, root);
    }
  }

  const firstMedia = Object.values(value).find(isRecord);
  if (firstMedia?.schema === undefined) {
    return undefined;
  }

  return convertSchema(firstMedia.schema, root);
};

const convertSchema = (
  value: unknown,
  root: UnknownRecord,
  visitedRefs: readonly string[] = [],
): ApiSchemaModel => {
  if (!isRecord(value)) {
    return {};
  }

  const ref = getString(value, "$ref");
  if (ref) {
    if (visitedRefs.includes(ref)) {
      return {
        name: getRefName(ref),
      };
    }

    return {
      ...convertSchema(resolveRef(ref, root), root, [...visitedRefs, ref]),
      name: getRefName(ref),
    };
  }

  const schemaType = value.type;
  const description = getString(value, "description");
  const nullable = getBoolean(value, "nullable");
  const required = readStringArray(value.required);
  const schema: ApiSchemaModel = {
    ...(isSchemaType(schemaType) ? { type: schemaType } : {}),
    ...(description === undefined ? {} : { description }),
    ...(value.example === undefined ? {} : { example: value.example }),
    ...(Array.isArray(value.enum) ? { enum: value.enum } : {}),
    ...(nullable === undefined ? {} : { nullable }),
    ...(required.length === 0 ? {} : { required }),
    ...(value.items === undefined
      ? {}
      : { items: convertSchema(value.items, root, visitedRefs) }),
    ...readSchemaProperties(value.properties, root, visitedRefs),
    ...readAdditionalProperties(value.additionalProperties, root, visitedRefs),
    ...readSchemaCompositions(value, root, visitedRefs),
  };

  return schema;
};

const readSchemaProperties = (
  value: unknown,
  root: UnknownRecord,
  visitedRefs: readonly string[],
): Pick<ApiSchemaModel, "properties"> => {
  if (!isRecord(value)) {
    return {};
  }

  return {
    properties: Object.fromEntries(
      Object.entries(value).map(([propertyName, propertySchema]) => [
        propertyName,
        convertSchema(propertySchema, root, visitedRefs),
      ]),
    ),
  };
};

const readAdditionalProperties = (
  value: unknown,
  root: UnknownRecord,
  visitedRefs: readonly string[],
): Pick<ApiSchemaModel, "additionalProperties"> => {
  if (typeof value === "boolean") {
    return {
      additionalProperties: value,
    };
  }

  if (isRecord(value)) {
    return {
      additionalProperties: convertSchema(value, root, visitedRefs),
    };
  }

  return {};
};

const readSchemaCompositions = (
  value: UnknownRecord,
  root: UnknownRecord,
  visitedRefs: readonly string[],
): Pick<ApiSchemaModel, "allOf" | "anyOf" | "oneOf"> => ({
  ...(Array.isArray(value.allOf)
    ? {
        allOf: value.allOf.map((item) =>
          convertSchema(item, root, visitedRefs),
        ),
      }
    : {}),
  ...(Array.isArray(value.anyOf)
    ? {
        anyOf: value.anyOf.map((item) =>
          convertSchema(item, root, visitedRefs),
        ),
      }
    : {}),
  ...(Array.isArray(value.oneOf)
    ? {
        oneOf: value.oneOf.map((item) =>
          convertSchema(item, root, visitedRefs),
        ),
      }
    : {}),
});

const mergeParameters = (
  pathParameters: readonly ApiParameterModel[],
  operationParameters: readonly ApiParameterModel[],
): readonly ApiParameterModel[] => {
  const parameterMap = new Map<string, ApiParameterModel>();

  for (const parameter of [...pathParameters, ...operationParameters]) {
    parameterMap.set(`${parameter.in}:${parameter.name}`, parameter);
  }

  return Array.from(parameterMap.values());
};

const resolveMaybeRef = (
  value: unknown,
  root: UnknownRecord,
): UnknownRecord => {
  const record = assertRecord(value, "OpenAPI 节点必须是对象");
  const ref = getString(record, "$ref");

  if (!ref) {
    return record;
  }

  return resolveRef(ref, root);
};

const resolveRef = (ref: string, root: UnknownRecord): UnknownRecord => {
  if (!ref.startsWith("#/")) {
    throw new ApiGeneratorError(`暂不支持外部 $ref：${ref}`);
  }

  const target = ref
    .slice(2)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce<unknown>((current, segment) => {
      if (!isRecord(current)) {
        return undefined;
      }

      return current[segment];
    }, root);

  return assertRecord(target, `无法解析 $ref：${ref}`);
};

const getRefName = (ref: string): string => ref.split("/").at(-1) ?? "Ref";

const assertRecord = (value: unknown, message: string): UnknownRecord => {
  if (!isRecord(value)) {
    throw new ApiGeneratorError(message);
  }

  return value;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getRecord = (
  record: UnknownRecord,
  key: string,
): UnknownRecord | undefined => {
  const value = record[key];
  return isRecord(value) ? value : undefined;
};

const getString = (record: UnknownRecord, key: string): string | undefined => {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
};

const getBoolean = (
  record: UnknownRecord,
  key: string,
): boolean | undefined => {
  const value = record[key];
  return typeof value === "boolean" ? value : undefined;
};

const readStringArray = (value: unknown): readonly string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

const isHttpMethod = (value: string): value is HttpMethod =>
  HTTP_METHODS.has(value as HttpMethod);

const isParameterLocation = (
  value: string | undefined,
): value is ApiParameterLocation =>
  value !== undefined && PARAMETER_LOCATIONS.has(value as ApiParameterLocation);

const isSchemaType = (value: unknown): value is ApiSchemaPrimitiveType =>
  value === "array" ||
  value === "boolean" ||
  value === "integer" ||
  value === "null" ||
  value === "number" ||
  value === "object" ||
  value === "string";
