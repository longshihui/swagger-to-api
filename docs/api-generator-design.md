# API 代码生成器设计

API 代码生成器位于 `packages/swagger-api-generator`，负责两件事：

1. 把已解析的 OpenAPI 3.x 文档对象转换为统一接口模型。
2. 把统一接口模型生成 TypeScript API 文件。

## 输入模型

生成器核心输入是 `ApiEndpointModel[]`。CLI 会通过 `convertOpenApiDocumentToEndpoints` 从 OpenAPI 文档生成该模型。

```ts
export interface ApiEndpointModel {
  readonly id: string;
  readonly operationId: string;
  readonly functionName: string;
  readonly summary?: string;
  readonly description?: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly tags: readonly string[];
  readonly parameters: readonly ApiParameterModel[];
  readonly requestBody?: ApiSchemaModel;
  readonly requestBodyRequired?: boolean;
  readonly responses: readonly ApiResponseModel[];
}
```

## OpenAPI 转换

`convertOpenApiDocumentToEndpoints(document)` 支持：

- OpenAPI 3.x `paths`。
- path 级和 operation 级 `parameters` 合并。
- `requestBody.content` 中的 JSON schema。
- `responses.content` 中的 JSON schema。
- `components.schemas` 本地 `$ref`。
- schema 的 `properties`、`required`、`items`、`additionalProperties`、`enum`、`example`、`nullable`、`allOf`、`anyOf`、`oneOf`。

当前不支持：

- 远程 URL 输入。
- 外部 `$ref`。
- Swagger 2.0。

## 输出结构

默认按第一个 tag 分组。缺失 tag 时使用 `default`。

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

## 类型生成

### 参数类型

path、query、header 参数分别生成独立类型：

```ts
export interface GetContractDetailPathParams {
  /**
   * 合同 ID
   * @example "10001"
   */
  id: string;
}
```

### request body

命名 schema 优先复用 schema 名称；匿名 schema 使用 `{FunctionName}RequestBody`。

### response

响应类型选择规则：

1. `200`
2. `201`
3. `default`
4. 第一个包含 schema 的 response

命名 schema 会生成复用类型和响应别名：

```ts
export interface ContractDetail {
  id: string;
}

export type GetContractDetailResponse = ContractDetail;
```

## 请求函数生成

默认请求客户端配置：

```ts
{
  importFrom: "@lsh/shared-http",
  clientName: "request"
}
```

生成示例：

```ts
import { request } from "@lsh/shared-http";
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

- path 参数替换 URL 模板。
- query 参数写入 `params`。
- request body 写入 `data`。
- header 参数写入 `headers`。

## 校验规则

生成前会校验：

- 同一分组内函数名不能重复。
- path 参数必须出现在 URL 中。
- response 必须存在可用 schema。
- 同名类型结构不一致时抛出错误。

## 模板扩展

底层 `generateApiCode` 支持函数式模板：

```ts
generateApiCode({
  endpoints,
  templates: {
    apiFile: (context) => "...",
    typeFile: (context) => "...",
    indexFile: (groups) => "...",
  },
});
```

CLI 配置中已保留模板路径字段，但尚未实现外部模板文件加载。
