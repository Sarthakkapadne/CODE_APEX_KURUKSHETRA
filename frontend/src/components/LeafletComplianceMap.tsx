'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { AuditResponse } from '../lib/types';
import { fetchMarketEconomicsReference } from '../lib/api';
import { initSafeLeaflet, safeDestroyMap } from '../lib/leafletSetup';
import {
  Globe, ShieldCheck, AlertTriangle, AlertOctagon,
  Filter, Info, CheckCircle2, ChevronRight, Layers,
  Building2, Scale, ExternalLink
} from 'lucide-react';

export interface MarketComplianceNode {
  code: string;
  name: string;
  flag: string;
  coordinates: [number, number];
  agency: string;
  framework: string;
  defaultDeMinimis: string;
  defaultDuty: string;
  defaultRisk: 'cleared' | 'warning' | 'banned';
  defaultRationale: string;
}

export const JURISDICTION_MARKETS: Record<string, MarketComplianceNode> = {
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    coordinates: [37.09, -95.71],
    agency: 'US CBP / FDA / CPSC / EPA',
    framework: '19 U.S.C. § 1321 (Section 321) · FD&C Act · TSCA',
    defaultDeMinimis: '$800 USD (Section 321)',
    defaultDuty: '0% under $800, 3-6% standard',
    defaultRisk: 'cleared',
    defaultRationale: 'Section 321 provides duty-free & tax-free parcel entry under $800 USD without formal broker clearance.',
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    coordinates: [56.13, -106.34],
    agency: 'CBSA / Health Canada / CFIA',
    framework: 'Customs Tariff Act · CCPSA · Cosmetic Regulations (Hotlist)',
    defaultDeMinimis: '$20 CAD (~$15 USD)',
    defaultDuty: 'Avg 5-8% + GST/PST',
    defaultRisk: 'warning',
    defaultRationale: 'Strict $20 CAD de minimis requires formal GST/HST tax collection and bilingual English/French packaging.',
  },
  EU: {
    code: 'EU',
    name: 'European Union (Brussels)',
    flag: '🇪🇺',
    coordinates: [50.85, 4.35],
    agency: 'EU DG TAXUD / RAPEX / EMA',
    framework: 'Regulation (EU) 2023/988 (GPSR) · IOSS · REACH Annex XVII',
    defaultDeMinimis: '€150 Duty / €0 VAT (IOSS)',
    defaultDuty: '0% duty under €150, 19-25% VAT',
    defaultRisk: 'warning',
    defaultRationale: 'GPSR mandates EU Responsible Person on label; VAT must be collected from €0.01 via IOSS portal.',
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    coordinates: [51.16, 10.45],
    agency: 'BfR / VerpackG LUCID / ElektroG',
    framework: 'Verpackungsgesetz (LUCID) · ElektroG · ProdSG',
    defaultDeMinimis: '€0 VAT / €150 Duty (IOSS)',
    defaultDuty: '0% duty under €150, 19% MwSt',
    defaultRisk: 'warning',
    defaultRationale: 'Mandatory LUCID packaging registration and dual EPR disposal contract required prior to dispatch.',
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    coordinates: [55.37, -3.43],
    agency: 'HMRC / OPSS / MHRA',
    framework: 'UK REACH · Cosmetic Products Enforcement · HMRC Low Value',
    defaultDeMinimis: '£135 GBP (~$175 USD)',
    defaultDuty: '0% duty under £135, 20% standard VAT',
    defaultRisk: 'cleared',
    defaultRationale: 'Parcels under £135 enter duty-free; seller or marketplace collects 20% UK VAT at point of sale.',
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    coordinates: [36.20, 138.25],
    agency: 'Japan Customs / PMDA / METI',
    framework: 'Pharmaceutical & Medical Devices Act (PMD Act) · PSE Mark',
    defaultDeMinimis: '¥10,000 JPY (~$67 USD)',
    defaultDuty: 'Simplified flat 3-5% or duty-free',
    defaultRisk: 'warning',
    defaultRationale: 'Strict PMDA ingredient positive/negative lists for cosmetics and METI PSE certification for electronics.',
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    coordinates: [-25.27, 133.77],
    agency: 'ABF / TGA / ACCC',
    framework: 'Customs Act 1901 · Therapeutic Goods Act · Biosecurity Act',
    defaultDeMinimis: '$1,000 AUD (~$660 USD)',
    defaultDuty: '5% duty + 10% GST above $1,000',
    defaultRisk: 'cleared',
    defaultRationale: 'Generous $1,000 AUD de minimis threshold; marketplace collects 10% GST on low-value imported goods.',
  },
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    coordinates: [20.59, 78.96],
    agency: 'CBIC / FSSAI / CDSCO',
    framework: 'Customs Act 1962 · BIS Mandatory Scheme · Drugs & Cosmetics Act',
    defaultDeMinimis: '₹0 INR (Zero De Minimis)',
    defaultDuty: 'Standard BCD + SWS + 18% IGST',
    defaultRisk: 'banned',
    defaultRationale: 'Zero de minimis; mandatory CDSCO import registration for cosmetics and BIS certification for electronics/toys.',
  },
  CN: {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    coordinates: [35.86, 104.19],
    agency: 'GACC / NMPA / SAMR',
    framework: 'Cross-Border E-Commerce (CBEC) Positive List · CSAR · CCC',
    defaultDeMinimis: '50 RMB (~$7 USD)',
    defaultDuty: '9.1% preferential CBEC rate',
    defaultRisk: 'warning',
    defaultRationale: 'Requires shipment via official CBEC bonded warehouse or registered postal channels under CSAR rules.',
  },
  VN: {
    code: 'VN',
    name: 'Vietnam',
    flag: '🇻🇳',
    coordinates: [14.05, 108.27],
    agency: 'General Dept of Vietnam Customs / DAV',
    framework: 'Law on Customs 2014 · Decree 69/2018/ND-CP · Circular 06/2011/TT-BYT',
    defaultDeMinimis: '1,000,000 VND (~$40 USD)',
    defaultDuty: '0% under 1M VND, 8-10% VAT',
    defaultRisk: 'warning',
    defaultRationale: 'Mandatory Drug Administration of Vietnam (DAV) cosmetic product proclamation dossier for commercial entry.',
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    coordinates: [1.35, 103.82],
    agency: 'Singapore Customs / HSA / EnterpriseSG',
    framework: 'Customs Act · Health Products Act · OVR GST Regime',
    defaultDeMinimis: '$400 SGD (~$300 USD)',
    defaultDuty: '0% duty (except liquor/tobacco), 9% GST',
    defaultRisk: 'cleared',
    defaultRationale: 'Fast single-window customs clearance; low-value imported goods subject to 9% Overseas Vendor Registration GST.',
  },
  BR: {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    coordinates: [-14.23, -51.92],
    agency: 'Receita Federal / ANVISA / INMETRO',
    framework: 'Remessa Conforme Program · ANVISA RDC 752/2022 · INMETRO',
    defaultDeMinimis: '$50 USD (Remessa Conforme)',
    defaultDuty: '20% under $50 USD, 60% standard',
    defaultRisk: 'banned',
    defaultRationale: 'Strict import tariffs: 20% federal duty below $50 USD and 60% above $50 USD, plus 17% state ICMS tax.',
  },
};

