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
  const [activeTab, setActiveTab] = useState<'matrix' | 'customs_radar' | 'packaging' | 'remediation' | 'economics'>('matrix');

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
    setActiveTab('matrix');
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

      {/* ── Main Dashboard Container ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ── Top Panel: Listing Input & Preset Selector ── */}
        <section>
          <ListingInput
            onAudit={executeAudit}
            isLoading={isLoading}
            onScrape={scrapeListingUrl}
          />
        </section>

        {/* ── Mid Panel: Regulatory Change Simulator (Live Shocks) ── */}
        <section>
          <RegulatorySimulator
            onSimulationToggled={() => executeAudit(currentInput)}
          />
        </section>

        {/* ── Global Compliance & Tariff Heatmap (Visual World Map) ── */}
        {auditData && (
          <section>
            <WorldComplianceHeatmap
              auditResult={auditData}
              selectedCountry={selectedHeatmapCountry}
              onSelectCountry={(countryCode) => {
                setSelectedHeatmapCountry(selectedHeatmapCountry === countryCode ? null : countryCode);
                setActiveTab('matrix');
              }}
            />
          </section>
        )}

        {/* ── Workspace Tab Selector ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 overflow-x-auto">
            <div className="flex space-x-2">
              {[
                { id: 'matrix', label: 'Compliance Matrix', icon: Scale, badge: auditData?.overall_verdict },
                { 
                  id: 'customs_radar', 
                  label: 'Customs Seizure Radar & HTS', 
                  icon: ShieldAlert, 
                  badge: auditData?.customs_radar?.threat_level ? auditData.customs_radar.threat_level.replace(/_/g, ' ') : 'Live' 
                },
                { 
                  id: 'packaging', 
                  label: 'Packaging Vision & 3-Way Radar', 
                  icon: Scan, 
                  badge: auditData?.packaging_analysis?.detected_language ? `${auditData.packaging_analysis.detected_language} OCR` : 'Rosetta Stone' 
                },
                { id: 'remediation', label: 'Compliant Rewrite & Diffs', icon: Sparkles, badge: auditData?.remediation?.diff_items.length ? `${auditData.remediation.diff_items.length} Fixes` : null },
                { id: 'economics', label: 'Trade Economics Advisor', icon: TrendingUp, badge: 'Ranked Entry' },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                      isActive
                        ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive ? 'bg-sky-700 text-sky-100' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {auditData && (
              <div className="hidden lg:flex items-center space-x-3 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setIsExportPackOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-lg shadow-md shadow-orange-500/20 transition-all text-xs"
                >
                  <span>⚡</span> 1-Click Amazon & Shopify Export Pack
                </button>
                <span className="font-mono text-[11px] text-slate-500">Inspection: {auditData.inspection_id}</span>
                <GroundTruthAccuracyBadge accuracy={auditData.accuracy_index} />
              </div>
            )}
          </div>

          {/* ── Active Tab Display ── */}
          <div>
            {auditData ? (
              <>
                {activeTab === 'matrix' && (
                  <ComplianceMatrix
                    auditData={auditData}
                    selectedCountryFilter={selectedHeatmapCountry}
                    onSelectFix={fixText => {
                      if (auditData.remediation) {
                        handleApplyFix(auditData.remediation.compliant_title, auditData.remediation.compliant_description);
                      }
                    }}
                  />
                )}

                {activeTab === 'customs_radar' && (
                  <div>
                    <CustomsSeizureRadar
                      radar={auditData.customs_radar}
                    />
                    <HSTariffArbitrageCard
                      hsTariff={auditData.hs_tariff}
                    />
                  </div>
                )}

                {activeTab === 'packaging' && (
                  <PackagingImageInspector
                    packaging={auditData.packaging_analysis}
                  />
                )}

                {activeTab === 'remediation' && (
                  <RemediationDiffView
                    remediation={auditData.remediation}
                    onApplyFix={handleApplyFix}
                  />
                )}

                {activeTab === 'economics' && (
                  <TradeEconomicsAdvisor
                    economics={auditData.trade_economics}
                  />
                )}
              </>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
                Loading live compliance audit results...
              </div>
            )}
          </div>
        </section>

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
