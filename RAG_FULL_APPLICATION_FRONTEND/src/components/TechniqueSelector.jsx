import React from 'react';
import { Zap, Search, Repeat, Filter, Layers, Cpu, Database } from 'lucide-react';

const techniques = [
  { id: 'hybrid', name: 'Hybrid Search', desc: 'BM25 + Vector', color: 'border-green-500', icon: Search },
  { id: 'rerank', name: 'Re-ranking', desc: 'Cross-Encoder', color: 'border-accent-500', icon: Repeat },
  { id: 'hyde', name: 'Query Expansion', desc: 'HyDE + Multi-Query', color: 'border-accent-600', icon: Zap },
  { id: 'meta', name: 'Metadata Filter', desc: 'SQL + Vector', color: 'border-orange-500', icon: Filter },
  { id: 'colbert', name: 'ColBERT', desc: 'Token MaxSim', color: 'border-red-500', icon: Layers },
  { id: 'agentic', name: 'Agentic RAG', desc: 'Qwen3 Agent', color: 'border-primary-600', icon: Cpu },
  { id: 'cache', name: 'Cache', desc: 'Redis Query Cache', color: 'border-gray-500', icon: Database },
];

export default function TechniqueSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
      {techniques.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`relative group p-5 rounded-2xl border-2 text-left transition-all duration-300 ${
            selected === t.id 
            ? `${t.color} bg-surface-800 shadow-xl scale-[1.03] ring-4 ring-opacity-10 ring-white` 
            : 'border-surface-800 bg-surface-900/50 text-gray-500 hover:border-surface-700 hover:bg-surface-800'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <t.icon className={`w-5 h-5 ${selected === t.id ? 'text-white' : 'text-gray-600'}`} />
            <h3 className={`font-bold text-sm tracking-tight ${selected === t.id ? 'text-white' : 'text-gray-400'}`}>
              {t.name}
            </h3>
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
