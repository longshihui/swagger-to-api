# AGENTS

## 技术栈

- 基础语言：TypeScript
- 组件化方案：Vue 3、Pinia、Vue Router
- 构建工具：Vite、Pnpm
- 测试工具：Vitest
- 文档工具：Vitepress

## 项目结构

本项目使用monorepos进行组织，所有代码存放在`packages/` 目录下

- `packages/swagger-api-generator`：API文件生成器
- `packages/swagger-api-ui-generator`：API文档UI生成器
- `packages/swagger-to-api-cli`：管理端 UI
- `packages/shared`：公共代码

## 开发流程

- 遇到可复用逻辑时，先查看 `packages/*` 是否已有能力；没有时再查看当前项目内是否已有可复用代码。
- 组织或设计页面时，必须先查阅对应组件库文档；例如 `management-ui` 表单页面优先使用 TDesign MCP 查询组件用法。
- 新增或变更通用组件、组合式函数、工具类时，必须同步新增或更新文档。
- 遇到不确定的业务规则、接口语义、交互取舍时，先向用户提问，不要自行发散。

## 任务规则索引

- 涉及 TypeScript、Vue SFC、组件、hooks、Pinia、Vue Router、TSX 时，先阅读[代码规范](.agent-rules/coding-style.md)。
- 涉及样式开发时，阅读先阅读[样式开发规范](.agent-rules/style.md) 。
- 涉及目录调整、页面拆分、组件边界、wrapper、hooks 拆分、共享与复用时，先阅读[代码组织规范](.agent-rules/module-structure.md)。
- 开发完成需要验证时，先阅读[代码验证规范](.agent-rules/validation.md)。

## 全局硬约束

- 严格使用 TypeScript，尽量避免 `any`；优先使用 `unknown`、类型收窄、类型守卫和泛型。
- SFC 使用 `<script setup lang="ts">`。
- 文件命名使用 `PascalCase.vue`；文件夹命名使用 `kebab-case`；模板中的组件名和事件名使用 `kebab-case`。
- 命名优先使用业务语义，避免 `Common`、`Wrapper`、`Panel`、`MainContent`、`IndexTab` 等空泛命名。
- 页面组件保持轻量，复杂状态、接口调用、副作用优先下沉到业务 hooks。
- 不新增纯透传 wrapper。
- CSS 使用 BEM 命名规范。
- 代码注释使用中文。
