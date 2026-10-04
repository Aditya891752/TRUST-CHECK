import React from 'react';
import type { Claim } from '../lib/types';

interface SummaryStatsProps {
  claims: Claim[];
  summary?: { supported: number; uncertain: number; unsupported: number };
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({ claims, summary }) => {
  const total = claims.length || 1;
  const supported = summary ? summary.supported : claims.filter((c) => c.verdict === 'supported').length;
  const uncertain = summary ? summary.uncertain : claims.filter((c) => c.verdict === 'uncertain').length;
  const unsupported = summary ? summary.unsupported : claims.filter((c) => c.verdict === 'unsupported').length;

  const stats = [
    { label: 'claims', val: claims.length, color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200/80', isUpper: true },
    { label: 'supported', val: supported, color: 'text-emerald-700', bg: 'bg-emerald-50/70 border-emerald-200/60', isUpper: false },
    { label: 'uncertain', val: uncertain, color: 'text-amber-700', bg: 'bg-amber-50/70 border-amber-200/60', isUpper: false },
    { label: 'unsupported', val: unsupported, color: 'text-rose-700', bg: 'bg-rose-50/70 border-rose-200/60', isUpper: false },
  ];

  const supPct = Math.round((supported / total) * 100);
  const uncPct = Math.round((uncertain / total) * 100);
  const unsPct = Math.round((unsupported / total) * 100);

  return (
    <div className="space-y-3.5" data-purpose="verification-summary-report">
      {/* Stat Counter Cards */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {stats.map((s) => (
          <div key={s.label} className={`p-2 rounded-lg border ${s.bg}`}>
            <span className={`block text-lg font-bold leading-tight ${s.color}`}>{s.val}</span>
            <span className={`text-[10px] font-medium ${s.isUpper ? 'uppercase text-slate-500' : s.color}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Horizontal Multi-segment Proportion Bar */}
      <div className="space-y-1">
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${(supported / total) * 100}%` }}
            title={`${supPct}% Supported`}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-300"
            style={{ width: `${(uncertain / total) * 100}%` }}
            title={`${uncPct}% Uncertain`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${(unsupported / total) * 100}%` }}
            title={`${unsPct}% Unsupported`}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
          <span className="text-emerald-700 font-semibold">{supPct}% supported</span>
          <span className="text-amber-700 font-semibold">{uncPct}%</span>
          <span className="text-rose-700 font-semibold">{unsPct}% unsupp.</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryStats;
