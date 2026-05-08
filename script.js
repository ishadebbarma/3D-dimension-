
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W, H, cx, cy;
let mouse = { x: 0, y: 0 };
let time = 0;
let frameCount = 0, lastFPS = 0, fpsTimer = 0;
let currentPage = 'home';

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  cx = W / 2; cy = H / 2;
}
resize();
window.addEventListener('resize', resize);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

function setPage(p) {
  currentPage = p;
  document.querySelectorAll('.nav-btn').forEach((b,i) => {
    b.classList.toggle('active', ['home','about','work','contact'][i] === p);
  });
  document.getElementById('page-home').style.display = p === 'home' ? 'block' : 'none';
  ['about','work','contact'].forEach(pg => {
    const el = document.getElementById('page-' + pg);
    el.classList.toggle('vis', p === pg);
  });
}
setPage('home');

const PARTICLES = 600;
const particles = Array.from({length: PARTICLES}, () => ({
  x: Math.random() * 2000 - 1000,
  y: Math.random() * 2000 - 1000,
  z: Math.random() * 2000 - 1000,
  vx: (Math.random() - 0.5) * 0.3,
  vy: (Math.random() - 0.5) * 0.3,
  vz: (Math.random() - 0.5) * 0.3,
  r: Math.random() * 1.5 + 0.5
}));

const CUBES = 18;
const cubes = Array.from({length: CUBES}, (_, i) => ({
  x: (Math.random() - 0.5) * 800,
  y: (Math.random() - 0.5) * 600,
  z: Math.random() * 600 + 200,
  rx: Math.random() * Math.PI * 2,
  ry: Math.random() * Math.PI * 2,
  rz: Math.random() * Math.PI * 2,
  drx: (Math.random() - 0.5) * 0.012,
  dry: (Math.random() - 0.5) * 0.012,
  size: Math.random() * 30 + 12,
  hue: Math.random() * 60 + 190
}));

function project(x, y, z, fov = 700) {
  const scale = fov / (fov + z);
  return { sx: cx + x * scale, sy: cy + y * scale, scale };
}

function drawCube(c, t) {
  const s = c.size;
  const rx = c.rx + t * c.drx;
  const ry = c.ry + t * c.dry;
  const rz = c.rz + t * 0.005;

  const cos = Math.cos, sin = Math.sin;
  function rotVert(x, y, z) {
    let x1 = x*cos(rz) - y*sin(rz);
    let y1 = x*sin(rz) + y*cos(rz);
    let z1 = z;
    let x2 = x1*cos(ry) + z1*sin(ry);
    let y2 = y1;
    let z2 = -x1*sin(ry) + z1*cos(ry);
    let x3 = x2;
    let y3 = y2*cos(rx) - z2*sin(rx);
    let z3 = y2*sin(rx) + z2*cos(rx);
    return [x3, y3, z3];
  }

  const vs = [
    [-s,-s,-s],[s,-s,-s],[s,s,-s],[-s,s,-s],
    [-s,-s, s],[s,-s, s],[s,s, s],[-s,s, s]
  ].map(([x,y,z]) => {
    const [rx2,ry2,rz2] = rotVert(x,y,z);
    const mz = c.z + Math.sin(t * 0.001 + c.x) * 60;
    const p = project(c.x + rx2, c.y + ry2, mz + rz2);
    return p;
  });

  const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  const avgZ = c.z;
  const alpha = Math.min(1, Math.max(0, 1 - avgZ / 1200)) * 0.6;
  ctx.strokeStyle = `hsla(${c.hue}, 80%, 70%, ${alpha})`;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  edges.forEach(([a, b]) => {
    ctx.moveTo(vs[a].sx, vs[a].sy);
    ctx.lineTo(vs[b].sx, vs[b].sy);
  });
  ctx.stroke();
}

