import { groupDocsEndpoints } from "./docs-groups";
import { validateDocsGroups } from "./docs-validation";
import { createDefaultConfigFile } from "./render-config-file";
import { createDefaultPageFile } from "./render-page-file";
import { createSearchIndex } from "./search-index";
import type { GenerateApiDocsOptions, GenerateApiDocsResult } from "./types";

const DEFAULT_SITE_TITLE = "API 文档";

export const generateApiDocs = (
  options: GenerateApiDocsOptions,
): GenerateApiDocsResult => {
  const groups = groupDocsEndpoints(options);
  validateDocsGroups(groups);
  const searchIndex = createSearchIndex(groups);
  const files = groups.flatMap((group) =>
    group.endpoints.map((endpoint) => ({
      path: `api/${group.directoryName}/${endpoint.fileName}.md`,
      content:
        options.templates?.pageFile?.(endpoint) ??
        createDefaultPageFile(endpoint.endpoint),
    })),
  );

  files.push({
    path: "public/api-index.json",
    content:
      options.templates?.searchIndexFile?.(searchIndex) ??
      `${JSON.stringify(searchIndex, null, 2)}\n`,
  });

  files.push({
    path: ".vitepress/config.ts",
    content:
      options.templates?.configFile?.(groups) ??
      createDefaultConfigFile(groups, options.siteTitle ?? DEFAULT_SITE_TITLE),
  });

  return {
    files,
    groups,
    searchIndex,
  };
};
