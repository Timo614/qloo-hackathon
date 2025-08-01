// app/dashboard/[requestId]/page.tsx   ← still a SERVER component
export const dynamic = 'force-dynamic';

import WithI18nReady from '@/app/components/WithI18nReady';   // client component
import Dashboard      from '../Dashboard';                    // ← client component that has prop

export default function DashboardRequestPage({
  params,
}: {
  params: { requestId: string };
}) {
  const { requestId } = params;

  return (
    <WithI18nReady>
      <Dashboard initialRequestId={requestId} />
    </WithI18nReady>
  );
}
