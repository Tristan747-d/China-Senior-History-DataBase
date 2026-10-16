#!/usr/bin/env node
// 灌入历史大事件初始数据（人教版/部编版高中历史核心考点）
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'events.json');

// [category, scale, era, year(或世纪数字), month, day, title, location, note]
const rows = [
  // ===== 中国史 古代 =====
  ['china','year','BCE',2070,null,null,'夏朝建立','中原','中国王朝开端，世袭制代替禅让制'],
  ['china','year','BCE',1600,null,null,'商朝建立','殷墟一带','甲骨文、青铜器'],
  ['china','year','BCE',1046,null,null,'西周建立（牧野之战）','镐京','分封制、宗法制'],
  ['china','year','BCE',771,null,null,'西周灭亡','镐京','犬戎攻破镐京'],
  ['china','year','BCE',770,null,null,'东周开始（春秋时期）','洛邑','王室衰微，诸侯争霸'],
  ['china','year','BCE',475,null,null,'战国时期开始','中原','七雄并立，变法图强'],
  ['china','year','BCE',356,null,null,'商鞅变法开始','秦国','废井田、奖励耕战，中央集权奠基'],
  ['china','year','BCE',221,null,null,'秦统一六国','咸阳','首个统一多民族中央集权封建国家'],
  ['china','year','BCE',202,null,null,'西汉建立（刘邦称帝）','长安','休养生息'],
  ['china','year','BCE',138,null,null,'张骞首次出使西域','长安→西域','丝绸之路开通'],
  ['china','year','CE',220,null,null,'东汉灭亡，三国开始','洛阳','黄巾起义后汉室名存实亡'],
  ['china','year','CE',266,null,null,'西晋建立','洛阳','司马炎代魏'],
  ['china','year','CE',317,null,null,'东晋建立','建康','衣冠南渡'],
  ['china','year','CE',420,null,null,'南北朝时期开始','建康','刘裕代晋，南朝开始'],
  ['china','year','CE',581,null,null,'隋朝建立','长安','杨坚代周'],
  ['china','year','CE',618,null,null,'唐朝建立','长安','李渊称帝'],
  ['china','year','CE',627,null,null,'贞观之治开始','长安','唐太宗李世民'],
  ['china','year','CE',755,null,null,'安史之乱爆发','范阳','唐由盛转衰'],
  ['china','year','CE',960,null,null,'北宋建立（陈桥兵变）','开封','赵匡胤称帝，重文轻武'],
  ['china','year','CE',1069,null,null,'王安石变法开始','开封','富国强兵'],
  ['china','year','CE',1127,null,null,'靖康之变，南宋开始','临安（杭州）','北宋灭亡，宋室南迁'],
  ['china','year','CE',1271,null,null,'元朝建立','大都（北京）','忽必烈定国号大元'],
  ['china','year','CE',1368,null,null,'明朝建立','应天府（南京）','朱元璋称帝，元朝北退'],
  ['china','year','CE',1405,null,null,'郑和首次下西洋','刘家港→西洋','世界航海史壮举'],
  ['china','year','CE',1644,null,null,'清军入关','北京','明朝灭亡，李自成起义失败'],
  ['china','year','CE',1723,null,null,'雍正帝即位，摊丁入亩推行','北京','人口迅速增长'],
  // ===== 中国史 近现代 =====
  ['china','date','CE',1840,6,null,'鸦片战争爆发','广州虎门','中国近代史开端，开始沦为半殖民地半封建社会'],
  ['china','year','CE',1842,null,null,'《南京条约》签订','南京','中国近代第一个不平等条约'],
  ['china','date','CE',1851,1,11,'金田起义','广西桂平','太平天国运动开始'],
  ['china','year','CE',1856,null,null,'第二次鸦片战争爆发','广州','英法联军'],
  ['china','year','CE',1861,null,null,'洋务运动开始','安庆','自强求富，近代化尝试'],
  ['china','year','CE',1894,null,null,'甲午战争爆发','黄海','洋务运动破产'],
  ['china','date','CE',1898,6,11,'戊戌变法开始','北京','百日维新'],
  ['china','year','CE',1900,null,null,'八国联军侵华','天津、北京','《辛丑条约》后完全沦为半殖民地'],
  ['china','date','CE',1911,10,10,'武昌起义','武昌','辛亥革命爆发'],
  ['china','date','CE',1912,1,1,'中华民国成立','南京','清帝退位，两千余年帝制终结'],
  ['china','date','CE',1915,9,15,'新文化运动开始（陈独秀创办《青年杂志》）','上海','民主与科学'],
  ['china','date','CE',1919,5,4,'五四运动','北京','新民主主义革命开端'],
  ['china','date','CE',1921,7,23,'中国共产党成立','上海（后转嘉兴南湖）','开天辟地大事变'],
  ['china','date','CE',1927,8,1,'南昌起义','南昌','武装反抗国民党第一枪'],
  ['china','date','CE',1934,10,null,'红军长征开始','江西瑞金','战略转移'],
  ['china','date','CE',1935,1,null,'遵义会议','遵义','生死攸关的转折点'],
  ['china','date','CE',1936,12,12,'西安事变','西安','抗日民族统一战线初步形成'],
  ['china','date','CE',1937,7,7,'卢沟桥事变（全面抗战爆发）','北平','全民族抗战开始'],
  ['china','date','CE',1945,8,15,'日本宣布无条件投降','东京','抗战胜利'],
  ['china','date','CE',1946,6,null,'全面内战爆发','中原','解放战争开始'],
  ['china','date','CE',1949,10,1,'中华人民共和国成立','北京（天安门）','中国人民站起来了'],
  ['china','date','CE',1950,10,null,'抗美援朝战争开始','鸭绿江','保家卫国'],
  ['china','year','CE',1953,null,null,'第一个五年计划开始','全国','工业化起步'],
  ['china','year','CE',1956,null,null,'三大改造基本完成','全国','社会主义制度基本确立'],
  ['china','date','CE',1978,12,18,'十一届三中全会','北京','改革开放的开端'],
  ['china','year','CE',1992,null,null,'邓小平南方谈话','深圳等','确立社会主义市场经济体制目标'],
  ['china','date','CE',1997,7,1,'香港回归','香港','一国两制实践'],
  ['china','date','CE',1999,12,20,'澳门回归','澳门','一国两制实践'],
  ['china','date','CE',2001,12,11,'中国加入世界贸易组织（WTO）','日内瓦','融入经济全球化'],
  // ===== 世界史 =====
  ['world','century','BCE',18,null,null,'《汉谟拉比法典》','古巴比伦','迄今已知最早的较为完整成文法典'],
  ['world','year','BCE',594,null,null,'梭伦改革','雅典','雅典民主政治奠基'],
  ['world','year','BCE',509,null,null,'罗马共和国建立','罗马','贵族共和制'],
  ['world','year','BCE',221,null,null,'秦朝建立时，罗马正与迦太基进行第二次布匿战争','地中海','世界横向对照'],
  ['world','year','CE',476,null,null,'西罗马帝国灭亡','罗马','欧洲古代史终结、中古史开端'],
  ['world','year','CE',622,null,null,'穆罕默德迁往麦地那（伊斯兰教历元年）','麦地那','伊斯兰教创立'],
  ['world','year','CE',1066,null,null,'诺曼征服','英格兰','英国封建化加速'],
  ['world','year','CE',1096,null,null,'十字军东征开始','欧洲→中东','宗教战争'],
  ['world','year','CE',1215,null,null,'《大宪章》签署','英国','王权受限，议会传统渊源'],
  ['world','century','CE',14,null,null,'文艺复兴兴起','意大利（佛罗伦萨）','人文主义'],
  ['world','year','CE',1453,null,null,'拜占庭帝国灭亡','君士坦丁堡','奥斯曼帝国攻陷'],
  ['world','year','CE',1487,null,null,'迪亚士到达好望角','非洲南端','新航路开辟'],
  ['world','year','CE',1492,null,null,'哥伦布到达美洲','加勒比海','世界市场雏形出现'],
  ['world','year','CE',1517,null,null,'马丁·路德发表《九十五条论纲》','德意志维滕贝格','宗教改革开始'],
  ['world','year','CE',1588,null,null,'英国击败西班牙无敌舰队','英吉利海峡','海上霸权转移'],
  ['world','date','CE',1640,4,null,'英国资产阶级革命开始','伦敦','长期议会召开'],
  ['world','year','CE',1687,null,null,'牛顿发表《自然哲学的数学原理》','英国','经典力学体系建立'],
  ['world','year','CE',1689,null,null,'《权利法案》颁布','英国','君主立宪制确立'],
  ['world','date','CE',1775,4,19,'莱克星顿枪声','北美','美国独立战争爆发'],
  ['world','date','CE',1776,7,4,'《独立宣言》发表','费城','美国立国文献'],
  ['world','date','CE',1789,7,14,'攻占巴士底狱','巴黎','法国大革命爆发'],
  ['world','year','CE',1804,null,null,'海地独立','海地','第一个独立黑人共和国'],
  ['world','year','CE',1848,null,null,'《共产党宣言》发表','伦敦','马克思主义诞生'],
  ['world','year','CE',1861,null,null,'俄国农奴制改革','俄国','走上资本主义道路'],
  ['world','date','CE',1861,4,12,'美国南北战争爆发','萨姆特堡','维护统一，废除奴隶制'],
  ['world','year','CE',1868,null,null,'明治维新开始','日本','脱亚入欧，近代化改革'],
  ['world','year','CE',1871,null,null,'德意志帝国统一','凡尔赛','俾斯麦，容克资产阶级帝國'],
  ['world','date','CE',1914,7,28,'第一次世界大战爆发','萨拉热窝事件后','帝国主义战争'],
  ['world','date','CE',1917,11,7,'俄国十月革命','彼得格勒','第一个社会主义国家'],
  ['world','date','CE',1919,1,18,'巴黎和会召开','巴黎','凡尔赛体系'],
  ['world','date','CE',1929,10,24,'资本主义世界经济大危机爆发（黑色星期四）','纽约','大萧条'],
  ['world','year','CE',1933,null,null,'罗斯福新政开始','美国','国家干预经济'],
  ['world','date','CE',1939,9,1,'德国闪击波兰','波兰','第二次世界大战全面爆发'],
  ['world','date','CE',1941,6,22,'德国入侵苏联','苏德边境','苏德战争爆发'],
  ['world','date','CE',1941,12,7,'珍珠港事件','夏威夷','太平洋战争爆发'],
  ['world','date','CE',1944,6,6,'诺曼底登陆','法国诺曼底','第二战场开辟'],
  ['world','date','CE',1945,5,8,'德国无条件投降','柏林','欧洲战事结束'],
  ['world','date','CE',1945,9,2,'日本签署投降书','东京湾密苏里号','二战结束'],
  ['world','year','CE',1947,null,null,'杜鲁门主义出台','美国','冷战开始'],
  ['world','year','CE',1949,null,null,'北约成立','华盛顿','冷战军事集团'],
  ['world','year','CE',1955,null,null,'万隆会议召开','印度尼西亚','亚非团结，不结盟运动前奏'],
  ['world','year','CE',1962,null,null,'古巴导弹危机','古巴','冷战最高潮'],
  ['world','year','CE',1991,null,null,'苏联解体','莫斯科','冷战结束，两极格局瓦解'],
  ['world','year','CE',1993,null,null,'欧洲联盟成立','马斯特里赫特','欧洲一体化'],
  ['world','year','CE',2001,null,null,'9·11 恐怖袭击','纽约','反恐战争开始'],
];

await mkdir(path.dirname(DATA_FILE), { recursive: true });
let existing = [];
try { existing = JSON.parse(await readFile(DATA_FILE, 'utf8')); } catch {}
if (existing.length) {
  console.log(`已有 ${existing.length} 条数据，跳过灌入（如需重灌请先清空）。`);
  process.exit(0);
}

function buildEv(r, i) {
  const [category, scale, era, year, month, day, title, location, note] = r;
  const ev = { id: `seed_${i}`, title, category, scale, era, year, month, day, location, note, tags: [], createdAt: new Date().toISOString() };
  if (scale === 'century') {
    ev.century = year;
    ev.sortYear = era === 'BCE' ? -((year - 1) * 100 + 50) : (year - 1) * 100 + 50;
    ev.month = null; ev.day = null;
  } else {
    ev.century = null;
    ev.sortYear = era === 'BCE' ? -year : year;
  }
  return ev;
}

const events = rows.map(buildEv);
events.sort((a, b) => a.sortYear - b.sortYear);
await writeFile(DATA_FILE, JSON.stringify(events, null, 2), 'utf8');
console.log(`已灌入 ${events.length} 条历史大事件 ✓`);
