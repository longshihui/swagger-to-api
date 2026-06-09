import type { ApiDocsGeneratedGroup } from "./types";
import { ApiDocsGeneratorError } from "./types";

export const validateDocsGroups = (
  groups: readonly ApiDocsGeneratedGroup[],
): void => {
  const docPaths = new Set<string>();

  for (const group of groups) {
    const fileNames = new Set<string>();

    for (const endpoint of group.endpoints) {
      if (fileNames.has(endpoint.fileName)) {
        throw new ApiDocsGeneratorError(
          `分组 ${group.groupName} 存在重复文档路径 ${endpoint.fileName}`,
        );
      }

      if (docPaths.has(endpoint.docPath)) {
        throw new ApiDocsGeneratorError(
          `搜索索引存在重复 docPath ${endpoint.docPath}`,
        );
      }

      fileNames.add(endpoint.fileName);
      docPaths.add(endpoint.docPath);
    }
  }
};
