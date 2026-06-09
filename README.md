# `@cm/swagger-to-api`

`swagger-to-api` 是一个面向 TypeScript 项目的 OpenAPI 自动化工具。它可以读取本地 OpenAPI JSON/YAML 文档，转换为统一接口模型，并生成两类产物：

- 业务项目可直接引用的 TypeScript 请求函数和类型文件。
- 基于 VitePress 的接口文档站点和搜索索引。

## 快速使用

在业务项目中安装 CLI 包：

```bash
pnpm add -D @cm/swagger-to-api-cli
```

如果需要生成并运行接口文档站点，同时安装 VitePress：

```bash
pnpm add -D vitepress
```

创建配置文件：

```ts
// swagger-to-api.config.ts
import type { SwaggerToApiConfig } from "@cm/swagger-to-api-cli";

export default {
  source: "./swagger.json",
  output: {
    apiDir: "src/api/generated",
    docsDir: "swagger-docs",
  },
  request: {
    importFrom: "@cm/shared-http",
    clientName: "request",
  },
  generate: {
    overwrite: true,
  },
} satisfies SwaggerToApiConfig;
```

执行生成：

```bash
pnpm swagger-to-api generate -c swagger-to-api.config.ts
pnpm swagger-to-api docs:dev -c swagger-to-api.config.ts
pnpm swagger-to-api docs:build -c swagger-to-api.config.ts
pnpm swagger-to-api validate -c swagger-to-api.config.ts
```

项目自身文档站点：

```bash
pnpm run docs:dev
pnpm run docs:build
pnpm run docs:preview
```

## 文档

- [快速开始](./docs/guide/getting-started.md)
- [配置说明](./docs/guide/configuration.md)
- [CLI 使用](./docs/guide/cli.md)
- [API 参考](./docs/api-reference.md)
- [架构设计](./docs/architecture.md)
- [API 代码生成器设计](./docs/api-generator-design.md)
- [API 文档生成器设计](./docs/api-docs-generator-design.md)
- [部署到 GitHub Pages](./docs/deployment.md)
