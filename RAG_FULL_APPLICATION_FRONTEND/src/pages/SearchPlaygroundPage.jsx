import React, { useState, useRef, useEffect } from 'react';
import { Search, Zap, Settings, History, Trash2, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import TechniqueSelector from '../components/TechniqueSelector';
import TechniqueCompatibilityCard from '../components/TechniqueCompatibilityCard';
import PipelineVisualizer from '../components/PipelineVisualizer';
import QueryResult from '../components/QueryResult';
import { usePipelineStore } from '../store/pipelineStore';
import api from '../api/client';

export default function SearchPlaygroundPage() {
  const [query, setQuery] = useState('');
  const [technique, setTechnique] = useState('hybrid');
  const [metadataFilters, setMetadataFilters] = useState('{}');
  const [topK, setTopK] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [cragNotice, setCragNotice] = useState(null);

  const {
    documents, selectedDoc, setSelectedDoc,
    currentAnswer, setAnswer,
    sources, setSources,
    steps, addStep, clearSteps,
    setQuerying, isQuerying,
    setActiveJob,
    history, addHistory, clearHistory
  } = usePipelineStore();

  const queryRef = useRef(null);

  useEffect(() => {
    if (queryRef.current) {
      queryRef.current.style.height = 'auto';
      queryRef.current.style.height = `${queryRef.current.scrollHeight}px`;
    }
  }, [query]);

  // Ensure selectedDoc is auto-selected if documents exist
  useEffect(() => {
    if (documents.length > 0 && (!selectedDoc || !documents.some(d => d.id === selectedDoc.id))) {
      setSelectedDoc(documents[0]);
    }
  }, [documents, selectedDoc, setSelectedDoc]);

  const handleSearch = async () => {
    if (!query || !selectedDoc) return;
    setQuerying(true);
    clearSteps();
    setAnswer('');
    setSources([]);
    setCragNotice(null);
    setShowHistory(false);
    setShowSettings(false);

    try {
      const payload = {
        query,
        document_id: selectedDoc.id,
        technique,
        top_k: topK
      };

      if (technique === 'meta') {
        try {
          payload.filters = JSON.parse(metadataFilters);
        } catch {
          alert("Invalid JSON format for Metadata Filters.");
          setQuerying(false);
          return;
        }
      }

      const { data } = await api.post('/query/search', payload);
      setAnswer(data.answer);
      setSources(data.sources);
      setActiveJob(data.job_id);

      // Check CRAG Web Fallback via Advanced CRAG service
      try {
        const cragRes = await api.post('/advanced/crag', { query, chunks: data.sources });
        if (cragRes.data.is_web_fallback) {
          setCragNotice(cragRes.data);
        }
      } catch (e) {
        console.log('CRAG check error', e);
      }

      addHistory({
        id: Date.now(),
        query,
        answer: data.answer,
        technique,
        document: selectedDoc.filename,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Search failed', error);
      addStep({ step: 'ERROR', detail: error?.response?.data?.detail || 'Search failed. Please try again.', color: '#EF4444' });
    } finally {
      setQuerying(false);
    }
  };

  const handleDeleteDoc = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document and all its embeddings from Supabase database?')) return;
    try {
      await api.delete(`/ingest/documents/${docId}`);
      const updatedDocs = documents.filter(d => d.id !== docId);
      setDocuments(updatedDocs);
      if (selectedDoc?.id === docId) {
        setSelectedDoc(updatedDocs.length > 0 ? updatedDocs[0] : null);
      }
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete document: ' + (error?.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Zap className="w-7 h-7 text-accent-500 fill-accent-500/10" />
            Multi-Strategy Search Playground
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Test and benchmark retrieval algorithms in real-time with execution step transparency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowHistory(!showHistory); setShowSettings(false); }}
            className={`p-2.5 rounded-xl transition-all border ${showHistory ? 'bg-accent-500 text-white border-accent-500' : 'bg-surface-900 text-gray-400 hover:text-white border-surface-800'}`}
            title="Session History"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setShowSettings(!showSettings); setShowHistory(false); }}
            className={`p-2.5 rounded-xl transition-all border ${showSettings ? 'bg-accent-500 text-white border-accent-500' : 'bg-surface-900 text-gray-400 hover:text-white border-surface-800'}`}
            title="Search Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Search Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Document Quick Selector Sidebar */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="card space-y-4">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span>Target Document</span>
              <span className="text-[10px] font-mono bg-surface-900 px-2 py-0.5 rounded text-gray-500">{documents.length} Available</span>
            </h2>

            {documents.length === 0 ? (
              <p className="text-xs text-gray-500 font-mono py-4 text-center">No documents indexed yet. Go to Ingestion page to upload files.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                      selectedDoc?.id === doc.id
                        ? 'bg-accent-500/10 border-accent-500 text-white shadow-glow-purple'
                        : 'bg-surface-900 border-surface-800 text-gray-400 hover:border-surface-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="truncate max-w-[170px] text-white" title={doc.filename}>{doc.filename}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-mono bg-surface-800 px-1.5 py-0.5 rounded text-accent-400 uppercase">{doc.file_type}</span>
                        <button
                          onClick={(e) => handleDeleteDoc(e, doc.id)}
                          className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete from Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Query & Strategy Input */}
        <section className="lg:col-span-8 space-y-6">
          <div className="card space-y-6">
            {/* Query Input Box */}
            <div className="relative">
              <Search className="absolute left-4 top-5 w-5 h-5 text-gray-500 z-10" />
              <textarea
                ref={queryRef}
                rows={1}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder={selectedDoc ? `Ask a question about "${selectedDoc.filename}"...` : (documents.length === 0 ? "Upload a document in the Ingestion page to start searching..." : "Select a document from the left to start...")}
                disabled={!selectedDoc || isQuerying}
                className="query-textarea"
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {query && <span className="text-[10px] text-gray-600 font-mono hidden md:block">ENTER TO SEARCH</span>}
                <button
                  onClick={handleSearch}
                  disabled={!selectedDoc || isQuerying || !query}
                  className="btn-accent py-2 px-6 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold shadow-xl transition-all"
                >
                  {isQuerying ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Technique Compatibility Card */}
            <TechniqueCompatibilityCard technique={technique} selectedDoc={selectedDoc} metadataFilters={metadataFilters} />

            {/* Strategy Grid */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 border-l-2 border-accent-500">
                Select Retrieval Strategy
              </div>
              <TechniqueSelector selected={technique} onSelect={setTechnique} />
            </div>
          </div>

          {/* CRAG Web Fallback Notice if triggered */}
          {cragNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-950/40 border-2 border-blue-500/40 rounded-2xl p-5 shadow-xl flex items-start gap-4"
            >
              <Globe className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-blue-300 uppercase">Corrective RAG (CRAG) External Web Reference</span>
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">Confidence &lt; 0.50</span>
                </div>
                <p className="text-xs text-gray-200">{cragNotice.notice}</p>
                {cragNotice.web_sources && cragNotice.web_sources.map((web, idx) => (
                  <div key={idx} className="bg-black/40 p-2.5 rounded-xl text-xs font-mono text-gray-300 mt-2 border border-blue-500/20">
                    <div className="text-blue-400 font-bold">{web.title}</div>
                    <div className="text-gray-400 text-[11px] mt-0.5">{web.snippet}</div>
                    <a href={web.url} target="_blank" rel="noreferrer" className="text-[10px] text-accent-400 underline mt-1 block">{web.url}</a>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* AI Answer & Source Chunks */}
          <QueryResult answer={currentAnswer} sources={sources} />

          {/* A-to-Z Execution Trace */}
          <PipelineVisualizer steps={steps} />
        </section>
      </div>
    </div>
  );
}
