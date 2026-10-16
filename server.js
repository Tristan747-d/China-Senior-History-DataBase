import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'events.json');
const PORT = process.env.PORT || 3210;
const PUBLIC = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

async function ensureData() {
  try {
    await readFile(DATA_FILE, 'utf8');
  } catch {
    await writeFile(DATA_FILE, '[]', 'utf8');
  }
}

async function readEvents() {
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

async function writeEvents(events) {
  await writeFile(DATA_FILE, JSON.stringify(events, null, 2), 'utf8');
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(data);
}

function validateEvent(raw) {
  const errors = [];
  const ev = {};
  ev.title = String(raw.title || '').trim();
  if (!ev.title) errors.push('事件内容不能为空');

  const scale = String(raw.scale || 'year'); // century | year | date
  if (!['century', 'year', 'date'].includes(scale)) errors.push('时间精度无效');
  ev.scale = scale;

  // 统一数值排序键 sortYear（支持公元前）
  const era = String(raw.era || 'CE'); // CE 公元 | BCE 公元前
  const y = scale === 'century'
    ? parseInt(raw.century, 10)
    : parseInt(raw.year, 10);
  if (Number.isNaN(y) || y < 0) errors.push(scale === 'century' ? '世纪无效' : '年份无效');
  ev.era = era;
  ev.year = y;
  ev.sortYear = (era === 'BCE' ? -y : y); // 年份本身

  if (scale === 'century') {
    const c = parseInt(raw.century, 10);
    if (!c || c < 1 || c > 21) errors.push('世纪无效（1-21）');
    ev.century = c;
    // 第 n 世纪取代表年：公元第 n 世纪 ≈ (n-1)*100+50；公元前为负
    ev.sortYear = era === 'BCE' ? -((c - 1) * 100 + 50) : (c - 1) * 100 + 50;
    ev.month = null; ev.day = null;
  } else if (scale === 'year') {
    ev.century = null;
    ev.month = raw.month ? parseInt(raw.month, 10) : null;
    ev.day = null;
  } else {
    ev.century = null;
    const m = parseInt(raw.month, 10), d = parseInt(raw.day, 10);
    if (!(m >= 1 && m <= 12)) errors.push('月份无效');
    if (!(d >= 1 && d <= 31)) errors.push('日期无效');
    ev.month = m; ev.day = d;
  }

  ev.location = String(raw.location || '').trim() || null;
  ev.category = String(raw.category || 'other'); // china | world | other
  if (!['china', 'world', 'other'].includes(ev.category)) errors.push('分类无效');
  ev.tags = Array.isArray(raw.tags) ? raw.tags.map(String).slice(0, 10) : [];
  ev.note = String(raw.note || '').trim() || null;
  ev.id = raw.id || `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  ev.createdAt = raw.createdAt || new Date().toISOString();
  return { ev, errors };
}

const server = http.createServer(async (req, res) => {
  await ensureData();
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/' || url.pathname === '/index.html') {
    try {
      const html = await readFile(path.join(PUBLIC, 'index.html'), 'utf8');
      return send(res, 200, html, MIME['.html']);
    } catch {
      return send(res, 404, 'index.html missing', 'text/plain');
    }
  }
  if (url.pathname === '/dynasty' || url.pathname === '/dynasty.html') {
    return send(res, 200, await readFile(path.join(PUBLIC, 'dynasty.html'), 'utf8'), MIME['.html']);
  }
  if (url.pathname === '/dynasty.js') {
    return send(res, 200, await readFile(path.join(PUBLIC, 'dynasty.js'), 'utf8'), MIME['.js']);
  }
  if (url.pathname === '/app.js') {
    return send(res, 200, await readFile(path.join(PUBLIC, 'app.js'), 'utf8'), MIME['.js']);
  }
  if (url.pathname === '/style.css') {
    return send(res, 200, await readFile(path.join(PUBLIC, 'style.css'), 'utf8'), MIME['.css']);
  }
  if (url.pathname === '/map' || url.pathname === '/map.html') {
    return send(res, 200, await readFile(path.join(PUBLIC, 'map.html'), 'utf8'), MIME['.html']);
  }
  if (url.pathname === '/map.js') {
    return send(res, 200, await readFile(path.join(PUBLIC, 'map.js'), 'utf8'), MIME['.js']);
  }
  if (url.pathname === '/aspect.js') {
    return send(res, 200, await readFile(path.join(PUBLIC, 'aspect.js'), 'utf8'), MIME['.js']);
  }
  if (url.pathname.startsWith('/aspect/')) {
    return send(res, 200, await readFile(path.join(PUBLIC, 'aspect.html'), 'utf8'), MIME['.html']);
  }
  if (url.pathname === '/worldmap.jpg') {
    const buf = await readFile(path.join(PUBLIC, 'worldmap.jpg'));
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
    return res.end(buf);
  }

  if (url.pathname === '/api/events' && req.method === 'GET') {
    const events = await readEvents();
    return send(res, 200, events);
  }

  if (url.pathname === '/api/timemap' && req.method === 'GET') {
    try {
      const tm = JSON.parse(await readFile(path.join(__dirname, 'data', 'timemap.json'), 'utf8'));
      return send(res, 200, tm);
    } catch {
      return send(res, 200, { points: [], minYear: 0, maxYear: 0, total: 0 });
    }
  }

  // 编辑单条事件（任意白名单字段）
  const patchMatch = url.pathname.match(/^\/api\/events\/([\w-]+)$/);
  if (patchMatch && req.method === 'PATCH') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', async () => {
      try {
        const patch = JSON.parse(body);
        const events = await readEvents();
        const ev = events.find(e => e.id === patchMatch[1]);
        if (!ev) return send(res, 404, { error: 'not found' });
        const ALLOW = ['title', 'detail', 'cause', 'process', 'impact', 'location', 'note', 'category', 'year', 'month', 'day', 'century', 'era', 'scale', 'regions', 'aspects', 'lat', 'lng'];
        for (const k of ALLOW) {
          if (k in patch) ev[k] = patch[k];
        }
        if ('year' in patch || 'era' in patch || 'century' in patch) {
          if (ev.scale === 'century' && ev.century) {
            ev.sortYear = ev.era === 'BCE' ? -((ev.century - 1) * 100 + 50) : (ev.century - 1) * 100 + 50;
          } else {
            ev.sortYear = ev.era === 'BCE' ? -ev.year : ev.year;
          }
        }
        ev.updatedAt = new Date().toISOString();
        await writeEvents(events);
        send(res, 200, ev);
      } catch {
        send(res, 400, { error: 'invalid JSON' });
      }
    });
    return;
  }

  if (url.pathname === '/api/events' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 5e6) req.destroy(); });
    req.on('end', async () => {
      try {
        const raw = JSON.parse(body);
        const list = Array.isArray(raw) ? raw : [raw]; // 支持批量
        const valid = [], errs = [];
        for (const item of list) {
          const { ev, errors } = validateEvent(item);
          if (errors.length) errs.push({ title: item.title, errors });
          else valid.push(ev);
        }
        if (valid.length) {
          const events = await readEvents();
          events.push(...valid);
          await writeEvents(events);
        }
        send(res, errs.length ? 207 : 201, { added: valid.length, errors: errs });
      } catch {
        send(res, 400, { error: 'invalid JSON' });
      }
    });
    return;
  }

  const delMatch = url.pathname.match(/^\/api\/events\/([\w-]+)$/);
  if (delMatch && req.method === 'DELETE') {
    const events = await readEvents();
    const next = events.filter(e => e.id !== delMatch[1]);
    if (next.length === events.length) return send(res, 404, { error: 'not found' });
    await writeEvents(next);
    return send(res, 200, { ok: true });
  }

  if (url.pathname === '/api/events' && req.method === 'DELETE') {
    await writeEvents([]);
    return send(res, 200, { ok: true });
  }

  send(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`历史时间轴已启动: http://127.0.0.1:${PORT}`);
});
