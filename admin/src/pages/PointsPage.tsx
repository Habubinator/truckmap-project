import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS, apiRequest } from '../lib/api';
import { Badge } from '../components/ui';
import { ResourcePage } from '../components/ResourcePage';

type Point = {
  id: number;
  name?: string;
  chatId?: string;
  type?: string;
  rating?: number;
  reviewsCount?: number;
  verified?: boolean;
};

export function PointsPage() {
  const qc = useQueryClient();
  const verify = useMutation({
    mutationFn: (row: Point) => apiRequest(`${ENDPOINTS.points}/${row.id}/verify`, 'PUT', { verified: !row.verified }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['points'] }),
  });

  return (
    <ResourcePage<Point>
      title="Points"
      queryKey="points"
      endpoint={ENDPOINTS.points}
      columns={['ID', 'Name', 'Chat ID', 'Type', 'Rating', 'Reviews', 'Verified', 'Actions']}
      renderRow={(p) => (
        <>
          <td className="px-4 py-2">{p.id}</td>
          <td className="px-4 py-2">{p.name ?? '—'}</td>
          <td className="px-4 py-2">{p.chatId ?? '—'}</td>
          <td className="px-4 py-2">{p.type ?? '—'}</td>
          <td className="px-4 py-2">{p.rating ?? '—'}</td>
          <td className="px-4 py-2">{p.reviewsCount ?? 0}</td>
          <td className="px-4 py-2">
            <Badge tone={p.verified ? 'green' : 'slate'}>{p.verified ? 'Yes' : 'No'}</Badge>
          </td>
          <td className="px-4 py-2">
            <button className="text-blue-600" onClick={() => verify.mutate(p)}>
              Toggle verify
            </button>
          </td>
        </>
      )}
    />
  );
}
