#!/usr/bin/env python3
# 生成《人类历史纲要时间轴》V2 docx：整合全部 577 条事件（含时间轴4新增95条）
# 分六编（沿用 V1 结构），编内按时间排序，"——详情"对齐数据库 detail，校勘注以【校注】呈现
import json, sys
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

BASE = "/Users/tristan/Library/Mobile Documents/com~apple~CloudDocs/Corp AI/Timeline"
events = json.load(open(f"{BASE}/data/events.json", encoding="utf8"))

# —— 分编边界（按 sortYear）——
SECTIONS = [
    ("第一编 史前与上古文明（远古—公元5世纪）", -10**9, 500),
    ("第二编 中古文明（5—15世纪）", 500, 1500),
    ("第三编 走向近代（15—18世纪中期）", 1500, 1760),
    ("第四编 近代世界（工业革命—一战）", 1760, 1913),
    ("第五编 战争与革命（一战—二战）", 1913, 1945),
    ("第六编 当代世界（二战后至今）", 1945, 10**9),
]

def fmt_time(ev):
    y = ev["year"]
    era = "公元前" if ev["era"] == "BCE" else ""
    if ev["scale"] == "century":
        return f"{era}{y}世纪"
    s = f"{era}{y}年"
    if ev.get("month"):
        s += f"{ev['month']}月"
        if ev.get("day"):
            s += f"{ev['day']}日"
    return s

def cat_label(ev):
    return {"china": "中国", "world": "世界", "other": ""}.get(ev.get("category"), "")

doc = Document()
# 全局字体
style = doc.styles["Normal"]
style.font.name = "Times New Roman"
style.font.size = Pt(11)
from docx.oxml.ns import qn
style.element.rPr.rFonts.set(qn("w:eastAsia"), "宋体")

t = doc.add_paragraph("人类历史纲要时间轴", style="Title")
sub = doc.add_paragraph()
r = sub.add_run(f"整合自《高中历史时间轴》《世界史时间轴2》《二战后世界史时间轴3》《时间轴4》四份笔记 · 共{len(events)}条事件 · 按时间先后统一排序 · V2")
r.font.size = Pt(10); r.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
p = doc.add_paragraph("说明：本纲要为中国史与世界史的统一时间轴，同一年代下中外事件并列呈现，便于横向对照复习。事件按政治、经济、文化三类标注归属；原文中的时间讹误已作史实校勘，以【校注】标示。")
p.runs[0].font.size = Pt(10)
doc.add_paragraph()

for name, lo, hi in SECTIONS:
    sec = [e for e in events if lo <= e["sortYear"] < hi]
    if not sec:
        continue
    doc.add_heading(name, level=1)
    sec.sort(key=lambda e: (e["sortYear"], e.get("month") or 0, e.get("day") or 0))
    for ev in sec:
        para = doc.add_paragraph()
        # 时间
        r1 = para.add_run(fmt_time(ev) + "　")
        r1.bold = True
        # 类别标签
        cl = cat_label(ev)
        if cl:
            r2 = para.add_run(f"【{cl}】")
            r2.font.color.rgb = RGBColor(0x1F, 0x6F, 0xB5) if cl == "中国" else RGBColor(0x8A, 0x5A, 0x00)
        # 标题
        r3 = para.add_run(ev["title"] + "　—— ")
        r3.bold = True
        # 详情
        para.add_run(ev.get("detail") or "")
        # 校注
        note = ev.get("note")
        if note:
            rn = para.add_run(f"（校注：{note}）")
            rn.font.size = Pt(9)
            rn.font.color.rgb = RGBColor(0x88, 0x88, 0x88)
            rn.italic = True

out = f"{BASE}/人类历史纲要时间轴-V2.docx"
doc.save(out)
print(f"生成 {out}")
print(f"共 {len(events)} 条事件，六编覆盖：", sum(1 for _ in SECTIONS))
