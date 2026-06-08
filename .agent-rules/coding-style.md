# 编码规范细则

## TypeScript

- 严格使用 TypeScript，尽量避免 `any`。
- 类型不确定时优先使用 `unknown`，再通过类型收窄、类型守卫或泛型表达真实约束。
- 异步逻辑优先使用 `async/await`。
- `export` 的函数和 hook 建议显式声明返回类型。
- 类型导入使用 `import type`。

## Vue 3

- SFC 使用 `<script setup lang="ts">`。
- `defineProps`、`defineEmits`、`defineExpose` 使用泛型形式定义。
- Props 类型应优先抽成接口，例如 `interface Props` 后再使用 `defineProps<Props>()`。
- 当组件需要适配多种不同数据结构时，优先考虑泛型组件。
- 使用组件库组件时，优先使用按需导入。

## 组件数据

- 设计表单类型组件时，表单数据应内聚在组件内部，不要由父组件长期持有表单模型。
- 支持 `v-model` 的组件必须检查循环更新风险。

## TSX

- 使用 `h` 函数构造 VNode 时，通过静态 `import` 引入组件，不使用组件字符串名称。

## 注释

- 代码注释必须使用中文。
- 注释用于解释业务意图、边界条件或复杂逻辑，不要写无信息量的逐行说明。
