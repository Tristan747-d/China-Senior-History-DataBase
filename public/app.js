const $ = id => document.getElementById(id);
let events = [];

// ---------- 工具 ----------
function fmtDisplay(ev) {
  const era = ev.era === 'BCE' ? '公元前 ' : '公元 ';
  if (ev.scale === 'century') return `${era}${ev.century} 世纪`;
  let s = `${era}${ev.year}`;
  if (ev.month) s += ` 年 ${ev.month} 月`;
  if (ev.day) s += ` ${ev.day} 日`;
  return s.replace(' 公元 年', ' 年');
}

// ---------- 添加表单 ----------
$('f_scale').addEventListener('change', () => {
  const s = $('f_scale').value;
  $('w_century').classList.toggle('hidden', s !== 'century');
  $('w_year').classList.toggle('hidden', s === 'century');
  $('w_month').classList.toggle('hidden', s === 'year');
  $('w_day').classList.toggle('hidden', s !== 'date');
});

// 填充世纪下拉
(function () {
  const sel = $('f_century');
  for (let c = 21; c >= 1; c--) {
    const o = document.createElement('option');
    o.value = c; o.textContent = `${c} 世纪`;
    sel.appendChild(o);
  }
  // 公元前世纪 1-21
  const g = document.createElement('optgroup');
  g.label = '公元前';
  for (let c = 21; c >= 1; c--) {
    const o = document.createElement('option');
    o.value = `B${c}`; o.textContent = `公元前 ${c} 世纪`;
    g.appendChild(o);
  }
  sel.appendChild(g);
})();

// 世纪选项联动纪元
$('f_century').addEventListener('change', () => {
  const v = $('f_century').value;
  if (v.startsWith('B')) $('f_era').value = 'BCE';
  else $('f_era').value = 'CE';
});

$('addForm').addEventListener('submit', async e => {
  e.preventDefault();
  const scale = $('f_scale').value;
  const ev = {
    title: $('f_title').value,
    category: $('f_category').value,
    scale,
    era: $('f_era').value,
    year: $('f_year').value || 0,
    month: $('f_month').value,
    day: $('f_day').value,
    century: scale === 'century' ? String($('f_century').value).replace('B', '') : null,
    location: $('f_location').value,
    note: $('f_note').value,
  };
  const r = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ev) });
  if (r.ok) {
    $('addForm').reset();
    $('f_scale').dispatchEvent(new Event('change'));
    load();
  } else {
    alert('添加失败');
  }
});

// ---------- 批量导入 ----------
$('bulkBtn').addEventListener('click', async () => {
  const lines = $('bulkText').value.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return;
  const list = lines.map(line => {
    const p = line.split('|').map(s => s.trim());
    const [category, scale, era, year, m, d, title, location, note] = p;
    const ev = { category, scale: scale || 'year', era: era || 'CE', year };
    if (scale === 'century') { ev.century = year; ev.year = null; }
    if (scale === 'date') { ev.month = m; ev.day = d; ev.title = title; ev.location = note; }
    else { ev.title = m; ev.location = d; ev.note = title; }
    // 修正：century 时字段错位
    if (scale === 'century') { ev.title = m; ev.location = d; ev.note = title; }
    return ev;
  });
  const r = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(list) });
  const j = await r.json();
  $('bulkMsg').textContent = `成功 ${j.added} 条${j.errors?.length ? `，失败 ${j.errors.length}` : ''}`;
  if (j.errors?.length) console.warn(j.errors);
  $('bulkText').value = '';
  load();
});

// ---------- 渲染 ----------
async function load() {
  events = await (await fetch('/api/events')).json();
  render();
}

