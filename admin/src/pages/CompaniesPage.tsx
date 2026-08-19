import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS, apiRequest } from '../lib/api';
import { Badge } from '../components/ui';
import { ResourcePage } from '../components/ResourcePage';

type Company = {
  id: number;
  label?: string;
  chatId?: string;
  members?: unknown[];
  status?: string;
  createdAt?: string;
};

export function CompaniesPage() {
  const qc = useQueryClient();
  const mutate = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
      apiRequest(`${ENDPOINTS.companies}/${id}/${action}`, 'POST'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['companies'] }),
  });

  return (
    <ResourcePage<Company>
      title="Companies"
      queryKey="companies"
      endpoint={ENDPOINTS.companies}
      columns={['ID', 'Label', 'Chat ID', 'Members', 'Status', 'Created', 'Actions']}
      renderRow={(c) => (
        <>
          <td className="px-4 py-2">{c.id}</td>
          <td className="px-4 py-2">{c.label ?? '—'}</td>
          <td className="px-4 py-2">{c.chatId ?? '—'}</td>
          <td className="px-4 py-2">{c.members?.length ?? 0}</td>
          <td className="px-4 py-2">
            <Badge tone={c.status === 'APPROVED' ? 'green' : c.status === 'REJECTED' ? 'red' : 'amber'}>
              {c.status ?? '—'}
            </Badge>
          </td>
          <td className="px-4 py-2">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
          <td className="px-4 py-2">
            <button className="mr-2 text-emerald-600" onClick={() => mutate.mutate({ id: c.id, action: 'approve' })}>
              Approve
            </button>
            <button className="text-red-600" onClick={() => mutate.mutate({ id: c.id, action: 'reject' })}>
              Reject
            </button>
          </td>
        </>
      )}
    />
  );
}
