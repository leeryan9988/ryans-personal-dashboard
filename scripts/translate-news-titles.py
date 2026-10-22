#!/usr/bin/env python3
"""Translate report headlines offline while retaining each original headline."""
import json
import re
import sys
from pathlib import Path

import argostranslate.package
import argostranslate.translate

HEADING = re.compile(r"(?m)^### (\d+)\. (.+)$")
CHINESE = re.compile(r"[\u3400-\u9fff]")
MODEL_URLS = [
    "https://argos-net.com/v1/translate-en_zh-1_9.argosmodel",
    "https://argosopentech.nyc3.digitaloceanspaces.com/argospm/translate-en_zh-1_1.argosmodel",
    "https://cdn.argosopentech.io/translate-en_zh-1_1.argosmodel",
]

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
    import tempfile
    import urllib.request
    with tempfile.TemporaryDirectory() as directory:
        model = Path(directory) / "translate-en_zh-1_9.argosmodel"
        for url in MODEL_URLS:
            try:
                urllib.request.urlretrieve(url, model)
                argostranslate.package.install_from_path(str(model))
                break
            except Exception as error:
                print(f"Translation model download failed from {url}: {error}", file=sys.stderr)
        else:
            raise RuntimeError("Unable to install English-Chinese translation model")
    translations = {}
    for match in headings:
        original = match.group(2).strip()
        chinese = original if CHINESE.search(original) else argostranslate.translate.translate(original, "en", "zh").replace("\n", " ").strip()
        if not CHINESE.search(chinese):
            raise ValueError(f"Translation failed for headline {match.group(1)}: {original}")
        translations[match.group(1)] = (chinese, original)
    def replace(match):
        chinese, original = translations[match.group(1)]
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
