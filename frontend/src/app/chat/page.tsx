'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Plus, Search, MessageSquare, Scale, Sparkles, Trash2,
  ChevronRight, Bot, User as UserIcon, Loader2, Clock, Copy, Check,
  ShieldCheck, Globe, AlertTriangle, FileText, BookOpen, Zap,
  Calculator, DollarSign, TrendingUp, BarChart2, Database,
  ArrowRight, RefreshCw, Layers, Sliders, CheckCircle2, XCircle, FileCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import AppShell from '../../components/layout/AppShell';
import { sendChatMessage, calculateProfit, queryIntelligence } from '../../lib/api';

interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  profitData?: any;
  documents?: any[];
  citations?: string[];
  analyticsChart?: {
    chart_type: string;
    x_axis: string;
    y_axis: string;
    summary: string;
    sql: string;
    data: any[];
  };
  isError?: boolean;
}

const CHART_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const ADVISOR_SUGGESTIONS = [
  { text: 'What is the customs tariff on cosmetics in the UK?', category: 'Tariffs' },
  { text: 'Calculate profit for $45 cream imported into Germany', category: 'Profit' },
  { text: 'What documents are required to import toys to US under Section 321?', category: 'Docs' },
  { text: 'Can I sell Ayurvedic cosmetics with camphor in Canada?', category: 'Regulations' },
  { text: 'Compare import duties for electronics in Japan vs India', category: 'Comparison' },
];

const SQL_SUGGESTIONS = [
  'Which market has the most violations?',
  'Show compliance rates across all countries',
  'Compare EU vs US violation counts',
  'Which products failed the most audits?',
  'Show overall compliance pass rate',
];

