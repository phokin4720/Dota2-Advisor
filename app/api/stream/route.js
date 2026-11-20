import { store } from '../../../lib/store';
export const dynamic = 'force-dynamic';

export async function GET() {
  const enc = new TextEncoder();
  let send, ping;
  const stream = new ReadableStream({
    start(c) {
      send = (m) => { try { c.enqueue(enc.encode(m)); } catch {} };
      store.clients.add(send);
      send(`data: ${JSON.stringify(store.state)}\n\n`);
      ping = setInterval(() => send(': ping\n\n'), 15000);
    },
    cancel() { store.clients.delete(send); clearInterval(ping); },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
}
