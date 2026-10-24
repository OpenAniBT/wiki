import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// 全站在构建时预渲染，不做 ISR：预渲染结果直接从静态资源读出，
// 缓存拦截让命中的页面不必加载 Next 服务端。
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
