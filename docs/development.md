# 项目开发

## 安装依赖

```bash
pnpm install
```

## 目录

```txt
packages/
  swagger-api-generator      API 文件生成器
  swagger-api-ui-generator   API 文档 UI 生成器
  swagger-to-api-cli         CLI
  shared                     公共代码
docs/                        项目文档
```

## 常用命令

| 命令                    | 说明             |
| ----------------------- | ---------------- |
| `pnpm run typecheck`    | TypeScript 检查  |
| `pnpm run lint:eslint`  | ESLint 检查      |
| `pnpm run test`         | 运行 Vitest 测试 |
| `pnpm run validate`     | 执行完整校验     |
| `pnpm run format:check` | 检查格式         |

## 项目文档

```bash
pnpm run docs:dev
pnpm run docs:build
pnpm run docs:preview
```

构建产物位于：

```txt
docs/.vitepress/dist
```

## 发布前检查

```bash
pnpm run validate
pnpm run format:check
```

## 发包流程

项目通过 GitHub Actions 发布 npm 包，workflow 位于 `.github/workflows/publish.yml`。

发包前需要在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions` 中配置 `NPM_TOKEN`，该 token 需要具备发布 `@lsh` scope 包的权限。

本地创建版本发布：

```bash
pnpm release 0.1.0
```

该命令基于 `release-it` 执行，会先运行 `pnpm run validate`，通过后统一更新根项目和待发布包的版本号、生成 `CHANGELOG.md`、创建 release commit，并打上 `v0.1.0` 格式的 git tag。

推送 release commit 和 tag 后会触发发布：

```bash
git push origin main --follow-tags
```

workflow 只会在推送 `v*.*.*` 格式的 tag 时触发。workflow 会校验 tag 版本与包版本，版本不一致时不会继续发布。

发布前 workflow 会先执行：

```bash
pnpm run validate
```

`validate` 会依次运行类型检查、ESLint 和 Vitest 测试。只有该步骤通过后，才会执行 npm 发布。
