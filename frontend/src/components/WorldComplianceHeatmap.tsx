'use client';

import React, { useState } from 'react';
import { TradeEconomicsItem, AuditResponse } from '@/lib/types';

interface WorldComplianceHeatmapProps {
  auditResult: AuditResponse | null;
  selectedCountry?: string | null;
  onSelectCountry?: (countryCode: string) => void;
}

interface MarketGeoData {
  code: string;
  name: string;
  flag: string;
  agency: string;
  deMinimis: string;
  avgTariff: string;
  cx: number;
  cy: number;
  pathD: string;
}

// Stylized Mercator projection SVG paths for major global trading jurisdictions
const GLOBAL_MARKETS: MarketGeoData[] = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    agency: 'CBP / FDA / EPA / CPSC',
    deMinimis: '$800 (19 U.S.C. § 1321 Sec 321)',
    avgTariff: '0.0% - 4.9%',
    cx: 190,
    cy: 165,
    pathD: 'M 130,135 L 245,130 L 255,160 L 265,175 L 250,210 L 210,215 L 185,225 L 160,205 L 135,170 Z',
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    agency: 'CBSA / Health Canada / CPLA',
    deMinimis: 'CAD $20 (Non-USMCA) / $150',
    avgTariff: '0.0% - 6.5%',
    cx: 185,
    cy: 95,
    pathD: 'M 115,70 L 250,65 L 245,125 L 130,130 L 115,100 Z',
  },
  {
    code: 'EU',
    name: 'European Union',
    flag: '🇪🇺',
    agency: 'EU Customs / RAPEX / GPSR / CE',
    deMinimis: '€150 (VAT payable from €0)',
    avgTariff: '0.0% - 6.5%',
    cx: 470,
    cy: 145,
    pathD: 'M 435,120 L 495,115 L 505,155 L 485,185 L 450,180 L 430,150 Z',
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    agency: 'HMRC / OPSS / UKCA',
    deMinimis: '£135 (VAT collected at checkout)',
    avgTariff: '0.0% - 4.0%',
    cx: 425,
    cy: 120,
    pathD: 'M 415,105 L 430,105 L 435,135 L 420,135 Z',
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    agency: 'Japan Customs / PMDA / PSE',
    deMinimis: '¥10,000 (~$70 USD)',
    avgTariff: '0.0% - 5.0%',
    cx: 730,
    cy: 165,
    pathD: 'M 720,145 L 740,150 L 735,185 L 715,180 Z',
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    agency: 'ABF / TGA / ACCC',
    deMinimis: 'AUD $1,000',
    avgTariff: '0.0% - 5.0%',
    cx: 720,
    cy: 310,
    pathD: 'M 680,280 L 760,285 L 755,345 L 685,340 Z',
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    agency: 'CBIC / CDSCO / BIS',
    deMinimis: 'None (Commercial entry rules)',
    avgTariff: '10.0% - 20.0%',
    cx: 590,
    cy: 215,
    pathD: 'M 565,180 L 615,180 L 600,240 L 575,240 Z',
  },
  {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    agency: 'GACC / NMPA / CCC',
    deMinimis: 'RMB 50 (~$7 USD)',
    avgTariff: '5.0% - 15.0%',
    cx: 650,
    cy: 170,
    pathD: 'M 610,135 L 690,135 L 700,195 L 630,205 Z',
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    agency: 'SAT / COFEPRIS / NOM',
    deMinimis: '$50 USD (T-MEC)',
    avgTariff: '0.0% - 15.0%',
    cx: 175,
    cy: 245,
    pathD: 'M 155,220 L 205,220 L 195,270 L 165,250 Z',
  },
];

