import { OPENAPI_DOCUMENT_ID, openapi } from '@/lib/openapi';

export const dynamic = 'force-static';

/** API 页在浏览器里渲染用的文档（Fumadocs 处理后的版本，与服务端渲染一致）。 */
export async function GET() {
  const { bundled } = await openapi.getSchema(OPENAPI_DOCUMENT_ID);
  return Response.json(bundled);
}
