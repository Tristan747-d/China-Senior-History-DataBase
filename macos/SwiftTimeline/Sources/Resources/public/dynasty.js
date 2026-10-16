// 朝代分期页：横向 Tab 切换，每期纵向列出全部史事
const $ = id => document.getElementById(id);

// ===== 分期定义 =====
// 中国：朝代主线；世界：史前→希腊→罗马→中世纪→近代开端→世界大战→冷战至今
const CHINA_ERAS = [
  { key: 'prehistory', name: '史前与传说', short: '史前', lo: -9000000, hi: -2070, span: '远古—约前2070', desc: '元谋人、北京人到新石器时代诸文化，邦国林立，传说时代终结于夏。' },
  { key: 'xia', name: '夏', short: '夏', lo: -2070, hi: -1600, span: '约前2070—前1600', desc: '世袭制取代禅让，中国第一个王朝，二里头遗址或为其都。' },
  { key: 'shang', name: '商', short: '商', lo: -1600, hi: -1046, span: '约前1600—前1046', desc: '甲骨文与青铜器发达，中国有直接文字记载的信史开端。' },
  { key: 'xizhou', name: '西周', short: '西周', lo: -1046, hi: -771, span: '前1046—前771', desc: '分封制与宗法制确立，礼乐文明定型；国人暴动与犬戎之祸。' },
  { key: 'cqzg', name: '春秋战国', short: '春秋战国', lo: -771, hi: -221, span: '前770—前221', desc: '礼崩乐坏、诸侯争霸；铁器牛耕、百家争鸣、变法图强。' },
  { key: 'qin', name: '秦', short: '秦', lo: -221, hi: -207, span: '前221—前207', desc: '首次大一统：皇帝制、郡县制、统一文字度量，二世而亡。' },
  { key: 'xihan', name: '西汉', short: '西汉', lo: -207, hi: 25, span: '前202—25（含新莽）', desc: '休养生息到汉武盛世：推恩令、察举制、独尊儒术、丝路开通。' },
  { key: 'donghan', name: '东汉', short: '东汉', lo: 25, hi: 220, span: '25—220', desc: '光武中兴、造纸改进；外戚宦官交替专权，黄巾乱后名存实亡。' },
  { key: 'sanguo', name: '三国', short: '三国', lo: 220, hi: 280, span: '220—280', desc: '曹魏、蜀汉、孙吴鼎立，九品中正制创立，西晋短暂统一。' },
  { key: 'liangjin', name: '两晋', short: '两晋', lo: 280, hi: 420, span: '266—420', desc: '短暂统一后八王之乱、永嘉之祸，衣冠南渡偏安江左。' },
  { key: 'nanbeichao', name: '南北朝', short: '南北朝', lo: 420, hi: 589, span: '420—589', desc: '南北对峙民族交融：北魏统一北方与孝文帝汉化改革。' },
  { key: 'sui', name: '隋', short: '隋', lo: 581, hi: 618, span: '581—618', desc: '再造统一：开皇之治、科举萌芽、大运河贯通，二世而亡。' },
  { key: 'tang', name: '唐', short: '唐', lo: 618, hi: 907, span: '618—907', desc: '盛世开放：贞观开元、三省六部成熟、两税法、安史之乱转向。' },
  { key: 'wudai', name: '五代十国', short: '五代', lo: 907, hi: 960, span: '907—960', desc: '唐藩镇割据的延续，北方五代更迭，南方十国并立。' },
  { key: 'beisong', name: '北宋', short: '北宋', lo: 960, hi: 1127, span: '960—1127', desc: '重文轻武、冗官积贫；王安石变法图强，靖康之变终结。' },
  { key: 'nansong', name: '南宋', short: '南宋', lo: 1127, hi: 1271, span: '1127—1279（含蒙古）', desc: '偏安江南经济繁荣，绍兴和议、海上丝路；北方蒙古崛起。' },
  { key: 'yuan', name: '元', short: '元', lo: 1271, hi: 1368, span: '1271—1368', desc: '首个少数民族大一统：行省制度、东西交通畅达、恢复科举。' },
  { key: 'ming', name: '明', short: '明', lo: 1368, hi: 1644, span: '1368—1644', desc: '废丞相设内阁：郑和下西洋、一条鞭法、晚明危机与资本主义萌芽。' },
  { key: 'qing1840', name: '清（至1840）', short: '清前中期', lo: 1644, hi: 1840, span: '1644—1840', desc: '康乾盛世：平定边疆、摊丁入亩、多民族国家定型；闭关之下暗流涌动。' },
  { key: 'wanqing', name: '晚清', short: '晚清', lo: 1840, hi: 1912, span: '1840—1912', desc: '鸦片战争国门洞开：太平天国、洋务自强、戊戌变法、辛亥革命。' },
  { key: 'minguo', name: '民国', short: '民国', lo: 1912, hi: 1949, span: '1912—1949', desc: '共和初建到民族独立：新文化运动、国共合作、抗战胜利、解放战争。' },
  { key: 'prc', name: '新中国', short: '新中国', lo: 1949, hi: 9999, span: '1949—今', desc: '从站起来到富起来强起来：建设探索、改革开放、民族复兴。' },
];

