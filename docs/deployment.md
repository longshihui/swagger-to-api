# 部署文档站点

本项目自身文档使用 VitePress 生成。

## 本地开发

```bash
pnpm run docs:dev
```

## 本地构建

```bash
pnpm run docs:build
```

构建产物默认位于：

```txt
docs/.vitepress/dist
```

## 本地预览

```bash
pnpm run docs:preview
```

## GitHub Pages

仓库已提供 GitHub Actions 工作流：

```txt
.github/workflows/deploy-docs.yml
```

需要在 GitHub 仓库设置中启用：

1. 进入 `Settings -> Pages`。
2. `Source` 选择 `GitHub Actions`。
3. 推送到 `main` 分支或手动触发 `Deploy Docs` 工作流。

工作流会执行：

```bash
DOCS_BASE=/swagger-to-api/ pnpm run docs:build
```

`DOCS_BASE` 会传给 VitePress `base` 配置，用于适配 GitHub Pages 子路径部署。

如果仓库名不是 `swagger-to-api`，需要同步修改工作流中的 `DOCS_BASE`。
