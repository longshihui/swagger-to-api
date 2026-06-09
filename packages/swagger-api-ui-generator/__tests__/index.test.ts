import { describe, expect, it } from "vitest";
import {
  ApiDocsGeneratorError,
  generateApiDocs,
  swaggerApiUiGeneratorMetadata,
} from "../src/index";
import type { ApiEndpointModel } from "@lsh/swagger-api-generator";

describe("swaggerApiUiGeneratorMetadata", () => {
  it("应该使用正确的包名", () => {
    expect(swaggerApiUiGeneratorMetadata.name).toBe(
      "@lsh/swagger-api-ui-generator",
    );
  });
});

describe("generateApiDocs", () => {
  it("应该生成 VitePress 配置、Markdown 页面和搜索索引", () => {
    const result = generateApiDocs({
      endpoints: [
        createContractDetailEndpoint(),
        createContractSearchEndpoint(),
      ],
      siteTitle: "接口中心",
    });

    expect(result.files.map((file) => file.path)).toEqual([
      "api/contract/get-contract-detail.md",
      "api/contract/search-contract.md",
      "public/api-index.json",
      ".vitepress/config.ts",
    ]);

    const detailPage = getFileContent(
      result,
      "api/contract/get-contract-detail.md",
    );
    expect(detailPage).toContain("# 查询合同详情");
    expect(detailPage).toContain("| 请求方法 | GET |");
    expect(detailPage).toContain("| 接口地址 | `/contract/{id}` |");
    expect(detailPage).toContain("## Path 参数");
    expect(detailPage).toContain(
      '| id | `string` | 是 | 合同 ID | `"10001"` |  |',
    );
    expect(detailPage).toContain("## Header 参数");
    expect(detailPage).toContain("## 响应字段（200）");
    expect(detailPage).toContain(
      '| status | `"draft" \\| "signed"` | 否 | 合同状态 |  | "draft", "signed" |',
    );
    expect(detailPage).toContain("curl -X GET");
    expect(detailPage).toContain("## 其他响应");

    const searchPage = getFileContent(
      result,
      "api/contract/search-contract.md",
    );
    expect(searchPage).toContain("## Query 参数");
    expect(searchPage).toContain("## Request Body 字段");
    expect(searchPage).toContain("## 响应字段（201）");
    expect(searchPage).toContain("-d '{");

    const searchIndex = JSON.parse(
      getFileContent(result, "public/api-index.json"),
    ) as unknown;
    expect(searchIndex).toEqual([
      expect.objectContaining({
        title: "查询合同详情",
        operationId: "getContractDetail",
        method: "GET",
        path: "/contract/{id}",
        docPath: "/api/contract/get-contract-detail",
      }),
      expect.objectContaining({
        title: "搜索合同",
        operationId: "searchContract",
        method: "POST",
        docPath: "/api/contract/search-contract",
      }),
    ]);

    const vitePressConfig = getFileContent(result, ".vitepress/config.ts");
    expect(vitePressConfig).toContain('title: "接口中心"');
    expect(vitePressConfig).toContain('provider: "local"');
    expect(vitePressConfig).toContain(
      '"link": "/api/contract/get-contract-detail"',
    );
  });

  it("应该支持自定义模板回调", () => {
    const result = generateApiDocs({
      endpoints: [createContractDetailEndpoint()],
      templates: {
        pageFile: (endpoint) => `${endpoint.title}:${endpoint.docPath}`,
        configFile: (groups) => `groups:${groups.length}`,
        searchIndexFile: (items) => `items:${items.length}`,
      },
    });

    expect(getFileContent(result, "api/contract/get-contract-detail.md")).toBe(
      "查询合同详情:/api/contract/get-contract-detail",
    );
    expect(getFileContent(result, "public/api-index.json")).toBe("items:1");
    expect(getFileContent(result, ".vitepress/config.ts")).toBe("groups:1");
  });

  it("应该在缺失 tag 时使用默认分组并生成默认站点标题", () => {
    const result = generateApiDocs({
      endpoints: [createDefaultGroupEndpoint()],
      defaultGroupName: "misc",
    });

    expect(result.files.map((file) => file.path)).toEqual([
      "api/misc/list-audit-logs.md",
      "public/api-index.json",
      ".vitepress/config.ts",
    ]);
    expect(result.groups).toEqual([
      expect.objectContaining({
        groupName: "misc",
        directoryName: "misc",
      }),
    ]);

    const pageFile = getFileContent(result, "api/misc/list-audit-logs.md");
    expect(pageFile).toContain("# listAuditLogs");
    expect(pageFile).toContain("| 分组 | default |");
    expect(pageFile).not.toContain("## Query 参数");

    const vitePressConfig = getFileContent(result, ".vitepress/config.ts");
    expect(vitePressConfig).toContain('title: "API 文档"');
    expect(vitePressConfig).toContain('"link": "/api/misc/list-audit-logs"');
  });

  it("应该展开嵌套数组字段并展示组合类型", () => {
    const result = generateApiDocs({
      endpoints: [createNestedSchemaEndpoint()],
    });

    const pageFile = getFileContent(result, "api/report/get-report.md");
    expect(pageFile).toContain(
      "| records | `Array<{ recordId: string }>` | 否 | 明细列表 |  |  |",
    );
    expect(pageFile).toContain(
      "| records[] | `{ recordId: string }` | 否 |  |  |  |",
    );
    expect(pageFile).toContain(
      '| records[].recordId | `string` | 是 | 明细 ID | `"R001"` |  |',
    );
    expect(pageFile).toContain(
      "| filter | `BaseFilter & ExtraFilter` | 否 | 筛选条件 |  |  |",
    );
    expect(pageFile).toContain(
      "| keyword | `string \\| number` | 否 | 关键词\\|编号<br>支持模糊搜索 |  |  |",
    );
  });

  it("应该复用 API 类型字面量规则展示文档字段类型", () => {
    const result = generateApiDocs({
      endpoints: [createNestedSchemaEndpoint()],
    });

    const pageFile = getFileContent(result, "api/report/get-report.md");
    expect(pageFile).toContain(
      "| $ | `{ filter?: BaseFilter & ExtraFilter }` | 否 |  |  |  |",
    );
  });

  it("应该按 API 生成器响应优先级选择文档响应 schema", () => {
    const result = generateApiDocs({
      endpoints: [createResponsePriorityEndpoint()],
    });

    const pageFile = getFileContent(result, "api/contract/choose-response.md");
    expect(pageFile).toContain("## 响应字段（200）");
    expect(pageFile).toContain("| selected | `string` | 否 | 优先响应 |  |  |");
    expect(pageFile).not.toContain("## 响应字段（201）");
  });

  it("应该优先使用响应 examples 生成响应示例", () => {
    const result = generateApiDocs({
      endpoints: [createResponseExampleEndpoint()],
    });

    const pageFile = getFileContent(result, "api/contract/create-contract.md");
    expect(pageFile).toContain("## 响应字段（default）");
    expect(pageFile).toContain('"contractCode": "HT202606090001"');
    expect(pageFile).not.toContain('"contractCode": "string"');
  });

  it("应该在接口没有可用 response schema 时抛出错误", () => {
    expect(() =>
      generateApiDocs({
        endpoints: [createNoSchemaEndpoint()],
      }),
    ).toThrow("缺少可用于生成文档的 response schema");
  });

  it("应该在文档路径重复时抛出错误", () => {
    const endpoint = createContractDetailEndpoint();

    expect(() =>
      generateApiDocs({
        endpoints: [
          endpoint,
          {
            ...endpoint,
            id: "copy",
          },
        ],
      }),
    ).toThrow(ApiDocsGeneratorError);
  });
});

