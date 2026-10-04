import React from 'react';
import { ChevronDown } from 'lucide-react';

interface NavbarProps {
  apiOnline?: boolean | null;
  latencyMs?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ apiOnline, latencyMs = 184 }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 transition-shadow shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo and App Identity */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-lg font-bold tracking-tight text-slate-900">TrustCheck</span>
          </div>
          {/* Status indicator pill */}
          <div className="flex items-center bg-slate-100 px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-600 space-x-1.5 border border-slate-200/60">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                apiOnline === true
                  ? 'bg-emerald-500 animate-pulse'
                  : apiOnline === false
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
              }`}
            />
            <span>{apiOnline === true ? 'API live' : apiOnline === false ? 'API offline' : 'Connecting...'}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-500">{latencyMs}ms</span>
          </div>
        </div>

        {/* Right actions: User avatar / menu trigger */}
        <div className="flex items-center space-x-2">
          <button
            aria-label="Account profile"
            className="flex items-center space-x-1.5 p-1 rounded-full hover:bg-slate-100 transition"
            type="button"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              G
            </div>
            <ChevronDown size={14} className="text-slate-500" />
          </button>
        </div>
      </div>
      {/* Subtitle badge line */}
      <div className="max-w-md mx-auto">
        <p className="text-[11px] text-slate-500 mt-1 truncate">Transparent AI answer reliability checker</p>
      </div>
    </header>
  );
};

export default Navbar;
