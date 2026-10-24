import { i18n } from '@/lib/i18n';
import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import { createTokenizer } from '@orama/tokenizers/mandarin';
import { after } from 'next/server';

const server = createFromSource(source, {
  localeMap: {
    'zh-CN': {
      components: {
        tokenizer: createTokenizer(),
      },
      search: {
        threshold: 0,
        tolerance: 0,
      },
    },
    'zh-Hant': {
      components: {
        tokenizer: createTokenizer(),
      },
      search: {
        threshold: 0,
        tolerance: 0,
      },
    },
    en: {
      language: 'english',
    },
  },
});

let ready: Promise<unknown> | undefined;

export function GET(request: Request) {
  // 第一次搜索会同时开建三个语种的索引，只等其中一个就返回。索引分批写入、
  // 批间用定时器让出；Workers 在请求结束后不再执行它发起的定时器，其余语种
  // 就永远建不完，之后这些语种的搜索一直挂起。`after()` 让它们在响应之后建完。
  ready ??= Promise.all(
    i18n.languages.map((locale) => server.search('', { locale })),
  );
  after(ready);

  return server.GET(request);
}
