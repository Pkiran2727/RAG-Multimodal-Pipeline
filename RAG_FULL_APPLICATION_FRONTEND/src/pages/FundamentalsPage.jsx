import React from 'react';
import { BookOpen, CheckCircle2, ArrowRight, Layers, Cpu, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FundamentalsPage() {
  const lifecycleSteps = [
    { title: '1. Knowledge Ingestion', desc: 'Parsing PDF, TXT, DOCX, CSV, PNG documents and tokenizing text into discrete chunks.' },
    { title: '2. Vector Indexing', desc: 'Generating 1024-dim dense embeddings using bge-m3 and indexing in Supabase pgvector & local BM25.' },
    { title: '3. Strategic Retrieval', desc: 'Executing Hybrid Search (BM25 + Vector RRF), HyDE, Re-ranking, or Agentic RAG to fetch context chunks.' },
    { title: '4. Augmented Generation', desc: 'Dispatching formatted context prompts to Qwen (Primary) or GLM-4.7-Flash (Backup Failover).' },
    { title: '5. Quality Evaluation (RAGAS)', desc: 'Evaluating Faithfulness, Relevancy, Precision, and Recall using GLM-4.7-Flash as LLM Judge.' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="border-b border-surface-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-accent-400" />
          RAG Fundamentals & Architecture Masterclass
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          A comprehensive guide to Retrieval-Augmented Generation concepts, lifecycle, RAG vs Fine-tuning trade-offs, and architecture blueprints.
        </p>
      </div>

      {/* RAG Lifecycle Stepper */}
      <div className="card space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-surface-800 pb-3">
          <Layers className="w-5 h-5 text-accent-400" />
          The 5-Stage RAG Lifecycle
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {lifecycleSteps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-surface-900 border border-surface-800 p-4 rounded-2xl space-y-2 relative group hover:border-accent-500/50 transition-all"
            >
              <span className="text-[10px] font-mono font-bold bg-accent-500/10 text-accent-400 px-2 py-0.5 rounded uppercase">
                STAGE 0{idx + 1}
              </span>
              <h3 className="text-xs font-bold text-white leading-tight">{step.title}</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* RAG vs Fine-tuning Comparison Table */}
      <div className="card space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-surface-800 pb-3">
          <Cpu className="w-5 h-5 text-primary-400" />
          RAG vs Fine-Tuning: Architectural Trade-Off Matrix
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface-900 text-gray-400 border-b border-surface-800 uppercase text-[10px]">
              <tr>
                <th className="p-3">Evaluation Dimension</th>
                <th className="p-3 text-accent-400">RAG (Retrieval-Augmented)</th>
                <th className="p-3 text-purple-400">Fine-Tuning (Model Training)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800 text-gray-300">
              <tr>
                <td className="p-3 font-bold text-white">Dynamic Knowledge Update</td>
                <td className="p-3 text-green-400 font-bold">Instant (Real-time document upload)</td>
                <td className="p-3 text-red-400">Slow (Requires full retraining run)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-white">Hallucination Mitigation</td>
                <td className="p-3 text-green-400 font-bold">High (Grounded by retrieved chunks)</td>
                <td className="p-3 text-yellow-400">Moderate (Prone to memorization drift)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-white">Traceability & Citations</td>
                <td className="p-3 text-green-400 font-bold">100% (Verifiable chunk citations)</td>
                <td className="p-3 text-red-400">Black Box (No source citations)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-white">Computation Cost</td>
                <td className="p-3 text-green-400 font-bold">Low (Embedding vector search)</td>
                <td className="p-3 text-red-400">High (Expensive GPU training clusters)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-white">Best Use Case</td>
                <td className="p-3 text-white">Knowledge Bases, Docs, Enterprise Search</td>
                <td className="p-3 text-white">Form, Style, Tone & Niche Code Adaptation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Benefits vs Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-950/30 border border-emerald-500/30 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Key Benefits of Production RAG
          </h3>
          <ul className="space-y-2 text-xs text-gray-300 font-mono">
            <li className="flex items-start gap-2">✓ <strong>Instant Information Refresh</strong>: Add or delete files without re-training models.</li>
            <li className="flex items-start gap-2">✓ <strong>Auditability</strong>: Every response includes exact source text chunks and similarity scores.</li>
            <li className="flex items-start gap-2">✓ <strong>Data Privacy & Security</strong>: Fine-grained metadata filters and role authorization.</li>
          </ul>
        </div>

        <div className="bg-amber-950/30 border border-amber-500/30 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Challenges & Mitigations
          </h3>
          <ul className="space-y-2 text-xs text-gray-300 font-mono">
            <li className="flex items-start gap-2">⚠️ <strong>Chunking Loss</strong>: Solved via Anthropic Contextual Retrieval prepending.</li>
            <li className="flex items-start gap-2">⚠️ <strong>Keyword vs Vector Discrepancy</strong>: Solved via RRF Hybrid Search (BM25 + Dense Vector).</li>
            <li className="flex items-start gap-2">⚠️ <strong>Low Quality Chunks</strong>: Solved via Corrective RAG (CRAG) web fallback.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
