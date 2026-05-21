import React, { useState, useEffect, useRef } from 'react';
import { Search, Boxes, Database, Zap, Settings, History, Lock, User, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import FileUpload from './components/FileUpload';
import TechniqueSelector from './components/TechniqueSelector';
import PipelineVisualizer from './components/PipelineVisualizer';
import QueryResult from './components/QueryResult';
import { usePipelineStore } from './store/pipelineStore';
import { useAuthStore } from './store/authStore';
import api from './api/client';

function App() {
  const { isAuthenticated, login, logout } = useAuthStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [query, setQuery] = useState('');
  const [technique, setTechnique] = useState('hybrid');
  const [activeJob, setActiveJob] = useState(null);
  
  const { 
    documents, setDocuments, 
    selectedDoc, setSelectedDoc,
    currentAnswer, setAnswer,
    sources, setSources,
    steps, addStep, clearSteps,
    setQuerying, isQuerying
  } = usePipelineStore();

  const ws = useRef(null);

  // Load documents
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/ingest/documents').then(res => setDocuments(res.data));
    }
  }, [isAuthenticated]);

  // WebSocket Connection for Pipeline Trace
  useEffect(() => {
    if (activeJob && isAuthenticated) {
      const token = sessionStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
      const wsProtocol = apiBase.startsWith('https') ? 'wss' : 'ws';
      const wsHost = apiBase.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}://${wsHost}/ws/pipeline/${activeJob}?token=${token}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onmessage = (event) => {
        const step = JSON.parse(event.data);
        addStep(step);
        if (step.step === 'DONE') {
          // Refresh docs if it was an ingestion
          api.get('/ingest/documents').then(res => setDocuments(res.data));
        }
      };

      return () => {
        if (ws.current) ws.current.close();
      };
    }
  }, [activeJob, isAuthenticated]);

  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const queryRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (queryRef.current) {
      queryRef.current.style.height = 'auto';
      queryRef.current.style.height = `${queryRef.current.scrollHeight}px`;
    }
  }, [query]);

  const handleSearch = async () => {
    if (!query || !selectedDoc) return;
    setQuerying(true);
    clearSteps();
    setAnswer('');
    setSources([]);
    setShowHistory(false);
    setShowSettings(false);
    
    try {
      const { data } = await api.post('/query/search', {
        query,
        document_id: selectedDoc.id,
        technique
      });
      setAnswer(data.answer);
      setSources(data.sources);
      setActiveJob(data.job_id);
    } catch (error) {
      console.error('Search failed', error);
      addStep({ step: 'ERROR', detail: 'Search failed. Please try again.', color: '#EF4444' });
    } finally {
      setQuerying(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md card space-y-8 p-10 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="inline-block p-4 bg-accent-500/10 rounded-full mb-4 ring-1 ring-accent-500/20">
              <Boxes className="w-12 h-12 text-accent-500" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">RAG Pipeline</h1>
            <p className="text-gray-400">Production Blueprint V3</p>
          </div>
          
          <form className="space-y-4" onSubmit={handleAuth}>
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-gray-500">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input 
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full input-field pl-10" placeholder="admin" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-gray-500">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input 
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full input-field pl-10" placeholder="••••••••" 
                />
              </div>
            </div>
            <button className="w-full btn-accent font-bold py-3 mt-4 hover:scale-[1.02] active:scale-[0.98]">Login to Pipeline</button>
          </form>
          
          <div className="text-center pt-4 border-t border-surface-700">
            <p className="text-xs text-gray-500 font-mono tracking-widest">DEFAULT: admin / admin123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900 text-gray-100 pb-20 selection:bg-accent-500/30">
      {/* Header */}
      <header className="border-b border-surface-800 bg-surface-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Boxes className="w-8 h-8 text-primary-500" />
            <h1 className="text-2xl font-bold tracking-tighter">
              RAG<span className="text-accent-500">PIPELINE</span>
            </h1>
            <span className="bg-primary-500/10 text-primary-500 text-[10px] font-bold px-2 py-0.5 rounded border border-primary-500/20">V3.0</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span>Supabase Connected</span>
            </div>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-white transition-colors">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar - Ingestion & Docs */}
        <aside className="lg:col-span-4 space-y-8">
          <FileUpload />
          
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-surface-700 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Database className="w-5 h-5 text-primary-500" />
                Indexed Files
              </h2>
              <span className="text-xs text-gray-500 font-mono bg-surface-900 px-2 py-1 rounded">{documents.length} Total</span>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 transform ${
                    selectedDoc?.id === doc.id 
                    ? 'bg-primary-500/10 border-primary-500/50 text-white shadow-glow-green scale-[1.02]' 
                    : 'bg-surface-900 border-surface-800 text-gray-400 hover:border-surface-700 hover:bg-surface-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold truncate block max-w-[180px]">{doc.filename}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono opacity-70 bg-surface-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">{doc.file_type}</span>
                      <button onClick={(e) => handleDeleteDoc(e, doc.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{doc.chunk_count} Chunks</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${doc.status === 'done' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content - Query & Trace */}
        <section className="lg:col-span-8 space-y-8">
          <div className="card space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-500 to-transparent opacity-30" />
            
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Zap className="w-6 h-6 text-accent-500 fill-accent-500/10" />
                RAG Pipeline Interface
              </h2>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setShowHistory(!showHistory); setShowSettings(false); }} 
                  className={`p-2 rounded-lg transition-all border ${showHistory ? 'bg-accent-500 text-white border-accent-500' : 'bg-surface-900 text-gray-500 hover:text-white border-surface-700'}`}
                >
                  <History className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => { setShowSettings(!showSettings); setShowHistory(false); }} 
                  className={`p-2 rounded-lg transition-all border ${showSettings ? 'bg-accent-500 text-white border-accent-500' : 'bg-surface-900 text-gray-500 hover:text-white border-surface-700'}`}
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showHistory && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-surface-900 rounded-xl p-4 border border-surface-700 text-sm text-gray-500 text-center font-mono">
                [ EMPTY HISTORY ] No previous queries found.
              </motion.div>
            )}

            {showSettings && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-surface-900 rounded-xl p-6 border border-surface-700 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-surface-800 pb-2">Pipeline Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-600 font-bold uppercase">Retrieval K</label>
                    <input type="number" defaultValue={5} className="w-full bg-surface-800 border border-surface-700 rounded px-2 py-1 text-xs outline-none focus:border-accent-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-600 font-bold uppercase">LLM Temp</label>
                    <input type="number" defaultValue={0.1} step={0.1} className="w-full bg-surface-800 border border-surface-700 rounded px-2 py-1 text-xs outline-none focus:border-accent-500" />
                  </div>
                </div>
              </motion.div>
            )}

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
                placeholder={selectedDoc ? `Ask about "${selectedDoc.filename}"...` : "Select a document to begin..."}
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
                  {isQuerying ? 'Working...' : 'Search'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 border-l-2 border-accent-500 ml-1">
                Select Retrieval Strategy
              </div>
              <TechniqueSelector selected={technique} onSelect={setTechnique} />
            </div>
          </div>

          <QueryResult answer={currentAnswer} sources={sources} />
          
          <PipelineVisualizer steps={steps} />
        </section>
      </main>
    </div>
  );
}

export default App;
