'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { AuditResponse, ListingInput, TradeEconomicsItem } from '../lib/types';
import {
  Globe, Key, RefreshCw, Check, ExternalLink, Sliders, MapPin,
  Navigation2, Plane, Ruler, ArrowRight, ShieldCheck, AlertTriangle, XCircle,
  Layers, Database, Sparkles, Building2, TrendingUp, Info
} from 'lucide-react';

type Coordinates = [number, number];

// Extensive ISO Geocentric Coordinate Registry (Allows backend to add any sovereign country dynamically)
const COUNTRY_GEO_REGISTRY: Record<string, { name: string; flag: string; coordinates: Coordinates }> = {
  US: { name: 'United States', flag: '🇺🇸', coordinates: [39.8283, -98.5795] },
  UK: { name: 'United Kingdom', flag: '🇬🇧', coordinates: [55.3781, -3.4360] },
  CA: { name: 'Canada', flag: '🇨🇦', coordinates: [56.1304, -106.3468] },
  JP: { name: 'Japan', flag: '🇯🇵', coordinates: [36.2048, 138.2529] },
  DE: { name: 'Germany', flag: '🇩🇪', coordinates: [51.1657, 10.4515] },
  EU: { name: 'European Union', flag: '🇪🇺', coordinates: [50.8503, 4.3517] },
  IN: { name: 'India', flag: '🇮🇳', coordinates: [21.84, 82.79] },
  BR: { name: 'Brazil', flag: '🇧🇷', coordinates: [-14.2350, -51.9253] },
  CN: { name: 'China', flag: '🇨🇳', coordinates: [35.8617, 104.1954] },
  AU: { name: 'Australia', flag: '🇦🇺', coordinates: [-25.2744, 133.7751] },
  SG: { name: 'Singapore', flag: '🇸🇬', coordinates: [1.3521, 103.8198] },
  AE: { name: 'United Arab Emirates', flag: '🇦🇪', coordinates: [23.4241, 53.8478] },
  MX: { name: 'Mexico', flag: '🇲🇽', coordinates: [23.6345, -102.5528] },
  FR: { name: 'France', flag: '🇫🇷', coordinates: [46.2276, 2.2137] },
  IT: { name: 'Italy', flag: '🇮🇹', coordinates: [41.8719, 12.5674] },
  ES: { name: 'Spain', flag: '🇪🇸', coordinates: [40.4637, -3.7492] },
  NL: { name: 'Netherlands', flag: '🇳🇱', coordinates: [52.1326, 5.2913] },
  KR: { name: 'South Korea', flag: '🇰🇷', coordinates: [35.9078, 127.7669] },
  VN: { name: 'Vietnam', flag: '🇻🇳', coordinates: [14.0583, 108.2772] },
  TH: { name: 'Thailand', flag: '🇹🇭', coordinates: [15.8700, 100.9925] },
  CH: { name: 'Switzerland', flag: '🇨🇭', coordinates: [46.8182, 8.2275] },
  SE: { name: 'Sweden', flag: '🇸🇪', coordinates: [60.1282, 18.6435] },
  NZ: { name: 'New Zealand', flag: '🇳🇿', coordinates: [-40.9006, 174.8860] },
  ZA: { name: 'South Africa', flag: '🇿🇦', coordinates: [-30.5595, 22.9375] },
  TR: { name: 'Turkey', flag: '🇹🇷', coordinates: [38.9637, 35.2433] },
  SA: { name: 'Saudi Arabia', flag: '🇸🇦', coordinates: [23.8859, 45.0792] },
  ID: { name: 'Indonesia', flag: '🇮🇩', coordinates: [-0.7893, 113.9213] },
  MY: { name: 'Malaysia', flag: '🇲🇾', coordinates: [4.2105, 101.9758] },
  PH: { name: 'Philippines', flag: '🇵🇭', coordinates: [12.8797, 121.7740] },
  CL: { name: 'Chile', flag: '🇨🇱', coordinates: [-35.6751, -71.5430] },
  CO: { name: 'Colombia', flag: '🇨🇴', coordinates: [4.5709, -74.2973] },
  AR: { name: 'Argentina', flag: '🇦🇷', coordinates: [-38.4161, -63.6167] },
};

