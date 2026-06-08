# API 文档生成器设计

## 目标

API 文档生成器负责把内部统一模型转换为人类可阅读的接口文档站点。

核心目标：

- 展示接口地址、请求方法、接口名称和接口说明。
- 展示完整入参和出参字段说明。
- 展示字段类型、是否必填、example 和 enum。
- 支持根据接口名称、接口地址、请求方法搜索。
- 支持本地运行。
- 支持静态构建和部署。

## 输出结构

推荐生成 VitePress 站点：

```txt
swagger-docs/
  .vitepress/
    config.ts
  api/
    contract/
      get-contract-detail.md
      create-contract.md
    user/
      get-user-info.md
  public/
    api-index.json
```

目录职责：

- `.vitepress/config.ts`：站点配置、导航、侧边栏、搜索入口。
- `api/`：接口 Markdown 页面。
- `public/api-index.json`：搜索索引。

## 页面内容

每个接口生成一个 Markdown 页面。

页面基础信息：

- 接口名称。
- `operationId`。
- 请求方法。
- 接口地址。
- tag。
- 接口摘要。
- 接口描述。

页面参数信息：

- path 参数表。
- query 参数表。
- header 参数表。
- request body 字段表。
- response body 字段表。

字段表列：

| 字段   | 说明               |
| ------ | ------------------ |
| 字段名 | 参数或响应字段路径 |
| 类型   | TypeScript 类型    |
| 必填   | 是 / 否            |
| 说明   | 字段 description   |
| 示例   | 字段 example       |
| 枚举   | enum 可选值        |

页面示例信息：

- 请求示例。
- 响应示例。
- 错误响应说明。

## Markdown 页面示例

````md
# 查询合同详情

## 基础信息

| 项目        | 内容                |
| ----------- | ------------------- |
| 请求方法    | GET                 |
| 接口地址    | `/contract/{id}`    |
| operationId | `getContractDetail` |
| 分组        | contract            |

## Path 参数

| 字段 | 类型   | 必填 | 说明    | 示例    |
| ---- | ------ | ---- | ------- | ------- |
| id   | string | 是   | 合同 ID | "10001" |

## 响应字段

| 字段              | 类型   | 必填 | 说明     | 示例             |
| ----------------- | ------ | ---- | -------- | ---------------- |
| data.contractCode | string | 否   | 合同编号 | "HT202606050001" |

## 请求示例

```bash
curl -X GET "/contract/10001"
```

## 响应示例

```json
{
  "data": {
    "contractCode": "HT202606050001"
  }
}
```
````

## 搜索设计

MVP 阶段生成静态搜索索引：

```ts
export interface ApiSearchItem {
  title: string;
  operationId: string;
  method: string;
  path: string;
  tags: string[];
  summary?: string;
  description?: string;
  docPath: string;
}
```

搜索字段：

- 接口名称。
- `operationId`。
- 接口地址。
- 请求方法。
- tag。
- 摘要。

搜索结果展示：

- 接口名称。
- 请求方法。
- 接口地址。
- 所属 tag。
- 文档跳转地址。

后续增强：

- 支持字段名搜索。
- 支持 response 字段搜索。
- 支持按 tag 过滤。
- 支持按请求方法过滤。

## 站点运行与部署

本地运行：

```bash
swagger-to-api docs:dev -c swagger-to-api.config.ts
```

静态构建：

```bash
swagger-to-api docs:build -c swagger-to-api.config.ts
```

部署方式：

- 输出 VitePress 静态文件。
- 由业务项目或 CI 上传到静态资源服务。
- 文档站点不绑定具体业务运行时。

## 导航设计

默认按 tag 生成侧边栏：

```txt
合同接口
  - 查询合同详情
  - 创建合同

用户接口
  - 查询用户信息
```

当接口缺失 tag 时：

- 使用 `default` 分组。
- 或根据 path 第一段生成分组。

## 示例生成规则

请求示例来源优先级：

1. Swagger / OpenAPI 中声明的 example。
2. schema 中字段 example 组装。
3. 根据字段类型生成占位示例。

响应示例来源优先级：

1. response example。
2. response schema 字段 example 组装。
3. 根据 response schema 类型生成占位示例。

## 校验规则

生成前校验：

- 文档输出目录是否可写。
- 每个接口是否可以生成唯一文档路径。
- 搜索索引中的 `docPath` 是否唯一。

生成后校验：

- Markdown 文件格式化。
- VitePress 配置可解析。
- 搜索索引 JSON 可解析。
- 文档站点可以完成静态构建。

## 待确认问题

- 文档站点是否必须内置全文搜索，还是 MVP 只支持接口索引搜索。
- 是否需要在文档中展示鉴权、租户、权限等业务信息。
- 是否需要展示多个环境的 baseURL。
- 错误响应是否按状态码完整展示。
- 文档站点是否需要独立发布版本历史。
