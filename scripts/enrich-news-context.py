#!/usr/bin/env python3
"""Add source-grounded Chinese context to a dated news briefing.

This is extractive: it translates a publisher's RSS description or article lead.
It never infers facts from a headline alone and never claims full-article review.
"""

from __future__ import annotations

import concurrent.futures
import html
from html.parser import HTMLParser
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path


SECTION = re.compile(r"(?m)^### (\d+)\. (.+)$")
LINK = re.compile(r"\[阅读原文\]\((https://[^)]+)\)")
RSS_LEAD = re.compile(r"(?m)^\*\*媒体导语（原文）：\*\* (.+)$")
ORIGINAL = re.compile(r"(?m)^\*\*原文标题：\*\* (.+)$")
TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
MAX_SOURCE_CHARS = 360
MAX_PAGE_BYTES = 400_000
ALLOWED_HOSTS = (
    "bbc.com", "bbc.co.uk", "theguardian.com", "aljazeera.com",
    "france24.com", "npr.org", "lemonde.fr", "abc.net.au",
    "sky.com", "xinhuanet.com", "news.cn", "aa.com.tr",
    "latimes.com", "wsj.com", "cnn.com", "nbcnews.com",
)


def allowed(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    host = (parsed.hostname or "").lower()
    return parsed.scheme == "https" and any(
        host == domain or host.endswith("." + domain) for domain in ALLOWED_HOSTS
    )


class RestrictedRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        if not allowed(newurl):
            raise ValueError("Publisher redirect left the allowed domains")
        return super().redirect_request(request, fp, code, msg, headers, newurl)


class ArticleLead(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: list[str] = []
        self.paragraphs: list[str] = []
        self._in_article = 0
        self._in_paragraph = False
        self._paragraph: list[str] = []
        self._ignored = 0

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag in ("script", "style", "nav", "footer"):
            self._ignored += 1
        if tag == "meta":
            name = (attributes.get("property") or attributes.get("name") or "").lower()
            if name in ("og:description", "description", "twitter:description"):
                self.meta.append(attributes.get("content", ""))
        if tag == "article":
            self._in_article += 1
        if tag == "p" and self._in_article and not self._ignored:
            self._in_paragraph = True
            self._paragraph = []

    def handle_endtag(self, tag):
        if tag == "p" and self._in_paragraph:
            text = clean(" ".join(self._paragraph))
            if len(text) >= 70:
                self.paragraphs.append(text)
            self._in_paragraph = False
            self._paragraph = []
        if tag == "article" and self._in_article:
            self._in_article -= 1
        if tag in ("script", "style", "nav", "footer") and self._ignored:
            self._ignored -= 1

    def handle_data(self, data):
        if self._in_paragraph and not self._ignored:
            self._paragraph.append(data)


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def useful(value: str, title: str) -> bool:
    value = clean(value)
    if len(value) < 45 or len(value) > 2_000:
        return False
    normalized = lambda text: re.sub(r"[^a-z0-9]+", "", text.lower())
    source, heading = normalized(value), normalized(title)
    if heading and (source == heading or source.startswith(heading) and len(source) < len(heading) + 35):
        return False
    return True


def article_lead(url: str, title: str) -> str:
    if not allowed(url):
        return ""
    opener = urllib.request.build_opener(RestrictedRedirect)
    request = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; RyanNewsBriefing/1.0)",
        "Accept": "text/html,application/xhtml+xml",
    })
    try:
        with opener.open(request, timeout=9) as response:
            if "html" not in response.headers.get("Content-Type", "").lower():
                return ""
            page = response.read(MAX_PAGE_BYTES).decode("utf-8", errors="replace")
        parsed = ArticleLead()
        parsed.feed(page)
        for candidate in (*parsed.meta, *parsed.paragraphs[:2]):
            if useful(candidate, title):
                return clean(candidate)[:MAX_SOURCE_CHARS]
    except Exception as error:
        print(f"Article lead unavailable ({urllib.parse.urlparse(url).hostname}): {error}", flush=True)
    return ""


def translate(value: str) -> str:
    if re.search(r"[\u3400-\u9fff]", value):
        return value
    query = urllib.parse.urlencode({
        "client": "gtx", "sl": "auto", "tl": "zh-CN", "dt": "t", "q": value,
    })
    request = urllib.request.Request(TRANSLATE_URL + "?" + query, headers={
        "User-Agent": "Mozilla/5.0 (compatible; RyanNewsBriefing/1.0)",
    })
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                payload = json.load(response)
            result = clean("".join(part[0] or "" for part in payload[0]))
            if not re.search(r"[\u3400-\u9fff]", result):
                raise ValueError("Translation did not contain Chinese text")
            return result
        except Exception:
            if attempt == 2:
                return ""
            time.sleep(1 + attempt)
    return ""


def section_context(section: str) -> tuple[str, str]:
    title = SECTION.search(section)
    link = LINK.search(section)
    original = ORIGINAL.search(section)
    if not title or not link:
        return "", ""
    source_title = original.group(1) if original else title.group(2)
    rss = RSS_LEAD.search(section)
    source = clean(rss.group(1)) if rss else ""
    if not useful(source, source_title):
        source = article_lead(link.group(1), source_title)
    if not useful(source, source_title):
        return "", ""
    return source[:MAX_SOURCE_CHARS], "媒体导语" if rss and source == clean(rss.group(1))[:MAX_SOURCE_CHARS] else "原文导语"


def enrich(section: str, source: str, provenance: str) -> tuple[str, bool]:
    section = RSS_LEAD.sub("", section)
    if "**一句话看懂：**" in section or "**内容提示：**" in section:
        return section, "**一句话看懂：**" in section
    translated = translate(source) if source else ""
    if translated:
        note = f"**一句话看懂：** {translated}（依据{provenance}机器翻译）"
    else:
        note = "**内容提示：** 原文或媒体导语暂不可读取，不能仅凭标题可靠概括。"
    link = LINK.search(section)
    if link and "/opinion/" in link.group(1):
        note = "**类型：** 评论／观点。\n\n" + note
    original = ORIGINAL.search(section)
    if original:
        position = original.end()
    else:
        heading = SECTION.search(section)
        position = heading.end() if heading else 0
    return section[:position] + "\n\n" + note + section[position:], bool(translated)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: enrich-news-context.py public/news/YYYY-MM-DD.json")
    path = Path(sys.argv[1])
    report = json.loads(path.read_text(encoding="utf-8"))
    content = report["content"]
    matches = list(SECTION.finditer(content))
    if len(matches) != report["articleCount"]:
        raise ValueError(f"Expected {report['articleCount']} numbered stories; found {len(matches)}")
    prefix = content[:matches[0].start()]
    sections = [content[match.start():matches[i + 1].start() if i + 1 < len(matches) else len(content)]
                for i, match in enumerate(matches)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        sources = list(pool.map(section_context, sections))
    complete = []
    covered = 0
    for i, (section, (source, provenance)) in enumerate(zip(sections, sources), 1):
        updated, ok = enrich(section, source, provenance)
        covered += ok
        complete.append(updated)
        if i % 20 == 0:
            print(f"Context: {i}/{len(sections)} processed, {covered} source-backed.", flush=True)
    prefix = prefix.replace(
        "未生成中文摘要或简析，也未独立核验报道内容。",
        "每条附媒体导语或原文导语的机器中译；无法读取时明确标注。未独立核验报道内容。",
    )
    report["content"] = prefix + "".join(complete)
    report["contextCount"] = covered
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Added source-backed context to {covered}/{len(sections)} stories.")


if __name__ == "__main__":
    main()

