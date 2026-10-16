#!/usr/bin/env node
// 计算非线性时间轴映射：按事件密度分配刻度位置
// 输出 data/timemap.json: { points: [{year, pos}], minYear, maxYear }
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'events.json');
const OUT = path.join(__dirname, 'data', 'timemap.json');

const events = JSON.parse(await readFile(DATA_FILE, 'utf8'));
const years = events.map(e => e.sortYear).sort((a, b) => a - b);

// 分位数映射：事件两侧各留 2% 空白，位置 = 分位数 * 0.96 + 0.02
// points[i] = 第 i 个事件年份 → pos ∈ [0,1]
const n = years.length;
const points = years.map((y, i) => ({ year: y, pos: 0.02 + (i / (n - 1)) * 0.96 }));

// 去重（同一年多条取第一个 pos）
const dedup = [];
for (const p of points) {
  if (dedup.length && dedup[dedup.length - 1].year === p.year) continue;
  dedup.push(p);
}

await writeFile(OUT, JSON.stringify({
  minYear: years[0],
  maxYear: years[n - 1],
  total: n,
  points: dedup,
}, null, 2));

console.log(`时间映射表：${dedup.length} 个唯一年份（共 ${n} 条事件）`);
console.log('首 5:', dedup.slice(0, 5).map(p => `${p.year}→${p.pos.toFixed(3)}`));
console.log('末 5:', dedup.slice(-5).map(p => `${p.year}→${p.pos.toFixed(3)}`));
console.log(`前 10% 事件覆盖年份 ${years[0]} ~ ${years[Math.floor(n * 0.1)]}`);
