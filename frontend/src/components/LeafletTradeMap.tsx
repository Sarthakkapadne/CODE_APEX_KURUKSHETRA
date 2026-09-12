'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { initSafeLeaflet, safeDestroyMap } from '../lib/leafletSetup';
import type { AuditResponse, ListingInput, TradeEconomicsItem } from '../lib/types';
import {
  Globe, Navigation2, Plane, Ship, ArrowRight, ShieldCheck, AlertTriangle,
  XCircle, Filter, Maximize2, Layers, CheckCircle2, ChevronRight, Info
} from 'lucide-react';

type Coordinates = [number, number];

// ISO Geocentric Coordinate Registry for all 11 sovereign trade nations
const COUNTRY_GEO_REGISTRY: Record<string, { name: string; flag: string; coordinates: Coordinates }> = {
  US: { name: 'United States', flag: '🇺🇸', coordinates: [37.09, -95.71] },
  UK: { name: 'United Kingdom', flag: '🇬🇧', coordinates: [55.37, -3.43] },
  CA: { name: 'Canada', flag: '🇨🇦', coordinates: [56.13, -106.34] },
  JP: { name: 'Japan', flag: '🇯🇵', coordinates: [36.20, 138.25] },
  DE: { name: 'Germany', flag: '🇩🇪', coordinates: [51.16, 10.45] },
  EU: { name: 'European Union', flag: '🇪🇺', coordinates: [50.85, 4.35] },
  IN: { name: 'India', flag: '🇮🇳', coordinates: [20.59, 78.96] },
  BR: { name: 'Brazil', flag: '🇧🇷', coordinates: [-14.23, -51.92] },
  CN: { name: 'China', flag: '🇨🇳', coordinates: [35.86, 104.19] },
  AU: { name: 'Australia', flag: '🇦🇺', coordinates: [-25.27, 133.77] },
  VN: { name: 'Vietnam', flag: '🇻🇳', coordinates: [14.05, 108.27] },
  SG: { name: 'Singapore', flag: '🇸🇬', coordinates: [1.35, 103.82] },
};

function normalizeCountryCode(nameOrCode?: string): string {
  if (!nameOrCode) return 'US';
  const clean = nameOrCode.trim().toUpperCase();
  if (COUNTRY_GEO_REGISTRY[clean]) return clean;

  const lower = nameOrCode.trim().toLowerCase();
  for (const [code, entry] of Object.entries(COUNTRY_GEO_REGISTRY)) {
    if (entry.name.toLowerCase() === lower || code.toLowerCase() === lower) {
      return code;
    }
  }
  if (lower.includes('united states') || lower === 'usa') return 'US';
  if (lower.includes('united kingdom') || lower === 'great britain') return 'UK';
  if (lower.includes('european union') || lower === 'europe') return 'EU';
  if (lower.includes('vietnam')) return 'VN';
  if (lower.includes('brazil')) return 'BR';
  if (lower.includes('germany')) return 'DE';
  return clean.slice(0, 2);
}

