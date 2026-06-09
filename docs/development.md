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
