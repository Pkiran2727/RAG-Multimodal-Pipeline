import React from 'react';
import { Quote, ExternalLink, FileText, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QueryResult({ answer, sources }) {
  if (!answer) return null;

  return (
    <div className="mt-8 space-y-8">
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
          {answer.split('\n').map((line, i) => (
            <p key={i} className="mb-4">{line}</p>
          ))}
        </div>
      </motion.div>

      {sources && sources.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-primary-400" />
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em]">Retrieved Context Chunks</h3>
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
                        CHUNKS {i + 1}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] text-gray-500 font-bold font-mono uppercase">Relevance Score</span>
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
                      {source.source || 'Unknown Metadata'}
                    </span>
                  </div>
                  <button 
                    onClick={() => alert(`Full preview for "${source.source}" coming soon!`)}
                    className="p-2 bg-surface-800 rounded-lg hover:bg-accent-500 hover:text-white transition-all text-gray-500"
                  >
                    <ExternalLink className="w-4 h-4" />
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
