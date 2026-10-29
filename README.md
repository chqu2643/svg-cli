# SVG CLI

使用 TypeScript 开发的命令行 SVG 编辑器。目前已完成架构设计、工程骨架和领域模型，应用命令与文件读写将在后续阶段逐步实现。

## 环境要求

- Node.js 20.19 或更高版本
- pnpm 11（推荐）或兼容的 npm 版本

## 开发命令

```bash
pnpm install
pnpm run cli
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build
```

脚本同时兼容 `npm run <script>`。编译后的入口为 `dist/main/Main.js`，可通过 `pnpm start` 启动。完整架构方案和项目过程记录见 [doc/README.md](doc/README.md)。

## 当前阶段

领域层已实现六种内置图形、组合容器、文档树、全局 ID 索引、结构编辑和深快照，并由领域单元测试覆盖。当前 REPL 尚未连接应用命令；收到非空输入时会明确提示命令处理尚未完成。
