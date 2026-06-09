import { toKebabCase } from "./naming";
import type {
  ApiEndpointModel,
  ApiGeneratedGroup,
  GenerateApiCodeOptions,
} from "./types";

export const groupEndpoints = (
  options: GenerateApiCodeOptions,
): readonly ApiGeneratedGroup[] => {
  const defaultGroupName = options.defaultGroupName ?? "default";
  const groupMap = new Map<string, ApiEndpointModel[]>();

  for (const endpoint of options.endpoints) {
    const groupName = endpoint.tags[0] ?? defaultGroupName;
    const endpoints = groupMap.get(groupName) ?? [];
    endpoints.push(endpoint);
    groupMap.set(groupName, endpoints);
  }

  return Array.from(groupMap.entries()).map(([groupName, endpoints]) => ({
    groupName,
    directoryName: toKebabCase(groupName),
    endpoints,
  }));
};
