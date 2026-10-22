#!/usr/bin/env python3
"""Translate report headlines offline while retaining each original headline."""
import json
import re
import sys
from pathlib import Path

from transformers import MarianMTModel, MarianTokenizer

HEADING = re.compile(r"(?m)^### (\d+)\. (.+)$")
CHINESE = re.compile(r"[\u3400-\u9fff]")
MODEL_ID = "Helsinki-NLP/opus-mt-en-zh"

def main() -> None:
    path = Path(sys.argv[1])
    report = json.loads(path.read_text(encoding="utf-8"))
    content = report["content"]
    if "**原文标题：**" in content:
        print("Headlines already translated; leaving report unchanged.")
        return
    headings = list(HEADING.finditer(content))
    if len(headings) != report["articleCount"]:
        raise ValueError(f"Expected {report['articleCount']} headlines, found {len(headings)}")
    originals = [m.group(2).strip() for m in headings]
    tokenizer = MarianTokenizer.from_pretrained(MODEL_ID)
    model = MarianMTModel.from_pretrained(MODEL_ID)
    translations = []
    for start in range(0, len(originals), 12):
        batch = originals[start:start + 12]
        inputs = tokenizer([">>cmn_Hans<< " + title for title in batch], return_tensors="pt", padding=True, truncation=True, max_length=128)
        output = model.generate(**inputs, max_new_tokens=96, num_beams=3)
        translations.extend(tokenizer.batch_decode(output, skip_special_tokens=True))
        print(f"Translated {len(translations)}/{len(originals)} headlines", flush=True)
    replacements = {}
    for match, original, chinese in zip(headings, originals, translations):
        chinese = chinese.replace("\n", " ").strip()
        if not CHINESE.search(chinese):
            raise ValueError(f"Translation failed for headline {match.group(1)}: {original}")
        replacements[match.group(1)] = (chinese, original)
    def replace(match):
        chinese, original = replacements[match.group(1)]
        return f"### {match.group(1)}. {chinese}\n\n**原文标题：** {original}"
    content = HEADING.sub(replace, content)
    content = content.replace(
        "以下为媒体官方RSS所列原文标题；未生成中文摘要或简析，也未独立核验报道内容。",
        "中文标题由离线机器翻译生成，并保留原文标题供对照；未生成中文摘要或简析，也未独立核验报道内容。",
    )
    if content.count("**原文标题：**") != report["articleCount"]:
        raise ValueError("Original headline preservation check failed")
    report["content"] = content
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Translated {len(headings)} headlines into Chinese")

if __name__ == "__main__":
    main()
