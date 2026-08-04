import React from 'react';
import { CheckCircle2, CircleDashed, AlertCircle, Code, Layers, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PipelineVisualizer({ steps }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between border-b border-surface-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <h2 className="text-lg font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent-400" />
            A-to-Z Execution Trace & Index Log
          </h2>
        </div>
        <span className="text-xs font-mono font-bold bg-surface-800 text-gray-400 px-2.5 py-1 rounded-full border border-surface-700">
          {steps.length} Steps Recorded
        </span>
      </div>
      
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-surface-900/80 border border-surface-800 hover:border-surface-700 transition-all shadow-sm"
              style={{ borderLeftColor: step.color || '#8b5cf6', borderLeftWidth: '4px' }}
            >
              <div className="mt-1 flex items-center justify-center shrink-0">
                {step.status === 'done' || step.step === 'RETRIEVAL_COMPLETE' || step.step === 'DONE' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : step.status === 'error' || step.step === 'ERROR' ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CircleDashed className="w-5 h-5 animate-spin text-accent-400" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-surface-800 border border-surface-700" style={{ color: step.color || '#8b5cf6' }}>
                      STEP {i + 1}: {step.step}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs text-gray-200 leading-relaxed font-medium">
                  {step.detail}
                </p>

                {step.metadata && Object.keys(step.metadata).length > 0 && (
                  <div className="mt-2 bg-black/40 border border-surface-800 rounded-xl p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 uppercase font-bold border-b border-surface-800 pb-1 mb-2">
                      <Code className="w-3 h-3 text-accent-400" />
                      <span>Execution Parameters & Storage Metadata</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                      {Object.entries(step.metadata).map(([key, val]) => (
                        <div key={key} className="flex items-start gap-2 bg-surface-900/60 p-1.5 rounded border border-surface-800/40">
                          <span className="text-accent-400 font-semibold shrink-0">{key}:</span>
                          <span className="text-gray-300 truncate font-mono">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

