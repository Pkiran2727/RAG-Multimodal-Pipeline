import React from 'react';
import { BookOpen, CheckCircle2, ArrowRight, Layers, Cpu, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FundamentalsPage() {
  const lifecycleSteps = [
    { title: '1. Knowledge Ingestion', desc: 'Parsing PDF, TXT, DOCX, CSV, PNG documents and tokenizing text into discrete chunks.' },
    { title: '2. Vector Indexing', desc: 'Generating 1024-dim dense embeddings using bge-m3 and indexing in Supabase pgvector & local BM25.' },
    { title: '3. Strategic Retrieval', desc: 'Executing Hybrid Search (BM25 + Vector RRF), HyDE, Re-ranking, or Agentic RAG to fetch context chunks.' },
    { title: '4. Augmented Generation', desc: 'Dispatching formatted context prompts to Tencent Hy3 (Primary) with Gemini 3.1 Flash backup.' },
    { title: '5. Quality Evaluation (RAGAS)', desc: 'Evaluating Faithfulness, Relevancy, Precision, and Recall using Gemini 3.1 Flash as LLM Judge.' }
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

      {/* Real World Applications & Examples */}
      <div className="card space-y-6 mt-8">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-surface-800 pb-3">
          <Sparkles className="w-5 h-5 text-accent-400" />
          Real-World Applications & Concrete Examples
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Application 1 */}
          <div className="bg-surface-900 border border-surface-800 p-5 rounded-xl hover:border-accent-500/30 transition-colors">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="bg-accent-500/20 text-accent-400 p-1.5 rounded-lg"><BookOpen className="w-4 h-4" /></span>
              Enterprise Internal Knowledge Base
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Companies have thousands of HR policies, IT manuals, and SOPs scattered across PDFs and Word documents. Employees waste hours searching for specific clauses.
            </p>
            <div className="bg-black/30 p-3 rounded-lg border border-surface-800">
              <p className="text-[11px] font-mono text-gray-300"><span className="text-accent-400 font-bold">User:</span> "What is the maternity leave policy for employees in the Bangalore office?"</p>
              <div className="my-2 border-l-2 border-surface-600 pl-2">
                <p className="text-[10px] text-gray-500 font-mono italic">🔍 System retrieves Chunk #402 (HR_Policy_India.pdf, page 12) & Chunk #89 (Global_Benefits.docx)</p>
              </div>
              <p className="text-[11px] font-mono text-emerald-400"><span className="font-bold">RAG LLM:</span> "According to the HR Policy India document (Page 12), employees in the Bangalore office are entitled to 26 weeks of paid maternity leave..."</p>
            </div>
          </div>

          {/* Application 2 */}
          <div className="bg-surface-900 border border-surface-800 p-5 rounded-xl hover:border-accent-500/30 transition-colors">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 p-1.5 rounded-lg"><Cpu className="w-4 h-4" /></span>
              Customer Support Automation
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Customer service bots often give generic answers. By linking the bot to a live database of product manuals and past resolved tickets via RAG, it can give highly technical, accurate answers.
            </p>
            <div className="bg-black/30 p-3 rounded-lg border border-surface-800">
              <p className="text-[11px] font-mono text-gray-300"><span className="text-blue-400 font-bold">User:</span> "My Router X200 is blinking red continuously, what do I do?"</p>
              <div className="my-2 border-l-2 border-surface-600 pl-2">
                <p className="text-[10px] text-gray-500 font-mono italic">🔍 System retrieves Chunk #12 (Troubleshooting_X200.pdf, Section 4.1)</p>
              </div>
              <p className="text-[11px] font-mono text-emerald-400"><span className="font-bold">RAG LLM:</span> "A continuous red blinking light on the X200 indicates a firmware update failure. Please hold the reset button for 15 seconds to enter recovery mode (Source: Troubleshooting Guide, Sec 4.1)."</p>
            </div>
          </div>
          
          {/* Application 3 */}
          <div className="bg-surface-900 border border-surface-800 p-5 rounded-xl hover:border-accent-500/30 transition-colors">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-400 p-1.5 rounded-lg"><CheckCircle2 className="w-4 h-4" /></span>
              Legal & Medical Contract Analysis
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Lawyers and doctors need to quickly find specific clauses in 500-page contracts or patient histories. RAG instantly surfaces the exact paragraph they need.
            </p>
            <div className="bg-black/30 p-3 rounded-lg border border-surface-800">
              <p className="text-[11px] font-mono text-gray-300"><span className="text-purple-400 font-bold">User:</span> "Are there any non-compete clauses for the software engineering role?"</p>
              <div className="my-2 border-l-2 border-surface-600 pl-2">
                <p className="text-[10px] text-gray-500 font-mono italic">🔍 System retrieves Chunk #56 (Employment_Contract_Template.pdf)</p>
              </div>
              <p className="text-[11px] font-mono text-emerald-400"><span className="font-bold">RAG LLM:</span> "Yes, Section 8.2 of the employment contract states a 12-month non-compete period within a 50-mile radius for software engineering roles."</p>
            </div>
          </div>

          {/* Application 4 */}
          <div className="bg-surface-900 border border-surface-800 p-5 rounded-xl hover:border-accent-500/30 transition-colors">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg"><RefreshCw className="w-4 h-4" /></span>
              Educational Tutoring (CBSE / NCERT)
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Students can ask a bot questions about their textbooks. The bot uses RAG to pull the exact chapter and page from the NCERT syllabus to provide the answer, preventing hallucinations.
            </p>
            <div className="bg-black/30 p-3 rounded-lg border border-surface-800">
              <p className="text-[11px] font-mono text-gray-300"><span className="text-emerald-400 font-bold">User:</span> "Explain the AAA criterion for similarity of triangles."</p>
              <div className="my-2 border-l-2 border-surface-600 pl-2">
                <p className="text-[10px] text-gray-500 font-mono italic">🔍 System retrieves Chunk #304 (Class10_Mathematics.pdf, Page 129)</p>
              </div>
              <p className="text-[11px] font-mono text-emerald-400"><span className="font-bold">RAG LLM:</span> "The AAA (Angle-Angle-Angle) criterion states that in two triangles, if corresponding angles are equal, then their corresponding sides are in the same ratio (or proportion) and hence the two triangles are similar."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