function drawGrid(t) {
  const gridSize = 80;
  const cols = Math.ceil(W / gridSize) + 2;
  const rows = 12;
  const perspective = 400;
  const horizon = cy + 80;
  const mx = (mouse.x - cx) * 0.02;

  ctx.strokeStyle = 'rgba(40,100,180,0.15)';
  ctx.lineWidth = 0.5;

  for (let r = 0; r <= rows; r++) {
    const z = (r / rows) * 1.5 + 0.01;
    const scale = perspective / (perspective + z * 300);
    const y = horizon + (1 - scale) * (H - horizon);
    const w = W * scale * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - w/2 + mx * (1-scale)*80, y);
    ctx.lineTo(cx + w/2 + mx * (1-scale)*80, y);
    ctx.stroke();
  }

  for (let col = -Math.floor(cols/2); col <= Math.floor(cols/2); col++) {
    ctx.beginPath();
    for (let r = 0; r <= rows; r++) {
      const z = (r / rows) * 1.5 + 0.01;
      const scale = perspective / (perspective + z * 300);
      const y = horizon + (1 - scale) * (H - horizon);
      const xOff = col * gridSize * scale * 2 + mx * (1-scale)*80;
      const x = cx + xOff;
      if (r === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawOrb(t) {
  const mx = (mouse.x - cx) * 0.04;
  const my = (mouse.y - cy) * 0.04;
  const ox = cx + mx;
  const oy = cy + my - 20;
  const r = 55 + Math.sin(t * 0.001) * 8;
  const rings = 5;
  for (let i = 0; i < rings; i++) {
    const fr = ((t * 0.0008 + i / rings) % 1);
    const rr = r * (0.4 + fr * 0.8);
    const alpha = (1 - fr) * 0.25;
    const tilt = Math.sin(t * 0.0005 + i) * 0.4;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(1, 0.35 + Math.abs(Math.sin(t * 0.0007 + i)) * 0.3);
    ctx.rotate(tilt + t * 0.0003 * (i % 2 ? 1 : -1));
    ctx.beginPath();
    ctx.arc(0, 0, rr, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(100,180,255,${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
  const gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
  gr.addColorStop(0, 'rgba(120,200,255,0.25)');
  gr.addColorStop(0.5, 'rgba(60,120,220,0.1)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(ox, oy, r, 0, Math.PI * 2);
  ctx.fillStyle = gr;
  ctx.fill();
}

let lastT = 0;
function frame(ts) {
  const dt = ts - lastT; lastT = ts;
  time = ts;
  frameCount++;
  fpsTimer += dt;
  if (fpsTimer > 500) {
    lastFPS = Math.round(frameCount * 1000 / fpsTimer);
    frameCount = 0; fpsTimer = 0;
    document.getElementById('fps-val').textContent = lastFPS;
    document.getElementById('rot-val').textContent = Math.round((ts * 0.02) % 360) + '°';
  }

  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H));
  bg.addColorStop(0, '#0a0a25');
  bg.addColorStop(1, '#020208');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawGrid(time);

  ctx.save();
  const camX = (mouse.x - cx) * 0.008;
  const camY = (mouse.y - cy) * 0.006;
  ctx.translate(camX * 8, camY * 8);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.z += p.vz;
    if (p.z > 1200) p.z = -200;
    if (p.z < -200) p.z = 1200;
    if (Math.abs(p.x) > 1100) p.vx *= -1;
    if (Math.abs(p.y) > 1100) p.vy *= -1;
    const pr = project(p.x + camX * 60, p.y + camY * 60, p.z);
    if (pr.sx < 0 || pr.sx > W || pr.sy < 0 || pr.sy > H) return;
    const a = Math.min(1, pr.scale) * 0.6;
    ctx.beginPath();
    ctx.arc(pr.sx, pr.sy, p.r * pr.scale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(120,190,255,${a})`;
    ctx.fill();
  });
  ctx.restore();

  cubes.forEach(c => drawCube(c, time));

  if (currentPage === 'home') drawOrb(time);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);


