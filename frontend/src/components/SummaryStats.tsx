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
    { label: 'CLAIMS', val: claims.length, color: 'text-slate-900', bg: 'bg-slate-50/70 border-slate-200/80' },
    { label: 'supported', val: supported, color: 'text-[#16A34A]', bg: 'bg-[#F0FDF4] border-[#BBF7D0]' },
    { label: 'uncertain', val: uncertain, color: 'text-[#D97706]', bg: 'bg-[#FFFBEB] border-[#FDE68A]' },
    { label: 'unsupported', val: unsupported, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2] border-[#FECACA]' },
  ];

  const supPct = Math.round((supported / total) * 100);
  const uncPct = Math.round((uncertain / total) * 100);
  const unsPct = Math.round((unsupported / total) * 100);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-4 gap-2.5">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border p-3 text-center flex flex-col items-center justify-center ${s.bg}`}
          >
            <div className={`text-2xl sm:text-3xl font-bold font-sans ${s.color}`}>
              {s.val}
            </div>
            <div className={`text-[11px] font-semibold mt-1 uppercase tracking-wider ${s.color}`}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tri-color progress breakdown bar */}
      <div className="mt-4">
        <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            style={{ width: `${(supported / total) * 100}%` }}
            className="bg-[#22C55E] transition-all duration-300"
          />
          <div
            style={{ width: `${(uncertain / total) * 100}%` }}
            className="bg-[#F59E0B] transition-all duration-300"
          />
          <div
            style={{ width: `${(unsupported / total) * 100}%` }}
            className="bg-[#EF4444] transition-all duration-300"
          />
        </div>

        {/* Labels under progress bar */}
        <div className="flex justify-between items-center mt-2 text-[11px] font-medium text-slate-500">
          <span className="text-[#16A34A]">{supPct}% supported</span>
          <span className="text-[#D97706]">{uncPct}%</span>
          <span className="text-[#EF4444]">{unsPct}% unsupp...</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryStats;
