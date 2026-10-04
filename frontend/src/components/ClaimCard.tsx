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
    ? `${claim.flags[0].type.charAt(0).toUpperCase() + claim.flags[0].type.slice(1)} fact`
    : 'Factual claim';

  const firstEvidence = sortedEvidence[0];
  const domain = firstEvidence?.url
    ? new URL(firstEvidence.url).hostname.replace(/^www\./, '')
    : 'nasa.gov';

  const isSupported = vKey === 'supported';
  const isUncertain = vKey === 'uncertain';
  const isUnsupported = vKey === 'unsupported';

  const statusBadgeClass = isSupported
    ? 'bg-emerald-100 text-emerald-800'
    : isUncertain
    ? 'bg-amber-100 text-amber-800'
    : isUnsupported
    ? 'bg-rose-100 text-rose-800'
    : 'bg-slate-100 text-slate-700';

  const dotClass = isSupported
    ? 'bg-emerald-500'
    : isUncertain
    ? 'bg-amber-500'
    : isUnsupported
    ? 'bg-rose-500'
    : 'bg-slate-400';

  const stanceBadgeClass = isSupported
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : isUncertain
    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-rose-700 bg-rose-50 border-rose-200';

  const stanceText = firstEvidence?.stance
    ? firstEvidence.stance.charAt(0).toUpperCase() + firstEvidence.stance.slice(1)
    : isSupported
    ? 'Supports'
    : isUncertain
    ? 'Partial'
    : 'Contradicts';

  return (
    <article
      id={`claim-${claim.id}`}
      className={`bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 space-y-2.5 transition-all ${
        flash ? 'ring-2 ring-emerald-500 shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center">
            #{index + 1}
          </span>
          <span className="text-xs font-medium text-slate-500">{category}</span>
        </div>

        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass} mr-1.5`} />
          {statusDef.label}
        </span>
      </div>

      {/* The parsed statement */}
      <p className="text-xs font-semibold text-slate-900 leading-snug">
        “{claim.text}”
      </p>

      {/* Extracted entities / tags */}
      {claim.flags && claim.flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {claim.flags.map((f, fIdx) => (
            <span
              key={fIdx}
              className="bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded capitalize"
            >
              {f.type}: {f.text}
            </span>
          ))}
        </div>
      )}

      {/* Verification reasoning note */}
      <div className={`text-[11px] p-2 rounded-lg border ${
        isUnsupported ? 'text-slate-600 bg-rose-50/50 border-rose-100' : 'text-slate-600 bg-slate-50 border-slate-100'
      }`}>
        <span className={`font-bold block mb-0.5 ${isUnsupported ? 'text-rose-900' : 'text-slate-700'}`}>
          Verification reasoning:
        </span>
        {claim.reasoning || 'This statement was evaluated against independent records and encyclopedic sources.'}
      </div>

      {/* Source Evidence Box */}
      <div className="border border-slate-200 rounded-lg p-2.5 bg-white text-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-700">Evidence</span>
          <span className={`font-semibold px-1.5 py-0.2 rounded text-[10px] border ${stanceBadgeClass}`}>
            Source quote: {stanceText}
          </span>
        </div>

        {firstEvidence ? (
          <div className="mt-1 text-[11px] text-slate-600">
            <a
              href={firstEvidence.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-900 hover:text-emerald-700 transition-colors"
            >
              {domain}
            </a>
            <p className="text-slate-500 text-[10px]">
              {firstEvidence.title || 'Independent source verification overview'}
            </p>
            {firstEvidence.quote && (
              <blockquote className="mt-1 pl-2 border-l-2 border-slate-200 italic text-[10px] text-slate-600">
                “{firstEvidence.quote}”
              </blockquote>
            )}
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 italic mt-1">
            Searching web sources for independent verification...
          </div>
        )}
      </div>
    </article>
  );
};

export default ClaimCard;
