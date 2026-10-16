#!/usr/bin/env node
// 重建全部事件详情（以标题为键，彻底修复 id 错位问题）
// 分三部分：中国史古代 / 中国史近现代 / 世界史
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DETAILS_A } from './details-ancient.js';
import { DETAILS_B } from './details-modern.js';
import { DETAILS_C } from './details-world.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'events.json');

const MAP = { ...DETAILS_A, ...DETAILS_B, ...DETAILS_C };

const events = JSON.parse(await readFile(DATA_FILE, 'utf8'));
const missing = [];
let n = 0;
for (const ev of events) {
  if (MAP[ev.title]) { ev.detail = MAP[ev.title]; n++; }
  else missing.push(ev.title);
}
await writeFile(DATA_FILE, JSON.stringify(events, null, 2), 'utf8');
console.log(`按标题重建详情 ${n}/${events.length} 条`);
if (missing.length) console.log('缺失标题：\n' + missing.join('\n'));
