---
layout: home

hero:
  name: swagger-to-api
  text: OpenAPI 到 TypeScript API 与接口文档的自动生成工具
  tagline: 读取本地 OpenAPI JSON/YAML，生成可直接调用的 TypeScript 请求函数，并同步产出 VitePress 接口文档站点。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: API 参考
      link: /api-reference

features:
  - title: API 代码生成
    details: 按 tag 分组生成 api.ts、types.ts 和统一导出入口，包含 path、query、header、body、response 类型。
  - title: 接口文档站点
    details: 生成 VitePress 配置、接口 Markdown 页面和 api-index.json 搜索索引，支持本地预览与静态构建。
  - title: CLI 编排
    details: 提供 generate、docs:dev、docs:build、validate 命令，适合接入本地开发和 CI 流程。
  - title: OpenAPI 转换
    details: 支持本地 JSON/YAML OpenAPI 3.x、components.schemas 本地 ref、参数、请求体和响应 schema。
  - title: 类型安全
    details: 统一模型和生成器配置均使用 TypeScript 类型定义，便于在业务项目中扩展和集成。
  - title: 可部署文档
    details: 内置项目文档 VitePress 配置，并提供 GitHub Pages Actions 部署工作流。
---
