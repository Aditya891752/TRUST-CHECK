import React, { useState } from 'react';
import type { CorrectedAnswer as CorrectedAnswerType, Claim } from '../lib/types';

interface CorrectedAnswerProps {
  correctedAnswer?: CorrectedAnswerType | null;
  claims: Claim[];
  answerNormalized?: string;
}

export const CorrectedAnswer: React.FC<CorrectedAnswerProps> = ({
  correctedAnswer,
  claims,
  answerNormalized,
}) => {
  const [copied, setCopied] = useState(false);

  if (!correctedAnswer || !correctedAnswer.text) {
    return null;
  }

  const allSupported = claims.length > 0 && claims.every((c) => c.verdict === 'supported');
  const removedChanges = correctedAnswer.changes.filter((ch) => ch.action === 'removed');
  const hedgedChanges = correctedAnswer.changes.filter((ch) => ch.action === 'hedged');

  // Map removed claims to their original sentences
  const claimMap = new Map(claims.map((c) => [c.id, c]));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(correctedAnswer.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <section
      id="corrected-answer-panel"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--color-line)',
        padding: 'var(--space-6)',
        marginTop: 'var(--space-8)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 'var(--space-3)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-ink)' }}>
            Corrected answer
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: 'var(--space-1)' }}>
            Draft rewritten from checked claims. Review before use.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-line)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-2) var(--space-4)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-ink)',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'var(--color-line)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'var(--color-bg)';
          }}
        >
          {copied ? 'Copied!' : 'Copy clean draft'}
        </button>
      </div>

      {allSupported ? (
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--color-supported-bg)',
            borderRadius: 'var(--radius)',
            marginTop: 'var(--space-3)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-supported-ink)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 'var(--space-1)',
            }}
          >
            No changes needed
          </span>
          <p style={{ fontSize: '15px', color: 'var(--color-ink)', lineHeight: '24px' }}>
            {correctedAnswer.text}
          </p>
        </div>
      ) : (
        <div style={{ marginTop: 'var(--space-4)' }}>
          {/* Main Clean / Hedged Text */}
          <div
            style={{
              fontSize: '15px',
              lineHeight: '26px',
              color: 'var(--color-ink)',
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-line)',
            }}
          >
            <p>{correctedAnswer.text}</p>
          </div>

          {/* Detailed Change Summary Annotations */}
          {(hedgedChanges.length > 0 || removedChanges.length > 0) && (
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hedgedChanges.map((hc) => {
                const claim = claimMap.get(hc.claim_id);
                return (
                  <div
                    key={`hedged-${hc.claim_id}`}
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-uncertain-ink)',
                      backgroundColor: 'var(--color-uncertain-bg)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: '6px' }}>[Softened]</span>
                    <span style={{ borderBottom: '1px dotted var(--color-uncertain-ink)' }}>
                      {claim ? claim.text : hc.claim_id}
                    </span>
                  </div>
                );
              })}

              {removedChanges.map((rc) => {
                const claim = claimMap.get(rc.claim_id);
                const removedText = claim
                  ? (claim.span && answerNormalized
                      ? answerNormalized.substring(claim.span.start, claim.span.end)
                      : claim.text)
                  : rc.claim_id;
                return (
                  <div
                    key={`removed-${rc.claim_id}`}
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-unsupported-ink)',
                      backgroundColor: 'var(--color-unsupported-bg)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: '6px' }}>[Removed]</span>
                    <span style={{ textDecoration: 'line-through' }}>{removedText}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default CorrectedAnswer;
