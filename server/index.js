import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const app = express();
const PORT = Number(process.env.PORT || 3847);

const names = ['RIDGE', 'LANTERN', 'SPUD', 'CINDER', 'QUARRY', 'FOLD', 'MARSH', 'VIEW', 'BRIDGE', 'TERRACE'];
let tick = 0;
const clients = new Set();

function paperState() {
  const king = names[Math.floor(tick / 8) % names.length];
  const fill = 62 + ((tick * 3) % 29);
  return {
    mode: 'PAPER',
    venue: 'pump.fun',
    seat: king,
    seatSec: 8 + (tick % 40),
    climb: names.slice(0, 3).map((n, i) => ({
      name: names[(names.indexOf(king) + i + 1) % names.length],
      fill: Math.max(12, fill - 18 - i * 9),
    })),
    fill,
    wallets: 12,
    sol: (4.2 + (tick % 17) * 0.11).toFixed(2),
    flips: Math.floor(tick / 45),
    pnl: ((tick % 50) * 11.4 - 80).toFixed(0),
    tick,
  };
}

app.use(express.static(path.join(root, 'public')));

app.get('/api/state', (_req, res) => {
  res.json(paperState());
});

app.get('/api/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

setInterval(() => {
  tick += 1;
  const s = paperState();
  const lines = [
    `SEAT ${s.seat} hold ${s.seatSec}s · fill ${s.fill}%`,
    `CLIMB ${s.climb.map((c) => c.name + ' ' + c.fill + '%').join(' · ')}`,
    `PAPER buy sim 0.${(10 + (tick % 80)).toString().padStart(2, '0')} SOL · ${s.seat}`,
    `venue pump.fun · pool auto · no keys loaded`,
    tick % 11 === 0 ? `FALL watch · hill pressure rising on ${s.climb[0].name}` : null,
  ].filter(Boolean);
  const line = lines[tick % lines.length];
  const payload = `data: ${JSON.stringify({ t: Date.now(), line })}\n\n`;
  for (const c of clients) c.write(payload);
}, 700);

app.listen(PORT, () => {
  console.log(`SEATKIT paper desk → http://localhost:${PORT}`);
  console.log(`mode=PAPER · no keys · pump.fun venue sim`);
});
