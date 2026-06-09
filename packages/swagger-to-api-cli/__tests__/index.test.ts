import { describe, expect, it } from "vitest";
import {
  createCliHelpText,
  loadApiEndpoints,
  parseCliArgs,
  runSwaggerToApiCli,
  SwaggerToApiCliError,
  swaggerToApiCliMetadata,
} from "../src/index";
import type { SwaggerToApiCliRunner } from "../src/index";

describe("swaggerToApiCliMetadata", () => {
  it("应该使用正确的包名", () => {
    expect(swaggerToApiCliMetadata.name).toBe("@cm/swagger-to-api-cli");
  });
});

describe("parseCliArgs", () => {
  it("应该在无参数时进入帮助命令", () => {
    expect(parseCliArgs([])).toEqual({
      command: "help",
    });
    expect(createCliHelpText()).toContain("swagger-to-api generate");
  });

  it("应该解析命令和配置文件参数", () => {
    expect(
      parseCliArgs(["generate", "-c", "swagger-to-api.config.json"]),
    ).toEqual({
      command: "generate",
      configPath: "swagger-to-api.config.json",
    });
  });

  it("应该在未知命令时抛出错误", () => {
    expect(() => parseCliArgs(["unknown"])).toThrow(SwaggerToApiCliError);
  });
});

describe("runSwaggerToApiCli", () => {
  it("应该根据配置生成 API 代码文件", async () => {
    const runner = createMockRunner({
      "/project/swagger-to-api.config.json": JSON.stringify(createConfig()),
      "/project/swagger.json": JSON.stringify(createOpenApiDocument()),
    });

    const result = await runSwaggerToApiCli(
      ["generate", "-c", "swagger-to-api.config.json"],
      runner,
    );

    expect(result).toEqual({
      command: "generate",
      apiFileCount: 3,
      docsFileCount: 0,
      endpointCount: 1,
    });
    expect(runner.writes.map((write) => write.path)).toEqual([
      "/project/generated-api/contract/types.ts",
      "/project/generated-api/contract/api.ts",
      "/project/generated-api/index.ts",
    ]);
    expect(runner.writes[1]?.content).toContain(
      'import { http } from "@/shared/http";',
    );
    expect(runner.commands).toEqual([]);
  });

  it("应该生成文档后执行 VitePress 构建命令", async () => {
    const runner = createMockRunner({
      "/project/swagger-to-api.config.json": JSON.stringify(createConfig()),
      "/project/swagger.json": JSON.stringify(createOpenApiDocument()),
    });

    const result = await runSwaggerToApiCli(
      ["docs:build", "-c", "swagger-to-api.config.json"],
      runner,
    );

    expect(result.command).toBe("docs:build");
    expect(result.docsFileCount).toBe(3);
    expect(runner.writes.map((write) => write.path)).toContain(
      "/project/swagger-docs/api/contract/get-contract-detail.md",
    );
    expect(runner.commands).toEqual([
      {
        command: "pnpm",
        args: ["exec", "vitepress", "build", "/project/swagger-docs"],
      },
    ]);
  });

  it("应该在 validate 命令中只校验不写入文件", async () => {
    const runner = createMockRunner({
      "/project/swagger-to-api.config.json": JSON.stringify(createConfig()),
      "/project/swagger.json": JSON.stringify(createOpenApiDocument()),
    });

    const result = await runSwaggerToApiCli(
      ["validate", "-c", "swagger-to-api.config.json"],
      runner,
    );

    expect(result).toEqual({
      command: "validate",
      apiFileCount: 3,
      docsFileCount: 3,
      endpointCount: 1,
    });
    expect(runner.writes).toEqual([]);
    expect(runner.commands).toEqual([]);
  });

  it("应该支持 includeTags 和 excludeTags 过滤接口", async () => {
    const runner = createMockRunner({
      "/project/swagger-to-api.config.json": JSON.stringify({
        ...createConfig(),
        generate: {
          includeTags: ["contract"],
          excludeTags: ["internal"],
        },
      }),
      "/project/swagger.json": JSON.stringify({
        ...createOpenApiDocument(),
        paths: {
          ...createOpenApiDocument().paths,
          "/internal/ping": {
            get: {
              operationId: "pingInternal",
              tags: ["internal"],
              responses: {
                "200": {
                  description: "ok",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    });

    const result = await runSwaggerToApiCli(
      ["generate", "-c", "swagger-to-api.config.json"],
      runner,
    );

    expect(result.endpointCount).toBe(1);
    expect(runner.writes.map((write) => write.path)).toContain(
      "/project/generated-api/contract/api.ts",
    );
    expect(runner.writes.map((write) => write.path)).not.toContain(
      "/project/generated-api/internal/api.ts",
    );
  });
});

describe("loadApiEndpoints", () => {
  it("应该读取 YAML 格式的 OpenAPI 文件", async () => {
    const runner = createMockRunner({
      "/project/swagger.yaml": [
        "openapi: 3.0.3",
        "info:",
        "  title: 示例接口",
        "  version: 1.0.0",
        "paths:",
        "  /health:",
        "    get:",
        "      operationId: healthCheck",
        "      tags:",
        "        - system",
        "      responses:",
        "        '200':",
        "          description: ok",
        "          content:",
        "            application/json:",
        "              schema:",
        "                type: object",
      ].join("\n"),
    });

    const endpoints = await loadApiEndpoints(runner, "swagger.yaml");

    expect(endpoints).toHaveLength(1);
    expect(endpoints[0]?.operationId).toBe("healthCheck");
  });
});

interface MockWrite {
  readonly path: string;
  readonly content: string;
  readonly overwrite: boolean;
}

interface MockCommand {
  readonly command: string;
  readonly args: readonly string[];
}

interface MockRunner extends SwaggerToApiCliRunner {
  readonly writes: MockWrite[];
  readonly commands: MockCommand[];
}

const createMockRunner = (files: Record<string, string>): MockRunner => {
  const writes: MockWrite[] = [];
  const commands: MockCommand[] = [];

  return {
    cwd: "/project",
    writes,
    commands,
    readTextFile: async (path) => {
      const content = files[path];

      if (content === undefined) {
        throw new Error(`缺少测试文件：${path}`);
      }

      return content;
    },
    writeTextFile: async (path, content, options) => {
      writes.push({
        path,
        content,
        overwrite: options.overwrite,
      });
    },
    runCommand: async (command, args) => {
      commands.push({
        command,
        args,
      });
    },
  };
};

const createConfig = () => ({
  source: "./swagger.json",
  output: {
    apiDir: "./generated-api",
    docsDir: "./swagger-docs",
  },
  request: {
    importFrom: "@/shared/http",
    clientName: "http",
  },
});

const createOpenApiDocument = () => ({
  openapi: "3.0.3",
  info: {
    title: "合同接口",
    version: "1.0.0",
  },
  paths: {
    "/contract/{id}": {
      get: {
        operationId: "getContractDetail",
        summary: "查询合同详情",
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
        responses: {
          "200": {
            description: "合同详情",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "合同 ID",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});
