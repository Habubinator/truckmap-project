import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ENDPOINTS, apiRequest, qs } from '../lib/api';
import { PageHeader, Table, btnPrimary, inputClass } from '../components/ui';

type Message = {
  id: number;
  author?: { name?: string };
  content?: string;
  createdAt?: string;
};

export function ChatsPage() {
  const [chatId, setChatId] = useState('');
  const [enabled, setEnabled] = useState(false);
  const list = useQuery({
    enabled,
    queryKey: ['chats', chatId],
    queryFn: () =>
      apiRequest<{ items: Message[] }>(`${ENDPOINTS.chats}/${chatId}/messages${qs({ page: 1, limit: 50 })}`),
  });

  return (
    <div>
      <PageHeader title="Chat messages" />
      <div className="mb-4 flex gap-2">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Chat ID"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
        />
        <button
          className={btnPrimary}
          onClick={() => {
            setEnabled(true);
            void list.refetch();
          }}
        >
          Load
        </button>
      </div>
      <Table columns={['ID', 'Author', 'Content', 'Timestamp']} loading={list.isFetching}>
        {(list.data?.data?.items ?? []).map((m) => (
          <tr key={m.id}>
            <td className="px-4 py-2">{m.id}</td>
            <td className="px-4 py-2">{m.author?.name ?? '—'}</td>
            <td className="px-4 py-2">{m.content ?? '—'}</td>
            <td className="px-4 py-2">{m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
