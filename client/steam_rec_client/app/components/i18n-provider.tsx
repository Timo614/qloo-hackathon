// app/components/i18n-provider.tsx
'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';      // path to the file where you ran i18n.init(...)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
