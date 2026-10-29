# SVG CLI

使用 TypeScript 开发的命令行 SVG 编辑器。目前已完成架构设计与工程骨架，业务能力将在后续阶段逐步实现。

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

工程骨架提供五层源码目录、TypeScript 严格模式、ESLint、Vitest 和最小 REPL。当前 REPL 尚未实现具体 SVG 命令；收到非空输入时会明确提示命令处理尚未完成。
