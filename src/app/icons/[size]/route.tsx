import { renderIcon } from '@/lib/icon';

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  if (size !== '192' && size !== '512') return new Response('Not found', { status: 404 });
  return renderIcon(Number(size));
}
