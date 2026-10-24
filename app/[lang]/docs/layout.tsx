import { PreloadOpenAPIPage } from '@/components/api-page-lazy';
import { DocsHeader } from '@/components/docs-header';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type { ReactNode } from 'react';

/**
 * 文档壳：顶栏一行，下面是侧栏 + 正文 + 目录，与 anibt.net 的排法一致
 * （fumadocs notebook 布局的 `nav.mode: 'top'`）。顶栏是
 * `components/docs-header.tsx`。
 */
export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;
  const base = baseOptions(lang);

  return (
    <DocsLayout
      {...base}
      nav={{ ...base.nav, mode: 'top', transparentMode: 'none' }}
      slots={{ header: DocsHeader }}
      tree={source.getPageTree(lang)}
    >
      {children}
      <PreloadOpenAPIPage />
    </DocsLayout>
  );
}
