# 架构设计

`swagger-to-api` 当前按 monorepo 拆成四个包：

```txt
packages/
  shared
  swagger-api-generator
  swagger-api-ui-generator
  swagger-to-api-cli
```

## 数据流

```txt
本地 OpenAPI JSON/YAML
  -> CLI 读取 source
  -> convertOpenApiDocumentToEndpoints
  -> ApiEndpointModel[]
  -> generateApiCode / generateApiDocs
  -> 写入 API 代码 / 写入接口文档站点
```

## 包职责

### `@cm/swagger-api-generator`

负责统一模型定义、OpenAPI 3.x 到统一模型转换、TypeScript API 代码生成。

核心导出：

- `convertOpenApiDocumentToEndpoints`
- `generateApiCode`
- `selectApiResponse`
- `createTypeLiteralFromSchema`
- 统一模型类型和生成结果类型

### `@cm/swagger-api-ui-generator`

负责把统一模型转换成 VitePress 文档站点文件。

核心导出：

- `generateApiDocs`
- 文档搜索索引类型
- 文档生成结果类型

### `@cm/swagger-to-api-cli`

负责命令行入口和工程编排。

核心职责：

- 解析命令参数。
- 加载配置。
- 读取本地 OpenAPI JSON/YAML。
- 调用代码生成器和文档生成器。
- 写入文件。
- 调用 VitePress dev/build。

### `@cm/shared`

当前只提供基础包元信息工具。

## 当前边界

已实现：

- 本地 JSON/YAML 输入。
- OpenAPI 3.x 基础路径、参数、请求体、响应和本地 `$ref` 转换。
- API 代码生成。
- VitePress 接口文档生成。
- CLI 编排。

未实现：

- 远程 URL 输入。
- Swagger 2.0 兼容。
- 外部 `$ref`。
- CLI 外部模板文件加载。
- watch 模式。

## 校验策略

仓库验证命令：

```bash
pnpm run validate
pnpm run format:check
```

`validate` 会依次执行类型检查、ESLint 和单元测试。
