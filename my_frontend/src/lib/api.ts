import { ListingInput, AuditResponse, PresetListing } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// ── Core Audit ──────────────────────────────────────────
export async function runComplianceAudit(input: ListingInput): Promise<AuditResponse> {
  const res = await fetch(`${API_BASE}/compliance/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Server returned ${res.status}`);
  }
  return await res.json();
}

export async function fetchInspections(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/compliance/inspections`);
  if (!res.ok) throw new Error('Backend failed to fetch inspections');
  return await res.json();
}

// ── Listings / Presets ───────────────────────────────────
export async function fetchPresets(): Promise<PresetListing[]> {
  const res = await fetch(`${API_BASE}/listings/presets`);
  if (!res.ok) throw new Error('Failed to fetch presets');
  return res.json();
}

// ── Scraper ──────────────────────────────────────────────
export async function scrapeListingUrl(url: string): Promise<any> {
  const res = await fetch(`${API_BASE}/scraper/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error('Scraping failed');
  return res.json();
}

// ── Hash Chain ───────────────────────────────────────────
export async function verifyComplianceHash(payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/hashes/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Hash verification failed');
  return res.json();
}

export async function getHashChain(): Promise<any> {
  const res = await fetch(`${API_BASE}/hashes/chain`);
  if (!res.ok) throw new Error('Failed to fetch hash chain');
  return res.json();
}

// ── Regulatory Simulator ─────────────────────────────────
export async function getSimulationStatus(): Promise<Record<string, boolean>> {
  const res = await fetch(`${API_BASE}/simulator/status`);
  if (!res.ok) throw new Error('Failed to fetch simulation status');
  return res.json();
}

export async function toggleSimulation(simulationId: string, isActive: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/simulator/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simulation_id: simulationId, is_active: isActive }),
  });
  if (!res.ok) throw new Error('Simulation toggle failed');
  return res.json();
}

// ── Intelligence / AI Copilot ────────────────────────────
export async function queryIntelligence(query: string): Promise<any> {
  const res = await fetch(`${API_BASE}/intelligence/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error('Query failed');
  }
  return await res.json();
}

// ── Reports / PDF ─────────────────────────────────────────
export async function downloadPdfReport(auditData: AuditResponse): Promise<void> {
  const res = await fetch(`${API_BASE}/reports/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auditData),
  });
  if (!res.ok) throw new Error('PDF generation failed');
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `LexPort_Audit_${auditData.inspection_id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

// ── Economics ─────────────────────────────────────────────
export async function fetchEconomics(hsCode?: string): Promise<any> {
  const url = hsCode ? `${API_BASE}/economics?hs_code=${hsCode}` : `${API_BASE}/economics`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch economics');
  return res.json();
}

// ── AI Description Generator ─────────────────────────────
export async function generateDescription(
  params: string | { title: string; key_features?: string; target_market?: string },
  keywords?: string
): Promise<any> {
  const title = typeof params === 'string' ? params : params.title;
  const kw = typeof params === 'string' ? (keywords || '') : (params.key_features || '');
  
  const res = await fetch(`${API_BASE}/intelligence/generate-description`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_name: title, keywords: kw }),
  });
  if (!res.ok) throw new Error('Failed to generate description');
  return await res.json();
}

// ── HS Code Classification ──────────────────────────────
export async function fetchHsClassification(query: string): Promise<any> {
  const res = await fetch(`${API_BASE}/intelligence/classify-hs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Failed to classify HS code');
  return await res.json();
}

// ── Heat Map ────────────────────────────────────────────────
export async function fetchHeatmapData(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/compliance/heatmap`);
  if (!res.ok) throw new Error('Failed to fetch heatmap data');
  return await res.json();
}

