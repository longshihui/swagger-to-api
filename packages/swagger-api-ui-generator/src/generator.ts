import type {
  ApiEndpointModel,
  ApiParameterModel,
  ApiResponseModel,
  ApiSchemaModel,
} from "@lsh/swagger-api-generator";
import { toKebabCase } from "./naming";
import type {
  ApiDocsGeneratedGroup,
  ApiDocsSearchItem,
  GenerateApiDocsOptions,
  GenerateApiDocsResult,
} from "./types";
import { ApiDocsGeneratorError } from "./types";

interface FieldTableRow {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description?: string;
  readonly example?: unknown;
  readonly enum?: readonly unknown[];
}

const DEFAULT_SITE_TITLE = "API 文档";
const RESPONSE_PRIORITY = ["200", "201", "default"];

export const generateApiDocs = (
  options: GenerateApiDocsOptions,
): GenerateApiDocsResult => {
  const groups = groupEndpoints(options);
  validateGroups(groups);
  const searchIndex = createSearchIndex(groups);
  const files = groups.flatMap((group) =>
    group.endpoints.map((endpoint) => ({
      path: `api/${group.directoryName}/${endpoint.fileName}.md`,
      content:
        options.templates?.pageFile?.(endpoint) ??
        createDefaultPageFile(endpoint.endpoint),
    })),
  );

  files.push({
    path: "public/api-index.json",
    content:
      options.templates?.searchIndexFile?.(searchIndex) ??
      `${JSON.stringify(searchIndex, null, 2)}\n`,
  });

  files.push({
    path: ".vitepress/config.ts",
    content:
      options.templates?.configFile?.(groups) ??
      createDefaultConfigFile(groups, options.siteTitle ?? DEFAULT_SITE_TITLE),
  });

  return {
    files,
    groups,
    searchIndex,
  };
};

const groupEndpoints = (
  options: GenerateApiDocsOptions,
): readonly ApiDocsGeneratedGroup[] => {
  const defaultGroupName = options.defaultGroupName ?? "default";
  const groupMap = new Map<string, ApiEndpointModel[]>();

  for (const endpoint of options.endpoints) {
    const groupName = endpoint.tags[0] ?? defaultGroupName;
    const endpoints = groupMap.get(groupName) ?? [];
    endpoints.push(endpoint);
    groupMap.set(groupName, endpoints);
  }

  return Array.from(groupMap.entries()).map(([groupName, endpoints]) => {
    const directoryName = toKebabCase(groupName);

    return {
      groupName,
      directoryName,
      endpoints: endpoints.map((endpoint) => {
        const fileName = toKebabCase(
          endpoint.operationId || endpoint.functionName,
        );

        return {
          endpoint,
          title: createEndpointTitle(endpoint),
          fileName,
          docPath: `/api/${directoryName}/${fileName}`,
        };
      }),
    };
  });
};

const validateGroups = (groups: readonly ApiDocsGeneratedGroup[]): void => {
  const docPaths = new Set<string>();

  for (const group of groups) {
    const fileNames = new Set<string>();

    for (const endpoint of group.endpoints) {
      if (fileNames.has(endpoint.fileName)) {
        throw new ApiDocsGeneratorError(
          `分组 ${group.groupName} 存在重复文档路径 ${endpoint.fileName}`,
        );
      }

      if (docPaths.has(endpoint.docPath)) {
        throw new ApiDocsGeneratorError(
          `搜索索引存在重复 docPath ${endpoint.docPath}`,
        );
      }

      fileNames.add(endpoint.fileName);
      docPaths.add(endpoint.docPath);
    }
  }
};

const createSearchIndex = (
  groups: readonly ApiDocsGeneratedGroup[],
): readonly ApiDocsSearchItem[] =>
  groups.flatMap((group) =>
    group.endpoints.map(({ endpoint, title, docPath }) => ({
      title,
      operationId: endpoint.operationId,
      method: endpoint.method.toUpperCase(),
      path: endpoint.path,
      tags: endpoint.tags,
      docPath,
      ...(endpoint.summary === undefined ? {} : { summary: endpoint.summary }),
      ...(endpoint.description === undefined
        ? {}
        : { description: endpoint.description }),
    })),
  );

const createDefaultConfigFile = (
  groups: readonly ApiDocsGeneratedGroup[],
  siteTitle: string,
): string => {
  const sidebar = Object.fromEntries(
    groups.map((group) => [
      `/api/${group.directoryName}/`,
      [
        {
          text: group.groupName,
          items: group.endpoints.map((endpoint) => ({
            text: endpoint.title,
            link: endpoint.docPath,
          })),
        },
      ],
    ]),
  );

  return [
    'import { defineConfig } from "vitepress";',
    "",
    "export default defineConfig({",
    `  title: ${JSON.stringify(siteTitle)},`,
    "  themeConfig: {",
    "    nav: [",
    `      { text: "接口文档", link: ${JSON.stringify(groups[0]?.endpoints[0]?.docPath ?? "/")} },`,
    "    ],",
    "    search: {",
    '      provider: "local",',
    "    },",
    `    sidebar: ${JSON.stringify(sidebar, null, 6)}`,
    "  },",
    "});",
    "",
  ].join("\n");
};

