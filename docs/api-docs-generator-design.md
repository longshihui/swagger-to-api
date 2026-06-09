# API 文档生成器设计

API 文档生成器位于 `packages/swagger-api-ui-generator`，负责把统一接口模型转换为 VitePress 文档站点文件。

## 输入

核心输入是 `ApiEndpointModel[]`：

```ts
generateApiDocs({
  endpoints,
  siteTitle: "接口文档",
});
```

## 输出结构

```txt
swagger-docs/
  .vitepress/
    config.ts
  api/
    contract/
      get-contract-detail.md
  public/
    api-index.json
```

输出文件由 `generateApiDocs` 以虚拟文件数组返回：

```ts
interface GenerateApiDocsResult {
  readonly files: readonly GeneratedApiDocsFile[];
  readonly groups: readonly ApiDocsGeneratedGroup[];
  readonly searchIndex: readonly ApiDocsSearchItem[];
}
```

CLI 会把这些文件写入 `output.docsDir`。

## 页面内容

每个接口生成一个 Markdown 页面，包含：

- 标题。
- 基础信息表。
- Path 参数表。
- Query 参数表。
- Header 参数表。
- Request Body 字段表。
- 响应字段表。
- 其他响应状态码说明。
- 请求示例。
- 响应示例。

字段表列：

| 字段 | 类型 | 必填 | 说明 | 示例 | 枚举 |
| ---- | ---- | ---- | ---- | ---- | ---- |

## 分组和路由

默认使用第一个 tag 分组：

```txt
api/<tag>/<operation-id>.md
```

缺失 tag 时使用 `defaultGroupName`，默认值为 `default`。

## 搜索索引

生成 `public/api-index.json`：

```ts
export interface ApiDocsSearchItem {
  readonly title: string;
  readonly operationId: string;
  readonly method: string;
  readonly path: string;
  readonly tags: readonly string[];
  readonly docPath: string;
  readonly summary?: string;
  readonly description?: string;
}
```

该索引用于后续自定义接口搜索。VitePress 配置同时启用了内置本地搜索：

```ts
search: {
  provider: "local";
}
```

## 示例生成

请求示例：

1. 优先使用参数或 schema 上的 `example`。
2. 其次使用 enum 第一个值。
3. 最后根据 schema 类型生成占位值。

响应示例：

1. 优先使用 response `examples`。
2. 其次使用 response schema 字段 example。
3. 最后根据 schema 类型生成占位值。

## 校验规则

生成前会校验：

- 同一分组内文档文件名不能重复。
- 搜索索引 `docPath` 不能重复。
- 被选中的业务 response 必须包含 schema。

## 模板扩展

底层 `generateApiDocs` 支持函数式模板：

```ts
generateApiDocs({
  endpoints,
  templates: {
    pageFile: (endpoint) => "...",
    configFile: (groups) => "...",
    searchIndexFile: (items) => "...",
  },
});
```

CLI 配置中已保留 `templates.docsPage`，但尚未实现外部模板文件加载。
