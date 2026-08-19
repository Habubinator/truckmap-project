import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { apiRequest, qs } from '../lib/api';
import { PageHeader, Table, btnGhost, inputClass } from '../components/ui';

type ListResponse<T> = { items: T[]; total?: number };

export function ResourcePage<T extends { id: number | string }>({
  title,
  queryKey,
  endpoint,
  columns,
  filters,
  renderRow,
  extraActions,
}: {
  title: string;
  queryKey: string;
  endpoint: string;
  columns: string[];
  filters?: ReactNode;
  renderRow: (row: T) => ReactNode;
  extraActions?: ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const params = useMemo(() => qs({ page, limit: 20, search }), [page, search]);
  const list = useQuery({
    queryKey: [queryKey, params],
    queryFn: () => apiRequest<ListResponse<T>>(`${endpoint}${params}`),
  });
  const items = list.data?.data?.items ?? [];

  return (
    <div>
      <PageHeader
        title={title}
        actions={
          <>
            {extraActions}
            <button className={btnGhost} onClick={() => void list.refetch()}>
              Refresh
            </button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Search…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        {filters}
      </div>
      <Table columns={columns} loading={list.isLoading}>
        {items.map((row) => (
          <tr key={row.id} className="hover:bg-slate-50">
            {renderRow(row)}
          </tr>
        ))}
      </Table>
      <div className="mt-3 flex justify-end gap-2">
        <button className={btnGhost} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <button className={btnGhost} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