const getFileContent = (
  result: ReturnType<typeof generateApiDocs>,
  path: string,
): string => {
  const file = result.files.find((item) => item.path === path);

  if (!file) {
    throw new Error(`Missing generated file: ${path}`);
  }

  return file.content;
};

const createContractDetailEndpoint = (): ApiEndpointModel => ({
  id: "contract-detail",
  operationId: "getContractDetail",
  functionName: "getContractDetail",
  summary: "查询合同详情",
  method: "get",
  path: "/contract/{id}",
  tags: ["contract"],
  parameters: [
    {
      name: "tenant-id",
      in: "header",
      required: false,
      description: "租户 ID",
      schema: {
        type: "string",
      },
    },
    {
      name: "id",
      in: "path",
      required: true,
      description: "合同 ID",
      example: "10001",
      schema: {
        type: "string",
      },
    },
  ],
  responses: [
    {
      statusCode: "200",
      description: "合同详情",
      schema: {
        name: "ContractDetail",
        type: "object",
        required: ["id", "contractName"],
        properties: {
          id: {
            type: "string",
            description: "合同 ID",
            example: "10001",
          },
          contractName: {
            type: "string",
            description: "合同名称",
            example: "采购合同",
          },
          status: {
            type: "string",
            description: "合同状态",
            enum: ["draft", "signed"],
          },
        },
      },
    },
    {
      statusCode: "500",
      description: "服务异常",
      schema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "错误信息",
          },
        },
      },
    },
  ],
});

