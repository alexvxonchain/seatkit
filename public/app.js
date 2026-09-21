const $ = (s) => document.querySelector(s);
const tabs = [...document.querySelectorAll('#tabs button')];
const fallPts = Array.from({ length: 40 }, () => 0.35);

function showTab(id) {
  tabs.forEach((b) => b.classList.toggle('on', b.dataset.tab === id));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('on', p.id === `tab-${id}`));
}

tabs.forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

function renderWallets(sol) {
  const tb = $('#walletTable tbody');
  tb.innerHTML = '';
  for (let i = 1; i <= 8; i++) {
    const tr = document.createElement('tr');
    const bal = (Number(sol) / 8 + (i % 3) * 0.07).toFixed(3);
    tr.innerHTML = `<td>L${i}</td><td>paper_${String(i).padStart(2, '0')}</td><td>${bal}</td><td>${8 + i}%</td><td>ready</td>`;
    tb.appendChild(tr);
  }
}

function drawFall() {
  const c = $('#fallChart');
  const ctx = c.getContext('2d');
  const w = c.width;
  const h = c.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#3a2810';
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  ctx.beginPath();
  fallPts.forEach((v, i) => {
    const x = (i / (fallPts.length - 1)) * w;
    const y = h - v * (h - 20) - 10;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#ff6b8a';
  ctx.lineWidth = 2;
  ctx.stroke();
}

async function refresh() {
  const s = await fetch('/api/state').then((r) => r.json());
  $('#stats').innerHTML = `
    <div>SEAT <b>${s.seat}</b></div>
    <div>HOLD <b>${s.seatSec}s</b></div>
    <div>FILL <b>${s.fill}%</b></div>
    <div>WALLETS <b>${s.wallets}</b></div>
    <div>SOL <b>${s.sol}</b></div>
    <div>FLIPS <b>${s.flips}</b></div>
    <div>PNL <b>${s.pnl}</b></div>
  `;
  $('#kingName').textContent = s.seat;
  $('#kingMeta').textContent = `${s.seatSec}s on seat · curve ${s.fill}% · venue ${s.venue}`;
  $('#fillBar').style.width = `${s.fill}%`;
  $('#climbList').innerHTML = s.climb
    .map((c) => `<div class="row"><span>${c.name}</span><span class="pct">${c.fill}%</span></div>`)
    .join('');
  $('#tradeSeat').textContent = s.seat;
  fallPts.push(0.25 + (s.fill - 62) / 80 + Math.random() * 0.08);
  fallPts.shift();
  drawFall();
  const risk = s.fill > 84 ? 'FALL pressure high' : 'watching pressure';
  $('#fallHint').textContent = risk;
  renderWallets(s.sol);
  $('#clock').textContent = `T+${s.tick}`;
}

function pushLog(line) {
  const box = $('#logBox');
  const ts = new Date().toISOString().slice(11, 19);
  box.textContent = `[${ts}] ${line}\n` + box.textContent.slice(0, 3500);
}

$('#btnLaunch').onclick = () => pushLog('PAPER launch sim queued · template RIDGE · no signature');
$('#btnBuy').onclick = () => pushLog('PAPER batch buy sim · 8 lanes · 0.05 SOL · seat context');
$('#btnSell').onclick = () => pushLog('PAPER batch sell sim · 100% · no keys');

const es = new EventSource('/api/logs');
es.onmessage = (ev) => {
  try {
    const { line } = JSON.parse(ev.data);
    pushLog(line);
  } catch {}
};

refresh();
setInterval(refresh, 900);

// demo auto-tour for recording: ?demo=1
if (new URLSearchParams(location.search).has('demo')) {
  const order = ['seat', 'wallets', 'launch', 'trade', 'logs', 'seat'];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % order.length;
    showTab(order[i]);
  }, 2800);
  document.documentElement.dataset.demo = '1';
}
