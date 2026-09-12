import { ListingInput, AuditResponse, PresetListing, TradeEconomicsItem, ProductComplianceVerificationResponse, VerificationPreset } from './types';

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

export async function sendChatMessage(message: string, history?: any[], context?: any): Promise<any> {
  const res = await fetch(`${API_BASE}/chatbot/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_history: history, context }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Chatbot request failed' }));
    throw new Error(err.detail || 'Chatbot request failed');
  }
  return res.json();
}

export async function calculateProfit(params: {
  product_name?: string;
  category: string;
  country_code: string;
  selling_price_usd: number;
  unit_cost_usd: number;
  shipping_cost_usd: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/chatbot/calculate-profit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Profit calculation failed');
  return res.json();
}

export async function fetchRequiredDocuments(category: string, country: string): Promise<any> {
  const res = await fetch(`${API_BASE}/chatbot/documents?category=${encodeURIComponent(category)}&country=${encodeURIComponent(country)}`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function fetchSupportedCountries(): Promise<any> {
  const res = await fetch(`${API_BASE}/chatbot/countries`);
  if (!res.ok) throw new Error('Failed to fetch countries');
  return res.json();
}

// ── Compliance Confidence & Dependency Graph API ──
export async function fetchComplianceConfidence(
  auditData: any,
  targetMarket?: string,
  simulatedResolvedIds: string[] = []
): Promise<any> {
  const res = await fetch(`${API_BASE}/compliance/confidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audit_data: auditData,
      target_market: targetMarket,
      simulated_resolved_ids: simulatedResolvedIds,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch confidence score' }));
    throw new Error(err.detail || 'Failed to fetch confidence score');
  }
  return res.json();
}

export async function simulateConfidenceResolution(
  auditData: any,
  targetMarket?: string,
  resolvedNodeIds: string[] = []
): Promise<any> {
  const res = await fetch(`${API_BASE}/compliance/confidence/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audit_data: auditData,
      target_market: targetMarket,
      resolved_node_ids: resolvedNodeIds,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Simulation request failed' }));
    throw new Error(err.detail || 'Simulation request failed');
  }
  return res.json();
}

export async function fetchProductComplianceConfidence(
  productId: string,
  targetMarket?: string
): Promise<any> {
  const q = targetMarket ? `?target_market=${encodeURIComponent(targetMarket)}` : '';
  const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/compliance-confidence${q}`);
  if (!res.ok) throw new Error('Failed to fetch product compliance confidence');
  return res.json();
}

export async function verifyProductCompliance(
  productData: any,
  targetMarket?: string
): Promise<ProductComplianceVerificationResponse> {
  const res = await fetch(`${API_BASE}/api/compliance/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product: productData,
      target_market: targetMarket || 'EU',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Rule verification failed' }));
    throw new Error(err.detail || 'Rule verification failed');
  }
  return res.json();
}

export async function fetchVerificationPresets(): Promise<VerificationPreset[]> {
  const res = await fetch(`${API_BASE}/api/compliance/verify/presets`);
  if (!res.ok) throw new Error('Failed to fetch verification presets');
  return res.json();
}

export async function fetchMarketEconomicsReference(): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/economics/markets`);
  if (!res.ok) throw new Error('Failed to fetch market economics reference');
  return res.json();
}


