# `@cm/swagger-to-api`

`swagger-to-api` 是面向当前 monorepo 的接口自动化生成方案，用于根据 Swagger / OpenAPI 文档生成业务可直接调用的 API 代码，并同步生成可本地运行、可部署的接口文档站点。

当前包处于方案设计阶段，暂不包含生成器实现代码。

## 工程脚手架

项目使用 pnpm workspace 管理 monorepo，包目录统一放在 `packages/` 下。

```bash
pnpm install
pnpm run typecheck
pnpm run lint:eslint
pnpm run test
pnpm run validate
pnpm run commit
```

Git 提交流程使用 Husky 和 Commitlint：

- `pnpm run commit`：使用 CLI 交互生成符合 Conventional Commits 的提交信息。
- `pre-commit`：运行 `pnpm run validate:commit`，校验 TypeScript 和 ESLint。
- `commit-msg`：运行 Commitlint，提交信息遵循 Conventional Commits。
- `pre-push`：运行 `pnpm run test`，执行单元测试。

提交信息示例：

```bash
git commit -m "feat(swagger-api-generator): init parser module"
git commit -m "chore(root): update workspace config"
```

## 目标

- 支持从本地 Swagger / OpenAPI 文件或远程 URL 读取接口文档。
- 生成完整的接口请求函数。
- 生成完整的入参、出参 TypeScript 类型。
- 根据接口文档中的 `description`、`summary`、`example`、`enum` 等信息生成字段注释。
- 支持自定义 API 文件模板，适配不同项目的请求封装。
- 生成可搜索的接口文档站点。
- 文档站点支持本地运行和静态部署。

## 设计边界

该包作为独立 CLI 工具存在，不直接依赖 `management-ui` 或 `base-ui`。

适合放在这里的能力：

- Swagger / OpenAPI 文档读取、校验、解析。
- OpenAPI Schema 到 TypeScript 类型的转换。
- API 请求函数生成。
- 生成模板管理。
- 文档站点内容生成。
- 本地预览和静态构建命令编排。

不建议放在这里的能力：

- 直接绑定某个业务项目的页面、路由或状态管理。
- 固定绑定 Element Plus 或 TDesign。
- 固定业务鉴权、租户、权限、菜单规则。
- 替代 `@cm/shared-http` 的请求协议能力。

## 整体设计

`swagger-to-api` 拆成三层：

```txt
Swagger / OpenAPI 文件或 URL
  -> 文档加载与解析层
  -> 内部统一模型层
  -> 产物生成层
```

### 文档加载与解析层

负责读取、校验和标准化原始 Swagger / OpenAPI 文档。

输入来源：

- 本地文件路径：`./swagger.json`、`./openapi.yaml`。
- 远程 URL：`https://example.com/swagger.json`。

核心职责：

- 读取 JSON / YAML。
- 校验文档格式。
- 处理 `$ref`。
- 兼容 OpenAPI 3.x 和 Swagger 2.0。
- 将原始 schema 交给内部模型层。

MVP 阶段优先完整支持 OpenAPI 3.x，Swagger 2.0 作为兼容目标逐步补齐。

### 内部统一模型层

生成器不直接依赖原始 Swagger / OpenAPI 节点，而是先转换为统一模型。

```ts
export interface ApiEndpointModel {
  id: string;
  operationId: string;
  functionName: string;
  summary?: string;
  description?: string;
  method: HttpMethod;
  path: string;
  tags: string[];
  parameters: ApiParameterModel[];
  requestBody?: ApiSchemaModel;
  responses: ApiResponseModel[];
}
```

统一模型负责沉淀：

- 接口名称。
- 请求方法。
- 接口地址。
- 分组信息。
- path / query / header / body 入参。
- response 出参。
- 字段说明、示例、枚举、必填状态。

这样 API 代码生成器和 API 文档生成器可以复用同一份结构化数据，后续支持模板、过滤、命名策略时也不需要反复处理原始 schema。