const WORLD_ERAS = [
  { key: 'prehistory', name: '史前时代', short: '史前', lo: -9000000, hi: -3000, desc: '人类起源与农业革命：从采集渔猎走向定居生产。' },
  { key: 'ancient', name: '上古文明', short: '上古', lo: -3000, hi: -800, span: '前3000—前800', desc: '大河文明并起：两河、埃及、印度河、商，青铜与早期国家。' },
  { key: 'greek', name: '希腊时代', short: '希腊', lo: -800, hi: -146, span: '前800—前146', desc: '城邦民主、古典哲学、亚历山大东征与希腊化世界。' },
  { key: 'rome', name: '罗马时代', short: '罗马', lo: -146, hi: 476, span: '前146—476', desc: '共和国扩张到帝制鼎盛：罗马法、基督教、帝国分裂与西罗马灭亡。' },
  { key: 'medieval', name: '中世纪', short: '中世纪', lo: 476, hi: 1500, span: '476—1500', desc: '封君封臣、庄园与教会；拜占庭、阿拉伯、奥斯曼相继登场，文艺复兴破晓。' },
  { key: 'early-modern', name: '近代开端', short: '近代开端', lo: 1500, hi: 1914, span: '1500—1914', desc: '新航路、宗教改革、科学革命、启蒙与双元革命，殖民体系形成。' },
  { key: 'world-wars', name: '世界大战', short: '大战时代', lo: 1914, hi: 1945, span: '1914—1945', desc: '两次大战与革命：凡尔赛体系、大萧条、法西斯、反法西斯战争胜利。' },
  { key: 'cold-war', name: '冷战至今', short: '冷战至今', lo: 1945, hi: 9999, span: '1945—今', desc: '两极格局到多极化：冷战、非殖民化、全球化与中国崛起。' },
];

let events = [];
let mode = 'china';
let current = 0;

function fmtDisplay(ev) {
  const era = ev.era === 'BCE' ? '公元前 ' : '公元 ';
  if (ev.scale === 'century') return `${era}${ev.century} 世纪`;
  let s = `${era}${ev.year}`;
  if (ev.month) s += ` 年 ${ev.month} 月`;
  if (ev.day) s += ` ${ev.day} 日`;
  return s.replace(' 公元 年', ' 年');
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function catName(c) { return { china: '中国史', world: '世界史', other: '其他' }[c] || ''; }

async function load() {
  events = await (await fetch('/api/events')).json();
  renderTabs();
  renderEra();
}

function eras() { return mode === 'china' ? CHINA_ERAS : WORLD_ERAS; }

function renderTabs() {
  const html = `
    <div class="mode-switch">
      <button class="msw ${mode==='china'?'active':''}" data-m="china">🇨🇳 中国朝代</button>
      <button class="msw ${mode==='world'?'active':''}" data-m="world">🌍 西方分期</button>
    </div>
    <div class="era-tabs">` +
    eras().map((er, i) => {
      const n = events.filter(e => e.category === (mode === 'china' ? 'china' : 'world') && e.sortYear >= er.lo && e.sortYear < er.hi).length;
      return `<button class="etab ${i === current ? 'active' : ''}" data-i="${i}">${esc(er.short)}<span class="cnt">${n}</span></button>`;
    }).join('') + `</div>`;
  $('tabs').innerHTML = html;
  $('tabs').querySelectorAll('.msw').forEach(b => b.onclick = () => { mode = b.dataset.m; current = 0; renderTabs(); renderEra(); });
  $('tabs').querySelectorAll('.etab').forEach(b => b.onclick = () => { current = +b.dataset.i; renderTabs(); renderEra(); });
}

function renderEra() {
  const er = eras()[current];
  const cat = mode === 'china' ? 'china' : 'world';
  const list = events
    .filter(e => e.category === cat && e.sortYear >= er.lo && e.sortYear < er.hi)
    .sort((a, b) => a.sortYear - b.sortYear || (a.month || 0) - (b.month || 0) || (a.day || 0) - (b.day || 0));

  $('dynastyHead').innerHTML = `
    <h2>${esc(er.name)} <span class="span">${esc(er.span || '')}</span> <span class="count">${list.length} 条</span></h2>
    <p class="era-desc">${esc(er.desc || '')}</p>`;

  if (!list.length) { $('eraList').innerHTML = '<p class="empty">本期暂无事件</p>'; return; }

  $('eraList').innerHTML = list.map(ev => {
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
        <div class="title">${esc(ev.title)}${ev.aspects && ev.aspects.length ? ev.aspects.map(a => `<span class="asp asp-${a}">${a}</span>`).join('') : ''}</div>
        ${hasCard ? card : ''}
      </div>
    </div>`;
  }).join('');
}

// 首页跳转保留当前 tab（可选）
if (location.hash) {
  const idx = +location.hash.replace('#', '');
  if (!isNaN(idx)) current = idx;
}
load();
