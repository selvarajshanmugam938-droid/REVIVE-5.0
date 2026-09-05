import React, { useState } from 'react';
import { Pill, Hospital, Droplet, Heart, Share2 } from 'lucide-react';
import { MedicineView } from './MedicineView';
import { BedView } from './BedView';
import { BloodView } from './BloodView';
import { OrganView } from './OrganView';
import { ReferralView } from './ReferralView';
import { User, Language } from '../../types';
import { getTranslation } from '../../locales';

interface BasicDashboardProps {
  language: Language;
  user: User | null;
  userDistrict: string;
  initialTab?: 'MEDICINE' | 'BEDS' | 'BLOOD' | 'ORGANS' | 'REFERRALS';
}

export const BasicDashboard: React.FC<BasicDashboardProps> = ({
  language,
  user,
  userDistrict,
  initialTab = 'MEDICINE'
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<'MEDICINE' | 'BEDS' | 'BLOOD' | 'ORGANS' | 'REFERRALS'>(initialTab);

  const tabs = [
    { id: 'MEDICINE', label: t.pillarMedicine, icon: Pill, color: 'text-emerald-600', activeBg: 'bg-emerald-600' },
    { id: 'BEDS', label: t.pillarBed, icon: Hospital, color: 'text-blue-600', activeBg: 'bg-blue-600' },
    { id: 'BLOOD', label: t.pillarBlood, icon: Droplet, color: 'text-rose-600', activeBg: 'bg-rose-600' },
    { id: 'ORGANS', label: t.pillarOrgan, icon: Heart, color: 'text-purple-600', activeBg: 'bg-purple-600' },
    { id: 'REFERRALS', label: t.pillarReferral, icon: Share2, color: 'text-teal-600', activeBg: 'bg-[#22819A]' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 5-Pillar Touch-Friendly Navigation Tab Bar */}
      <nav
        aria-label="Healthcare Pillars"
        className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-white/80 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl min-h-[48px] font-bold text-xs sm:text-sm transition-all duration-200 ${
                isActive
                  ? `${tab.activeBg} text-white shadow-md scale-[1.02]`
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
              } ${tab.id === 'REFERRALS' ? 'col-span-2 sm:col-span-1' : ''}`}
              aria-pressed={isActive}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : tab.color}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Active Pillar Body */}
      <div>
        {activeTab === 'MEDICINE' && <MedicineView language={language} userDistrict={userDistrict} />}
        {activeTab === 'BEDS' && <BedView language={language} userDistrict={userDistrict} />}
        {activeTab === 'BLOOD' && <BloodView language={language} userDistrict={userDistrict} />}
        {activeTab === 'ORGANS' && <OrganView language={language} userDistrict={userDistrict} />}
        {activeTab === 'REFERRALS' && <ReferralView language={language} user={user} userDistrict={userDistrict} />}
      </div>
    </div>
  );
};
