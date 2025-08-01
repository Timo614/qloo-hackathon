import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';

import { I18nProvider }     from '@/app/components/i18n-provider';
import { ClientWrapper }    from '@/app/components/client-wrapper';
import { getRequestConfig } from '@/i18n/server';  

config.autoAddCss = false;
const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const { t } = await getRequestConfig(params.locale);
  return {
    title: "Arcade Augur",        
    description: "Game recommendations powered by Qloo"
  };
}

export default function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body className={inter.className}>
        <I18nProvider>
          <ClientWrapper>
            {children}
          </ClientWrapper>
        </I18nProvider>
      </body>
    </html>
  );
}
