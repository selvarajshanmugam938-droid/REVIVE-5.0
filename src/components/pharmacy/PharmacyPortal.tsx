import React, { useState, useEffect } from 'react';
import { Store, Plus, Search, CheckCircle2, AlertCircle, Trash2, Edit, Clock, Phone, RefreshCw, ShieldCheck, MapPin } from 'lucide-react';
import { Pharmacy, MedicineInventoryItem, Medicine, User, Language } from '../../types';
import { getTranslation } from '../../locales';

interface PharmacyPortalProps {
  user: User;
  language: Language;
}

export const PharmacyPortal: React.FC<PharmacyPortalProps> = ({
  user,
  language
}) => {
  const t = getTranslation(language);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [inventory, setInventory] = useState<MedicineInventoryItem[]>([]);
  const [catalogMedicines, setCatalogMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Medicine Form
  const [selectedMedId, setSelectedMedId] = useState('');
  const [stockQuantity, setStockQuantity] = useState(50);
  const [price, setPrice] = useState(30);
  const [rackLocation, setRackLocation] = useState('Rack A-1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPharmacyData = async () => {
    if (!user.pharmacyId) return;
    setLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([
        fetch(`/api/pharmacies/${user.pharmacyId}`),
        fetch('/api/medicines')
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setPharmacy(pData.pharmacy);
        setInventory(pData.inventory || []);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setCatalogMedicines(mData.medicines || []);
        if (mData.medicines?.length > 0) {
          setSelectedMedId(mData.medicines[0].id);
        }
      }
    } catch (e) {
      console.warn('Pharmacy data fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacyData();
  }, [user.pharmacyId]);

  const handleUpdateStock = async (itemId: string, newQty: number) => {
    const qty = Math.max(0, newQty);
    const status = qty > 10 ? 'AVAILABLE' : qty > 0 ? 'LIMITED' : 'OUT_OF_STOCK';

    // Optimistic UI update
    setInventory(prev => prev.map(item => item.id === itemId ? { ...item, stockQuantity: qty, status: status as any } : item));

    try {
      await fetch(`/api/pharmacy/inventory/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: qty, status })
      });
    } catch (err) {
      console.warn('Stock update error:', err);
      fetchPharmacyData();
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacy || !selectedMedId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pharmacy/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: pharmacy.id,
          medicineId: selectedMedId,
          stockQuantity: Number(stockQuantity),
          price: Number(price),
          rackLocation
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchPharmacyData();
      }
    } catch (err) {
      console.warn('Failed to add medicine:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.medicineName.toLowerCase().includes(search.toLowerCase()) ||
    item.genericName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Pharmacy Header Profile Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#22819A] to-[#175d70] rounded-3xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 text-[#FEF7F8]">
              PHARMACY PORTAL
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/30 text-emerald-100 border border-emerald-300/40">
              Verified License: {pharmacy?.licenseNumber || 'TN-CBE-2026-9812'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">{pharmacy?.name || `${user.name}'s Medicals`}</h2>
          <p className="text-xs sm:text-sm text-[#90C2E7] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{pharmacy?.address || `${user.district} Main Bazaar`}, {pharmacy?.district || user.district}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 min-h-[44px] bg-[#90C2E7] hover:bg-[#7eb6e0] text-[#22819A] font-extrabold text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addStock}</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="p-4 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter pharmacy stock items..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
          <span>Total Medicines Listed: {inventory.length}</span>
          <span>•</span>
          <span className="text-emerald-700">
            In Stock: {inventory.filter(i => i.stockQuantity > 0).length}
          </span>
        </div>
      </div>

      {/* Inventory Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Medicine & Generic</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Live Stock Units</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{item.medicineName}</div>
                    <div className="text-[11px] text-slate-500">{item.genericName} • {item.rackLocation || 'Rack A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-teal-50 text-[#22819A] px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    ₹{item.price}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-base font-black ${item.stockQuantity > 10 ? 'text-emerald-600' : item.stockQuantity > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {item.stockQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : item.status === 'LIMITED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => handleUpdateStock(item.id, item.stockQuantity - 10)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs min-h-[36px] min-w-[36px] transition active:scale-95"
                        title="Reduce 10 units"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleUpdateStock(item.id, item.stockQuantity + 10)}
                        className="px-2.5 py-1.5 bg-[#22819A] hover:bg-[#1a667b] text-white font-bold rounded-lg text-xs min-h-[36px] min-w-[36px] transition active:scale-95"
                        title="Add 10 units"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => handleUpdateStock(item.id, item.stockQuantity + 50)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs min-h-[36px] min-w-[36px] transition active:scale-95"
                        title="Restock 50 units"
                      >
                        +50
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 w-full max-w-md space-y-4 animate-in fade-in duration-150">
            <h3 className="text-lg font-bold text-slate-900">Add Medicine to Store Inventory</h3>

            <form onSubmit={handleAddMedicine} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Medicine from Essential List</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                >
                  {catalogMedicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.genericName} - {m.strength})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rack / Storage Location</label>
                <input
                  type="text"
                  value={rackLocation}
                  onChange={(e) => setRackLocation(e.target.value)}
                  placeholder="e.g. Counter Shelf 2B"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#22819A] hover:bg-[#1a667b] text-white text-xs font-bold rounded-xl shadow-md min-h-[44px]"
                >
                  {isSubmitting ? 'Saving...' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
