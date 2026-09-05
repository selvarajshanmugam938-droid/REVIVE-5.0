import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { OfflineBanner } from './components/common/OfflineBanner';
import { EmergencyModal } from './components/common/EmergencyModal';
import { VoiceAssistantModal } from './components/common/VoiceAssistantModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { BasicDashboard } from './components/basic/BasicDashboard';
import { AdvancedDashboard } from './components/advanced/AdvancedDashboard';
import { PharmacyPortal } from './components/pharmacy/PharmacyPortal';
import { User, AppMode, Language, Hospital, Pharmacy, GlobalSearchResult } from './types';
import { getTranslation } from './locales';
import { Bell, CheckCircle2, AlertCircle, X } from 'lucide-react';

export function App() {
  // App state
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('revive_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [mode, setMode] = useState<AppMode>(user?.preferences?.mode || 'BASIC');
  const [language, setLanguage] = useState<Language>(user?.preferences?.language || 'en');
  const [district, setDistrict] = useState<string>(user?.district || 'Coimbatore');

  // Facilities data cache for high responsiveness
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Live Toast Notifications
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; type: 'info' | 'success' | 'alert' }[]>([]);

  const t = getTranslation(language);

  // Sync mode & language changes to user preferences
  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    if (user) {
      const updated = { ...user, preferences: { ...user.preferences, mode: newMode } };
      setUser(updated);
      localStorage.setItem('revive_user', JSON.stringify(updated));
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    if (user) {
      const updated = { ...user, preferences: { ...user.preferences, language: newLang } };
      setUser(updated);
      localStorage.setItem('revive_user', JSON.stringify(updated));
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    if (user) {
      const updated = { ...user, district: newDist };
      setUser(updated);
      localStorage.setItem('revive_user', JSON.stringify(updated));
    }
  };

  const handleAuthSuccess = (authenticatedUser: User, token: string) => {
    setUser(authenticatedUser);
    localStorage.setItem('revive_user', JSON.stringify(authenticatedUser));
    localStorage.setItem('revive_token', token);
    if (authenticatedUser.preferences?.language) {
      setLanguage(authenticatedUser.preferences.language);
    }
    if (authenticatedUser.preferences?.mode) {
      setMode(authenticatedUser.preferences.mode);
    }
    if (authenticatedUser.district) {
      setDistrict(authenticatedUser.district);
    }
    addToast('Signed In', `Welcome back, ${authenticatedUser.name}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('revive_user');
    localStorage.removeItem('revive_token');
    setMode('BASIC');
    addToast('Signed Out', 'You have been signed out successfully.', 'info');
  };

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-3), { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Keyboard shortcut ⌘K / Ctrl+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch initial facilities
  const loadFacilities = async () => {
    try {
      const [hRes, pRes] = await Promise.all([
        fetch(`/api/hospitals?district=${district}`),
        fetch('/api/pharmacies')
      ]);
      if (hRes.ok) {
        const hData = await hRes.json();
        setHospitals(hData.hospitals || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPharmacies(pData.pharmacies || []);
      }
    } catch (e) {
      console.warn('Initial data load error:', e);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, [district]);

  // Real-Time Server-Sent Events Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('stock_updated', (e) => {
        try {
          const data = JSON.parse(e.data);
          addToast('Stock Update', `${data.medicineName} stock updated to ${data.stockQuantity} units at ${data.pharmacyName}`, 'info');
        } catch (err) {}
      });

      eventSource.addEventListener('bed_updated', (e) => {
        try {
          const data = JSON.parse(e.data);
          addToast('Bed Status Update', `${data.category} bed count updated at ${data.hospitalName}`, 'info');
          loadFacilities();
        } catch (err) {}
      });

      eventSource.addEventListener('referral_created', (e) => {
        try {
          const data = JSON.parse(e.data);
          addToast('Referral Transfer Active', `Patient ${data.patientName} referral generated (${data.tokenCode})`, 'success');
        } catch (err) {}
      });
    } catch (err) {
      console.warn('SSE connection notice:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleSelectSearchResult = (result: GlobalSearchResult) => {
    if (result.type === 'HOSPITAL') {
      setMode('ADVANCED');
    }
  };

  return (
    <div className="min-h-screen bg-[#FEF7F8] text-slate-900 flex flex-col font-sans selection:bg-[#90C2E7]/40 selection:text-[#22819A]">
      {/* Offline Status Bar */}
      <OfflineBanner language={language} />

      {/* Main Header */}
      <Header
        user={user}
        currentMode={mode}
        onModeChange={handleModeChange}
        language={language}
        onLanguageChange={handleLanguageChange}
        selectedDistrict={district}
        onDistrictChange={handleDistrictChange}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Role-based Router */}
        {user && user.role === 'PHARMACY' ? (
          <PharmacyPortal user={user} language={language} />
        ) : mode === 'BASIC' ? (
          <BasicDashboard
            language={language}
            user={user}
            userDistrict={district}
          />
        ) : (
          <AdvancedDashboard
            language={language}
            user={user}
            userDistrict={district}
            hospitals={hospitals}
            pharmacies={pharmacies}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white/70 border-t border-[#CDD4DD]/60 py-6 px-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-slate-700">
            REVIVE — Rural Healthcare Access & Telemetry System
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Emergency 108</span>
            <span>•</span>
            <span>Helpline 104</span>
            <span>•</span>
            <span>TRANSTAN Certified</span>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3.5 rounded-2xl shadow-xl border text-xs font-semibold flex items-start gap-2.5 backdrop-blur-md pointer-events-auto animate-in slide-in-from-right duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-900'
                : t.type === 'alert'
                ? 'bg-red-50/95 border-red-300 text-red-900'
                : 'bg-slate-900/95 text-white border-slate-700'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Bell className="w-4 h-4 text-[#90C2E7] shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-bold block">{t.title}</span>
              <span className="font-normal opacity-90">{t.message}</span>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Modals */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        language={language}
        hospitals={hospitals}
        userDistrict={district}
      />

      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        language={language}
        userDistrict={district}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        language={language}
        userDistrict={district}
        onSelectResult={handleSelectSearchResult}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        language={language}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
export default App;
