# API 参考

## `@lsh/swagger-api-generator`

### `convertOpenApiDocumentToEndpoints(document)`

把已解析的 OpenAPI 文档对象转换为统一接口模型。

```ts
import { convertOpenApiDocumentToEndpoints } from "@lsh/swagger-api-generator";

const endpoints = convertOpenApiDocumentToEndpoints(openApiDocument);
```

当前支持：

- OpenAPI 3.x `paths`。
- path 级和 operation 级 `parameters`。
- `requestBody.content` 中的 JSON schema。
- `responses.content` 中的 JSON schema。
- `components.schemas` 本地 `$ref`。
- `allOf`、`anyOf`、`oneOf`、`enum`、`example`、`nullable`。

### `generateApiCode(options)`

根据统一接口模型生成 API 代码文件。

```ts
import { generateApiCode } from "@lsh/swagger-api-generator";

const result = generateApiCode({
  endpoints,
  request: {
    importFrom: "@lsh/shared-http",
    clientName: "request",
  },
});
```

返回值：

```ts
interface GenerateApiCodeResult {
  readonly files: readonly GeneratedApiFile[];
  readonly groups: readonly ApiGeneratedGroup[];
}
```

生成文件示例：

```txt
contract/types.ts
contract/api.ts
index.ts
```

### `selectApiResponse(endpoint)`

选择用于生成响应类型的 response。

优先级：

1. `200`
2. `201`
3. `default`
4. 第一个包含 schema 的 response

### `createTypeLiteralFromSchema(schema)`

把 `ApiSchemaModel` 转换为 TypeScript 类型字面量字符串。

## `@lsh/swagger-api-ui-generator`

### `generateApiDocs(options)`

根据统一接口模型生成 VitePress 文档站点文件。

```ts
import { generateApiDocs } from "@lsh/swagger-api-ui-generator";

const result = generateApiDocs({
  endpoints,
  siteTitle: "接口文档",
});
```

返回值：

```ts
interface GenerateApiDocsResult {
  readonly files: readonly GeneratedApiDocsFile[];
  readonly groups: readonly ApiDocsGeneratedGroup[];
  readonly searchIndex: readonly ApiDocsSearchItem[];
}
```

生成文件示例：

```txt
.vitepress/config.ts
api/contract/get-contract-detail.md
public/api-index.json
```

## `@lsh/swagger-to-api-cli`

### `runSwaggerToApiCli(argv, runner?)`

执行 CLI 主流程。

```ts
import { runSwaggerToApiCli } from "@lsh/swagger-to-api-cli";

await runSwaggerToApiCli(["generate", "-c", "swagger-to-api.config.ts"]);
```

### `parseCliArgs(argv)`

解析 CLI 参数，返回命令和配置路径。

### `loadSwaggerToApiConfig(runner, configPath?)`

读取并校验配置文件。

### `loadApiEndpoints(runner, source)`

读取本地 JSON/YAML OpenAPI 文件并转换为统一接口模型。

### `createNodeCliRunner(cwd?)`

创建真实 Node.js 运行器，提供文件读取、文件写入和子命令执行能力。

## 统一模型

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

```ts
export interface ApiParameterModel {
  readonly name: string;
  readonly in: "cookie" | "header" | "path" | "query";
  readonly required: boolean;
  readonly description?: string;
  readonly example?: unknown;
  readonly schema: ApiSchemaModel;
}
```

```ts
export interface ApiResponseModel {
  readonly statusCode: string;
  readonly description?: string;
  readonly schema?: ApiSchemaModel;
  readonly examples?: Readonly<Record<string, unknown>>;
}
```

```ts
export interface ApiSchemaModel {
  readonly name?: string;
  readonly type?:
    | "array"
    | "boolean"
    | "integer"
    | "null"
    | "number"
    | "object"
    | "string";
  readonly description?: string;
  readonly example?: unknown;
  readonly enum?: readonly unknown[];
  readonly nullable?: boolean;
  readonly properties?: Readonly<Record<string, ApiSchemaModel>>;
  readonly required?: readonly string[];
  readonly items?: ApiSchemaModel;
  readonly additionalProperties?: boolean | ApiSchemaModel;
  readonly allOf?: readonly ApiSchemaModel[];
  readonly anyOf?: readonly ApiSchemaModel[];
  readonly oneOf?: readonly ApiSchemaModel[];
}
```
