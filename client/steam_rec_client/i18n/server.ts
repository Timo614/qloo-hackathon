// src/i18n/server.ts
import 'server-only';                 // prevents accidental client bundling
import path from 'path';
import { createInstance } from 'i18next';
import FsBackend from 'i18next-fs-backend';

const supportedLngs = ['en', 'es', 'fr', 'de', 'ja', 'zh'];

/**
 * Returns a ready-to-use t() for the current request’s locale.
 * Call this only from server components (e.g. generateMetadata).
 */
export async function getRequestConfig(locale: string = 'en') {
  const i18n = createInstance();

  await i18n
    .use(FsBackend)
    .init({
      lng: supportedLngs.includes(locale) ? locale : 'en',
      fallbackLng: 'en',
      supportedLngs,
      ns: ['translation'],
      defaultNS: 'translation',
      backend: {
        // loads public/locales/{lng}/translation.json
        loadPath: path.join(process.cwd(), 'public/locales/{{lng}}/{{ns}}.json')
      },
      // don’t spawn an extra promise on the server
      initImmediate: false
    });

  return { t: i18n.t.bind(i18n) };
}
