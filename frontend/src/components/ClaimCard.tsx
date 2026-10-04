import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Calendar, Hash, User } from 'lucide-react';
import type { Claim } from '../lib/types';
import { STATUS } from '../lib/status';

interface ClaimCardProps {
  claim: Claim;
  index: number;
  flash?: boolean;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({ claim, index, flash }) => {
  const [open, setOpen] = useState(true);

  const vKey = claim.verdict || 'verifying';
  const statusDef = STATUS[vKey] || STATUS.verifying;

  // Stance sort: supports -> contradicts -> neutral
  const sortedEvidence = [...(claim.evidence || [])].sort((a, b) => {
    const order: Record<string, number> = { supports: 1, contradicts: 2, neutral: 3 };
    const aOrder = order[a.stance?.toLowerCase() || 'neutral'] || 4;
    const bOrder = order[b.stance?.toLowerCase() || 'neutral'] || 4;
    return aOrder - bOrder;
  });

  const getFlagIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'date':
        return <Calendar size={12} className="text-amber-700" />;
      case 'number':
        return <Hash size={12} className="text-blue-700" />;
      case 'name':
        return <User size={12} className="text-purple-700" />;
      default:
        return <Hash size={12} className="text-gray-600" />;
    }
  };

  return (
    <article
      id={`claim-${claim.id}`}
      className={`card grid lg:grid-cols-3 lg:divide-x divide-line bg-white border border-line rounded-xl transition-all shadow-xs ${
        flash ? 'ring-2 ring-emerald-500 shadow-md' : ''
      }`}
    >
      {/* Column 1: Claim statement & Flags */}
      <div className="p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono font-bold text-sm text-navy">#{index + 1}</span>
            <span className="text-xs text-gray-500 font-medium">Claim</span>
            <span
              className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusDef.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusDef.dot}`} />
              {statusDef.label}
            </span>
          </div>

          <p
            lang={/[\u0900-\u097F]/.test(claim.text) ? 'hi' : undefined}
            className="text-[15px] font-medium text-navy leading-[1.6]"
          >
            {claim.text}
          </p>
        </div>

        {/* Flag Chips (F6) */}
        {claim.flags && claim.flags.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-line/60 flex flex-wrap gap-1.5">
            {claim.flags.map((f, fIdx) => (
              <span
                key={fIdx}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200/60 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                title={`${f.type}: ${f.text}`}
              >
                {getFlagIcon(f.type)}
                <span>
                  <strong className="capitalize">{f.type}:</strong> {f.text}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Column 2: Verification reasoning */}
      <div className="p-4 sm:p-5 bg-slate-50/30">
        <div className="font-semibold text-xs uppercase tracking-wider text-gray-400 mb-2">
          Verification reasoning
        </div>
        {claim.reasoning ? (
          <p
            lang={/[\u0900-\u097F]/.test(claim.reasoning) ? 'hi' : undefined}
            className="text-sm text-gray-700 leading-[1.6]"
          >
            {claim.reasoning}
          </p>
        ) : (
          <div className="text-xs text-gray-400 italic">
            Evaluating retrieved sources and checking figures...
          </div>
        )}
      </div>

      {/* Column 3: Evidence & Quotes */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-xs uppercase tracking-wider text-gray-400">
            Retrieved evidence ({sortedEvidence.length})
          </span>
          {sortedEvidence.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 transition-colors"
            >
              {open ? 'Hide details' : 'Show details'}
              {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>

        {sortedEvidence.length === 0 ? (
          <div className="text-xs text-gray-400 italic py-2">
            Searching web sources for independent verification...
          </div>
        ) : open ? (
          <div className="flex flex-col gap-3 mt-2">
            {sortedEvidence.map((ev, evIdx) => {
              const isSupport = ev.stance?.toLowerCase() === 'supports';
              const isContradict = ev.stance?.toLowerCase() === 'contradicts';
              const domain = ev.url ? new URL(ev.url).hostname.replace(/^www\./, '') : 'source';

              return (
                <div
                  key={ev.id || evIdx}
                  className="rounded-lg border border-line p-3 bg-white hover:border-slate-300 transition-colors text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isSupport
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isContradict
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {ev.stance ? ev.stance.charAt(0).toUpperCase() + ev.stance.slice(1) : 'Neutral'}
                    </span>
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-500 hover:text-navy flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>{domain}</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  <div className="font-medium text-navy text-xs mb-1 line-clamp-1">{ev.title}</div>

                  {ev.quote ? (
                    <blockquote className="mt-1.5 border-l-2 border-emerald-500 pl-2 text-gray-700 italic bg-emerald-50/30 py-0.5 rounded-r">
                      “{ev.quote}”
                    </blockquote>
                  ) : (
                    <p className="text-gray-500 line-clamp-2 mt-1">{ev.snippet}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-gray-500 py-1">
            {sortedEvidence.length} source{sortedEvidence.length > 1 ? 's' : ''} retrieved. Click “Show details” to inspect quotes.
          </div>
        )}
      </div>
    </article>
  );
};

export default ClaimCard;
