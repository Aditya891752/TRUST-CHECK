import React from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  apiOnline?: boolean | null;
  latencyMs?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ apiOnline, latencyMs = 184 }) => {
  return (
    <header className="h-14 bg-white border-b border-line flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-navy text-white flex items-center justify-center font-bold shadow-xs">
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-navy">TrustCheck</span>
        </div>
        <span className="hidden lg:block h-5 w-px bg-line" />
        <span className="hidden lg:block text-xs sm:text-sm text-gray-500">
          Transparent AI answer reliability checker
        </span>
        <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
          <span
            className={`h-2 w-2 rounded-full ${
              apiOnline === true ? 'bg-emerald-500 animate-pulse' : apiOnline === false ? 'bg-red-500' : 'bg-amber-400'
            }`}
          />
          <span>{apiOnline === true ? 'API live' : apiOnline === false ? 'API offline' : 'Connecting...'}</span>
        </div>
        {apiOnline === true && (
          <span className="hidden md:block text-xs text-gray-400 font-mono">
            {latencyMs}ms
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <nav className="hidden md:flex gap-5 text-sm">
          <a href="#verify" className="font-semibold text-navy hover:text-emerald-700 transition-colors">
            Verify
          </a>
          <a
            href="https://github.com/Aditya891752/TRUST-CHECK"
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-navy transition-colors"
          >
            GitHub
          </a>
          <span className="text-xs self-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
            v1.2 Live
          </span>
        </nav>
        <div className="flex items-center gap-2 border-l border-line pl-4">
          <span className="h-7 w-7 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center shadow-xs">
            G
          </span>
          <span className="hidden sm:block text-xs font-medium text-slate-800">Galactic Debuggers</span>
          <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
