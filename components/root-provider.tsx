'use client';

import { i18n } from '@/lib/i18n';
import { type Framework, FrameworkProvider } from 'fumadocs-core/framework';
import { RootProvider as BaseRootProvider } from 'fumadocs-ui/provider/base';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';

const defaultPrefix = `/${i18n.defaultLanguage}`;

/**
 * 默认语种的页面在构建时按 `/zh-CN/...` 预渲染（中间件把 `/docs/...` 改写到
 * 这里），浏览器地址栏里却没有前缀。两边都去掉前缀，侧栏当前项、顶栏胶带
 * 在预渲染 HTML 与浏览器里一致，不会触发 hydration 重渲染。
 */
function useLocalePathname(): string {
  const pathname = usePathname();
  if (pathname === defaultPrefix) return '/';
  if (pathname.startsWith(`${defaultPrefix}/`)) {
    return pathname.slice(defaultPrefix.length);
  }
  return pathname;
}

/** `fumadocs-ui/provider/next` 的 `RootProvider`，换上 `useLocalePathname`。 */
export function RootProvider(props: ComponentProps<typeof BaseRootProvider>) {
  return (
    <FrameworkProvider
      usePathname={useLocalePathname}
      useRouter={useRouter}
      useParams={useParams}
      Link={Link as Framework['Link']}
      Image={Image as Framework['Image']}
    >
      <BaseRootProvider {...props} />
    </FrameworkProvider>
  );
}
