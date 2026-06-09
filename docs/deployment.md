# 部署项目文档

## 构建

```bash
DOCS_BASE=/swagger-to-api/ pnpm run docs:build
```

构建产物：

```txt
docs/.vitepress/dist
```

## 本地预览

```bash
pnpm run docs:preview
```

## GitHub Pages

仓库工作流：

```txt
.github/workflows/deploy-docs.yml
```

GitHub 仓库设置：

1. 进入 `Settings -> Pages`。
2. `Source` 选择 `GitHub Actions`。
3. 推送到 `main` 分支或手动触发 `Deploy Docs`。

工作流会执行：

```bash
DOCS_BASE=/swagger-to-api/ pnpm run docs:build
```

`DOCS_BASE` 对应 VitePress `base`。仓库名不是 `swagger-to-api` 时，需要同步修改工作流。
