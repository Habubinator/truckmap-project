import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ENDPOINTS, apiRequest, qs } from '../lib/api';
import { Badge, Field, Modal, PageHeader, Table, btnGhost, btnPrimary, inputClass } from '../components/ui';

type UserRow = {
  id: number;
  name?: string;
  email?: string;
  username?: string;
  company?: { label?: string };
  roleId?: number;
  isBanned?: boolean;
  isMuted?: boolean;
  subscription?: { isActive?: boolean };
};

type ListResponse = { items: UserRow[]; total?: number };

const roleLabel: Record<number, string> = { 1: 'Super Admin', 2: 'Admin', 3: 'User' };

export function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState('');
  const [banned, setBanned] = useState('');
  const [edit, setEdit] = useState<UserRow | null>(null);
  const [ban, setBan] = useState<UserRow | null>(null);

  const params = useMemo(
    () => qs({ page, limit: 20, search, roleId, isBanned: banned }),
    [page, search, roleId, banned],
  );

  const list = useQuery({
    queryKey: ['users', params],
    queryFn: () => apiRequest<ListResponse>(`${ENDPOINTS.users}${params}`),
  });
  const items = list.data?.data?.items ?? [];

  const save = useMutation({
    mutationFn: (payload: { id: number; name: string; username: string; email: string }) =>
      apiRequest(`${ENDPOINTS.users}/${payload.id}/edit-profile`, 'PUT', {
        name: payload.name,
        username: payload.username,
        email: payload.email,
      }),
    onSuccess: () => {
      setEdit(null);
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const banMut = useMutation({
    mutationFn: (payload: { id: number; reason: string; duration: string }) => {
      const ms = payload.duration === 'permanent' ? null : payload.duration === '12h' ? 12 * 3600_000 : 24 * 3600_000;
      return apiRequest(`${ENDPOINTS.users}/${payload.id}/ban`, 'POST', {
        reason: payload.reason,
        expiredAt: ms ? new Date(Date.now() + ms).toISOString() : null,
      });
    },
    onSuccess: () => {
      setBan(null);
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Users"
        actions={
          <button className={btnGhost} onClick={() => void list.refetch()}>
            Refresh
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={`${inputClass} max-w-xs`} placeholder="Search users…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className={inputClass} value={roleId} onChange={(e) => { setRoleId(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="1">Super Admin</option>
          <option value="2">Admin</option>
          <option value="3">User</option>
        </select>
        <select className={inputClass} value={banned} onChange={(e) => { setBanned(e.target.value); setPage(1); }}>
          <option value="">All status</option>
          <option value="false">Active</option>
          <option value="true">Banned</option>
        </select>
      </div>
      <Table columns={['ID', 'Name', 'Email', 'Username', 'Company', 'Role', 'Status', 'Actions']} loading={list.isLoading}>
        {items.map((u) => (
          <tr key={u.id} className="hover:bg-slate-50">
            <td className="px-4 py-2">{u.id}</td>
            <td className="px-4 py-2">{u.name ?? '—'}</td>
            <td className="px-4 py-2">{u.email ?? '—'}</td>
            <td className="px-4 py-2">{u.username ?? '—'}</td>
            <td className="px-4 py-2">{u.company?.label ?? '—'}</td>
            <td className="px-4 py-2">{roleLabel[u.roleId ?? 3] ?? u.roleId}</td>
            <td className="px-4 py-2">
              <Badge tone={u.isBanned ? 'red' : 'green'}>{u.isBanned ? 'Banned' : 'Active'}</Badge>
            </td>
            <td className="px-4 py-2">
              <button className="mr-2 text-blue-600" onClick={() => setEdit(u)}>Edit</button>
              <button className="text-red-600" onClick={() => setBan(u)}>Ban</button>
            </td>
          </tr>
        ))}
      </Table>
      <div className="mt-3 flex justify-end gap-2">
        <button className={btnGhost} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <button className={btnGhost} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      <Modal open={!!edit} title="Edit user" onClose={() => setEdit(null)} footer={
        <>
          <button className={btnGhost} onClick={() => setEdit(null)}>Cancel</button>
          <button className={btnPrimary} onClick={() => edit && save.mutate({ id: edit.id, name: edit.name ?? '', username: edit.username ?? '', email: edit.email ?? '' })}>
            Save
          </button>
        </>
      }>
        {edit ? (
          <>
            <Field label="Name"><input className={inputClass} value={edit.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Username"><input className={inputClass} value={edit.username ?? ''} onChange={(e) => setEdit({ ...edit, username: e.target.value })} /></Field>
            <Field label="Email"><input className={inputClass} value={edit.email ?? ''} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
          </>
        ) : null}
      </Modal>

      <Modal open={!!ban} title="Ban user" onClose={() => setBan(null)} footer={
        <>
          <button className={btnGhost} onClick={() => setBan(null)}>Cancel</button>
          <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white" onClick={() => {
            const form = document.getElementById('ban-form') as HTMLFormElement;
            const fd = new FormData(form);
            if (ban) banMut.mutate({ id: ban.id, reason: String(fd.get('reason')), duration: String(fd.get('duration')) });
          }}>Ban</button>
        </>
      }>
        <form id="ban-form">
          <Field label="Reason"><textarea name="reason" required className={inputClass} /></Field>
          <Field label="Duration">
            <select name="duration" className={inputClass}>
              <option value="12h">12 hours</option>
              <option value="24h">24 hours</option>
              <option value="permanent">Permanent</option>
            </select>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
