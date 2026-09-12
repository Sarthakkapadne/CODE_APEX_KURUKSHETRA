'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, ArrowUpDown, Info, Plus, Globe, Layers, 
  Loader2, RefreshCw, CheckCircle2, ShieldCheck, TrendingDown, TrendingUp, Navigation2,
  Sparkles, HelpCircle, ArrowRight, DollarSign, Calculator, FileCheck
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { useActiveAudit } from '../../lib/ActiveAuditContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface TradeMarketItem {
  country_code: string;
  country_name: string;
  flag: string;
  de_minimis: number;
  currency: string;
  vat_scheme: string;
  duty: string;
  complexity: number;
  friction_rank: number;
  recommendation: string;
  seller_rationale?: string;
}

const EXPLAINABLE_AI_RATIONALE: Record<string, { title: string; why: string; seller_tip: string }> = {
  US: {
    title: '#1 Global E-Commerce Destination: Section 321 Exemption',
    why: 'Under 19 U.S.C. § 1321 (Section 321), direct-to-consumer parcels valued up to $800 USD enter completely free of customs duty and import sales tax, requiring minimal formal customs documentation.',
    seller_tip: 'Direct air courier or postal parcel shipping eliminates customs duty for items priced under $800 USD. No broker fee is required.',
  },
  AU: {
    title: '#2 Lowest Entry Friction: $1,000 AUD High De Minimis',
    why: "Australia maintains one of the world's highest duty-free thresholds ($1,000 AUD / ~$660 USD). Goods under $1,000 AUD clear without customs duty.",
    seller_tip: 'Marketplaces (Amazon/eBay) collect 10% GST on low-value sales; shipments enter duty-free without border delays.',
  },
  SG: {
    title: '#3 Seamless ASEAN Free Port: $400 SGD De Minimis',
    why: 'Singapore operates an ultra-efficient customs single-window with 0% baseline customs duty on general consumer merchandise.',
    seller_tip: 'Only 9% Overseas Vendor Registration (OVR) GST applies for low-value goods; zero customs duty on cosmetics or electronics.',
  },
  UK: {
    title: '#4 Streamlined Post-Brexit Gateway: £135 Low Value Scheme',
    why: 'Shipments under £135 GBP enter duty-free, but sellers must register for UK VAT or sell through online marketplaces that collect 20% VAT at checkout.',
    seller_tip: 'Ensure your commercial invoice clearly displays your UK VAT registration number or marketplace IOSS/LVIG tax code.',
  },
  DE: {
    title: '#5 Central European Hub: €150 Duty Relief with Mandatory IOSS',
    why: 'Customs duties are 0% below €150, but Germany strictly enforces 19% import VAT from €0.01 via IOSS, plus mandatory LUCID packaging dual-system contracts.',
    seller_tip: 'Register on LUCID (VerpackG) before shipping. Without a LUCID ID, carriers and Amazon Germany will block inventory.',
  },
  EU: {
    title: '#6 27-Nation Single Market: €150 De Minimis with GPSR Safety',
    why: 'Duty-free under €150, but requires Import One-Stop Shop (IOSS) registration for VAT from €0.01 and an EU Responsible Person under the General Product Safety Regulation (GPSR).',
    seller_tip: 'Consolidate multiple orders to utilize single IOSS filing across all 27 EU member states.',
  },
  JP: {
    title: '#7 High-Value Asian Market: ¥10,000 Simplified Entry',
    why: 'De minimis is ¥10,000 JPY (~$67 USD). Shipments above ¥10,000 require 10% Japanese Consumption Tax (JCT) and simplified 3-5% customs tariffs.',
    seller_tip: 'Japanese customers expect Japanese ingredient labelling and documentation conforming to the PMD Act.',
  },
  CA: {
    title: '#8 Strict Northern Border: $20 CAD Ultra-Low De Minimis',
    why: 'Canada enforces an exceptionally low de minimis of $20 CAD (~$15 USD) for commercial parcels, meaning virtually all commercial shipments trigger GST/HST (5-15%).',
    seller_tip: 'Ship Delivery Duty Paid (DDP) to prevent Canadian buyers from abandoning parcels due to unexpected CBSA collection fees at delivery.',
  },
  VN: {
    title: '#9 Fast-Growing ASEAN Corridor: 1,000,000 VND Threshold',
    why: 'De minimis is 1M VND (~$40 USD). Shipments above this value face 10-20% standard customs duty plus 8-10% VAT and DAV certification requirements for cosmetics.',
    seller_tip: 'Partner with local bonded clearance agents in Hanoi or Ho Chi Minh City for expedited clearance.',
  },
  IN: {
    title: '#10 High Customs Protection: ₹0 De Minimis & Mandatory BIS',
    why: 'India has no commercial de minimis (₹0 INR). Every parcel pays Basic Customs Duty (10-70%), 10% Social Welfare Surcharge, and 18% IGST, plus CDSCO registration for cosmetics.',
    seller_tip: 'Commercial shipments require an active Importer Exporter Code (IEC) and CDSCO or BIS compliance certifications prior to customs dispatch.',
  },
  BR: {
    title: '#11 High Tariff Protection: Remessa Conforme Program',
    why: 'Brazil imposes a 20% federal tariff under $50 USD and 60% above $50 USD, plus 17% state ICMS tax, making Brazil one of the most protected cross-border markets.',
    seller_tip: 'Enrol in the official Remessa Conforme program to enable automatic digital customs clearance and avoid weeks of postal warehouse detention.',
  },
};

