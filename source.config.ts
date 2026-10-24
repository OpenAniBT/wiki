import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { rehypeCodeFromHighlighter } from 'fumadocs-core/mdx-plugins/rehype-code.core';
import { highlighter } from './lib/highlighter';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export default defineConfig({
  mdxOptions: {
    // 代码块改由 Highlights 高亮，不加载 Shiki；Fumadocs 的标注与图标
    // transformer 仍然生效。
    rehypeCodeOptions: false,
    rehypePlugins: [
      () =>
        rehypeCodeFromHighlighter(({ transformers }) =>
          highlighter.override({ shikiTransformers: transformers }),
        ),
    ],
  },
});
