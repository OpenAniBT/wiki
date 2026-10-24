import spec from '../openapi/anibt.json';
import type { Document } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';

/** 文档 ID，即生成的 API 页 MDX 里的 `document`。 */
export const OPENAPI_DOCUMENT_ID = './openapi/anibt.yaml';

export const openapi = createOpenAPI({
  input: {
    // Fumadocs upgrades its input in place. Keep its private representation
    // separate from the canonical document used by Markdown and contract checks.
    [OPENAPI_DOCUMENT_ID]: structuredClone(spec) as unknown as Document,
  },
  proxyUrl: '/api/proxy',
  // 不把整份文档塞进每个 API 页的 HTML 与 RSC：浏览器从 `/api/openapi`
  // 取一次，同一会话内的 API 页共用（`components/api-page.tsx`）。
  includeDocument: false,
});
