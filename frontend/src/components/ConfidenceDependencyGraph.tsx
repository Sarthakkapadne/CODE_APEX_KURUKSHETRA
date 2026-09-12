'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
  NodeProps,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Package, Globe, Shield, FileText, CheckCircle2, AlertOctagon,
  AlertTriangle, Sparkles, X, ChevronRight, ExternalLink, Zap
} from 'lucide-react';
import { DependencyNode as DependencyNodeType, DependencyEdge as DependencyEdgeType } from '../lib/types';

// ── Custom Node UI for @xyflow/react ──
const CustomComplianceNode = ({ data }: NodeProps) => {
  const node = data.node as DependencyNodeType;
  const isSelected = data.isSelected as boolean;
  const isHighlighted = data.isHighlighted as boolean;

  // Icon mapping
  const getIcon = () => {
    switch (node.type) {
      case 'product':
        return Package;
      case 'market':
        return Globe;
      case 'regulation':
        return Shield;
      case 'document':
        return FileText;
      case 'action':
        return Zap;
      default:
        return CheckCircle2;
    }
  };

  const NodeIcon = getIcon();

  // Status-based styling
  let borderClass = 'border-slate-700/80 bg-slate-900/90 text-slate-200';
  let badgeClass = 'bg-slate-800 text-slate-400 border-slate-700';

  if (node.is_simulated) {
    borderClass = 'border-sky-500 bg-sky-950/40 text-sky-200 shadow-md shadow-sky-500/20';
    badgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
  } else if (node.status === 'verified') {
    borderClass = 'border-emerald-500/70 bg-emerald-950/30 text-emerald-100';
    badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  } else if (node.status === 'partial') {
    borderClass = 'border-amber-500/70 bg-amber-950/30 text-amber-100';
    badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  } else if (node.status === 'missing') {
    borderClass = 'border-rose-500/70 bg-rose-950/30 text-rose-100 shadow-sm shadow-rose-500/20';
    badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  } else if (node.status === 'blocked') {
    borderClass = 'border-purple-500/70 bg-purple-950/30 text-purple-100';
    badgeClass = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  }

  if (isSelected) {
    borderClass += ' ring-2 ring-sky-400 shadow-lg shadow-sky-500/30';
  } else if (isHighlighted) {
    borderClass += ' ring-2 ring-amber-400/80 shadow-md shadow-amber-500/20';
  }

  return (
    <div className={`w-64 rounded-xl border p-3.5 backdrop-blur-md transition-all duration-200 ${borderClass}`}>
      <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-2.5 !h-2.5" />

      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
            <NodeIcon className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {node.category || node.type}
          </span>
        </div>

        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${badgeClass}`}>
          {node.is_simulated ? 'SIMULATED' : node.status}
        </span>
      </div>

      <h4 className="text-xs font-bold leading-snug line-clamp-2 text-slate-100">
        {node.label}
      </h4>

      {node.statute_citation && (
        <p className="text-[10px] text-slate-400 mt-1 font-mono line-clamp-1 italic">
          {node.statute_citation}
        </p>
      )}

      {node.is_simulated && (
        <div className="mt-2 pt-1.5 border-t border-sky-500/20 flex items-center justify-between text-[10px] text-sky-300 font-medium">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" /> Sim Resolution
          </span>
          <span className="font-bold">UNBLOCKED</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-2.5 !h-2.5" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomComplianceNode,
};

interface ConfidenceDependencyGraphProps {
  nodes: DependencyNodeType[];
  edges: DependencyEdgeType[];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  onSimulateToggle?: (nodeId: string) => void;
  simulatedNodeIds?: string[];
}

export default function ConfidenceDependencyGraph({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId,
  onSelectNode,
  onSimulateToggle,
  simulatedNodeIds = [],
}: ConfidenceDependencyGraphProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(selectedNodeId || null);

  const activeSelectedId = selectedNodeId !== undefined ? selectedNodeId : internalSelectedId;

  // Compute downstream nodes of the selected node
  const downstreamNodeIds = useMemo(() => {
    if (!activeSelectedId) return new Set<string>();
    const downstream = new Set<string>();
    const queue = [activeSelectedId];
    const edgeMap: Record<string, string[]> = {};
    initialEdges.forEach((e) => {
      edgeMap[e.source] = edgeMap[e.source] || [];
      edgeMap[e.source].push(e.target);
    });

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const targets = edgeMap[curr] || [];
      targets.forEach((tgt) => {
        if (!downstream.has(tgt)) {
          downstream.add(tgt);
          queue.push(tgt);
        }
      });
    }
    return downstream;
  }, [activeSelectedId, initialEdges]);

  // Convert to ReactFlow Nodes
  const rfNodes: Node[] = useMemo(() => {
    return initialNodes.map((n) => ({
      id: n.id,
      type: 'custom',
      position: n.position || { x: 0, y: 0 },
      data: {
        node: n,
        isSelected: n.id === activeSelectedId,
        isHighlighted: downstreamNodeIds.has(n.id),
      },
    }));
  }, [initialNodes, activeSelectedId, downstreamNodeIds]);

  // Convert to ReactFlow Edges
  const rfEdges: Edge[] = useMemo(() => {
    return initialEdges.map((e) => {
      const isHighlighted =
        (e.source === activeSelectedId && downstreamNodeIds.has(e.target)) ||
        (downstreamNodeIds.has(e.source) && downstreamNodeIds.has(e.target));

      let strokeColor = '#475569'; // slate-600
      if (isHighlighted) {
        strokeColor = '#f59e0b'; // glowing amber
      } else if (e.status === 'blocked') {
        strokeColor = '#f43f5e'; // rose-500
      } else if (e.status === 'warning') {
        strokeColor = '#eab308'; // yellow-500
      } else if (e.status === 'healthy') {
        strokeColor = '#10b981'; // emerald-500
      }

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.animated || isHighlighted,
        style: {
          stroke: strokeColor,
          strokeWidth: isHighlighted ? 3 : 1.5,
          opacity: activeSelectedId ? (isHighlighted || e.source === activeSelectedId ? 1 : 0.3) : 0.8,
        },
        labelStyle: {
          fill: '#94a3b8',
          fontSize: 10,
          fontFamily: 'monospace',
        },
        labelBgStyle: {
          fill: '#0f172a',
          fillOpacity: 0.85,
        },
      };
    });
  }, [initialEdges, activeSelectedId, downstreamNodeIds]);

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, , onEdgesChange] = useEdgesState(rfEdges);

  const selectedNode = useMemo(() => {
    return initialNodes.find((n) => n.id === activeSelectedId) || null;
  }, [initialNodes, activeSelectedId]);

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
      const nextId = node.id === activeSelectedId ? null : node.id;
      setInternalSelectedId(nextId);
      if (onSelectNode) onSelectNode(nextId);
    },
    [activeSelectedId, onSelectNode]
  );

  const handleCloseDrawer = () => {
    setInternalSelectedId(null);
    if (onSelectNode) onSelectNode(null);
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/90 shadow-2xl">
      {/* React Flow Canvas */}
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        className="bg-slate-950"
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 [&>button]:!border-slate-800 [&>button]:!fill-slate-300" />
        <MiniMap
          nodeColor={(n) => {
            const nodeData = n.data?.node as DependencyNodeType;
            if (!nodeData) return '#334155';
            if (nodeData.is_simulated) return '#0ea5e9';
            if (nodeData.status === 'verified') return '#10b981';
            if (nodeData.status === 'partial') return '#f59e0b';
            if (nodeData.status === 'missing') return '#f43f5e';
            if (nodeData.status === 'blocked') return '#a855f7';
            return '#64748b';
          }}
          className="!bg-slate-900/90 !border-slate-800 rounded-xl"
        />
      </ReactFlow>

      {/* Top Left Legend Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-800/80 px-3.5 py-2 rounded-xl backdrop-blur-md shadow-md text-xs">
        <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">Status:</span>
        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Verified
        </span>
        <span className="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Partial
        </span>
        <span className="flex items-center gap-1 text-[11px] text-rose-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> Missing
        </span>
        <span className="flex items-center gap-1 text-[11px] text-purple-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> Blocked
        </span>
        <span className="flex items-center gap-1 text-[11px] text-sky-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" /> Simulated
        </span>
      </div>

      {/* Slide-in Impact Drawer on Selected Node */}
      {selectedNode && (
        <div className="absolute right-4 top-4 bottom-4 w-80 md:w-96 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md z-20 flex flex-col justify-between overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Node Inspection · {selectedNode.type}
                </span>
                <h3 className="text-sm font-bold text-slate-100 mt-0.5">
                  {selectedNode.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Category Pills */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border uppercase ${
                selectedNode.is_simulated
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : selectedNode.status === 'verified'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : selectedNode.status === 'partial'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : selectedNode.status === 'missing'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
              }`}>
                Status: {selectedNode.is_simulated ? 'Simulated Verified' : selectedNode.status}
              </span>
              <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                {selectedNode.category}
              </span>
            </div>

            {/* Description / Reasoning */}
            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/70 text-xs">
              <span className="font-semibold text-slate-300">Compliance Context:</span>
              <p className="text-slate-400 leading-relaxed">
                {selectedNode.description || 'Essential compliance node within the cross-border import pipeline.'}
              </p>
            </div>

            {/* Statute Citation */}
            {selectedNode.statute_citation && (
              <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/70 text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-400" /> Statutory Citation:
                </span>
                <p className="text-slate-300 font-mono text-[11px]">
                  {selectedNode.statute_citation}
                </p>
              </div>
            )}

            {/* Downstream Impact Reach */}
            <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/70 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Downstream Impact:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {downstreamNodeIds.size} node(s) impacted
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {downstreamNodeIds.size > 0
                  ? 'Upstream issues here propagate downstream, penalizing requirements and market clearance.'
                  : 'Terminal node or independent verification entity.'}
              </p>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            {onSimulateToggle && (selectedNode.status === 'missing' || selectedNode.status === 'partial' || selectedNode.is_simulated) && (
              <button
                type="button"
                onClick={() => onSimulateToggle(selectedNode.id)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border shadow-md ${
                  selectedNode.is_simulated
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white border-sky-500/50 shadow-sky-500/20'
                }`}
              >
                <Sparkles className="w-4 h-4 text-sky-300" />
                {selectedNode.is_simulated ? 'Revert Simulation' : 'Simulate Resolving Item'}
              </button>
            )}

            <button
              type="button"
              onClick={handleCloseDrawer}
              className="w-full py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 transition-colors"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
