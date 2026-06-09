import { createTemplateContext } from "./endpoint-context";
import { groupEndpoints } from "./groups";
import { createDefaultApiFile } from "./render-api-file";
import { createDefaultIndexFile } from "./render-index-file";
import { createDefaultTypeFile } from "./render-type-file";
import { validateGroups } from "./validation";
import type {
  ApiGeneratorRequestConfig,
  GenerateApiCodeOptions,
  GenerateApiCodeResult,
} from "./types";

const DEFAULT_REQUEST_CONFIG: ApiGeneratorRequestConfig = {
  importFrom: "@lsh/shared-http",
  clientName: "request",
};

export const generateApiCode = (
  options: GenerateApiCodeOptions,
): GenerateApiCodeResult => {
  const request = createRequestConfig(options.request);
  const groups = groupEndpoints(options);
  validateGroups(groups);

  const files = groups.flatMap((group) => {
    const context = createTemplateContext(group, request);

    return [
      {
        path: `${group.directoryName}/types.ts`,
        content:
          options.templates?.typeFile?.(context) ??
          createDefaultTypeFile(context),
      },
      {
        path: `${group.directoryName}/api.ts`,
        content:
          options.templates?.apiFile?.(context) ??
          createDefaultApiFile(context),
      },
    ];
  });

  files.push({
    path: "index.ts",
    content:
      options.templates?.indexFile?.(groups) ?? createDefaultIndexFile(groups),
  });

  return {
    files,
    groups,
  };
};

const createRequestConfig = (
  request?: Partial<ApiGeneratorRequestConfig>,
): ApiGeneratorRequestConfig => ({
  importFrom: request?.importFrom ?? DEFAULT_REQUEST_CONFIG.importFrom,
  clientName: request?.clientName ?? DEFAULT_REQUEST_CONFIG.clientName,
  ...(request?.unwrapData === undefined
    ? {}
    : { unwrapData: request.unwrapData }),
});
