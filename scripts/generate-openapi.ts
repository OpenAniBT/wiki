import { generateFilesOnly } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';

const schemaPath = './openapi/anibt.yaml';

const openapi = createOpenAPI({
  input: [schemaPath],
  proxyUrl: '/api/proxy',
});

const localeTitles: Record<
  string,
  { en: { title: string; description: string }; 'zh-Hant': { title: string; description: string } }
> = {
  'torznab-api': {
    en: {
      title: 'Torznab protocol',
      description: 'GET /torznab/api — capabilities, search results, and XML protocol errors.',
    },
    'zh-Hant': {
      title: 'Torznab 協定',
      description: 'GET /torznab/api —— 能力查詢、搜尋結果與 XML 協定錯誤。',
    },
  },
  'subtitle-groups': {
    en: {
      title: 'Subtitle groups',
      description: 'GET /api/subtitle-groups — visible groups. Cache name → slug.',
    },
    'zh-Hant': {
      title: '字幕組目錄',
      description: 'GET /api/subtitle-groups —— 可見字幕組列表。快取 name → slug。',
    },
  },
  me: {
    en: {
      title: 'Current group',
      description: 'GET /api/subtitle-groups/me — inspect the current group, scopes, and stats. The key creator must still be a group member; a key retained after leaving returns 401.',
    },
    'zh-Hant': {
      title: '字幕組自身資訊',
      description: 'GET /api/subtitle-groups/me —— 目前 Key 所屬字幕組、scope 與統計。建立 Key 的使用者必須仍為組員；離組後保留的 Key 回傳 401。',
    },
  },
  'bgm-search': {
    en: {
      title: 'Bangumi search',
      description: 'GET /api/bgm/search — map a title to bgmId. Results are ranked by match tier, then popularity. Spelling tolerance comes from similarity; a year has no special rule and matches like any other term. A digits-only q still looks up a Bangumi ID.',
    },
    'zh-Hant': {
      title: 'Bangumi 搜尋',
      description: 'GET /api/bgm/search —— 把番劇名對應為 bgmId。結果按比對層級排序，同級按熱度排序。拼寫容錯來自相似度；年份沒有單獨的規則，與其他詞一樣比對。純數字 q 仍依 Bangumi ID 查詢。',
    },
  },
  'seasons-anime': {
    en: {
      title: 'Season anime',
      description: 'GET /api/seasons/anime — season browsing, global title search, and exact ID lookup with per-item premiere precision.',
    },
    'zh-Hant': {
      title: '季度番劇',
      description: 'GET /api/seasons/anime —— 季度瀏覽、全庫關鍵字搜尋與精確 ID 查詢，含每部作品的首播精度。',
    },
  },
  'anime-groups': {
    en: {
      title: 'Anime groups',
      description: 'GET /api/anime/groups — groups publishing a bgmId, plus recent items.',
    },
    'zh-Hant': {
      title: '單番劇字幕組',
      description: 'GET /api/anime/groups —— 某 bgmId 正在釋出的字幕組，以及每組最近資源。',
    },
  },
  'anime-torrent-match': {
    en: {
      title: 'Torrent match',
      description: 'POST /api/animes/torrent-match — preserve official bracketed subtitles, romaji and English aliases, and distinguish seasons from episodes. Conflicting titles require manual confirmation. Numeric title terms are not corrected or ignored; relaxed matching may ignore at most one ordinary word and cannot authorize auto on its own. When matching cannot complete, the response is 200 with decision.kind=unavailable, reason=search_unavailable, and no candidates; retry later or choose the anime manually.',
    },
    'zh-Hant': {
      title: '種子標題匹配番劇',
      description: 'POST /api/animes/torrent-match —— 保留正式括號副標題、羅馬音與英文別名，分別識別季數與集數。標題衝突時須人工確認。數字標題詞不自動校正或忽略；寬鬆匹配最多忽略一個一般詞，不能單獨授權 auto。匹配暫時無法完成時仍回傳 200，decision.kind=unavailable，reason=search_unavailable，candidates 為空；稍後重試或手動選擇番劇。',
    },
  },
  'rss-anime': {
    en: {
      title: 'Anime RSS',
      description: 'GET /rss/anime.xml — bgmId, group slug, and tag filters.',
    },
    'zh-Hant': {
      title: '番劇 RSS',
      description: 'GET /rss/anime.xml —— bgmId、字幕組 slug 與 Tag 過濾。',
    },
  },
  'rss-group': {
    en: {
      title: 'Group RSS',
      description: 'GET /rss/group/<slug>.xml — same as anime RSS with groupSlug.',
    },
    'zh-Hant': {
      title: '字幕組短鏈 RSS',
      description: 'GET /rss/group/<slug>.xml —— 等價 /rss/anime.xml?groupSlug=<slug>。',
    },
  },
  'rss-magnets': {
    en: {
      title: 'Site-wide magnet RSS',
      description: 'GET /rss/magnets.xml — recent releases across the site. With q, every term must match; see Release search in the Open API overview.',
    },
    'zh-Hant': {
      title: '全站磁力 RSS',
      description: 'GET /rss/magnets.xml —— 全站最近釋出。帶 q 時每個詞都必須比對成功，規則見「開放 API 總覽」的「資源搜尋」。',
    },
  },
  'rss-other': {
    en: {
      title: 'Other RSS',
      description: 'GET /rss/other/<category>.xml — non-anime categories. With q, every term must match the release’s own title or category; see Release search in the Open API overview.',
    },
    'zh-Hant': {
      title: '其他類 RSS',
      description: 'GET /rss/other/<category>.xml —— 不混入番劇 RSS。帶 q 時每個詞都必須比對資源自身的標題或分類，規則見「開放 API 總覽」的「資源搜尋」。',
    },
  },
  'rss-subscriptions': {
    en: {
      title: 'Subscription RSS',
      description: 'GET /rss/subscriptions.xml — private merged feed from saved subscriptions.',
    },
    'zh-Hant': {
      title: '個人訂閱 RSS',
      description: 'GET /rss/subscriptions.xml —— 前端「我的訂閱」合併成一份私人 RSS。',
    },
  },
  'releases-publish-whoami': {
    en: {
      title: 'Publish identity',
      description: 'GET /api/releases/publish — inspect the key; does not write.',
    },
    'zh-Hant': {
      title: '釋出身份',
      description: 'GET /api/releases/publish —— 不寫庫。不要求 releases:publish。',
    },
  },
  'releases-publish': {
    en: {
      title: 'Publish anime',
      description: 'POST /api/releases/publish — publish with an API Key. Idempotency-Key binds the complete request from first acceptance. Changed requests return 409 CONFLICT; unfinished legacy uploads without a binding return legacy_request_binding_missing. Use a new key for either case. See Conventions and authentication for replay and 503 retry rules.',
    },
    'zh-Hant': {
      title: '釋出番劇資源',
      description: 'POST /api/releases/publish —— 字幕組用 API Key 釋出種子。Idempotency-Key 自首次受理起綁定完整請求。同鍵變更參數回傳 409 CONFLICT；缺少綁定的舊未完成上傳請求回傳 legacy_request_binding_missing，兩者均須使用新鍵。回放與 503 重試規則見「介面約定與鑑權」。',
    },
  },
  'other-releases-publish-whoami': {
    en: {
      title: 'Other publish identity',
      description: 'GET /api/other-releases/publish — kind is other; does not write.',
    },
    'zh-Hant': {
      title: '其他類釋出身份',
      description: 'GET /api/other-releases/publish —— kind 為 other。不寫庫。',
    },
  },
  'other-releases-publish': {
    en: {
      title: 'Publish other',
      description: 'POST /api/other-releases/publish — non-anime categories; torrent required. Idempotency-Key binds the complete request from first acceptance. Changed requests return 409 CONFLICT; unfinished legacy uploads without a binding return legacy_request_binding_missing. Use a new key for either case. See Conventions and authentication for replay and 503 retry rules.',
    },
    'zh-Hant': {
      title: '釋出其他類資源',
      description: 'POST /api/other-releases/publish —— category 與 title 必填。Idempotency-Key 自首次受理起綁定完整請求。同鍵變更參數回傳 409 CONFLICT；缺少綁定的舊未完成上傳請求回傳 legacy_request_binding_missing，兩者均須使用新鍵。回放與 503 重試規則見「介面約定與鑑權」。',
    },
  },
  'releases-delete': {
    en: {
      title: 'Delete release',
      description: 'DELETE /api/releases/{releaseId} — rel_* only.',
    },
    'zh-Hant': {
      title: '刪除番劇釋出',
      description: 'DELETE /api/releases/{releaseId} —— 只支援 rel_*。',
    },
  },
  'releases-deletion': {
    en: {
      title: 'Deletion status',
      description: 'GET /api/releases/{releaseId}/deletion — poll until completed.',
    },
    'zh-Hant': {
      title: '刪除狀態',
      description: 'GET /api/releases/{releaseId}/deletion —— 查詢同一刪除回執。',
    },
  },
  'releases-sync-status': {
    en: {
      title: 'Sync status',
      description:
        'GET /api/releases/{releaseId}/sync-status — six external sites; requires releases:sync:read.',
    },
    'zh-Hant': {
      title: '外站同步狀態',
      description:
        'GET /api/releases/{releaseId}/sync-status —— 查詢普通 release 在六個外站的同步狀態。',
    },
  },
  torrent: {
    en: {
      title: 'Download anime torrent',
      description: 'GET /api/torrent/{releaseId}.torrent — public .torrent for rel_*.',
    },
    'zh-Hant': {
      title: '下載番劇種子',
      description: 'GET /api/torrent/{releaseId}.torrent —— 回傳該釋出的公開種子。',
    },
  },
  'other-torrent': {
    en: {
      title: 'Download other torrent',
      description: 'GET /api/other-torrent/{releaseId}.torrent — public .torrent for orel_*.',
    },
    'zh-Hant': {
      title: '下載其他類種子',
      description: 'GET /api/other-torrent/{releaseId}.torrent —— 回傳其他類釋出的公開種子。',
    },
  },
};

