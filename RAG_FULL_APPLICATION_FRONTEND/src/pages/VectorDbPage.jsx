import React, { useState, useEffect } from 'react';
import { Database, HardDrive, Cpu, CheckCircle2, Server, RefreshCw } from 'lucide-react';
import api from '../api/client';

export default function VectorDbPage() {
  const [stats, setStats] = useState(null);
  const [indexes, setIndexes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/vectordb/stats');
      setStats(statsRes.data);
      const indexRes = await api.get('/vectordb/indexes');
      setIndexes(indexRes.data.indexes || []);
    } catch (err) {
      console.error('Vector DB stats error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Database className="w-7 h-7 text-primary-500" />
            Vector Database & Storage Inspector
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Monitor Supabase pgvector tables, local BM25 pickle indexes, Redis cache stats, and Vector DB adapters.
          </p>
        </div>
        <button onClick={fetchStats} className="btn-accent py-2 px-4 text-xs font-bold flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Primary Vector DB Card */}
          <div className="card space-y-4 border-l-4 border-l-primary-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Primary Vector Store</span>
              <span className="text-[10px] font-mono font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">
                CONNECTED
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">{stats.primary_vector_store}</div>
            <div className="space-y-1 text-xs font-mono text-gray-400 pt-2 border-t border-surface-800">
              <div className="flex justify-between"><span>Vector Dimension:</span> <strong className="text-white">{stats.vector_dimension}D</strong></div>
              <div className="flex justify-between"><span>Embedding Model:</span> <strong className="text-accent-400">{stats.embedding_model}</strong></div>
              <div className="flex justify-between"><span>Metric:</span> <strong className="text-white">{stats.distance_metric}</strong></div>
              <div className="flex justify-between"><span>Total Vectors:</span> <strong className="text-green-400 font-bold">{stats.total_vectors}</strong></div>
            </div>
          </div>

          {/* Local BM25 Index Card */}
          <div className="card space-y-4 border-l-4 border-l-accent-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lexical BM25 Index</span>
              <span className="text-[10px] font-mono font-bold bg-accent-500/10 text-accent-400 px-2 py-0.5 rounded border border-accent-500/20">
                LOCAL DISK
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">{stats.bm25_indexes.index_count} Pickle Files</div>
            <div className="space-y-1 text-xs font-mono text-gray-400 pt-2 border-t border-surface-800">
              <div className="flex justify-between"><span>Storage Directory:</span> <strong className="text-white">{stats.bm25_indexes.directory}</strong></div>
              <div className="flex justify-between"><span>Total Size:</span> <strong className="text-accent-400">{stats.bm25_indexes.total_size_kb} KB</strong></div>
              <div className="flex justify-between"><span>Algorithm:</span> <strong className="text-white">BM25Okapi ($k_1=1.5, b=0.75$)</strong></div>
            </div>
          </div>

          {/* Redis Cache Card */}
          <div className="card space-y-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cache & Incremental RAG</span>
              <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                {stats.redis_cache.status}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">Sub-50ms Cache</div>
            <div className="space-y-1 text-xs font-mono text-gray-400 pt-2 border-t border-surface-800">
              <div className="flex justify-between"><span>Eviction Policy:</span> <strong className="text-white">{stats.redis_cache.eviction_policy}</strong></div>
              <div className="flex justify-between"><span>Default TTL:</span> <strong className="text-blue-400">{stats.redis_cache.default_ttl_sec}s (24h)</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Index Files Table */}
      <div className="card space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-surface-800 pb-3">
          <HardDrive className="w-5 h-5 text-accent-400" />
          Indexed Document Files & Pickle Cache ({indexes.length})
        </h2>

        {indexes.length === 0 ? (
          <p className="text-xs font-mono text-gray-500 text-center py-6">[ NO LOCAL INDEXES CREATED YET ]</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface-900 text-gray-400 border-b border-surface-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Index File</th>
                  <th className="p-3">Document ID</th>
                  <th className="p-3">Size (KB)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800 text-gray-300">
                {indexes.map((idx, i) => (
                  <tr key={i} className="hover:bg-surface-900">
                    <td className="p-3 font-bold text-accent-400">{idx.filename}</td>
                    <td className="p-3 text-gray-400">{idx.document_id}</td>
                    <td className="p-3 text-white">{idx.size_kb} KB</td>
                    <td className="p-3">
                      <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[10px] border border-green-500/20 font-bold">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
