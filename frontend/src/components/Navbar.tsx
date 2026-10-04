import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface NavbarProps {
  apiOnline?: boolean | null;
  latencyMs?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ apiOnline, latencyMs = 184 }) => {
  return (
    <header className="bg-white border-b border-slate-100/80 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-[720px] mx-auto flex items-center justify-between">
        {/* Left: Brand + API Status Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
              TrustCheck
            </span>
          </div>

          {/* API live status pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-xs text-slate-600 font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                apiOnline === true
                  ? 'bg-emerald-500 animate-pulse'
                  : apiOnline === false
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
              }`}
            />
            <span>{apiOnline === true ? 'API live' : apiOnline === false ? 'API offline' : 'Connecting...'}</span>
            <span className="text-slate-400 font-mono text-[11px]">• {latencyMs}ms</span>
          </div>
        </div>

        {/* Right: Search button + Chevron down */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-xs"
            title="Search verification"
          >
            <Search size={14} className="stroke-[2.5]" />
          </button>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-700 p-1 transition-colors"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
