import { useState } from 'react'
import { Sparkles, Globe, Loader2, ArrowRight } from 'lucide-react'
import './index.css'

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    setIsScanning(true);
    // Mimic the backend API request / scraper
    setTimeout(() => {
      setResult({
        overall_verdict: 'REMEDIATION_REQUIRED',
        title: 'Ayurvedic Healing Skin Cream',
        markets: ['US', 'EU', 'CA']
      });
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div className="w-[400px] h-[550px] bg-slate-50 text-slate-800 font-sans flex flex-col p-4 border border-slate-200 shadow-2xl relative overflow-hidden">
      {/* Background Orbs to match my_frontend_backup aesthetics */}
      <div className="absolute top-[-30px] right-[-20px] w-48 h-48 bg-primary-200/40 rounded-full blur-3xl z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-30px] left-[-20px] w-32 h-32 bg-indigo-200/40 rounded-full blur-2xl z-0 pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center space-x-3 mb-6 border-b border-slate-200 pb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-blue">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900">LexPort Scanner</h1>
          <p className="text-[11px] text-slate-500">Cross-border compliance check</p>
        </div>
      </div>

      {!result ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-lg transform transition duration-300 hover:scale-105">
              <Sparkles className="w-7 h-7 text-primary-500" />
            </div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mt-4">Active Page Analysis</h2>
            <p className="text-[11px] text-slate-500 text-center px-4 leading-relaxed">
              Click the button below to extract marketing claims, parameters, and pricing from this page for a 3-tier compliance audit.
            </p>
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="group w-full max-w-[220px] py-2.5 px-5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-blue flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <span>Run Page Audit</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="relative z-10 flex-1 space-y-4 animate-scale-in">
          <div className="glass-panel p-4 rounded-xl space-y-2 relative overflow-hidden">
             
            {/* Warning Indicator row */}
            <div className="flex items-center space-x-2 mb-2">
              <div className="pulse-dot-amber"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Warning Detected</span>
            </div>
            
            <p className="text-xs font-bold text-slate-900 leading-tight">{result.title}</p>
            <p className="text-[11px] text-slate-600 pt-1">
              Violates 2 claims across {result.markets.join(', ')}. Action required before listing.
            </p>
          </div>

          <button
             onClick={() => setResult(null)}
             className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-xs transition-all hover:shadow-sm mt-4"
           >
             Scan Another Page
          </button>
        </div>
      )}
    </div>
  )
}

export default App
