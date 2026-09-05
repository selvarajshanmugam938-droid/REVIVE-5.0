import React, { useState, useEffect } from 'react';
import { Share2, PlusCircle, Clock, CheckCircle2, AlertTriangle, Hospital, ArrowRight, User as UserIcon, PhoneCall, FileText } from 'lucide-react';
import { Referral, Language, User } from '../../types';
import { getTranslation } from '../../locales';

interface ReferralViewProps {
  language: Language;
  user: User | null;
  userDistrict: string;
}

export const ReferralView: React.FC<ReferralViewProps> = ({
  language,
  user,
  userDistrict
}) => {
  const t = getTranslation(language);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientAge, setPatientAge] = useState('45');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '+91 98400 11223');
  const [fromFacility, setFromFacility] = useState(`${userDistrict} Primary Health Center (PHC)`);
  const [toHospitalName, setToHospitalName] = useState('Coimbatore Medical College Hospital (CMCH)');
  const [urgency, setUrgency] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('URGENT');
  const [symptoms, setSymptoms] = useState('');
  const [requiredSpecialty, setRequiredSpecialty] = useState('Cardiology & Intensive Care');
  const [submitting, setSubmitting] = useState(false);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/referrals${user ? `?userId=${user.id}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setReferrals(data.referrals || []);
      }
    } catch (err) {
      console.warn('Failed to fetch referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [user]);

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !symptoms) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          patientName,
          patientAge: parseInt(patientAge, 10) || 40,
          patientGender,
          patientPhone,
          fromFacility,
          toHospitalName,
          urgency,
          reason: symptoms,
          requiredSpecialty,
          referralDistrict: userDistrict
        })
      });

      if (res.ok) {
        setShowForm(false);
        setSymptoms('');
        fetchReferrals();
      }
    } catch (err) {
      console.warn('Referral creation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyBadge = (urg: string) => {
    switch (urg) {
      case 'EMERGENCY':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-600 text-white animate-pulse">EMERGENCY</span>;
      case 'URGENT':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white">URGENT</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">ROUTINE</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Pending Triage</span>;
      case 'VERIFIED':
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">Verified by Doctor</span>;
      case 'AMBULANCE_DISPATCHED':
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">108 Ambulance En Route</span>;
      case 'ADMITTED':
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Bed Reserved / Admitted</span>;
      default:
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">Completed</span>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Title & Action */}
      <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-teal-100 text-teal-700 rounded-2xl">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {t.pillarReferral}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {t.pillarReferralDesc} • Rural-to-Tertiary Medical Pass
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 min-h-[44px] bg-[#22819A] hover:bg-[#1a667b] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showForm ? 'Close Referral Form' : 'Create Hospital Referral Pass'}</span>
        </button>
      </div>

      {/* New Referral Creation Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitReferral}
          className="p-5 sm:p-6 bg-white rounded-3xl border-2 border-[#22819A]/30 shadow-lg space-y-4 animate-in slide-in-from-top duration-200"
        >
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            New Hospital Transfer & Referral Pass
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Murugan S"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Age & Gender</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Age"
                  className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                />
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Attendant Phone *</label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+91 94400 00000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Urgency Priority</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
              >
                <option value="ROUTINE">Routine (Consultation)</option>
                <option value="URGENT">Urgent (Within 6 Hours)</option>
                <option value="EMERGENCY">Emergency (Immediate 108)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Origin PHC / Clinic</label>
              <input
                type="text"
                value={fromFacility}
                onChange={(e) => setFromFacility(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Destination Tertiary Hospital</label>
              <input
                type="text"
                value={toHospitalName}
                onChange={(e) => setToHospitalName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Diagnosis & Symptoms *</label>
            <textarea
              required
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. Acute chest discomfort with shortness of breath. Requires cardiac catheterization and ICU monitoring."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#22819A] hover:bg-[#1a667b] text-white text-xs font-bold rounded-xl shadow-md min-h-[44px] transition active:scale-95"
            >
              {submitting ? 'Generating Digital Pass...' : 'Submit & Generate Referral Pass'}
            </button>
          </div>
        </form>
      )}

      {/* Referrals List */}
      <div className="space-y-4">
        {loading && (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-[#22819A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Fetching referral tracking records...</p>
          </div>
        )}

        {!loading && referrals.length === 0 && (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <Share2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No active referral passes</h3>
            <p className="text-xs text-slate-500">Tap "Create Hospital Referral Pass" to begin a verified transfer.</p>
          </div>
        )}

        {!loading && referrals.map((ref) => (
          <div
            key={ref.id}
            className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 hover:border-[#22819A]/50 shadow-sm transition-all duration-200 space-y-4"
          >
            {/* Header with Token Code */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                    {ref.tokenCode}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">
                    {ref.patientName} ({ref.patientAge}y / {ref.patientGender})
                  </h3>
                  {getUrgencyBadge(ref.urgency)}
                  {getStatusBadge(ref.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Requested: {new Date(ref.createdAt).toLocaleDateString()} at {new Date(ref.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${ref.patientPhone}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{ref.patientPhone}</span>
                </a>
              </div>
            </div>

            {/* Transfer Route */}
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 rounded-2xl text-xs text-slate-700 border border-slate-200">
              <div className="flex items-center gap-2 flex-1">
                <Hospital className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">From Clinic</span>
                  <span className="font-bold">{ref.fromFacility}</span>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-[#22819A] hidden sm:block shrink-0" />

              <div className="flex items-center gap-2 flex-1">
                <Hospital className="w-4 h-4 text-[#22819A] shrink-0" />
                <div>
                  <span className="text-[10px] text-[#22819A] block uppercase font-bold">To Tertiary Center</span>
                  <span className="font-bold">{ref.toHospitalName}</span>
                </div>
              </div>
            </div>

            {/* Reason & Specialist */}
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>Clinical Reason:</strong> {ref.reason}</p>
              <p><strong>Required Specialty:</strong> <span className="text-[#22819A] font-bold">{ref.requiredSpecialty}</span></p>
            </div>

            {/* Timeline Milestones */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Live Timeline</span>
              <div className="space-y-1.5">
                {ref.timeline.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-800">{step.status.replace('_', ' ')}:</span>
                    <span>{step.note}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
