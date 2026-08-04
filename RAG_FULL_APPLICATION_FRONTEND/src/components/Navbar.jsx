import React from 'react';
import { Boxes, UploadCloud, Search, Network, Database, BookOpen, Award, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onLogout }) {
  const tabs = [
    { id: 'ingest', label: 'Ingestion & Chunking', icon: UploadCloud },
    { id: 'search', label: 'Search Playground', icon: Search },
    { id: 'advanced', label: 'Advanced RAG Suite', icon: Network },
    { id: 'vectordb', label: 'Vector DB Inspector', icon: Database },
    { id: 'fundamentals', label: 'RAG Fundamentals', icon: BookOpen },
    { id: 'eval', label: 'RAGAS Testing Lab', icon: Award },
  ];

  return (
    <header className="border-b border-surface-800 bg-surface-900/90 backdrop-blur-md sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('search')}>
          <div className="p-2 bg-accent-500/10 rounded-xl border border-accent-500/20 shadow-glow-purple">
            <Boxes className="w-7 h-7 text-accent-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              RAG<span className="text-accent-500">PLATFORM</span>
            </h1>
            <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Enterprise Edition v3.0</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-surface-950/60 p-1.5 rounded-2xl border border-surface-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.location.hash = tab.id;
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20 scale-[1.02]'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-surface-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status Badges */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 font-mono bg-surface-950 px-3 py-1.5 rounded-xl border border-surface-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span>Supabase Connected</span>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-surface-800 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-2 bg-surface-950 border-t border-surface-800 gap-2 custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.location.hash = tab.id;
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                isActive ? 'bg-accent-500 text-white' : 'bg-surface-900 text-gray-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
