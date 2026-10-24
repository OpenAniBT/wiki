import '../global.css';
import { RootProvider } from '@/components/root-provider';
import { translations } from '@/lib/layout.shared';
import { i18nProvider } from 'fumadocs-ui/i18n';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL('https://wiki.anibt.net'),
  title: {
    default: 'AniBT Wiki',
    template: '%s | AniBT Wiki',
  },
  description: 'AniBT 使用文档、站点同步与公开 API。',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'AniBT Wiki',
    description: 'AniBT 使用文档、站点同步与公开 API。',
    images: ['/og-image.webp'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fffbfc' },
    { media: '(prefers-color-scheme: dark)', color: '#17101a' },
  ],
};

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'globalThis.__name||=(t,n)=>Object.defineProperty(t,"name",{value:n,configurable:!0});',
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider i18n={i18nProvider(translations, lang)}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
