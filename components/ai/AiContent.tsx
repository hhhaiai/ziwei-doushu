interface AiContentProps {
  text: string;
  streaming?: boolean;
}

function renderInlineMarkdown(text: string): Array<string | JSX.Element> {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\s)]+\))/g);

  return parts.map((part, index) => {
    if (!part) return '';

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`bold-${index}`} style={{ color: 'var(--tx-0)', fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`code-${index}`}
          style={{
            fontSize: '0.92em',
            padding: '1px 5px',
            borderRadius: '5px',
            background: 'color-mix(in srgb, var(--ac) 10%, var(--bg-1))',
            border: '1px solid var(--bdr)',
            color: 'var(--tx-0)',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const safeHref = /^(https?:|mailto:|\/)/.test(href) ? href : '#';
      return (
        <a
          key={`link-${index}`}
          href={safeHref}
          target={safeHref.startsWith('http') ? '_blank' : undefined}
          rel={safeHref.startsWith('http') ? 'noreferrer' : undefined}
          style={{ color: 'var(--ac)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
        >
          {label}
        </a>
      );
    }

    return part;
  });
}

function paragraphStyle(): React.CSSProperties {
  return {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.85,
    color: 'var(--tx-1)',
    wordBreak: 'break-word',
  };
}

function headingStyle(level: number): React.CSSProperties {
  return {
    margin: level === 1 ? '4px 0 2px' : '8px 0 2px',
    fontSize: level === 1 ? '16px' : level === 2 ? '15px' : '14px',
    lineHeight: 1.55,
    fontWeight: 800,
    color: level <= 2 ? 'var(--ac)' : 'var(--tx-0)',
    letterSpacing: '0.02em',
  };
}

export default function AiContent({ text, streaming }: AiContentProps) {
  const lines = text.split('\n');
  const blocks: JSX.Element[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? '';
    const line = rawLine.trim();

    if (!line) {
      blocks.push(<div key={`blank-${index}`} style={{ height: '4px' }} />);
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? '').trim().startsWith('```')) {
        codeLines.push(lines[index] ?? '');
        index += 1;
      }
      blocks.push(
        <pre
          key={`code-block-${index}`}
          style={{
            margin: '4px 0',
            padding: '10px 12px',
            overflowX: 'auto',
            borderRadius: '10px',
            border: '1px solid var(--bdr-med)',
            background: 'color-mix(in srgb, var(--bg-0) 88%, #000)',
            color: 'var(--tx-0)',
            fontSize: '12px',
            lineHeight: 1.65,
          }}
        >
          <code>{language ? `// ${language}\n` : ''}{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(
        <div key={`heading-${index}`} style={headingStyle(level)}>
          {renderInlineMarkdown(headingMatch[2])}
        </div>,
      );
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.+)$/);
    if (quoteMatch) {
      blocks.push(
        <blockquote
          key={`quote-${index}`}
          style={{
            margin: '4px 0',
            padding: '7px 10px',
            borderLeft: '3px solid var(--ac)',
            background: 'color-mix(in srgb, var(--ac) 8%, transparent)',
            borderRadius: '8px',
            color: 'var(--tx-1)',
            fontSize: '13px',
            lineHeight: 1.75,
          }}
        >
          {renderInlineMarkdown(quoteMatch[1])}
        </blockquote>,
      );
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      blocks.push(
        <div key={`ul-${index}`} style={{ ...paragraphStyle(), display: 'flex', gap: '7px' }}>
          <span style={{ color: 'var(--ac)', lineHeight: 1.85 }}>•</span>
          <span>{renderInlineMarkdown(unorderedMatch[1])}</span>
        </div>,
      );
      continue;
    }

    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      blocks.push(
        <div key={`ol-${index}`} style={{ ...paragraphStyle(), display: 'flex', gap: '7px' }}>
          <span style={{ color: 'var(--ac)', fontVariantNumeric: 'tabular-nums' }}>{orderedMatch[1]}.</span>
          <span>{renderInlineMarkdown(orderedMatch[2])}</span>
        </div>,
      );
      continue;
    }

    if (/^---+$/.test(line)) {
      blocks.push(<div key={`hr-${index}`} style={{ height: 1, background: 'var(--bdr)', margin: '6px 0' }} />);
      continue;
    }

    blocks.push(
      <p key={`p-${index}`} style={paragraphStyle()}>
        {renderInlineMarkdown(line.replace(/^#{1,6}\s*/, ''))}
      </p>,
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {blocks}
      {streaming && (
        <span
          style={{
            display: 'inline-block',
            width: '7px',
            height: '13px',
            background: 'var(--ac)',
            opacity: 0.5,
            borderRadius: '2px',
            animation: 'pulse 1s ease-in-out infinite',
            marginLeft: '2px',
          }}
        />
      )}
    </div>
  );
}
