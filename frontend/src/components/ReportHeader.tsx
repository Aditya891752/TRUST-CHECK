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
    <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
      <div className="flex items-center gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-navy">Verification report</h2>
        <span className="rounded-full bg-slate-100 border border-slate-200/60 px-3 py-0.5 text-xs font-medium text-slate-700">
          Detected: {langLabel}
        </span>
      </div>
      <div className="text-xs text-gray-400 flex items-center gap-3">
        <span className="font-mono text-gray-500">ID: {id || 'req_live'}</span>
        <span>•</span>
        <span>{displayDate}</span>
      </div>
    </div>
  );
};

export default ReportHeader;
