import React from 'react';
import type { Notice } from '../lib/types';

interface NoticeBannerProps {
  notices?: Notice[];
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ notices }) => {
  if (!notices || notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 mb-6" role="status" aria-live="polite">
      {notices.map((notice, idx) => (
        <div
          key={`${notice.code}-${idx}`}
          className="rounded-lg border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-sm text-slate-300 backdrop-blur-sm shadow-sm"
        >
          <p className="leading-relaxed">{notice.message}</p>
          {notice.excerpt && (
            <div className="mt-2 text-xs font-mono text-slate-400 bg-slate-900/70 border border-slate-800 rounded px-2.5 py-1.5 inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="text-slate-500 mr-1.5 select-none">Detected:</span>
              &ldquo;{notice.excerpt}&rdquo;
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
