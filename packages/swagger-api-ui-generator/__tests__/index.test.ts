import { describe, expect, it } from "vitest";
import {
  ApiDocsGeneratorError,
  generateApiDocs,
  swaggerApiUiGeneratorMetadata,
} from "../src/index";
import type { ApiEndpointModel } from "@cm/swagger-api-generator";

describe("swaggerApiUiGeneratorMetadata", () => {
  it("应该使用正确的包名", () => {
    expect(swaggerApiUiGeneratorMetadata.name).toBe(
      "@cm/swagger-api-ui-generator",
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
        searchIndexFile: (items) => `items:${items.length}`,
      },
    });

    expect(getFileContent(result, "api/contract/get-contract-detail.md")).toBe(
      "查询合同详情:/api/contract/get-contract-detail",
    );
    expect(getFileContent(result, "public/api-index.json")).toBe("items:1");
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
