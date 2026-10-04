import React from 'react';
import type { Notice } from '../lib/types';

interface InjectionBannerProps {
  notices?: Notice[];
}

export const InjectionBanner: React.FC<InjectionBannerProps> = ({ notices }) => {
  if (!notices || notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {notices.map((n, idx) => (
        <section
          key={idx}
          className="bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-xs text-left"
          data-purpose="security-quarantine-banner"
        >
          <div className="flex items-start space-x-2.5">
            <div className="flex-shrink-0 text-amber-600 mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  clipRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  fillRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-900 tracking-tight text-[11px] uppercase">
                  {n.code === 'instruction_in_input'
                    ? 'Instruction Detected: Input'
                    : n.code === 'instruction_in_source'
                    ? 'Instruction Detected: Source'
                    : 'Security Notice'}
                </h4>
                <span className="text-amber-700/80 text-[10px]">Quarantined</span>
              </div>
              {n.excerpt && (
                <p className="text-amber-800 text-[11px] mt-0.5">
                  <span className="font-semibold text-amber-950">Sanitized excerpt:</span> "{n.excerpt}"
                </p>
              )}
              <p className="text-amber-700/90 text-[10px] mt-1 leading-snug">
                Malicious instructions quarantined without affecting verification logic.
              </p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default InjectionBanner;
