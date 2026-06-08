# API 代码生成器设计

## 目标

API 代码生成器负责把内部统一模型转换为业务项目可直接引用的 TypeScript 代码。

核心目标：

- 生成完整接口请求函数。
- 生成完整入参和出参类型。
- 给字段补齐说明、示例、枚举和必填信息。
- 支持自定义模板，适配不同请求客户端。
- 默认适配当前仓库的 `@cm/shared-http`。

## 输入模型

API 代码生成器只消费内部统一模型，不直接读取 Swagger / OpenAPI 原始文档。

核心输入：

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

export interface ApiParameterModel {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required: boolean;
  description?: string;
  example?: unknown;
  schema: ApiSchemaModel;
}

export interface ApiResponseModel {
  statusCode: string;
  description?: string;
  schema?: ApiSchemaModel;
  examples?: Record<string, unknown>;
}
```

## 输出结构

推荐按 `tag` 分组：

```txt
src/api/generated/
  contract/
    api.ts
    types.ts
  user/
    api.ts
    types.ts
  index.ts
```

职责划分：

- `types.ts`：输出 path、query、header、body、response 和复用 schema 类型。
- `api.ts`：输出请求函数、请求地址、请求方法和请求客户端适配代码。
- `index.ts`：输出统一导出，方便业务模块引用。

## 类型生成规则

### path 参数

路径变量统一生成独立类型：

```ts
export interface GetContractDetailPathParams {
  /**
   * 合同 ID
   *
   * @example "10001"
   */
  id: string;
}
```

### query 参数

query 参数统一生成对象类型：

```ts
export interface SearchContractQueryParams {
  /**
   * 合同名称
   *
   * @example "采购合同"
   */
  contractName?: string;

  /**
   * 页码
   *
   * @example 1
   */
  pageNum?: number;
}
```

### request body

body 优先复用 schema 名称；匿名 body 使用接口名生成：

```ts
export interface CreateContractRequestBody {
  /**
   * 合同编号
   *
   * @example "HT202606050001"
   */
  contractCode: string;
}
```

### response body

优先选取业务返回状态码作为 response 类型。

MVP 默认优先级：

1. `200`
2. `201`
3. `default`
4. 第一个包含 schema 的 response

该规则后续应支持配置覆盖。

```ts
export interface GetContractDetailResponse {
  /**
   * 合同详情
   */
  data?: ContractDetail;
}
```

## 请求函数生成规则

默认生成方式：

```ts
import { request } from "@cm/shared-http";
import type {
  GetContractDetailPathParams,
  GetContractDetailResponse,
} from "./types";

export function getContractDetail(
  path: GetContractDetailPathParams,
): Promise<GetContractDetailResponse> {
  return request<GetContractDetailResponse>({
    url: `/contract/${path.id}`,
    method: "get",
  });
}
```

参数映射：

- path 参数参与 URL 模板替换。
- query 参数写入 `params`。
- request body 写入 `data`。
- header 参数写入 `headers`。

多参数接口示例：

```ts
export function searchContract(
  query?: SearchContractQueryParams,
  body?: SearchContractRequestBody,
): Promise<SearchContractResponse> {
  return request<SearchContractResponse>({
    url: "/contract/search",
    method: "post",
    params: query,
    data: body,
  });
}
```

## 命名策略

函数名优先级：

1. 使用 `operationId`。
2. 使用请求方法和 path 生成，例如 `getContractById`。
3. 如果允许使用 `summary`，需要明确中文转英文或拼音策略。

类型名规则：

- `{FunctionName}PathParams`
- `{FunctionName}QueryParams`
- `{FunctionName}HeaderParams`
- `{FunctionName}RequestBody`
- `{FunctionName}Response`

同名处理：

- 同 tag 内函数名重复时直接报错。
- 类型名重复但结构一致时可以复用。
- 类型名重复但结构不一致时直接报错。

## 模板设计

默认模板覆盖当前仓库常见请求写法，自定义模板用于适配不同项目。

模板上下文：

```ts
export interface ApiTemplateContext {
  groupName: string;
  endpoints: ApiEndpointModel[];
  request: {
    importFrom: string;
    clientName: string;
    unwrapData?: boolean;
  };
  imports: ApiTemplateImportModel[];
}
```

可配置模板：

- `apiFile`：请求函数文件模板。
- `typeFile`：类型文件模板。
- `indexFile`：导出入口模板。

模板必须保留：

- 显式 TypeScript 类型。
- `import type` 类型导入。
- 字段 JSDoc 注释。
- 生成文件头部说明。

## 校验规则

生成前校验：

- 输出目录是否可写。
- 是否存在命名冲突。
- path 参数是否都能在 URL 中找到。
- 必填 request body 是否缺失 schema。
- response 是否存在可用 schema。

生成后校验：

- 生成文件必须可被 TypeScript 解析。
- 格式化后写入。
- 必要时运行目标项目 typecheck。

## 待确认问题

- 请求函数返回完整 response 还是只返回业务 `data`。
- `@cm/shared-http` 最终导出的请求函数名称是否固定为 `request`。
- 缺失 `operationId` 时是否允许自动根据 path 命名。
- 对匿名 schema 是否需要强制提升为复用类型。
- 多个 response 状态码时是否允许生成联合类型。
