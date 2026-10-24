import { createHighlights } from 'fumadocs-core/highlight/highlights';

/**
 * 全站代码高亮：`@pierre/highlights`（WebAssembly，语言内置），GitHub
 * Light / Dark 双主题，输出与 Shiki 相同的 `--shiki-light` / `--shiki-dark`
 * 变量，`app/anibt-a.css` 里 `figure.shiki` 的样式不变。
 *
 * MDX 代码块在构建时用它（`source.config.ts`）；API 页经
 * `lib/api-highlighter.ts` 按需加载它。
 */
export const highlighter = createHighlights();
