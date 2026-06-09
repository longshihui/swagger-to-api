# CLI 使用

CLI 包是 `@lsh/swagger-to-api-cli`，可执行命令为 `swagger-to-api`。

```bash
pnpm add -D @lsh/swagger-to-api-cli
```

如果要执行 `docs:dev` 或 `docs:build`，业务项目还需要安装 `vitepress`，因为 CLI 会在目标项目中执行 `pnpm exec vitepress ...`。

## 帮助

```bash
swagger-to-api --help
```

输出：

```txt
swagger-to-api

用法:
  swagger-to-api generate -c swagger-to-api.config.ts
  swagger-to-api docs:dev -c swagger-to-api.config.ts
  swagger-to-api docs:build -c swagger-to-api.config.ts
  swagger-to-api validate -c swagger-to-api.config.ts

选项:
  -c, --config  指定配置文件路径
  -h, --help    显示帮助信息
```

## `generate`

读取配置和 OpenAPI 文档，生成 API 代码文件。

```bash
swagger-to-api generate -c swagger-to-api.config.ts
```

执行流程：

1. 读取配置文件。
2. 读取本地 OpenAPI JSON/YAML。
3. 转换为统一接口模型。
4. 按 `includeTags` / `excludeTags` 过滤。
5. 调用 API 代码生成器。
6. 写入 `output.apiDir`。

## `docs:dev`

生成接口文档站点文件并启动 VitePress 开发服务。

```bash
swagger-to-api docs:dev -c swagger-to-api.config.ts
```

内部会执行：

```bash
pnpm exec vitepress dev <output.docsDir>
```

## `docs:build`

生成接口文档站点文件并执行静态构建。

```bash
swagger-to-api docs:build -c swagger-to-api.config.ts
```

内部会执行：

```bash
pnpm exec vitepress build <output.docsDir>
```

## `validate`

只做读取、转换、生成校验，不写入文件。

```bash
swagger-to-api validate -c swagger-to-api.config.ts
```

适合放在 CI 中检查配置和 OpenAPI 文档是否仍可生成。

## 错误边界

当前 CLI 会对这些情况报错：

- 未知命令。
- `-c` / `--config` 缺少路径。
- 配置文件不是有效对象。
- `source`、`output.apiDir`、`output.docsDir`、`request.importFrom`、`request.clientName` 缺失。
- OpenAPI JSON 解析失败。
- 远程 URL 输入。
- 输出文件已存在且 `overwrite` 为 `false`。