export default function TradePage() {
  const { activeProduct, activeAudit } = useActiveAudit();
  const [markets, setMarkets] = useState<TradeMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'friction_rank' | 'complexity' | 'de_minimis'>('friction_rank');
  const [selectedMarket, setSelectedMarket] = useState<string>('US');

  const fetchTradeMarkets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/economics/markets`);
      if (res.ok) {
        const data = await res.json();
        const list: TradeMarketItem[] = Object.values(data).map((m: any, idx: number) => {
          const code = m.country_code || 'US';
          const aiExpl = EXPLAINABLE_AI_RATIONALE[code];
          return {
            country_code: code,
            country_name: m.country_name || 'Market',
            flag: m.flag || '🌐',
            de_minimis: m.de_minimis_threshold_usd || m.de_minimis_threshold || 800,
            currency: m.currency_code || 'USD',
            vat_scheme: m.vat_gst_rate || 'No VAT / Section 321',
            duty: m.standard_duty_rate || '0-5%',
            complexity: m.customs_complexity_score || m.complexity_score || 3,
            friction_rank: idx + 1,
            recommendation: aiExpl?.why || m.de_minimis_description || 'Evaluated against international customs regulations.',
            seller_rationale: aiExpl?.seller_tip || 'Ensure proper customs documentation.',
          };
        });
        setMarkets(list);
      }
    } catch (e) {
      console.warn("Failed to fetch markets dynamically:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeMarkets();
  }, []);

  const sortedData = [...markets].sort((a, b) => {
    if (sortBy === 'friction_rank') return a.friction_rank - b.friction_rank;
    if (sortBy === 'complexity') return a.complexity - b.complexity;
    if (sortBy === 'de_minimis') return b.de_minimis - a.de_minimis;
    return 0;
  });

  const selectedItem = markets.find(m => m.country_code === selectedMarket) || markets[0];
  const selectedAiInfo = EXPLAINABLE_AI_RATIONALE[selectedMarket] || EXPLAINABLE_AI_RATIONALE['US'];

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">
              <BarChart3 className="w-3.5 h-3.5" /> Fiscal & Customs Comparison Engine
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Globe className="w-8 h-8 text-primary-600" /> Sovereign Trade Economics & Tariffs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Compare de minimis thresholds, import duty rates, VAT/GST regimes, and customs friction across 11 international markets.
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/trade/corridors"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
            >
              <Navigation2 className="w-4 h-4 text-primary-400" />
              <span>Bilateral Corridors GIS Map</span>
            </Link>
            <Link
              href="/chat"
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all shadow-2xs flex items-center gap-2 text-xs font-bold"
            >
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Profit & Tariff Calculator</span>
            </Link>
            <button
              onClick={fetchTradeMarkets}
              disabled={loading}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Market Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary-600' : ''}`} />
              <span>Sync Markets</span>
            </button>
          </div>
        </div>

        {/* Explainable AI Rationale Banner */}
        <div className="bg-gradient-to-br from-primary-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-primary-500/20 text-primary-300 border border-primary-400/30">
                <Sparkles className="w-5 h-5 text-primary-300" />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary-300">
                  Explainable AI Rationale · Cross-Border Market Ranking
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Why is the United States Ranked #1 for Cross-Border E-Commerce?
                </h2>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4" /> Section 321 Exemption
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The US permits shipments valued up to <strong className="text-white">$800 USD</strong> to enter free of both duty and sales tax. Direct-to-consumer parcel imports require zero customs brokerage intervention.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Info className="w-4 h-4" /> EU/UK Comparison
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  While the UK and EU provide duty-free thresholds under £135 / €150, they mandate VAT collection from <strong className="text-white">€0.01</strong> via IOSS or local registration, adding fiscal complexity.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <TrendingDown className="w-4 h-4" /> Emerging Market Friction
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Markets like India (₹0 de minimis + BIS testing) and Brazil (20-60% import duties) enforce heavy tariff barriers and stringent regulatory checkpoints.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Market Deep-Dive Card */}
        {selectedItem && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedItem.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{selectedItem.country_name}</h3>
                    <span className="text-xs font-mono font-bold text-slate-400">({selectedItem.country_code})</span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                      Rank #{selectedItem.friction_rank} Entry Friction
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {selectedAiInfo?.title || selectedItem.recommendation}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/chat`}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5" /> Calculate Net Profit in {selectedItem.country_code}
                </Link>
                <Link
                  href="/audit/new"
                  className="px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-blue"
                >
                  <Plus className="w-3.5 h-3.5" /> Audit Listing for {selectedItem.country_code}
                </Link>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">De Minimis Threshold</span>
                <span className="text-lg font-black text-slate-800 font-mono mt-1 block">
                  {selectedItem.currency} {selectedItem.de_minimis.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {selectedItem.de_minimis > 500 ? 'Generous (Duty & Tax-Free)' : selectedItem.de_minimis > 0 ? 'Partial Exemption' : 'Zero De Minimis'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Standard Customs Tariff</span>
                <span className="text-lg font-black text-slate-800 font-mono mt-1 block">
                  {selectedItem.duty}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Base rate for category
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Import VAT / GST Regime</span>
                <span className="text-lg font-black text-slate-800 mt-1 block truncate">
                  {selectedItem.vat_scheme}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Point-of-sale tax requirement
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Customs Complexity</span>
                <span className="text-lg font-black text-slate-800 font-mono mt-1 block">
                  {selectedItem.complexity} / 10
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {selectedItem.complexity <= 3 ? 'Low Friction' : selectedItem.complexity <= 6 ? 'Moderate Inspection' : 'High Bureaucracy'}
                </span>
              </div>
            </div>

            <div className="bg-primary-50/60 border border-primary-100 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed">
              <strong className="text-primary-800 font-bold block mb-1">Explainable AI Seller Guidance:</strong>
              {selectedAiInfo?.seller_tip || selectedItem.seller_rationale}
            </div>
          </div>
        )}

        {/* Sort Controls & Market Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sort by:</span>
              {[
                { key: 'friction_rank', label: 'Entry Friction (Low to High)' },
                { key: 'complexity', label: 'Customs Complexity' },
                { key: 'de_minimis', label: 'De Minimis (High to Low)' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key as any)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl border transition-all ${
                    sortBy === opt.key ? 'bg-primary-600 border-primary-600 text-white shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
                  }`}
                >
                  <ArrowUpDown className="w-3 h-3" />
                  {opt.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400 font-medium">
              {sortedData.length} sovereign trade jurisdictions loaded
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedData.map((e, i) => (
              <div
                key={e.country_code}
                onClick={() => setSelectedMarket(e.country_code)}
                className={`bg-white border rounded-2xl p-5 shadow-card hover:shadow-card-hover feature-card transition-all cursor-pointer ${
                  selectedMarket === e.country_code ? 'ring-2 ring-primary-500 border-primary-200' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{e.flag}</span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{e.country_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{e.country_code}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    i === 0 ? 'bg-emerald-100 text-emerald-700' : i <= 2 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    #{e.friction_rank} Rank
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">De Minimis:</span>
                    <span className="font-bold text-slate-800 font-mono">{e.currency} {e.de_minimis.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Standard Duty:</span>
                    <span className="font-bold text-slate-800 font-mono">{e.duty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">VAT/GST Regime:</span>
                    <span className="font-semibold text-slate-700 text-right">{e.vat_scheme}</span>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-500">Customs Complexity:</span>
                      <span className="font-bold text-slate-800 font-mono">{e.complexity}/10</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          e.complexity <= 3 ? 'bg-emerald-500' : e.complexity <= 6 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${(e.complexity / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-slate-500 line-clamp-2 italic border-t border-slate-50 pt-2">
                  {e.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dedicated Bilateral GIS Callout Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 flex-shrink-0">
              <Navigation2 className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Want to visualize freight shipping corridors & transit times?</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect Great-Circle geodesic flight trajectories, ocean container transit days, and supplier in-routes from China, Vietnam, and India.
              </p>
            </div>
          </div>
          <Link
            href="/trade/corridors"
            className="px-5 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-blue flex items-center gap-2 flex-shrink-0 transition-colors"
          >
            <span>Launch Bilateral GIS Engine</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </AppShell>
  );
}
