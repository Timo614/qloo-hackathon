'use client';
import { useTranslation } from 'react-i18next';

export default function WithI18nReady({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  if (!i18n.isInitialized) return null; 
  return <>{children}</>;
}