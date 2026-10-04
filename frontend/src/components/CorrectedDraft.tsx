import React, { useState } from 'react';
import { Copy, Check, CheckCircle2, RefreshCw } from 'lucide-react';
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
    <section className="card p-5 bg-white border border-line rounded-xl shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-navy">
            Factually corrected answer draft
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Grounded reconstruction with unsupported falsehoods removed and uncertain claims softened.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="bg-navy hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy clean draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDiffs(!showDiffs)}
            className="bg-white hover:bg-gray-50 border border-line rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={13} className={showDiffs ? 'text-emerald-600' : 'text-gray-500'} />
            <span>{showDiffs ? 'Hide change tags' : 'Show change tags'}</span>
          </button>
        </div>
      </div>

      <div className="mt-3 p-4 rounded-lg bg-slate-50 border border-line/60 text-[15px] leading-[1.7] text-navy">
        {showDiffs
          ? parts.map((p, i) => {
              if (p === '[Softened]') {
                return (
                  <span
                    key={i}
                    className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 rounded px-1.5 py-0.5 text-xs font-bold mx-1 align-baseline"
                  >
                    [Softened]
                  </span>
                );
              }
              if (p === '[Removed]') {
                return (
                  <span
                    key={i}
                    className="inline-block bg-rose-100 text-rose-800 border border-rose-300 rounded px-1.5 py-0.5 text-xs font-bold mx-1 align-baseline"
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
        <div className="mt-3 pt-3 border-t border-line/60 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="font-medium text-gray-600">Audit trail:</span>
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
