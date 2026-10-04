import type { ReactNode } from 'react';
import { Claim } from '../lib/types';

interface HighlightedAnswerProps {
  originalText: string;
  claims: Claim[];
  onSelectClaim?: (claimId: string) => void;
}

export const HighlightedAnswer: React.FC<HighlightedAnswerProps> = ({ originalText, claims, onSelectClaim }) => {
  // Collect all valid spans
  const spannedClaims = claims
    .filter((c) => c.span && c.span.start >= 0 && c.span.end <= originalText.length && c.span.start < c.span.end)
    .sort((a, b) => a.span!.start - b.span!.start);

  if (spannedClaims.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--radius)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
          lineHeight: '26px',
          whiteSpace: 'pre-wrap',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-muted)' }}>
          Analyzed text
        </h3>
        <p>{originalText}</p>
      </div>
    );
  }

  // Slice string into segments
  const segments: ReactNode[] = [];
  let lastIndex = 0;

  spannedClaims.forEach((claim, idx) => {
    const { start, end } = claim.span!;

    // Non-highlighted segment before this claim
    if (start > lastIndex) {
      segments.push(
        <span key={`text-${lastIndex}`}>{originalText.substring(lastIndex, start)}</span>
      );
    }

    // Highlighted segment
    const getVerdictColor = () => {
      switch (claim.verdict) {
        case 'supported':
          return { bg: 'var(--color-supported-bg)', ink: 'var(--color-supported-ink)' };
        case 'uncertain':
          return { bg: 'var(--color-uncertain-bg)', ink: 'var(--color-uncertain-ink)' };
        case 'unsupported':
          return { bg: 'var(--color-unsupported-bg)', ink: 'var(--color-unsupported-ink)' };
        default:
          return { bg: 'var(--color-bg)', ink: 'var(--color-ink)' };
      }
    };

    const colors = getVerdictColor();

    segments.push(
      <mark
        key={`claim-mark-${claim.id}-${idx}`}
        onClick={() => {
          onSelectClaim?.(claim.id);
          const el = document.getElementById(`claim-${claim.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            const el = document.getElementById(`claim-${claim.id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
        style={{
          backgroundColor: colors.bg,
          color: colors.ink,
          borderRadius: '3px',
          padding: '2px 4px',
          cursor: 'pointer',
          fontWeight: 500,
          textDecoration: 'underline',
          textDecorationThickness: '1px',
          textUnderlineOffset: '3px',
        }}
        title={`Click to view claim #${idx + 1} (${claim.verdict})`}
      >
        {originalText.substring(start, end)}
      </mark>
    );

    lastIndex = Math.max(lastIndex, end);
  });

  // Tail segment
  if (lastIndex < originalText.length) {
    segments.push(
      <span key={`text-${lastIndex}`}>{originalText.substring(lastIndex)}</span>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-line)',
        borderRadius: 'var(--radius)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-6)',
        lineHeight: '26px',
        fontSize: '15px',
        color: 'var(--color-ink)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Highlighted answer
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Click any claim to jump to evidence</span>
      </div>
      <div style={{ whiteSpace: 'pre-wrap' }}>{segments}</div>
    </div>
  );
};

export default HighlightedAnswer;
