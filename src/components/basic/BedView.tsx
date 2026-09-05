import React, { useState, useEffect } from 'react';
import { Hospital as HospitalIcon, Search, PhoneCall, MapPin, Clock, Filter, CheckCircle2, AlertCircle, Navigation, Activity } from 'lucide-react';
import { Hospital, Language } from '../../types';
import { getTranslation } from '../../locales';

interface BedViewProps {
  language: Language;
  userDistrict: string;
}

export const BedView: React.FC<BedViewProps> = ({
  language,
  userDistrict
}) => {
  const t = getTranslation(language);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [bedCategory, setBedCategory] = useState('ALL');
  const [hospitalType, setHospitalType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        district: userDistrict,
        search: search.trim(),
        bedCategory: bedCategory,
        type: hospitalType
      });

      const res = await fetch(`/api/hospitals?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHospitals(data.hospitals || []);
      }
    } catch (err) {
      console.warn('Failed to fetch hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [userDistrict, bedCategory, hospitalType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHospitals();
  };

  const getBedCategoryLabel = (category: string) => {
    switch (category) {
      case 'ICU': return t.icuBeds;
      case 'GENERAL': return t.generalBeds;
      case 'EMERGENCY': return t.emergencyBeds;
      case 'PEDIATRIC': return t.pediatricBeds;
      case 'MATERNITY': return t.maternityBeds;
      case 'OXYGEN_SUPPORTED': return t.oxygenSupported;
      case 'ISOLATION': return t.isolationBeds;
      default: return category;
    }
  };

  const formatUpdated = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin} min ago`;
      const diffHr = Math.floor(diffMin / 60);
      return `${diffHr} hr ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Title & Filters */}
      <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
              <HospitalIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.pillarBed}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t.pillarBedDesc} • {userDistrict}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <form onSubmit={handleSearch} className="sm:col-span-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchHospitalLabel}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#22819A] focus:bg-white text-slate-900 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7] transition min-h-[44px]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 min-h-[44px] bg-[#22819A] hover:bg-[#1a667b] text-white rounded-2xl font-bold text-sm shadow-sm transition shrink-0"
            >
              Search
            </button>
          </form>

          <div className="sm:col-span-3">
            <select
              value={bedCategory}
              onChange={(e) => setBedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-2xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7] min-h-[44px]"
              aria-label="Filter by Bed Category"
            >
              <option value="ALL">All Bed Types</option>
              <option value="ICU">ICU (Intensive Care)</option>
              <option value="EMERGENCY">Emergency / Trauma</option>
              <option value="GENERAL">General Ward</option>
              <option value="PEDIATRIC">Pediatric (NICU/PICU)</option>
              <option value="MATERNITY">Maternity</option>
              <option value="OXYGEN_SUPPORTED">Oxygen Supported</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={hospitalType}
              onChange={(e) => setHospitalType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-2xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7] min-h-[44px]"
              aria-label="Filter by Hospital Type"
            >
              <option value="ALL">All Facilities</option>
              <option value="GOVERNMENT">Government Hospitals</option>
              <option value="PRIMARY_HEALTH_CENTER">PHCs / Rural Clinics</option>
              <option value="COMMUNITY_HEALTH_CENTER">CHCs</option>
              <option value="PRIVATE">Private Hospitals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hospital Bed Availability Cards */}
      <div className="space-y-4">
        {loading && (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-[#22819A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Finding live available hospital beds...</p>
          </div>
        )}

        {!loading && hospitals.length === 0 && (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <HospitalIcon className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No hospitals found matching criteria</h3>
            <p className="text-xs text-slate-500">Try choosing "All Districts" or clearing the bed filter.</p>
          </div>
        )}

        {!loading && hospitals.map((hosp) => {
          const totalAvailable = hosp.beds.reduce((acc, b) => acc + b.availableBeds, 0);

          return (
            <div
              key={hosp.id}
              className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 hover:border-[#22819A]/50 shadow-sm transition-all duration-200 space-y-4 group"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#22819A] transition">
                      {hosp.name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      hosp.type === 'GOVERNMENT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : hosp.type === 'PRIMARY_HEALTH_CENTER'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {hosp.type === 'GOVERNMENT' ? 'Govt Hospital' : hosp.type === 'PRIMARY_HEALTH_CENTER' ? 'PHC Clinic' : 'Private'}
                    </span>
                    {hosp.ambulanceAvailable && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        108 Ambulance Base
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{hosp.address}</span>
                    <span className="font-bold text-[#22819A] ml-1">({hosp.distanceKm} km)</span>
                  </p>
                </div>

                {/* Overall Availability Indicator */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block uppercase">Total Free</span>
                    <span className={`text-lg font-black ${totalAvailable > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {totalAvailable} {t.bedsCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bed Category Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {hosp.beds.map((bed) => {
                  const percentFree = Math.round((bed.availableBeds / (bed.totalBeds || 1)) * 100);
                  const isCritical = bed.category === 'ICU' || bed.category === 'EMERGENCY';

                  return (
                    <div
                      key={bed.id}
                      className={`p-3 rounded-2xl border transition ${
                        bed.availableBeds > 0
                          ? isCritical
                            ? 'bg-blue-50/70 border-blue-200'
                            : 'bg-slate-50 border-slate-200'
                          : 'bg-slate-100/60 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                        <span className="truncate">{getBedCategoryLabel(bed.category)}</span>
                        {isCritical && <Activity className="w-3 h-3 text-blue-600 shrink-0" />}
                      </div>

                      <div className="flex items-baseline justify-between mt-1">
                        <span className={`text-base sm:text-lg font-black ${
                          bed.availableBeds > 5 ? 'text-emerald-700' : bed.availableBeds > 0 ? 'text-amber-700' : 'text-slate-400'
                        }`}>
                          {bed.availableBeds}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          / {bed.totalBeds}
                        </span>
                      </div>

                      {bed.ventilatorCount > 0 && (
                        <span className="text-[9px] font-bold text-blue-700 block mt-1">
                          {bed.ventilatorCount} Ventilators
                        </span>
                      )}

                      {/* Mini Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-1 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bed.availableBeds > 5 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(100, Math.max(5, percentFree))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t.lastUpdated}: {formatUpdated(hosp.updatedAt)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${hosp.emergencyPhone || hosp.phone}`}
                    className="flex-1 sm:flex-initial px-4 py-2 min-h-[44px] bg-[#22819A] hover:bg-[#1a667b] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>{t.contact} ({hosp.phone})</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Navigation className="w-4 h-4 text-[#22819A]" />
                    <span className="hidden sm:inline">{t.getDirections}</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
