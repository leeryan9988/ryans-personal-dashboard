#!/usr/bin/env python3
"""Translate news headlines into Chinese while preserving the original titles."""
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

HEADING = re.compile(r"(?m)^### (\d+)\. (.+)$")
CHINESE = re.compile(r"[\u3400-\u9fff]")
TRANSLATE_URLS = (
    "https://translate.googleapis.com/translate_a/single",
    "https://translate.google.com/translate_a/single",
)
DISABLED_TRANSLATION_HOSTS: set[str] = set()
FALLBACK_PREFIX = "中文标题暂缺｜"

def clarify_ambiguous_terms(title: str) -> str:
    """Give the translator context for terms with common misleading literal meanings."""
    replacements = (
        (r"\bkeffiyehs?\b", "Palestinian keffiyeh headscarves"),
        (r"\bgovernment U-turn\b", "reversal of the government's previous policy"),
        (r"\bcloudier footage\b", "less polished camera footage"),
        (r"\btanker strike\b", "attack on an oil tanker"),
    )
    for pattern, clearer in replacements:
        title = re.sub(pattern, clearer, title, flags=re.I)
    return title


def translate(title: str) -> str:
    if CHINESE.search(title):
        return title
    query_title = clarify_ambiguous_terms(re.sub(r"\bRSF\b", "Sudan Rapid Support Forces (RSF)", title))
    query = urllib.parse.urlencode({"client": "gtx", "sl": "en", "tl": "zh-CN", "dt": "t", "q": query_title})
    for endpoint in TRANSLATE_URLS:
        if endpoint in DISABLED_TRANSLATION_HOSTS:
            continue
        request = urllib.request.Request(
            endpoint + "?" + query,
            headers={"User-Agent": "Mozilla/5.0 (compatible; RyanNewsBriefing/1.0)"},
        )
        for attempt in range(2):
            try:
                with urllib.request.urlopen(request, timeout=15) as response:
                    payload = json.load(response)
                result = "".join(part[0] or "" for part in payload[0]).replace("\n", " ").strip()
                if CHINESE.search(result):
                    return result
                raise ValueError("Translation response did not contain Chinese text")
            except urllib.error.HTTPError as error:
                if error.code == 429:
                    DISABLED_TRANSLATION_HOSTS.add(endpoint)
                    print(f"Translation host rate limited: {urllib.parse.urlparse(endpoint).hostname}", flush=True)
                    break
                if attempt:
                    DISABLED_TRANSLATION_HOSTS.add(endpoint)
                    break
                time.sleep(2)
            except Exception:
                if attempt:
                    DISABLED_TRANSLATION_HOSTS.add(endpoint)
                    break
                time.sleep(2)
    return FALLBACK_PREFIX + title

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
    translations = {}
    fallback_count = 0
    for match in headings:
        original = match.group(2).strip()
        chinese = translate(original)
        fallback_count += chinese.startswith(FALLBACK_PREFIX)
        translations[match.group(1)] = (chinese, original)
        if len(translations) % 20 == 0:
            print(f"Translated {len(translations)}/{len(headings)} headlines", flush=True)
        time.sleep(0.1)
    def replace(match):
        chinese, original = translations[match.group(1)]
        return f"### {match.group(1)}. {chinese}\n\n**原文标题：** {original}"
    content = HEADING.sub(replace, content)
    content = content.replace(
        "以下为媒体官方RSS所列原文标题；未生成中文摘要或简析，也未独立核验报道内容。",
        "中文标题尽可能由机器翻译生成；翻译服务不可用的条目保留原题并标注。原文标题供对照；未生成中文摘要或简析，也未独立核验报道内容。",
    )
    if content.count("**原文标题：**") != report["articleCount"]:
        raise ValueError("Original headline preservation check failed")
    report["content"] = content
    report["translationFallbackCount"] = fallback_count
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Processed {len(headings)} headlines; {fallback_count} retained the original after translation limits.")

if __name__ == "__main__":
    main()
