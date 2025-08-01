// app/dashboard/page.tsx  ← this stays a SERVER component
export const dynamic = 'force-dynamic';

import WithI18nReady from '@/app/components/WithI18nReady'; // <-- 'use client' lives inside
import Dashboard      from './Dashboard';               // <-- your real page (may be 'use client')

export default function DashboardPage() {
  return (
    <WithI18nReady>
      <Dashboard />
    </WithI18nReady>
  );
}