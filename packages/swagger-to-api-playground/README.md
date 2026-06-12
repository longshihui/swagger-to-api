# 本地 Playground

这个包用于在本地用真实 OpenAPI JSON/YAML 文件验证 `swagger-to-api` 的生成效果。

## 快速验证

默认使用 `swagger/sample.openapi.json`：

```bash
pnpm run playground:validate
pnpm run playground:generate
pnpm run playground:docs:dev
```

## 使用真实 Swagger 文件

可以把真实文件放在任意本地路径，然后通过环境变量指定：

```bash
PLAYGROUND_SWAGGER=/path/to/swagger.json pnpm run playground:validate
PLAYGROUND_SWAGGER=/path/to/swagger.json pnpm run playground:generate
PLAYGROUND_SWAGGER=/path/to/swagger.json pnpm run playground:docs:dev
```

也可以把真实文件复制到 `swagger/` 目录中，并用相对路径指定：

```bash
PLAYGROUND_SWAGGER=./swagger/local.openapi.yaml pnpm run playground:docs:dev
```

## 输出目录

- `generated-api/`：生成的 TypeScript API 代码。
- `swagger-docs/`：生成的 VitePress 接口文档。

这两个目录只用于本地体验和对比，不需要提交。
