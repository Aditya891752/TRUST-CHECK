import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Notice } from '../lib/types';

interface InjectionBannerProps {
  notices?: Notice[];
}

export const InjectionBanner: React.FC<InjectionBannerProps> = ({ notices }) => {
  if (!notices || notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {notices.map((n, idx) => (
        <div
          key={idx}
          className="w-full text-left rounded-2xl border border-amber-200/90 bg-[#FEF9EE] p-4 text-slate-800 transition-all shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-800 tracking-wide uppercase text-[11px]">
                  {n.code === 'instruction_in_input'
                    ? 'INSTRUCTION DETECTED: INPUT'
                    : n.code === 'instruction_in_source'
                    ? 'INSTRUCTION DETECTED: SOURCE'
                    : 'SECURITY NOTICE'}
                </span>
                <span className="text-[11px] font-medium text-amber-700/80">
                  Quarantined
                </span>
              </div>

              {n.excerpt && (
                <div className="text-slate-700 text-xs mb-1">
                  <span className="font-semibold text-slate-800">Sanitized excerpt:</span>{' '}
                  <span className="italic">“{n.excerpt}”</span>
                </div>
              )}

              <div className="text-amber-800/90 text-[11px]">
                Malicious instructions quarantined without affecting verification logic.
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InjectionBanner;
