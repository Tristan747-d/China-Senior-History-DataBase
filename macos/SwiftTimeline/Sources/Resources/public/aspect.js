// 分类时间轴页逻辑
const $ = sel => document.getElementById(sel);
let events = [];

const CONF = {
  '经济':   { accent: '#8a6d1d', sub: '农业、手工业、商业贸易、工业革命、经济体制与全球化', icon: '💰' },
  '政治':   { accent: '#1f3a5f', sub: '政权更迭、制度变革、战争条约、外交与国际格局', icon: '🏛️' },
  '文化':   { accent: '#5e3a6e', sub: '思想科技、宗教哲学、文学艺术、教育与传播', icon: '📜' },
};

function aspectFromPath() {
  const p = location.pathname.split('/').pop();
  return { economy: '经济', politics: '政治', culture: '文化' }[p] || '政治';
}

function fmtDisplay(ev) {
  const era = ev.era === 'BCE' ? '前 ' : '';
  if (ev.scale === 'century') return `${era}${ev.century} 世纪`;
  let s = `${era}${ev.year}`;
  if (ev.month) s += `.${ev.month}`;
  if (ev.day) s += `.${ev.day}`;
  return s;
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function catName(c) { return { china: '中国史', world: '世界史', other: '其他' }[c] || ''; }

async function init() {
  const aspect = aspectFromPath();
  const conf = CONF[aspect];
  document.documentElement.style.setProperty('--accent', conf.accent);
  $('pageTitle').textContent = `${conf.icon} ${aspect}史时间轴`;
  $('pageSub').textContent = conf.sub;
  document.querySelectorAll('.tabs a').forEach(a => {
    if (a.dataset.a === aspect) a.classList.add('active');
  });

  events = await (await fetch('/api/events')).json();
  const list = events
    .filter(e => (e.aspects || []).includes(aspect))
    .sort((a, b) => a.sortYear - b.sortYear || (a.month || 0) - (b.month || 0) || (a.day || 0) - (b.day || 0));

  $('cnt').textContent = list.length;
  $('cntChina').textContent = list.filter(e => e.category === 'china').length;
  $('cntWorld').textContent = list.filter(e => e.category === 'world').length;
  $('cntMulti').textContent = list.filter(e => (e.aspects || []).length > 1).length;

  if (!list.length) { $('timeline').innerHTML = '<p class="empty">暂无此类事件</p>'; return; }

  $('timeline').innerHTML = list.map(ev => `
    <div class="item" data-id="${ev.id}">
      <div class="time">${fmtDisplay(ev)}</div>
      <div class="body">
        <div class="title">${esc(ev.title)}
          <span class="cat ${ev.category}">${catName(ev.category)}</span>
          ${(ev.aspects || []).filter(a => a !== aspect).map(a => `<span class="asp">${a}</span>`).join('')}
        </div>
        ${ev.detail ? `<div class="detail">${esc(ev.detail)}</div>` : ''}
        ${ev.location ? `<div class="loc">📍 ${esc(ev.location)}${(ev.regions || []).length > 1 ? ' · ' + ev.regions.join('/') : ''}</div>` : ''}
      </div>
    </div>`).join('');
}

init();
