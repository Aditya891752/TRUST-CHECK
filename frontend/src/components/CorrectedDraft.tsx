import React, { useState } from 'react';
import { Check, CheckCircle2 } from 'lucide-react';
import type { CorrectedAnswer as CorrectedAnswerType, Claim } from '../lib/types';

interface CorrectedDraftProps {
  correctedAnswer?: CorrectedAnswerType | null;
  claims: Claim[];
  answerNormalized?: string;
}

export const CorrectedDraft: React.FC<CorrectedDraftProps> = ({
  correctedAnswer,
  claims,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDiffs, setShowDiffs] = useState(false);

  const allSupported =
    claims.length > 0 && claims.every((c) => c.verdict === 'supported');

  if (allSupported) {
    return (
      <section className="card p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-2.5 text-emerald-900 font-semibold text-sm">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>All claims supported by independent sources — No corrections needed.</span>
        </div>
      </section>
    );
  }

  if (!correctedAnswer || !correctedAnswer.text) {
    return null;
  }

  const handleCopy = () => {
    // Strip editorial action markers for clean pasting
    const cleanText = correctedAnswer.text.replace(/\[(Softened|Removed)\]\s*/g, '');
    navigator.clipboard?.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parts = correctedAnswer.text.split(/(\[Softened\]|\[Removed\])/);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 space-y-3" data-purpose="corrected-draft-section">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-slate-900 text-sm">Factually corrected answer draft</h3>
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center space-x-1 text-[11px] font-medium bg-slate-900 text-white px-2.5 py-1 rounded-md hover:bg-black transition"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span>Copy draft</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowDiffs(!showDiffs)}
            className="inline-flex items-center space-x-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded-md hover:bg-slate-200 transition"
          >
            <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16m-7 6h7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span>Diffs</span>
          </button>
        </div>
      </div>

      {/* Corrected answer body with badges for changes */}
      <div className="text-xs leading-relaxed text-slate-700 bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
        {showDiffs
          ? parts.map((p, i) => {
              if (p === '[Softened]') {
                return (
                  <span
                    key={i}
                    className="inline-flex items-center text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded mr-1"
                  >
                    [Softened]
                  </span>
                );
              }
              if (p === '[Removed]') {
                return (
                  <span
                    key={i}
                    className="inline-flex items-center text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded mr-1"
                  >
                    [Removed]
                  </span>
                );
              }
              return <span key={i}>{p}</span>;
            })
          : correctedAnswer.text.replace(/\[(Softened|Removed)\]\s*/g, '')}
      </div>

      {correctedAnswer.changes && correctedAnswer.changes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="font-medium text-slate-600">Audit trail:</span>
          {correctedAnswer.changes.map((ch, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                ch.action === 'kept'
                  ? 'bg-emerald-50 text-emerald-700'
                  : ch.action === 'hedged'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              #{ch.claim_id}: {ch.action}
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

export default CorrectedDraft;
