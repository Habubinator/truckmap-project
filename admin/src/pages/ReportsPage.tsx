import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS, apiRequest } from '../lib/api';
import { Badge } from '../components/ui';
import { ResourcePage } from '../components/ResourcePage';

type Report = {
  id: number;
  type?: string;
  category?: string;
  reporter?: { name?: string };
  reportedUser?: { name?: string };
  status?: string;
  createdAt?: string;
};

export function ReportsPage() {
  const qc = useQueryClient();
  const close = useMutation({
    mutationFn: (id: number) => apiRequest(`${ENDPOINTS.reports}/${id}`, 'PATCH', { status: 'CLOSED' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['reports'] }),
  });

  return (
    <ResourcePage<Report>
      title="Reports"
      queryKey="reports"
      endpoint={ENDPOINTS.reports}
      columns={['ID', 'Type', 'Category', 'Reporter', 'Reported', 'Status', 'Created', 'Actions']}
      renderRow={(r) => (
        <>
          <td className="px-4 py-2">{r.id}</td>
          <td className="px-4 py-2">{r.type ?? '—'}</td>
          <td className="px-4 py-2">{r.category ?? '—'}</td>
          <td className="px-4 py-2">{r.reporter?.name ?? '—'}</td>
          <td className="px-4 py-2">{r.reportedUser?.name ?? '—'}</td>
          <td className="px-4 py-2">
            <Badge tone={r.status === 'RESOLVED' || r.status === 'CLOSED' ? 'green' : 'amber'}>{r.status ?? '—'}</Badge>
          </td>
          <td className="px-4 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
          <td className="px-4 py-2">
            <button className="text-blue-600" onClick={() => close.mutate(r.id)}>
              Close
            </button>
          </td>
        </>
      )}
    />
  );
}
