# SVG CLI

使用 TypeScript 开发的命令行 SVG 编辑器。目前已完成架构设计、工程骨架、领域模型、应用命令、撤销重做和 CLI 交互层，SVG 文件读写将在下一阶段实现。

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

领域层和应用层已实现六种图形、文档树、十种编辑命令、快照回滚与 undo/redo。REPL 已接入 `init/canvas`、全部编辑命令、`tree/show/help` 和历史命令，并支持引号、整行注释、十六进制颜色及统一错误恢复。`read/save` 已保留应用边界和 CLI 入口，但在文件基础设施接入前会提示 `error: SVG file support is not configured`。
