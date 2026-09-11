'use client';
import React, { useState, useEffect } from 'react';
import {
  Scale, MessageSquare, Sparkles, TrendingUp,
  RotateCcw, CheckCircle2, AlertOctagon, Terminal, ShieldAlert, Scan
} from 'lucide-react';
import Header from '../components/Header';
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
import { ListingInput as ListingInputType, AuditResponse } from '../lib/types';
import { CASE_PRESETS } from '../lib/presets';
import { runComplianceAudit, scrapeListingUrl, downloadPdfReport } from '../lib/api';

export default function HomePage() {
  const [currentInput, setCurrentInput] = useState<ListingInputType>({
    title: CASE_PRESETS[0].title,
    description: CASE_PRESETS[0].description,
    brand_name: CASE_PRESETS[0].brand_name,
    price: CASE_PRESETS[0].price,
    country_of_origin: CASE_PRESETS[0].country_of_origin,
    destination_markets: ['US', 'EU', 'UK', 'CA', 'JP', 'AU'],
  });


  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [activeWorkspace, setActiveWorkspace] = useState<'studio' | 'packaging' | 'radar' | 'remediation'>('studio');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  // Modals & Interactivity
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isHashVerifierOpen, setIsHashVerifierOpen] = useState<boolean>(false);
  const [isExportPackOpen, setIsExportPackOpen] = useState<boolean>(false);
  const [selectedHeatmapCountry, setSelectedHeatmapCountry] = useState<string | null>(null);

  // Run initial audit on load for default preset
  useEffect(() => {
    executeAudit(currentInput);
  }, []);

  const executeAudit = async (input: ListingInputType) => {
    setIsLoading(true);
    try {
      const res = await runComplianceAudit(input);
      setAuditData(res);
      setCurrentInput(input);
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
        onOpenIntelligence={() => setIsCopilotOpen(true)}
        onOpenHashVerifier={() => setIsHashVerifierOpen(true)}
        onOpenExportPack={() => setIsExportPackOpen(true)}
        onExportPdf={handleExportPdf}
        isPdfLoading={isPdfLoading}
        hasAuditData={!!auditData}
        latestHash={auditData?.compliance_hash}
      />

      {/* ── 4 Dedicated Workspace Sticky Sub-Navigation Bar ── */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between overflow-x-auto gap-4">
          <div className="flex items-center space-x-2">
            {[
              { id: 'studio', label: '1. 🔍 Audit Studio', sub: 'Listing & Multi-Market Matrix', badge: auditData?.overall_verdict },
              { id: 'packaging', label: '2. 📦 Packaging Lab', sub: 'Vision OCR & 3-Way Triangulation', badge: auditData?.packaging_analysis?.physical_verdict },
              { id: 'radar', label: '3. 🚨 Customs Radar', sub: 'Demurrage & Tariffs', badge: auditData?.customs_radar?.threat_level?.replace(/_/g, ' ') },
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
          <section className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-xl space-y-2">
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
            WORKSPACE 1: AUDIT STUDIO (Core Input, Heatmap, and Matrix)
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

            {/* Global Heatmap */}
            {auditData && (
              <section>
                <WorldComplianceHeatmap
                  auditResult={auditData}
                  selectedCountry={selectedHeatmapCountry}
                  onSelectCountry={(countryCode) => {
                    setSelectedHeatmapCountry(selectedHeatmapCountry === countryCode ? null : countryCode);
                  }}
                />
              </section>
            )}

            {/* Multi-Market Compliance Matrix */}
            {auditData && (
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
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            WORKSPACE 2: PACKAGING & VISION OCR LAB
           ══════════════════════════════════════════════════════════════ */}
        {activeWorkspace === 'packaging' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📦</span> Multi-Lingual Rosetta Stone & 3-Way Triangulation Lab
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inspect physical box packaging, detect foreign scripts (Kanji, German, French), verify GS1 Modulo-10 barcodes, and reconcile digital claims against physical reality.
                  </p>
                </div>
                {auditData?.packaging_analysis?.physical_verdict && (
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg font-bold bg-sky-950 text-sky-300 border border-sky-800">
                    {auditData.packaging_analysis.physical_verdict} ({auditData.packaging_analysis.physical_readiness_score.toFixed(0)}% Score)
                  </span>
                )}
              </div>

              {auditData ? (
                <PackagingImageInspector
                  packaging={auditData.packaging_analysis}
                />
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Run an audit first to inspect physical packaging labels.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            WORKSPACE 3: CUSTOMS RISK RADAR & TRADE ECONOMICS
           ══════════════════════════════════════════════════════════════ */}
        {activeWorkspace === 'radar' && (
          <div className="space-y-6">
            {auditData ? (
              <>
                <CustomsSeizureRadar
                  radar={auditData.customs_radar}
                />
                <HSTariffArbitrageCard
                  hsTariff={auditData.hs_tariff}
                />
                <TradeEconomicsAdvisor
                  economics={auditData.trade_economics}
                />
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

      {/* ── Global Modals ── */}
      <HashVerificationModal
        isOpen={isHashVerifierOpen}
        onClose={() => setIsHashVerifierOpen(false)}
        auditData={auditData || undefined}
      />

      <CopilotIntelligenceModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* ── 1-Click Compliant Export Pack Modal ── */}
      <ExportPackModal
        isOpen={isExportPackOpen}
        onClose={() => setIsExportPackOpen(false)}
        exportPack={auditData?.export_pack}
        productTitle={currentInput.title}
      />
    </div>
  );
}
