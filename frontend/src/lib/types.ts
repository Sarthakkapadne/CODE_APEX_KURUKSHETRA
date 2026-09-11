export interface ListingInput {
  title: string;
  description: string;
  brand_name?: string;
  category_hint?: string;
  price?: number;
  currency?: string;
  country_of_origin?: string;
  destination_markets: string[];
  source_url?: string;
}

export interface ExtractedAttributes {
  category: string;
  subcategory: string;
  intended_age: string;
  power_source: string;
  has_battery: boolean;
  battery_type: string;
  ingredients: string[];
  chemical_concentrations: Record<string, number>;
  claims: string[];
  inferred_hs_code: string;
  technical_specs: Record<string, any>;
  missing_required_fields: string[];
}

export interface ComplianceCheckResult {
  check_code: string;
  country_code: string;
  category: string;
  status: 'pass' | 'warning' | 'violation' | 'escalation';
  trust_tier: string;
  rule_citation: string;
  extracted_value: string;
  expected_requirement: string;
  explanation: string;
  fix_suggestion?: string;
}

export interface DebateTurn {
  round_number: number;
  speaker: string;
  role_title: string;
  argument: string;
  cited_rules: string[];
  risk_level: 'high' | 'medium' | 'low' | 'neutral';
}

export interface AdversarialDebateResult {
  debate_topic: string;
  turns: DebateTurn[];
  consensus_verdict: string;
  binding_remediations: string[];
}

export interface DiffItem {
  original_phrase: string;
  compliant_phrase: string;
  reason: string;
  severity: string;
}

export interface RemediationResult {
  original_title: string;
  compliant_title: string;
  original_description: string;
  compliant_description: string;
  diff_items: DiffItem[];
  ready_to_paste_bullets: string[];
  escalation_checklist: string[];
}

export interface TradeEconomicsItem {
  country_code: string;
  country_name: string;
  de_minimis_threshold: number;
  de_minimis_currency: string;
  vat_gst_rate: string;
  simplification_scheme: string;
  customs_complexity_score: number;
  estimated_duty_rate: string;
  entry_friction_rank: number;
  recommendation_summary: string;
}

export interface AuditResponse {
  inspection_id: string;
  listing_id: string;
  timestamp_utc: string;
  rule_engine_version: string;
  compliance_hash: string;
  prev_hash: string;
  overall_verdict: 'COMPLIANT' | 'REMEDIATION_REQUIRED' | 'IMPORT_PROHIBITED' | 'ESCALATION_REQUIRED' | 'WARNINGS_DETECTED';
  destination_markets: string[];
  extracted_attributes: ExtractedAttributes;
  matrix: Record<string, ComplianceCheckResult[]>;
  summary_by_country: Record<string, { pass: number; warning: number; violation: number; escalation: number }>;
  debate?: AdversarialDebateResult;
  remediation?: RemediationResult;
  trade_economics: TradeEconomicsItem[];
  citations: string[];
  is_hash_valid: boolean;
}

export interface PresetListing {
  id: string;
  title: string;
  description: string;
  brand_name: string;
  category: string;
  price: number;
  currency: string;
  country_of_origin: string;
  source_url?: string;
}
