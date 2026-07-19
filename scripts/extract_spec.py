# -*- coding: utf-8 -*-
"""公共建築工事標準仕様書（建築工事編）PDF から章/節/項の構造化JSONを生成する。

使い方:
    python scripts/extract_spec.py <PDFパス> <出力JSONパス>

項見出しは「章.節.項」の連番整合性（現在の章・節に一致し、項番号が直前+1）で
本文中の条項参照（例: 行頭の「1.1.8 による」）と区別する。
"""
import json
import re
import sys
from datetime import datetime, timezone

from pypdf import PdfReader

FOOTER_LINES = {
    "公共建築工事標準仕様書（建築工事編）令和７年版",
    "国土交通省大臣官房官庁営繕部",
}

CHAP_RE = re.compile(r"^\s*([０-９0-9]+)\s*章\s+(\S.*)$")
SEC_RE = re.compile(r"^\s*([０-９0-9]+)\s*節\s+(\S.*)$")
ITEM_RE = re.compile(r"^\s*(\d{1,2})\.(\d{1,2})\.(\d{1,2})\s+(\S.*)$")
Z2H = str.maketrans("０１２３４５６７８９", "0123456789")


def to_int(s: str) -> int:
    return int(s.translate(Z2H))


def clean_line(line: str) -> str:
    return line.replace("　", " ").rstrip()


def is_footer(line: str) -> bool:
    s = line.strip()
    if not s:
        return True
    if s in FOOTER_LINES:
        return True
    if re.fullmatch(r"\d{1,3}", s):  # ページ番号
        return True
    return False


def extract(pdf_path: str):
    reader = PdfReader(pdf_path)
    chapters = []  # [{num, title, sections: [{num, title, items: [...]}]}]
    cur_ch = None
    cur_sec = None
    cur_item = None

    for pi in range(6, len(reader.pages)):  # 本文は7ページ目から
        text = reader.pages[pi].extract_text() or ""
        for raw in text.splitlines():
            line = clean_line(raw)
            if is_footer(line):
                continue

            m = CHAP_RE.match(line)
            if m:
                num = to_int(m.group(1))
                title = m.group(2).strip()
                expected = chapters[-1]["num"] + 1 if chapters else 1
                if num == expected and not title.startswith(("［", "[")):
                    cur_ch = {"num": num, "title": title, "sections": []}
                    chapters.append(cur_ch)
                    cur_sec = None
                    cur_item = None
                    continue

            if cur_ch is not None:
                m = SEC_RE.match(line)
                if m:
                    num = to_int(m.group(1))
                    title = m.group(2).strip()
                    expected = (
                        cur_ch["sections"][-1]["num"] + 1
                        if cur_ch["sections"]
                        else 1
                    )
                    if num == expected:
                        cur_sec = {"num": num, "title": title, "items": []}
                        cur_ch["sections"].append(cur_sec)
                        cur_item = None
                        continue

            if cur_ch is not None and cur_sec is not None:
                m = ITEM_RE.match(line)
                if m:
                    ch, sec, it = int(m.group(1)), int(m.group(2)), int(m.group(3))
                    title = m.group(4).strip()
                    expected = (
                        cur_sec["items"][-1]["num"] + 1 if cur_sec["items"] else 1
                    )
                    if ch == cur_ch["num"] and sec == cur_sec["num"] and it == expected:
                        cur_item = {"num": it, "title": title, "lines": []}
                        cur_sec["items"].append(cur_item)
                        continue

            if cur_item is not None:
                cur_item["lines"].append(line)
            # 章扉〜1節の前、節見出し〜最初の項の前のテキストは捨てる
            # （目次的な行・節共通の前置きはほぼ無いため）

    return chapters


def build_index(chapters):
    categories = []
    details = []
    for ch in chapters:
        ch_name = f"{ch['num']}章 {ch['title']}"
        ch_node = {
            "id": f"cat_{ch['num']:02d}",
            "name": ch_name,
            "count": 0,
            "children": [],
        }
        for sec in ch["sections"]:
            sec_name = f"{sec['num']}節 {sec['title']}"
            sec_node = {
                "id": f"cat_{ch['num']:02d}_{sec['num']:02d}",
                "name": sec_name,
                "count": len(sec["items"]),
                "children": [],
            }
            ch_node["children"].append(sec_node)
            ch_node["count"] += len(sec["items"])
            for it in sec["items"]:
                number = f"{ch['num']}.{sec['num']}.{it['num']}"
                original = "\n".join(it["lines"]).strip()
                details.append(
                    {
                        "id": number,
                        "number": number,
                        "title": it["title"],
                        "categoryPath": [ch_name, sec_name],
                        "original": original,
                        "tags": [],
                    }
                )
        categories.append(ch_node)

    return {
        "version": "2.0.0",
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "公共建築工事標準仕様書（建築工事編）令和7年版（国土交通省）",
        "categories": categories,
        "details": details,
    }


def main():
    pdf_path, out_path = sys.argv[1], sys.argv[2]
    chapters = extract(pdf_path)
    index = build_index(chapters)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=1)
    n_items = len(index["details"])
    print(f"chapters={len(chapters)} items={n_items}")
    for ch in chapters:
        secs = ", ".join(
            f"{s['num']}節({len(s['items'])})" for s in ch["sections"]
        )
        print(f"  {ch['num']}章 {ch['title']}: {secs}")


if __name__ == "__main__":
    main()
