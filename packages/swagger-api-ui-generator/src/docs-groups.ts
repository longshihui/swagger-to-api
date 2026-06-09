import type { ApiEndpointModel } from "@lsh/swagger-api-generator";
import { toKebabCase } from "@lsh/shared";
import type { ApiDocsGeneratedGroup, GenerateApiDocsOptions } from "./types";

export const groupDocsEndpoints = (
  options: GenerateApiDocsOptions,
): readonly ApiDocsGeneratedGroup[] => {
  const defaultGroupName = options.defaultGroupName ?? "default";
  const groupMap = new Map<string, ApiEndpointModel[]>();

  for (const endpoint of options.endpoints) {
    const groupName = endpoint.tags[0] ?? defaultGroupName;
    const endpoints = groupMap.get(groupName) ?? [];
    endpoints.push(endpoint);
    groupMap.set(groupName, endpoints);
  }

  return Array.from(groupMap.entries()).map(([groupName, endpoints]) => {
    const directoryName = toKebabCase(groupName);

    return {
      groupName,
      directoryName,
      endpoints: endpoints.map((endpoint) => {
        const fileName = toKebabCase(
          endpoint.operationId || endpoint.functionName,
        );

        return {
          endpoint,
          title: createEndpointTitle(endpoint),
          fileName,
          docPath: `/api/${directoryName}/${fileName}`,
        };
      }),
    };
  });
};

export const createEndpointTitle = (endpoint: ApiEndpointModel): string =>
  endpoint.summary || endpoint.operationId || endpoint.functionName;
