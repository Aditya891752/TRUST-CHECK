import type { FC, ReactNode } from 'react';

interface QuoteBlockProps {
  snippet: string;
  quote?: string | null;
  stance?: string;
}

export const QuoteBlock: FC<QuoteBlockProps> = ({ snippet, quote, stance }) => {
  const getStanceBadge = () => {
    switch (stance) {
      case 'supports':
        return {
          bg: 'var(--color-supported-bg)',
          ink: 'var(--color-supported-ink)',
          marker: '●',
          label: 'Supports',
        };
      case 'contradicts':
        return {
          bg: 'var(--color-unsupported-bg)',
          ink: 'var(--color-unsupported-ink)',
          marker: '■',
          label: 'Contradicts',
        };
      default:
        return {
          bg: 'var(--color-bg)',
          ink: 'var(--color-muted)',
          marker: '○',
          label: 'Related',
        };
    }
  };

  const badge = getStanceBadge();

  // Emphasize the exact quote inside the snippet if present
  const renderSnippetWithQuote = (): ReactNode => {
    if (!quote || quote.trim().length === 0) {
      return (
        <div>
          <p style={{ color: 'var(--color-ink)', lineHeight: '20px' }}>{snippet}</p>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)', marginTop: 'var(--space-1)', fontStyle: 'italic' }}>
            No exact quote available
          </span>
        </div>
      );
    }

    const qTrimmed = quote.trim();
    const pos = snippet.toLowerCase().indexOf(qTrimmed.toLowerCase());

    if (pos === -1) {
      return (
        <div>
          <blockquote
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeft: '3px solid var(--color-primary)',
              padding: 'var(--space-2) var(--space-3)',
              marginBottom: 'var(--space-2)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-ink)',
            }}
          >
            "{quote}"
          </blockquote>
          <p style={{ color: 'var(--color-muted)', fontSize: '13px', lineHeight: '18px' }}>{snippet}</p>
        </div>
      );
    }

    // Split snippet to highlight quote verbatim
    const before = snippet.substring(0, pos);
    const match = snippet.substring(pos, pos + qTrimmed.length);
    const after = snippet.substring(pos + qTrimmed.length);

    return (
      <p style={{ color: 'var(--color-ink)', lineHeight: '20px', fontSize: '13px' }}>
        <span>{before}</span>
        <mark
          style={{
            backgroundColor: badge.bg,
            color: badge.ink,
            fontWeight: 700,
            padding: '1px 3px',
            borderRadius: '2px',
          }}
        >
          {match}
        </mark>
        <span>{after}</span>
      </p>
    );
  };

  return (
    <div style={{ marginTop: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
        <span
          style={{
            backgroundColor: badge.bg,
            color: badge.ink,
            fontSize: '11px',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '3px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span aria-hidden="true">{badge.marker}</span>
          <span>{badge.label}</span>
        </span>
      </div>

      {renderSnippetWithQuote()}
    </div>
  );
};

export default QuoteBlock;
