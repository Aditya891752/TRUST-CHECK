import React, { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import type { Notice } from '../lib/types';

interface InjectionBannerProps {
  notices?: Notice[];
}

export const InjectionBanner: React.FC<InjectionBannerProps> = ({ notices }) => {
  const [open, setOpen] = useState(false);

  if (!notices || notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {notices.map((n, idx) => (
        <div
          key={idx}
          className="w-full text-left rounded-xl border border-amber-300 bg-[#FEF6DC] p-3.5 sm:p-4 text-navy transition-all shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
            <div className="flex-1 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-amber-900 tracking-wide uppercase text-xs">
                  {n.code === 'instruction_in_input'
                    ? 'INSTRUCTION DETECTED: INPUT'
                    : n.code === 'instruction_in_source'
                    ? 'INSTRUCTION DETECTED: SOURCE'
                    : 'SECURITY NOTICE'}
                </span>
                {n.excerpt && (
                  <>
                    <span className="h-3.5 w-px bg-amber-400/80" />
                    <span className="text-gray-700 font-mono text-xs">
                      Sanitized excerpt: “{n.excerpt}”
                    </span>
                  </>
                )}
              </div>
              <div className="mt-1 text-gray-800">{n.message}</div>

              {open && (
                <div className="mt-2.5 pt-2 border-t border-amber-300/60 text-xs text-gray-700 leading-relaxed">
                  The flagged text was treated strictly as untrusted data and was not permitted to influence the factual verification pipeline or override instructions.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="p-1 hover:bg-amber-200/50 rounded transition-colors text-amber-800"
              title="Toggle notice details"
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InjectionBanner;
