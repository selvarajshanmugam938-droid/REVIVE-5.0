import React from 'react';
import { Search, Mic, ShieldAlert, MapPin, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { ReviveLogo } from './ReviveLogo';
import { LanguageSelector } from './LanguageSelector';
import { ModeSelector } from './ModeSelector';
import { User, AppMode, Language } from '../../types';
import { getTranslation } from '../../locales';
import { sampleDistricts } from '../../../server/seedData';

interface HeaderProps {
  user: User | null;
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  onOpenSearch: () => void;
  onOpenVoiceAssistant: () => void;
  onOpenEmergency: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentMode,
  onModeChange,
  language,
  onLanguageChange,
  selectedDistrict,
  onDistrictChange,
  onOpenSearch,
  onOpenVoiceAssistant,
  onOpenEmergency,
  onOpenAuth,
  onLogout
}) => {
  const t = getTranslation(language);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FEF7F8]/85 backdrop-blur-xl border-b border-[#CDD4DD]/60 shadow-xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Location */}
        <div className="flex items-center gap-3 sm:gap-5">
          <ReviveLogo size="md" showTagline={true} />

          {/* District Dropdown Selector */}
          <div className="hidden md:flex items-center gap-1.5 bg-white/80 border border-[#CDD4DD] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-[#22819A] transition">
            <MapPin className="w-3.5 h-3.5 text-[#22819A] shrink-0" />
            <span className="text-slate-400 font-normal">{t.nearbyIn}</span>
            <select
              value={selectedDistrict}
              onChange={(e) => onDistrictChange(e.target.value)}
              className="bg-transparent font-bold text-[#22819A] cursor-pointer focus:outline-none pr-1"
              aria-label="Filter healthcare facilities by district"
            >
              {sampleDistricts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Search Bar (Desktop / Tablet) */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-2">
          <button
            onClick={onOpenSearch}
            className="w-full bg-white/90 hover:bg-white border border-[#CDD4DD] hover:border-[#22819A]/60 rounded-2xl px-4 py-2 text-left text-xs sm:text-sm text-slate-500 font-medium flex items-center justify-between shadow-xs transition group"
            aria-label="Search medicine, beds, blood, organs"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-4 h-4 text-[#22819A] group-hover:scale-110 transition" />
              <span className="truncate">{t.searchPlaceholder}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
              ⌘K
            </span>
          </button>
        </div>

        {/* Right: Actions (Voice, Emergency, Language, Mode, Auth) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Search Button */}
          <button
            onClick={onOpenSearch}
            className="lg:hidden p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-white border border-[#CDD4DD] text-slate-700 hover:text-[#22819A] hover:border-[#22819A] transition flex items-center justify-center shadow-xs"
            aria-label="Open search"
          >
            <Search className="w-5 h-5 text-[#22819A]" />
          </button>

          {/* Voice Assistant Floating Header Button */}
          <button
            onClick={onOpenVoiceAssistant}
            className="relative px-3 sm:px-4 py-2 min-h-[44px] bg-[#22819A] hover:bg-[#1a667b] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition active:scale-95 group"
            aria-label="Ask REVIVE Voice Assistant"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute w-full h-full bg-[#90C2E7] rounded-full animate-ping opacity-75" />
              <Mic className="w-4 h-4 text-white relative z-10" />
            </div>
            <span className="hidden sm:inline font-semibold">{t.askRevive}</span>
          </button>

          {/* Emergency SOS Button */}
          <button
            onClick={onOpenEmergency}
            className="px-2.5 sm:px-3.5 py-2 min-h-[44px] bg-red-600 hover:bg-red-700 text-white rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-red-600/20 transition active:scale-95 border border-red-400 animate-pulse"
            aria-label="Open emergency numbers and hospital guidance"
          >
            <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            <span className="font-bold tracking-tight">{t.emergencySos}</span>
          </button>

          {/* Language Selector */}
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={onLanguageChange}
            compact={true}
          />

          {/* User Mode Selector if logged in as User */}
          {user && user.role === 'USER' && (
            <div className="hidden xl:block">
              <ModeSelector
                currentMode={currentMode}
                onModeChange={onModeChange}
                language={language}
              />
            </div>
          )}

          {/* User Account / Sign In */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1">
              <div className="flex items-center gap-2 bg-white/90 border border-[#CDD4DD] rounded-2xl p-1 sm:px-3 sm:py-1.5 shadow-xs">
                <div className="w-7 h-7 rounded-xl bg-[#22819A] text-white flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-semibold text-[#22819A] leading-tight">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title={t.logout}
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 sm:px-4 py-2 min-h-[44px] bg-white border border-[#22819A] text-[#22819A] hover:bg-[#22819A] hover:text-white rounded-2xl font-bold text-xs sm:text-sm transition shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <UserIcon className="w-4 h-4" />
              <span>{t.login}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Location Sub-bar */}
      <div className="md:hidden px-3 py-1.5 bg-[#90C2E7]/15 border-t border-[#CDD4DD]/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-[#22819A]" />
          <span>{t.nearbyIn}:</span>
          <select
            value={selectedDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="bg-transparent font-bold text-[#22819A] cursor-pointer focus:outline-none"
          >
            {sampleDistricts.map((dist) => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        </div>

        {user && user.role === 'USER' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onModeChange(currentMode === 'BASIC' ? 'ADVANCED' : 'BASIC')}
              className="px-2 py-0.5 rounded-lg bg-white text-[#22819A] font-bold text-[11px] border border-[#22819A]/30 shadow-xs"
            >
              {currentMode === 'BASIC' ? 'Switch to Advanced' : 'Switch to Basic'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
