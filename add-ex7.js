#!/usr/bin/env node
// 补充：晚清鸦片、经济变动与开眼看世界（6条）
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'events.json');

const rows = [
  // —— 鸦片输入 ——
  ['清道光年间','CE',1830,'鸦片走私激增','英国为扭转对华贸易逆差（正常贸易中英国大量进口茶叶丝绸而工业品滞销），以鸦片为武器对华走私。','工业革命后英国需要中国市场，正当商品无法打开，转向鸦片贸易牟取暴利','19世纪初每年输入约4000箱，1838年激增至4万箱；白银大量外流（每年数百万至千万两），银贵钱贱、财政困难；民众吸食成瘾（估计数百万人）','鸦片贸易成为近代中国灾难的起点：白银外流引发银贵钱贱、加重农民负担；国民身心受害；清廷禁烟（林则徐）引发鸦片战争'],
  // —— 虎门销烟 ——
  ['公元1839年','CE',1839,'虎门销烟','道光帝令林则徐为钦差大臣赴广东禁烟，林则徐在虎门海滩当众销毁收缴的鸦片。','鸦片泛滥危及国计民生、白银外流、军队腐化，道光帝下定决心禁烟','1839年3月林则徐抵广州，勒令外商交出鸦片20283箱（约237万斤）；6月3-25日在虎门海滩用海水浸化法当众销毁','中国人民反侵略斗争的起点：林则徐成为民族英雄、禁毒象征；6月26日为国际禁毒日（1987年联合国确定）；英国以此为借口发动鸦片战争'],
  // —— 小农经济解体 ——
  ['鸦片战争后','CE',1842,'自然经济逐步解体（小农经济解体）','鸦片战争后五口通商、协定关税使外国商品倾销，中国家庭农业与家庭手工业相结合的自然经济开始解体。','不平等条约打开中国市场，洋纱洋布凭特权低价倾销','洋纱首先取代土纱（纺与织分离）、洋布取代土布（织与耕分离）；农产品日益商品化（丝茶出口激增）；东南沿海经济作物区先受冲击','中国逐步卷入资本主义世界市场：自然经济解体为资本主义发展提供劳动力和市场；中国沦为西方原料产地与商品市场；传统社会经济结构发生根本变化'],
  // —— 开眼看世界 ——
  ['道光年间','CE',1839,'林则徐组织编译《四洲志》','林则徐在广州禁烟期间认识到西方船坚炮利，设译馆、组织翻译西方书报，了解“夷情”。','禁烟斗争需要知彼知己，林则徐主张“师敌之长技以制敌”','1839-1840年组织译《四洲志》（译自《世界地理大全》），介绍世界30余国地理历史；又译《华事夷言》等','近代中国“开眼看世界第一人”：突破“天朝上国”观念，开了解世界、研究世界的风气；《四洲志》为魏源《海国图志》的蓝本'],
  ['公元1842年','CE',1842,'魏源编成《海国图志》','魏源受林则徐嘱托，在《四洲志》基础上广泛搜集资料，编成《海国图志》。','鸦片战争失败刺激士人研究西方、寻求御侮之道','1842年初版50卷，1852年扩至100卷；系统介绍世界各国地理历史政治；提出“师夷长技以制夷”的著名主张','近代思想史上划时代的著作：“师夷长技以制夷”成为洋务运动的思想先声；此书传入日本后对明治维新产生重要影响（在中国反而未受重视）'],
  ['晚清时期','CE',1845,'《瀛环志略》与开眼看世界思潮','徐继畬著《瀛环志略》（1848），与魏源《海国图志》、林则徐《四洲志》并称近代中国早期世界地理三大著作；开明士人开始正视西方。','鸦片战争暴露中国对世界无知，少数有识之士著书介绍世界','徐继畬《瀛环志略》（1848）系统介绍世界近80国地理政治，对华盛顿评价甚高；梁廷枏《海国四说》等相继问世','突破“华夷观念”的先声：为洋务运动与维新思想提供认知基础；但此期著作仍属少数，主流观念未变，直到甲午战败后才真正觉醒'],
];

const existing = JSON.parse(await readFile(DATA_FILE, 'utf8'));
const existTitles = new Set(existing.map(e => e.title));
const toAdd = rows.filter(r => !existTitles.has(r[2]));
const newEvents = toAdd.map((r, i) => {
  const [timeText, era, year, title, detail, cause, process, impact] = r;
  return {
    id: `ex7_${String(existing.length + i).padStart(3, '0')}`,
    title, category: 'china',
    scale: 'year', era: era === 'BCE' ? 'BCE' : 'CE',
    year, month: null, day: null, century: null,
    sortYear: era === 'BCE' ? -year : year,
    regions: ['东亚'],
    detail, cause, process, impact,
    note: `原文补录：${timeText}`,
    location: null, tags: [],
    createdAt: new Date().toISOString(),
    lat: 23 + (Math.random() - 0.5) * 4,
    lng: 113 + (Math.random() - 0.5) * 6,
    geoSource: 'centroid:东亚',
    aspects: ['政治'],
  };
});

const all = [...existing, ...newEvents];
all.sort((a, b) => a.sortYear - b.sortYear || (a.month || 0) - (b.month || 0) || (a.day || 0) - (b.day || 0));
await writeFile(DATA_FILE, JSON.stringify(all, null, 2), 'utf8');
console.log(`新增 ${newEvents.length} 条；总 ${all.length} 条`);
