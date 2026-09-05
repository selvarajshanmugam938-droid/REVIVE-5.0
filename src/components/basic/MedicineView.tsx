import React, { useState, useEffect } from 'react';
import { Pill, Search, Store, PhoneCall, MapPin, Clock, Filter, AlertCircle, CheckCircle2, Navigation } from 'lucide-react';
import { MedicineInventoryItem, Language } from '../../types';
import { getTranslation } from '../../locales';

interface MedicineViewProps {
  language: Language;
  userDistrict: string;
}

export const MedicineView: React.FC<MedicineViewProps> = ({
  language,
  userDistrict
}) => {
  const t = getTranslation(language);
  const [items, setItems] = useState<MedicineInventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [only24x7, setOnly24x7] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        district: userDistrict,
        search: search.trim(),
        statusFilter: statusFilter,
        only24x7: only24x7 ? 'true' : 'false'
      });

      const res = await fetch(`/api/medicine-availability?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to fetch medicine availability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [userDistrict, statusFilter, only24x7]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const getStatusBadge = (status: string, stock: number) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.available} ({stock} {t.units})</span>
          </span>
        );
      case 'LIMITED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.limited} ({stock} {t.units})</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
            <span>{t.outOfStock}</span>
          </span>
        );
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
      {/* Title & Filter Control Bar */}
      <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.pillarMedicine}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t.pillarMedicineDesc} • {userDistrict}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 min-h-[44px]">
              <input
                type="checkbox"
                checked={only24x7}
                onChange={(e) => setOnly24x7(e.target.checked)}
                className="w-4 h-4 text-[#22819A] rounded focus:ring-0 cursor-pointer"
              />
              <span>24x7 Pharmacies Only</span>
            </label>
          </div>
        </div>

        {/* Search Bar + Stock Status Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchMedicineLabel}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#22819A] focus:bg-white text-slate-900 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7] transition min-h-[44px]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] bg-[#22819A] hover:bg-[#1a667b] text-white rounded-2xl font-bold text-sm shadow-sm transition active:scale-95 shrink-0"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-2xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7] min-h-[44px]"
              aria-label="Filter by availability status"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="AVAILABLE">Available Only</option>
              <option value="LIMITED">Limited Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Inventory List */}
      <div className="space-y-3 sm:space-y-4">
        {loading && (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-[#22819A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Checking live pharmacy stock...</p>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">{t.noMedicinesFound}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{t.tryAnotherSearch}</p>
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setOnly24x7(false); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition min-h-[44px]"
            >
              Reset Filters
            </button>
          </div>
        )}

        {!loading && items.map((item) => (
          <div
            key={item.id}
            className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 hover:border-[#22819A]/50 shadow-sm transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
          >
            {/* Left: Medicine Info */}
            <div className="space-y-2 flex-1">
              <div className="flex items-start sm:items-center justify-between sm:justify-start gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#22819A] transition">
                  {item.medicineName}
                </h3>
                {getStatusBadge(item.status, item.stockQuantity)}
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                <span className="font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {item.genericName}
                </span>
                <span className="bg-teal-50 text-[#22819A] px-2.5 py-0.5 rounded-lg font-semibold border border-teal-100">
                  {item.category}
                </span>
                <span className="text-slate-500">
                  ₹{item.price} / pack
                </span>
              </div>

              {/* Pharmacy Location Details */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Store className="w-4 h-4 text-[#22819A] shrink-0" />
                  <span>{item.pharmacyName}</span>
                  {item.is24x7 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800">
                      24x7
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{item.pharmacyAddress}</span>
                  <span className="font-bold text-[#22819A] ml-1">({item.distanceKm} km)</span>
                </div>

                <div className="flex items-center gap-1 text-slate-400 sm:ml-auto">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{t.lastUpdated}: {formatUpdated(item.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
              <a
                href={`tel:${item.pharmacyPhone}`}
                className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{t.contact}</span>
              </a>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${item.pharmacyLat},${item.pharmacyLng}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95"
                title="Open Directions"
              >
                <Navigation className="w-4 h-4 text-[#22819A]" />
                <span className="hidden sm:inline">{t.getDirections}</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
