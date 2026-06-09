import type { ApiEndpointModel } from "@lsh/swagger-api-generator";

export interface ApiDocsSearchItem {
  readonly title: string;
  readonly operationId: string;
  readonly method: string;
  readonly path: string;
  readonly tags: readonly string[];
  readonly docPath: string;
  readonly summary?: string;
  readonly description?: string;
}

export interface ApiDocsGeneratedEndpoint {
  readonly endpoint: ApiEndpointModel;
  readonly title: string;
  readonly fileName: string;
  readonly docPath: string;
}

export interface ApiDocsGeneratedGroup {
  readonly groupName: string;
  readonly directoryName: string;
  readonly endpoints: readonly ApiDocsGeneratedEndpoint[];
}

export interface GeneratedApiDocsFile {
  readonly path: string;
  readonly content: string;
}

export interface ApiDocsGeneratorTemplates {
  readonly pageFile?: (endpoint: ApiDocsGeneratedEndpoint) => string;
  readonly configFile?: (groups: readonly ApiDocsGeneratedGroup[]) => string;
  readonly searchIndexFile?: (items: readonly ApiDocsSearchItem[]) => string;
}

export interface GenerateApiDocsOptions {
  readonly endpoints: readonly ApiEndpointModel[];
  readonly siteTitle?: string;
  readonly defaultGroupName?: string;
  readonly templates?: ApiDocsGeneratorTemplates;
}

export interface GenerateApiDocsResult {
  readonly files: readonly GeneratedApiDocsFile[];
  readonly groups: readonly ApiDocsGeneratedGroup[];
  readonly searchIndex: readonly ApiDocsSearchItem[];
}

export class ApiDocsGeneratorError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ApiDocsGeneratorError";
  }
}
