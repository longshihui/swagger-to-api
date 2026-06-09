import { createEndpointContext, normalizeFunctionName } from "./endpoint-context";
import { createEndpointTypeDeclarations } from "./type-declarations";
import { selectApiResponse } from "./response";
import type { ApiEndpointModel, ApiGeneratedGroup } from "./types";
import { ApiGeneratorError } from "./types";

export const validateGroups = (
  groups: readonly ApiGeneratedGroup[],
): void => {
  for (const group of groups) {
    const functionNames = new Set<string>();
    const typeDeclarations = new Map<string, string>();

    for (const endpoint of group.endpoints) {
      const functionName = normalizeFunctionName(endpoint);

      if (functionNames.has(functionName)) {
        throw new ApiGeneratorError(
          `分组 ${group.groupName} 存在重复函数名 ${functionName}`,
        );
      }
      functionNames.add(functionName);

      validatePathParameters(endpoint);
      selectApiResponse(endpoint);

      const context = createEndpointContext(endpoint);
      const declarations = createEndpointTypeDeclarations(endpoint, context);

      for (const declaration of declarations) {
        const previousContent = typeDeclarations.get(declaration.name);

        if (previousContent && previousContent !== declaration.content) {
          throw new ApiGeneratorError(
            `分组 ${group.groupName} 存在冲突类型名 ${declaration.name}`,
          );
        }

        typeDeclarations.set(declaration.name, declaration.content);
      }
    }
  }
};

const validatePathParameters = (endpoint: ApiEndpointModel): void => {
  const pathParameters = endpoint.parameters.filter(
    (parameter) => parameter.in === "path",
  );

  for (const parameter of pathParameters) {
    const openApiPathPattern = `{${parameter.name}}`;
    const expressPathPattern = `:${parameter.name}`;

    if (
      !endpoint.path.includes(openApiPathPattern) &&
      !endpoint.path.includes(expressPathPattern)
    ) {
      throw new ApiGeneratorError(
        `接口 ${endpoint.id} 的 path 参数 ${parameter.name} 未出现在 URL 中`,
      );
    }
  }
};
