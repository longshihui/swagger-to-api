import type { ApiGeneratorRequestConfig } from "@cm/swagger-api-generator";

export interface SwaggerToApiConfig {
  readonly source: string;
  readonly output: {
    readonly apiDir: string;
    readonly docsDir: string;
  };
  readonly request: ApiGeneratorRequestConfig;
  readonly generate?: {
    readonly groupBy?: "tag" | "path";
    readonly operationName?: "operationId" | "summary" | "path";
    readonly overwrite?: boolean;
    readonly includeTags?: readonly string[];
    readonly excludeTags?: readonly string[];
  };
  readonly templates?: {
    readonly apiFile?: string;
    readonly typeFile?: string;
    readonly docsPage?: string;
  };
}

export interface SwaggerToApiCliResult {
  readonly command: SwaggerToApiCliCommand;
  readonly apiFileCount: number;
  readonly docsFileCount: number;
  readonly endpointCount: number;
}

export type SwaggerToApiCliCommand =
  | "docs:build"
  | "docs:dev"
  | "generate"
  | "help"
  | "validate";

export interface SwaggerToApiCliRunner {
  readonly cwd: string;
  readonly readTextFile: (path: string) => Promise<string>;
  readonly writeTextFile: (
    path: string,
    content: string,
    options: { readonly overwrite: boolean },
  ) => Promise<void>;
  readonly runCommand: (
    command: string,
    args: readonly string[],
  ) => Promise<void>;
}

export class SwaggerToApiCliError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "SwaggerToApiCliError";
  }
}
