# 配置说明

配置文件默认路径是 `swagger-to-api.config.ts`，也可以通过 `-c` 或 `--config` 指定。

## 完整类型

```ts
export interface SwaggerToApiConfig {
  readonly source: string;
  readonly output: {
    readonly apiDir: string;
    readonly docsDir: string;
  };
  readonly request: {
    readonly importFrom: string;
    readonly clientName: string;
    readonly unwrapData?: boolean;
  };
  readonly generate?: {
    readonly groupBy?: "tag" | "path";
    readonly operationName?: "operationId" | "summary" | "path";
    readonly overwrite?: boolean;
    readonly includeTags?: readonly string[];
    readonly excludeTags?: readonly string[];
  };
  readonly templates?: {
    readonly apiFile?: string;
    readonly typeFile?: string;
    readonly docsPage?: string;
  };
}
```

## `source`

OpenAPI 文档路径。当前实现支持本地文件：

- `.json`
- `.yaml`
- `.yml`

远程 URL 是后续增强项。

## `output`

| 字段      | 说明                     |
| --------- | ------------------------ |
| `apiDir`  | API 代码生成输出目录     |
| `docsDir` | 接口文档站点生成输出目录 |

路径可以是相对路径或绝对路径。相对路径基于 CLI 执行目录解析。

## `request`

用于控制生成的请求函数如何导入请求客户端。

```ts
request: {
  importFrom: "@cm/shared-http",
  clientName: "request",
}
```

生成示例：

```ts
import { request } from "@cm/shared-http";
```

`unwrapData` 当前保留在配置和类型中，默认模板暂未使用。

## `generate`

| 字段            | 当前状态 | 说明                               |
| --------------- | -------- | ---------------------------------- |
| `overwrite`     | 已实现   | 是否覆盖已有文件，默认 `true`      |
| `includeTags`   | 已实现   | 只生成指定 tag 的接口              |
| `excludeTags`   | 已实现   | 排除指定 tag 的接口                |
| `groupBy`       | 保留     | 当前生成器固定按 tag 分组          |
| `operationName` | 保留     | 当前模型转换优先使用 `operationId` |

## `templates`

配置类型中保留了模板文件路径字段：

- `apiFile`
- `typeFile`
- `docsPage`

当前 CLI 尚未读取外部模板文件。底层生成器已经支持函数式模板回调，后续 CLI 可在该字段基础上补齐模板文件加载。
