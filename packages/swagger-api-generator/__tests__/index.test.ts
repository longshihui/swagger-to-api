import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ApiGeneratorError,
  convertOpenApiDocumentToEndpoints,
  generateApiCode,
  selectApiResponse,
  swaggerApiGeneratorMetadata,
} from "../src/index";
import type { ApiEndpointModel } from "../src/index";

describe("swaggerApiGeneratorMetadata", () => {
  it("应该使用正确的包名", () => {
    expect(swaggerApiGeneratorMetadata.name).toBe("@lsh/swagger-api-generator");
  });
});

describe("convertOpenApiDocumentToEndpoints", () => {
  it("应该从真实 mock swagger 文件转换为统一接口模型", () => {
    const document = readMockSwaggerDocument();
    const endpoints = convertOpenApiDocumentToEndpoints(document);

    expect(endpoints).toHaveLength(2);

    const detailEndpoint = endpoints[0];
    expect(detailEndpoint?.functionName).toBe("getContractDetail");
    expect(detailEndpoint?.path).toBe("/contract/{id}");
    expect(detailEndpoint?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "tenant-id",
          in: "header",
          required: false,
        }),
        expect.objectContaining({
          name: "id",
          in: "path",
          required: true,
          example: "10001",
        }),
      ]),
    );
    expect(detailEndpoint?.responses[0]?.schema?.name).toBe("ContractDetail");
    expect(
      detailEndpoint?.responses[0]?.schema?.properties?.status?.enum,
    ).toEqual(["draft", "signed"]);

    const searchEndpoint = endpoints[1];
    expect(searchEndpoint?.requestBodyRequired).toBe(true);
    expect(searchEndpoint?.requestBody?.properties?.ownerId?.description).toBe(
      "负责人 ID",
    );
    expect(searchEndpoint?.responses[0]?.statusCode).toBe("201");
  });

  it("应该可以把 swagger 转换结果继续生成 API 代码", () => {
    const document = readMockSwaggerDocument();
    const endpoints = convertOpenApiDocumentToEndpoints(document);
    const result = generateApiCode({
      endpoints,
    });

    const apiFile = getFileContent(result, "contract/api.ts");
    expect(apiFile).toContain(
      "export function getContractDetail(path: GetContractDetailPathParams, headers?: GetContractDetailHeaderParams): Promise<GetContractDetailResponse>",
    );
    expect(apiFile).toContain("url: `/contract/${path.id}`");
    expect(apiFile).toContain("headers");
    expect(apiFile).toContain(
      "export function searchContract(query?: SearchContractQueryParams, body: SearchContractRequestBody): Promise<SearchContractResponse>",
    );

    const typesFile = getFileContent(result, "contract/types.ts");
    expect(typesFile).toContain("export interface ContractDetail");
    expect(typesFile).toContain('status?: "draft" | "signed";');
    expect(typesFile).toContain(
      "export type GetContractDetailResponse = ContractDetail;",
    );
  });
});