export type ComplianceTier = 'cleared' | 'warning' | 'banned';

export interface LeafletComplianceMapProps {
  auditData?: AuditResponse | null;
  selectedCountry?: string | null;
  onSelectCountry?: (countryCode: string) => void;
  className?: string;
}

export default function LeafletComplianceMap({
  auditData,
  selectedCountry,
  onSelectCountry,
  className = '',
}: LeafletComplianceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const heatCirclesLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [activeCountry, setActiveCountry] = useState<string>(selectedCountry || 'US');
  const [tierFilter, setTierFilter] = useState<'all' | ComplianceTier>('all');
  const [jurisdictionMarkets, setJurisdictionMarkets] = useState<Record<string, MarketComplianceNode>>(JURISDICTION_MARKETS);
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Sync selectedCountry prop
  useEffect(() => {
    if (selectedCountry && selectedCountry !== activeCountry) {
      setActiveCountry(selectedCountry);
    }
  }, [selectedCountry]);

  // Smoothly center and fly to activeCountry when changed
  useEffect(() => {
    if (mapReady && mapInstanceRef.current && jurisdictionMarkets[activeCountry]) {
      const coords = jurisdictionMarkets[activeCountry].coordinates;
      try {
        mapInstanceRef.current.flyTo(coords, 3.5, { duration: 0.8 });
        const marker = markersRef.current[activeCountry];
        if (marker) marker.openPopup();
      } catch {}
    }
  }, [activeCountry, mapReady, jurisdictionMarkets]);

  // Dynamically load sovereign market geo-profiles from database
  useEffect(() => {
    let active = true;
    fetchMarketEconomicsReference()
      .then(mkts => {
        if (active && mkts) {
          const updated: Record<string, MarketComplianceNode> = { ...JURISDICTION_MARKETS };
          Object.entries(mkts).forEach(([code, m]: [string, any]) => {
            if (updated[code]) {
              updated[code] = {
                ...updated[code],
                name: m.country_name || updated[code].name,
                flag: m.flag || updated[code].flag,
                agency: m.governing_agency || updated[code].agency,
                defaultDeMinimis: m.de_minimis_description || updated[code].defaultDeMinimis,
                defaultDuty: m.standard_duty_rate || updated[code].defaultDuty,
              };
            }
          });
          setJurisdictionMarkets(updated);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Compute live regulatory status per country based on active auditData
  const marketStatuses = useMemo(() => {
    const statuses: Record<string, {
      tier: ComplianceTier;
      color: string;
      fillColor: string;
      label: string;
      rationale: string;
      violations: number;
      warnings: number;
      passes: number;
    }> = {};

    Object.entries(jurisdictionMarkets).forEach(([code, node]) => {
      const countrySummary = auditData?.summary_by_country?.[code];
      const checkResults = auditData?.matrix?.[code] || [];

      let violations = 0;
      let warnings = 0;
      let passes = 0;

      if (countrySummary) {
        violations = (countrySummary.violation || 0) + (countrySummary.escalation || 0);
        warnings = countrySummary.warning || 0;
        passes = countrySummary.pass || 0;
      } else if (checkResults.length > 0) {
        checkResults.forEach(c => {
          if (c.status === 'violation' || c.status === 'escalation') violations++;
          else if (c.status === 'warning') warnings++;
          else if (c.status === 'pass') passes++;
        });
      }

      let tier: ComplianceTier = node.defaultRisk;
      let rationale = node.defaultRationale;

      if (violations > 0) {
        tier = 'banned';
        rationale = `Audit detected ${violations} statutory violation(s). Commercial entry is blocked pending remediation.`;
      } else if (warnings > 0) {
        tier = 'warning';
        rationale = `Audit identified ${warnings} regulatory warning(s). Conditional entry permitted with compliance actions.`;
      } else if (passes > 0) {
        tier = 'cleared';
        rationale = `All ${passes} regulatory checks passed. Cleared for seamless cross-border entry.`;
      }

      const colorMap = {
        cleared: { stroke: '#10b981', fill: '#10b981', label: 'CLEARED / LOW RISK' },
        warning: { stroke: '#f59e0b', fill: '#f59e0b', label: 'CONDITIONAL / CAUTION' },
        banned:  { stroke: '#f43f5e', fill: '#f43f5e', label: 'HIGH ALERT / DETENTION RISK' },
      };

      statuses[code] = {
        tier,
        color: colorMap[tier].stroke,
        fillColor: colorMap[tier].fill,
        label: colorMap[tier].label,
        rationale,
        violations,
        warnings,
        passes,
      };
    });

    return statuses;
  }, [auditData, jurisdictionMarkets]);

  // ── Initialize Map Container ──
  useEffect(() => {
    let isDisposed = false;

    async function initMap() {
      const rawL = await import('leaflet');
      const L = initSafeLeaflet(rawL);
      if (isDisposed || !containerRef.current || mapInstanceRef.current) return;

      const map = L.map(containerRef.current, {
        center: [25.0, 10.0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 12,
        worldCopyJump: true,
        zoomControl: false,
      });

      mapInstanceRef.current = map;

      // Crystal-clear map tiles with CartoDB fallback
      const maptilerKey =
        process.env.NEXT_PUBLIC_MAPTILER_API_KEY ||
        process.env.NEXT_PUBLIC_LEAFLET_API_KEY ||
        process.env.NEXT_PUBLIC_MAP_API_KEY ||
        'CTTf1GnjFmqpYI0cPqIC';

      const tileUrl = maptilerKey
        ? `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${maptilerKey}`
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; MapTiler &copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c', 'd'],
      });

      tileLayer.on('tileerror', () => {
        if (tileUrl.includes('maptiler.com')) {
          tileLayer.setUrl('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png');
        }
      });
      tileLayer.addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Separate layers for heat zones and markers
      heatCirclesLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);

      const triggerInvalidate = () => {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch {}
        }
      };
      setTimeout(triggerInvalidate, 50);
      setTimeout(triggerInvalidate, 250);
      setTimeout(triggerInvalidate, 600);
    }

    initMap();

    return () => {
      isDisposed = true;
      if (mapInstanceRef.current) {
        safeDestroyMap(mapInstanceRef.current);
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        heatCirclesLayerRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // ── Render Pure Regulatory Risk Density Circles & Markers ──
  useEffect(() => {
    const map = mapInstanceRef.current;
    const heatLayer = heatCirclesLayerRef.current;
    const markLayer = markersLayerRef.current;
    if (!mapReady || !map || !heatLayer || !markLayer || typeof window === 'undefined') return;

    const L = (window as any).L;
    if (!L) return;

    heatLayer.clearLayers();
    markLayer.clearLayers();
    markersRef.current = {};

    Object.entries(jurisdictionMarkets).forEach(([code, node]) => {
      const status = marketStatuses[code];
      if (!status) return;

      // Filter check
      if (tierFilter !== 'all' && status.tier !== tierFilter) return;

      const isSelected = activeCountry === code;

      // 1. Regulatory Risk Density Zone (Circular beacon)
      const circleRadius = ['US', 'CA', 'AU', 'CN', 'BR'].includes(code) ? 550000 : 380000;
      
      const riskCircle = L.circle(node.coordinates, {
        radius: circleRadius,
        color: status.color,
        weight: isSelected ? 3 : 1.5,
        opacity: isSelected ? 0.95 : 0.7,
        fillColor: status.fillColor,
        fillOpacity: isSelected ? 0.35 : 0.20,
        dashArray: status.tier === 'warning' ? '6 4' : undefined,
      }).addTo(heatLayer);

      riskCircle.bindTooltip(
        `<div style="font-family:system-ui,sans-serif;font-size:12px;padding:3px 6px;">
          <strong style="color:${status.color}">${node.flag} ${node.name}</strong><br/>
          <span style="font-weight:bold;color:#0f172a;">${status.label}</span><br/>
          <span style="color:#64748b;font-size:10px;">${node.agency}</span>
        </div>`,
        { sticky: true }
      );

      // 2. Sovereign Pin Marker
      const markerHtml = `
        <div class="relative cursor-pointer group" style="transform: translate(-50%, -50%);">
          ${
            isSelected
              ? `<div style="position:absolute; inset:-10px; border-radius:50%; background:${status.color}33; animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>`
              : ''
          }
          <div style="
            width: ${isSelected ? '44px' : '36px'};
            height: ${isSelected ? '44px' : '36px'};
            border-radius: 50%;
            background: #ffffff;
            border: 3px solid ${status.color};
            box-shadow: 0 4px 14px rgba(0,0,0,0.22);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '20px' : '16px'};
            position: relative;
            transition: all 0.2s ease;
          ">
            <span>${node.flag}</span>
            <div style="
              position: absolute;
              bottom: -2px;
              right: -2px;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: ${status.color};
              border: 2px solid #ffffff;
            "></div>
          </div>
          <div style="
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 4px;
            background: #0f172a;
            border: 1px solid ${status.color};
            padding: 1px 7px;
            border-radius: 999px;
            font-family: ui-monospace, monospace;
            font-size: 10px;
            font-weight: bold;
            color: #ffffff;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          ">
            ${code}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'leaflet-compliance-marker',
        html: markerHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker(node.coordinates, {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 500,
      }).addTo(markLayer);

      // Detailed Statutory Popup Dossier
      const popupHtml = `
        <div style="font-family:system-ui,-apple-system,sans-serif;width:280px;padding:4px;color:#0f172a;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:24px;">${node.flag}</span>
              <div>
                <h4 style="margin:0;font-size:14px;font-weight:800;color:#0f172a;">${node.name}</h4>
                <p style="margin:0;font-size:10px;font-family:ui-monospace,monospace;color:#64748b;">${node.agency}</p>
              </div>
            </div>
            <span style="background:${status.color}15;color:${status.color};border:1px solid ${status.color}40;font-size:9.5px;font-weight:800;padding:2px 8px;border-radius:999px;text-transform:uppercase;">
              ${status.tier}
            </span>
          </div>

          <div style="background:#f8fafc;border-radius:8px;padding:8px;margin-bottom:8px;font-size:11px;line-height:1.45;color:#334155;">
            <strong>Statutory Framework:</strong><br/>
            <span style="font-size:10.5px;color:#475569;">${node.framework}</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;margin-bottom:8px;">
            <div style="background:#f1f5f9;padding:6px;border-radius:6px;">
              <span style="font-size:9.5px;color:#64748b;display:block;">De Minimis</span>
              <strong style="font-size:10.5px;color:#0f172a;">${node.defaultDeMinimis}</strong>
            </div>
            <div style="background:#f1f5f9;padding:6px;border-radius:6px;">
              <span style="font-size:9.5px;color:#64748b;display:block;">Baseline Tariff</span>
              <strong style="font-size:10.5px;color:#0f172a;">${node.defaultDuty}</strong>
            </div>
          </div>

          <div style="font-size:11px;color:#475569;margin-bottom:10px;line-height:1.4;">
            ${status.rationale}
          </div>

          <button id="btn-select-${code}" style="width:100%;background:#0284c7;color:#ffffff;border:none;border-radius:8px;padding:7px 0;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">
            Select Sovereign Market
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300 });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${code}`);
        if (btn) {
          btn.onclick = () => {
            setActiveCountry(code);
            if (onSelectCountry) onSelectCountry(code);
          };
        }
      });

      marker.on('click', () => {
        setActiveCountry(code);
        if (onSelectCountry) onSelectCountry(code);
      });

      markersRef.current[code] = marker;
    });
  }, [jurisdictionMarkets, marketStatuses, activeCountry, tierFilter, mapReady, onSelectCountry]);

  const activeNode = jurisdictionMarkets[activeCountry] || JURISDICTION_MARKETS['US'];
  const activeStatus = marketStatuses[activeCountry] || {
    tier: 'cleared',
    color: '#10b981',
    label: 'CLEARED / LOW RISK',
    rationale: activeNode.defaultRationale,
    violations: 0,
    warnings: 0,
    passes: 0,
  };

  return (
    <div className={`flex flex-col bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden ${className}`}>
      {/* ── Top Header & Filter Toolbar ── */}
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-xs">
            <Globe className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Global Regulatory Risk Heatmap
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                GIS Density Engine
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Sovereign statutory risk zones, customs inspection thresholds & clearance health across 11 nations.
            </p>
          </div>
        </div>

        {/* Risk Tier Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Jurisdictions (11)', color: 'text-slate-700 bg-slate-100' },
            { id: 'cleared', label: '🟢 Cleared', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            { id: 'warning', label: '🟡 Caution', color: 'text-amber-700 bg-amber-50 border-amber-200' },
            { id: 'banned', label: '🔴 High Alert', color: 'text-rose-700 bg-rose-50 border-rose-200' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTierFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                tierFilter === f.id
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Map Container ── */}
      <div className="relative w-full h-[520px] bg-slate-100">
        <div ref={containerRef} className="w-full h-full" />

        {/* Floating Quick Market Selector Overlay */}
        <div className="absolute top-4 left-4 z-[500] bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2 shadow-lg max-w-[280px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1.5">
            Focus Sovereign Market
          </span>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {Object.entries(jurisdictionMarkets).map(([code, m]) => (
              <button
                key={code}
                onClick={() => {
                  setActiveCountry(code);
                  if (onSelectCountry) onSelectCountry(code);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  activeCountry === code
                    ? 'bg-primary-600 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>{m.flag}</span>
                <span>{code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Floating Risk Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-4 text-xs font-medium">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Density:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-2xs" />
            <span className="text-slate-700 font-semibold text-[11px]">Low Risk / Cleared</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-2xs" />
            <span className="text-slate-700 font-semibold text-[11px]">Caution / Remediation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-2xs" />
            <span className="text-slate-700 font-semibold text-[11px]">High Alert / Blocked</span>
          </div>
        </div>
      </div>

      {/* ── Active Jurisdiction Statutory Dossier Banner ── */}
      <div className="px-6 py-5 bg-slate-50/80 border-t border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
            {activeNode.flag}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-black text-slate-900">{activeNode.name}</h3>
              <span className="text-xs font-mono font-bold text-slate-500">({activeNode.code})</span>
              <span
                className="text-xs font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs uppercase"
                style={{
                  color: activeStatus.color,
                  backgroundColor: `${activeStatus.color}15`,
                  borderColor: `${activeStatus.color}40`,
                }}
              >
                {activeStatus.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Governing Authority: <strong className="text-slate-800">{activeNode.agency}</strong> · Framework: {activeNode.framework}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">De Minimis</span>
            <span className="font-extrabold text-slate-800 font-mono">{activeNode.defaultDeMinimis}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Baseline Tariff</span>
            <span className="font-extrabold text-slate-800 font-mono">{activeNode.defaultDuty}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Audit Summary</span>
            <span className="font-extrabold text-slate-800 font-mono">
              {activeStatus.passes} Pass · {activeStatus.warnings} Warn · {activeStatus.violations} Block
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
