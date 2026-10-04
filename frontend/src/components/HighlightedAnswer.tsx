import React, { type ReactNode } from 'react';
import type { Claim } from '../lib/types';

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
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 space-y-2.5">
        <h3 className="font-bold text-slate-900 text-sm">Analyzed text</h3>
        <p className="text-xs leading-relaxed text-slate-800 bg-slate-50/60 p-3 rounded-lg border border-slate-200/70 whitespace-pre-wrap">{originalText}</p>
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
    const hlClass =
      vKey === 'supported'
        ? 'hl-green font-medium'
        : vKey === 'uncertain'
        ? 'hl-amber font-medium'
        : vKey === 'unsupported'
        ? 'hl-red font-medium'
        : 'bg-slate-100 text-slate-700';

    nodes.push(
      <span
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
        className={`${hlClass} cursor-pointer hover:opacity-80 transition-opacity`}
        title={`Click to inspect claim #${idx + 1} (${claim.verdict})`}
      >
        {originalText.substring(start, end)}
      </span>
    );

    lastPos = Math.max(lastPos, end);
  });

  if (lastPos < originalText.length) {
    nodes.push(
      <span key={`text-end-${lastPos}`}>{originalText.substring(lastPos)}</span>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
          <span>Highlighted answer</span>
        </h3>
        <div className="flex space-x-1 text-[10px] font-medium">
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Support</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Uncertain</span>
          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800">Unsupported</span>
        </div>
      </div>
      {/* Semantic Highlighted Text Output */}
      <div className="text-xs leading-relaxed text-slate-800 bg-slate-50/60 p-3 rounded-lg border border-slate-200/70 space-y-1 font-normal">
        {nodes}
      </div>
    </section>
  );
};

export default HighlightedAnswer;
