# 快速开始

## 安装 CLI

```bash
pnpm add -D @lsh/swagger-to-api-cli
```

`@lsh/swagger-to-api-cli` 是整个工具的入口，安装后会提供 `swagger-to-api` 命令。

生成接口文档站点时，还需要安装 VitePress：

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

当前不支持远程 URL。

## 创建配置文件

```ts
// swagger-to-api.config.ts
import type { SwaggerToApiConfig } from "@lsh/swagger-to-api-cli";

export default {
  source: "./swagger.json",
  output: {
    apiDir: "src/api/generated",
    docsDir: "swagger-docs",
  },
  request: {
    importFrom: "@lsh/shared-http",
    clientName: "request",
  },
  generate: {
    overwrite: true,
  },
} satisfies SwaggerToApiConfig;
```

CLI 支持 `.json`、`.js`、`.mjs`、`.ts`、`.mts`、`.cts` 配置文件。

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

该命令会写入 `output.docsDir`，再执行：

```bash
pnpm exec vitepress dev <docsDir>
```

## 构建接口文档

```bash
pnpm swagger-to-api docs:build -c swagger-to-api.config.ts
```

该命令会写入 `output.docsDir`，再执行：

```bash
pnpm exec vitepress build <docsDir>
```

## 只做校验

```bash
pnpm swagger-to-api validate -c swagger-to-api.config.ts
```

`validate` 只校验生成流程，不写入文件，不启动 VitePress。

## 下一步

- 查看 [使用示例](./usage-examples.md)
- 查看 [配置说明](./configuration.md)
- 查看 [CLI 使用](./cli.md)
