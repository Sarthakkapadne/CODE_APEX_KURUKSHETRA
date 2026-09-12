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
  image_base64?: string;
  image_url?: string;
  front_image_base64?: string;
  back_image_base64?: string;
  barcode_raw?: string;
  images?: string[];
  enable_gemini?: boolean;
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

export interface TranslationProvenanceItem {
  original_term: string;
  translated_term: string;
  detected_language: string;
  confidence: number;
  standardized_standard: string;
  notes: string;
}

export interface PackagingOCRRegion {
  label: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax]
  text: string;
  confidence: number;
  severity: 'violation' | 'warning' | 'pass';
}

export interface TriangulationDiscrepancyItem {
  check_code: string;
  discrepancy_type: string;
  severity: string;
  listing_claim: string;
  physical_label_reality: string;
  destination_statute: string;
  border_impact: string;
}

export interface PackagingAnalysisResult {
  detected_language: string;
  raw_ocr_text: string;
  translated_english_text: string;
  detected_certification_logos: string[];
  missing_certification_logos: string[];
  net_quantity_declaration?: string;
  is_bilingual: boolean;
  translation_provenance: TranslationProvenanceItem[];
  bounding_boxes: PackagingOCRRegion[];
  discrepancies: TriangulationDiscrepancyItem[];
  physical_readiness_score: number;
  physical_verdict: 'READY_FOR_EXPORT' | 'REPACKAGING_MANDATORY' | 'SEIZURE_RISK';
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

export interface AmazonExportBundle {
  clean_title: string;
  bullet_points: string[];
  backend_search_terms: string;
  a_plus_legal_disclaimer: string;
  prohibited_terms_removed: string[];
}

export interface ShopifyMetafieldItem {
  namespace: string;
  key: string;
  value: string;
  type: string;
  description: string;
}

export interface PackagingArtworkSpec {
  container_type: string;
  recommended_dimensions_mm: Record<string, number>;
  net_quantity_declaration: string;
  net_quantity_font_size_pt: number;
  canadian_bilingual_text: Record<string, string>;
  responsible_person_block: string;
  required_vector_marks: string[];
  statutory_printer_notes: string[];
}

export interface ComplianceExportPack {
  sku_identifier: string;
  generated_at: string;
  amazon_bundle: AmazonExportBundle;
  shopify_metafields: ShopifyMetafieldItem[];
  packaging_artwork_spec: PackagingArtworkSpec;
  customs_manifest_summary: Record<string, any>;
}

export interface DebateTurn {
  speaker: string;
  role: string;
  stance: string;
  argument: string;
  statutory_citation?: string;
  risk_level?: string;
}

export interface AdversarialDebateResult {
  debate_topic: string;
  turns: DebateTurn[];
  consensus_verdict: string;
  consensus_severity?: string;
  unanimous_citations?: string[];
  binding_remediations: string[];
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
  packaging_analysis?: PackagingAnalysisResult;
  debate?: AdversarialDebateResult;
  remediation?: RemediationResult;
  export_pack?: ComplianceExportPack;
  trade_economics: TradeEconomicsItem[];
  citations: string[];
  is_hash_valid: boolean;
  required_documents?: RequiredDocumentItem[];
  barcode_analysis?: BarcodeAnalysisResult;
  iso_symbols_detected?: ISOSymbolItem[];
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

export interface BarcodeAnalysisResult {
  raw_barcode?: string;
  barcode_type: string;
  is_valid_gs1: boolean;
  gs1_check_digit?: number;
  country_of_registration?: string;
  warning_message?: string;
}

export interface ISOSymbolItem {
  symbol_code: string;
  symbol_name: string;
  status: string;
  statutory_requirement: string;
}

export interface RequiredDocumentItem {
  id?: string;
  doc_code?: string;
  country_code: string;
  title?: string;
  doc_name?: string;
  category?: string;
  is_mandatory: boolean;
  citation?: string;
  statutory_citation?: string;
  description?: string;
  seller_action_needed?: string;
  governing_agency?: string;
  issuing_authority?: string;
  status?: 'verified' | 'missing' | 'in_review';
  seller_status?: string;
}

// ── Compliance Confidence Meter & Dependency Graph Types ──
export interface FactorScore {
  name: string;
  score: number;
  weight: number;
  weighted_score: number;
  status: 'optimal' | 'warning' | 'critical';
  details: Record<string, any>;
  explanation: string;
}

export interface FactorBreakdown {
  rule_coverage: FactorScore;
  evidence_verification: FactorScore;
  product_data_completeness: FactorScore;
  dependency_health: FactorScore;
}

export interface DependencyNode {
  id: string;
  type: 'product' | 'product_info' | 'market' | 'regulation' | 'requirement' | 'document' | 'action';
  label: string;
  category: string;
  status: 'verified' | 'partial' | 'missing' | 'blocked' | 'pending';
  severity?: 'normal' | 'warning' | 'violation' | 'critical';
  statute_citation?: string;
  description?: string;
  score_impact?: number;
  is_simulated?: boolean;
  affected_by?: string[];
  position: { x: number; y: number };
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  status: 'healthy' | 'blocked' | 'warning';
  animated?: boolean;
}

export interface DependencyGraphPayload {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  total_nodes: number;
  verified_nodes: number;
  blocked_nodes: number;
  missing_nodes: number;
  dependency_health_score: number;
}

export interface ImpactItem {
  id: string;
  node_id: string;
  title: string;
  category: string;
  priority_rank: number;
  current_status: string;
  confidence_gain_pct: number;
  downstream_nodes_unlocked: number;
  affected_markets: string[];
  statutory_citation?: string;
  action_directive: string;
  effort_level: string;
  is_simulated: boolean;
}

export interface TopScoreReducer {
  node_id: string;
  label: string;
  category: string;
  penalty_pct: number;
  citation: string;
  directive: string;
  status: string;
}

export interface ImpactAnalysisResult {
  top_recommended_action?: ImpactItem;
  all_actions: ImpactItem[];
  top_score_reducers: TopScoreReducer[];
  total_potential_gain_pct: number;
}

export interface ConfidenceResponse {
  product_id?: string;
  target_market?: string;
  confidence_score: number;
  confidence_tier: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_label: string;
  tier_color: 'emerald' | 'amber' | 'rose';
  verdict_summary: string;
  factors: FactorBreakdown;
  graph: DependencyGraphPayload;
  impact_analysis: ImpactAnalysisResult;
  is_simulated: boolean;
  simulated_nodes: string[];
}

// ── Rule-by-Rule Compliance Verification Engine Types ──

export interface DecisionTraceStep {
  step_number: number;
  title: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'missing' | 'info';
}

export interface RuleEvaluationResult {
  rule_id: string;
  rule_name: string;
  market: string;
  applicable: boolean;
  applicability_reason: string;
  status: 'pass' | 'fail' | 'missing_information' | 'needs_review';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  statute_citation: string;
  statutory_authority: string;
  expected_requirement: string;
  reason: string;
  required_evidence: string[];
  provided_evidence: string[];
  missing_fields: string[];
  recommended_action?: string;
  confidence: number;
  decision_trace: DecisionTraceStep[];
}

export interface VerificationSummary {
  total_applicable_rules: number;
  passed: number;
  failed: number;
  missing_information: number;
  needs_review: number;
}

export interface PriorityIssueItem {
  rule_id: string;
  rule_name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  issue_summary: string;
  recommended_action: string;
  affected_field?: string;
}

export interface NextBestAction {
  action_title: string;
  field_or_doc_to_fix: string;
  reason: string;
  affected_rules_count: number;
  expected_result: string;
  priority_level: string;
  action_button_label: string;
}

export interface ProductComplianceVerificationResponse {
  product_id?: string;
  product_name: string;
  category: string;
  target_market: string;
  overall_status: 'COMPLIANT' | 'NEEDS_ACTION' | 'CRITICAL_FAILURE' | 'INSUFFICIENT_INFORMATION';
  overall_status_label: string;
  summary: VerificationSummary;
  rule_results: RuleEvaluationResult[];
  priority_issues: PriorityIssueItem[];
  next_best_actions: NextBestAction[];
  next_best_action?: NextBestAction;
  normalized_product_data: Record<string, any>;
}

export interface VerificationPreset {
  id: string;
  product_name: string;
  category: string;
  materials?: string[];
  ingredients?: string[];
  intended_use?: string;
  manufacturer_name?: string;
  manufacturer_address?: string;
  country_of_origin?: string;
  target_market: string;
  contains_battery?: boolean;
  battery_type?: string;
  description?: string;
  marketing_claims?: string[];
  documents?: Array<{
    type: string;
    name: string;
    status: string;
    standards?: string[];
  }>;
}