export const WorldComplianceHeatmap: React.FC<WorldComplianceHeatmapProps> = ({
  auditResult,
  selectedCountry,
  onSelectCountry,
}) => {
  const [hoveredMarket, setHoveredMarket] = useState<MarketGeoData | null>(null);

  if (!auditResult) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-500">
        Run an inspection audit to view the global compliance heatmap.
      </div>
    );
  }

  // Compute status per market
  const getMarketStatus = (code: string) => {
    const isTarget = auditResult.destination_markets?.includes(code);
    if (!isTarget) return { type: 'non_target', label: 'Out of Scope', color: '#334155', stroke: '#475569' };

    const summary = auditResult.summary_by_country?.[code];
    if (summary) {
      if (summary.violation > 0) {
        return { type: 'violation', label: `${summary.violation} Critical Violations`, color: '#ef4444', stroke: '#b91c1c' };
      }
      if (summary.escalation > 0 || summary.warning > 0) {
        return { type: 'warning', label: `${summary.warning + summary.escalation} Action Items`, color: '#f59e0b', stroke: '#d97706' };
      }
      if (summary.pass > 0) {
        return { type: 'pass', label: '100% Cleared', color: '#10b981', stroke: '#059669' };
      }
    }

    // Default target market fallback
    return { type: 'evaluating', label: 'Evaluated', color: '#3b82f6', stroke: '#2563eb' };
  };

  // Find economics data for a country
  const getTradeItem = (code: string): TradeEconomicsItem | undefined => {
    return auditResult.trade_economics?.find((t) => t.country_code === code);
  };

  // Summary counts
  const targetMarkets = GLOBAL_MARKETS.filter((m) => auditResult.destination_markets?.includes(m.code));
  const clearedCount = targetMarkets.filter((m) => getMarketStatus(m.code).type === 'pass').length;
  const warningCount = targetMarkets.filter((m) => getMarketStatus(m.code).type === 'warning').length;
  const blockedCount = targetMarkets.filter((m) => getMarketStatus(m.code).type === 'violation').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Global Compliance & Tariff Heatmap
                <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono rounded-full border border-indigo-500/30">
                  WCO & Multi-Jurisdiction
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time cross-border market clearance, de minimis thresholds, and landed customs tariffs
              </p>
            </div>
          </div>
        </div>

        {/* Executive Metric Cards */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">{clearedCount} Cleared</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs text-slate-300 font-medium">{warningCount} Remediation</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs text-slate-300 font-medium">{blockedCount} High Risk</span>
          </div>
        </div>
      </div>

      {/* Main Map Canvas & Country Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG World Heatmap */}
        <div className="lg:col-span-8 bg-slate-950/80 rounded-xl border border-slate-800/80 p-4 relative min-h-[380px] flex flex-col justify-between">
          {/* Map Controls & Status Pill */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Interactive Projection (Click country to filter matrix)
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Cleared</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Warning</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Violation</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-700 inline-block" /> Non-Target</span>
            </div>
          </div>

          {/* SVG Map */}
          <div className="w-full relative flex items-center justify-center">
            <svg
              viewBox="80 50 720 320"
              className="w-full h-auto max-h-[340px] drop-shadow-md select-none"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))' }}
            >
              {/* Background World Grid Lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect x="80" y="50" width="720" height="320" fill="url(#grid)" opacity="0.3" />

              {/* Equator & Tropic Reference Lines */}
              <line x1="80" y1="210" x2="800" y2="210" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
              <text x="90" y="206" fill="#475569" fontSize="8" fontFamily="monospace">EQUATOR 0°</text>

              {/* Render Countries */}
              {GLOBAL_MARKETS.map((market) => {
                const status = getMarketStatus(market.code);
                const isSelected = selectedCountry === market.code;
                const isHovered = hoveredMarket?.code === market.code;
                const isTarget = auditResult.destination_markets?.includes(market.code);

                return (
                  <g
                    key={market.code}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredMarket(market)}
                    onMouseLeave={() => setHoveredMarket(null)}
                    onClick={() => onSelectCountry && onSelectCountry(market.code)}
                  >
                    {/* Country Landmass Geometry */}
                    <path
                      d={market.pathD}
                      fill={status.color}
                      stroke={isSelected ? '#ffffff' : status.stroke}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                      fillOpacity={isTarget ? (isHovered || isSelected ? 0.95 : 0.75) : 0.25}
                      className="transition-all duration-150 hover:brightness-125"
                    />

                    {/* Country Code Label & Pin */}
                    <circle
                      cx={market.cx}
                      cy={market.cy}
                      r={isHovered || isSelected ? 5 : 3.5}
                      fill={status.color}
                      stroke="#0f172a"
                      strokeWidth={1.5}
                    />
                    <text
                      x={market.cx}
                      y={market.cy - 7}
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : '#e2e8f0'}
                      fontSize={isHovered || isSelected ? '11' : '9.5'}
                      fontWeight="bold"
                      className="pointer-events-none drop-shadow"
                    >
                      {market.code}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Tooltip Card at Bottom of Map */}
          {hoveredMarket && (
            <div className="mt-3 p-3 bg-slate-900/95 border border-slate-700/80 rounded-lg shadow-xl backdrop-blur-md flex items-center justify-between animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{hoveredMarket.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{hoveredMarket.name} ({hoveredMarket.code})</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-medium text-white"
                      style={{ backgroundColor: getMarketStatus(hoveredMarket.code).color }}
                    >
                      {getMarketStatus(hoveredMarket.code).label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Jurisdiction: {hoveredMarket.agency}</span>
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="text-slate-300 font-mono font-medium">De Minimis: {hoveredMarket.deMinimis}</div>
                <div className="text-slate-400">Est. Duty: {getTradeItem(hoveredMarket.code)?.estimated_duty_rate || hoveredMarket.avgTariff}</div>
              </div>
            </div>
          )}
        </div>

        {/* Target Market Breakdown List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Audited Jurisdictions ({targetMarkets.length})
            </h3>
            {selectedCountry && (
              <button
                onClick={() => onSelectCountry && onSelectCountry('')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {targetMarkets.map((m) => {
              const status = getMarketStatus(m.code);
              const isSelected = selectedCountry === m.code;
              const trade = getTradeItem(m.code);

              return (
                <div
                  key={m.code}
                  onClick={() => onSelectCountry && onSelectCountry(m.code)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{m.flag}</span>
                      <div>
                        <span className="text-sm font-semibold text-white">{m.name}</span>
                        <span className="text-[11px] text-slate-400 block font-mono">{m.agency.split('/')[0]}</span>
                      </div>
                    </div>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${status.color}20`,
                        color: status.color,
                        border: `1px solid ${status.color}40`,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* De Minimis & Tariff Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">De Minimis Threshold</span>
                      <span className="font-mono text-slate-300 font-medium">{m.deMinimis.split('(')[0]}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Landed Duty</span>
                      <span className="font-mono text-slate-300 font-medium">
                        {trade?.estimated_duty_rate || m.avgTariff}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
