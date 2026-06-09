import type {
  ApiEndpointModel,
  ApiParameterModel,
  ApiResponseModel,
} from "@lsh/swagger-api-generator";
import { createEndpointTitle } from "./docs-groups";
import { selectApiDocsResponse } from "./docs-response";
import {
  createExampleUrl,
  createExampleValue,
  createResponseExample,
} from "./examples";
import {
  createParameterFieldTable,
  createSchemaFieldTable,
} from "./field-table";
import { code, createMarkdownTable, escapeMarkdownText } from "./markdown";

export const createDefaultPageFile = (endpoint: ApiEndpointModel): string => {
  const selectedResponse = selectApiDocsResponse(endpoint);
  const title = createEndpointTitle(endpoint);
  const lines = [
    `# ${escapeMarkdownText(title)}`,
    "",
    "## 基础信息",
    "",
    createBaseInfoTable(endpoint),
    "",
    ...createParameterSections(endpoint),
    ...createRequestBodySection(endpoint),
    ...createResponseBodySection(selectedResponse),
    ...createErrorResponseSection(endpoint.responses, selectedResponse),
    ...createRequestExampleSection(endpoint),
    ...createResponseExampleSection(selectedResponse),
  ];

  return `${lines.join("\n")}\n`;
};

const createBaseInfoTable = (endpoint: ApiEndpointModel): string =>
  createMarkdownTable(
    ["项目", "内容"],
    [
      ["请求方法", endpoint.method.toUpperCase()],
      ["接口地址", code(endpoint.path)],
      ["operationId", code(endpoint.operationId)],
      ["函数名", code(endpoint.functionName)],
      ["分组", endpoint.tags.join(", ") || "default"],
      ...(endpoint.summary ? [["摘要", endpoint.summary]] : []),
      ...(endpoint.description ? [["描述", endpoint.description]] : []),
    ],
  );

const createParameterSections = (
  endpoint: ApiEndpointModel,
): readonly string[] => [
  ...createParameterSection(
    "Path 参数",
    endpoint.parameters.filter((parameter) => parameter.in === "path"),
  ),
  ...createParameterSection(
    "Query 参数",
    endpoint.parameters.filter((parameter) => parameter.in === "query"),
  ),
  ...createParameterSection(
    "Header 参数",
    endpoint.parameters.filter((parameter) => parameter.in === "header"),
  ),
];

const createParameterSection = (
  title: string,
  parameters: readonly ApiParameterModel[],
): readonly string[] => {
  if (parameters.length === 0) {
    return [];
  }

  return [`## ${title}`, "", createParameterFieldTable(parameters), ""];
};

const createRequestBodySection = (
  endpoint: ApiEndpointModel,
): readonly string[] => {
  if (!endpoint.requestBody) {
    return [];
  }

  return [
    "## Request Body 字段",
    "",
    createSchemaFieldTable(endpoint.requestBody, {
      required: endpoint.requestBodyRequired === true,
    }),
    "",
  ];
};

const createResponseBodySection = (
  response: ApiResponseModel,
): readonly string[] => {
  if (!response.schema) {
    return [];
  }

  return [
    `## 响应字段（${response.statusCode}）`,
    "",
    createSchemaFieldTable(response.schema, { required: false }),
    "",
  ];
};

const createErrorResponseSection = (
  responses: readonly ApiResponseModel[],
  selectedResponse: ApiResponseModel,
): readonly string[] => {
  const errorResponses = responses.filter(
    (response) => response.statusCode !== selectedResponse.statusCode,
  );

  if (errorResponses.length === 0) {
    return [];
  }

  return [
    "## 其他响应",
    "",
    createMarkdownTable(
      ["状态码", "说明"],
      errorResponses.map((response) => [
        response.statusCode,
        response.description ?? "",
      ]),
    ),
    "",
  ];
};

const createRequestExampleSection = (
  endpoint: ApiEndpointModel,
): readonly string[] => {
  const url = createExampleUrl(endpoint);
  const body = endpoint.requestBody
    ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(createExampleValue(endpoint.requestBody), null, 2)}'`
    : "";

  return [
    "## 请求示例",
    "",
    "```bash",
    `curl -X ${endpoint.method.toUpperCase()} "${url}"${body}`,
    "```",
    "",
  ];
};

const createResponseExampleSection = (
  response: ApiResponseModel,
): readonly string[] => {
  if (!response.schema) {
    return [];
  }

  return [
    "## 响应示例",
    "",
    "```json",
    JSON.stringify(createResponseExample(response), null, 2),
    "```",
    "",
  ];
};
