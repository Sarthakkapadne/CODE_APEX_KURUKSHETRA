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

export interface CBPNoticeOfAction {
  notice_id: string;
  form_type: string;
  issuing_port: string;
  issuing_officer: string;
  target_consignee: string;
  action_type: string;
  grounds_for_action: string;
  cited_statutes: string[];
  response_deadline_days: number;
  estimated_civil_penalty_usd: number;
  potential_forfeiture_risk: string;
}

export interface CustomsSeizureRadarResult {
  seizure_probability_pct: number;
  threat_level: 'CRITICAL_SEIZURE_RISK' | 'ELEVATED_DETENTION_RISK' | 'MODERATE_CUSTOMS_HOLD' | 'LOW_FRICTION_CLEAR';
  primary_detention_triggers: string[];
  estimated_financial_exposure_usd: number;
  breakdown_fees: {
    inventory_risk_usd?: number;
    port_demurrage_quarantine_usd?: number;
    statutory_civil_penalties_usd?: number;
  };
  target_enforcement_agencies: string[];
  simulated_notice?: CBPNoticeOfAction;
  seizure_avoidance_directives: string[];
}

export interface HSTariffArbitrageResult {
  declared_hs_code: string;
  declared_hs_description: string;
  reclassified_hs_code: string;
  reclassified_hs_description: string;
  is_misclassified: boolean;
  declared_duty_rate: string;
  reclassified_duty_rate: string;
  de_minimis_disqualified: boolean;
  potential_tariff_difference_per_1000_units: number;
  broker_clearance_fee_impact: number;
  total_arbitrage_savings_usd: number;
  remediation_action: string;
}

export interface GroundTruthAccuracyIndex {
  composite_accuracy_score: number;
  trust_grade: string;
  statutory_alignment_score: number;
  extraction_fidelity_score: number;
  verbatim_statutory_proofs: Array<{
    citation: string;
    title: string;
    government_source: string;
    verbatim_law: string;
  }>;
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
  customs_radar?: CustomsSeizureRadarResult;
  hs_tariff?: HSTariffArbitrageResult;
  accuracy_index?: GroundTruthAccuracyIndex;
  debate?: any;
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