function render() {
  const cats = { china: $('flt_china').checked, world: $('flt_world').checked, other: $('flt_other').checked };
  const q = $('search').value.trim().toLowerCase();
  const list = events
    .filter(e => cats[e.category])
    .filter(e => !q || (e.title + (e.location || '') + (e.note || '')).toLowerCase().includes(q))
    .sort((a, b) => a.sortYear - b.sortYear || (a.month || 0) - (b.month || 0) || (a.day || 0) - (b.day || 0));

  const box = $('timeline');
  if (!list.length) { box.innerHTML = '<p class="empty">暂无事件，快去添加吧～</p>'; return; }

  box.innerHTML = list.map(ev => {
    const hasCard = ev.detail || ev.note || ev.location || ev.cause || ev.process || ev.impact;
    const card = `
      <div class="hovercard" role="tooltip">
        <div class="hc-title">${esc(ev.title)}</div>
        ${ev.detail ? `<div class="hc-sec"><span class="hc-label">简介</span>${esc(ev.detail)}</div>` : ''}
        ${ev.cause ? `<div class="hc-sec"><span class="hc-label">原因</span>${esc(ev.cause)}</div>` : ''}
        ${ev.process ? `<div class="hc-sec"><span class="hc-label">过程</span>${esc(ev.process)}</div>` : ''}
        ${ev.impact ? `<div class="hc-sec"><span class="hc-label">影响</span>${esc(ev.impact)}</div>` : ''}
        ${ev.location ? `<div class="hc-sec hc-loc"><span class="hc-label">地点</span>📍 ${esc(ev.location)}${ev.regions && ev.regions.length > 1 ? ` · ${ev.regions.join('/')}` : ''}</div>` : ''}
        ${ev.note ? `<div class="hc-sec hc-note"><span class="hc-label">校注</span>${esc(ev.note)}</div>` : ''}
      </div>`;
    return `
    <div class="item ${ev.category}" data-id="${ev.id}">
      <div class="time">${fmtDisplay(ev)}</div>
      <div class="body">
        <div class="title">${esc(ev.title)} <span class="cat">${catName(ev.category)}</span><button class="edit" data-id="${ev.id}" title="编辑">✎</button></div>
        ${hasCard ? card : ''}
      </div>
      <button class="del" data-id="${ev.id}" title="删除">✕</button>
    </div>`;
  }).join('');
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function catName(c) { return { china: '中国史', world: '世界史', other: '其他' }[c] || ''; }

// 编辑弹窗
function openEditor(ev) {
  const d = document.createElement('div');
  d.className = 'editor-mask';
  d.innerHTML = `
    <div class="editor">
      <h3>✎ 编辑事件</h3>
      <label>事件标题<textarea id="e_title" rows="2">${esc(ev.title)}</textarea></label>
      <label>详细介绍<textarea id="e_detail" rows="4" placeholder="20-50字介绍">${esc(ev.detail || '')}</textarea></label>
      <div class="phase2">
        <label>原因<textarea id="e_cause" rows="2" placeholder="事件发生的背景与原因">${esc(ev.cause || '')}</textarea></label>
        <label>过程<textarea id="e_process" rows="2" placeholder="事件的具体经过">${esc(ev.process || '')}</textarea></label>
        <label>影响<textarea id="e_impact" rows="2" placeholder="事件的影响与意义">${esc(ev.impact || '')}</textarea></label>
      </div>
      <div class="erow">
        <label>地点<input id="e_location" value="${esc(ev.location || '')}"></label>
        <label>备注<input id="e_note" value="${esc(ev.note || '')}"></label>
      </div>
      <div class="erow">
        <label>分类<select id="e_category">
          ${['china','world','other'].map(c => `<option value="${c}" ${ev.category===c?'selected':''}>${catName(c)}</option>`).join('')}
        </select></label>
        <label>地区（逗号分隔）<input id="e_regions" value="${esc((ev.regions||[]).join(','))}"></label>
      </div>
      <div class="ebtns">
        <button class="save" data-id="${ev.id}">保存</button>
        <button class="cancel">取消</button>
      </div>
    </div>`;
  document.body.appendChild(d);
  d.querySelector('.cancel').onclick = () => d.remove();
  d.querySelector('.save').onclick = async () => {
    const body = {
      title: d.querySelector('#e_title').value.trim(),
      detail: d.querySelector('#e_detail').value.trim(),
      cause: d.querySelector('#e_cause').value.trim(),
      process: d.querySelector('#e_process').value.trim(),
      impact: d.querySelector('#e_impact').value.trim(),
      location: d.querySelector('#e_location').value.trim(),
      note: d.querySelector('#e_note').value.trim(),
      category: d.querySelector('#e_category').value,
      regions: d.querySelector('#e_regions').value.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    };
    await fetch(`/api/events/${ev.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    d.remove();
    load();
  };
}

document.addEventListener('click', async e => {
  if (e.target.classList.contains('del')) {
    const id = e.target.dataset.id;
    if (!confirm('删除这条事件？')) return;
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    load();
  }
  if (e.target.classList.contains('edit')) {
    const ev = events.find(x => x.id === e.target.dataset.id);
    if (ev) openEditor(ev);
  }
  if (e.target.classList.contains('editor-mask')) {
    e.target.remove();
  }
});

['flt_china', 'flt_world', 'flt_other'].forEach(id => $(id).addEventListener('change', render));
$('search').addEventListener('input', render);

$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'history-timeline.json';
  a.click();
});

$('clearBtn').addEventListener('click', async () => {
  if (!confirm('确定清空全部事件？不可恢复！')) return;
  await fetch('/api/events', { method: 'DELETE' });
  load();
});

load();
