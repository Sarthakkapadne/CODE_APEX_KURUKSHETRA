import { ListingInput, AuditResponse, PresetListing, TradeEconomicsItem } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function runComplianceAudit(input: ListingInput): Promise<AuditResponse> {
  const res = await fetch(`${API_BASE}/compliance/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Audit request failed' }));
    throw new Error(err.detail || 'Audit execution error');
  }
  return res.json();
}

export async function fetchPresets(): Promise<PresetListing[]> {
  const res = await fetch(`${API_BASE}/listings/presets`);
  if (!res.ok) throw new Error('Failed to fetch presets');
  return res.json();
}

export async function scrapeListingUrl(url: string): Promise<any> {
  const res = await fetch(`${API_BASE}/scraper/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error('Scraping failed');
  return res.json();
}

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

export async function queryIntelligence(query: string): Promise<any> {
  const res = await fetch(`${API_BASE}/intelligence/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Query failed' }));
    throw new Error(err.detail || 'Intelligence query failed');
  }
  return res.json();
}

export async function downloadPdfReport(auditData: AuditResponse): Promise<void> {
  const res = await fetch(`${API_BASE}/reports/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auditData),
  });
  if (!res.ok) throw new Error('PDF export failed');
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
