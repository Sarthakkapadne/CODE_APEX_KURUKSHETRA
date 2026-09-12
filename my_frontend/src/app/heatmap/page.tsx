'use client';
import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { Globe, AlertTriangle, ShieldCheck, TrendingUp, Search, Loader2 } from 'lucide-react';
import { fetchHeatmapData } from '../../lib/api';

function HeatMapContent() {
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchHeatmapData();
        setRegions(data);
      } catch (err) {
        console.error("Failed to load heatmap data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getRiskPulse = (risk: string) => {
    switch(risk) {
      case 'low': return 'pulse-dot-green';
      case 'medium': return 'pulse-dot-amber';
      case 'high': return 'pulse-dot-red';
      default: return '';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in relative z-10">
      
      {/* Background radial overlay */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/40 rounded-full blur-3xl z-[-1] pointer-events-none"></div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary-600" /> Global Risk Map
          </h1>
          <p className="text-slate-500 mt-1">Real-time compliance heat map across international markets.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center space-x-2 bg-white border border-lexport-border rounded-xl px-3 py-2 shadow-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input placeholder="Search region or country..." className="text-sm outline-none bg-transparent w-48" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Map View Placeholder (Glassmorphism layout) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 min-h-[400px] flex flex-col relative overflow-hidden">
           <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">World Compliance Density</h2>
           <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex items-center justify-center relative">
              
              {loading ? (
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
              ) : (
                <>
                {/* Pseudo Map Markers */}
                <div className="absolute top-[30%] left-[20%] group">
                  <div className={`w-4 h-4 rounded-full shadow-lg animate-pulse ${regions.find(r => r.id === 'nam')?.risk === 'high' ? 'bg-rose-500 shadow-rose-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`}></div>
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    North America: {regions.find(r => r.id === 'nam')?.score}/100 
                  </div>
                </div>

                <div className="absolute top-[25%] left-[50%] group">
                  <div className={`w-4 h-4 rounded-full shadow-lg animate-pulse delay-75 ${regions.find(r => r.id === 'eur')?.risk === 'high' ? 'bg-rose-500 shadow-rose-500/50' : (regions.find(r => r.id === 'eur')?.risk === 'medium' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50')}`}></div>
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Europe: {regions.find(r => r.id === 'eur')?.score}/100 ({regions.find(r => r.id === 'eur')?.alerts} Alerts)
                  </div>
                </div>

                <div className="absolute top-[40%] left-[75%] group">
                  <div className={`w-4 h-4 rounded-full shadow-lg animate-pulse delay-150 ${regions.find(r => r.id === 'apac')?.risk === 'high' ? 'bg-rose-500 shadow-rose-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`}></div>
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    APAC: {regions.find(r => r.id === 'apac')?.score}/100
                  </div>
                </div>
                </>
              )}

              <Globe className="w-48 h-48 text-slate-200/50" strokeWidth={1} />
           </div>
        </div>

        {/* Region Breakdown */}
        <div className="space-y-4">
          {loading ? (
             <div className="flex justify-center items-center h-48">
               <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
             </div>
          ) : (
            regions.map(region => (
              <div key={region.id} className="glass-panel p-4 rounded-xl flex items-center justify-between group hover:-translate-y-1 transition-transform cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center shadow-sm">
                    {region.risk === 'low' ? <ShieldCheck className="w-6 h-6 text-emerald-500" /> : <AlertTriangle className={`w-6 h-6 ${region.risk === 'high' ? 'text-rose-500' : 'text-amber-500'}`} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{region.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRiskColor(region.risk)} uppercase`}>
                        {region.risk} Risk
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        {region.score}/100 
                        <TrendingUp className={`w-3 h-3 ${region.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-slate-800">{region.alerts}</div>
                  <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Active Alerts</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function HeatMapPage() {
  return (
    <AppShell>
      <HeatMapContent />
    </AppShell>
  );
}
