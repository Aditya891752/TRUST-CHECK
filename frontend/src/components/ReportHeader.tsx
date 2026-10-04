import React from 'react';

interface ReportHeaderProps {
  id: string;
  date?: string;
  language?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ id, date, language }) => {
  const displayDate = date || new Date().toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const langLabel =
    language === 'hi'
      ? 'हिन्दी (Hindi)'
      : language === 'hinglish'
      ? 'Hinglish'
      : language === 'en'
      ? 'English'
      : 'Auto-detected';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Verification report</h2>
        <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          Detected: {langLabel}
        </span>
      </div>
      <div className="mt-1 text-xs text-slate-400 font-mono flex items-center gap-2">
        <span>ref: {id || 'req_live'}</span>
        <span>•</span>
        <span>{displayDate}</span>
      </div>
    </div>
  );
};

export default ReportHeader;
