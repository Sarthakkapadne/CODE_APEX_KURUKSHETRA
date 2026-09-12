'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { AuditResponse, TradeEconomicsItem } from '../lib/types';
import { fetchMarketEconomicsReference } from '../lib/api';
import {
  Globe, ShieldCheck, AlertTriangle, AlertOctagon,
  MinusCircle, Filter, Maximize2, ExternalLink, Info, CheckCircle2
} from 'lucide-react';

export interface MarketComplianceNode {
  code: string;
  name: string;
  flag: string;
  coordinates: [number, number];
  agency: string;
  defaultDeMinimis: string;
  defaultDuty: string;
}

export const JURISDICTION_MARKETS: Record<string, MarketComplianceNode> = {
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    coordinates: [37.09, -95.71],
    agency: 'US CBP / FDA / CPSC / EPA',
    defaultDeMinimis: '$800 USD (Section 321)',
    defaultDuty: '0% under $800, 3-6% standard',
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    coordinates: [56.13, -106.34],
    agency: 'CBSA / Health Canada / CFIA',
    defaultDeMinimis: '$20 CAD (~$15 USD)',
    defaultDuty: 'Avg 5-8% + GST/PST',
  },
  EU: {
    code: 'EU',
    name: 'European Union (Germany)',
    flag: '🇪🇺',
    coordinates: [51.16, 10.45],
    agency: 'EU DG TAXUD / RAPEX / EMA',
    defaultDeMinimis: '€150 Duty / €0 VAT (IOSS)',
    defaultDuty: '0% duty under €150, 19-25% VAT',
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    coordinates: [55.37, -3.43],
    agency: 'HMRC / OPSS / MHRA',
    defaultDeMinimis: '£135 GBP (~$175 USD)',
    defaultDuty: '0% duty under £135, 20% standard VAT',
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    coordinates: [36.20, 138.25],
    agency: 'Japan Customs / PMDA / METI',
    defaultDeMinimis: '¥10,000 JPY (~$67 USD)',
    defaultDuty: 'Simplified flat 3-5% or duty-free',
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    coordinates: [-25.27, 133.77],
    agency: 'ABF / TGA / ACCC',
    defaultDeMinimis: '$1,000 AUD (~$660 USD)',
    defaultDuty: '5% duty + 10% GST above $1,000',
  },
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    coordinates: [20.59, 78.96],
    agency: 'CBIC / FSSAI / CDSCO',
    defaultDeMinimis: '₹0 INR (Standard Clearance)',
    defaultDuty: 'Standard BCD + SWS + IGST',
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    coordinates: [51.16, 10.45],
    agency: 'BfR / VerpackG LUCID / ElektroG',
    defaultDeMinimis: '€0 VAT / €150 Duty (IOSS)',
    defaultDuty: '0% duty under €150, 19% MwSt',
  },
  CN: {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    coordinates: [35.86, 104.19],
    agency: 'GACC / NMPA / SAMR',
    defaultDeMinimis: '50 RMB (~$7 USD)',
    defaultDuty: '9.1% preferential CBEC rate',
  },
  VN: {
    code: 'VN',
    name: 'Vietnam',
    flag: '🇻🇳',
    coordinates: [14.05, 108.27],
    agency: 'General Dept of Vietnam Customs / DAV',
    defaultDeMinimis: '1,000,000 VND (~$40 USD)',
    defaultDuty: '0% under 1M VND, 8-10% VAT',
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    coordinates: [1.35, 103.82],
    agency: 'Singapore Customs / HSA / EnterpriseSG',
    defaultDeMinimis: '$400 SGD (~$300 USD)',
    defaultDuty: '0% duty (except liquor/tobacco), 9% GST',
  },
};

export interface LeafletComplianceMapProps {
  auditData: AuditResponse | null;
  selectedCountry?: string | null;
  onSelectCountry?: (countryCode: string) => void;
  className?: string;
}

export type ComplianceTier = 'cleared' | 'warning' | 'banned' | 'out_of_scope';

