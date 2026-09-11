'use client';
import React, { useState } from 'react';
import { Lock, CheckCircle2, AlertTriangle, ShieldCheck, X, RefreshCw, Terminal } from 'lucide-react';
import { AuditResponse } from '../lib/types';
import { verifyComplianceHash } from '../lib/api';

interface HashVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditData?: AuditResponse;
}

export default function HashVerificationModal({ isOpen, onClose, auditData }: HashVerificationModalProps) {
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [tampered, setTampered] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleVerify = async (simulateTamper: boolean) => {
    if (!auditData) return;
    setIsVerifying(true);
    setTampered(simulateTamper);

    try {
      const allFindings = Object.values(auditData.matrix).flat();

      const payload = {
        compliance_hash: auditData.compliance_hash,
        inspection_id: auditData.inspection_id,
        listing_id: auditData.listing_id,
        timestamp_utc: auditData.timestamp_utc,
        rule_engine_version: auditData.rule_engine_version,
        extracted_attributes: auditData.extracted_attributes,
        matrix_findings: simulateTamper
          ? [
              ...allFindings,
              {
                country_code: 'US',
                category: 'Claim Wording',
                check_code: 'TAMPERED_INJECTED_CLAUSE',
                status: 'pass',
                rule_citation: 'FALSIFIED RECORD',
              },
            ]
          : allFindings,
        citations: auditData.citations,
        prev_hash: auditData.prev_hash,
      };

      const result = await verifyComplianceHash(payload);
      setVerificationResult(result);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Cryptographic Audit Chain Verifier</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  EU AI ACT (2026)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Article 13 Transparency & Article 14 Human Oversight Verification Ledger
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Block Metadata */}
        {auditData ? (
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold">Inspection SHA-256 Hash Fingerprint:</span>
                <span className="font-mono text-emerald-400 font-bold">SHA-256 SEAL</span>
              </div>
              <p className="font-mono text-slate-200 text-[11px] break-all bg-slate-900 p-2 rounded border border-slate-800">
                {auditData.compliance_hash}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Inspection ID:</span>
                <span className="text-slate-300 font-bold">{auditData.inspection_id}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Rule Engine Version:</span>
                <span className="text-slate-300 font-bold">{auditData.rule_engine_version}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
              <span className="text-slate-500 block text-[10px]">Previous Block Hash (Parent):</span>
              <span className="text-slate-400 text-[10px] break-all">{auditData.prev_hash}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Run an audit first to generate a cryptographic hash block.</p>
        )}

        {/* Verification Result Banner */}
        {verificationResult && (
          <div className={`p-4 rounded-xl border text-xs space-y-1.5 animate-in zoom-in-95 duration-200 ${
            verificationResult.is_valid
              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/60 text-rose-300'
          }`}>
            <div className="flex items-center space-x-2 font-bold text-sm">
              {verificationResult.is_valid ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>CRYPTOGRAPHIC PROOF: UNMODIFIED & AUTHENTIC</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                  <span>TAMPER DETECTED: AUDIT INTEGRITY BREACHED</span>
                </>
              )}
            </div>
            <p className="text-xs leading-relaxed opacity-90">{verificationResult.verification_message}</p>
            <div className="text-[10px] font-mono pt-1 text-slate-400 border-t border-slate-800/80">
              Recomputed: {verificationResult.recomputed_hash.slice(0, 24)}...
            </div>
          </div>
        )}

        {/* Verification Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => handleVerify(false)}
            disabled={isVerifying || !auditData}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Live Ledger Integrity</span>
          </button>

          <button
            type="button"
            onClick={() => handleVerify(true)}
            disabled={isVerifying || !auditData}
            className="py-2.5 px-4 bg-rose-900/60 hover:bg-rose-800/60 text-rose-200 border border-rose-700/60 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            title="Simulates an attacker modifying an extracted record in the database"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Simulate Tamper (Demo)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