describe("generateApiCode", () => {
  it("应该生成按 tag 分组的 API 文件和类型文件", () => {
    const result = generateApiCode({
      endpoints: [
        createContractDetailEndpoint(),
        createContractSearchEndpoint(),
      ],
    });

    expect(result.files.map((file) => file.path)).toEqual([
      "contract/types.ts",
      "contract/api.ts",
      "index.ts",
    ]);

    const typesFile = getFileContent(result, "contract/types.ts");
    expect(typesFile).toContain("export interface GetContractDetailPathParams");
    expect(typesFile).toContain("* 合同 ID");
    expect(typesFile).toContain('* @example "10001"');
    expect(typesFile).toContain("id: string;");
    expect(typesFile).toContain("export interface ContractDetail");
    expect(typesFile).toContain('status?: "draft" | "signed";');
    expect(typesFile).toContain(
      "export type GetContractDetailResponse = ContractDetail;",
    );
    expect(typesFile).toContain("export interface SearchContractQueryParams");
    expect(typesFile).toContain("pageNum?: number;");
    expect(typesFile).toContain("export interface SearchContractRequestBody");

    const apiFile = getFileContent(result, "contract/api.ts");
    expect(apiFile).toContain('import { request } from "@lsh/shared-http";');
    expect(apiFile).toContain(
      "export function getContractDetail(path: GetContractDetailPathParams): Promise<GetContractDetailResponse>",
    );
    expect(apiFile).toContain("url: `/contract/${path.id}`");
    expect(apiFile).toContain('method: "get"');
    expect(apiFile).toContain(
      "export function searchContract(query?: SearchContractQueryParams, body?: SearchContractRequestBody): Promise<SearchContractResponse>",
    );
    expect(apiFile).toContain("params: query");
    expect(apiFile).toContain("data: body");

    const indexFile = getFileContent(result, "index.ts");
    expect(indexFile).toContain('export * from "./contract/api";');
    expect(indexFile).toContain('export * from "./contract/types";');
  });

  it("应该支持自定义请求配置和模板回调", () => {
    const result = generateApiCode({
      endpoints: [createContractDetailEndpoint()],
      request: {
        importFrom: "@/utils/http",
        clientName: "http",
      },
      templates: {
        apiFile: (context) =>
          `${context.groupName}:${context.request.clientName}:${context.endpointContexts[0]?.functionName}`,
      },
    });

    expect(getFileContent(result, "contract/api.ts")).toBe(
      "contract:http:getContractDetail",
    );
  });

  it("应该在同分组函数名重复时抛出错误", () => {
    const endpoint = createContractDetailEndpoint();

    expect(() =>
      generateApiCode({
        endpoints: [
          endpoint,
          {
            ...endpoint,
            id: "contract-detail-copy",
          },
        ],
      }),
    ).toThrow(ApiGeneratorError);
  });

  it("应该在 path 参数未出现在 URL 中时抛出错误", () => {
    const endpoint = createContractDetailEndpoint();

    expect(() =>
      generateApiCode({
        endpoints: [
          {
            ...endpoint,
            path: "/contract/detail",
          },
        ],
      }),
    ).toThrow("path 参数 id 未出现在 URL 中");
  });

  it("应该在同分组类型名冲突时抛出错误", () => {
    expect(() =>
      generateApiCode({
        endpoints: [
          createContractDetailEndpoint(),
          {
            ...createContractSearchEndpoint(),
            responses: [
              {
                statusCode: "200",
                schema: {
                  name: "ContractDetail",
                  type: "object",
                  properties: {
                    contractCode: {
                      type: "string",
                    },
                  },
                },
              },
            ],
          },
        ],
      }),
    ).toThrow("冲突类型名 ContractDetail");
  });
});

describe("selectApiResponse", () => {
  it("应该按文档优先级选择响应 schema", () => {
    const endpoint = createContractDetailEndpoint();

    expect(selectApiResponse(endpoint).statusCode).toBe("200");
    expect(
      selectApiResponse({
        ...endpoint,
        responses: [
          {
            statusCode: "204",
            schema: {
              type: "null",
            },
          },
          {
            statusCode: "default",
            schema: {
              type: "object",
            },
          },
        ],
      }).statusCode,
    ).toBe("default");
  });
});

const readMockSwaggerDocument = (): unknown =>
  JSON.parse(
    readFileSync(
      new URL("./fixtures/contract.openapi.json", import.meta.url),
      "utf8",
    ),
  );

const getFileContent = (
  result: ReturnType<typeof generateApiCode>,
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
      statusCode: "500",
      schema: {
        type: "object",
      },
    },
    {
      statusCode: "200",
      schema: {
        name: "ContractDetail",
        type: "object",
        required: ["id", "contractName"],
        properties: {
          id: {
            type: "string",
            description: "合同 ID",
          },
          contractName: {
            type: "string",
            description: "合同名称",
          },
          status: {
            type: "string",
            description: "合同状态",
            enum: ["draft", "signed"],
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
    {
      name: "pageNum",
      in: "query",
      required: false,
      description: "页码",
      example: 1,
      schema: {
        type: "integer",
      },
    },
  ],
  requestBody: {
    type: "object",
    required: ["ownerId"],
    properties: {
      ownerId: {
        type: "string",
        description: "负责人 ID",
      },
    },
  },
  responses: [
    {
      statusCode: "200",
      schema: {
        type: "object",
        properties: {
          total: {
            type: "integer",
            description: "总数",
          },
          list: {
            type: "array",
            description: "合同列表",
            items: {
              type: "object",
            },
          },
        },
      },
    },
  ],
});
