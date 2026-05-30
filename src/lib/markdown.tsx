import { Fragment, type ReactNode } from "react";

const UL_PREFIX = /^\s*[-*]\s+/;
const OL_PREFIX = /^\s*\d+\.\s+/;

export function Markdown({ text, className }: { text: string; className?: string }) {
  return <div className={className}>{renderBlocks(text)}</div>;
}

function renderBlocks(text: string): ReactNode[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const blocks = normalized.split(/\n{2,}/);
  const out: ReactNode[] = [];

  blocks.forEach((block, i) => {
    const lines = block.split("\n");
    const ulItems = parseListItems(lines, UL_PREFIX);
    if (ulItems) {
      out.push(
        <ul key={i} className="my-2 list-disc space-y-1 pl-5">
          {ulItems.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      return;
    }
    const olItems = parseListItems(lines, OL_PREFIX);
    if (olItems) {
      out.push(
        <ol key={i} className="my-2 list-decimal space-y-1 pl-5">
          {olItems.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      return;
    }
    out.push(
      <p key={i} className="leading-relaxed [&:not(:first-child)]:mt-3">
        {lines.map((l, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {renderInline(l)}
          </Fragment>
        ))}
      </p>
    );
  });

  return out;
}

// A list block starts with a bullet on the first non-empty line. Subsequent
// non-bullet lines that are indented or continuation of a wrapped item are
// folded into the previous item. Any other line aborts the list parse.
function parseListItems(lines: string[], prefix: RegExp): string[] | null {
  if (lines.length === 0 || !prefix.test(lines[0])) return null;
  const items: string[] = [];
  for (const line of lines) {
    if (prefix.test(line)) {
      items.push(line.replace(prefix, ""));
    } else if (items.length > 0 && line.trim().length > 0) {
      items[items.length - 1] += " " + line.trim();
    } else if (line.trim().length === 0) {
      // blank line tolerated within a list block (rare with our splitter)
      continue;
    } else {
      return null;
    }
  }
  return items.length > 0 ? items : null;
}

// Inline parsing. Emphasis/strong require a non-word boundary before the
// opening marker and a non-word character (or end-of-string) after the
// closing marker, AND the content must not start or end with whitespace —
// so `attendee_id` and `2 * x * 3` no longer get partially italicised.
const INLINE_RE =
  /\*\*(\S(?:[^*\n]*?\S)?)\*\*|`([^`\n]+)`|(^|[^A-Za-z0-9])\*(\S(?:[^*\n]*?\S)?)\*(?![A-Za-z0-9])|(^|[^A-Za-z0-9])_(\S(?:[^_\n]*?\S)?)_(?![A-Za-z0-9])/g;

function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  INLINE_RE.lastIndex = 0;

  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    if (m[1] !== undefined) {
      parts.push(<strong key={key++} className="font-semibold">{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      parts.push(
        <code key={key++} className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[0.9em]">
          {m[2]}
        </code>
      );
    } else if (m[4] !== undefined) {
      if (m[3]) parts.push(m[3]);
      parts.push(<em key={key++} className="italic">{m[4]}</em>);
    } else if (m[6] !== undefined) {
      if (m[5]) parts.push(m[5]);
      parts.push(<em key={key++} className="italic">{m[6]}</em>);
    }
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length > 0 ? parts : text;
}
