import React, { useState, useEffect, useRef } from 'react';
import { Boxes, User, Lock } from 'lucide-react';
import Navbar from './components/Navbar';
import IngestionPage from './pages/IngestionPage';
import SearchPlaygroundPage from './pages/SearchPlaygroundPage';
import AdvancedRagPage from './pages/AdvancedRagPage';
import VectorDbPage from './pages/VectorDbPage';
import FundamentalsPage from './pages/FundamentalsPage';
import RagasEvalPage from './pages/RagasEvalPage';

import { usePipelineStore } from './store/pipelineStore';
import { useAuthStore } from './store/authStore';
import api from './api/client';

function App() {
  const { isAuthenticated, login, logout } = useAuthStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [activeTab, setActiveTab] = useState('search');

  const { setDocuments, activeJob, addStep } = usePipelineStore();
  const ws = useRef(null);

  // Sync hash routing
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['ingest', 'search', 'advanced', 'vectordb', 'fundamentals', 'eval'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Load documents
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/ingest/documents').then(res => setDocuments(res.data)).catch(console.error);
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
          api.get('/ingest/documents').then(res => setDocuments(res.data)).catch(console.error);
        }
      };

      return () => {
        if (ws.current) ws.current.close();
      };
    }
  }, [activeJob, isAuthenticated]);

  const handleAuth = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md card space-y-8 p-10 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="inline-block p-4 bg-accent-500/10 rounded-full mb-4 ring-1 ring-accent-500/20">
              <Boxes className="w-12 h-12 text-accent-500" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">RAG PLATFORM</h1>
            <p className="text-gray-400 font-mono text-xs">Enterprise A-to-Z RAG Ecosystem v3.0</p>
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
            <button className="w-full btn-accent font-bold py-3 mt-4 hover:scale-[1.02] active:scale-[0.98]">
              Login to Platform
            </button>
          </form>

          <div className="text-center pt-4 border-t border-surface-700">
            <p className="text-xs text-gray-500 font-mono tracking-widest">DEFAULT CREDENTIALS: admin / admin123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 text-gray-100 pb-20 selection:bg-accent-500/30 font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />

      <main className="transition-all duration-300">
        {activeTab === 'ingest' && <IngestionPage />}
        {activeTab === 'search' && <SearchPlaygroundPage />}
        {activeTab === 'advanced' && <AdvancedRagPage />}
        {activeTab === 'vectordb' && <VectorDbPage />}
        {activeTab === 'fundamentals' && <FundamentalsPage />}
        {activeTab === 'eval' && <RagasEvalPage />}
      </main>
    </div>
  );
}

export default App;

