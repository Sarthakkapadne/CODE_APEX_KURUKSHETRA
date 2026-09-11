'use client';
import React, { useState, useEffect } from 'react';
import {
  MessageSquare, ShieldAlert, CheckCircle2, UserCheck,
  Scale, Play, Pause, RotateCcw, ChevronRight, AlertOctagon, Terminal
} from 'lucide-react';
import { AdversarialDebateResult, DebateTurn } from '../lib/types';

interface AdversarialDebatePanelProps {
  debate?: AdversarialDebateResult;
}

export default function AdversarialDebatePanel({ debate }: AdversarialDebatePanelProps) {
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const turns = debate?.turns || [];

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying) return;
    if (currentRoundIndex >= turns.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentRoundIndex(prev => prev + 1);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isPlaying, currentRoundIndex, turns.length]);

  if (!debate || turns.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-500">
        Run an inspection audit to launch the Adversarial Regulatory Debate.
      </div>
    );
  }

  const visibleTurns = turns.slice(0, currentRoundIndex + 1);
  const isDebateComplete = currentRoundIndex >= turns.length - 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      
      {/* ── Debate Header & Playback Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Live Adversarial Regulatory Debate Room
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              DEMO CENTERPIECE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            <b>Core Conflict:</b> {debate.debate_topic}
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isPlaying ? 'Pause Debate' : 'Play Live'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentRoundIndex(0);
              setIsPlaying(true);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            title="Restart Debate"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Turn-by-Turn Feed ── */}
      <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
        {visibleTurns.map((turn, idx) => {
          const isInspector = turn.speaker === 'Customs Inspector';
          const isArbiter = turn.speaker === 'Consensus Arbiter';

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                isInspector
                  ? 'bg-rose-950/20 border-rose-900/50 shadow-sm'
                  : isArbiter
                  ? 'bg-emerald-950/20 border-emerald-800/60 shadow-md'
                  : 'bg-sky-950/20 border-sky-900/50 shadow-sm'
              }`}
            >
              {/* Speaker Metadata Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                    isInspector ? 'bg-rose-600 text-white' : (isArbiter ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white')
                  }`}>
                    {isInspector ? 'CI' : (isArbiter ? 'CA' : 'SA')}
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${
                      isInspector ? 'text-rose-400' : (isArbiter ? 'text-emerald-400' : 'text-sky-400')
                    }`}>
                      {turn.speaker}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2 font-medium">
                      ({turn.role_title})
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-slate-500">Round {turn.round_number}</span>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    turn.risk_level === 'high'
                      ? 'bg-rose-500/20 text-rose-300'
                      : turn.risk_level === 'medium'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {turn.risk_level} risk
                  </span>
                </div>
              </div>

              {/* Argument Text */}
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {turn.argument}
              </p>

              {/* Cited Rules Badge */}
              {turn.cited_rules && turn.cited_rules.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/60 text-[10px]">
                  <span className="text-slate-500 font-semibold flex items-center space-x-1">
                    <Scale className="w-3 h-3 text-slate-400" />
                    <span>Statutory Grounding:</span>
                  </span>
                  {turn.cited_rules.map((rule, rIdx) => (
                    <span key={rIdx} className="px-2 py-0.5 rounded bg-slate-950 font-mono text-slate-300 border border-slate-800">
                      {rule}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Consensus Arbiter Resolution Banner ── */}
      {isDebateComplete && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-600/50 space-y-2 animate-in zoom-in-95 duration-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Binding Consensus Resolution
            </span>
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            {debate.consensus_verdict}
          </p>
          
          {debate.binding_remediations && debate.binding_remediations.length > 0 && (
            <div className="pt-2 border-t border-emerald-900/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">Agreed Remediation Plan:</span>
              <ul className="space-y-1 text-xs text-slate-300">
                {debate.binding_remediations.map((rem, rIdx) => (
                  <li key={rIdx} className="flex items-start space-x-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rem}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step Next Button if paused */}
      {!isPlaying && !isDebateComplete && (
        <button
          type="button"
          onClick={() => setCurrentRoundIndex(prev => Math.min(turns.length - 1, prev + 1))}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
        >
          <span>Step to Next Argument (Round {currentRoundIndex + 2})</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

    </div>
  );
}
