import React, { type ReactNode } from 'react';
import type { Claim } from '../lib/types';
import { STATUS } from '../lib/status';

interface HighlightedAnswerProps {
  originalText: string;
  claims: Claim[];
  onSelectClaim?: (claimId: string) => void;
}

export const HighlightedAnswer: React.FC<HighlightedAnswerProps> = ({
  originalText,
  claims,
  onSelectClaim,
}) => {
  // Map claims with spans or text matches
  const validClaims = claims
    .filter((c) => c.span && c.span.start >= 0 && c.span.end <= originalText.length && c.span.start < c.span.end)
    .sort((a, b) => a.span!.start - b.span!.start);

  if (validClaims.length === 0) {
    return (
      <section className="card p-5 bg-white border border-line rounded-xl shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-navy mb-2">Analyzed text</h3>
        <p className="text-[15px] leading-[1.6] text-gray-800 whitespace-pre-wrap">{originalText}</p>
      </section>
    );
  }

  const nodes: ReactNode[] = [];
  let lastPos = 0;

  validClaims.forEach((claim, idx) => {
    const { start, end } = claim.span!;

    if (start > lastPos) {
      nodes.push(
        <span key={`text-${lastPos}`}>{originalText.substring(lastPos, start)}</span>
      );
    }

    const vKey = claim.verdict || 'verifying';
    const statusDef = STATUS[vKey] || STATUS.verifying;

    nodes.push(
      <mark
        key={`claim-${claim.id}-${idx}`}
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
        className={`${statusDef.hl} rounded px-1 py-0.5 cursor-pointer text-inherit font-medium border-b-2 border-slate-300 hover:opacity-80 transition-opacity`}
        title={`Click to inspect claim #${idx + 1} (${statusDef.label})`}
      >
        {originalText.substring(start, end)}
      </mark>
    );

    lastPos = Math.max(lastPos, end);
  });

  if (lastPos < originalText.length) {
    nodes.push(
      <span key={`text-end-${lastPos}`}>{originalText.substring(lastPos)}</span>
    );
  }

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Header with Title + 3 Legend Pills */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Highlighted answer</h3>
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] px-2 py-0.5 text-[11px] font-semibold">
            Support
          </span>
          <span className="rounded-md bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] px-2 py-0.5 text-[11px] font-semibold">
            Uncertain
          </span>
          <span className="rounded-md bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA] border px-2 py-0.5 text-[11px] font-semibold">
            Unsupported
          </span>
        </div>
      </div>
      <p className="text-[14px] leading-[1.8] text-slate-800">{nodes}</p>
    </section>
  );
};

export default HighlightedAnswer;
