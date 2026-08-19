import { useQuery } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ENDPOINTS, apiRequest } from '../lib/api';
import { PageHeader, btnGhost } from '../components/ui';
import { useState } from 'react';

type Stats = {
  totalUsers?: number;
  newUsersDay?: number;
  newUsersWeek?: number;
  premiumUsers?: number;
  bannedUsers?: number;
  mutedUsers?: number;
  questions?: number;
  answers?: number;
  points?: number;
  verifiedPoints?: number;
  pendingReports?: number;
  companies?: number;
};

type ChartPoint = { label: string; value: number };

export function DashboardPage() {
  const [chartType, setChartType] = useState('new-users');
  const stats = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiRequest<Stats>(ENDPOINTS.dashboardStats),
  });
  const status = useQuery({
    queryKey: ['dashboard', 'status'],
    queryFn: () => apiRequest<{ messageServer?: { connected?: boolean; uptime?: string }; apiUptime?: string; logs?: string }>(
      ENDPOINTS.systemStatus,
    ),
  });
  const chart = useQuery({
    queryKey: ['dashboard', 'chart', chartType],
    queryFn: () => apiRequest<ChartPoint[]>(`${ENDPOINTS.dashboardChart}?type=${chartType}`),
  });

  const s = stats.data?.data ?? {};
  const cards = [
    ['Users', s.totalUsers],
    ['New today', s.newUsersDay],
    ['This week', s.newUsersWeek],
    ['Premium', s.premiumUsers],
    ['Banned', s.bannedUsers],
    ['Muted', s.mutedUsers],
    ['Questions', s.questions],
    ['Answers', s.answers],
    ['Points', s.points],
    ['Verified', s.verifiedPoints],
    ['Reports', s.pendingReports],
    ['Companies', s.companies],
  ] as const;

  const connected = status.data?.data?.messageServer?.connected;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        actions={
          <button className={btnGhost} onClick={() => void stats.refetch()}>
            Refresh
          </button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-xl font-semibold">{value ?? '—'}</div>
          </div>
        ))}
      </div>
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">Analytics</h3>
          <div className="flex gap-1">
            {['new-users', 'active-users', 'subscribers'].map((t) => (
              <button
                key={t}
                className={`rounded-md px-2 py-1 text-xs ${chartType === t ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
                onClick={() => setChartType(t)}
              >
                {t.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart.data?.data ?? []}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 font-medium">Message server</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {connected ? 'Connected' : 'Checking…'}
          </div>
          <p className="mt-2 text-sm text-slate-500">Uptime: {status.data?.data?.messageServer?.uptime ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 font-medium">API uptime</h3>
          <p className="text-sm">{status.data?.data?.apiUptime ?? '—'}</p>
        </div>
      </div>
      <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-200">
        {status.data?.data?.logs ?? 'No logs'}
      </pre>
    </div>
  );
}
