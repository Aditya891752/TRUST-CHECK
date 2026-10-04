import React from 'react';
import type { Claim } from '../lib/types';
import { STATUS } from '../lib/status';

interface ClaimCardProps {
  claim: Claim;
  index: number;
  flash?: boolean;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({ claim, index, flash }) => {
  const vKey = claim.verdict || 'verifying';
  const statusDef = STATUS[vKey] || STATUS.verifying;

  // Stance sort: supports -> contradicts -> neutral
  const sortedEvidence = [...(claim.evidence || [])].sort((a, b) => {
    const order: Record<string, number> = { supports: 1, contradicts: 2, neutral: 3 };
    const aOrder = order[a.stance?.toLowerCase() || 'neutral'] || 4;
    const bOrder = order[b.stance?.toLowerCase() || 'neutral'] || 4;
    return aOrder - bOrder;
  });

  const category = claim.flags?.[0]?.type
    ? `${claim.flags[0].type.charAt(0).toUpperCase() + claim.flags[0].type.slice(1)} claim`
    : 'Factual claim';

  const firstEvidence = sortedEvidence[0];
  const domain = firstEvidence?.url
    ? new URL(firstEvidence.url).hostname.replace(/^www\./, '')
    : 'nasa.gov';

  const stanceBadge = firstEvidence?.stance?.toLowerCase() === 'supports'
    ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
    : firstEvidence?.stance?.toLowerCase() === 'contradicts'
    ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
    : 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';

  const stanceText = firstEvidence?.stance
    ? firstEvidence.stance.charAt(0).toUpperCase() + firstEvidence.stance.slice(1)
    : 'Partial';

  return (
    <article
      id={`claim-${claim.id}`}
      className={`bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 transition-all shadow-[0_1px_4px_rgba(0,0,0,0.04)] ${
        flash ? 'ring-2 ring-emerald-500 shadow-md' : ''
      }`}
    >
      {/* Top Header: #ID + Category + Status Badge */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            #{index + 1}
          </span>
          <span className="text-xs text-slate-500 font-medium">{category}</span>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusDef.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusDef.dot}`} />
          {statusDef.label}
        </span>
      </div>

      {/* Claim Text */}
      <div className="text-[14px] font-bold text-slate-900 leading-snug">
        “{claim.text}”
      </div>

      {/* Flag chips if any */}
      {claim.flags && claim.flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {claim.flags.map((f, fIdx) => (
            <span
              key={fIdx}
              className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-[11px] font-mono text-slate-600"
            >
              {f.type}: {f.text}
            </span>
          ))}
        </div>
      )}

      {/* Verification Reasoning Section */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          Verification reasoning:
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {claim.reasoning || 'Evaluating retrieved sources and independent records...'}
        </p>
      </div>

      {/* Evidence & Quote Box */}
      <div className="mt-3.5 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Evidence
          </span>
          {firstEvidence && (
            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${stanceBadge}`}>
              Source quote: {stanceText}
            </span>
          )}
        </div>

        {firstEvidence ? (
          <div className="text-xs">
            <a
              href={firstEvidence.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-800 hover:text-emerald-700 transition-colors"
            >
              {domain}
            </a>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {firstEvidence.title || 'Independent source verification record'}
            </div>
            {firstEvidence.quote && (
              <blockquote className="mt-1.5 pl-2.5 border-l-2 border-slate-300 text-slate-600 italic text-[11px]">
                “{firstEvidence.quote}”
              </blockquote>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">
            Searching web sources for independent verification...
          </div>
        )}
      </div>
    </article>
  );
};

export default ClaimCard;
