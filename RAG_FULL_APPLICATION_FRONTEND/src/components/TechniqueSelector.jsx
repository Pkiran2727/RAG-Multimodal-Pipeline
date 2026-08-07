import React from 'react';
import { Zap, Search, Repeat, Filter, Layers, Cpu, Database, Award } from 'lucide-react';

const techniques = [
  { id: 'hybrid', name: 'Hybrid Search', desc: 'BM25 + Vector', color: 'border-green-500', icon: Search, badge: 'Optimal' },
  { id: 'rerank', name: 'Re-ranking', desc: 'Cross-Encoder', color: 'border-purple-500', icon: Repeat, badge: 'Precision' },
  { id: 'hyde', name: 'Query Expansion', desc: 'HyDE + Multi-Query', color: 'border-indigo-600', icon: Zap, badge: 'HyDE' },
  { id: 'meta', name: 'Metadata Filter', desc: 'SQL + Vector', color: 'border-orange-500', icon: Filter, badge: 'Requires Filters' },
  { id: 'colbert', name: 'ColBERT', desc: 'Token MaxSim', color: 'border-red-500', icon: Layers, badge: 'MaxSim' },
  { id: 'agentic', name: 'Agentic RAG', desc: 'Multimodal Reasoning', color: 'border-blue-600', icon: Cpu, badge: 'Multimodal' },
  { id: 'cache', name: 'Cache', desc: 'Redis Query Cache', color: 'border-gray-500', icon: Database, badge: 'Sub-50ms' },
  { id: 'ragas', name: 'RAGAS Eval', desc: 'Gemini 3.1 Flash Judge', color: 'border-emerald-500', icon: Award, badge: 'RAGAS Score' },
];

export default function TechniqueSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {techniques.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`relative group p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
            selected === t.id 
            ? `${t.color} bg-surface-800 shadow-xl scale-[1.02] ring-4 ring-opacity-10 ring-white` 
            : 'border-surface-800 bg-surface-900/50 text-gray-500 hover:border-surface-700 hover:bg-surface-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <t.icon className={`w-4 h-4 ${selected === t.id ? 'text-white' : 'text-gray-500'}`} />
              <h3 className={`font-bold text-xs tracking-tight ${selected === t.id ? 'text-white' : 'text-gray-400'}`}>
                {t.name}
              </h3>
            </div>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${selected === t.id ? 'bg-white/20 text-white' : 'bg-surface-800 text-gray-500'}`}>
              {t.badge}
            </span>
          </div>
          <p className={`text-[11px] leading-relaxed ${selected === t.id ? 'text-gray-300' : 'text-gray-600'}`}>
            {t.desc}
          </p>
          
          {selected === t.id && (
            <div className="absolute top-2 right-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

