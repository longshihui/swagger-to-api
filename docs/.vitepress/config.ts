import { defineConfig } from "vitepress";

export default defineConfig({
  title: "swagger-to-api",
  description: "OpenAPI 到 TypeScript API 与接口文档的自动生成工具",
  lang: "zh-CN",
  base: process.env.DOCS_BASE ?? "/",
  lastUpdated: true,
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "使用", link: "/guide/getting-started" },
      { text: "开发", link: "/development" },
      { text: "API", link: "/api-reference" },
      { text: "设计", link: "/architecture" },
    ],
    search: {
      provider: "local",
    },
    sidebar: [
      {
        text: "项目使用",
        items: [
          { text: "快速开始", link: "/guide/getting-started" },
          { text: "使用示例", link: "/guide/usage-examples" },
          { text: "配置说明", link: "/guide/configuration" },
          { text: "CLI 使用", link: "/guide/cli" },
        ],
      },
      {
        text: "项目开发",
        items: [
          { text: "开发指南", link: "/development" },
          { text: "部署", link: "/deployment" },
        ],
      },
      {
        text: "参考",
        items: [{ text: "API 参考", link: "/api-reference" }],
      },
      {
        text: "设计文档",
        items: [
          { text: "整体架构", link: "/architecture" },
          { text: "API 代码生成器", link: "/api-generator-design" },
          { text: "API 文档生成器", link: "/api-docs-generator-design" },
        ],
      },
    ],
    footer: {
      message: "基于 TypeScript、pnpm workspace 和 VitePress 构建。",
    },
  },
});
