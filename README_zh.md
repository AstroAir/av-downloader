# av-downloader

一个 TypeScript 优先的 **HLS/m3u8 下载 CLI**，支持链接发现、AES-128 解密、切片顺序稳定化以及 ffmpeg 回退输出。

[English Documentation](./README.md)

## 项目能力

- 直连播放列表模式（`--url`）和页面发现模式（`--page-url`）
- 主清单自动选择最高码率子清单
- AES-128 分片解密，支持 `--key-url` 覆盖
- 可选切片嗅探，去重并稳定排序
- 分片合并后优先 remux 到 mp4，无 ffmpeg 时回退到 `.ts`

## 破坏性变更

原有问候语模式（`--name` 输出 `Hello, <name>`）已移除，CLI 现在只提供下载器能力。

## 前置要求

- Node.js 20+
- pnpm 8+（建议 10+）

如未安装 pnpm：

```bash
npm install -g pnpm
```

## 快速开始

```bash
pnpm install
pnpm build
node dist/cli.js --name=Jane
```

之后可执行以下下载模式：

```bash
node dist/cli.js --url "https://example.com/video/master.m3u8" --out "./video.mp4"
node dist/cli.js --page-url "https://example.com/watch/123" --key-url "https://example.com/video/ts.key"
```

## CLI 使用

### 基础调用

```bash
node dist/cli.js --url "https://example.com/video/master.m3u8"
```

### 带参数调用

```bash
node dist/cli.js --page-url "https://example.com/watch/123"
```

### 参数说明

| 参数             | 类型      | 默认值         | 说明                                |
| ---------------- | --------- | -------------- | ----------------------------------- |
| `--url`          | `string`  | `-`            | 直接提供 m3u8 播放列表地址          |
| `--page-url`     | `string`  | `-`            | 页面地址，自动发现 m3u8/key/ts 链接 |
| `--out`          | `string`  | `output.mp4`   | 输出 mp4 路径                       |
| `--workdir`      | `string`  | `tmp_download` | 临时工作目录                        |
| `--concurrency`  | `number`  | `12`           | 分片并发下载数                      |
| `--retries`      | `number`  | `3`            | 单请求重试次数                      |
| `--timeout`      | `number`  | `15000`        | 单请求超时毫秒                      |
| `--referer`      | `string`  | `-`            | 覆盖 HTTP Referer                   |
| `--script-limit` | `number`  | `20`           | 页面模式最多抓取 script 数          |
| `--sniff`        | `boolean` | `true`         | 启用切片嗅探（`--no-sniff` 可关闭） |
| `--max-miss`     | `number`  | `8`            | 嗅探时连续 miss 阈值                |
| `--key-url`      | `string`  | `-`            | 覆盖 AES-128 key 地址               |

## 开发流程

1. 安装依赖：`pnpm install`
2. 开发时监听编译：`pnpm dev`
3. 执行仓库质量检查：`pnpm test`
4. 执行文档链路验证：`pnpm test:docs && pnpm docs:check`
5. 执行编译验证：`pnpm build`
6. 运行编译产物烟测：`node dist/cli.js --url "https://example.com/video/master.m3u8"`

## 脚本说明

| 脚本                      | 用途                                    |
| ------------------------- | --------------------------------------- |
| `pnpm dev`                | TypeScript 监听编译                     |
| `pnpm build`              | 编译到 `dist/`                          |
| `pnpm docs:generate`      | 重新生成 `docs/reference/` 下的参考文档 |
| `pnpm docs:check`         | 检查生成文档是否与当前源码一致          |
| `pnpm lint`               | 运行 XO lint 检查                       |
| `pnpm format`             | 使用 Prettier 自动格式化                |
| `pnpm format:check`       | 检查格式，不改文件                      |
| `pnpm test`               | 执行格式检查 + lint 检查                |
| `pnpm test:docs`          | 执行文档流水线与 Ink 输出测试           |
| `pnpm test:docs:coverage` | 执行带覆盖率门禁的文档测试              |

## 项目结构

```text
av-downloader/
├── source/
│   ├── cli-metadata.ts          # 运行时与文档共享的 CLI 合同
│   └── cli.tsx                  # CLI 入口与参数解析
│   └── downloader/              # 下载器领域模块
│       ├── options.ts
│       ├── discovery.ts
│       ├── playlist.ts
│       ├── crypto.ts
│       ├── sniff.ts
│       ├── pipeline.ts
│       └── output.ts
├── tests/
│   ├── cli/
│   └── docs/
├── tools/
│   └── docs/                    # 文档生成与校验脚本
├── docs/
│   ├── README.md                # 文档导航入口
│   ├── project-structure.md
│   ├── development-workflow.md
│   ├── cli-design.md
│   ├── quality-gates.md
│   ├── troubleshooting.md
│   ├── reference/
│   │   ├── README.md
│   │   ├── cli.md
│   │   ├── tooling-baseline.md
│   │   └── api/
│   └── release-process.md
├── .github/
│   ├── workflows/ci.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
├── CONTRIBUTING.md
├── TESTING.md
├── CI_CD.md
├── CHANGELOG.md
├── package.json
└── tsconfig.json
```

## 文档架构入口

- 文档导航： [docs/README.md](./docs/README.md)
- 项目结构： [docs/project-structure.md](./docs/project-structure.md)
- 开发流程： [docs/development-workflow.md](./docs/development-workflow.md)
- CLI 设计： [docs/cli-design.md](./docs/cli-design.md)
- 质量门禁： [docs/quality-gates.md](./docs/quality-gates.md)
- 故障排查： [docs/troubleshooting.md](./docs/troubleshooting.md)
- 参考文档： [docs/reference/README.md](./docs/reference/README.md)
- 发布流程： [docs/release-process.md](./docs/release-process.md)

## 治理文档

- 贡献规范： [CONTRIBUTING.md](./CONTRIBUTING.md)
- 测试策略： [TESTING.md](./TESTING.md)
- CI/CD 规范： [CI_CD.md](./CI_CD.md)
- 变更历史： [CHANGELOG.md](./CHANGELOG.md)

## 许可证

MIT，见 [LICENSE](./LICENSE)。
