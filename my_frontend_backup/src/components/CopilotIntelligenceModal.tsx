'use client';
import React, { useState } from 'react';
import { Sparkles, Send, X, Loader2, Database, BarChart3, PieChart as PieIcon, Table as TableIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { queryIntelligence } from '../lib/api';

interface CopilotIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['#0284C7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function CopilotIntelligenceModal({ isOpen, onClose }: CopilotIntelligenceModalProps) {
  const [queryInput, setQueryInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([
    {
      query: 'Which countries have the highest number of violations?',
      chart_type: 'bar',
      x_axis: 'country_code',
      y_axis: 'violation_count',
      summary: 'Breakdown of regulatory non-compliance violations across destination markets.',
      sql: "SELECT country_code, COUNT(id) as violation_count FROM compliance_results WHERE status = 'violation' GROUP BY country_code ORDER BY violation_count DESC",
      data: [
        { country_code: 'US', violation_count: 5 },
        { country_code: 'CA', violation_count: 4 },
        { country_code: 'EU', violation_count: 3 },
        { country_code: 'UK', violation_count: 2 },
        { country_code: 'JP', violation_count: 2 },
      ]
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async (qText: string) => {
    const q = qText.trim();
    if (!q || isLoading) return;
    setIsLoading(true);

    try {
      const res = await queryIntelligence(q);
      setHistory(prev => [res, ...prev]);
      setQueryInput('');
    } catch (e: any) {
      console.error(e);
      setHistory(prev => [
        {
          query: q,
          chart_type: 'table',
          summary: `Query execution error: ${e.message}`,
          sql: '-- Error translating NL query',
          data: []
        },
        ...prev
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Compliance Intelligence Copilot (NL-to-SQL)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ask natural language questions about regulatory failure rates and multi-market trends.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sample Questions */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap gap-2 text-xs">
          <span className="text-slate-500 text-[11px] self-center">Try asking:</span>
          {[
            'Which destination markets have the most violations?',
            'Show distribution of check categories',
            'What are the overall inspection verdict rates?',
          ].map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(sample)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-950 hover:border-indigo-500 border border-slate-700 text-slate-300 text-[11px] transition-all"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Conversation / Query Results Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {history.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Natural Query</span>
                  <p className="text-sm font-bold text-white">"{item.query}"</p>
                </div>
                <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                  {item.chart_type?.toUpperCase()} CHART
                </span>
              </div>

              {/* SQL Debug Pill */}
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80 flex items-center space-x-2 text-[11px] font-mono text-slate-400 overflow-x-auto">
                <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{item.sql}</span>
              </div>

              {/* Summary Description */}
              <p className="text-xs text-slate-300">{item.summary}</p>

              {/* Chart Render */}
              {item.data && item.data.length > 0 && (
                <div className="h-56 w-full pt-2">
                  {item.chart_type === 'pie' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={item.data}
                          dataKey={item.y_axis || Object.keys(item.data[0])[1]}
                          nameKey={item.x_axis || Object.keys(item.data[0])[0]}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                        >
                          {item.data.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : item.chart_type === 'bar' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={item.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey={item.x_axis || Object.keys(item.data[0])[0]} stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey={item.y_axis || Object.keys(item.data[0])[1]} fill="#0284C7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="overflow-x-auto max-h-48 border border-slate-800 rounded-lg">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-900 text-slate-400">
                          <tr>
                            {Object.keys(item.data[0]).map(k => (
                              <th key={k} className="p-2 font-mono uppercase text-[10px]">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {item.data.map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-900/50">
                              {Object.values(row).map((v: any, cIdx: number) => (
                                <td key={cIdx} className="p-2 text-slate-300 font-mono text-[11px]">{String(v)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend(queryInput);
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              placeholder="Ask anything (e.g. 'Show products that failed Canada labeling', 'Compare US vs EU violations')..."
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !queryInput.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Query</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
