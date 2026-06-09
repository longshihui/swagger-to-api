# `@cm/swagger-to-api`

`swagger-to-api` 读取本地 OpenAPI JSON/YAML，生成 TypeScript API 代码和 VitePress 接口文档。

## 项目使用

安装：

```bash
pnpm add -D @cm/swagger-to-api-cli
```

需要生成接口文档站点时，同时安装：

```bash
pnpm add -D vitepress
```

创建 `swagger-to-api.config.ts`：

```ts
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

生成 API 代码：

```bash
pnpm swagger-to-api generate -c swagger-to-api.config.ts
```

生成的代码可直接在业务中引用：

```ts
import { getContractDetail } from "@/api/generated";

const detail = await getContractDetail({ id: "10001" });
```

更多示例见 [使用示例](./docs/guide/usage-examples.md)。

## 项目开发

安装依赖：

```bash
pnpm install
```

常用命令：

```bash
pnpm run docs:dev
pnpm run docs:build
pnpm run typecheck
pnpm run lint:eslint
pnpm run test
```

## 文档

- [快速开始](./docs/guide/getting-started.md)
- [使用示例](./docs/guide/usage-examples.md)
- [配置说明](./docs/guide/configuration.md)
- [CLI 使用](./docs/guide/cli.md)
- [项目开发](./docs/development.md)
- [API 参考](./docs/api-reference.md)
- [架构设计](./docs/architecture.md)
- [API 代码生成器设计](./docs/api-generator-design.md)
- [API 文档生成器设计](./docs/api-docs-generator-design.md)
- [部署到 GitHub Pages](./docs/deployment.md)
