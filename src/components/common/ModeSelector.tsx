import React from 'react';
import { Sparkles, LayoutGrid } from 'lucide-react';
import { AppMode, Language } from '../../types';
import { getTranslation } from '../../locales';

interface ModeSelectorProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  language: Language;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeChange,
  language
}) => {
  const t = getTranslation(language);

  return (
    <div
      role="group"
      aria-label="Application Mode Selector"
      className="inline-flex p-1 bg-white/80 backdrop-blur-md rounded-2xl border border-[#CDD4DD] shadow-sm"
    >
      <button
        type="button"
        onClick={() => onModeChange('BASIC')}
        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
          currentMode === 'BASIC'
            ? 'bg-[#22819A] text-white shadow-md'
            : 'text-slate-600 hover:text-[#22819A] hover:bg-[#90C2E7]/10'
        }`}
      >
        <LayoutGrid className="w-4 h-4 shrink-0" />
        <span>{t.basicMode}</span>
      </button>

      <button
        type="button"
        onClick={() => onModeChange('ADVANCED')}
        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
          currentMode === 'ADVANCED'
            ? 'bg-[#22819A] text-white shadow-md'
            : 'text-slate-600 hover:text-[#22819A] hover:bg-[#90C2E7]/10'
        }`}
      >
        <Sparkles className="w-4 h-4 shrink-0 text-[#90C2E7]" />
        <span>{t.advancedMode}</span>
      </button>
    </div>
  );
};
