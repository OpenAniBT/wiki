'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const loadOpenAPIPage = () => import('@/components/api-page');

/**
 * API 页界面（playground、请求与响应示例、Schema）单独成块：只有 API 页
 * 下载这部分脚本，其他文档页不再带上它。服务端渲染照常输出。
 */
export const OpenAPIPage = dynamic(() =>
  loadOpenAPIPage().then((mod) => mod.OpenAPIPage),
);

/**
 * 文档页空闲时预先下载 API 页的脚本与高亮器，第一次点进 API 页不必再等。
 * 省流量模式下不预载。
 */
export function PreloadOpenAPIPage() {
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;

    const preload = () => {
      void loadOpenAPIPage().then((mod) => mod.preloadHighlighter());
    };
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(preload, { timeout: 5000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(preload, 3000);
    return () => clearTimeout(id);
  }, []);

  return null;
}
