# 使用示例

## 生成业务 API

`swagger-to-api.config.ts`：

```ts
import type { SwaggerToApiConfig } from "@cm/swagger-to-api-cli";

export default {
  source: "./openapi.json",
  output: {
    apiDir: "src/api/generated",
    docsDir: "swagger-docs",
  },
  request: {
    importFrom: "@/utils/request",
    clientName: "request",
  },
  generate: {
    overwrite: true,
  },
} satisfies SwaggerToApiConfig;
```

生成：

```bash
pnpm swagger-to-api generate -c swagger-to-api.config.ts
```

使用生成结果：

```ts
import { getContractDetail, searchContract } from "@/api/generated";

const detail = await getContractDetail({ id: "10001" });

const list = await searchContract(
  { pageNum: 1, pageSize: 20 },
  { ownerId: "u-10001" },
);
```

## 只生成部分 tag

```ts
import type { SwaggerToApiConfig } from "@cm/swagger-to-api-cli";

export default {
  source: "./openapi.json",
  output: {
    apiDir: "src/api/generated",
    docsDir: "swagger-docs",
  },
  request: {
    importFrom: "@/utils/request",
    clientName: "request",
  },
  generate: {
    includeTags: ["contract"],
    overwrite: true,
  },
} satisfies SwaggerToApiConfig;
```

## 生成接口文档站点

```bash
pnpm swagger-to-api docs:dev -c swagger-to-api.config.ts
pnpm swagger-to-api docs:build -c swagger-to-api.config.ts
```

`docs:dev` 会写入 `output.docsDir` 并启动 VitePress 开发服务。

## CI 校验

```bash
pnpm swagger-to-api validate -c swagger-to-api.config.ts
```

`validate` 会读取配置和 OpenAPI 文档，校验 API 代码与接口文档是否可生成，不写入文件。
