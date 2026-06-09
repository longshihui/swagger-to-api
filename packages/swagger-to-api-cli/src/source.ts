import { extname, isAbsolute, resolve } from "node:path";
import { convertOpenApiDocumentToEndpoints } from "@lsh/swagger-api-generator";
import { load as loadYaml } from "js-yaml";
import type { ApiEndpointModel } from "@lsh/swagger-api-generator";
import type { SwaggerToApiCliRunner } from "./types";
import { SwaggerToApiCliError } from "./types";

export const loadApiEndpoints = async (
  runner: SwaggerToApiCliRunner,
  source: string,
): Promise<readonly ApiEndpointModel[]> => {
  if (/^https?:\/\//u.test(source)) {
    throw new SwaggerToApiCliError("MVP 阶段暂不支持远程 URL 输入");
  }

  const sourcePath = isAbsolute(source) ? source : resolve(runner.cwd, source);
  const content = await runner.readTextFile(sourcePath);
  const document = parseOpenApiDocument(content, sourcePath);

  return convertOpenApiDocumentToEndpoints(document);
};

const parseOpenApiDocument = (content: string, sourcePath: string): unknown => {
  const extension = extname(sourcePath).toLowerCase();

  if (extension === ".yaml" || extension === ".yml") {
    return loadYaml(content);
  }

  try {
    return JSON.parse(content) as unknown;
  } catch (error) {
    throw new SwaggerToApiCliError(
      `OpenAPI 文件 ${sourcePath} 不是有效的 JSON：${formatErrorMessage(error)}`,
    );
  }
};

const formatErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
