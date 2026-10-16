// 地图页逻辑 v2：非线性时间轴 + 多区事件
const $ = sel => document.getElementById(sel.replace(/^#/, ''));
let events = [];
let timeMap = null;   // { points: [{year, pos}] }
let winYears = 25;
let sliderPos = 0.5;  // 0~1 滑条位置

const SLIDER_TICKS = 24; // 刻度标签数

function init() {
  return Promise.all([
    fetch('/api/events').then(r => r.json()),
    fetch('/api/timemap').then(r => r.json()),
  ]).then(([ev, tm]) => {
    events = ev;
    timeMap = tm;
    buildLabels();
    // 默认停在 1911 附近
    const p1911 = nearestPos(1911);
    $('#timeSlider').value = Math.round(p1911 * 1000);
    sliderPos = p1911;
    render();
  });
}

// pos → year：在映射点之间线性插值
function posToYear(pos) {
  const pts = timeMap.points;
  if (pos <= pts[0].pos) return pts[0].year;
  if (pos >= pts[pts.length - 1].pos) return pts[pts.length - 1].year;
  for (let i = 1; i < pts.length; i++) {
    if (pos <= pts[i].pos) {
      const a = pts[i - 1], b = pts[i];
      const t = (pos - a.pos) / (b.pos - a.pos || 1);
      return Math.round(a.year + t * (b.year - a.year));
    }
  }
  return pts[pts.length - 1].year;
}

// year → pos：找最近映射点
function nearestPos(year) {
  let best = timeMap.points[0], bd = Infinity;
  for (const p of timeMap.points) {
    const d = Math.abs(p.year - year);
    if (d < bd) { bd = d; best = p; }
  }
  return best.pos;
}

function buildLabels() {
  const box = $('#sliderLabels');
  const pts = timeMap.points;
  box.style.position = 'relative';
  box.style.height = '1rem';
  let html = '';
  for (let i = 0; i <= SLIDER_TICKS; i++) {
    const pos = i / SLIDER_TICKS;
    const y = posToYear(pos);
    html += `<span style="position:absolute;left:${pos * 100}%;transform:translateX(-50%);white-space:nowrap;">${fmtYear(y)}</span>`;
  }
  box.innerHTML = html;
}

function fmtYear(y) { return y < 0 ? `前${-y}` : `${y}`; }

function fmtEventTime(ev) {
  const era = ev.era === 'BCE' ? '前 ' : '';
  if (ev.scale === 'century') return `${era}${ev.century} 世纪`;
  let s = `${era}${ev.year}`;
  if (ev.month) s += `.${ev.month}`;
  if (ev.day) s += `.${ev.day}`;
  return s;
}

function toXY(lat, lng, w, h) {
  return { x: (lng + 180) / 360 * w, y: (90 - lat) / 180 * h };
}

function currentYear() { return posToYear(sliderPos); }

function render() {
  const img = $('worldMap');
  const w = img.clientWidth, h = img.clientHeight;
  const year = currentYear();
  const nearby = events.filter(e => Math.abs(e.sortYear - year) <= winYears);

  $('#yearDisplay').textContent = `${fmtYear(year)} 年前后（±${winYears} 年 · ${nearby.length} 条）`;
  $('#winInfo').textContent = `±${winYears} 年`;
  $('#nbCount').textContent = nearby.length;

  // 聚合近坐标点
  const groups = [];
  for (const ev of nearby) {
    if (ev.lat == null) continue;
    const { x, y } = toXY(ev.lat, ev.lng, w, h);
    const g = groups.find(g => Math.abs(g.x - x) < 12 && Math.abs(g.y - y) < 12);
    if (g) g.items.push(ev);
    else groups.push({ x, y, items: [ev] });
  }

  $('pins').innerHTML = groups.map((g, gi) => {
    const cats = [...new Set(g.items.map(i => i.category))];
    const multiRegion = g.items.some(i => (i.regions || []).length > 1);
    const cls = multiRegion ? 'multi' : cats.length === 1 ? cats[0] : 'other';
    const cnt = g.items.length > 1 ? `<span class="cnt">${g.items.length}</span>` : '';
    return `<div class="pin ${cls}" style="left:${g.x}px;top:${g.y}px" data-gi="${gi}">${cnt}</div>`;
  }).join('');

  // tooltip
  const tip = $('tooltip');
  document.querySelectorAll('#pins .pin').forEach(p => {
    p.addEventListener('mouseenter', () => {
      const g = groups[+p.dataset.gi];
      tip.innerHTML = g.items.slice(0, 8).map(ev =>
        `<div class="tt-time">${fmtEventTime(ev)} · ${(ev.regions || []).join('/')}</div><div class="tt-title">${esc(ev.title)}</div><div class="tt-detail">${esc(ev.detail || ev.note || '')}</div>`
      ).join('') + (g.items.length > 8 ? `<div style="color:#8fa;font-size:.75rem;margin-top:.3rem">…还有 ${g.items.length - 8} 条</div>` : '');
      tip.style.display = 'block';
      tip.style.maxWidth = '360px';
      const wrap = $('mapWrap').getBoundingClientRect();
      const px = p.getBoundingClientRect();
      let lx = px.left - wrap.left + 16, ly = px.top - wrap.top - 10;
      if (lx + 370 > wrap.width) lx = px.left - wrap.left - 380;
      tip.style.left = lx + 'px';
      tip.style.top = Math.max(4, ly) + 'px';
    });
    p.addEventListener('mouseleave', () => tip.style.display = 'none');
  });

  // 列表
  const sorted = nearby.slice().sort((a, b) => a.sortYear - b.sortYear);
  $('#nbList').innerHTML = sorted.map(e => `
    <div class="nb-item">
      <span class="t">${fmtEventTime(e)}</span>
      <span class="c ${e.category}">${catName(e.category)}</span>
      <span>${esc(e.title)}</span>
      ${e.location ? `<span class="loc">📍${esc(e.location)}</span>` : ''}
      ${(e.regions || []).length > 1 ? `<span class="loc">${e.regions.join(' ↔ ')}</span>` : ''}
    </div>`).join('') || '<p style="color:#7f8c9b">此时间段暂无事件，拖动滑条或调宽窗口试试</p>';
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function catName(c) { return { china: '中国史', world: '世界史', other: '其他' }[c] || ''; }

$('timeSlider').addEventListener('input', e => {
  sliderPos = +e.target.value / 1000;
  render();
});
document.querySelectorAll('input[name=win]').forEach(r =>
  r.addEventListener('change', e => { winYears = +e.target.value; render(); }));
window.addEventListener('resize', render);

init();
