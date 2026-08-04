import React from 'react';
import { Info, AlertTriangle, CheckCircle, Database, FileCode, Cpu, Layers, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const TECHNIQUE_DETAILS = {
  hybrid: {
    name: "Hybrid Search (BM25 + Vector)",
    badge: "Optimal Standard",
    badgeColor: "bg-green-500/10 text-green-400 border-green-500/20",
    description: "Combines BM25 lexical keyword matching with bge-m3 dense vector cosine search using Reciprocal Rank Fusion (RRF).",
    storageUsed: "Local BM25 Pickle (`data/bm25_indexes/*.pkl`) + Supabase `chunks` table",
    multimodal: "Works on PDFs, DOCX, and Text documents.",
    prerequisites: "Auto-rebuilds BM25 index on missing local file via Supabase recovery."
  },
  rerank: {
    name: "Cross-Encoder Re-ranking",
    badge: "High Precision",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    description: "Fetches candidate chunks via vector search and scores them using the `ms-marco-MiniLM-L-6-v2` cross-encoder model for deep semantic relevance.",
    storageUsed: "Supabase pgvector + Local HuggingFace Cross-Encoder model cache",
    multimodal: "Ideal for detailed technical documents, legal PDFs, and dense text.",
    prerequisites: "Requires local cross-encoder model load (~90MB)."
  },
  hyde: {
    name: "HyDE / Query Expansion",
    badge: "Vague Query Master",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    description: "Uses LLM to generate a hypothetical answer and 3 query variations, embedding all of them to fetch relevant context even if keywords don't match.",
    storageUsed: "LLM Generation + Supabase pgvector ANN search",
    multimodal: "Best for short, ambiguous, or conceptually abstract questions.",
    prerequisites: "Makes 2 initial LLM calls before final answer generation."
  },
  meta: {
    name: "Metadata Filtering",
    badge: "Requires Filters",
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    description: "Applies exact SQL key-value filtering on JSON metadata (e.g. `page`, `author`, `category`) combined with pgvector similarity.",
    storageUsed: "Supabase JSONB columns (`metadata->>key`) + pgvector index",
    multimodal: "Works best on structured multi-page PDFs or categorized reports.",
    prerequisites: "Must provide valid JSON in Metadata Filters setting (e.g. `{\"page\": 1}`)."
  },
  colbert: {
    name: "ColBERT (Late Interaction)",
    badge: "Token-Level MaxSim",
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
    description: "Performs token-level late-interaction matching (MaxSim) comparing query token embeddings against passage token embeddings.",
    storageUsed: "Token-level vector representations",
    multimodal: "Great for domain-specific terminology and code documents.",
    prerequisites: "Calculates MaxSim across text token matrices."
  },
  agentic: {
    name: "Agentic RAG",
    badge: "Multimodal Capable",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    description: "Autonomous reasoning agent that dynamically determines whether to search, reformulate, or query vision models for image content.",
    storageUsed: "Agent Tool Router + Supabase + Qwen-VL Vision endpoint",
    multimodal: "Supports Images, OCR scanned PDFs, DOCX, and Text files.",
    prerequisites: "Uses tool-calling loops to resolve multi-hop queries."
  },
  cache: {
    name: "Cache & Incremental RAG",
    badge: "Fastest Sub-50ms",
    badgeColor: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    description: "Checks Redis query cache for exact or high-similarity query hits. Returns cached response instantly if available.",
    storageUsed: "Redis Cache (`redis://`) + Underlying RAG fallback",
    multimodal: "Works on all document types.",
    prerequisites: "Populates Redis cache automatically on repeated queries."
  },
  ragas: {
    name: "RAGAS Quality Evaluation",
    badge: "GLM-4.7-Flash Judge",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    description: "Executes RAG pipeline and uses GLM-4.7-Flash as LLM Judge to evaluate Faithfulness, Relevancy, Precision, and Recall scores.",
    storageUsed: "Full RAG pipeline + GLM-4.7-Flash API (`api.z.ai`)",
    multimodal: "Evaluates answer quality on any document query.",
    prerequisites: "Uses GLM-4.7-Flash API Key for automated evaluation scoring."
  }
};

export default function TechniqueCompatibilityCard({ technique, selectedDoc, metadataFilters }) {
  const details = TECHNIQUE_DETAILS[technique] || TECHNIQUE_DETAILS.hybrid;
  const isMeta = technique === 'meta';
  
  let isMetaInvalid = false;
  if (isMeta) {
    try {
      const parsed = JSON.parse(metadataFilters || '{}');
      if (Object.keys(parsed).length === 0) isMetaInvalid = true;
    } catch {
      isMetaInvalid = true;
    }
  }

  const fileType = (selectedDoc?.file_type || 'PDF').toUpperCase();
  const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP'].includes(fileType);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-900/90 border border-surface-700/80 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-400" />
          <h3 className="text-sm font-bold text-gray-200 tracking-wide">{details.name}</h3>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${details.badgeColor}`}>
          {details.badge}
        </span>
      </div>

      <p className="text-xs text-gray-300 leading-relaxed">
        {details.description}
      </p>

      {/* Warnings & Recommendations */}
      {isMetaInvalid && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Metadata Filter Warning:</span> No valid metadata filter JSON specified. Please enter filter JSON (e.g. <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200 font-mono text-[10px]">{"{\"page\": 1}"}</code>) in Pipeline Settings, or switch to <strong>Hybrid Search</strong>.
          </div>
        </div>
      )}

      {isImage && (
        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Multimodal Image File Detected:</span> Selected document is an image file (<code>{fileType}</code>). <strong>Agentic RAG</strong> or Vision pipeline is recommended for visual element extraction.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] font-mono text-gray-400 border-t border-surface-800/60">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-primary-400 shrink-0" />
          <span className="truncate"><strong>Storage:</strong> {details.storageUsed}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-accent-400 shrink-0" />
          <span className="truncate"><strong>Document Capability:</strong> {details.multimodal}</span>
        </div>
      </div>
    </motion.div>
  );
}
