'use client';
import React from 'react';
import {
  Shield, FileText, Sparkles, CheckCircle2, Lock,
  ShoppingCart, Scale, ArrowRightLeft, ShieldCheck, Zap
} from 'lucide-react';

export type ViewMode = 'seller' | 'compliance';

interface HeaderProps {
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  onOpenIntelligence: () => void;
  onOpenChatbot?: () => void;
  onOpenHashVerifier: () => void;
  onOpenExportPack?: () => void;
  onExportPdf: () => void;
  isPdfLoading?: boolean;
  hasAuditData?: boolean;
  latestHash?: string;
}

export default function Header({
  viewMode,
  onToggleViewMode,
  onOpenIntelligence,
  onOpenChatbot,
  onOpenHashVerifier,
  onOpenExportPack,
  onExportPdf,
  isPdfLoading,
  hasAuditData,
  latestHash,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 text-white shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* ── Brand & Identity ── */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-sky-500/25 ring-1 ring-white/10">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent">
                LEXPORT
              </span>
              <span className="text-[9px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                PS13 CO-PILOT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden md:block">
              Cross-Border Trade Compliance &amp; Impedance Engine
            </p>
          </div>
        </div>

        {/* ── Center: Segmented Role Viewport Toggle ── */}
        <div className="flex items-center justify-center">
          <div className="p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner flex items-center gap-1">
            
            {/* Seller View Option */}
            <button
              type="button"
              onClick={() => onToggleViewMode('seller')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                viewMode === 'seller'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40 scale-102'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Switch to Action-Oriented Seller View"
            >
              <ShoppingCart className={`w-3.5 h-3.5 ${viewMode === 'seller' ? 'text-white' : 'text-emerald-400'}`} />
              <span>Seller View</span>
              {viewMode === 'seller' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse hidden sm:inline-block ml-1" />
              )}
            </button>

            {/* Compliance Officer View Option */}
            <button
              type="button"
              onClick={() => onToggleViewMode('compliance')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                viewMode === 'compliance'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/40 scale-102'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Switch to Deep Technical & Audit-Proof Compliance Officer View"
            >
              <Scale className={`w-3.5 h-3.5 ${viewMode === 'compliance' ? 'text-white' : 'text-sky-400'}`} />
              <span className="hidden sm:inline">Compliance Officer View</span>
              <span className="sm:hidden">Compliance</span>
              {viewMode === 'compliance' && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-300 animate-pulse hidden sm:inline-block ml-1" />
              )}
            </button>

          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* EU AI Act Cryptographic Hash Pill */}
          <button
            onClick={onOpenHashVerifier}
            className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800 transition-all text-xs text-slate-300 group"
            title="Inspect EU Digital Omnibus AI Act SHA-256 Ledger"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-[11px] text-slate-400">
              {latestHash ? `${latestHash.slice(0, 8)}...` : 'GENESIS'}
            </span>
            <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
              EU AI ACT
            </span>
          </button>

          {/* Compliance & Trade AI Chatbot */}
          {onOpenChatbot && (
            <button
              onClick={onOpenChatbot}
              className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 transition-all hover:scale-102"
              title="Open Compliance & Trade AI Chatbot"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-200 animate-pulse" />
              <span className="hidden sm:inline">Compliance Chatbot</span>
              <span className="sm:hidden">Chatbot</span>
            </button>
          )}

          {/* AI Copilot */}
          <button
            onClick={onOpenIntelligence}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-700/60 hover:bg-indigo-900/60 hover:border-indigo-400 text-indigo-200 text-xs font-bold transition-all shadow-sm"
            title="Ask Regulatory AI Copilot (NL-to-SQL)"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">NL-to-SQL</span>
          </button>

          {/* 1-Click Amazon & Shopify Export Pack */}
          {hasAuditData && onOpenExportPack && (
            <button
              onClick={onOpenExportPack}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all active:scale-95"
              title="Generate 1-Click Export Pack"
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
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition-all disabled:opacity-50"
              title="Download Signed PDF Compliance Dossier"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isPdfLoading ? 'Generating...' : 'PDF Dossier'}</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
