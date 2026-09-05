import React, { useEffect, useRef, useState } from 'react';
import { Hospital, Pharmacy, BloodInventoryItem, OrganInventoryItem, Language } from '../../types';
import { getTranslation } from '../../locales';
import { MapPin, PhoneCall, Navigation, Layers, Hospital as HospIcon, Pill, Droplet, Heart } from 'lucide-react';

interface InteractiveMapProps {
  language: Language;
  userDistrict: string;
  hospitals: Hospital[];
  pharmacies: Pharmacy[];
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  language,
  userDistrict,
  hospitals,
  pharmacies
}) => {
  const t = getTranslation(language);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'HOSPITALS' | 'PHARMACIES'>('ALL');
  const [selectedFacility, setSelectedFacility] = useState<any>(null);

  // Initialize or re-center Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Check if Leaflet is available on window
    const L = (window as any).L;
    if (!L) {
      console.warn('Leaflet not loaded on window');
      return;
    }

    // Default center on first hospital or Coimbatore coordinates
    const defaultCenter = hospitals[0]
      ? [hospitals[0].lat, hospitals[0].lng]
      : [11.0168, 76.9558];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 11,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(defaultCenter, 11);
    }

    return () => {
      // Map cleanup if needed on unmount
    };
  }, [userDistrict]);

  // Update Markers when filter or facilities change
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear previous markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Helper for custom SVG icon
    const createMarkerIcon = (color: string, label: string) => {
      return L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background-color: ${color}; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white; cursor: pointer;">
            ${label}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
    };

    // Add Hospitals
    if (activeFilter === 'ALL' || activeFilter === 'HOSPITALS') {
      hospitals.forEach(hosp => {
        const totalBeds = hosp.beds.reduce((a, b) => a + b.availableBeds, 0);
        const icon = createMarkerIcon('#2563EB', '🏥');
        const marker = L.marker([hosp.lat, hosp.lng], { icon }).addTo(map);

        marker.on('click', () => {
          setSelectedFacility({
            type: 'HOSPITAL',
            data: hosp
          });
        });

        markersRef.current.push(marker);
      });
    }

    // Add Pharmacies
    if (activeFilter === 'ALL' || activeFilter === 'PHARMACIES') {
      pharmacies.forEach(ph => {
        const icon = createMarkerIcon('#059669', '💊');
        const marker = L.marker([ph.lat, ph.lng], { icon }).addTo(map);

        marker.on('click', () => {
          setSelectedFacility({
            type: 'PHARMACY',
            data: ph
          });
        });

        markersRef.current.push(marker);
      });
    }
  }, [hospitals, pharmacies, activeFilter]);

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="p-4 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#22819A]" />
            <span>Interactive Health GIS Map ({userDistrict})</span>
          </h2>
          <p className="text-xs text-slate-500">Live spatial availability of emergency care and pharmacies</p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'ALL' ? 'bg-[#22819A] text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({hospitals.length + pharmacies.length})
          </button>
          <button
            onClick={() => setActiveFilter('HOSPITALS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
              activeFilter === 'HOSPITALS' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HospIcon className="w-3.5 h-3.5" />
            <span>Hospitals ({hospitals.length})</span>
          </button>
          <button
            onClick={() => setActiveFilter('PHARMACIES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
              activeFilter === 'PHARMACIES' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Pharmacies ({pharmacies.length})</span>
          </button>
        </div>
      </div>

      {/* Map Canvas + Selected Facility Drawer */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-md h-[500px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Facility Detail Card */}
        {selectedFacility && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-10 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedFacility.type === 'HOSPITAL' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {selectedFacility.type}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  {selectedFacility.data.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{selectedFacility.data.address}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedFacility(null)}
                className="p-1 text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {selectedFacility.type === 'HOSPITAL' && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {selectedFacility.data.beds.slice(0, 3).map((b: any) => (
                  <div key={b.id} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-600 block text-[10px] truncate">{b.category}</span>
                    <span className="font-black text-emerald-600 text-sm">{b.availableBeds} free</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <a
                href={`tel:${selectedFacility.data.phone}`}
                className="flex-1 px-3.5 py-2 min-h-[44px] bg-[#22819A] hover:bg-[#1a667b] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call ({selectedFacility.data.phone})</span>
              </a>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.data.lat},${selectedFacility.data.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5 text-[#22819A]" />
                <span>Navigate</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
