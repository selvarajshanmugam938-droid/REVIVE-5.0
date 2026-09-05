import React from 'react';
import { Globe } from 'lucide-react';
import { Language } from '../../types';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  compact = false
}) => {
  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' }
  ];

  if (compact) {
    return (
      <div className="relative inline-flex items-center">
        <select
          value={currentLanguage}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className="appearance-none bg-white/80 backdrop-blur-md border border-[#CDD4DD] text-[#22819A] font-semibold text-xs sm:text-sm rounded-xl pl-8 pr-7 py-2 cursor-pointer shadow-sm hover:border-[#22819A] transition focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
          aria-label="Select Language"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="text-gray-900 font-medium">
              {lang.native} ({lang.label})
            </option>
          ))}
        </select>
        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22819A] absolute left-2.5 pointer-events-none" />
        <div className="absolute right-2.5 pointer-events-none text-[#22819A] text-[10px]">▼</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-white/70 backdrop-blur-md p-1 rounded-2xl border border-[#CDD4DD]/80 shadow-sm">
      {languages.map((lang) => {
        const isActive = currentLanguage === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 flex items-center gap-1.5 ${
              isActive
                ? 'bg-[#22819A] text-white shadow-sm font-semibold'
                : 'text-slate-700 hover:text-[#22819A] hover:bg-[#90C2E7]/15'
            }`}
            aria-pressed={isActive}
          >
            <span>{lang.native}</span>
          </button>
        );
      })}
    </div>
  );
};
