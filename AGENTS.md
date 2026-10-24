# 项目规范

## 语言

- 默认语言简体中文 (`zh-CN`)，URL 不带前缀。
- 繁体中文 (`zh-Hant`) 通过 `/zh-Hant` 前缀访问，文件用 `.zh-Hant.mdx` / `.zh-Hant.json` 后缀。
- 英文 (`en`) 通过 `/en` 前缀访问，文件用 `.en.mdx` / `.en.json` 后缀。
- 新增任意语种时同步更新 `lib/i18n.ts`、`lib/layout.shared.tsx`（UI 翻译 + `baseOptions` 链接文案），并在 `next.config.mjs` 为该语种首页加上到 `/docs` 的跳转。

## 文档

- 文档源放在 `content/docs`，每语种一份对应文件。
- 三语版本必须同步：新增/修改一篇时同时更新简体、繁体、英文三个文件。
- 只写读者要做的事、要填的字段、限制和失败结果。不写 Redis、CDN、Typesense、Tailscale、Worker、UI 布局等实现细节。
- 更新日志只收录用户可感知的功能变更，不写界面微调、缓存实现和内部服务迁移。
- 句子短、术语固定。不要装饰性说明。
- 简体到繁体须做术语转换（例：「网络」→「網路」、「设置」→「設定」、「字幕组」→「字幕組」、「蜜柑计划」→「蜜柑計畫」、「发布」→「釋出」、「打开」→「開啟」、「点击」→「點選」、「保存」→「儲存」），不要直接保留简体字形。
- 专有名词原样保留：`AniBT`、`Bangumi Moe`、`Mikan`、`ACGNX`、`ACG.rip`、`Nyaa`、`LoliHouse`、`API Token`、`Cookie`、`UID`、`session`。
- 站名 ACGNX 在中文文档里仍称「末日站」。

## 排版

- 每篇文档开头一句简介，后接 `<Callout type="warn">` / `<Callout type="info">` 标注前置条件或常见坑。
- 操作流程必须用 `<Steps>` / `<Step>` 包裹，每个 `<Step>` 内首行 `### 小标题`。
- 同一主题的多分支选项（不同入口、不同方法）用 `<Tabs>` / `<Tab>`。
- 字段说明优先用 `<TypeTable>`，避免散列在正文。
- 代码块加 `title=""` 标注用途。
- 键盘按键用 `<kbd>F12</kbd>`。

## 资源

- 文档图片放在 `public/images/<topic>/<slug>.webp`，必须先压缩为 `.webp` 再引用。
- 不引用原始图片格式或外部图床。
- 图片自动启用点击放大（`mdx-components.tsx` 已把 `img` 替换为 `ImageZoom`），无需手动包裹。

## MDX 组件

- `components/mdx.tsx` 注入 fumadocs 原生组件：`Callout` / `Card` / `Cards` / `Steps` / `Step` / `Tabs` / `Tab` / `Files` / `File` / `Folder` / `Accordion` / `Accordions` / `InlineTOC` / `TypeTable` / `ImageZoom` / `GithubInfo`。MDX 中可直接使用，无需 import。
- 接口方法与路径用 `<Callout title="GET /path">`（`ApiEndpoint` 是同一组件的别名）。字段表用 `<TypeTable>`；未标 `required: false` 的字段不显示 `?`。GitHub 仓库用 `<GithubInfo owner="" repo="" />`。

## 构建

- 提交前跑 `pnpm typecheck` 与 `pnpm next build`，确保静态页全部生成成功。
- 部署目标 Cloudflare Workers，通过 `pnpm build:worker` 生成 worker 产物（`wrangler deploy` 的构建命令也是它）：先 `opennextjs-cloudflare build`，再 `populateCache local` 把预渲染页写进静态资源缓存。只跑前一步时缓存为空，每个请求都会在 Worker 里重新渲染。
- 代码高亮用 `@pierre/highlights`（`lib/highlighter.ts`）。Workers 不允许运行时编译 WebAssembly，客户端组件里不要直接导入它，按 `lib/api-highlighter.ts` 的方式按需加载。
- 浏览器兜底已在 `app/[lang]/layout.tsx` 注入 `__name` polyfill，处理 OpenNext 打包对 esbuild keepNames 的依赖。