const createDefaultPageFile = (endpoint: ApiEndpointModel): string => {
  const selectedResponse = selectApiResponse(endpoint);
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

  return [
    `## ${title}`,
    "",
    createFieldTable(
      parameters.map((parameter) => ({
        name: parameter.name,
        type: createTypeLiteralFromSchema(parameter.schema),
        required: parameter.required,
        ...(parameter.description === undefined
          ? {}
          : { description: parameter.description }),
        ...(parameter.example === undefined
          ? {}
          : { example: parameter.example }),
        ...(parameter.schema.enum === undefined
          ? {}
          : { enum: parameter.schema.enum }),
      })),
    ),
    "",
  ];
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
    createFieldTable(
      createSchemaRows(endpoint.requestBody, {
        required: endpoint.requestBodyRequired === true,
      }),
    ),
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
    createFieldTable(createSchemaRows(response.schema, { required: false })),
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

const createSchemaRows = (
  schema: ApiSchemaModel,
  options: { readonly prefix?: string; readonly required: boolean },
): readonly FieldTableRow[] => {
  const rows: FieldTableRow[] = [];
  const rowName = options.prefix ?? "$";

  rows.push({
    name: rowName,
    type: createTypeLiteralFromSchema(schema),
    required: options.required,
    ...(schema.description === undefined
      ? {}
      : { description: schema.description }),
    ...(schema.example === undefined ? {} : { example: schema.example }),
    ...(schema.enum === undefined ? {} : { enum: schema.enum }),
  });

  if (schema.properties) {
    const requiredNames = new Set(schema.required ?? []);

    for (const [propertyName, propertySchema] of Object.entries(
      schema.properties,
    )) {
      rows.push(
        ...createSchemaRows(propertySchema, {
          prefix:
            options.prefix === undefined
              ? propertyName
              : `${options.prefix}.${propertyName}`,
          required: requiredNames.has(propertyName),
        }),
      );
    }
  }

  if (schema.items && schema.items.properties) {
    rows.push(
      ...createSchemaRows(schema.items, {
        prefix: `${rowName}[]`,
        required: false,
      }),
    );
  }

  return rows;
};

const createFieldTable = (rows: readonly FieldTableRow[]): string =>
  createMarkdownTable(
    ["字段", "类型", "必填", "说明", "示例", "枚举"],
    rows.map((row) => [
      row.name,
      code(row.type),
      row.required ? "是" : "否",
      row.description ?? "",
      row.example === undefined ? "" : code(formatValue(row.example)),
      row.enum === undefined ? "" : row.enum.map(formatValue).join(", "),
    ]),
  );

const createMarkdownTable = (
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string => {
  const headerRow = `| ${headers.map(escapeTableCell).join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;
  const bodyRows = rows.map(
    (row) => `| ${row.map(escapeTableCell).join(" | ")} |`,
  );

  return [headerRow, separatorRow, ...bodyRows].join("\n");
};

const createEndpointTitle = (endpoint: ApiEndpointModel): string =>
  endpoint.summary || endpoint.operationId || endpoint.functionName;

const createExampleUrl = (endpoint: ApiEndpointModel): string => {
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

const createResponseExample = (response: ApiResponseModel): unknown => {
  const examples = response.examples ? Object.values(response.examples) : [];
  const firstExample = examples[0];

  if (firstExample !== undefined) {
    return firstExample;
  }

  return response.schema ? createExampleValue(response.schema) : {};
};

const createExampleValue = (schema: ApiSchemaModel): unknown => {
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

const code = (value: string): string => `\`${value.replaceAll("`", "\\`")}\``;

const formatValue = (value: unknown): string => {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return JSON.stringify(value);
  }

  return JSON.stringify(value);
};

const escapeMarkdownText = (value: string): string =>
  value.replaceAll("#", "\\#");

const escapeTableCell = (value: string): string =>
  value.replaceAll("|", "\\|").replaceAll("\n", "<br>");

const selectApiResponse = (endpoint: ApiEndpointModel): ApiResponseModel => {
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
    throw new ApiDocsGeneratorError(
      `接口 ${endpoint.id} 缺少可用于生成文档的 response schema`,
    );
  }

  return response;
};

const createTypeLiteralFromSchema = (schema: ApiSchemaModel): string => {
  if (schema.name) {
    return schema.name;
  }

  if (schema.enum) {
    return schema.enum.map(formatValue).join(" | ");
  }

  if (schema.allOf && schema.allOf.length > 0) {
    return schema.allOf.map(createTypeLiteralFromSchema).join(" & ");
  }

  if (schema.anyOf && schema.anyOf.length > 0) {
    return schema.anyOf.map(createTypeLiteralFromSchema).join(" | ");
  }

  if (schema.oneOf && schema.oneOf.length > 0) {
    return schema.oneOf.map(createTypeLiteralFromSchema).join(" | ");
  }

  switch (schema.type) {
    case "array":
      return `Array<${schema.items ? createTypeLiteralFromSchema(schema.items) : "unknown"}>`;
    case "boolean":
      return "boolean";
    case "integer":
    case "number":
      return "number";
    case "null":
      return "null";
    case "object":
      return "object";
    case "string":
      return "string";
    default:
      return "unknown";
  }
};
