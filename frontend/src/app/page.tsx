'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Scale, MessageSquare, Sparkles, TrendingUp,
  RotateCcw, CheckCircle2, AlertOctagon, Terminal, ShieldAlert, Scan,
  ShoppingCart, FileText, Globe, Layers, ArrowRightLeft, ShieldCheck, Zap
} from 'lucide-react';
import Header, { ViewMode } from '../components/Header';
import ListingInput from '../components/ListingInput';
import ComplianceMatrix from '../components/ComplianceMatrix';
import CustomsSeizureRadar from '../components/CustomsSeizureRadar';
import HSTariffArbitrageCard from '../components/HSTariffArbitrageCard';
import GroundTruthAccuracyBadge from '../components/GroundTruthAccuracyBadge';
import PackagingImageInspector from '../components/PackagingImageInspector';
import RemediationDiffView from '../components/RemediationDiffView';
import TradeEconomicsAdvisor from '../components/TradeEconomicsAdvisor';
import HashVerificationModal from '../components/HashVerificationModal';
import RegulatorySimulator from '../components/RegulatorySimulator';
import CopilotIntelligenceModal from '../components/CopilotIntelligenceModal';
import { WorldComplianceHeatmap } from '../components/WorldComplianceHeatmap';
import { ExportPackModal } from '../components/ExportPackModal';
import ComplianceChatbotModal from '../components/ComplianceChatbotModal';
import ComplianceConfidenceDashboard from '../components/ComplianceConfidenceDashboard';
import RuleVerificationView from '../components/RuleVerificationView';
import MultiPackagingDropzone from '../components/MultiPackagingDropzone';
import DocumentChecklist from '../components/DocumentChecklist';
import { ListingInput as ListingInputType, AuditResponse } from '../lib/types';
import { CASE_PRESETS } from '../lib/presets';
import { runComplianceAudit, scrapeListingUrl, downloadPdfReport } from '../lib/api';

const LeafletTradeMap = dynamic(() => import('../components/LeafletTradeMap'), {
  ssr: false,
  loading: () => <div className="h-[460px] rounded-2xl border border-slate-800 bg-slate-900 animate-pulse" />,
});

const LeafletComplianceMap = dynamic(() => import('../components/LeafletComplianceMap'), {
  ssr: false,
  loading: () => <div className="h-[460px] rounded-2xl border border-slate-800 bg-slate-900 animate-pulse" />,
});

const ALL_10_MARKETS = ['US', 'EU', 'UK', 'CA', 'JP', 'AU', 'IN', 'DE', 'CN', 'VN'];

