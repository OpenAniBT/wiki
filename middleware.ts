import { i18n } from '@/lib/i18n';
import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware';
import { type NextFetchEvent, type NextRequest, NextResponse } from 'next/server';

const i18nMiddleware = createI18nMiddleware(i18n);
const defaultPrefix = `/${i18n.defaultLanguage}`;

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // 客户端路由按改写后的 `/zh-CN/...` 取 RSC（导航与预取）。这些请求直接
  // 放行，不再 307 回不带前缀的地址、每次多走一趟；地址栏里的网址不变。
  // Next 不把 `RSC` 请求头交给中间件，这里看浏览器的 `Sec-Fetch-Dest`：
  // 只有页面导航（`document`）才重定向。
  const dest = request.headers.get('sec-fetch-dest');
  if (
    dest &&
    dest !== 'document' &&
    (pathname === defaultPrefix || pathname.startsWith(`${defaultPrefix}/`))
  ) {
    return NextResponse.next();
  }

  return i18nMiddleware(request, event);
}

export const config = {
  matcher: ['/((?!api|_next|images|.*\\..*).*)'],
};
