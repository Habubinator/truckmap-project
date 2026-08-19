import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS, apiRequest } from '../lib/api';
import { Badge } from '../components/ui';
import { ResourcePage } from '../components/ResourcePage';

type Instruction = {
  id: number;
  pointId?: number;
  type?: string;
  title?: string;
  latitude?: string;
  longitude?: string;
  status?: string;
  creator?: { name?: string };
  createdAt?: string;
};

export function InstructionsPage() {
  const qc = useQueryClient();
  const mutate = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
      apiRequest(`${ENDPOINTS.instructions}/${id}/${action}`, 'POST'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['instructions'] }),
  });

  return (
    <ResourcePage<Instruction>
      title="Point instructions"
      queryKey="instructions"
      endpoint={ENDPOINTS.instructions}
      columns={['ID', 'Point', 'Type', 'Title', 'Coords', 'Status', 'Actions']}
      renderRow={(row) => (
        <>
          <td className="px-4 py-2">{row.id}</td>
          <td className="px-4 py-2">{row.pointId ?? '—'}</td>
          <td className="px-4 py-2">{row.type ?? '—'}</td>
          <td className="px-4 py-2">{row.title ?? '—'}</td>
          <td className="px-4 py-2">
            {row.latitude && row.longitude ? `${row.latitude}, ${row.longitude}` : '—'}
          </td>
          <td className="px-4 py-2">
            <Badge tone={row.status === 'APPROVED' ? 'green' : row.status === 'REJECTED' ? 'red' : 'amber'}>
              {row.status ?? '—'}
            </Badge>
          </td>
          <td className="px-4 py-2">
            <button className="mr-2 text-emerald-600" onClick={() => mutate.mutate({ id: row.id, action: 'approve' })}>
              Approve
            </button>
            <button className="text-red-600" onClick={() => mutate.mutate({ id: row.id, action: 'reject' })}>
              Reject
            </button>
          </td>
        </>
      )}
    />
  );
}
