// app/dashboard/page.tsx  ← this stays a SERVER component
export const dynamic = 'force-dynamic';

import WithI18nReady from '@/app/components/WithI18nReady'; // <-- 'use client' lives inside
import PublicRecommendations      from './PublicRecommendations';               // <-- your real page (may be 'use client')

export default function PublicRecommendationsPage() {
  return (
    <WithI18nReady>
      <PublicRecommendations />
    </WithI18nReady>
  );
}