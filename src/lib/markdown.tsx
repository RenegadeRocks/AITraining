import { Fragment, type ReactNode } from "react";

export function Markdown({ text, className }: { text: string; className?: string }) {
  return <div className={className}>{renderBlocks(text)}</div>;
}

function renderBlocks(text: string): ReactNode[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const blocks = normalized.split(/\n{2,}/);
  const out: ReactNode[] = [];

  blocks.forEach((block, i) => {
    const lines = block.split("\n");
    const isList = lines.every((l) => /^\s*[-*]\s+/.test(l));
    const isOrdered = lines.every((l) => /^\s*\d+\.\s+/.test(l));

    if (isList && lines.length > 0) {
      out.push(
        <ul key={i} className="my-2 list-disc space-y-1 pl-5">
          {lines.map((l, j) => (
            <li key={j}>{renderInline(l.replace(/^\s*[-*]\s+/, ""))}</li>
          ))}
        </ul>
      );
    } else if (isOrdered && lines.length > 0) {
      out.push(
        <ol key={i} className="my-2 list-decimal space-y-1 pl-5">
          {lines.map((l, j) => (
            <li key={j}>{renderInline(l.replace(/^\s*\d+\.\s+/, ""))}</li>
          ))}
        </ol>
      );
    } else {
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
    }
  });

  return out;
}

function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /\*\*([^*\n]+)\*\*|`([^`\n]+)`|\*([^*\n]+)\*|_([^_\n]+)_/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    if (m[1] !== undefined) {
      parts.push(<strong key={key++} className="font-semibold">{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      parts.push(
        <code key={key++} className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[0.9em]">
          {m[2]}
        </code>
      );
    } else if (m[3] !== undefined) {
      parts.push(<em key={key++} className="italic">{m[3]}</em>);
    } else if (m[4] !== undefined) {
      parts.push(<em key={key++} className="italic">{m[4]}</em>);
    }
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length > 0 ? parts : text;
}