// Great-Circle distance in kilometers
function calculateHaversineDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat1 = toRad(coord1[0]);
  const lon1 = toRad(coord1[1]);
  const lat2 = toRad(coord2[0]);
  const lon2 = toRad(coord2[1]);
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatFlightTime(distanceKm: number): string {
  const hoursDecimal = distanceKm / 850;
  const hours = Math.floor(hoursDecimal);
  const minutes = Math.round((hoursDecimal - hours) * 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

function formatOceanDays(distanceKm: number): string {
  const days = Math.round((distanceKm * 1.15) / (35 * 24));
  return `${Math.max(1, days)} days`;
}

function calculateBearing(from: Coordinates, to: Coordinates): number {
  const rad = Math.PI / 180;
  const y = Math.sin((to[1] - from[1]) * rad) * Math.cos(to[0] * rad);
  const x =
    Math.cos(from[0] * rad) * Math.sin(to[0] * rad) -
    Math.sin(from[0] * rad) * Math.cos(to[0] * rad) * Math.cos((to[1] - from[1]) * rad);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

// Great-Circle curved arc interpolation
function createGeodesicArc(from: Coordinates, to: Coordinates, numPoints: number = 20): Coordinates[] {
  const points: Coordinates[] = [];
  const lat1 = (from[0] * Math.PI) / 180;
  const lon1 = (from[1] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const lon2 = (to[1] * Math.PI) / 180;

  const d = 2 * Math.asin(
    Math.sqrt(
      Math.sin((lat2 - lat1) / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
    )
  );

  if (d < 0.001) return [from, to];

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    points.push([(lat * 180) / Math.PI, (lon * 180) / Math.PI]);
  }
  return points;
}

export interface ConnectedPartner {
  code: string;
  name: string;
  flag: string;
  coordinates: Coordinates;
  flow: 'export' | 'import' | 'bilateral';
  status: 'cleared' | 'warning' | 'blocked';
  statusLabel: string;
  distanceKm: number;
  distanceMiles: number;
  flightTime: string;
  oceanDays: string;
  deMinimis: string;
  dutyRate: string;
  vatRate: string;
  scheme: string;
  complexityScore: number;
  recommendation: string;
}

export interface LeafletTradeMapProps {
  currentInput?: ListingInput | null;
  auditData?: AuditResponse | null;
  selectedMarket?: string;
  onMarketSelect?: (code: string) => void;
  onSelectCountry?: (code: string) => void;
}

const DEFAULT_MASTER_COUNTRIES = ['US', 'EU', 'DE', 'UK', 'CA', 'JP', 'AU', 'IN', 'CN', 'VN', 'BR'];
const MANUFACTURING_ORIGINS = ['CN', 'VN', 'IN'];

export default function LeafletTradeMap({
  currentInput,
  auditData,
  selectedMarket,
  onMarketSelect,
  onSelectCountry,
}: LeafletTradeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tradeLayersRef = useRef<any>(null);

  const [backendMarketsData, setBackendMarketsData] = useState<Record<string, any>>({});
  const [selectedCountry, setSelectedCountry] = useState<string>(
    selectedMarket ? normalizeCountryCode(selectedMarket) : 'US'
  );
  const [focusedPartnerCode, setFocusedPartnerCode] = useState<string | null>(null);
  const [routeFilter, setRouteFilter] = useState<'all' | 'export' | 'import'>('all');
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Sync selectedMarket prop
  useEffect(() => {
    if (selectedMarket) {
      const norm = normalizeCountryCode(selectedMarket);
      if (norm && norm !== selectedCountry) {
        setSelectedCountry(norm);
      }
    }
  }, [selectedMarket]);

  const selectedCountryInfo = COUNTRY_GEO_REGISTRY[selectedCountry] || COUNTRY_GEO_REGISTRY['US'];

  // Smoothly center and fly to selectedCountry when changed
  useEffect(() => {
    if (mapReady && mapInstanceRef.current && selectedCountryInfo) {
      try {
        mapInstanceRef.current.flyTo(selectedCountryInfo.coordinates, 3.5, { duration: 0.8 });
      } catch {}
    }
  }, [selectedCountry, mapReady, selectedCountryInfo]);

  // Load live markets reference
  useEffect(() => {
    async function loadBackendMarkets() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiUrl}/economics/markets`);
        if (res.ok) {
          const data = await res.json();
          setBackendMarketsData(data || {});
        }
      } catch (err) {
        console.warn('Could not fetch backend markets reference:', err);
      }
    }
    loadBackendMarkets();
  }, []);

  // Compute all available countries in the system
  const allCountries = useMemo(() => {
    const set = new Set<string>();
    if (currentInput?.country_of_origin) set.add(normalizeCountryCode(currentInput.country_of_origin));
    (auditData?.destination_markets || []).forEach(m => set.add(normalizeCountryCode(m)));
    (auditData?.trade_economics || []).forEach(e => set.add(normalizeCountryCode(e.country_code)));
    Object.keys(backendMarketsData || {}).forEach(m => set.add(normalizeCountryCode(m)));
    DEFAULT_MASTER_COUNTRIES.forEach(c => set.add(c));
    return Array.from(set).filter(code => Boolean(COUNTRY_GEO_REGISTRY[code]));
  }, [currentInput?.country_of_origin, auditData, backendMarketsData]);

  // Compute connected trade partners with Great-Circle distance and in-route / out-route classifications
  const connectedTradePartners: ConnectedPartner[] = useMemo(() => {
    const partners: ConnectedPartner[] = [];

    allCountries.forEach(partnerCode => {
      if (partnerCode === selectedCountry) return;
      const partnerGeo = COUNTRY_GEO_REGISTRY[partnerCode];
      if (!partnerGeo) return;

      const ecoItem = auditData?.trade_economics?.find(
        e => normalizeCountryCode(e.country_code) === partnerCode
      );
      const mktInfo = backendMarketsData[partnerCode];

      // Status calculation
      const countrySummary = auditData?.summary_by_country?.[partnerCode];
      let status: 'cleared' | 'warning' | 'blocked' = 'cleared';
      let statusLabel = 'CLEARED';

      if (countrySummary?.violation || countrySummary?.escalation) {
        status = 'blocked';
        statusLabel = 'BLOCKED (STATUTORY RISK)';
      } else if (countrySummary?.warning) {
        status = 'warning';
        statusLabel = 'CONDITIONAL CLEARANCE';
      }

      // Determine In-route vs Out-route
      let flow: 'export' | 'import' | 'bilateral' = 'bilateral';
      if (MANUFACTURING_ORIGINS.includes(selectedCountry)) {
        flow = 'export'; // Active country exports outbound
      } else if (MANUFACTURING_ORIGINS.includes(partnerCode)) {
        flow = 'import'; // Inbound from supplier
      } else {
        flow = 'export'; // Direct market expansion
      }

      const distKm = calculateHaversineDistanceKm(selectedCountryInfo.coordinates, partnerGeo.coordinates);
      const deMinimisVal = ecoItem?.de_minimis_threshold ?? mktInfo?.de_minimis_threshold ?? 800;
      const deMinimisCurr = ecoItem?.de_minimis_currency ?? mktInfo?.de_minimis_currency ?? 'USD';

      partners.push({
        code: partnerCode,
        name: partnerGeo.name,
        flag: partnerGeo.flag,
        coordinates: partnerGeo.coordinates,
        flow,
        status,
        statusLabel,
        distanceKm: distKm,
        distanceMiles: Math.round(distKm * 0.621371),
        flightTime: formatFlightTime(distKm),
        oceanDays: formatOceanDays(distKm),
        deMinimis: `${deMinimisCurr} ${deMinimisVal}`,
        dutyRate: ecoItem?.estimated_duty_rate ?? mktInfo?.standard_duty_rate ?? '0% - 5%',
        vatRate: ecoItem?.vat_gst_rate ?? mktInfo?.vat_gst_rate ?? 'Standard',
        scheme: ecoItem?.simplification_scheme ?? mktInfo?.de_minimis_description ?? 'Standard Entry',
        complexityScore: ecoItem?.customs_complexity_score ?? mktInfo?.complexity_score ?? 4,
        recommendation: ecoItem?.recommendation_summary ?? mktInfo?.recommendation_summary ?? 'Evaluated against cross-border tariff and statutory regulations.',
      });
    });

    return partners;
  }, [allCountries, selectedCountry, selectedCountryInfo, auditData, backendMarketsData]);

  // Filter partners based on In-routes vs Out-routes
  const displayedPartners = useMemo(() => {
    if (routeFilter === 'export') {
      return connectedTradePartners.filter(p => p.flow === 'export' || p.flow === 'bilateral');
    }
    if (routeFilter === 'import') {
      return connectedTradePartners.filter(p => p.flow === 'import' || p.flow === 'bilateral');
    }
    return connectedTradePartners;
  }, [connectedTradePartners, routeFilter]);

  const handleSelectCountry = (code: string) => {
    setSelectedCountry(code);
    setFocusedPartnerCode(null);
    if (onMarketSelect) onMarketSelect(code);
    if (onSelectCountry) onSelectCountry(code);

    if (mapInstanceRef.current && COUNTRY_GEO_REGISTRY[code]) {
      mapInstanceRef.current.flyTo(COUNTRY_GEO_REGISTRY[code].coordinates, 4, { duration: 0.8 });
    }
  };

  // ── 1. Initialize Leaflet Map with Vibrant MapTiler Streets ──
  useEffect(() => {
    let disposed = false;

    async function initMap() {
      const rawL = await import('leaflet');
      const L = initSafeLeaflet(rawL);
      if (disposed || !containerRef.current || mapInstanceRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        worldCopyJump: true,
        minZoom: 2,
        maxZoom: 14,
      }).setView(selectedCountryInfo.coordinates, 3);

      mapInstanceRef.current = map;

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

      tradeLayersRef.current = L.layerGroup().addTo(map);
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
      disposed = true;
      if (mapInstanceRef.current) {
        safeDestroyMap(mapInstanceRef.current);
        mapInstanceRef.current = null;
        tradeLayersRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // ── 2. Render In-routes, Out-routes, Direction Arrows & Badges ──
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = tradeLayersRef.current;
    if (!mapReady || !map || !layers || typeof window === 'undefined') return;

    const L = (window as any).L;
    if (!L) return;

    layers.clearLayers();
    const bounds = L.latLngBounds([selectedCountryInfo.coordinates]);

    displayedPartners.forEach(p => {
      bounds.extend(p.coordinates);
      const isHighlighted = focusedPartnerCode === p.code;

      const strokeColor =
        p.flow === 'export' ? '#10b981' : p.flow === 'import' ? '#f59e0b' : '#0284c7';

      // 1. Draw animated curved geodesic route polyline
      const arcPoints = createGeodesicArc(selectedCountryInfo.coordinates, p.coordinates);
      const route = L.polyline(arcPoints, {
        color: strokeColor,
        weight: isHighlighted ? 5 : 3.5,
        opacity: isHighlighted ? 1 : 0.88,
        dashArray: p.flow === 'bilateral' ? '10 6' : '14 8',
        lineCap: 'round',
      }).addTo(layers);

      const flowLabel =
        p.flow === 'export' ? 'OUT-ROUTE (EXPORT)' : p.flow === 'import' ? 'IN-ROUTE (IMPORT)' : 'BILATERAL CORRIDOR';

      route.bindTooltip(
        `<div style="font-family:system-ui,sans-serif;font-size:11px;padding:4px 6px;line-height:1.4;">
          <strong style="color:${strokeColor};font-size:12px;">${selectedCountryInfo.flag} ${selectedCountryInfo.name} ➔ ${p.flag} ${p.name}</strong><br/>
          <span style="font-weight:bold;color:#0f172a;">${flowLabel} · ${p.statusLabel}</span><br/>
          <span style="color:#64748b;">Distance: <strong>${p.distanceKm.toLocaleString()} km</strong> (${p.distanceMiles.toLocaleString()} mi)</span><br/>
          <span style="color:#64748b;">Air Transit: <strong>~${p.flightTime}</strong> · Ocean: <strong>~${p.oceanDays}</strong></span><br/>
          <span style="color:#64748b;">De Minimis: <strong>${p.deMinimis}</strong> · Tariff: <strong>${p.dutyRate}</strong></span>
        </div>`,
        { sticky: true }
      );

      route.on('click', () => setFocusedPartnerCode(p.code));

      // 2. Midpoint direction arrow
      const midPoint = arcPoints[Math.floor(arcPoints.length / 2)] || [
        (selectedCountryInfo.coordinates[0] + p.coordinates[0]) / 2,
        (selectedCountryInfo.coordinates[1] + p.coordinates[1]) / 2,
      ];
      const angle = calculateBearing(selectedCountryInfo.coordinates, p.coordinates);

      const arrowIcon = L.divIcon({
        className: '',
        html: `<div style="color:${strokeColor};font-size:18px;line-height:1;transform:rotate(${angle + 90}deg);filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));">➤</div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker(midPoint, { icon: arrowIcon, interactive: false, zIndexOffset: 250 }).addTo(layers);

      // 3. Floating distance badge
      const distanceBadgeIcon = L.divIcon({
        className: '',
        html: `
          <div style="background:#0f172a;color:#ffffff;border:1.5px solid ${strokeColor};font-size:9.5px;font-weight:bold;font-family:ui-monospace,monospace;padding:1px 6px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,0.4);white-space:nowrap;transform:translate(-50%,-120%);display:flex;align-items:center;gap:3px;cursor:pointer;">
            <span style="color:${strokeColor};">↔</span>
            <span>${p.distanceKm.toLocaleString()} km</span>
          </div>
        `,
        iconSize: [0, 0],
      });
      L.marker(midPoint, { icon: distanceBadgeIcon, interactive: true, zIndexOffset: 300 })
        .bindTooltip(`${selectedCountryInfo.name} to ${p.name}: ~${p.flightTime} air / ~${p.oceanDays} ocean`)
        .addTo(layers);

      // 4. Destination Country Pin
      const partnerIcon = L.divIcon({
        className: '',
        html: `
          <div style="width:34px;height:34px;border-radius:50%;background:#ffffff;border:2.5px solid ${strokeColor};box-shadow:0 3px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;transition:transform 0.2s;">
            <span>${p.flag}</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const partnerMarker = L.marker(p.coordinates, { icon: partnerIcon, zIndexOffset: 600 }).addTo(layers);

      partnerMarker.bindPopup(
        `<div style="color:#0f172a;font-family:system-ui,sans-serif;padding:6px;max-width:270px;">
          <div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:6px;">
            <span style="font-size:24px;">${p.flag}</span>
            <div>
              <strong style="font-size:13px;display:block;">${p.name}</strong>
              <span style="font-size:10px;color:#64748b;font-family:monospace;">${p.code} · ${flowLabel}</span>
            </div>
          </div>
          <div style="font-size:11px;space-y:4px;color:#334155;">
            <div>Distance: <strong>${p.distanceKm.toLocaleString()} km</strong> (~${p.flightTime})</div>
            <div>De Minimis: <strong>${p.deMinimis}</strong></div>
            <div>Tariff: <strong>${p.dutyRate}</strong> · VAT: <strong>${p.vatRate}</strong></div>
          </div>
        </div>`
      );

      partnerMarker.on('click', () => setFocusedPartnerCode(p.code));
    });

    // 5. Origin Focal Country Pin (Large with pulsing effect)
    const originIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;cursor:pointer;">
          <div style="position:absolute;inset:-8px;border-radius:50%;background:#0284c733;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:46px;height:46px;border-radius:50%;background:#ffffff;border:3.5px solid #0284c7;box-shadow:0 4px 16px rgba(2,132,199,0.4);display:flex;align-items:center;justify-content:center;font-size:22px;position:relative;">
            <span>${selectedCountryInfo.flag}</span>
            <div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:#0284c7;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:8px;">★</div>
          </div>
        </div>
      `,
      iconSize: [46, 46],
      iconAnchor: [23, 23],
    });

    L.marker(selectedCountryInfo.coordinates, { icon: originIcon, zIndexOffset: 1000 }).addTo(layers);
  }, [displayedPartners, selectedCountryInfo, focusedPartnerCode, mapReady]);

  const handleFitBounds = () => {
    if (mapInstanceRef.current && selectedCountryInfo) {
      const L = (window as any).L;
      if (L) {
        const bounds = L.latLngBounds([selectedCountryInfo.coordinates]);
        displayedPartners.forEach(p => bounds.extend(p.coordinates));
        mapInstanceRef.current.fitBounds(bounds.pad(0.2), { maxZoom: 5 });
      }
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col">
      
      {/* ── Top Header Toolbar ── */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-primary-50 border border-primary-100 text-primary-600">
            <Navigation2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                Bilateral Trade Corridors &amp; Freight Routing
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-bold">
                MapTiler Streets GIS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live geodesic in-routes &amp; out-routes, air flight times, ocean transit, and customs thresholds.
            </p>
          </div>
        </div>

        {/* Route Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setRouteFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                routeFilter === 'all'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Routes ({connectedTradePartners.length})
            </button>
            <button
              type="button"
              onClick={() => setRouteFilter('export')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                routeFilter === 'export'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Out-routes (Exports)
            </button>
            <button
              type="button"
              onClick={() => setRouteFilter('import')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                routeFilter === 'import'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In-routes (Imports)
            </button>
          </div>

          <button
            type="button"
            onClick={handleFitBounds}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-2xs"
            title="Fit to network"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Fit Network</span>
          </button>
        </div>
      </div>

      {/* ── Focal Country Selector Bar ── */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-500 font-mono text-[11px]">
          <Navigation2 className="w-3.5 h-3.5 text-primary-600" />
          <span>Focal Origin/Hub: <strong className="text-slate-900 font-bold">{selectedCountryInfo.flag} {selectedCountryInfo.name}</strong></span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {allCountries.map(code => {
            const loc = COUNTRY_GEO_REGISTRY[code];
            if (!loc) return null;
            const isSelected = selectedCountry === code;

            return (
              <button
                key={code}
                type="button"
                onClick={() => handleSelectCountry(code)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm ring-2 ring-primary-200 scale-105'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{loc.flag}</span>
                <span>{code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Leaflet Map Viewport ── */}
      <div className="relative">
        <div ref={containerRef} className="h-[500px] w-full bg-slate-100 z-0" />

        {/* Floating Legend / Grounding Info */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur border border-slate-200 rounded-2xl px-3 py-2 text-[11px] text-slate-700 flex flex-wrap items-center gap-3 shadow-lg">
          <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-600 animate-ping" />
            Focal Country: {selectedCountryInfo.flag} {selectedCountryInfo.name}
          </span>
          <span className="h-3 w-px bg-slate-200" />
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Out-routes (Export)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            In-routes (Import)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            Bilateral
          </span>
          <span className="h-3 w-px bg-slate-200" />
          <span className="text-slate-500 text-[10px]">
            Click any country pin or pill to re-center
          </span>
        </div>
      </div>

      {/* ── Partner Corridor Cards Drawer ── */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <div className="text-[11px] font-mono text-slate-500 mb-2 flex items-center justify-between">
          <span>Active Trade Corridors Connected to {selectedCountryInfo.name} ({displayedPartners.length}):</span>
          <span className="text-slate-400 hidden sm:inline">Calculated via Great-Circle Geodesic Projection</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {displayedPartners.map(p => {
            const isFocused = focusedPartnerCode === p.code;

            const flowBadgeColor =
              p.flow === 'export'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : p.flow === 'import'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-sky-50 text-sky-700 border-sky-200';

            return (
              <div
                key={p.code}
                onClick={() => setFocusedPartnerCode(isFocused ? null : p.code)}
                className={`flex-shrink-0 p-3.5 rounded-2xl border transition-all cursor-pointer min-w-[240px] max-w-[270px] ${
                  isFocused
                    ? 'bg-white border-primary-500 shadow-md ring-2 ring-primary-100 scale-102'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{p.flag}</span>
                    <div>
                      <strong className="text-xs text-slate-900 block">{p.name}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{p.code}</span>
                    </div>
                  </div>

                  <span className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full border ${flowBadgeColor}`}>
                    {p.flow}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-baseline justify-between text-xs font-mono">
                  <span className="font-bold text-slate-900">
                    {p.distanceKm.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">km</span>
                  </span>
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Plane className="w-3 h-3 text-sky-500" /> ~{p.flightTime}
                  </span>
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Ship className="w-3 h-3 text-indigo-500" /> ~{p.oceanDays}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>De Minimis:</span>
                    <strong className="text-slate-800">{p.deMinimis}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Estimated Duty:</span>
                    <strong className="text-slate-800">{p.dutyRate}</strong>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 leading-relaxed bg-slate-50 p-1.5 rounded-lg">
                  {p.recommendation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
