import type { ApiDocsGeneratedGroup } from "./types";

export const createDefaultConfigFile = (
  groups: readonly ApiDocsGeneratedGroup[],
  siteTitle: string,
): string => {
  const sidebar = Object.fromEntries(
    groups.map((group) => [
      `/api/${group.directoryName}/`,
      [
        {
          text: group.groupName,
          items: group.endpoints.map((endpoint) => ({
            text: endpoint.title,
            link: endpoint.docPath,
          })),
        },
      ],
    ]),
  );

  return [
    'import { defineConfig } from "vitepress";',
    "",
    "export default defineConfig({",
    `  title: ${JSON.stringify(siteTitle)},`,
    "  themeConfig: {",
    "    nav: [",
    `      { text: "接口文档", link: ${JSON.stringify(groups[0]?.endpoints[0]?.docPath ?? "/")} },`,
    "    ],",
    "    search: {",
    '      provider: "local",',
    "    },",
    `    sidebar: ${JSON.stringify(sidebar, null, 6)}`,
    "  },",
    "});",
    "",
  ].join("\n");
};
