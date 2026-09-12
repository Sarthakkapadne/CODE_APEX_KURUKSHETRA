'use client';
import React, { useState, useEffect } from 'react';
import { Radio, AlertOctagon, Bell, RefreshCw, Zap } from 'lucide-react';
import { getSimulationStatus, toggleSimulation } from '../lib/api';

interface RegulatorySimulatorProps {
  onSimulationToggled: () => void;
}

export default function RegulatorySimulator({ onSimulationToggled }: RegulatorySimulatorProps) {
  const [simStates, setSimStates] = useState<Record<string, boolean>>({
    sim_us_epa_crackdown: false,
    sim_eu_peroxide_crackdown: false,
    sim_ca_rockers_ban: false,
  });
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    getSimulationStatus()
      .then(res => setSimStates(res))
      .catch(() => null);
  }, []);

  const handleToggle = async (simId: string) => {
    const nextState = !simStates[simId];
    setLoadingId(simId);
    try {
      const res = await toggleSimulation(simId, nextState);
      setSimStates(prev => ({ ...prev, [simId]: nextState }));
      if (nextState && res.alert) {
        setActiveAlert(res.alert);
      } else {
        setActiveAlert(null);
      }
      onSimulationToggled();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center space-x-2">
              <span>Regulatory Change Simulator & Live Broadcast</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                LIVE DEMO TRIGGER
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Toggle a regulatory shock mid-demo to watch matrix cells dynamically flip from Green to Red.
            </p>
          </div>
        </div>
      </div>

      {/* Broadcast Alert Banner if Active */}
      {activeAlert && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/50 flex items-start space-x-3 text-xs animate-in slide-in-from-top duration-300">
          <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1">
            <div className="font-bold text-amber-300 flex items-center space-x-2">
              <span>[REGULATORY BROADCAST DISPATCHED]</span>
              <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded font-mono">{activeAlert.authority}</span>
            </div>
            <p className="text-slate-200">{activeAlert.summary}</p>
            <p className="text-[11px] font-semibold text-rose-300">{activeAlert.impact}</p>
          </div>
        </div>
      )}

      {/* Simulation Toggle Switches */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            id: 'sim_us_epa_crackdown',
            label: 'US EPA Emergency Antimicrobial Directive',
            desc: 'Crackdown on subtle antimicrobial & hygienic claims on cutting boards / cleaners',
            flag: '🇺🇸',
          },
          {
            id: 'sim_eu_peroxide_crackdown',
            label: 'EU SCCS 0.05% Peroxide Directive',
            desc: 'Lowers direct-to-consumer peroxide limit from 0.1% to 0.05% w/w',
            flag: '🇪🇺',
          },
          {
            id: 'sim_ca_rockers_ban',
            label: 'Canada Schedule 2 Broadening',
            desc: 'Expands baby walker criminal ban to include motorized infant rockers & bouncers',
            flag: '🇨🇦',
          },
        ].map(sim => {
          const isActive = simStates[sim.id];
          const isLoading = loadingId === sim.id;

          return (
            <div
              key={sim.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                isActive
                  ? 'bg-amber-950/30 border-amber-500/60 shadow-md'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span>{sim.flag}</span>
                  <span className="text-xs font-bold text-white">{sim.label}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{sim.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(sim.id)}
                disabled={isLoading}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  isActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>{isActive ? 'Simulated Rule Active (Active Violation)' : 'Trigger Simulated Shock'}</span>
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
