'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { Globe, AlertTriangle, ShieldCheck, TrendingUp, Search, Loader2, RefreshCw, Layers, Navigation2, Map } from 'lucide-react';
import { fetchHeatmapData } from '../../lib/api';
import { useActiveAudit } from '../../lib/ActiveAuditContext';

const LeafletComplianceMap = dynamic(() => import('../../components/LeafletComplianceMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center space-y-3 border border-slate-800">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      <span className="text-xs text-slate-400 font-mono">Initializing CartoDB / MapTiler GIS Tiles...</span>
    </div>
  ),
});

const WorldComplianceHeatmap = dynamic(
  () => import('../../components/WorldComplianceHeatmap').then(m => m.WorldComplianceHeatmap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center space-y-3 border border-slate-800">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <span className="text-xs text-slate-400 font-mono">Rendering Vector SVG Choropleth Map...</span>
      </div>
    ),
  }
);

function HeatMapContent() {
  const { activeAudit, activeProduct, recentInspections, selectInspection, activeInspectionId } = useActiveAudit();
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [mapMode, setMapMode] = useState<'leaflet' | 'choropleth'>('leaflet');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchHeatmapData();
      setRegions(data);
    } catch (err) {
      console.error("Failed to load heatmap data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const filteredRegions = regions.filter(r => 
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in relative z-10">
      
      {/* Background radial overlay */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/40 rounded-full blur-3xl z-[-1] pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary-600" /> Global Compliance Heat Map
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time GIS compliance intelligence & active customs alerts across international markets.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Map Mode Selector */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setMapMode('leaflet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mapMode === 'leaflet'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Leaflet GIS
            </button>
            <button
              onClick={() => setMapMode('choropleth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mapMode === 'choropleth'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Choropleth
            </button>
          </div>

          <Link
            href="/trade/corridors"
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-bold"
            title="Bilateral Trade Corridors GIS"
          >
            <Navigation2 className="w-3.5 h-3.5 text-primary-600" />
            <span>Bilateral Corridors</span>
          </Link>
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search region..." 
              className="text-xs outline-none bg-transparent w-32 sm:w-40 text-slate-700" 
            />
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-2xs"
            title="Refresh Heat Map Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Active Audit Selector Banner ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-black">
            📦
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Product GIS Audit</span>
              {activeAudit?.overall_verdict && (
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  activeAudit.overall_verdict === 'COMPLIANT'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : activeAudit.overall_verdict === 'IMPORT_PROHIBITED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {activeAudit.overall_verdict}
                </span>
              )}
            </div>
            <h2 className="text-sm font-black text-slate-800">
              {activeProduct?.title || 'Live Regulatory GIS Map'}
            </h2>
          </div>
        </div>

        {/* Audit Selection Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Switch Audit:</label>
          <select
            value={activeInspectionId || ''}
            onChange={(e) => {
              if (e.target.value) selectInspection(e.target.value);
            }}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 max-w-xs truncate"
          >
            {recentInspections.map((ins) => (
              <option key={ins.id} value={ins.id}>
                {ins.listing_title || ins.id} ({ins.overall_verdict || 'AUDIT'})
              </option>
            ))}
            {recentInspections.length === 0 && (
              <option value="">No past audits found</option>
            )}
          </select>
          <Link
            href="/audit/new"
            className="text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-xl transition-colors shadow-2xs whitespace-nowrap"
          >
            + New Scan
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Interactive Map Column */}
        <div className="lg:col-span-2">
          {mapMode === 'leaflet' ? (
            <LeafletComplianceMap 
              auditData={activeAudit}
              selectedCountry={selectedCountry}
              onSelectCountry={(code) => setSelectedCountry(code)}
            />
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-6 overflow-hidden min-h-[560px] flex flex-col justify-center items-center">
              <WorldComplianceHeatmap
                auditResult={activeAudit}
                selectedCountry={selectedCountry}
                onSelectCountry={(code) => setSelectedCountry(code)}
              />
            </div>
          )}
        </div>

        {/* Region Breakdown Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-card">
            <h3 className="font-bold text-slate-800 text-sm mb-1">Regional Risk Ratings</h3>
            <p className="text-xs text-slate-400">Aggregated live from SQLite inspection records</p>
          </div>

          {loading ? (
             <div className="flex justify-center items-center h-48 bg-white rounded-2xl border border-slate-100">
               <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
             </div>
          ) : (
            filteredRegions.map(region => (
              <div 
                key={region.id} 
                onClick={() => {
                  if (region.id === 'nam') setSelectedCountry('US');
                  if (region.id === 'eur') setSelectedCountry('DE');
                  if (region.id === 'apac') setSelectedCountry('JP');
                  if (region.id === 'latam') setSelectedCountry('BR');
                  if (region.id === 'mena') setSelectedCountry('SG');
                }}
                className="glass-panel p-4 rounded-2xl flex items-center justify-between group hover:-translate-y-0.5 transition-all cursor-pointer shadow-card border border-slate-100"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center shadow-2xs">
                    {region.risk === 'low' ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className={`w-5 h-5 ${region.risk === 'high' ? 'text-rose-600' : 'text-amber-600'}`} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary-600 transition-colors">{region.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRiskColor(region.risk)} uppercase`}>
                        {region.risk} Risk
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono font-semibold">
                        {region.pass_rate || region.score}% Pass
                        <TrendingUp className={`w-3 h-3 ${region.trend?.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-slate-800">{region.alerts}</div>
                  <div className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">Action Items</div>
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
