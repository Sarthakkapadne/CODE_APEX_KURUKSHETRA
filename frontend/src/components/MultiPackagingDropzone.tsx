'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud, Image as ImageIcon, X, Sparkles, CheckCircle2,
  Camera, FileText, AlertCircle, RefreshCw, Eye, ShieldCheck, Zap
} from 'lucide-react';

export interface MultiPackagingDropzoneProps {
  onImagesSelected: (frontBase64: string, backBase64: string) => void;
  initialFront?: string;
  initialBack?: string;
  className?: string;
  isLoading?: boolean;
}

// Built-in realistic sample packaging presets for judges & testing
const JUDGE_SAMPLE_PRESETS = [
  {
    name: 'Ayurvedic Herbal Joint Cream (Cosmetic / OTC)',
    category: 'cosmetics',
    frontLabel: 'AyurVeda Miracle Joint & Muscle Healing Cream - 100g Net Wt',
    backLabel: 'Active: Camphor 5%, Menthol 3%. Inactive: Sesame Oil, Eucalyptus. Made in India. Lot #AY-2024-99.',
    frontSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23064e3b"/><rect x="20" y="20" width="560" height="360" rx="16" fill="%23065f46" stroke="%2310b981" stroke-width="4"/><text x="300" y="90" fill="%23ecfdf5" font-family="sans-serif" font-size="26" font-weight="bold" text-anchor="middle">🌿 VedaHeal Herbals</text><text x="300" y="140" fill="%23ffffff" font-family="sans-serif" font-size="28" font-weight="900" text-anchor="middle">AYURVEDA MIRACLE CREAM</text><text x="300" y="180" fill="%23a7f3d0" font-family="sans-serif" font-size="18" text-anchor="middle">Deep Transdermal Joint &amp; Muscle Relief</text><rect x="150" y="220" width="300" height="40" rx="8" fill="%23047857"/><text x="300" y="246" fill="%23ffffff" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">NET WT. 3.52 OZ (100g e)</text><text x="300" y="320" fill="%236ee7b7" font-family="sans-serif" font-size="14" text-anchor="middle">PRIMARY DISPLAY PANEL (PDP) · FORMULATED IN INDIA</text></svg>`,
    backSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><rect x="20" y="20" width="560" height="360" rx="16" fill="%231e293b" stroke="%2338bdf8" stroke-width="4"/><text x="40" y="60" fill="%2338bdf8" font-family="sans-serif" font-size="16" font-weight="bold">DRUG FACTS &amp; INGREDIENT DECLARATION</text><text x="40" y="95" fill="%23ffffff" font-family="sans-serif" font-size="13">Active Ingredients: Camphor 5.0% (Topical Analgesic), Menthol 3.0%</text><text x="40" y="125" fill="%23cbd5e1" font-family="sans-serif" font-size="12">Inactive: Sesame Seed Oil, Eucalyptus Leaf Oil, Purified Water, Carbomer.</text><text x="40" y="165" fill="%23f87171" font-family="sans-serif" font-size="13" font-weight="bold">WARNINGS: For external use only. Avoid contact with eyes.</text><text x="40" y="195" fill="%23cbd5e1" font-family="sans-serif" font-size="12">Do not apply to open wounds. Discontinue if excessive redness occurs.</text><rect x="40" y="240" width="220" height="70" fill="%23ffffff" rx="6"/><text x="50" y="280" fill="%23000000" font-family="monospace" font-size="20" font-weight="bold">||| | |||| ||| ||</text><text x="50" y="300" fill="%23000000" font-family="monospace" font-size="11">8 901234 567890</text><text x="320" y="260" fill="%23ffffff" font-family="sans-serif" font-size="12">Mfd By: VedaHeal Laboratories</text><text x="320" y="280" fill="%2394a3b8" font-family="sans-serif" font-size="11">Industrial Estate, Mumbai 400001, India</text><text x="320" y="300" fill="%2338bdf8" font-family="monospace" font-size="12" font-weight="bold">CE · FDA MoCRA Listed</text></svg>`,
  },
  {
    name: 'Infant Activity Baby Walker (Juvenile Toys / CPSC)',
    category: 'toys',
    frontLabel: 'Baby Joy 3-in-1 Foldable Activity Walker',
    backLabel: 'ASTM F977-18 Certified · Warning: Never leave child unattended · Max Weight 26 lbs',
    frontSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e1b4b"/><rect x="20" y="20" width="560" height="360" rx="16" fill="%23312e81" stroke="%23818cf8" stroke-width="4"/><text x="300" y="85" fill="%23c7d2fe" font-family="sans-serif" font-size="26" font-weight="bold" text-anchor="middle">👶 Baby Joy Infant Gear</text><text x="300" y="135" fill="%23ffffff" font-family="sans-serif" font-size="26" font-weight="900" text-anchor="middle">3-IN-1 FOLDABLE BABY WALKER</text><text x="300" y="175" fill="%23a5b4fc" font-family="sans-serif" font-size="16" text-anchor="middle">High-Back Padded Seat · Interactive Music &amp; Toy Tray</text><rect x="180" y="220" width="240" height="40" rx="8" fill="%234338ca"/><text x="300" y="246" fill="%23ffffff" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">AGES 6 - 18 MONTHS</text><text x="300" y="320" fill="%23c7d2fe" font-family="sans-serif" font-size="13" text-anchor="middle">MODEL: BJ-WALK-01 · PRIMARY DISPLAY PANEL</text></svg>`,
    backSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><rect x="20" y="20" width="560" height="360" rx="16" fill="%231e293b" stroke="%23f59e0b" stroke-width="4"/><text x="40" y="60" fill="%23f59e0b" font-family="sans-serif" font-size="16" font-weight="bold">WARNING: STAIR HAZARD &amp; SAFETY CERTIFICATIONS</text><text x="40" y="95" fill="%23f87171" font-family="sans-serif" font-size="13" font-weight="bold">AVOID SERIOUS INJURY OR DEATH: Block stairs/steps before use.</text><text x="40" y="125" fill="%23cbd5e1" font-family="sans-serif" font-size="12">Never leave child unattended. Always keep child in view while in walker.</text><text x="40" y="155" fill="%23cbd5e1" font-family="sans-serif" font-size="12">Use only on flat surfaces free of objects that could cause tipping.</text><rect x="40" y="185" width="520" height="45" fill="%230284c7" rx="6"/><text x="300" y="213" fill="%23ffffff" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">CERTIFIED COMPLIANT WITH ASTM F977-18 &amp; 16 CFR 1216</text><rect x="40" y="250" width="180" height="60" fill="%23ffffff" rx="6"/><text x="50" y="285" fill="%23000000" font-family="monospace" font-size="18" font-weight="bold">|||| | || |||| |</text><text x="50" y="302" fill="%23000000" font-family="monospace" font-size="10">6 954321 001238</text><text x="250" y="270" fill="%23ffffff" font-family="sans-serif" font-size="12">Distributed by BabyJoy Global LLC, Delaware, USA</text><text x="250" y="295" fill="%2310b981" font-family="sans-serif" font-size="12" font-weight="bold">CPC (Children's Product Certificate) Attached</text></svg>`,
  },
];

