# 📜 人类历史纲要时间轴 / China Senior History Timeline

一个面向高中历史复习的时间轴应用：**754 条**中外史事，含简介、原因、过程、影响四段内容，支持时间轴总表、朝代分期、地图模式与政治/经济/文化分类浏览。

## ✨ 功能

| 页面 | 说明 |
|---|---|
| `/` 总表 | 统一时间排序，中国史/世界史筛选，关键词搜索 |
| `/dynasty` 朝代分期 | 中国 22 朝代 Tab + 西方 8 分期 Tab，横向切换浏览 |
| `/map` 地图模式 | 事件地理编码落点世界地图（worldmap.jpg） |
| `/aspect/:type` 三分类 | 经济 / 政治 / 文化 分栏浏览 |

- **悬停卡片**：每条事件悬停弹出卡片，显示简介/原因/过程/影响/地点/校注
- **编辑器**：单条编辑（含二期三字段）、批量导入、导出 JSON
- **macOS App**：SwiftUI + WKWebView 壳 + 内嵌 HTTP 服务器（零依赖）

## 🗂️ 数据规模

- 总事件 **754 条**（中国 300+ / 世界 450+）
- 时间跨度：约前170万年（元谋人）— 2020年
- 每条含：时间、分类、地区、经纬度、简介、**原因/过程/影响**、aspects（政治/经济/文化）
- 最新完整版文档：[人类历史纲要时间轴-V12.docx](./人类历史纲要时间轴-V12.docx)

## 🚀 运行

### Web 版（Node）

```bash
npm start          # node server.js，访问 http://127.0.0.1:3210
```

### macOS App（Swift）

```bash
cd macos/SwiftTimeline
swift build -c release
# 或用 Xcode 打开 Package.swift 构建；数据在 ~/Library/Application Support/SwiftTimeline/
```

## 📁 结构

```
├── server.js            # Node HTTP 服务器（静态资源 + REST API）
├── timemap.js           # 非线性时间映射（事件密度分配刻度）
├── data/
│   ├── events.json      # 754 条事件主数据库
│   └── timemap.json     # 时间轴坐标映射表
├── public/              # 前端（原生 JS/CSS，无框架）
│   ├── index.html / app.js          # 总表
│   ├── dynasty.html / dynasty.js    # 朝代分期
│   ├── map.html / map.js            # 地图
│   └── aspect.html / aspect.js      # 三分类
├── macos/SwiftTimeline/ # SwiftUI macOS app（WKWebView + 内嵌服务器）
├── import-*.js          # 各批次数据导入脚本（历史记录）
├── phase2-b*.js         # 二期"原因/过程/影响"批量撰写脚本
├── add-ex*.js           # 朝代补充条目脚本
└── *.docx               # 纲要文档（V12 为最新）
```

## 📖 数据演进

1. **高中历史时间轴** → OCR 导入（中国史，史前—2011）
2. **世界史时间轴2** → OCR 导入（古代文明—二战）
3. **二战后世界史时间轴3** → OCR 导入（1945-2015）
4. **时间轴4**（手写笔记）→ 95 条政治法律专题
5. **经济文化**（手写笔记）→ 78 条经济社会专题
6. **马可·波罗**等单条补充
7. **朝代制度典籍补充**（ex_—ex7_ 脚本，54 条）：商周秦汉隋唐宋元明清制度、思想、科技、文艺
8. **二期**：全部事件补齐原因/过程/影响

## 📄 License

仅供个人学习复习使用。
