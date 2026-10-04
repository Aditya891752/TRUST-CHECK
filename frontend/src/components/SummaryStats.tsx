import React from 'react';
import type { Claim } from '../lib/types';
import { STATUS } from '../lib/status';

interface SummaryStatsProps {
  claims: Claim[];
  summary?: { supported: number; uncertain: number; unsupported: number };
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({ claims, summary }) => {
  const total = claims.length || 1;
  const supported = summary ? summary.supported : claims.filter((c) => c.verdict === 'supported').length;
  const uncertain = summary ? summary.uncertain : claims.filter((c) => c.verdict === 'uncertain').length;
  const unsupported = summary ? summary.unsupported : claims.filter((c) => c.verdict === 'unsupported').length;

  const countMap: Record<string, number> = {
    supported,
    uncertain,
    unsupported,
  };

  const order = ['supported', 'uncertain', 'unsupported'] as const;

  const stats = [
    { label: 'Total claims', val: claims.length, color: 'text-navy' },
    { label: 'Supported', val: supported, color: STATUS.supported.num },
    { label: 'Uncertain', val: uncertain, color: STATUS.uncertain.num },
    { label: 'Unsupported', val: unsupported, color: STATUS.unsupported.num },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.6fr)] gap-2.5 sm:gap-3">
      {stats.map((s) => (
        <div key={s.label} className="card p-3 sm:p-4 bg-white border border-line rounded-xl shadow-xs">
          <div className={`text-2xl sm:text-[28px] font-semibold font-mono leading-tight ${s.color}`}>
            {s.val}
          </div>
          <div className="text-xs text-gray-500 mt-1 capitalize font-medium">{s.label}</div>
        </div>
      ))}

      {/* Proportional distribution bar card */}
      <div className="card p-3 sm:p-4 col-span-2 lg:col-span-1 bg-white border border-line rounded-xl shadow-xs flex flex-col justify-center">
        <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-1.5">
          <span>Reliability breakdown</span>
          <span>{claims.length} claims verified</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
          {order.map((s) => {
            const pct = (countMap[s] / total) * 100;
            if (pct <= 0) return null;
            return (
              <div
                key={s}
                className={`${STATUS[s].bar} transition-all duration-300`}
                style={{ width: `${pct}%` }}
                title={`${STATUS[s].label}: ${countMap[s]}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5 text-[11px] font-mono text-gray-400">
          {order.map((s) => {
            const pct = Math.round((countMap[s] / total) * 100);
            return (
              <span key={s} className="truncate">
                {countMap[s]} {STATUS[s].label.toLowerCase()} ({pct}%)
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SummaryStats;
