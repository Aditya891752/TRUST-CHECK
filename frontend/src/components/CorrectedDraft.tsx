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
    <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-3 mb-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Factually corrected answer draft
        </h3>

        {/* Action Buttons: Copy draft + Diffs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Copy draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDiffs(!showDiffs)}
            className={`border rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showDiffs
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <RefreshCw size={12} className={showDiffs ? 'text-emerald-600' : 'text-slate-400'} />
            <span>Diffs</span>
          </button>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 text-[13px] leading-relaxed text-slate-800">
        {showDiffs
          ? parts.map((p, i) => {
              if (p === '[Softened]') {
                return (
                  <span
                    key={i}
                    className="inline-block bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] rounded px-1.5 py-0.5 text-[10px] font-bold mx-1 align-baseline"
                  >
                    [Softened]
                  </span>
                );
              }
              if (p === '[Removed]') {
                return (
                  <span
                    key={i}
                    className="inline-block bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] rounded px-1.5 py-0.5 text-[10px] font-bold mx-1 align-baseline"
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
