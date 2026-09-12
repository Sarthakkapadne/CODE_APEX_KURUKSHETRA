'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  ShieldCheck, AlertTriangle, ArrowRight, Sparkles, RotateCcw,
  TrendingUp, Layers, HelpCircle, CheckCircle2, ChevronRight,
  ExternalLink, Filter, Zap, Target, ShieldAlert, FileText, Info
} from 'lucide-react';
import ConfidenceMeter from './ConfidenceMeter';
import ConfidenceDependencyGraph from './ConfidenceDependencyGraph';
import {
  AuditResponse,
  ConfidenceResponse,
  ImpactItem,
  TopScoreReducer,
} from '../lib/types';
import { fetchComplianceConfidence, simulateConfidenceResolution } from '../lib/api';

interface ComplianceConfidenceDashboardProps {
  auditData: AuditResponse | null;
}

export default function ComplianceConfidenceDashboard({ auditData }: ComplianceConfidenceDashboardProps) {
  const [selectedMarket, setSelectedMarket] = useState<string>('ALL');
  const [confidenceData, setConfidenceData] = useState<ConfidenceResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Simulation Mode State
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [simulatedNodeIds, setSimulatedNodeIds] = useState<string[]>([]);
  const [baseConfidenceScore, setBaseConfidenceScore] = useState<number | null>(null);

  // Selected node in dependency graph for highlighting / drawer
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Load confidence data whenever auditData, selectedMarket, or simulatedNodeIds change
  const loadConfidence = useCallback(
    async (simIds: string[] = simulatedNodeIds) => {
      if (!auditData) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const marketParam = selectedMarket === 'ALL' ? undefined : selectedMarket;
        const res = await fetchComplianceConfidence(auditData, marketParam, simIds);
        setConfidenceData(res);

        // Store base confidence score if not simulating
        if (simIds.length === 0) {
          setBaseConfidenceScore(res.confidence_score);
        }
      } catch (err: any) {
        console.error('Error loading compliance confidence:', err);
        setError(err.message || 'Failed to calculate compliance confidence');
      } finally {
        setIsLoading(false);
      }
    },
    [auditData, selectedMarket, simulatedNodeIds]
  );

  useEffect(() => {
    loadConfidence();
  }, [loadConfidence]);

  // Handle toggling simulation on a specific node
  const handleSimulateToggle = async (nodeId: string) => {
    let nextSimIds: string[];
    if (simulatedNodeIds.includes(nodeId)) {
      nextSimIds = simulatedNodeIds.filter((id) => id !== nodeId);
    } else {
      nextSimIds = [...simulatedNodeIds, nodeId];
    }
    setSimulatedNodeIds(nextSimIds);
    setIsSimulationMode(nextSimIds.length > 0);
    await loadConfidence(nextSimIds);
  };

  // Reset simulation back to real state
  const handleResetSimulation = async () => {
    setSimulatedNodeIds([]);
    setIsSimulationMode(false);
    await loadConfidence([]);
  };

  // Jump to graph node when clicking a Top Reducer
  const handleFocusNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    // Smooth scroll to graph
    const el = document.getElementById('dependency-graph-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const topAction: ImpactItem | undefined = confidenceData?.impact_analysis?.top_recommended_action;
  const topReducers: TopScoreReducer[] = confidenceData?.impact_analysis?.top_score_reducers || [];

  const potentialGain =
    baseConfidenceScore !== null && confidenceData
      ? Math.max(0, +(confidenceData.confidence_score - baseConfidenceScore).toFixed(1))
      : 0;

  // Available markets from audit
  const availableMarkets = ['ALL', ...(auditData?.destination_markets || ['US', 'EU', 'CA', 'UK'])];

  if (!auditData) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
        Run an audit first to evaluate compliance confidence scores and downstream dependency graphs.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Control Bar ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        {/* Left: Section Title & Market Filter */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Compliance Confidence Engine
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Formula v2.0
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Downstream propagating dependency verification for cross-border e-commerce.
            </p>
          </div>
        </div>

        {/* Right: Controls & Simulation Toggle */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end flex-wrap gap-2">
          {/* Target Market Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Market:</span>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer"
            >
              {availableMarkets.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-slate-200">
                  {m === 'ALL' ? '🌐 All Selected Markets' : `${m} Jurisdiction`}
                </option>
              ))}
            </select>
          </div>

          {/* Simulation Toggle Badge */}
          {isSimulationMode && (
            <div className="flex items-center space-x-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Simulation: +{potentialGain}%
              </span>
              <button
                type="button"
                onClick={handleResetSimulation}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                title="Reset simulation back to live audit state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Prominent Banner: Highest Impact Next Action ("What should I fix first?") ── */}
      {topAction && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-indigo-400" /> Recommended First Action
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Highest Marginal Confidence Improvement
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                {topAction.title}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                {topAction.action_directive}
              </p>

              {topAction.statutory_citation && (
                <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-500" />
                  Statute: {topAction.statutory_citation}
                </p>
              )}
            </div>

            {/* Impact Metric & Quick Simulation CTA */}
            <div className="flex items-center space-x-4 shrink-0 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Projected Gain
                </span>
                <span className="text-xl font-mono font-black text-emerald-400 flex items-center gap-1 justify-end">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  +{topAction.confidence_gain_pct}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Unlocks {topAction.downstream_nodes_unlocked} dependent(s)
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleSimulateToggle(topAction.node_id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 border ${
                  topAction.is_simulated || simulatedNodeIds.includes(topAction.node_id)
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-500/40 shadow-emerald-600/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {topAction.is_simulated || simulatedNodeIds.includes(topAction.node_id)
                  ? 'Revert Simulation'
                  : 'Simulate Fix'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Section A: Confidence Meter & 4-Factor Breakdown ── */}
      {confidenceData && (
        <ConfidenceMeter
          score={confidenceData.confidence_score}
          tier={confidenceData.confidence_tier}
          label={confidenceData.confidence_label}
          verdictSummary={confidenceData.verdict_summary}
          factors={confidenceData.factors}
          isSimulated={confidenceData.is_simulated}
          simulatedGain={potentialGain}
          onFactorClick={(factorKey) => {
            // Focus on relevant node in graph
            if (factorKey === 'evidence_verification') {
              const docNode = confidenceData.graph.nodes.find((n) => n.type === 'document' && n.status === 'missing');
              if (docNode) handleFocusNode(docNode.id);
            } else if (factorKey === 'rule_coverage') {
              const regNode = confidenceData.graph.nodes.find((n) => n.type === 'regulation' && n.status !== 'verified');
              if (regNode) handleFocusNode(regNode.id);
            }
          }}
        />
      )}

      {/* ── Section B: "Why is my score this?" (Top Score Reducers & Bottlenecks) ── */}
      {topReducers.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  Why is my score this?
                  <span className="text-[11px] font-normal text-slate-400">
                    · Top {topReducers.length} confidence bottlenecks pulling down clearance assurance
                  </span>
                </h3>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Click any bottleneck to inspect downstream impact in graph
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topReducers.map((reducer, idx) => {
              const isSim = simulatedNodeIds.includes(reducer.node_id);
              return (
                <div
                  key={reducer.node_id || idx}
                  onClick={() => handleFocusNode(reducer.node_id)}
                  className={`bg-slate-950/60 border rounded-xl p-3.5 space-y-2.5 transition-all cursor-pointer group hover:shadow-lg ${
                    isSim
                      ? 'border-sky-500/40 bg-sky-950/20'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {reducer.category}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                      -{reducer.penalty_pct}%
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition-colors line-clamp-2">
                    {reducer.label}
                  </h4>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {reducer.directive}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-mono truncate max-w-[170px] italic">
                      {reducer.citation}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulateToggle(reducer.node_id);
                      }}
                      className={`font-semibold transition-colors flex items-center gap-1 ${
                        isSim ? 'text-sky-400 hover:text-sky-300' : 'text-slate-400 hover:text-sky-400'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {isSim ? 'Revert' : 'Simulate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section C: Interactive Dependency Graph ── */}
      <div id="dependency-graph-section" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Interactive Compliance Dependency Graph
            </h3>
            <span className="text-xs text-slate-400">
              (Downstream cascade: Product → Attributes → Market → Regulations → Requirements → Evidence)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {confidenceData?.graph.nodes.length || 0} nodes · {confidenceData?.graph.edges.length || 0} edges
          </span>
        </div>

        {confidenceData ? (
          <ConfidenceDependencyGraph
            nodes={confidenceData.graph.nodes}
            edges={confidenceData.graph.edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
            onSimulateToggle={handleSimulateToggle}
            simulatedNodeIds={simulatedNodeIds}
          />
        ) : (
          <div className="h-[400px] flex items-center justify-center bg-slate-950/80 rounded-2xl border border-slate-800 text-slate-500 text-sm">
            Calculating downstream compliance dependencies...
          </div>
        )}
      </div>
    </div>
  );
}
