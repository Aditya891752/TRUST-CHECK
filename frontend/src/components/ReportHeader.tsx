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
    <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-slate-100">
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-base font-bold text-slate-900">Verification report</h2>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-1.5 py-0.5 rounded">
            Detected: {langLabel}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
          ID: {id || 'TC-20250426-7813'} • {displayDate}
        </span>
      </div>
    </div>
  );
};

export default ReportHeader;
