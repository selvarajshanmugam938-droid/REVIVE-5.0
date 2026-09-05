import React, { useState, useEffect } from 'react';
import { Cpu, Activity, Thermometer, Gauge, Zap, RefreshCw, Radio, CheckCircle2, AlertCircle } from 'lucide-react';
import { IoTDevice, Language } from '../../types';
import { getTranslation } from '../../locales';

interface IoTMonitorProps {
  language: Language;
}

export const IoTMonitor: React.FC<IoTMonitorProps> = ({ language }) => {
  const t = getTranslation(language);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastPulse, setLastPulse] = useState<string>('Just now');

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/iot/devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (e) {
      console.warn('IoT fetch error:', e);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleSimulatePulse = async (deviceCode: string) => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/iot/simulate-pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceCode,
          telemetry: {
            occupancy: Math.random() > 0.4,
            pressure: Math.round(55 + Math.random() * 35),
            heartRate: Math.round(72 + Math.random() * 18),
            spO2: Math.round(96 + Math.random() * 3)
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDevices(prev => prev.map(d => d.deviceCode === deviceCode ? data.device : d));
        setLastPulse(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.warn('Simulate pulse error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {t.iotDashboard}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              ESP32 / LoRaWAN Connected Bed Sensors & Oxygen Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            <span>Telemetry Bus Live</span>
          </span>
        </div>
      </div>

      {/* IoT Hardware Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((device) => {
          return (
            <div
              key={device.id}
              className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-indigo-300 transition"
            >
              {/* Device Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                      {device.deviceCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      ONLINE
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-2">{device.facilityName}</h3>
                  <p className="text-xs text-slate-500">{device.wardName} • {device.type.replace('_', ' ')}</p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400 block font-semibold">Signal RSSI</span>
                  <span className="font-bold text-slate-700">{device.signalRssi} dBm</span>
                </div>
              </div>

              {/* Telemetry Metrics Display */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {device.telemetry.occupancy !== undefined && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Bed Status</span>
                    <span className={`text-sm font-black ${device.telemetry.occupancy ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {device.telemetry.occupancy ? 'Occupied' : 'Vacant'}
                    </span>
                  </div>
                )}

                {device.telemetry.pressure !== undefined && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Pressure Sensor</span>
                    <span className="text-sm font-black text-slate-800">
                      {device.telemetry.pressure} mmHg
                    </span>
                  </div>
                )}

                {device.telemetry.heartRate && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Pulse Rate</span>
                    <span className="text-sm font-black text-indigo-700">
                      {device.telemetry.heartRate} bpm
                    </span>
                  </div>
                )}

                {device.telemetry.temperatureC !== undefined && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Cold-Chain Temp</span>
                    <span className="text-sm font-black text-blue-700">
                      {device.telemetry.temperatureC} °C
                    </span>
                  </div>
                )}

                {device.telemetry.manifoldPressurePsi !== undefined && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Oxygen Pipeline</span>
                    <span className="text-sm font-black text-emerald-700">
                      {device.telemetry.manifoldPressurePsi} PSI
                    </span>
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Battery Life</span>
                  <span className="text-sm font-black text-slate-700">
                    {device.batteryPercentage}%
                  </span>
                </div>
              </div>

              {/* Action Button: Simulate Hardware Transmission */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Last Sync: {new Date(device.lastPing).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <button
                  onClick={() => handleSimulatePulse(device.deviceCode)}
                  disabled={isSimulating}
                  className="px-4 py-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Simulate IoT Pulse</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