export default function HomePage() {
  const [currentInput, setCurrentInput] = useState<ListingInputType>({
    title: CASE_PRESETS[0].title,
    description: CASE_PRESETS[0].description,
    brand_name: CASE_PRESETS[0].brand_name,
    price: CASE_PRESETS[0].price,
    country_of_origin: CASE_PRESETS[0].country_of_origin,
    destination_markets: ALL_10_MARKETS,
  });

  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);

  // ── Role View Mode: Seller vs Compliance Officer ──
  const [viewMode, setViewMode] = useState<ViewMode>('seller');

  // ── 4-Workspace Navigation ──
  const [activeWorkspace, setActiveWorkspace] = useState<'studio' | 'packaging' | 'radar' | 'remediation'>('studio');

  // ── Workspace 1 Sub-Navigation ──
  const [studioTab, setStudioTab] = useState<'matrix' | 'verification' | 'confidence'>('matrix');

  // ── Workspace 2 Sub-Navigation ──
  const [packagingTab, setPackagingTab] = useState<'ocr' | 'documents'>('ocr');

  // ── Workspace 3 Map Sub-Mode ──
  const [radarMapMode, setRadarMapMode] = useState<'compliance' | 'trade'>('compliance');

  // ── Global Leaflet Dual Map Mode ──
  const [mapMode, setMapMode] = useState<'compliance' | 'trade_corridors' | 'svg_overview'>('compliance');

  // ── Modals & Simulator ──
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isHashVerifierOpen, setIsHashVerifierOpen] = useState<boolean>(false);
  const [isExportPackOpen, setIsExportPackOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [selectedHeatmapCountry, setSelectedHeatmapCountry] = useState<string | null>(null);

  // Run initial audit on load for default preset
  useEffect(() => {
    executeAudit(currentInput);
  }, []);

  const executeAudit = async (input: ListingInputType) => {
    setIsLoading(true);
    try {
      const payload: ListingInputType = {
        ...input,
        destination_markets: input.destination_markets && input.destination_markets.length > 0 
          ? input.destination_markets 
          : ALL_10_MARKETS,
      };
      const res = await runComplianceAudit(payload);
      setAuditData(res);
      setCurrentInput(payload);
    } catch (e: any) {
      console.error('Audit execution error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFix = (compliantTitle: string, compliantDesc: string) => {
    const updated = {
      ...currentInput,
      title: compliantTitle,
      description: compliantDesc,
    };
    setCurrentInput(updated);
    executeAudit(updated);
    setActiveWorkspace('studio');
    setStudioTab('matrix');
  };

  const handleExportPdf = async () => {
    if (!auditData) return;
    setIsPdfLoading(true);
    try {
      await downloadPdfReport(auditData);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* ── Top Navigation Bar ── */}
      <Header
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenIntelligence={() => setIsCopilotOpen(true)}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        onOpenHashVerifier={() => setIsHashVerifierOpen(true)}
        onOpenExportPack={() => setIsExportPackOpen(true)}
        onExportPdf={handleExportPdf}
        isPdfLoading={isPdfLoading}
        hasAuditData={!!auditData}
        latestHash={auditData?.compliance_hash}
      />

      {/* ── Role Context Indicator Banner ── */}
      <div className={`px-4 sm:px-6 lg:px-8 py-2 text-xs border-b transition-colors flex items-center justify-between ${
        viewMode === 'seller'
          ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
          : 'bg-sky-950/40 border-sky-800/50 text-sky-300'
      }`}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {viewMode === 'seller' ? (
              <>
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Seller Mode Active:</span>
                <span className="text-emerald-400/80 hidden sm:inline">
                  Prioritizing landed margin, fast 1-click remediation, and clear export feasibility across 10 countries.
                </span>
              </>
            ) : (
              <>
                <Scale className="w-4 h-4 text-sky-400" />
                <span className="font-semibold">Compliance Officer Mode Active:</span>
                <span className="text-sky-400/80 hidden sm:inline">
                  Deep technical inspection, statutory citations, 4-factor confidence metrics, and deterministic rule decision traces.
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'seller' ? 'compliance' : 'seller')}
            className="text-[11px] font-bold underline hover:opacity-80 transition-opacity ml-2 shrink-0"
          >
            Switch to {viewMode === 'seller' ? 'Compliance View' : 'Seller View'} ➔
          </button>
        </div>
      </div>

      {/* ── 4 Dedicated Workspace Sticky Sub-Navigation Bar ── */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between overflow-x-auto gap-4">
          <div className="flex items-center space-x-2">
            {[
              { id: 'studio', label: '1. 🔍 Audit Studio', sub: 'Listing & 10-Market Matrix', badge: auditData?.overall_verdict },
              { id: 'packaging', label: '2. 📦 Packaging Lab', sub: 'Vision OCR & Evidence Checklist', badge: auditData?.packaging_analysis?.physical_verdict },
              { id: 'radar', label: '3. 🚨 Customs Radar', sub: 'Tariffs & Leaflet GIS Maps', badge: auditData?.customs_radar?.threat_level?.replace(/_/g, ' ') },
              { id: 'remediation', label: '4. ⚡ Remediation & Export', sub: 'Compliant Diffs & PDF', badge: auditData?.remediation?.diff_items.length ? `${auditData.remediation.diff_items.length} Fixes` : '1-Click Fix' },
            ].map(ws => {
              const isActive = activeWorkspace === ws.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => setActiveWorkspace(ws.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                    isActive
                      ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/25'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="text-left">
                    <div className="leading-tight">{ws.label}</div>
                    <div className={`text-[10px] font-normal ${isActive ? 'text-sky-100' : 'text-slate-500'}`}>
                      {ws.sub}
                    </div>
                  </div>
                  {ws.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? 'bg-sky-700 text-sky-100' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {ws.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isSimulatorOpen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400'
              }`}
            >
              <span>⚡</span>
              <span>{isSimulatorOpen ? 'Close Simulator' : 'Test Regulatory Shocks'}</span>
            </button>
            {auditData && (
              <GroundTruthAccuracyBadge accuracy={auditData.accuracy_index} />
            )}
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Container ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Expandable Regulatory Change Simulator (Shocks) ── */}
        {isSimulatorOpen && (
          <section className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-xl space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Emergency Regulatory Change Simulator (Live Shocks)
              </span>
              <span className="text-[11px] text-slate-400">Toggle emergency crackdowns to watch matrix flip in real time</span>
            </div>
            <RegulatorySimulator onSimulationToggled={() => executeAudit(currentInput)} />
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            WORKSPACE 1: AUDIT STUDIO (Listing, Matrix, Traces, Confidence)
           ══════════════════════════════════════════════════════════════ */}
        {activeWorkspace === 'studio' && (
          <div className="space-y-6">
            {/* Listing Input & Presets */}
            <section>
              <ListingInput
                onAudit={executeAudit}
                isLoading={isLoading}
                onScrape={scrapeListingUrl}
              />
            </section>

            {/* Studio Sub-Navigation Tabs */}
            {auditData && (
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setStudioTab('matrix')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      studioTab === 'matrix'
                        ? 'bg-slate-800 text-sky-400 border border-sky-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Multi-Market Matrix & Heatmap</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudioTab('verification')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      studioTab === 'verification'
                        ? 'bg-slate-800 text-sky-400 border border-sky-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Rule Verification & Decision Traces</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudioTab('confidence')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      studioTab === 'confidence'
                        ? 'bg-slate-800 text-sky-400 border border-sky-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Confidence Score & Dependency DAG</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 hidden md:block">
                  Supported Codices: US, EU, UK, CA, JP, AU, IN, DE, CN, VN
                </div>
              </div>
            )}

            {/* Sub-Tab 1: Compliance Matrix & Heatmap */}
            {auditData && studioTab === 'matrix' && (
              <div className="space-y-6">
                {/* ── Prominent 2-Module Leaflet GIS Compliance & Trade Maps ── */}
                <section className="space-y-3 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setMapMode('compliance')}
                        className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          mapMode === 'compliance'
                            ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/25 ring-1 ring-white/10'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <span>🗺️</span>
                        <span>1. CartoDB World Compliance Map</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMapMode('trade_corridors')}
                        className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          mapMode === 'trade_corridors'
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/25 ring-1 ring-white/10'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <span>🌐</span>
                        <span>2. Bilateral Trade Corridors & Distance Engine</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMapMode('svg_overview')}
                        className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                          mapMode === 'svg_overview'
                            ? 'bg-slate-800 text-white border-slate-600'
                            : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        <span>📊</span>
                        <span>2D Overview</span>
                      </button>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      {mapMode === 'compliance'
                        ? 'Click any country marker to filter compliance checks'
                        : mapMode === 'trade_corridors'
                        ? 'Select 1 focal country to view live Haversine nautical distances'
                        : 'Quick 2D statutory summary'}
                    </span>
                  </div>

                  {mapMode === 'compliance' ? (
                    <LeafletComplianceMap
                      auditData={auditData}
                      selectedCountry={selectedHeatmapCountry}
                      onSelectCountry={(countryCode) => {
                        setSelectedHeatmapCountry(selectedHeatmapCountry === countryCode ? null : countryCode);
                      }}
                    />
                  ) : mapMode === 'trade_corridors' ? (
                    <LeafletTradeMap
                      currentInput={currentInput}
                      auditData={auditData}
                      onSelectCountry={(countryCode) => {
                        setSelectedHeatmapCountry(selectedHeatmapCountry === countryCode ? null : countryCode);
                      }}
                    />
                  ) : (
                    <WorldComplianceHeatmap
                      auditResult={auditData}
                      selectedCountry={selectedHeatmapCountry}
                      onSelectCountry={(countryCode) => {
                        setSelectedHeatmapCountry(selectedHeatmapCountry === countryCode ? null : countryCode);
                      }}
                    />
                  )}
                </section>

                <section>
                  <ComplianceMatrix
                    auditData={auditData}
                    selectedCountryFilter={selectedHeatmapCountry}
                    onSelectFix={fixText => {
                      if (auditData.remediation) {
                        handleApplyFix(auditData.remediation.compliant_title, auditData.remediation.compliant_description);
                      }
                    }}
                  />
                </section>
              </div>
            )}

            {/* Sub-Tab 2: Rule-by-Rule Verification Engine */}
            {auditData && studioTab === 'verification' && (
              <div className="space-y-6">
                <RuleVerificationView auditData={auditData} />
              </div>
            )}

            {/* Sub-Tab 3: Compliance Confidence & Dependency Graph */}
            {auditData && studioTab === 'confidence' && (
              <div className="space-y-6">
                <ComplianceConfidenceDashboard auditData={auditData} />
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            WORKSPACE 2: PACKAGING & EVIDENCE LAB
           ══════════════════════════════════════════════════════════════ */}
        {activeWorkspace === 'packaging' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPackagingTab('ocr')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    packagingTab === 'ocr'
                      ? 'bg-slate-800 text-sky-400 border border-sky-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Physical Vision OCR & 3-Way Triangulation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPackagingTab('documents')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    packagingTab === 'documents'
                      ? 'bg-slate-800 text-sky-400 border border-sky-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Document & Lab Test Evidence Checklist</span>
                </button>
              </div>

              {auditData?.packaging_analysis?.physical_verdict && (
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg font-bold bg-sky-950 text-sky-300 border border-sky-800">
                  {auditData.packaging_analysis.physical_verdict} ({auditData.packaging_analysis.physical_readiness_score.toFixed(0)}% Physical Readiness)
                </span>
              )}
            </div>

            {packagingTab === 'ocr' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  {auditData ? (
                    <PackagingImageInspector packaging={auditData.packaging_analysis} />
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Run an audit first to inspect physical packaging labels.
                    </div>
                  )}
                </div>

                {/* Multi-angle packaging dropzone */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <span>📷</span> Multi-Angle Packaging Upload & Forensic OCR
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Upload front label, back ingredients, and barcode panels simultaneously to trigger automatic 3-way discrepancy checks.
                  </p>
                  <MultiPackagingDropzone
                    onImagesSelected={(front, back) => {
                      const updated = {
                        ...currentInput,
                        front_image_base64: front,
                        back_image_base64: back,
                      };
                      setCurrentInput(updated);
                      executeAudit(updated);
                    }}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            )}

            {packagingTab === 'documents' && (
              <div className="space-y-6">
                <DocumentChecklist
                  documents={auditData?.required_documents}
                  targetMarkets={currentInput.destination_markets}
                  productCategory={auditData?.extracted_attributes?.category || 'cosmetics'}
                />
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            WORKSPACE 3: CUSTOMS RISK RADAR & GIS TRADE MAPS
           ══════════════════════════════════════════════════════════════ */}
        {activeWorkspace === 'radar' && (
          <div className="space-y-6">
            {auditData ? (
              <>
                {/* Map Mode Switcher */}
                <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setRadarMapMode('compliance')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        radarMapMode === 'compliance'
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Statutory Compliance Heatmap (GIS)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRadarMapMode('trade')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        radarMapMode === 'trade'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Global Trade Corridors & Tariffs</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Interactive GIS powered by OpenStreetMap & CartoDB Dark Matter
                  </span>
                </div>

                {/* Leaflet Map Rendering */}
                {radarMapMode === 'compliance' ? (
                  <LeafletComplianceMap
                    auditData={auditData}
                    selectedCountry={selectedHeatmapCountry}
                    onSelectCountry={(code) => setSelectedHeatmapCountry(code)}
                  />
                ) : (
                  <LeafletTradeMap
                    currentInput={currentInput}
                    auditData={auditData}
                    onSelectCountry={(code) => setSelectedHeatmapCountry(code)}
                  />
                )}

                {/* Customs Seizure Radar with live calculations */}
                <CustomsSeizureRadar radar={auditData.customs_radar} />

                {/* HS Tariff Arbitrage */}
                <HSTariffArbitrageCard hsTariff={auditData.hs_tariff} />

                {/* Trade Economics Advisor */}
                <TradeEconomicsAdvisor economics={auditData.trade_economics} />
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
                Run an audit first to evaluate customs seizure exposure and trade economics.
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            WORKSPACE 4: REMEDIATION & 1-CLICK EXPORT
           ══════════════════════════════════════════════════════════════ */}
        {activeWorkspace === 'remediation' && (
          <div className="space-y-6">
            {auditData ? (
              <>
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>⚡</span> 1-Click Amazon & Shopify Export Bundle
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ready-to-copy compliant bullets, Shopify customs metafields, and packaging print artwork specs.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsExportPackOpen(true)}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-lg shadow-md shadow-orange-500/20 text-xs flex items-center gap-1.5 transition-all"
                    >
                      <span>⚡</span> View Export Pack Modal
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={isPdfLoading}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-md shadow-sky-600/20 text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <span>📄</span> {isPdfLoading ? 'Generating...' : 'Download PDF Dossier'}
                    </button>
                  </div>
                </div>

                <RemediationDiffView
                  remediation={auditData.remediation}
                  onApplyFix={handleApplyFix}
                />
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
                Run an audit first to generate compliant rewrites and export packs.
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LexPort · Agentic Cross-Border Compliance Co-Pilot · PS13 Master Build</span>
          <span className="font-mono text-[11px] text-slate-600">
            EU Digital Omnibus AI Act (August 2026) Audit Ready · Zero Unsourced Assertions
          </span>
        </div>
      </footer>

      {/* ── Global Modals & Floating Assistants ── */}
      <HashVerificationModal
        isOpen={isHashVerifierOpen}
        onClose={() => setIsHashVerifierOpen(false)}
        auditData={auditData || undefined}
      />

      <CopilotIntelligenceModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      <ComplianceChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        initialProductContext={auditData}
      />

      <ExportPackModal
        isOpen={isExportPackOpen}
        onClose={() => setIsExportPackOpen(false)}
        exportPack={auditData?.export_pack}
        productTitle={currentInput.title}
      />
    </div>
  );
}
