# SVG CLI

使用 TypeScript 开发的命令行 SVG 编辑器。目前已完成架构设计、领域模型、应用命令、CLI 交互层以及 SVG 文件读写基础设施。

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

领域层和应用层已实现六种图形、文档树、十种编辑命令、快照回滚与 undo/redo。REPL 已接入全部命令；`read/save` 支持嵌套 SVG、缺失 ID 补全、XML 转义、`translate`/等比 `scale` 归一化和同目录临时文件原子保存。当前支持 `svg/g/rect/circle/ellipse/line/text` 及需求规定的几何与公共样式属性，其他会影响画面的元素或属性会明确报错而不会静默丢失。