export default function MultiPackagingDropzone({
  onImagesSelected,
  initialFront,
  initialBack,
  className = '',
  isLoading = false,
}: MultiPackagingDropzoneProps) {
  const [frontImage, setFrontImage] = useState<string | null>(initialFront || null);
  const [backImage, setBackImage] = useState<string | null>(initialBack || null);
  const [frontMeta, setFrontMeta] = useState<{ name: string; size: string } | null>(null);
  const [backMeta, setBackMeta] = useState<{ name: string; size: string } | null>(null);

  const [isDraggingA, setIsDraggingA] = useState(false);
  const [isDraggingB, setIsDraggingB] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ title: string; src: string } | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Helper to handle file selection and convert to base64
  const processFile = (
    file: File,
    slot: 'front' | 'back'
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;

      if (slot === 'front') {
        setFrontImage(base64);
        setFrontMeta({ name: file.name, size: sizeStr });
        onImagesSelected(base64, backImage || '');
      } else {
        setBackImage(base64);
        setBackMeta({ name: file.name, size: sizeStr });
        onImagesSelected(frontImage || '', base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (slot: 'front' | 'back') => {
    if (slot === 'front') {
      setFrontImage(null);
      setFrontMeta(null);
      if (frontInputRef.current) frontInputRef.current.value = '';
      onImagesSelected('', backImage || '');
    } else {
      setBackImage(null);
      setBackMeta(null);
      if (backInputRef.current) backInputRef.current.value = '';
      onImagesSelected(frontImage || '', '');
    }
  };

  // Quick Preset button for judges
  const handleApplySamplePreset = (presetIndex: number) => {
    const preset = JUDGE_SAMPLE_PRESETS[presetIndex];
    if (!preset) return;

    setFrontImage(preset.frontSvg);
    setFrontMeta({ name: `${preset.name} (Front PDP)`, size: 'SVG Vector Mock' });

    setBackImage(preset.backSvg);
    setBackMeta({ name: `${preset.name} (Information Panel)`, size: 'SVG Vector Mock' });

    onImagesSelected(preset.frontSvg, preset.backSvg);
  };

  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur shadow-2xl p-5 space-y-5 ${className}`}>
      
      {/* ── Top Header Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Dual Packaging Image Dropzone
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  OCR &amp; Label Inspection
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload physical packaging artwork to audit Net Quantity, INCI Ingredients, Barcodes, and Statutory Marks.
              </p>
            </div>
          </div>
        </div>

        {/* Preset Selector for Judges */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Judge Quick-Fill:</span>
          </span>
          <button
            type="button"
            onClick={() => handleApplySamplePreset(0)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all hover:border-sky-500/50 flex items-center gap-1.5"
            title="Load Ayurvedic Cream Sample Packaging"
          >
            <span>🌿 Joint Cream</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplySamplePreset(1)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all hover:border-sky-500/50 flex items-center gap-1.5"
            title="Load Baby Walker Sample Packaging"
          >
            <span>👶 Baby Walker</span>
          </button>
        </div>
      </div>

      {/* ── Dual Slot Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* ── Slot A: Front Panel (PDP) ── */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center text-[11px] font-mono">
                A
              </span>
              📷 Front Panel (Primary Display Panel - PDP)
            </span>
            {frontImage && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Brand Name, Title &amp; Net Quantity statement (oz/ml declaration)
          </p>

          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 'front')}
          />

          {frontImage ? (
            /* Uploaded Preview Slot A */
            <div className="relative group rounded-xl border border-slate-700 bg-slate-950 overflow-hidden h-52 flex flex-col justify-between p-3">
              <img
                src={frontImage}
                alt="Front Panel Preview"
                className="w-full h-36 object-contain rounded-lg"
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[180px] text-slate-200">
                  {frontMeta?.name || 'front_panel.jpg'}
                </span>
                <span>{frontMeta?.size || 'Loaded'}</span>
              </div>

              {/* Hover Actions */}
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setPreviewModal({ title: 'Front Panel (PDP)', src: frontImage })}
                  className="p-1.5 rounded-lg bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors"
                  title="Expand Full View"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove('front')}
                  className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-colors"
                  title="Remove Image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Empty Dropzone Slot A */
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingA(true); }}
              onDragLeave={() => setIsDraggingA(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingA(false);
                if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0], 'front');
              }}
              onClick={() => frontInputRef.current?.click()}
              className={`h-52 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center ${
                isDraggingA
                  ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
                  : 'border-slate-700/80 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-900/50'
              }`}
            >
              <div className="p-3 rounded-full bg-slate-800 text-sky-400 mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200">
                Click to upload or drag &amp; drop
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                Front packaging label (JPEG, PNG, WebP)
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-2 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Audits: Title, Brand &amp; Net Quantity
              </span>
            </div>
          )}
        </div>

        {/* ── Slot B: Back / Side Panel ── */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[11px] font-mono">
                B
              </span>
              🔬 Back / Side Panel (Information Panel)
            </span>
            {backImage && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Ingredients, Warnings, Barcode &amp; CE/FCC Logos
          </p>

          <input
            ref={backInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 'back')}
          />

          {backImage ? (
            /* Uploaded Preview Slot B */
            <div className="relative group rounded-xl border border-slate-700 bg-slate-950 overflow-hidden h-52 flex flex-col justify-between p-3">
              <img
                src={backImage}
                alt="Back Panel Preview"
                className="w-full h-36 object-contain rounded-lg"
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[180px] text-slate-200">
                  {backMeta?.name || 'back_panel.jpg'}
                </span>
                <span>{backMeta?.size || 'Loaded'}</span>
              </div>

              {/* Hover Actions */}
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setPreviewModal({ title: 'Back Panel (Information Panel)', src: backImage })}
                  className="p-1.5 rounded-lg bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors"
                  title="Expand Full View"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove('back')}
                  className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-colors"
                  title="Remove Image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Empty Dropzone Slot B */
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingB(true); }}
              onDragLeave={() => setIsDraggingB(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingB(false);
                if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0], 'back');
              }}
              onClick={() => backInputRef.current?.click()}
              className={`h-52 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center ${
                isDraggingB
                  ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                  : 'border-slate-700/80 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-900/50'
              }`}
            >
              <div className="p-3 rounded-full bg-slate-800 text-emerald-400 mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200">
                Click to upload or drag &amp; drop
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                Back or side label (JPEG, PNG, WebP)
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-2 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Audits: INCI Ingredients, Lot Code &amp; Warnings
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ── Status Bar / Quick Hint ── */}
      <div className="px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>
            {frontImage && backImage ? (
              <strong className="text-emerald-400">Both panels uploaded — Full 360° Packaging OCR Ready</strong>
            ) : frontImage || backImage ? (
              <span className="text-amber-300">1 of 2 panels loaded — upload both for complete statutory triangulation</span>
            ) : (
              <span className="text-slate-400">Upload both panels or click a judge sample preset above to run physical packaging inspection</span>
            )}
          </span>
        </div>

        {(frontImage || backImage) && (
          <button
            type="button"
            onClick={() => {
              handleRemove('front');
              handleRemove('back');
            }}
            className="text-[11px] font-mono text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Reset Both
          </button>
        )}
      </div>

      {/* ── High-Fidelity Modal Zoom ── */}
      {previewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-sm">{previewModal.title}</span>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[380px] flex items-center justify-center bg-slate-950 rounded-xl p-2 border border-slate-800/50">
              <img
                src={previewModal.src}
                alt={previewModal.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
