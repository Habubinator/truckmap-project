import { ENDPOINTS } from '../lib/api';
import { Badge } from '../components/ui';
import { ResourcePage } from '../components/ResourcePage';

type Tariff = {
  id: number;
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  duration?: number;
  features?: string[];
  isActive?: boolean;
};

export function TariffsPage() {
  return (
    <ResourcePage<Tariff>
      title="Tariffs"
      queryKey="tariffs"
      endpoint={ENDPOINTS.tariffs}
      columns={['ID', 'Name', 'Price', 'Duration', 'Status']}
      renderRow={(t) => (
        <>
          <td className="px-4 py-2">{t.id}</td>
          <td className="px-4 py-2">{t.name ?? '—'}</td>
          <td className="px-4 py-2">
            {t.price ?? '—'} {t.currency ?? ''}
          </td>
          <td className="px-4 py-2">{t.duration ? `${t.duration} days` : '—'}</td>
          <td className="px-4 py-2">
            <Badge tone={t.isActive ? 'green' : 'slate'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
          </td>
        </>
      )}
    />
  );
}
