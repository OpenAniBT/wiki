'use client';

import { usePathname } from 'fumadocs-core/framework';
import { useNotebookLayout } from 'fumadocs-ui/layouts/notebook';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import { Languages, PanelLeft } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps } from 'react';

type UrlItem = Extract<LinkItemType, { url: string }>;
type IconItem = Extract<LinkItemType, { type: 'icon' }>;

function hasUrl(item: LinkItemType): item is UrlItem {
  return 'url' in item && typeof item.url === 'string';
}

function matches(item: UrlItem, pathname: string): boolean {
  if (item.external) return false;
  if (pathname === item.url) return true;
  if (item.active === 'url') return false;
  return pathname.startsWith(`${item.url.replace(/\/$/, '')}/`);
}

/**
 * 文档页顶栏（A「贴纸手账」）：与 anibt.net 的顶栏同一种排法——贴纸 logo、
 * 带胶带的导航、右侧搜索框（⌘K 键帽）、语言、主题、GitHub。
 *
 * 胶带是唯一的「你在这里」：多个链接同时命中时（`/docs` 包含
 * `/docs/open-api`），只给最长的那一个贴胶带。
 *
 * 保留 fumadocs 的 `#nd-subnav`、`data-transparent` 与 `--fd-header-height`，
 * 目录浮层与侧栏的吸顶位置都读它们。手机上导航链接由侧栏抽屉提供。
 */
export function DocsHeader(props: ComponentProps<'header'>) {
  const { slots, navItems, isNavTransparent } = useNotebookLayout();
  const { open } = slots.sidebar?.useSidebar?.() ?? {};
  const pathname = usePathname();

  const links = navItems.filter(
    (item): item is UrlItem => item.type !== 'icon' && hasUrl(item),
  );
  const icons = navItems.filter(
    (item): item is IconItem => item.type === 'icon',
  );
  const current = links
    .filter((item) => matches(item, pathname))
    .sort((a, b) => b.url.length - a.url.length)[0];

  return (
    <header
      id="nd-subnav"
      data-transparent={isNavTransparent && !open}
      {...props}
      className="a-bar sticky top-(--fd-docs-row-1) z-10 flex flex-col [grid-area:header] layout:[--fd-header-height:--spacing(14)]"
    >
      <div
        data-header-body=""
        className="flex h-14 min-w-0 items-center gap-2 px-4 md:px-6 lg:gap-5"
      >
        {slots.navTitle && (
          <slots.navTitle className="a-brand inline-flex shrink-0 items-center" />
        )}

        <nav className="a-nav flex shrink-0 items-center gap-1 max-lg:hidden">
          {links.map((item) => {
            const on = item === current;
            const label = (
              <>
                <span>{item.text}</span>
                {on && <span aria-hidden="true" className="a-nav-tape" />}
              </>
            );

            return item.external ? (
              <a
                key={item.url}
                href={item.url}
                rel="noreferrer noopener"
                target="_blank"
                className="a-nav-item"
              >
                {label}
              </a>
            ) : (
              <Link
                key={item.url}
                href={item.url}
                aria-current={on ? 'page' : undefined}
                className="a-nav-item"
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex min-w-0 items-center justify-end gap-2">
          {slots.searchTrigger && (
            <slots.searchTrigger.full
              hideIfDisabled
              className="w-[264px] max-xl:w-[200px] max-md:hidden"
            />
          )}
          {slots.languageSelect && (
            <slots.languageSelect.root className="a-icobtn max-md:hidden">
              <Languages />
            </slots.languageSelect.root>
          )}
          {slots.themeSwitch && <slots.themeSwitch className="max-md:hidden" />}
          {icons.map((item) => (
            <a
              key={item.url}
              href={item.url}
              rel="noreferrer noopener"
              target="_blank"
              aria-label={item.label ?? (typeof item.text === 'string' ? item.text : undefined)}
              className="a-icobtn inline-grid place-items-center max-lg:hidden"
            >
              {item.icon}
            </a>
          ))}
          <div className="flex items-center gap-1 md:hidden">
            {slots.searchTrigger && (
              <slots.searchTrigger.sm hideIfDisabled className="a-icobtn" />
            )}
            {slots.sidebar && (
              <slots.sidebar.trigger className="a-icobtn">
                <PanelLeft />
              </slots.sidebar.trigger>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
