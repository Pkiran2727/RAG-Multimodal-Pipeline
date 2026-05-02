import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Loader2, Settings } from 'lucide-react';
import api from '../api/client';
import { usePipelineStore } from '../store/pipelineStore';

const STRATEGIES = [
  { value: 'fixed', label: 'Fixed Size' },
  { value: 'token', label: 'Token Based' },
  { value: 'sentence', label: 'Sentence Split' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'recursive', label: 'Recursive' },
  { value: 'sliding_window', label: 'Sliding Window' },
];

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const { setIngesting, isIngesting } = usePipelineStore();
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  // Chunking controls
  const [strategy, setStrategy] = useState('fixed');
  const [chunkSize, setChunkSize] = useState(512);
  const [overlap, setOverlap] = useState(64);

  const handleUpload = async () => {
    if (!file) return;
    setIngesting(true);
    setStatus('loading');
    setErrorMsg('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chunk_size', chunkSize);
    formData.append('overlap', overlap);
    formData.append('strategy', strategy);
    
    try {
      const { data } = await api.post('/ingest/upload', formData);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setFile(null);
      }, 3000);
    } catch (error) {
      console.error('Upload failed', error);
      setErrorMsg(error?.response?.data?.detail || 'Upload failed');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary-500" />
        Document Ingestion
      </h2>

      {/* File Drop Zone */}
      <div className="border-2 border-dashed border-surface-700 rounded-xl p-6 flex flex-col items-center justify-center space-y-3 hover:border-primary-500 transition-colors cursor-pointer group">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".txt,.pdf,.md,.docx,.csv,.json,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
          {file ? (
            <FileText className="w-10 h-10 text-primary-500" />
          ) : (
            <Upload className="w-10 h-10 text-gray-500 group-hover:text-primary-400 transition-colors" />
          )}
          <span className="mt-2 text-sm text-gray-400">
            {file ? file.name : 'Click to select a file'}
          </span>
          <span className="text-[10px] text-gray-600 mt-1">
            PDF, TXT, MD, DOCX, CSV, JSON, PNG, JPG
          </span>
        </label>
      </div>

      {/* Chunking Controls */}
      <div className="space-y-3 pt-2 border-t border-surface-700">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
          <Settings className="w-3 h-3" />
          Chunking Configuration
        </div>

        {/* Strategy Selector */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Strategy</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full input-field text-sm"
          >
            {STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Size & Overlap */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Chunk Size</label>
            <input
              type="number"
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value) || 256)}
              min={64}
              max={4096}
              className="w-full input-field text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Overlap</label>
            <input
              type="number"
              value={overlap}
              onChange={(e) => setOverlap(parseInt(e.target.value) || 0)}
              min={0}
              max={512}
              className="w-full input-field text-sm"
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-surface-900 rounded-lg p-3 text-[11px] font-mono text-gray-500 space-y-1">
          <div>Strategy: <span className="text-primary-400">{strategy}</span></div>
          <div>Size: <span className="text-accent-400">{chunkSize}</span> chars | Overlap: <span className="text-accent-400">{overlap}</span> chars</div>
        </div>
      </div>

      {/* Error Message */}
      {status === 'error' && (
        <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          {errorMsg}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || isIngesting}
        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <Upload className="w-5 h-5" />
        )}
        {status === 'loading' ? 'Processing...' : status === 'success' ? 'Uploaded!' : 'Upload & Start Pipeline'}
      </button>
    </div>
  );
}