// Helper to normalize any country string from backend to an ISO key
function normalizeCountryCode(nameOrCode?: string): string {
  if (!nameOrCode) return 'IN';
  const clean = nameOrCode.trim().toUpperCase();
  if (COUNTRY_GEO_REGISTRY[clean]) return clean;

  const lower = nameOrCode.trim().toLowerCase();
  for (const [code, entry] of Object.entries(COUNTRY_GEO_REGISTRY)) {
    if (entry.name.toLowerCase() === lower || code.toLowerCase() === lower) {
      return code;
    }
  }

  // Common aliases
  if (lower.includes('united states') || lower === 'usa') return 'US';
  if (lower.includes('united kingdom') || lower === 'great britain') return 'UK';
  if (lower.includes('european union')) return 'EU';
  if (lower.includes('vietnam')) return 'VN';
  if (lower.includes('korea')) return 'KR';
  if (lower.includes('emirates') || lower.includes('uae')) return 'AE';

  return clean.slice(0, 2);
}

// Tile provider configurations
type TileProvider = 'maptiler_streets' | 'maptiler_dark' | 'osm_standard' | 'stadia_smooth' | 'thunderforest_transport' | 'custom';

interface TileProviderConfig {
  name: string;
  url: string;
  attribution: string;
  requiresKey: boolean;
  maxZoom?: number;
}

const MAPTILER_API_KEY_DEFAULT = 'CTTf1GnjFmqpYI0cPqIC';

const TILE_PROVIDERS: Record<TileProvider, TileProviderConfig> = {
  maptiler_streets: {
    name: 'MapTiler Streets v2 (API Key Active)',
    url: 'https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key={apiKey}',
    attribution: '&copy; <a href="https://www.maptiler.com/" target="_blank" rel="noopener">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    requiresKey: true,
    maxZoom: 19,
  },
  maptiler_dark: {
    name: 'MapTiler Dataviz Dark (Enterprise Dark Mode)',
    url: 'https://api.maptiler.com/maps/dataviz-dark/256/{z}/{x}/{y}.png?key={apiKey}',
    attribution: '&copy; <a href="https://www.maptiler.com/" target="_blank" rel="noopener">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    requiresKey: true,
    maxZoom: 19,
  },
  osm_standard: {
    name: 'OpenStreetMap (Standard — Free / No Key)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    requiresKey: false,
    maxZoom: 19,
  },
  stadia_smooth: {
    name: 'Stadia Maps Alidade Smooth (API Key)',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key={apiKey}',
    attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noopener">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    requiresKey: true,
    maxZoom: 20,
  },
  thunderforest_transport: {
    name: 'Thunderforest Transport (API Key)',
    url: 'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey={apiKey}',
    attribution: '&copy; <a href="https://www.thunderforest.com/" target="_blank" rel="noopener">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    requiresKey: true,
    maxZoom: 18,
  },
  custom: {
    name: 'Custom Tile Server Template',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    requiresKey: true,
    maxZoom: 19,
  },
};

