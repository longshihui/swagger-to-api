import { extname, isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createJiti } from "jiti";
import type { SwaggerToApiCliRunner, SwaggerToApiConfig } from "./types";
import { SwaggerToApiCliError } from "./types";

const DEFAULT_CONFIG_PATH = "swagger-to-api.config.ts";

interface UnknownRecord {
  readonly [key: string]: unknown;
}

export const loadSwaggerToApiConfig = async (
  runner: SwaggerToApiCliRunner,
  configPath?: string,
): Promise<SwaggerToApiConfig> => {
  const resolvedPath = resolvePath(
    runner.cwd,
    configPath ?? DEFAULT_CONFIG_PATH,
  );
  const extension = extname(resolvedPath);
  const configValue =
    extension === ".json"
      ? parseJsonConfig(await runner.readTextFile(resolvedPath), resolvedPath)
      : await importConfig(resolvedPath);

  return normalizeConfig(configValue);
};

const importConfig = async (configPath: string): Promise<unknown> => {
  const extension = extname(configPath);

  if (extension === ".ts" || extension === ".mts" || extension === ".cts") {
    const jiti = createJiti(import.meta.url, {
      interopDefault: true,
    });

    return jiti.import(configPath, {
      default: true,
    });
  }

  const module = (await import(
    `${pathToFileURL(configPath).href}?t=${Date.now()}`
  )) as {
    readonly default?: unknown;
  };

  return module.default ?? module;
};

const parseJsonConfig = (content: string, configPath: string): unknown => {
  try {
    return JSON.parse(content) as unknown;
  } catch (error) {
    throw new SwaggerToApiCliError(
      `配置文件 ${configPath} 不是有效的 JSON：${formatErrorMessage(error)}`,
    );
  }
};

const normalizeConfig = (value: unknown): SwaggerToApiConfig => {
  const config = assertRecord(value, "配置文件必须导出对象");
  const source = assertString(config.source, "配置缺少 source");
  const output = assertRecord(config.output, "配置缺少 output");
  const request = assertRecord(config.request, "配置缺少 request");

  return {
    source,
    output: {
      apiDir: assertString(output.apiDir, "配置缺少 output.apiDir"),
      docsDir: assertString(output.docsDir, "配置缺少 output.docsDir"),
    },
    request: {
      importFrom: assertString(
        request.importFrom,
        "配置缺少 request.importFrom",
      ),
      clientName: assertString(
        request.clientName,
        "配置缺少 request.clientName",
      ),
      ...(typeof request.unwrapData === "boolean"
        ? { unwrapData: request.unwrapData }
        : {}),
    },
    ...normalizeGenerateConfig(config.generate),
    ...normalizeTemplatesConfig(config.templates),
  };
};

const normalizeGenerateConfig = (
  value: unknown,
): Pick<SwaggerToApiConfig, "generate"> => {
  if (value === undefined) {
    return {};
  }

  const generate = assertRecord(value, "配置 generate 必须是对象");

  return {
    generate: {
      ...(generate.groupBy === "tag" || generate.groupBy === "path"
        ? { groupBy: generate.groupBy }
        : {}),
      ...(generate.operationName === "operationId" ||
      generate.operationName === "summary" ||
      generate.operationName === "path"
        ? { operationName: generate.operationName }
        : {}),
      ...(typeof generate.overwrite === "boolean"
        ? { overwrite: generate.overwrite }
        : {}),
      ...normalizeTagFilter("includeTags", generate.includeTags),
      ...normalizeTagFilter("excludeTags", generate.excludeTags),
    },
  };
};

const normalizeTemplatesConfig = (
  value: unknown,
): Pick<SwaggerToApiConfig, "templates"> => {
  if (value === undefined) {
    return {};
  }

  const templates = assertRecord(value, "配置 templates 必须是对象");

  return {
    templates: {
      ...(typeof templates.apiFile === "string"
        ? { apiFile: templates.apiFile }
        : {}),
      ...(typeof templates.typeFile === "string"
        ? { typeFile: templates.typeFile }
        : {}),
      ...(typeof templates.docsPage === "string"
        ? { docsPage: templates.docsPage }
        : {}),
    },
  };
};

const normalizeTagFilter = (
  key: "excludeTags" | "includeTags",
  value: unknown,
): Pick<NonNullable<SwaggerToApiConfig["generate"]>, typeof key> => {
  if (!Array.isArray(value)) {
    return {};
  }

  return {
    [key]: value.filter((item): item is string => typeof item === "string"),
  };
};

const resolvePath = (cwd: string, path: string): string =>
  isAbsolute(path) ? path : resolve(cwd, path);

const assertRecord = (value: unknown, message: string): UnknownRecord => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new SwaggerToApiCliError(message);
  }

  return value as UnknownRecord;
};

const assertString = (value: unknown, message: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new SwaggerToApiCliError(message);
  }

  return value;
};

const formatErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
