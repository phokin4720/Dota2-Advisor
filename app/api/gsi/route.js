import { store, slim } from '../../../lib/store';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.json();
  store.state = slim(body);
  const msg = `data: ${JSON.stringify(store.state)}\n\n`;
  for (const send of store.clients) send(msg);
  return new Response('ok');
}
