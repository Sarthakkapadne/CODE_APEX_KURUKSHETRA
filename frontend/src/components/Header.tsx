'use client';
import React from 'react';
import { Shield, FileText, Sparkles, CheckCircle2, Lock, Terminal } from 'lucide-react';

interface HeaderProps {
  onOpenIntelligence: () => void;
  onOpenHashVerifier: () => void;
  onOpenExportPack?: () => void;
  onExportPdf: () => void;
  isPdfLoading?: boolean;
  hasAuditData?: boolean;
  latestHash?: string;
}

export default function Header({
  onOpenIntelligence,
  onOpenHashVerifier,
  onOpenExportPack,
  onExportPdf,
  isPdfLoading,
  hasAuditData,
  latestHash,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent">
                LEXPORT
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                PS13 CO-PILOT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Agentic Cross-Border Compliance & Impedance Matcher
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* EU AI Act Cryptographic Hash Pill */}
          <button
            onClick={onOpenHashVerifier}
            className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-sky-500/50 hover:bg-slate-800/80 transition-all text-xs text-slate-300 group"
            title="View EU Digital Omnibus AI Act Cryptographic Audit Trail"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-[11px] text-slate-400">
              SHA-256: {latestHash ? `${latestHash.slice(0, 8)}...` : 'GENESIS'}
            </span>
            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
              EU AI ACT (2026)
            </span>
          </button>

          {/* NL-to-SQL Intelligence Copilot */}
          <button
            onClick={onOpenIntelligence}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/60 hover:bg-indigo-900/60 hover:border-indigo-500 text-indigo-200 text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* 1-Click Amazon & Shopify Export Pack */}
          {hasAuditData && onOpenExportPack && (
            <button
              onClick={onOpenExportPack}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
            >
              <span>⚡</span>
              <span className="hidden sm:inline">Export Pack</span>
            </button>
          )}

          {/* Export PDF Dossier */}
          {hasAuditData && (
            <button
              onClick={onExportPdf}
              disabled={isPdfLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-semibold shadow-md shadow-sky-600/30 transition-all disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isPdfLoading ? 'Generating...' : 'Export Dossier (PDF)'}</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
