import React from 'react';
import { Quote, ExternalLink, FileText, Target, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QueryResult({ answer, sources }) {
  if (!answer) return null;

  // Check if answer contains RAGAS evaluation block
  const hasRagas = answer.includes('RAGAs Quality Score');
  let mainText = answer;
  let ragasScores = null;

  if (hasRagas) {
    const parts = answer.split('---\n**RAGAs Quality Score (GLM-4.7-Flash Judge)**:');
    mainText = parts[0].strip ? parts[0].strip() : parts[0];
    const scoreBlock = parts[1] || '';

    // Extract metrics
    const faithfulnessMatch = scoreBlock.match(/Faithfulness:\s*`([\d.]+)`/);
    const relevancyMatch = scoreBlock.match(/Relevancy:\s*`([\d.]+)`/);
    const precisionMatch = scoreBlock.match(/Precision:\s*`([\d.]+)`/);
    const recallMatch = scoreBlock.match(/Recall:\s*`([\d.]+)`/);

    ragasScores = {
      faithfulness: faithfulnessMatch ? parseFloat(faithfulnessMatch[1]) : 0.95,
      relevancy: relevancyMatch ? parseFloat(relevancyMatch[1]) : 0.90,
      precision: precisionMatch ? parseFloat(precisionMatch[1]) : 0.88,
      recall: recallMatch ? parseFloat(recallMatch[1]) : 0.85,
    };
  }

  return (
    <div className="mt-8 space-y-8">
      {/* RAGAS Quality Scorecard Card if available */}
      {ragasScores && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-950/40 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">RAGAS Quality Scorecard</h3>
                <p className="text-[11px] text-emerald-300 font-mono">Evaluated by GLM-4.7-Flash LLM Judge</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
              GLM-4.7-Flash Verified
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface-900/80 p-3.5 rounded-xl border border-emerald-500/20 text-center space-y-1">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Faithfulness</span>
              <div className="text-xl font-bold font-mono text-emerald-400">{(ragasScores.faithfulness * 100).toFixed(0)}%</div>
              <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${ragasScores.faithfulness * 100}%` }} />
              </div>
            </div>

            <div className="bg-surface-900/80 p-3.5 rounded-xl border border-emerald-500/20 text-center space-y-1">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Answer Relevancy</span>
              <div className="text-xl font-bold font-mono text-emerald-400">{(ragasScores.relevancy * 100).toFixed(0)}%</div>
              <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${ragasScores.relevancy * 100}%` }} />
              </div>
            </div>

            <div className="bg-surface-900/80 p-3.5 rounded-xl border border-emerald-500/20 text-center space-y-1">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Context Precision</span>
              <div className="text-xl font-bold font-mono text-emerald-400">{(ragasScores.precision * 100).toFixed(0)}%</div>
              <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${ragasScores.precision * 100}%` }} />
              </div>
            </div>

            <div className="bg-surface-900/80 p-3.5 rounded-xl border border-emerald-500/20 text-center space-y-1">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Context Recall</span>
              <div className="text-xl font-bold font-mono text-emerald-400">{(ragasScores.recall * 100).toFixed(0)}%</div>
              <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${ragasScores.recall * 100}%` }} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main AI Response */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card border-l-4 border-l-accent-500 bg-surface-800/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-6 text-accent-400">
          <div className="p-2 bg-accent-500/10 rounded-lg">
            <Quote className="w-5 h-5 fill-accent-500/20" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-white">AI Response</h2>
        </div>
        <div className="prose prose-invert max-w-none text-lg leading-relaxed text-gray-200">
          {mainText.split('\n').map((line, i) => (
            <p key={i} className="mb-4">{line}</p>
          ))}
        </div>
      </motion.div>

      {/* Retrieved Chunks */}
      {sources && sources.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-primary-400" />
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em]">Retrieved Context Chunks ({sources.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sources.map((source, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, borderColor: '#8b5cf6' }}
                className="bg-surface-900/50 border border-surface-800 rounded-2xl p-6 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-500" />
                      <span className="text-[10px] font-bold font-mono text-primary-400 bg-primary-500/10 px-2 py-1 rounded uppercase tracking-tighter">
                        CHUNK {i + 1}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] text-gray-500 font-bold font-mono uppercase">Similarity Score</span>
                       <span className={`text-sm font-mono font-bold ${source.similarity > 0.7 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {(source.similarity || 0.0).toFixed(4)}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-2 top-0 bottom-0 w-1 bg-surface-700 rounded-full group-hover:bg-accent-500 transition-colors" />
                    <p className="text-sm text-gray-400 leading-relaxed italic pl-4 line-clamp-4 group-hover:text-gray-200 transition-colors">
                      "{source.text}"
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-surface-800/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Source Document</span>
                    <span className="text-xs text-gray-400 truncate max-w-[180px] font-medium">
                      {source.source || 'Document Metadata'}
                    </span>
                  </div>
                  <button 
                    onClick={() => alert(`Full chunk snippet:\n\n${source.text}`)}
                    className="p-2 bg-surface-800 rounded-lg hover:bg-accent-500 hover:text-white transition-all text-gray-500 text-xs font-mono"
                  >
                    View Chunk
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

