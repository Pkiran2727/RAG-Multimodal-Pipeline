import React from 'react';
import { CheckCircle2, CircleDashed, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PipelineVisualizer({ steps }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-8 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <h2 className="text-xl font-bold uppercase tracking-wider text-gray-400">Pipeline Trace</h2>
      </div>
      
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-4 p-4 card"
              style={{ borderLeftColor: step.color, borderLeftWidth: '4px' }}
            >
              <div className="mt-1">
                {step.status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CircleDashed className="w-5 h-5 animate-spin text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold" style={{ color: step.color }}>{step.step}</span>
                  <span className="text-xs text-gray-500">{new Date(step.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">{step.detail}</p>
                {step.metadata && Object.keys(step.metadata).length > 0 && (
                  <pre className="text-[10px] bg-black/30 p-2 mt-2 rounded overflow-x-auto text-gray-500">
                    {JSON.stringify(step.metadata, null, 2)}
                  </pre>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