const createContractSearchEndpoint = (): ApiEndpointModel => ({
  id: "contract-search",
  operationId: "searchContract",
  functionName: "searchContract",
  summary: "搜索合同",
  method: "post",
  path: "/contract/search",
  tags: ["contract"],
  parameters: [
    {
      name: "contractName",
      in: "query",
      required: false,
      description: "合同名称",
      example: "采购合同",
      schema: {
        type: "string",
      },
    },
  ],
  requestBodyRequired: true,
  requestBody: {
    type: "object",
    required: ["ownerId"],
    properties: {
      ownerId: {
        type: "string",
        description: "负责人 ID",
        example: "10001",
      },
    },
  },
  responses: [
    {
      statusCode: "201",
      description: "搜索结果",
      schema: {
        type: "object",
        properties: {
          total: {
            type: "integer",
            description: "总数",
            example: 1,
          },
          list: {
            type: "array",
            description: "合同列表",
            items: {
              name: "ContractDetail",
              type: "object",
            },
          },
        },
      },
    },
  ],
});

const createDefaultGroupEndpoint = (): ApiEndpointModel => ({
  id: "audit-list",
  operationId: "listAuditLogs",
  functionName: "listAuditLogs",
  method: "get",
  path: "/audit/logs",
  tags: [],
  parameters: [],
  responses: [
    {
      statusCode: "200",
      schema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "日志 ID",
            },
          },
        },
      },
    },
  ],
});

const createNestedSchemaEndpoint = (): ApiEndpointModel => ({
  id: "report-detail",
  operationId: "getReport",
  functionName: "getReport",
  summary: "查询报表",
  method: "post",
  path: "/report/query",
  tags: ["report"],
  parameters: [
    {
      name: "keyword",
      in: "query",
      required: false,
      description: "关键词|编号\n支持模糊搜索",
      schema: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "number",
          },
        ],
      },
    },
  ],
  requestBody: {
    type: "object",
    properties: {
      filter: {
        description: "筛选条件",
        allOf: [
          {
            name: "BaseFilter",
          },
          {
            name: "ExtraFilter",
          },
        ],
      },
    },
  },
  responses: [
    {
      statusCode: "200",
      schema: {
        type: "object",
        properties: {
          records: {
            type: "array",
            description: "明细列表",
            items: {
              type: "object",
              required: ["recordId"],
              properties: {
                recordId: {
                  type: "string",
                  description: "明细 ID",
                  example: "R001",
                },
              },
            },
          },
        },
      },
    },
  ],
});

const createResponseExampleEndpoint = (): ApiEndpointModel => ({
  id: "contract-create",
  operationId: "createContract",
  functionName: "createContract",
  summary: "创建合同",
  method: "post",
  path: "/contract",
  tags: ["contract"],
  parameters: [],
  requestBody: {
    type: "object",
    properties: {
      contractName: {
        type: "string",
        description: "合同名称",
      },
    },
  },
  responses: [
    {
      statusCode: "204",
      description: "无内容",
    },
    {
      statusCode: "default",
      description: "创建结果",
      schema: {
        type: "object",
        properties: {
          contractCode: {
            type: "string",
            description: "合同编号",
          },
        },
      },
      examples: {
        success: {
          contractCode: "HT202606090001",
        },
      },
    },
  ],
});

const createResponsePriorityEndpoint = (): ApiEndpointModel => ({
  id: "response-priority",
  operationId: "chooseResponse",
  functionName: "chooseResponse",
  summary: "选择响应",
  method: "get",
  path: "/contract/response",
  tags: ["contract"],
  parameters: [],
  responses: [
    {
      statusCode: "201",
      schema: {
        type: "object",
        properties: {
          skipped: {
            type: "string",
          },
        },
      },
    },
    {
      statusCode: "200",
      schema: {
        type: "object",
        properties: {
          selected: {
            type: "string",
            description: "优先响应",
          },
        },
      },
    },
    {
      statusCode: "default",
      schema: {
        type: "object",
      },
    },
  ],
});

const createNoSchemaEndpoint = (): ApiEndpointModel => ({
  id: "health-check",
  operationId: "healthCheck",
  functionName: "healthCheck",
  summary: "健康检查",
  method: "get",
  path: "/health",
  tags: ["system"],
  parameters: [],
  responses: [
    {
      statusCode: "204",
      description: "服务正常",
    },
  ],
});