export default function UnifiedChatPage() {
  const [activeTab, setActiveTab] = useState<'advisor' | 'analytics'>('advisor');

  // ── Tab 1: AI Advisor & Profit Calculator State ──
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your LexPort Compliance & Trade AI Copilot. Ask me any statutory question about import tariffs, customs regulations, mandatory documents, or net profit margins across 11 sovereign nations. You can also use the interactive calculator on the right to test retail prices and landed costs in real time!',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Profit Calculator State
  const [calcParams, setCalcParams] = useState({
    product_name: 'Organic Anti-Aging Serum',
    category: 'cosmetics',
    country_code: 'US',
    selling_price_usd: 42.0,
    unit_cost_usd: 9.5,
    shipping_cost_usd: 4.8,
  });
  const [calcResult, setCalcResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // ── Tab 2: Database NL-to-SQL Analytics State ──
  const [sqlQuery, setSqlQuery] = useState('');
  const [isSqlLoading, setIsSqlLoading] = useState(false);
  const [sqlResult, setSqlResult] = useState<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initial calculation on mount
  useEffect(() => {
    runProfitCalculation();
  }, []);

  const runProfitCalculation = async (overrideParams?: Partial<typeof calcParams>) => {
    setIsCalculating(true);
    setCalcError(null);
    const p = { ...calcParams, ...overrideParams };
    try {
      const res = await calculateProfit(p);
      setCalcResult(res);
    } catch (err: any) {
      setCalcError(err.message || 'Failed to calculate profit');
    } finally {
      setIsCalculating(false);
    }
  };

  // ── Handle Sending Chat Message to AI Copilot ──
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: AdvisorMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      // Build conversation history format
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage(text, history, {
        category: calcParams.category,
        country_code: calcParams.country_code,
        price: calcParams.selling_price_usd,
      });

      const replyContent = res.reply || res.response || 'I evaluated your query against cross-border statutory rules.';
      
      // Auto-detect if user requested analytics, comparison, or charts
      let analyticsChart = undefined;
      const isChartIntent = /(?:chart|graph|plot|visualize|compare|highest|most|lowest|ranking|stats|statistics|analytics|count|rates|percentage)/i.test(text);
      if (isChartIntent) {
        try {
          const sqlRes = await queryIntelligence(text);
          if (sqlRes && sqlRes.data && sqlRes.data.length > 0) {
            analyticsChart = sqlRes;
          }
        } catch {}
      }

      const assistantMsg: AdvisorMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        profitData: res.profit_calculation,
        documents: res.document_checklist,
        analyticsChart: analyticsChart,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      // If response included updated profit calculation, sync with calculator
      if (res.profit_calculation) {
        setCalcResult(res.profit_calculation);
        if (res.country_code) {
          setCalcParams(prev => ({
            ...prev,
            country_code: res.country_code,
            category: res.category || prev.category,
          }));
        }
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Error connecting to compliance AI backend. Please verify FastAPI backend is running on http://127.0.0.1:8000.',
          timestamp: new Date(),
          isError: true,
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handle NL-to-SQL Analytics ──
  const handleSqlRun = async (queryText?: string) => {
    const q = (queryText || sqlQuery).trim();
    if (!q || isSqlLoading) return;
    setIsSqlLoading(true);
    setSqlResult(null);

    try {
      const res = await queryIntelligence(q);
      setSqlResult(res);
    } catch (err: any) {
      setSqlResult({
        summary: 'Error executing natural language query. Please verify backend connection.',
        chart_type: 'bar',
        data: [],
        sql: 'SELECT status, COUNT(*) FROM compliance_results GROUP BY status;',
      });
    } finally {
      setIsSqlLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">
        
        {/* Top Header & Tab Switcher */}
        <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-blue">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                LexPort AI Copilot & Profit Calculator
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Gemini Flash 3.5/3.6
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Interactive regulatory advisor, customs tariff calculator, and live database intelligence.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('advisor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'advisor'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-4 h-4 text-primary-600" />
              <span>AI Regulatory Advisor & Calculator</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Database NL-to-SQL Analytics</span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: AI Advisor & Interactive Profit Calculator ── */}
        {activeTab === 'advisor' && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            
            {/* Left Column: Chat Conversation */}
            <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-slate-200">
              
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-xs mt-1 text-white">
                        <Scale className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`max-w-[82%] space-y-2.5 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xs ${
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : msg.isError
                            ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-none'
                            : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {/* Inline Profit Card if returned */}
                        {msg.profitData && (
                          <div className="mt-3.5 pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">De Minimis</span>
                              <strong className="text-slate-800 font-mono">
                                {msg.profitData.qualifies_de_minimis ? '🟢 Section 321 Duty-Free' : '🔴 Formal Clearance'}
                              </strong>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Tariff Rate</span>
                              <strong className="text-slate-800 font-mono">{msg.profitData.duty_rate_percent}</strong>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Landed Cost</span>
                              <strong className="text-slate-800 font-mono">${msg.profitData.total_landed_cost_usd}</strong>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Net Profit Margin</span>
                              <strong className="text-emerald-700 font-mono font-bold">{msg.profitData.profit_margin_percent}</strong>
                            </div>
                          </div>
                        )}

                        {/* Mandatory Documents Checklist if returned */}
                        {msg.documents && msg.documents.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-600 block flex items-center gap-1">
                              <FileCheck className="w-3.5 h-3.5 text-primary-600" /> Mandatory Statutory Documentation:
                            </span>
                            {msg.documents.slice(0, 3).map((d: any, idx: number) => (
                              <div key={idx} className="text-[11px] bg-white p-2 rounded-lg border border-slate-200 flex items-start gap-2">
                                <span className="font-bold text-primary-700">{d.doc_name}</span>
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-600">{d.seller_action_needed || d.issuing_authority}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Interactive Financial Breakdown Bar Chart */}
                        {msg.profitData && (
                          <div className="mt-3.5 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                <BarChart2 className="w-3.5 h-3.5 text-primary-600" /> Financial Distribution Chart ($ USD)
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Retail MSRP: ${msg.profitData.selling_price_usd}
                              </span>
                            </div>
                            <div className="h-36 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={[
                                    { name: 'COGS', amount: msg.profitData.unit_cost_usd || 0, fill: '#3B82F6' },
                                    { name: 'Shipping', amount: msg.profitData.shipping_cost_usd || 0, fill: '#6366F1' },
                                    { name: 'Duty', amount: msg.profitData.duty_amount_usd || 0, fill: '#F59E0B' },
                                    { name: 'VAT/GST', amount: msg.profitData.estimated_tax_usd || 0, fill: '#EC4899' },
                                    { name: 'Net Profit', amount: Math.max(0, msg.profitData.net_profit_usd || 0), fill: '#10B981' },
                                  ]}
                                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                                >
                                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                                  <RechartsTooltip
                                    formatter={(value: any) => [`$${Number(value).toFixed(2)} USD`, 'Amount']}
                                    contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                  />
                                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {/* Inline Interactive NL-to-SQL Analytics Chart */}
                        {msg.analyticsChart && msg.analyticsChart.data && msg.analyticsChart.data.length > 0 && (
                          <div className="mt-3.5 p-3.5 bg-white rounded-xl border border-indigo-200/80 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Visual Analytics: {msg.analyticsChart.summary}
                              </span>
                              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                                Live Database
                              </span>
                            </div>
                            <div className="h-44 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={msg.analyticsChart.data.slice(0, 8)} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                  <XAxis dataKey={msg.analyticsChart.x_axis} tick={{ fontSize: 10, fill: '#64748B' }} />
                                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                                  <RechartsTooltip
                                    contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                  />
                                  <Bar dataKey={msg.analyticsChart.y_axis} fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <details className="text-[10px] text-slate-400 font-mono pt-1">
                              <summary className="cursor-pointer hover:text-indigo-600 font-sans font-semibold">
                                View Generated SQL Query
                              </summary>
                              <pre className="mt-1 p-2 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto text-[9px]">
                                {msg.analyticsChart.sql}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 px-1 font-mono">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 rounded-tl-none flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                      <span className="text-xs text-slate-500 font-medium">
                        Consulting Gemini 3.6 Flash statutory rules engine...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Toolbar */}
              <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-thin">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
                  Quick Prompts:
                </span>
                {ADVISOR_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s.text)}
                    className="text-[11px] bg-white border border-slate-200 hover:border-primary-400 hover:bg-primary-50/50 text-slate-700 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0 font-medium"
                  >
                    {s.text}
                  </button>
                ))}
              </div>

              {/* Chat Input Box */}
              <div className="p-4 bg-white border-t border-slate-200">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all"
                >
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask about tariffs, Section 321 de minimis, profit calculations, or legal rules..."
                    className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl shadow-blue transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Interactive Landed Cost & Profit/Tariff Calculator */}
            <div className="w-full lg:w-96 bg-slate-50 flex flex-col p-6 overflow-y-auto space-y-5 border-l border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Landed Cost & Tariff Calculator</h3>
                    <p className="text-[10px] text-slate-400">Deterministic customs & tax engine</p>
                  </div>
                </div>
                <button
                  onClick={() => runProfitCalculation()}
                  disabled={isCalculating}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                  title="Recalculate"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin text-primary-600' : ''}`} />
                </button>
              </div>

              {/* Interactive Inputs */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-2xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Destination Market
                  </label>
                  <select
                    value={calcParams.country_code}
                    onChange={e => {
                      const c = e.target.value;
                      setCalcParams(p => ({ ...p, country_code: c }));
                      runProfitCalculation({ country_code: c });
                    }}
                    className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="US">🇺🇸 United States (Section 321)</option>
                    <option value="CA">🇨🇦 Canada (CBSA / $20 CAD)</option>
                    <option value="EU">🇪🇺 European Union (€150 Duty / IOSS)</option>
                    <option value="DE">🇩🇪 Germany (LUCID / 19% MwSt)</option>
                    <option value="UK">🇬🇧 United Kingdom (£135 / 20% VAT)</option>
                    <option value="JP">🇯🇵 Japan (¥10,000 / PMDA)</option>
                    <option value="AU">🇦🇺 Australia ($1,000 AUD)</option>
                    <option value="IN">🇮🇳 India (₹0 De Minimis / CDSCO)</option>
                    <option value="CN">🇨🇳 China (CBEC 9.1%)</option>
                    <option value="VN">🇻🇳 Vietnam (1M VND / DAV)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Product Category
                  </label>
                  <select
                    value={calcParams.category}
                    onChange={e => {
                      const c = e.target.value;
                      setCalcParams(p => ({ ...p, category: c }));
                      runProfitCalculation({ category: c });
                    }}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="cosmetics">Cosmetics & Skincare (Ch. 33)</option>
                    <option value="toys">Toys & Baby Products (Ch. 95)</option>
                    <option value="kitchenware">Kitchenware & Food Contact (Ch. 44/73)</option>
                    <option value="electronics">Consumer Electronics (Ch. 85)</option>
                    <option value="general">General Consumer Merchandise</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      MSRP ($)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={calcParams.selling_price_usd}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setCalcParams(p => ({ ...p, selling_price_usd: val }));
                      }}
                      onBlur={() => runProfitCalculation()}
                      className="w-full text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      COGS ($)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={calcParams.unit_cost_usd}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setCalcParams(p => ({ ...p, unit_cost_usd: val }));
                      }}
                      onBlur={() => runProfitCalculation()}
                      className="w-full text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Shipping ($)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={calcParams.shipping_cost_usd}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setCalcParams(p => ({ ...p, shipping_cost_usd: val }));
                      }}
                      onBlur={() => runProfitCalculation()}
                      className="w-full text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Results Card */}
              {calcResult && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-card">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Net Profit</span>
                      <div className="text-xl font-black text-emerald-600 font-mono">
                        ${calcResult.net_profit_usd?.toFixed(2)} USD
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({calcResult.net_profit_local})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Net Margin</span>
                      <div className="text-xl font-black text-slate-900 font-mono">
                        {calcResult.profit_margin_percent}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Target Viable
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">De Minimis Qualification:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {calcResult.qualifies_de_minimis ? '🟢 Duty-Free Entry' : '🔴 Duty Applies'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customs Tariff Rate:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {calcResult.duty_rate_percent} (${calcResult.duty_amount_usd?.toFixed(2)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Import VAT / GST:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {calcResult.vat_gst_percent} (${calcResult.estimated_tax_usd?.toFixed(2)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customs Clearance Fee:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        ${calcResult.customs_clearance_fee_usd?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2">
                      <span className="font-bold text-slate-700">Total Landed Cost:</span>
                      <span className="font-black text-slate-900 font-mono">
                        ${calcResult.total_landed_cost_usd?.toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  {calcResult.recommendation && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {calcResult.recommendation}
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── TAB 2: Database NL-to-SQL Analytics Workspace ── */}
        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-6">
            
            {/* Search Input Box */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Natural Language Audit Analytics</h3>
                  <p className="text-xs text-slate-500">
                    Query live SQLite compliance records and render charts automatically using AI.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  value={sqlQuery}
                  onChange={e => setSqlQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSqlRun()}
                  placeholder="e.g. Which market has the most violations? Or compare pass rates by country"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-primary-500"
                />
                <button
                  onClick={() => handleSqlRun()}
                  disabled={isSqlLoading || !sqlQuery.trim()}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-blue transition-colors flex items-center gap-2 flex-shrink-0"
                >
                  {isSqlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Execute AI Query</span>
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Suggested:</span>
                {SQL_SUGGESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSqlQuery(q);
                      handleSqlRun(q);
                    }}
                    className="text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-lg transition-colors font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Display */}
            {sqlResult && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card space-y-6 animate-fade-in">
                
                {/* Summary & SQL pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider block">AI Query Summary</span>
                    <h4 className="text-base font-bold text-slate-800 mt-0.5">{sqlResult.summary}</h4>
                  </div>
                  {sqlResult.sql && (
                    <div className="bg-slate-900 text-slate-200 font-mono text-[11px] px-3 py-1.5 rounded-xl border border-slate-800 max-w-md overflow-x-auto">
                      <code>{sqlResult.sql}</code>
                    </div>
                  )}
                </div>

                {/* Chart Visualization */}
                {sqlResult.data && sqlResult.data.length > 0 && (
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                      <span className="text-xs font-bold text-slate-700 block mb-4 flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4 text-primary-600" /> Bar Chart Visualization
                      </span>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sqlResult.data}>
                            <XAxis
                              dataKey={sqlResult.x_axis || Object.keys(sqlResult.data[0])[0]}
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis tick={{ fontSize: 11 }} />
                            <RechartsTooltip />
                            <Bar
                              dataKey={sqlResult.y_axis || Object.keys(sqlResult.data[0])[1] || 'count'}
                              fill="#2563EB"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                      <span className="text-xs font-bold text-slate-700 block mb-4 flex items-center gap-1.5">
                        <PieChart className="w-4 h-4 text-emerald-600" /> Share Distribution
                      </span>
                      <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sqlResult.data}
                              dataKey={sqlResult.y_axis || Object.keys(sqlResult.data[0])[1] || 'count'}
                              nameKey={sqlResult.x_axis || Object.keys(sqlResult.data[0])[0]}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                            >
                              {sqlResult.data.map((_: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabular Records */}
                {sqlResult.data && sqlResult.data.length > 0 && (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <tr>
                          {Object.keys(sqlResult.data[0]).map(key => (
                            <th key={key} className="px-4 py-3">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sqlResult.data.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            {Object.values(row).map((val: any, cIdx: number) => (
                              <td key={cIdx} className="px-4 py-2.5 font-mono text-slate-700">
                                {String(val)}
                              </td>
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
        )}

      </div>
    </AppShell>
  );
}
