'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Globe, Navigation2, Plane, Ship, ArrowRight, Layers,
  RefreshCw, ShieldCheck, AlertTriangle, XCircle, Filter,
  Building2, Sparkles, Plus, Info, ExternalLink, ChevronRight,
  TrendingUp, BarChart3, CheckCircle2
} from 'lucide-react';
import AppShell from '../../../components/layout/AppShell';

const LeafletTradeMap = dynamic(() => import('../../../components/LeafletTradeMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full rounded-3xl bg-slate-950 flex flex-col items-center justify-center space-y-3 border border-slate-800">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-mono">Initializing High-Speed GIS Bilateral Trade Engine...</span>
    </div>
  ),
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const SOVEREIGN_HUBS = [
  { code: 'US', name: 'United States', flag: '🇺🇸', hub: 'JFK / LAX / Chicago' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺', hub: 'Frankfurt / Rotterdam' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', hub: 'Frankfurt FRA / Hamburg' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', hub: 'London LHR / Felixstowe' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', hub: 'Toronto YYZ / Vancouver' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', hub: 'Tokyo NRT / Yokohama' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', hub: 'Sydney SYD / Melbourne' },
  { code: 'IN', name: 'India', flag: '🇮🇳', hub: 'Mumbai BOM / JNPT Port' },
  { code: 'CN', name: 'China', flag: '🇨🇳', hub: 'Shanghai PVG / Shenzhen' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', hub: 'Ho Chi Minh SGN / Hai Phong' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', hub: 'Sao Paulo GRU / Santos' },
];

export default function BilateralCorridorsPage() {
  const [focalHub, setFocalHub] = useState<string>('US');
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const loadMarketData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/economics/markets`);
      if (res.ok) {
        const data = await res.json();
        setMarketData(data);
      }
    } catch (e) {
      console.warn('Could not fetch market economics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketData();
  }, []);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">
              <Navigation2 className="w-3.5 h-3.5" /> Bilateral Trade Logistics & Corridors
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Globe className="w-8 h-8 text-primary-600" /> Global Trade Corridors GIS
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Geodesic flight trajectories, ocean freight transit estimations, and statutory customs tariff checkpoints across 11 sovereign nations.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/trade"
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4 text-slate-500" /> Sovereign Economics
            </Link>
            <Link
              href="/heatmap"
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-emerald-600" /> Risk Heatmap
            </Link>
            <Link
              href="/audit/new"
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all shadow-blue flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Audit Corridor
            </Link>
          </div>
        </div>

        {/* Main Interactive Leaflet Bilateral Corridors Map */}
        <div className="w-full">
          <LeafletTradeMap
            selectedMarket={focalHub}
            onMarketSelect={(code: string) => setFocalHub(code)}
          />
        </div>

        {/* Bilateral Corridors Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SOVEREIGN_HUBS.filter(h => h.code !== focalHub).map(target => {
            const tgtData = marketData[target.code] || {};
            const deMinimis = tgtData.de_minimis_threshold_usd !== undefined ? `$${tgtData.de_minimis_threshold_usd}` : '$800';
            const duty = tgtData.standard_duty_rate || '3.0% - 6.5%';
            const vat = tgtData.vat_gst_rate || 'Standard VAT';
            const agency = tgtData.governing_agency || 'Customs Authority';
            const airDays = tgtData.air_transit_days || 3;
            const oceanDays = tgtData.ocean_transit_days || 24;

            return (
              <div
                key={target.code}
                onClick={() => setFocalHub(target.code)}
                className="bg-white border border-slate-100 hover:border-primary-300 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{target.flag}</span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-primary-600 transition-colors">
                        {focalHub} → {target.code} ({target.name})
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">{target.hub}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl mb-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">De Minimis:</span>
                    <span className="font-bold text-slate-800">{deMinimis}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Duty Rate:</span>
                    <span className="font-bold text-slate-800">{duty}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Air Transit:</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Plane className="w-3 h-3 text-sky-500" /> ~{airDays} days
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Ocean Freight:</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Ship className="w-3 h-3 text-indigo-500" /> ~{oceanDays} days
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-50 text-slate-500">
                  <span className="truncate max-w-[190px]">{agency}</span>
                  <Link
                    href={`/audit/new`}
                    className="text-primary-600 font-bold hover:underline flex items-center gap-0.5"
                    onClick={e => e.stopPropagation()}
                  >
                    Test Corridor →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