function localeMdx(source: string, locale: 'en' | 'zh-Hant', id: string): string {
  const t = localeTitles[id]?.[locale];
  if (!t) return source;
  const localized = source.replace(
    /^title:[\s\S]*?(?=\nfull:)/m,
    `title: ${JSON.stringify(t.title)}\ndescription: ${JSON.stringify(t.description)}`,
  );
  // OpenAPI operation prose is currently authored in the source YAML locale.
  // Fumadocs puts it into `_openapi.structuredData` even when page descriptions
  // are disabled, so remove that source-language block from translated pages
  // until each operation owns a real locale description. The interactive page
  // still reads the shared machine-readable schema.
  return localized.replace(
    /\n  structuredData:\n[\s\S]*?(?=\n---\n)/m,
    '\n  structuredData:\n    headings: []\n    contents: []',
  );
}

const files = await generateFilesOnly({
  input: openapi,
  per: 'operation',
  // Operation descriptions are authored once in the Chinese OpenAPI source.
  // Keep them in the interactive contract; putting them in generated MDX would
  // leak Chinese prose into the English and Traditional locale pages.
  includeDescription: false,
  addGeneratedComment: true,
  frontmatter(title, description) {
    const short = description
      ?.split('\n')
      .map((line) => line.trim())
      .find(Boolean);
    return { title, description: short, full: true };
  },
  name(output) {
    if (output.type === 'operation') {
      const doc = this.document;
      const operation = doc.paths?.[output.item.path]?.[output.item.method];
      const id = operation && 'operationId' in operation ? operation.operationId : undefined;
      if (id) return id;
    }
    return output.type === 'operation'
      ? `${output.item.method}-${output.item.path}`
      : 'webhook';
  },
  async beforeWrite(files) {
    const extra = [];
    for (const file of files) {
      const id = path.basename(file.path, '.mdx');
      if (!localeTitles[id]) continue;
      extra.push({
        path: file.path.replace(/\.mdx$/, '.en.mdx'),
        content: localeMdx(file.content, 'en', id),
      });
      extra.push({
        path: file.path.replace(/\.mdx$/, '.zh-Hant.mdx'),
        content: localeMdx(file.content, 'zh-Hant', id),
      });
    }
    files.push(...extra);
  },
});

// Fumadocs may upgrade its internal OpenAPI version. The published JSON and
// YAML must remain the same contract, including the declared specification version.
const yaml = await readFile(schemaPath, 'utf8');
const outputs = [
  ...files.map(file => ({ path: path.join('content/docs/open-api', file.path), content: file.content })),
  { path: 'public/openapi.yaml', content: yaml },
  { path: 'openapi/anibt.json', content: `${JSON.stringify(parse(yaml))}\n` },
];
const checkOnly = process.argv.includes('--check');
for (const file of outputs) {
  if (checkOnly) {
    const current = await readFile(file.path, 'utf8').catch(() => undefined);
    if (current !== file.content) throw new Error(`Stale generated file: ${file.path}; run gen:openapi`);
  } else {
    await mkdir(path.dirname(file.path), { recursive: true });
    await writeFile(file.path, file.content);
  }
}
console.log(`${checkOnly ? 'Verified' : 'Generated'} ${outputs.length} OpenAPI artifacts`);
