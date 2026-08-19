export const randomString = (length: number) =>
  Array.from(Array(length), () =>
    Math.floor(Math.random() * 36).toString(36),
  ).join('');

type DeltaOp = {
  insert: string;
  attributes?: Record<string, any>;
};

export function deltaToPlainText(delta: DeltaOp[], limit: number = 50): string {
  const plain = delta
    .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= limit) return plain;

  const truncated = plain.slice(0, limit);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…';
}
