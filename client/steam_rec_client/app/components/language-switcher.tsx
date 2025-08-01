'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'zh'] as const;
type Locale = (typeof LOCALES)[number];

const LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  zh: '简体中文',
};

export function LanguageSwitcher() {
  const { i18n }   = useTranslation();
  const router     = useRouter();
  const pathname   = usePathname();         // e.g. "/fr/dashboard" or "/dashboard"

  /** Navigate + tell i18next */
  const changeLanguage = (next: Locale) => {
    if (next === i18n.language.split('-')[0]) return;   // already on it

    // 1) update i18next (triggers rerender)
    i18n.changeLanguage(next);

    // 2) build new path
    const parts         = pathname.split('/');
    const hasPrefix     = LOCALES.includes(parts[1] as Locale);
    const newPath = hasPrefix
      ? ['/', next, ...parts.slice(2)].join('/').replace(/\/\/+/g, '/')
      : next === 'en'
        ? pathname                             // stay prefix-less for English
        : `/${next}${pathname}`;

    router.replace(newPath);
  };

  const current = i18n.language.split('-')[0] as Locale | string;

  return (
    <select
      value={LOCALES.includes(current as Locale) ? current : 'en'}
      onChange={(e) => changeLanguage(e.target.value as Locale)}
      className="border rounded p-1 bg-background"
    >
      {LOCALES.map((lng) => (
        <option key={lng} value={lng}>
          {LABELS[lng]}
        </option>
      ))}
    </select>
  );
}
