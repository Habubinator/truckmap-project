import { ENDPOINTS } from '../lib/api';
import { Badge } from '../components/ui';
import { ResourcePage } from '../components/ResourcePage';

type Question = {
  id: number;
  title?: string;
  section?: { name?: string };
  subsection?: { name?: string };
  author?: { name?: string };
  answersCount?: number;
  resolved?: boolean;
  createdAt?: string;
};

export function QuestionsPage() {
  return (
    <ResourcePage<Question>
      title="Questions"
      queryKey="questions"
      endpoint={ENDPOINTS.questions}
      columns={['ID', 'Title', 'Section', 'Author', 'Answers', 'Status', 'Created']}
      renderRow={(q) => (
        <>
          <td className="px-4 py-2">{q.id}</td>
          <td className="px-4 py-2">{q.title ?? '—'}</td>
          <td className="px-4 py-2">{q.section?.name ?? '—'}</td>
          <td className="px-4 py-2">{q.author?.name ?? '—'}</td>
          <td className="px-4 py-2">{q.answersCount ?? 0}</td>
          <td className="px-4 py-2">
            <Badge tone={q.resolved ? 'green' : 'amber'}>{q.resolved ? 'Resolved' : 'Open'}</Badge>
          </td>
          <td className="px-4 py-2">{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '—'}</td>
        </>
      )}
    />
  );
}
