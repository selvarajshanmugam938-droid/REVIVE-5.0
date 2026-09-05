import React, { useState } from 'react';
import { X, User as UserIcon, Store, ShieldCheck, Lock, Mail, Phone, MapPin, Sparkles } from 'lucide-react';
import { ReviveLogo } from '../common/ReviveLogo';
import { User, UserRole, Language } from '../../types';
import { getTranslation } from '../../locales';
import { sampleDistricts } from '../../../server/seedData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  onSuccess
}) => {
  const t = getTranslation(language);
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<UserRole>('USER');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Coimbatore');
  const [pharmacyName, setPharmacyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister
      ? { name, email, password, role, district, phone, pharmacyName }
      : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoRole: UserRole) => {
    setError(null);
    setLoading(true);
    let demoEmail = 'user@revive.in';
    if (demoRole === 'PHARMACY') demoEmail = 'pharmacy@revive.in';
    if (demoRole === 'ADMIN') demoEmail = 'admin@revive.in';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'demo' })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        onSuccess(data.user, data.token);
        onClose();
      } else {
        throw new Error(data.error || 'Demo login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Authentication"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#22819A] to-[#1a667b] text-white flex items-center justify-between">
          <ReviveLogo size="sm" showTagline={false} isDark={true} />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              {isRegister ? 'Create REVIVE Account' : 'Welcome to REVIVE'}
            </h3>
            <p className="text-xs text-slate-500">
              {isRegister
                ? 'Join Tamil Nadu’s rural healthcare network'
                : 'Sign in to access personalized medicine and bed alerts'}
            </p>
          </div>

          {/* Role Selector (when registering) */}
          {isRegister && (
            <div className="flex rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setRole('USER')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[40px] ${
                  role === 'USER' ? 'bg-[#22819A] text-white shadow' : 'text-slate-600'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Patient / Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('PHARMACY')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[40px] ${
                  role === 'PHARMACY' ? 'bg-[#22819A] text-white shadow' : 'text-slate-600'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Pharmacy Partner</span>
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                />
              </div>
            )}

            {isRegister && role === 'PHARMACY' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pharmacy / Medicals Name</label>
                <input
                  type="text"
                  required
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  placeholder="e.g. Sri Balaji Medicals"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                />
              </div>
            </div>

            {isRegister && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 94400 00000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-800"
                  >
                    {sampleDistricts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 min-h-[46px] bg-[#22819A] hover:bg-[#1a667b] text-white font-black text-sm rounded-xl shadow-md transition active:scale-98 disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Create Free Account' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Sign In Buttons */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block text-center">
              ⚡ Instant Demo Sign-In (1-Click)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('USER')}
                className="p-2 bg-teal-50 hover:bg-teal-100 text-[#22819A] border border-teal-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 min-h-[40px]"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Patient Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('PHARMACY')}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 min-h-[40px]"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Pharmacy Demo</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-[#22819A] font-bold hover:underline"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
