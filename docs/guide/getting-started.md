# 快速开始

## 安装 CLI

```bash
pnpm add -D @cm/swagger-to-api-cli
```

`@cm/swagger-to-api-cli` 是整个工具的入口，安装后会提供 `swagger-to-api` 命令。

如果需要使用 `docs:dev` 或 `docs:build` 生成接口文档站点，还需要在业务项目中安装 VitePress：

```bash
pnpm add -D vitepress
```

## 准备 OpenAPI 文档

当前实现支持本地 OpenAPI 3.x JSON/YAML 文件：

```txt
swagger.json
openapi.yaml
openapi.yml
```

MVP 阶段暂不支持远程 URL 输入，CLI 会明确报错。

## 创建配置文件

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

CLI 支持 `.json`、`.js`、`.mjs`、`.ts`、`.mts`、`.cts` 配置文件。TypeScript 配置通过 `jiti` 加载。

## 生成 API 代码

```bash
pnpm swagger-to-api generate -c swagger-to-api.config.ts
```

生成结构示例：

```txt
src/api/generated/
  contract/
    api.ts
    types.ts
  index.ts
```

## 生成并运行接口文档

```bash
pnpm swagger-to-api docs:dev -c swagger-to-api.config.ts
```

该命令会先把接口文档文件写入 `output.docsDir`，再执行：

```bash
pnpm exec vitepress dev <docsDir>
```

## 构建接口文档

```bash
pnpm swagger-to-api docs:build -c swagger-to-api.config.ts
```

该命令会先写入文档站点文件，再执行：

```bash
pnpm exec vitepress build <docsDir>
```

## 只做校验

```bash
pnpm swagger-to-api validate -c swagger-to-api.config.ts
```

`validate` 会读取配置和 OpenAPI 文档，执行模型转换、API 代码生成和文档生成，但不会写入文件，也不会启动 VitePress。
