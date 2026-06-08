# 验证细则

## 常用命令

- ESLint 修复：`pnpm run lint:eslint:fix`
- 类型检查：`pnpm  run typecheck`
- 运行测试：`pnpm run test`

## 验证流程

- 先运行类型检查，确保没有类型错误
- 再运行 ESLint，确保没有语法错误
- 最终运行测试，确保没有测试失败
