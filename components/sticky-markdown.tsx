import { Fragment, type ReactNode } from 'react';
import { safeStickyUrl } from '@/lib/sticky-notes';

// Deliberately small Markdown renderer: React escapes text; raw HTML is never injected.
function inline(text: string): ReactNode[] {
  return text
    .split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g)
    .map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={i}>{part.slice(1, -1)}</code>;
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i}>{part.slice(1, -1)}</em>;
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      const href = link && safeStickyUrl(link[2]);
      if (link && href)
        return (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer">
            {link[1]}
          </a>
        );
      return <Fragment key={i}>{part}</Fragment>;
    });
}
function lines(text: string) {
  let code = false;
  return (
    <div className="sticky-markdown">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('```')) {
          code = !code;
          return null;
        }
        if (code) return <pre key={i}>{line || ' '}</pre>;
        const heading = /^(#{1,3})\s+(.+)$/.exec(line);
        if (heading)
          return (
            <div
              key={i}
              className={`sticky-heading sticky-h${heading[1].length}`}
            >
              {inline(heading[2])}
            </div>
          );
        const list = /^(?:[-*]|\d+\.)\s+(.+)$/.exec(line);
        if (list)
          return (
            <div key={i} className="sticky-list-line">
              • {inline(list[1])}
            </div>
          );
        return <p key={i}>{line ? inline(line) : <br />}</p>;
      })}
    </div>
  );
}

export function StickyMarkdown({ text }: { text: string }) {
  return lines(text);
}
