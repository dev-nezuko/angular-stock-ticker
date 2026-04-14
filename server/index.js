import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 8080;
const TOKEN = process.env.FINNHUB_API_KEY || '';
const POLL_MS = Number(process.env.POLL_INTERVAL_MS) || 5000;

const STOCKS = [
  { symbol: 'AAPL', name: 'Apple', base: 178 },
  { symbol: 'GOOGL', name: 'Alphabet', base: 140 },
  { symbol: 'MSFT', name: 'Microsoft', base: 420 },
  { symbol: 'TSLA', name: 'Tesla', base: 248 },
];

const metric52 = new Map();
const round2 = (n) => Math.round(n * 100) / 100;

function mock(meta) {
  const d = (Math.random() - 0.5) * meta.base * 0.004;
  const c = Math.max(1, meta.base + d);
  const s = meta.base * 0.012;
  return {
    symbol: meta.symbol,
    name: meta.name,
    source: 'simulated',
    current: round2(c),
    dayHigh: round2(c + s * Math.random()),
    dayLow: round2(c - s * Math.random()),
    week52High: round2(meta.base * 1.25),
    week52Low: round2(meta.base * 0.72),
    previousClose: round2(meta.base),
  };
}

async function finnhub(path) {
  const u = `https://finnhub.io/api/v1${path}${path.includes('?') ? '&' : '?'}token=${TOKEN}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

async function live(meta) {
  const q = await finnhub(`/quote?symbol=${encodeURIComponent(meta.symbol)}`);
  const c = q.c;
  if (!c || c <= 0) throw new Error('bad');
  const pc = q.pc || c;
  let h52 = null, l52 = null;
  try {
    const k = metric52.get(meta.symbol);
    if (k && Date.now() - k.t < 3600000) {
      h52 = k.h;
      l52 = k.l;
    } else {
      const m = (await finnhub(`/stock/metric?symbol=${encodeURIComponent(meta.symbol)}&metric=all`)).metric || {};
      if (m['52WeekHigh'] != null && m['52WeekLow'] != null) {
        h52 = m['52WeekHigh'];
        l52 = m['52WeekLow'];
        metric52.set(meta.symbol, { h: h52, l: l52, t: Date.now() });
      }
    }
  } catch {
    h52 = null;
    l52 = null;
  }
  return {
    symbol: meta.symbol,
    name: meta.name,
    source: 'provider',
    current: round2(c),
    dayHigh: q.h > 0 ? round2(q.h) : null,
    dayLow: q.l > 0 ? round2(q.l) : null,
    week52High: h52 == null ? null : round2(h52),
    week52Low: l52 == null ? null : round2(l52),
    previousClose: round2(pc),
  };
}

async function poll() {
  const out = [];
  for (const m of STOCKS) {
    try {
      out.push(TOKEN ? await live(m) : mock(m));
    } catch (e) {
      console.warn(m.symbol, "Provider unavailable; using simulated data");
      out.push(mock(m));
    }
  }
  return out;
}

const http = createServer((_, res) => {
  res.writeHead(200);
  res.end('ok');
});
const wss = new WebSocketServer({ server: http });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

function send(q) {
  const s = JSON.stringify(q);
  for (const c of clients) if (c.readyState === 1) c.send(s);
}

http.listen(PORT, '127.0.0.1', () => {
  console.log(`ws://localhost:${PORT}  Finnhub: ${TOKEN ? 'on' : 'off'}`);
  async function tick() {
    try { (await poll()).forEach(send); }
    catch { console.warn("Quote poll failed"); }
    finally { setTimeout(tick, Math.max(1000, POLL_MS)); }
  }
  void tick();
});
