'use client';

import { preload } from 'react-dom';
import { createOpenAPIPageBase } from 'fumadocs-openapi/ui/base';
import type { CreateOpenAPIPageOptions } from 'fumadocs-openapi/ui';
import { createCodeUsageGeneratorRegistry } from 'fumadocs-openapi/requests/generators';
import { registerDefault } from 'fumadocs-openapi/requests/generators/all';
import { createDynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock.core';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { apiHighlighter as highlighter } from '@/lib/api-highlighter';
import { responseExampleCode } from '@/lib/response-example';

/** `app/api/openapi/route.ts`：静态生成的文档。 */
const DOCUMENT_URL = '/api/openapi';

const codeUsages = createCodeUsageGeneratorRegistry();
registerDefault(codeUsages);

const DynamicCodeBlock = createDynamicCodeBlock({ highlighter });

/** 先加载高亮器（`components/api-page-lazy.tsx` 在空闲时调用）。 */
export function preloadHighlighter(): Promise<void> | undefined {
  return highlighter.loadLanguage?.();
}

type ResponseTabs = NonNullable<NonNullable<CreateOpenAPIPageOptions['content']>['renderResponseTabs']>;

const renderResponseTabs: ResponseTabs = ({ tabs }) => (
  <Tabs className="a-tabs" items={tabs.map(tab => tab.code)}>
    {tabs.map(tab => {
      const examples = tab.examples ?? [];
      const blocks = examples.map((example, index) => {
        const code = responseExampleCode(tab.mediaType, example.sample);
        return <DynamicCodeBlock key={index} {...code} />;
      });
      return (
        <Tab key={tab.code} value={tab.code}>
          {examples.length > 1 ? (
            <Accordions className="a-accordions" type="single" defaultValue="0">
              {examples.map((example, index) => (
                <Accordion key={index} value={String(index)} title={example.label}>
                  {blocks[index]}
                </Accordion>
              ))}
            </Accordions>
          ) : blocks[0] ?? <code>HTTP {tab.code}</code>}
        </Tab>
      );
    })}
  </Tabs>
);

// 不带 Shiki：代码块统一走 Highlights。
// 页面本来就等文档；高亮器与文档一起就绪，代码块不再各自挂起。
export const OpenAPIPage = createOpenAPIPageBase({
  codeUsages,
  highlighter,
  content: { renderResponseTabs },
  async loadDocument(id) {
    if (typeof window === 'undefined') {
      // 服务端渲染直接读；同时让浏览器在下载脚本时就开始取文档。
      preload(DOCUMENT_URL, { as: 'fetch', crossOrigin: 'anonymous' });
      const [{ openapi }] = await Promise.all([
        import('@/lib/openapi'),
        highlighter.loadLanguage?.(),
      ]);
      return (await openapi.getSchema(id)).bundled;
    }
    const [response] = await Promise.all([
      fetch(DOCUMENT_URL),
      highlighter.loadLanguage?.(),
    ]);
    if (!response.ok) throw new Error(`Failed to load the OpenAPI document: HTTP ${response.status}`);
    return response.json();
  },
});
