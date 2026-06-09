import type { ApiDocsGeneratedGroup, ApiDocsSearchItem } from "./types";

export const createSearchIndex = (
  groups: readonly ApiDocsGeneratedGroup[],
): readonly ApiDocsSearchItem[] =>
  groups.flatMap((group) =>
    group.endpoints.map(({ endpoint, title, docPath }) => ({
      title,
      operationId: endpoint.operationId,
      method: endpoint.method.toUpperCase(),
      path: endpoint.path,
      tags: endpoint.tags,
      docPath,
      ...(endpoint.summary === undefined ? {} : { summary: endpoint.summary }),
      ...(endpoint.description === undefined
        ? {}
        : { description: endpoint.description }),
    })),
  );
