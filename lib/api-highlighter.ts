import type { Highlighter } from 'fumadocs-core/highlight';

type Hast = ReturnType<Highlighter['codeToHast']>;

let instance: Highlighter | undefined;
let loading: Promise<void> | undefined;

function load(): Promise<void> {
  if (!loading) {
    const promise = import('@/lib/highlighter').then(
      (mod) => {
        instance = mod.highlighter;
      },
      () => undefined,
    );
    // React 的 `use()` 先看 `status`：加载完以后再渲染的代码块不再挂起。
    void promise.then(() => Object.assign(promise, { status: 'fulfilled' }));
    loading = promise;
  }
  return loading;
}

/** 与 Highlights 同样的 `pre > code > span.line`，不带颜色。 */
function plain(code: string): Hast {
  const children = code.split('\n').flatMap((line, i) => [
    ...(i > 0 ? [{ type: 'text', value: '\n' }] : []),
    {
      type: 'element',
      tagName: 'span',
      properties: { class: 'line' },
      children: [{ type: 'text', value: line }],
    },
  ]);

  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: { class: 'shiki', tabindex: '0' },
        children: [{ type: 'element', tagName: 'code', properties: {}, children }],
      },
    ],
  } as Hast;
}

/**
 * API 页（客户端组件）用的高亮器：第一次高亮前才加载 `@/lib/highlighter`。
 *
 * 构建时的预渲染与浏览器都能运行 Highlights 的 WebAssembly；Cloudflare
 * Workers 不允许运行时编译 WebAssembly，若 API 页没命中预渲染缓存、在
 * Worker 里现场渲染，加载会失败，这时输出不带颜色的代码，浏览器接手后
 * 再高亮，页面不会 500。
 */
export const apiHighlighter: Highlighter = {
  loadLanguage: load,
  codeToHast(code, options) {
    return instance ? instance.codeToHast(code, options) : plain(code);
  },
};
