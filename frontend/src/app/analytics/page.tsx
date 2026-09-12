'use client';
import React, { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { Sparkles, BarChart2, Search, ArrowRight, Loader2, Database, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { queryIntelligence } from '../../lib/api';

const COLORS = ['#2563EB', '#F59E0B', '#E11D48', '#94A3B8'];

function AnalyticsContent() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleQuery = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResult(null);
    
    try {
      const res = await queryIntelligence(query);
      setResult(res);
    } catch (err) {
      console.error("Query failed", err);
      // Fallback in case backend AI fails:
      setResult({
        chart_type: 'bar',
        x_axis: 'country_code',
        y_axis: 'count',
        summary: 'Failed to fetch actual AI response. Please ensure backend is running with API keys.',
        sql: 'SELECT * FROM fallback',
        data: []
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in relative z-10 min-h-[calc(100vh-64px)] flex flex-col">
      
      {/* Background radial overlay */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-100/40 rounded-full blur-3xl z-[-1] pointer-events-none"></div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary-600" /> AI Analytics Workspace
          </h1>
          <p className="text-slate-500 mt-1">Transform natural language into instantly visualized database queries.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        
        {/* Search Input Area */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center space-y-6">
           <div className="text-center max-w-lg mx-auto">
             <div className="w-16 h-16 mx-auto bg-primary-50 rounded-2xl flex items-center justify-center shadow-sm mb-4">
               <Database className="w-8 h-8 text-primary-600" />
             </div>
             <h2 className="text-lg font-bold text-slate-800">Ask the Database</h2>
             <p className="text-sm text-slate-500">LexPort AI translates your question into SQL and charts the results using live SQLite data.</p>
           </div>
           
           <div className="w-full max-w-2xl relative flex items-center">
             <Search className="w-5 h-5 text-slate-400 absolute left-4" />
             <input 
               value={query}
               onChange={e => setQuery(e.target.value)}
               onKeyDown={e => { if (e.key === 'Enter') handleQuery(); }}
               placeholder="e.g., Show me violations by region over the last 30 days..."
               className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-32 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 shadow-sm transition-all"
             />
             <button 
               onClick={handleQuery}
               disabled={isSearching || !query.trim()}
               className="absolute right-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-blue"
             >
               {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'} 
               {!isSearching && <ArrowRight className="w-4 h-4" />}
             </button>
           </div>

           <div className="flex items-center gap-2 overflow-x-auto w-full max-w-2xl pb-2 sidebar-scroll">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">Try Asking:</span>
             {['Top violation categories', 'Risk breakdown in EU', 'Highest failing products'].map(q => (
               <button key={q} onClick={() => { setQuery(q); }} className="text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors">
                 {q}
               </button>
             ))}
           </div>
        </div>

        {/* Loading Area */}
        {isSearching && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in p-12">
            <div className="flex items-center gap-4">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <div className="space-y-1">
                <p className="font-bold text-slate-800">Compiling SQL and querying database...</p>
                <p className="text-xs text-slate-500 font-mono">Generating dynamic syntax via AI...</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Area */}
        {result && !isSearching && (
          <div className="grid grid-cols-1 gap-6 animate-slide-in-up">
            
            {/* Dynamic Chart Container */}
            <div className="glass-panel p-6 rounded-2xl min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  {result.chart_type === 'pie' ? <PieChartIcon className="w-6 h-6 text-amber-500" /> : <BarChart2 className="w-6 h-6 text-primary-600" />}
                  {result.summary}
                </h3>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md border border-slate-200">
                  SQL AUTOGENERATED
                </span>
              </div>

              <div className="flex-1 w-full relative flex items-center justify-center">
                {result.data && result.data.length > 0 ? (
                  <>
                    {result.chart_type === 'pie' ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie 
                            data={result.data} 
                            cx="50%" cy="50%" 
                            innerRadius={70} outerRadius={100} 
                            paddingAngle={5} 
                            dataKey={result.y_axis}
                            nameKey={result.x_axis} 
                            stroke="none"
                            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          >
                            {result.data.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={result.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey={result.x_axis} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 14px 0 rgba(37,99,235,0.1)' }} />
                          <Bar dataKey={result.y_axis} fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </>
                ) : (
                  <p className="text-slate-400 font-medium">No results found for this query.</p>
                )}
              </div>
            </div>

            {/* AI Context Panel */}
            <div className="glass-panel p-6 rounded-2xl bg-primary-50/50">
              <h3 className="font-bold text-slate-800 mb-3">Executed Query Breakdown</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                To fulfill this request, LexPort SQL Copilot generated the following SQLite read-only query against your active compliance database:
              </p>
              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto shadow-inner">
                <code className="text-xs font-mono text-emerald-400 whitespace-nowrap">
                  {result.sql || "N/A"}
                </code>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AppShell>
      <AnalyticsContent />
    </AppShell>
  );
}
