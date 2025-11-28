import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { OllamaModel } from '../types';
import * as ollama from '../services/ollamaService';

interface SettingsProps {
  endpoint: string;
  setEndpoint: (val: string) => void;
  selectedModel: string;
  setSelectedModel: (val: string) => void;
  isConnected: boolean;
  setIsConnected: (val: boolean) => void;
  autoApply: boolean;
  setAutoApply: (val: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  endpoint,
  setEndpoint,
  selectedModel,
  setSelectedModel,
  isConnected,
  setIsConnected,
  autoApply,
  setAutoApply
}) => {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const refreshConnection = async () => {
    setIsLoading(true);
    const connected = await ollama.checkConnection(endpoint);
    setIsConnected(connected);
    if (connected) {
      const fetchedModels = await ollama.fetchModels(endpoint);
      setModels(fetchedModels);
      if (!selectedModel && fetchedModels.length > 0) {
        // Prefer 'code' optimized models or 'llama3' if available
        const preferred = fetchedModels.find(m => m.name.includes('code') || m.name.includes('qwen') || m.name.includes('deepseek')) || fetchedModels[0];
        setSelectedModel(preferred.name);
      }
    } else {
      setModels([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-surface border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <span className="font-bold text-lg">J</span>
            </div>
          <h1 className="text-lg font-bold text-slate-100">Ollama Jester Studio</h1>
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${isConnected ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
            {isConnected ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">Model:</span>
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                {models.map(m => (
                  <option key={m.digest} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 transition-colors ${showConfig ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
            title="Configuration"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="bg-slate-900 border-t border-slate-800 p-4 shadow-inner">
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Connection Settings */}
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Connection</h3>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-medium text-slate-400 mb-1">Ollama Endpoint</label>
                            <input 
                                type="text" 
                                value={endpoint}
                                onChange={(e) => setEndpoint(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
                                placeholder="http://localhost:11434"
                            />
                        </div>
                        <button 
                            onClick={refreshConnection}
                            disabled={isLoading}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 h-[38px]"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                            {isLoading ? 'Connecting...' : 'Test Connection'}
                        </button>
                    </div>
                </div>

                {/* Workflow Settings */}
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workflow</h3>
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Auto-apply Fix</span>
                                <span className="text-xs text-slate-500">Automatically update Source Code when generation completes</span>
                            </div>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={autoApply}
                                    onChange={(e) => setAutoApply(e.target.checked)}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${autoApply ? 'bg-indigo-600' : 'bg-slate-700'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${autoApply ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
                
                {!isConnected && (
                     <div className="bg-yellow-900/20 border border-yellow-800/50 p-3 rounded text-yellow-200 text-xs flex items-start gap-2">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold mb-1">CORS Configuration Required</p>
                            <p>To use this web app with your local Ollama, you must launch Ollama with the following environment variable:</p>
                            <code className="block bg-black/30 p-1.5 mt-1 rounded font-mono">OLLAMA_ORIGINS="*" ollama serve</code>
                        </div>
                     </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};