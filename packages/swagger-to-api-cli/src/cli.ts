#!/usr/bin/env node
import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { generateApiCode } from "@cm/swagger-api-generator";
import type { ApiEndpointModel } from "@cm/swagger-api-generator";
import { generateApiDocs } from "@cm/swagger-api-ui-generator";
import { loadSwaggerToApiConfig } from "./config";
import { createNodeCliRunner } from "./runner";
import { loadApiEndpoints } from "./source";
import type {
  SwaggerToApiCliCommand,
  SwaggerToApiCliResult,
  SwaggerToApiCliRunner,
  SwaggerToApiConfig,
} from "./types";
import { SwaggerToApiCliError } from "./types";

interface ParsedCliArgs {
  readonly command: SwaggerToApiCliCommand;
  readonly configPath?: string;
}

export const runSwaggerToApiCli = async (
  argv: readonly string[],
  runner: SwaggerToApiCliRunner = createNodeCliRunner(),
): Promise<SwaggerToApiCliResult> => {
  const args = parseCliArgs(argv);

  if (args.command === "help") {
    return {
      command: "help",
      apiFileCount: 0,
      docsFileCount: 0,
      endpointCount: 0,
    };
  }

  const config = await loadSwaggerToApiConfig(runner, args.configPath);
  const endpoints = filterEndpoints(
    await loadApiEndpoints(runner, config.source),
    config,
  );

  switch (args.command) {
    case "generate":
      return writeApiFiles(runner, config, endpoints);
    case "docs:dev":
      return runDocsCommand(runner, config, endpoints, "dev");
    case "docs:build":
      return runDocsCommand(runner, config, endpoints, "build");
    case "validate":
      return validateConfig(config, endpoints);
    default:
      return assertNever(args.command);
  }
};

export const createCliHelpText = (): string =>
  [
    "swagger-to-api",
    "",
    "用法:",
    "  swagger-to-api generate -c swagger-to-api.config.ts",
    "  swagger-to-api docs:dev -c swagger-to-api.config.ts",
    "  swagger-to-api docs:build -c swagger-to-api.config.ts",
    "  swagger-to-api validate -c swagger-to-api.config.ts",
    "",
    "选项:",
    "  -c, --config  指定配置文件路径",
    "  -h, --help    显示帮助信息",
  ].join("\n");

export const parseCliArgs = (argv: readonly string[]): ParsedCliArgs => {
  const [commandValue, ...restArgs] = argv;

  if (
    commandValue === undefined ||
    commandValue === "-h" ||
    commandValue === "--help"
  ) {
    return {
      command: "help",
    };
  }

  if (!isCliCommand(commandValue)) {
    throw new SwaggerToApiCliError(`未知命令：${commandValue}`);
  }

  return {
    command: commandValue,
    ...parseConfigArg(restArgs),
  };
};

const parseConfigArg = (
  argv: readonly string[],
): Pick<ParsedCliArgs, "configPath"> => {
  const configIndex = argv.findIndex(
    (arg) => arg === "-c" || arg === "--config",
  );

  if (configIndex === -1) {
    return {};
  }

  const configPath = argv[configIndex + 1];

  if (!configPath || configPath.startsWith("-")) {
    throw new SwaggerToApiCliError("缺少配置文件路径");
  }

  return {
    configPath,
  };
};

const writeApiFiles = async (
  runner: SwaggerToApiCliRunner,
  config: SwaggerToApiConfig,
  endpoints: readonly ApiEndpointModel[],
): Promise<SwaggerToApiCliResult> => {
  const result = generateApiCode({
    endpoints,
    request: config.request,
  });
  const overwrite = config.generate?.overwrite ?? true;

  await Promise.all(
    result.files.map((file) =>
      runner.writeTextFile(
        resolveOutputPath(runner.cwd, config.output.apiDir, file.path),
        file.content,
        {
          overwrite,
        },
      ),
    ),
  );

  return {
    command: "generate",
    apiFileCount: result.files.length,
    docsFileCount: 0,
    endpointCount: endpoints.length,
  };
};

const runDocsCommand = async (
  runner: SwaggerToApiCliRunner,
  config: SwaggerToApiConfig,
  endpoints: readonly ApiEndpointModel[],
  vitePressCommand: "build" | "dev",
): Promise<SwaggerToApiCliResult> => {
  const docsResult = generateApiDocs({
    endpoints,
  });
  const overwrite = config.generate?.overwrite ?? true;
  const docsDir = resolvePath(runner.cwd, config.output.docsDir);

  await Promise.all(
    docsResult.files.map((file) =>
      runner.writeTextFile(resolve(docsDir, file.path), file.content, {
        overwrite,
      }),
    ),
  );

  await runner.runCommand("pnpm", [
    "exec",
    "vitepress",
    vitePressCommand,
    docsDir,
  ]);

  return {
    command: vitePressCommand === "dev" ? "docs:dev" : "docs:build",
    apiFileCount: 0,
    docsFileCount: docsResult.files.length,
    endpointCount: endpoints.length,
  };
};

const validateConfig = (
  config: SwaggerToApiConfig,
  endpoints: readonly ApiEndpointModel[],
): SwaggerToApiCliResult => {
  const apiResult = generateApiCode({
    endpoints,
    request: config.request,
  });
  const docsResult = generateApiDocs({
    endpoints,
  });

  return {
    command: "validate",
    apiFileCount: apiResult.files.length,
    docsFileCount: docsResult.files.length,
    endpointCount: endpoints.length,
  };
};

const filterEndpoints = (
  endpoints: readonly ApiEndpointModel[],
  config: SwaggerToApiConfig,
): readonly ApiEndpointModel[] => {
  const includeTags = new Set(config.generate?.includeTags ?? []);
  const excludeTags = new Set(config.generate?.excludeTags ?? []);

  return endpoints.filter((endpoint) => {
    const tags = endpoint.tags.length === 0 ? ["default"] : endpoint.tags;
    const isIncluded =
      includeTags.size === 0 || tags.some((tag) => includeTags.has(tag));
    const isExcluded = tags.some((tag) => excludeTags.has(tag));

    return isIncluded && !isExcluded;
  });
};

const resolveOutputPath = (
  cwd: string,
  outputDir: string,
  filePath: string,
): string => resolve(resolvePath(cwd, outputDir), filePath);

const resolvePath = (cwd: string, path: string): string =>
  isAbsolute(path) ? path : resolve(cwd, path);

const isCliCommand = (value: string): value is SwaggerToApiCliCommand =>
  value === "generate" ||
  value === "docs:dev" ||
  value === "docs:build" ||
  value === "validate";

const assertNever = (value: never): never => {
  throw new SwaggerToApiCliError(`未知命令：${String(value)}`);
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runSwaggerToApiCli(process.argv.slice(2)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
