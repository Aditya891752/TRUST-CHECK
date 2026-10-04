import type { FC, ReactNode } from 'react';
import { Claim } from '../lib/types';
import EvidenceList from './EvidenceList';
import FlagChips from './FlagChips';

interface ClaimCardProps {
  claim: Claim;
  index: number;
}

export const ClaimCard: FC<ClaimCardProps> = ({ claim, index }) => {
  const getVerdictStyle = (verdict: Claim['verdict']) => {
    switch (verdict) {
      case 'supported':
        return {
          bg: 'var(--color-supported-bg)',
          ink: 'var(--color-supported-ink)',
          marker: '●',
          label: 'Supported',
        };
      case 'uncertain':
        return {
          bg: 'var(--color-uncertain-bg)',
          ink: 'var(--color-uncertain-ink)',
          marker: '◐',
          label: 'Uncertain',
        };
      case 'unsupported':
        return {
          bg: 'var(--color-unsupported-bg)',
          ink: 'var(--color-unsupported-ink)',
          marker: '■',
          label: 'Unsupported',
        };
      default:
        return {
          bg: 'var(--color-bg)',
          ink: 'var(--color-muted)',
          marker: '○',
          label: 'Unverified',
        };
    }
  };

  const style = getVerdictStyle(claim.verdict);

  // Underline flagged terms within the claim text
  const renderAnnotatedClaimText = () => {
    if (!claim.flags || claim.flags.length === 0) {
      return claim.text;
    }

    const validFlags = claim.flags
      .filter((f) => f.start >= 0 && f.end <= claim.text.length && f.start < f.end)
      .sort((a, b) => a.start - b.start);

    if (validFlags.length === 0) {
      return claim.text;
    }

    const nodes: ReactNode[] = [];
    let lastPos = 0;

    validFlags.forEach((flag, fIdx) => {
      if (flag.start > lastPos) {
        nodes.push(claim.text.substring(lastPos, flag.start));
      }
      nodes.push(
        <span
          key={`flag-underlined-${flag.start}-${fIdx}`}
          style={{
            textDecoration: 'underline',
            textDecorationThickness: '2px',
            textDecorationColor: 'var(--color-primary)',
            textUnderlineOffset: '3px',
            fontWeight: 700,
          }}
          title={`${flag.type}: ${flag.text}`}
        >
          {claim.text.substring(flag.start, flag.end)}
        </span>
      );
      lastPos = Math.max(lastPos, flag.end);
    });

    if (lastPos < claim.text.length) {
      nodes.push(claim.text.substring(lastPos));
    }

    return nodes;
  };

  return (
    <article
      id={`claim-${claim.id}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--color-line)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
          #{index + 1}
        </span>
        <span
          style={{
            backgroundColor: style.bg,
            color: style.ink,
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          <span aria-hidden="true">{style.marker}</span>
          <span>{style.label}</span>
        </span>
      </div>

      <p style={{ fontSize: '16px', color: 'var(--color-ink)', lineHeight: '24px', marginBottom: 'var(--space-2)' }}>
        {renderAnnotatedClaimText()}
      </p>

      {/* Flag Chips per F6 */}
      <FlagChips flags={claim.flags} />

      {claim.reasoning && (
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', lineHeight: '20px', marginBottom: 'var(--space-2)' }}>
          {claim.reasoning}
        </p>
      )}

      <EvidenceList evidence={claim.evidence} />
    </article>
  );
};

export default ClaimCard;