// Haversine distance in kilometers
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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function formatFlightTime(distanceKm: number): string {
  const cruiseSpeedKmH = 850;
  const hoursDecimal = distanceKm / cruiseSpeedKmH;
  const hours = Math.floor(hoursDecimal);
  const minutes = Math.round((hoursDecimal - hours) * 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

function formatOceanDays(distanceKm: number): string {
  const days = Math.round((distanceKm * 1.15) / (35 * 24));
  return `${days} days`;
}

function bearing(from: Coordinates, to: Coordinates) {
  const radians = Math.PI / 180;
  const longitudeDifference = (to[1] - from[1]) * radians;
  const latitude1 = from[0] * radians;
  const latitude2 = to[0] * radians;
  const y = Math.sin(longitudeDifference) * Math.cos(latitude2);
  const x = Math.cos(latitude1) * Math.sin(latitude2) - Math.sin(latitude1) * Math.cos(latitude2) * Math.cos(longitudeDifference);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

interface ConnectedPartner {
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
  deMinimis?: string;
  dutyRate?: string;
  vatRate?: string;
  scheme?: string;
  complexityScore?: number;
  frictionRank?: number;
  recommendation?: string;
}

interface LeafletTradeMapProps {
  currentInput: ListingInput;
  auditData: AuditResponse;
  onSelectCountry?: (code: string) => void;
  apiKey?: string;
}

export default function LeafletTradeMap({
  currentInput,
  auditData,
  onSelectCountry,
  apiKey: propApiKey
}: LeafletTradeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Live backend markets fetched dynamically from /economics/markets
  const [backendMarketsData, setBackendMarketsData] = useState<Record<string, any>>({});

  // Fetch backend economics markets dynamically on mount
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
        console.warn('Could not fetch backend markets endpoint, using auditData fallback:', err);
      }
    }
    loadBackendMarkets();
  }, []);

  // 1. Dynamically compute ALL countries present in the backend system:
  // Derived from:
  //   a) auditData.destination_markets
  //   b) auditData.trade_economics
  //   c) Object.keys(auditData.matrix)
  //   d) currentInput.country_of_origin
  //   e) backendMarketsData keys
  const allBackendCountries = useMemo(() => {
    const set = new Set<string>();

    // Origin country from backend listing input
    const originCode = normalizeCountryCode(currentInput?.country_of_origin);
    set.add(originCode);

    // Destination markets returned by backend audit
    (auditData?.destination_markets || []).forEach(m => set.add(normalizeCountryCode(m)));

    // Markets in backend trade_economics
    (auditData?.trade_economics || []).forEach(e => set.add(normalizeCountryCode(e.country_code)));

    // Markets in backend matrix
    Object.keys(auditData?.matrix || {}).forEach(m => set.add(normalizeCountryCode(m)));

    // Markets from backend /economics/markets endpoint
    Object.keys(backendMarketsData || {}).forEach(m => set.add(normalizeCountryCode(m)));

    // Always include Brazil 'BR' as requested for instant 1-country focal trade selection
    set.add('BR');

    // Include preset origins
    set.add('IN');
    set.add('CN');
    set.add('VN');

    return Array.from(set).filter(code => Boolean(COUNTRY_GEO_REGISTRY[code]));
  }, [currentInput?.country_of_origin, auditData, backendMarketsData]);

  // The 1 specific country selected by user (defaults to Brazil 'BR' as requested, or active origin)
  const [selectedCountry, setSelectedCountry] = useState<string>('BR');

  // Keep selected country valid if backend countries update
  useEffect(() => {
    if (allBackendCountries.length > 0 && !allBackendCountries.includes(selectedCountry)) {
      setSelectedCountry(allBackendCountries.includes('BR') ? 'BR' : allBackendCountries[0]);
    }
  }, [allBackendCountries, selectedCountry]);

  // 2. Active Selected Country Details
  const selectedCountryInfo = COUNTRY_GEO_REGISTRY[selectedCountry] || {
    name: selectedCountry,
    flag: '🌐',
    coordinates: [0, 0] as Coordinates,
  };

  // Origin code from backend listing
  const backendOriginCode = normalizeCountryCode(currentInput?.country_of_origin);

  // 3. Dynamically Compute All Connected Partner Countries from the Backend:
  // If Selected Country is the Origin: It connects to all backend destination markets.
  // If Selected Country is a Destination: It connects to the backend Origin AND to all other backend trade destinations.
  const connectedTradePartners: ConnectedPartner[] = useMemo(() => {
    const partners: ConnectedPartner[] = [];

    allBackendCountries.forEach(partnerCode => {
      if (partnerCode === selectedCountry) return; // Cannot connect to self
      const partnerGeo = COUNTRY_GEO_REGISTRY[partnerCode];
      if (!partnerGeo) return;

      // Backend trade economics for this partner
      const ecoItem = auditData?.trade_economics?.find(
        e => normalizeCountryCode(e.country_code) === partnerCode
      );
      const backendMarketInfo = backendMarketsData[partnerCode];

      // Backend compliance status summary
      const countrySummary = auditData?.summary_by_country?.[partnerCode];
      let status: 'cleared' | 'warning' | 'blocked' = 'cleared';
      let statusLabel = 'CLEARED';

      if (countrySummary?.violation || countrySummary?.escalation) {
        status = 'blocked';
        statusLabel = 'BLOCKED (STATUTORY ROADBLOCKS)';
      } else if (countrySummary?.warning) {
        status = 'warning';
        statusLabel = 'CONDITIONAL CLEARANCE';
      }

      // Determine trade flow relationship relative to backend origin
      let flow: 'export' | 'import' | 'bilateral' = 'bilateral';
      if (selectedCountry === backendOriginCode) {
        flow = 'export'; // Origin exports to this partner
      } else if (partnerCode === backendOriginCode) {
        flow = 'import'; // Selected destination imports from origin
      } else {
        flow = 'bilateral'; // Cross-border partner trade
      }

      // Exact Great-Circle distance
      const distKm = calculateHaversineDistanceKm(
        selectedCountryInfo.coordinates,
        partnerGeo.coordinates
      );

      // De Minimis & Tariff values from backend
      const deMinimisVal = ecoItem?.de_minimis_threshold ?? backendMarketInfo?.de_minimis_threshold;
      const deMinimisCurr = ecoItem?.de_minimis_currency ?? backendMarketInfo?.de_minimis_currency ?? 'USD';
      const deMinimisStr = deMinimisVal !== undefined ? `${deMinimisCurr} ${deMinimisVal}` : 'Standard';

      const dutyRateStr = ecoItem?.estimated_duty_rate ?? backendMarketInfo?.estimated_duty_rate ?? 'Standard Rate';
      const vatRateStr = ecoItem?.vat_gst_rate ?? backendMarketInfo?.vat_gst_rate ?? 'Standard VAT';
      const schemeStr = ecoItem?.simplification_scheme ?? backendMarketInfo?.simplification_scheme ?? 'Standard Customs Entry';
      const complexity = ecoItem?.customs_complexity_score ?? backendMarketInfo?.customs_complexity_score ?? 5;
      const rank = ecoItem?.entry_friction_rank ?? backendMarketInfo?.entry_friction_rank ?? 99;
      const recommendation = ecoItem?.recommendation_summary ?? backendMarketInfo?.recommendation_summary ?? 'Active trade connection grounded in backend compliance database.';

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
        deMinimis: deMinimisStr,
        dutyRate: dutyRateStr,
        vatRate: vatRateStr,
        scheme: schemeStr,
        complexityScore: complexity,
        frictionRank: rank,
        recommendation,
      });
    });

    // Sort by distance or friction rank
    return partners.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [
    allBackendCountries,
    selectedCountry,
    selectedCountryInfo,
    backendOriginCode,
    auditData,
    backendMarketsData,
  ]);

  const [focusedPartnerCode, setFocusedPartnerCode] = useState<string | null>(null);

  // API Key state management
  const [apiKey, setApiKey] = useState<string>(() => {
    if (propApiKey) return propApiKey;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lexport_map_api_key');
      if (stored && stored.trim()) return stored;
    }
    return (
      process.env.NEXT_PUBLIC_MAPTILER_API_KEY ||
      process.env.NEXT_PUBLIC_MAP_API_KEY ||
      process.env.NEXT_PUBLIC_OSM_API_KEY ||
      MAPTILER_API_KEY_DEFAULT
    );
  });

  const [tileProvider, setTileProvider] = useState<TileProvider>('maptiler_streets');
  const [customTileUrl, setCustomTileUrl] = useState<string>('');
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);

  const handleSelectCountry = (code: string) => {
    setSelectedCountry(code);
    setFocusedPartnerCode(null);
    if (onSelectCountry) onSelectCountry(code);
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lexport_map_api_key', key);
    }
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 2200);
  };

  // Re-frame to show selected country & its backend connections
  const handleFitBounds = () => {
    if (mapInstanceRef.current && selectedCountryInfo) {
      const L = (window as any).L;
      if (L) {
        const bounds = L.latLngBounds([selectedCountryInfo.coordinates]);
        connectedTradePartners.forEach(p => bounds.extend(p.coordinates));
        mapInstanceRef.current.fitBounds(bounds.pad(0.35), { maxZoom: 4 });
      }
    }
  };

  useEffect(() => {
    let map: import('leaflet').Map | undefined;
    let disposed = false;

    async function renderMap() {
      const L = await import('leaflet');
      if (disposed || !containerRef.current) return;

      // Fix default Leaflet marker assets
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      (window as any).L = L;

      // Initialize Map
      map = L.map(containerRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        worldCopyJump: true,
        minZoom: 2,
        maxZoom: 18,
      }).setView(selectedCountryInfo.coordinates, 3);

      mapInstanceRef.current = map;

      // Configure Tile Layer
      const providerConfig = TILE_PROVIDERS[tileProvider];
      let tileUrl = providerConfig.url;

      if (tileProvider === 'custom' && customTileUrl) {
        tileUrl = customTileUrl;
      }

      if (providerConfig.requiresKey && apiKey) {
        tileUrl = tileUrl.replace('{apiKey}', encodeURIComponent(apiKey.trim()));
      } else if (providerConfig.requiresKey && !apiKey) {
        tileUrl = TILE_PROVIDERS.osm_standard.url;
      }

      L.tileLayer(tileUrl, {
        maxZoom: providerConfig.maxZoom || 19,
        attribution: providerConfig.attribution,
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);

      // Add Zoom Control to Top-Right
      L.control.zoom({ position: 'topright' }).addTo(map);

      const bounds = L.latLngBounds([selectedCountryInfo.coordinates]);

      // 1. Draw live trade corridors to all backend-connected partner countries
      connectedTradePartners.forEach(p => {
        bounds.extend(p.coordinates);

        const isHighlighted = focusedPartnerCode === p.code;

        // Flow colors
        const strokeColor =
          p.flow === 'export' ? '#10b981' : p.flow === 'import' ? '#f59e0b' : '#38bdf8';

        // Draw polyline
        const route = L.polyline([selectedCountryInfo.coordinates, p.coordinates], {
          color: strokeColor,
          weight: isHighlighted ? 5.5 : 3.5,
          opacity: isHighlighted ? 1 : 0.82,
          dashArray: p.flow === 'bilateral' ? '10 6' : '14 8',
          lineCap: 'round',
        }).addTo(map!);

        route.bindTooltip(
          `<div class="font-sans text-xs">
            <strong style="color:${strokeColor};">${selectedCountryInfo.flag} ${selectedCountryInfo.name} ➔ ${p.flag} ${p.name}</strong><br/>
            <span>Flow: <strong>${p.flow.toUpperCase()}</strong> · Compliance: <strong>${p.statusLabel}</strong></span><br/>
            <span style="font-weight:bold;">Distance: ${p.distanceKm.toLocaleString()} km (${p.distanceMiles.toLocaleString()} mi)</span><br/>
            <span style="color:#64748b;">De Minimis: ${p.deMinimis} · Scheme: ${p.scheme}</span>
          </div>`,
          { sticky: true }
        );

        route.on('click', () => setFocusedPartnerCode(p.code));

        // Direction arrow in midpoint
        const angle = bearing(selectedCountryInfo.coordinates, p.coordinates);
        const midLat = (selectedCountryInfo.coordinates[0] + p.coordinates[0]) / 2;
        const midLng = (selectedCountryInfo.coordinates[1] + p.coordinates[1]) / 2;

        const arrowIcon = L.divIcon({
          className: '',
          html: `<div style="color:${strokeColor};font-size:22px;line-height:1;text-shadow:0 1px 4px #0f172a;transform:rotate(${angle + 90}deg)">➤</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        L.marker([midLat, midLng], { icon: arrowIcon, interactive: false, zIndexOffset: 300 }).addTo(map!);

        // Floating Distance Badge on Corridor
        const distanceBadgeIcon = L.divIcon({
          className: '',
          html: `
            <div style="background:#0f172a;color:#ffffff;border:1.5px solid ${strokeColor};font-size:9.5px;font-weight:bold;font-family:ui-monospace,monospace;padding:2px 7px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,0.6);white-space:nowrap;transform:translate(-50%,-130%);display:flex;align-items:center;gap:3px;cursor:pointer;">
              <span style="color:${strokeColor};">↔</span>
              <span>${p.distanceKm.toLocaleString()} km</span>
            </div>
          `,
          iconSize: [0, 0],
        });
        const distMarker = L.marker([midLat, midLng], { icon: distanceBadgeIcon, interactive: true, zIndexOffset: 400 }).addTo(map!);
        distMarker.bindTooltip(`${selectedCountryInfo.name} to ${p.name}: ${p.distanceKm.toLocaleString()} km · Air: ${p.flightTime} · Ocean: ${p.oceanDays}`);

        // Destination Partner Pin
        const partnerIcon = L.divIcon({
          className: '',
          html: `
            <div style="width:34px;height:34px;border-radius:50%;background:#0f172a;border:2.5px solid ${strokeColor};box-shadow:0 0 10px ${strokeColor}80;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
              <span>${p.flag}</span>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const partnerMarker = L.marker(p.coordinates, { icon: partnerIcon, zIndexOffset: 700 }).addTo(map!);

        partnerMarker.bindPopup(
          `<div style="color:#0f172a;font-family:system-ui,sans-serif;padding:6px;max-width:270px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:24px;">${p.flag}</span>
                <div>
                  <strong style="font-size:13px;display:block;">${p.name} (${p.code})</strong>
                  <span style="font-size:10px;color:#64748b;">Backend Connected Market</span>
                </div>
              </div>
              <span style="font-size:9px;font-weight:bold;padding:2px 6px;border-radius:999px;background:${strokeColor}20;color:${strokeColor};border:1px solid ${strokeColor}50;">
                ${p.flow.toUpperCase()}
              </span>
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px;font-size:11px;margin-bottom:6px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="color:#64748b;">Haversine Distance:</span>
                <strong style="font-family:monospace;color:#0284c7;">${p.distanceKm.toLocaleString()} km (${p.distanceMiles.toLocaleString()} mi)</strong>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="color:#64748b;">De Minimis:</span>
                <strong>${p.deMinimis}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="color:#64748b;">Tariff / VAT:</span>
                <strong>${p.dutyRate} / ${p.vatRate}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span style="color:#64748b;">Transit Time:</span>
                <strong>Air ~${p.flightTime} · Ocean ~${p.oceanDays}</strong>
              </div>
            </div>

            <p style="font-size:10px;color:#475569;margin-bottom:8px;line-height:1.3;">
              ${p.recommendation}
            </p>

            <button
              id="btn-switch-focus-${p.code}"
              style="width:100%;padding:6px 8px;background:#0284c7;color:#ffffff;border:none;border-radius:6px;font-size:11px;font-weight:bold;cursor:pointer;"
            >
              Select ${p.name} as Focal Country ➔
            </button>
          </div>`
        );

        partnerMarker.on('popupopen', () => {
          const btn = document.getElementById(`btn-switch-focus-${p.code}`);
          if (btn) {
            btn.onclick = () => {
              handleSelectCountry(p.code);
              partnerMarker.closePopup();
            };
          }
        });
      });

      // 2. Central Focal Origin Marker for the 1 Selected Country (e.g. Brazil)
      const primaryIcon = L.divIcon({
        className: 'custom-leaflet-primary-origin-icon',
        html: `
          <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:48px;height:48px;border-radius:50%;background:rgba(2,132,199,0.35);animation:ping 2.2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute;width:38px;height:38px;border-radius:50%;background:#0284c7;border:3px solid #ffffff;box-shadow:0 0 16px rgba(14,165,233,0.9);display:flex;align-items:center;justify-content:center;font-size:18px;">
              ${selectedCountryInfo.flag}
            </div>
            <div style="position:absolute;bottom:-16px;background:#0284c7;color:#ffffff;border:1px solid #ffffff;font-size:9px;font-weight:bold;font-family:monospace;padding:1px 6px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.4);">
              ${selectedCountry} (FOCAL)
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const primaryMarker = L.marker(selectedCountryInfo.coordinates, { icon: primaryIcon, zIndexOffset: 1200 }).addTo(map);
      primaryMarker.bindTooltip(
        `<div class="font-sans text-xs">
          <strong>${selectedCountryInfo.name} (${selectedCountry})</strong><br/>
          <span class="text-sky-300 font-bold">Active Focal Country</span><br/>
          <span>Connected to ${connectedTradePartners.length} Backend Partner Corridors</span>
        </div>`,
        { permanent: false, direction: 'top', offset: [0, -22] }
      );

      // Smoothly fit map view to show the selected country and all its connected trade partners
      if (connectedTradePartners.length > 0 && bounds.isValid()) {
        map.fitBounds(bounds.pad(0.35), { maxZoom: 4 });
      }

      window.setTimeout(() => map?.invalidateSize(), 150);
    }

    renderMap();
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [
    selectedCountry,
    selectedCountryInfo,
    connectedTradePartners,
    focusedPartnerCode,
    tileProvider,
    apiKey,
    customTileUrl,
  ]);

  const activeProvider = TILE_PROVIDERS[tileProvider];
  const isKeyRequired = activeProvider.requiresKey;
  const hasKey = Boolean(apiKey.trim());

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all">
      
      {/* ── Top Header Bar ── */}
      <div className="px-5 py-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Backend-Driven Trade Corridors & Distance Analyzer
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  Live Backend Schema Grounded
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Wholly driven by backend markets & audit data. If the backend adds or connects new countries, they dynamically render here automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Fit Trade Network View */}
          <button
            type="button"
            onClick={handleFitBounds}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold transition-all"
            title="Auto-frame all connected trade partners"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" />
            <span>Fit {selectedCountryInfo.name} Corridors</span>
          </button>

          {/* API Key Toggle */}
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border font-bold transition-all ${
              showConfig || (isKeyRequired && !hasKey)
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : hasKey
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Tile API Key</span>
          </button>

          {/* External OSM Link */}
          <a
            href="https://www.openstreetmap.org/#map=5/21.84/82.79"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="Open reference coordinates directly on openstreetmap.org"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

        </div>
      </div>

      {/* ── Optional Tile Provider & API Key Configuration Drawer ── */}
      {showConfig && (
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-xs animate-fadeIn">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                Tile Layer & API Key Configuration
              </span>
              <span className="text-[11px] text-slate-400">
                {isKeyRequired ? 'Authenticated Tile Provider Active' : 'OpenStreetMap standard tile server active (No API key needed)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">Tile Provider:</label>
                <select
                  value={tileProvider}
                  onChange={e => setTileProvider(e.target.value as TileProvider)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-sky-500"
                >
                  {Object.entries(TILE_PROVIDERS).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                  {isKeyRequired ? 'API Key (Required for this provider):' : 'API Key (Optional / Stored for custom tiles):'}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder={isKeyRequired ? 'Enter your tile API key...' : 'No key needed for standard OSM'}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveApiKey(apiKey)}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center space-x-1 shrink-0 transition-colors"
                  >
                    {isKeySaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <span>Save Key</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Single Country Selection Bar (Populated Dynamically from Backend) ── */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white">
              Select 1 Focal Country to View Its Connected Backend Trade Network:
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Active Focal Country: <strong className="text-sky-300">{selectedCountryInfo.flag} {selectedCountryInfo.name}</strong> ({connectedTradePartners.length} Connected Corridors)
          </span>
        </div>

        {/* Dynamic Country Selector Pills + Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {allBackendCountries.map(code => {
              const loc = COUNTRY_GEO_REGISTRY[code];
              if (!loc) return null;
              const isSelected = selectedCountry === code;

              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelectCountry(code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30 ring-2 ring-sky-400/50 scale-105'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <span>{loc.flag}</span>
                  <span>{loc.name}</span>
                  <span className="font-mono text-[10px] opacity-75">({code})</span>
                </button>
              );
            })}
          </div>

          {/* Quick Select for any sovereign country in registry */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-slate-400 font-mono hidden md:inline">Or choose country:</span>
            <select
              value={selectedCountry}
              onChange={e => handleSelectCountry(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-2.5 py-1.5 outline-none focus:border-sky-500 font-medium cursor-pointer"
            >
              {Object.entries(COUNTRY_GEO_REGISTRY)
                .sort((a, b) => a[1].name.localeCompare(b[1].name))
                .map(([code, item]) => (
                  <option key={code} value={code}>
                    {item.flag} {item.name} ({code})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Active Focal Country Trade Summary & Distance Breakdown ── */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
        
        {/* Country Profile Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-start sm:items-center space-x-3">
            <span className="text-3xl">{selectedCountryInfo.flag}</span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">
                  {selectedCountryInfo.name} Cross-Border Trade & Import/Export Corridors
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  {connectedTradePartners.length} Backend-Connected Partners
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic bilateral connections grounded in backend compliance rules and economics data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono text-[11px]">Backend Inspection:</span>
            <span className="text-sky-300 font-mono text-[11px] bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              {auditData?.inspection_id || 'Live'}
            </span>
          </div>
        </div>

        {/* Scrollable Cards for Each Backend Connected Partner & Haversine Distance */}
        <div className="pt-3">
          <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
            <span>Live Corridors & Distances from {selectedCountryInfo.name}:</span>
            <span className="text-slate-500 hidden sm:inline">Click any card or map pin to inspect corridor details</span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
            {connectedTradePartners.map(p => {
              const isFocused = focusedPartnerCode === p.code;

              const flowBadgeColor =
                p.flow === 'export'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : p.flow === 'import'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/40';

              return (
                <div
                  key={p.code}
                  onClick={() => setFocusedPartnerCode(isFocused ? null : p.code)}
                  className={`flex-shrink-0 p-3 rounded-xl border transition-all cursor-pointer min-w-[240px] max-w-[280px] ${
                    isFocused
                      ? 'bg-slate-800 border-sky-400 shadow-md ring-1 ring-sky-400/40 scale-102'
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{p.flag}</span>
                      <div>
                        <strong className="text-xs text-white block">{p.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{p.code}</span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${flowBadgeColor}`}>
                      {p.flow}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                    <span className="text-sm font-black text-sky-300 font-mono">
                      {p.distanceKm.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">km</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {p.distanceMiles.toLocaleString()} mi
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ~{p.flightTime}
                    </span>
                  </div>

                  {/* Backend Data: De Minimis and Duty */}
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 text-[10px] space-y-0.5">
                    <div className="flex justify-between text-slate-400">
                      <span>De Minimis:</span>
                      <strong className="text-slate-200">{p.deMinimis}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Tariff Rate:</span>
                      <strong className="text-slate-200">{p.dutyRate}</strong>
                    </div>
                  </div>

                  <p className="text-[9.5px] text-slate-400 mt-1 line-clamp-2 leading-relaxed" title={p.recommendation}>
                    {p.recommendation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Leaflet Map Viewport ── */}
      <div className="relative">
        <div ref={containerRef} className="h-[520px] w-full bg-slate-950 z-0" />

        {/* Floating Legend / Grounding Info */}
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-300 flex flex-wrap items-center gap-3 shadow-xl">
          <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            Focal Country: {selectedCountryInfo.flag} {selectedCountryInfo.name}
          </span>
          <span className="h-3 w-px bg-slate-700" />
          <span className="flex items-center gap-1">
            <i className="inline-block w-2.5 h-2.5 rounded-full bg-sky-400" />
            Bilateral Trade
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" />
            Export Flow
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
            Import Flow
          </span>
          <span className="h-3 w-px bg-slate-700" />
          <span className="text-slate-400">
            Click any partner pin or pill to switch focal country
          </span>
        </div>
      </div>

    </section>
  );
}