### 产物生成层

产物生成层拆成两个生成器：

- API 代码生成器：生成业务项目可直接引用的 TypeScript 类型和请求函数。
- API 文档生成器：生成可搜索、可本地预览、可部署的接口文档站点。

推荐输出结构：

```txt
projects/management-ui/src/api/generated/
  contract/
    api.ts
    types.ts
  user/
    api.ts
    types.ts
  index.ts

swagger-docs/
  .vitepress/
    config.ts
  api/
    contract/
      get-contract-detail.md
  public/
    api-index.json
```

## 推荐落地方式

优先将该工具实现为 CLI，而不是 Vite 插件：

```bash
pnpm swagger-to-api generate -c swagger-to-api.config.ts
pnpm swagger-to-api docs:dev -c swagger-to-api.config.ts
pnpm swagger-to-api docs:build -c swagger-to-api.config.ts
pnpm swagger-to-api validate -c swagger-to-api.config.ts
```

CLI 方式更适合接入 CI、手动生成、批量生成和多项目复用。后续如果需要开发态自动生成，可以再提供 Vite 插件作为 CLI 能力的薄封装。

## 配置示例

```ts
import type { SwaggerToApiConfig } from "@cm/swagger-to-api";

export default {
  source: "./swagger.json",
  output: {
    apiDir: "projects/management-ui/src/api/generated",
    docsDir: "swagger-docs",
  },
  request: {
    importFrom: "@cm/shared-http",
    clientName: "request",
  },
  generate: {
    groupBy: "tag",
    operationName: "operationId",
    overwrite: true,
  },
  templates: {
    apiFile: "./templates/api-file.hbs",
    typeFile: "./templates/type-file.hbs",
  },
} satisfies SwaggerToApiConfig;
```

配置模型：

```ts
export interface SwaggerToApiConfig {
  source: string;
  output: {
    apiDir: string;
    docsDir: string;
  };
  request: {
    importFrom: string;
    clientName: string;
    unwrapData?: boolean;
  };
  generate?: {
    groupBy?: "tag" | "path";
    operationName?: "operationId" | "summary" | "path";
    overwrite?: boolean;
    includeTags?: string[];
    excludeTags?: string[];
  };
  templates?: {
    apiFile?: string;
    typeFile?: string;
    docsPage?: string;
  };
}
```

## MVP 里程碑

### 第一阶段：基础解析与模型转换

- 支持本地 JSON / YAML 输入。
- 支持 OpenAPI 3.x。
- 支持 `$ref` 解析。
- 输出内部统一模型。
- 增加命名冲突校验。

### 第二阶段：API 代码生成

- 生成 TypeScript 类型。
- 生成按 tag 分组的请求函数。
- 支持 path / query / body / response 类型。
- 默认接入 `@cm/shared-http`。
- 支持自定义 API 文件模板。

### 第三阶段：API 文档生成

- 生成接口 Markdown 文档。
- 生成 VitePress 文档站点。
- 生成接口搜索索引。
- 支持本地预览和静态构建。

### 第四阶段：工程化增强

- 支持 URL 输入。
- 支持 Swagger 2.0 兼容。
- 支持 watch 模式。
- 支持 CI 中校验接口变更。

## 待确认问题

- 生成请求函数时，返回完整响应还是只返回业务 `data`。
- 多个 response 状态码同时存在时，默认选择哪个作为业务返回类型。
- 缺失 `operationId` 时，是否允许根据 path 自动命名。
- `summary` 或 `description` 包含中文时，函数名是否需要转拼音。
- 生成代码是直接写入业务项目源码目录，还是输出为独立包供业务项目引用。
- 文档站点是否需要展示鉴权、租户、权限等业务规则。

## 文档索引

- [API 代码生成器设计](./docs/api-generator-design.md)
- [API 文档生成器设计](./docs/api-docs-generator-design.md)
