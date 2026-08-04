import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import { Database, FileText, Trash2, Sliders, Cpu, Sparkles, AlertCircle } from 'lucide-react';
import { usePipelineStore } from '../store/pipelineStore';
import api from '../api/client';

export default function IngestionPage() {
  const { documents, setDocuments, selectedDoc, setSelectedDoc } = usePipelineStore();
  const [contextualPreview, setContextualPreview] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleDeleteDoc = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/ingest/documents/${docId}`);
      setDocuments(documents.filter(d => d.id !== docId));
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete document');
    }
  };

  const handlePreviewContextual = async () => {
    if (!selectedDoc) return;
    setPreviewLoading(true);
    try {
      const res = await api.post('/advanced/contextual', {
        doc_summary: `Document overview for ${selectedDoc.filename}. Contains core concepts, domain-specific terminology, and structured sections.`,
        chunk_text: "Sample chunk content extracted during document processing. Demonstrating Anthropic Contextual Retrieval prepending strategy."
      });
      setContextualPreview(res.data.contextual_chunk);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-surface-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <Database className="w-7 h-7 text-primary-500" />
          Knowledge Ingestion & Chunking Studio
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Upload documents, configure parsing strategies, inspect tokenization, and preview Contextual Prepending (Anthropic RAG Technique).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload & Chunk Config Section */}
        <div className="lg:col-span-7 space-y-8">
          <FileUpload />

          {/* Contextual Chunking Strategy Preview */}
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-surface-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-400" />
                <h2 className="text-base font-bold text-white">Contextual Embeddings Strategy (Anthropic RAG)</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-accent-500/10 text-accent-400 px-2.5 py-1 rounded-full border border-accent-500/20">
                Advanced Strategy
              </span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Before vector embedding, a 2-sentence document summary context is prepended to every chunk to eliminate context loss in chunk boundaries.
            </p>

            <button
              onClick={handlePreviewContextual}
              disabled={!selectedDoc || previewLoading}
              className="btn-accent py-2 px-4 text-xs font-bold disabled:opacity-40"
            >
              {previewLoading ? 'Generating Context...' : selectedDoc ? `Preview Contextual Chunking for "${selectedDoc.filename}"` : 'Select Document to Preview'}
            </button>

            {contextualPreview && (
              <div className="bg-black/50 border border-surface-700 rounded-xl p-4 font-mono text-xs text-green-300 space-y-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Pre-Processed Contextual Chunk Preview:</span>
                <pre className="whitespace-pre-wrap leading-relaxed">{contextualPreview}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Indexed Files Manager */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-surface-700 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <FileText className="w-5 h-5 text-primary-500" />
                Indexed Knowledge Base
              </h2>
              <span className="text-xs text-gray-400 font-mono bg-surface-900 px-2.5 py-1 rounded-full border border-surface-800">
                {documents.length} Files Total
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-mono text-xs">
                [ NO DOCUMENTS INDEXED ] Upload a document to start chunking.
              </div>
            ) : (
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 transform ${
                      selectedDoc?.id === doc.id
                        ? 'bg-primary-500/10 border-primary-500/50 text-white shadow-glow-green scale-[1.01]'
                        : 'bg-surface-900 border-surface-800 text-gray-400 hover:border-surface-700 hover:bg-surface-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm truncate block max-w-[200px] text-white">{doc.filename}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono opacity-80 bg-surface-700 px-1.5 py-0.5 rounded uppercase tracking-tighter text-primary-400">
                          {doc.file_type}
                        </span>
                        <button onClick={(e) => handleDeleteDoc(e, doc.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-surface-800/60 text-[11px] font-mono text-gray-400">
                      <div>Chunks: <strong className="text-white">{doc.chunk_count}</strong></div>
                      <div>Embedding: <strong className="text-accent-400">bge-m3</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