export default function LeafletComplianceMap({
  auditData,
  selectedCountry,
  onSelectCountry,
  className = '',
}: LeafletComplianceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [activeCountry, setActiveCountry] = useState<string | null>(selectedCountry || null);
  const [jurisdictionMarkets, setJurisdictionMarkets] = useState<Record<string, MarketComplianceNode>>(JURISDICTION_MARKETS);

  // Dynamically load all sovereign market geo-profiles from database
  useEffect(() => {
    let active = true;
    fetchMarketEconomicsReference()
      .then(mkts => {
        if (active && mkts) {
          const updated: Record<string, MarketComplianceNode> = {};
          Object.entries(mkts).forEach(([code, m]: [string, any]) => {
            updated[code] = {
              code: m.country_code,
              name: m.country_name,
              flag: m.flag || '🌐',
              coordinates: [m.latitude, m.longitude],
              agency: m.governing_agency || 'Customs Agency',
              defaultDeMinimis: m.de_minimis_description || `$${m.de_minimis_threshold} ${m.currency_code}`,
              defaultDuty: m.standard_duty_rate || 'Standard Rate',
            };
          });
          if (Object.keys(updated).length > 0) {
            setJurisdictionMarkets(updated);
          }
        }
      })
      .catch(err => console.warn('Could not fetch market coordinates from db:', err));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (selectedCountry !== undefined) {
      setActiveCountry(selectedCountry);
    }
  }, [selectedCountry]);

  // Compute status for each market based on auditData.summary_by_country and destination_markets
  const marketStatuses = useMemo(() => {
    const statuses: Record<string, {
      tier: ComplianceTier;
      color: string;
      label: string;
      passCount: number;
      warnCount: number;
      violationCount: number;
      escalationCount: number;
      dutyRate: string;
      deMinimis: string;
    }> = {};

    const auditedMarkets = auditData?.destination_markets || ['US', 'EU', 'UK', 'CA', 'JP'];
    const summary = auditData?.summary_by_country || {};

    Object.entries(jurisdictionMarkets).forEach(([code, node]) => {
      const isAudited = auditedMarkets.includes(code);
      const counts = summary[code] || { pass: 0, warning: 0, violation: 0, escalation: 0 };

      // Landed Duty from audit trade_economics
      const eco = auditData?.trade_economics?.find((e: TradeEconomicsItem) => e.country_code === code);
      const dutyRate = eco?.estimated_duty_rate || node.defaultDuty;
      const deMinimis = eco ? `${eco.de_minimis_currency} ${eco.de_minimis_threshold}` : node.defaultDeMinimis;

      if (!isAudited) {
        statuses[code] = {
          tier: 'out_of_scope',
          color: '#475569', // ⚪ Slate
          label: 'Out of Scope',
          passCount: counts.pass,
          warnCount: counts.warning,
          violationCount: counts.violation,
          escalationCount: counts.escalation,
          dutyRate,
          deMinimis,
        };
      } else if (counts.violation > 0 || counts.escalation > 0) {
        statuses[code] = {
          tier: 'banned',
          color: '#ef4444', // 🔴 Red
          label: 'High Customs Seizure Risk / Banned',
          passCount: counts.pass,
          warnCount: counts.warning,
          violationCount: counts.violation,
          escalationCount: counts.escalation,
          dutyRate,
          deMinimis,
        };
      } else if (counts.warning > 0) {
        statuses[code] = {
          tier: 'warning',
          color: '#f59e0b', // 🟡 Amber
          label: 'Remediation Required',
          passCount: counts.pass,
          warnCount: counts.warning,
          violationCount: counts.violation,
          escalationCount: counts.escalation,
          dutyRate,
          deMinimis,
        };
      } else {
        statuses[code] = {
          tier: 'cleared',
          color: '#10b981', // 🟢 Green
          label: '100% Cleared (0 Violations)',
          passCount: counts.pass,
          warnCount: counts.warning,
          violationCount: counts.violation,
          escalationCount: counts.escalation,
          dutyRate,
          deMinimis,
        };
      }
    });

    return statuses;
  }, [auditData]);

  // Leaflet Map Initialization
  useEffect(() => {
    let map: import('leaflet').Map | undefined;
    let isDisposed = false;

    async function initMap() {
      const L = await import('leaflet');
      if (isDisposed || !containerRef.current) return;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      (window as any).L = L;

      // Initialize map centered to capture global jurisdictions
      map = L.map(containerRef.current, {
        center: [25.0, 10.0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 12,
        worldCopyJump: true,
        zoomControl: false,
      });

      mapInstanceRef.current = map;

      // Invalidate size once DOM layout completes
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);

      // CartoDB Dark Matter / MapTiler Layer
      const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
      const tileUrl = maptilerKey
        ? `https://api.maptiler.com/maps/dataviz-dark/256/{z}/{x}/{y}.png?key=${maptilerKey}`
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c', 'd'],
      }).addTo(map);

      // Top-Right Zoom Control
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Populate Markers
      markersRef.current = {};
      const bounds = L.latLngBounds([]);

      Object.entries(jurisdictionMarkets).forEach(([code, node]) => {
        const info = marketStatuses[code];
        if (!info) return;

        bounds.extend(node.coordinates);
        const isSelected = activeCountry === code;

        // Custom DivIcon with color-coded ring, inner flag, and animated beacon
        const markerHtml = `
          <div class="relative cursor-pointer group" style="transform: translate(-50%, -50%);">
            ${
              info.tier === 'banned' || isSelected
                ? `<div style="position:absolute; inset:-8px; border-radius:50%; background:${info.color}33; animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>`
                : ''
            }
            <div style="
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: #0f172a;
              border: 3px solid ${info.color};
              box-shadow: 0 0 ${isSelected ? '16px' : '8px'} ${info.color}99;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 17px;
              position: relative;
              transition: transform 0.2s ease;
            ">
              <span>${node.flag}</span>
              ${
                isSelected
                  ? `<div style="position:absolute; bottom:-4px; right:-4px; width:12px; height:12px; border-radius:50%; background:#38bdf8; border:2px solid #0f172a;"></div>`
                  : ''
              }
            </div>
            <div style="
              position: absolute;
              top: 100%;
              left: 50%;
              transform: translateX(-50%);
              margin-top: 4px;
              background: #020617;
              border: 1px solid ${info.color}66;
              padding: 1px 6px;
              border-radius: 999px;
              font-family: ui-monospace, monospace;
              font-size: 9px;
              font-weight: bold;
              color: #f8fafc;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            ">
              ${code}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'leaflet-compliance-marker',
          html: markerHtml,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker(node.coordinates, { icon: customIcon, zIndexOffset: isSelected ? 1000 : 500 }).addTo(map!);
        markersRef.current[code] = marker;

        // Interactive Leaflet Tooltip
        marker.bindTooltip(
          `<div style="font-family:system-ui,sans-serif;font-size:11px;padding:2px 4px;">
            <div style="font-weight:bold;color:#f8fafc;">${node.flag} ${node.name} (${code})</div>
            <div style="color:${info.color};font-weight:600;">${info.label}</div>
            <div style="color:#94a3b8;font-size:10px;">Agency: ${node.agency}</div>
          </div>`,
          { sticky: true, direction: 'top', offset: [0, -20] }
        );

        // Interactive Leaflet Popup with Full Regulatory Data
        const popupContent = `
          <div style="font-family:system-ui,sans-serif; color:#0f172a; padding:6px; min-width:260px; max-width:290px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:26px;">${node.flag}</span>
                <div>
                  <strong style="font-size:14px; display:block; line-height:1.2;">${node.name}</strong>
                  <span style="font-size:10px; font-family:monospace; color:#64748b;">${code} · ${node.agency}</span>
                </div>
              </div>
              <span style="
                font-size:9px;
                font-weight:bold;
                padding:2px 6px;
                border-radius:999px;
                background:${info.color}15;
                color:${info.color};
                border:1px solid ${info.color}40;
                text-transform:uppercase;
              ">
                ${info.tier}
              </span>
            </div>

            <!-- Metric Grid -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px; background:#f8fafc; padding:6px; border-radius:8px; border:1px solid #e2e8f0; font-size:10.5px;">
              <div>
                <span style="color:#64748b; display:block; font-size:9.5px;">De Minimis:</span>
                <strong style="color:#0f172a; font-family:monospace;">${info.deMinimis}</strong>
              </div>
              <div>
                <span style="color:#64748b; display:block; font-size:9.5px;">Landed Duty Rate:</span>
                <strong style="color:#0f172a; font-family:monospace;">${info.dutyRate}</strong>
              </div>
            </div>

            <!-- Compliance Tally -->
            <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:8px; padding:0 2px;">
              <span style="color:#10b981; font-weight:600;">✓ Pass: ${info.passCount}</span>
              <span style="color:#f59e0b; font-weight:600;">⚠ Warn: ${info.warnCount}</span>
              <span style="color:#ef4444; font-weight:600;">✕ Violation: ${info.violationCount}</span>
            </div>

            <button
              id="filter-btn-${code}"
              style="
                width:100%;
                padding:7px 10px;
                background:#0284c7;
                color:#ffffff;
                border:none;
                border-radius:6px;
                font-size:11px;
                font-weight:bold;
                cursor:pointer;
                display:flex;
                align-items:center;
                justify-content:center;
                gap:4px;
                transition:background 0.2s;
              "
            >
              Filter Compliance Matrix for ${code} ➔
            </button>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 320 });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`filter-btn-${code}`);
          if (btn) {
            btn.onclick = () => {
              setActiveCountry(code);
              if (onSelectCountry) onSelectCountry(code);
              marker.closePopup();
            };
          }
        });

        marker.on('click', () => {
          setActiveCountry(code);
          if (onSelectCountry) onSelectCountry(code);
        });
      });
    }

    initMap();

    return () => {
      isDisposed = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [marketStatuses]);

  // Handle clicking pills or external changes
  const handlePillClick = (code: string) => {
    const nextCode = activeCountry === code ? null : code;
    setActiveCountry(nextCode);
    if (onSelectCountry) onSelectCountry(nextCode || '');

    if (mapInstanceRef.current && nextCode && jurisdictionMarkets[nextCode]) {
      const coords = jurisdictionMarkets[nextCode].coordinates;
      mapInstanceRef.current.flyTo(coords, 4, { duration: 0.8 });
      const marker = markersRef.current[nextCode];
      if (marker) marker.openPopup();
    }
  };

  const handleResetZoom = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([25.0, 10.0], 2);
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur shadow-2xl overflow-hidden flex flex-col ${className}`}>
      {/* ── Top Header Toolbar ── */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Interactive World Compliance Map
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                CartoDB Dark Matter
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sovereign jurisdiction regulatory risk status, de minimis thresholds &amp; customs agencies.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetZoom}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
            title="Reset to global view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset View</span>
          </button>
        </div>
      </div>

      {/* ── Country Quick Selector Bar ── */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[11px]">
          <Filter className="w-3.5 h-3.5 text-sky-400" />
          <span>Filter Jurisdiction:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(jurisdictionMarkets).map(([code, node]) => {
            const st = marketStatuses[code];
            const isSelected = activeCountry === code;

            const badgeBorder =
              st.tier === 'cleared'
                ? 'border-emerald-500/40 hover:border-emerald-400'
                : st.tier === 'warning'
                ? 'border-amber-500/40 hover:border-amber-400'
                : st.tier === 'banned'
                ? 'border-rose-500/40 hover:border-rose-400'
                : 'border-slate-800 hover:border-slate-700';

            return (
              <button
                key={code}
                type="button"
                onClick={() => handlePillClick(code)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border ${badgeBorder} ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30 scale-105'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{node.flag}</span>
                <span>{code}</span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: st.color }}
                  title={st.label}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Leaflet Container ── */}
      <div className="relative">
        <div ref={containerRef} className="h-[440px] w-full bg-slate-950 z-0" />

        {/* Floating Interactive Legend */}
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-2xl text-[11px] space-y-1.5">
          <span className="font-bold text-slate-300 block text-[10px] uppercase tracking-wider font-mono">
            Customs Risk Tier
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px]">
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>100% Cleared (0 Violations)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Remediation Required</span>
            </div>
            <div className="flex items-center space-x-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>High Seizure Risk / Banned</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span>Out of Scope</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
