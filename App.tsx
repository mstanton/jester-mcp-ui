import React, { useState, useRef } from 'react';
import { Play, RotateCcw, Copy, Check, Terminal, Code2, FileCode2, Sparkles, Split, ArrowLeft } from 'lucide-react';
import { Editor } from './components/Editor';
import { Settings } from './components/Settings';
import * as ollama from './services/ollamaService';
import { Tab } from './types';

const INITIAL_SOURCE = `// Example: mathUtils.js
export function add(a, b) {
  return a - b; // Intentional bug
}

export function multiply(a, b) {
  return a + b; // Intentional bug
}
`;

const INITIAL_TEST = `// Example: mathUtils.test.js
import { add, multiply } from './mathUtils';

describe('Math Utils', () => {
  test('adds two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });

  test('multiplies two numbers correctly', () => {
    expect(multiply(4, 5)).toBe(20);
  });
});
`;

const INITIAL_ERROR = `FAIL src/mathUtils.test.js
  ● Math Utils › adds two numbers correctly
    Expected: 5
    Received: -1

  ● Math Utils › multiplies two numbers correctly
    Expected: 20
    Received: 9
`;

function App() {
  const [endpoint, setEndpoint] = useState('http://localhost:11434');
  const [model, setModel] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [autoApply, setAutoApply] = useState(false);
  
  const [sourceCode, setSourceCode] = useState(INITIAL_SOURCE);
  const [testCode, setTestCode] = useState(INITIAL_TEST);
  const [errorLog, setErrorLog] = useState(INITIAL_ERROR);
  const [fixResult, setFixResult] = useState('');
  
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SOURCE);
  const [isFixing, setIsFixing] = useState(false);
  const [copied, setCopied] = useState(false);

  const resultEndRef = useRef<HTMLDivElement>(null);

  const applyFix = (textToParse: string = fixResult) => {
    // Regex to find content within triple backticks
    // We look for all code blocks and take the last one, as models often 
    // provide explanation first and the complete fixed code last.
    const codeBlockRegex = /```(?:[\w\d]*)\n([\s\S]*?)```/g;
    const matches = [...textToParse.matchAll(codeBlockRegex)];

    if (matches.length > 0) {
      const code = matches[matches.length - 1][1];
      setSourceCode(code.trim());
      setActiveTab(Tab.SOURCE);
    } else {
      if (!autoApply) {
          alert("No markdown code block found in the result to apply.");
      }
    }
  };

  const handleFix = async () => {
    if (!isConnected || !model) {
      alert("Please connect to Ollama and select a model first.");
      return;
    }

    setIsFixing(true);
    setFixResult('');
    setActiveTab(Tab.RESULT);

    let accumulatedResponse = '';

    try {
      await ollama.generateFix(
        endpoint,
        model,
        sourceCode,
        testCode,
        errorLog,
        (chunk) => {
          accumulatedResponse += chunk;
          setFixResult(prev => prev + chunk);
          // Auto scroll to bottom
          if (resultEndRef.current) {
            resultEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }
      );

      // Auto-apply logic
      if (autoApply) {
        // Short delay to ensure user sees the completion visually before switching
        setTimeout(() => applyFix(accumulatedResponse), 500);
      }

    } catch (e) {
      setFixResult(prev => prev + "\n\nError generating fix. Please check your Ollama connection.");
    } finally {
      setIsFixing(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(fixResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-slate-100 font-sans overflow-hidden">
      <Settings 
        endpoint={endpoint}
        setEndpoint={setEndpoint}
        selectedModel={model}
        setSelectedModel={setModel}
        isConnected={isConnected}
        setIsConnected={setIsConnected}
        autoApply={autoApply}
        setAutoApply={setAutoApply}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar / Tabs (Desktop: Left, Mobile: Top) */}
        <div className="w-16 sm:w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4 z-10">
          <TabButton 
            active={activeTab === Tab.SOURCE} 
            onClick={() => setActiveTab(Tab.SOURCE)} 
            icon={<Code2 size={24} />} 
            label="Source" 
          />
          <TabButton 
            active={activeTab === Tab.TEST} 
            onClick={() => setActiveTab(Tab.TEST)} 
            icon={<FileCode2 size={24} />} 
            label="Tests" 
          />
          <TabButton 
            active={activeTab === Tab.ERROR} 
            onClick={() => setActiveTab(Tab.ERROR)} 
            icon={<Terminal size={24} />} 
            label="Errors" 
            alert={!!errorLog && activeTab !== Tab.ERROR}
          />
          <div className="h-px w-8 bg-slate-700 my-2" />
          <TabButton 
            active={activeTab === Tab.RESULT} 
            onClick={() => setActiveTab(Tab.RESULT)} 
            icon={<Sparkles size={24} />} 
            label="Fix" 
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50">
          
          <div className="flex-1 p-4 overflow-hidden relative">
            
            {/* Tab: Source Code */}
            <div className={`h-full ${activeTab === Tab.SOURCE ? 'block' : 'hidden'}`}>
              <Editor 
                label="Source Code (To be Fixed)"
                value={sourceCode}
                onChange={setSourceCode}
                placeholder="// Paste your source code here..."
              />
            </div>

            {/* Tab: Test Code */}
            <div className={`h-full ${activeTab === Tab.TEST ? 'block' : 'hidden'}`}>
              <Editor 
                label="Test Suite (Reference)"
                value={testCode}
                onChange={setTestCode}
                placeholder="// Paste your test file here..."
              />
            </div>

            {/* Tab: Error Log */}
            <div className={`h-full ${activeTab === Tab.ERROR ? 'block' : 'hidden'}`}>
              <Editor 
                label="Error Output (Terminal)"
                value={errorLog}
                onChange={setErrorLog}
                placeholder="Paste the failure output from your test runner..."
              />
            </div>

            {/* Tab: Result */}
            <div className={`h-full flex flex-col bg-surface rounded-lg border border-slate-700 overflow-hidden shadow-lg ${activeTab === Tab.RESULT ? 'block' : 'hidden'}`}>
              <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center h-12">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} /> Jester Analysis
                </span>
                <div className="flex gap-2">
                  {fixResult && (
                    <>
                      <button 
                        onClick={() => applyFix()}
                        className="text-xs flex items-center gap-1 px-2 py-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                        title="Apply fix to Source Code"
                      >
                        <ArrowLeft size={14} />
                        Apply
                      </button>
                      <div className="w-px h-4 bg-slate-700 mx-1 self-center" />
                      <button 
                        onClick={copyResult}
                        className="text-xs flex items-center gap-1 px-2 py-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6 font-mono text-sm leading-relaxed text-slate-300">
                {!fixResult && !isFixing && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                      <Play size={32} className="ml-1 opacity-50" />
                    </div>
                    <p>Ready to analyze. Click "Run Jester Fix" below.</p>
                  </div>
                )}
                {isFixing && !fixResult && (
                  <div className="h-full flex flex-col items-center justify-center text-indigo-400 gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                    <p>Analyzing code and errors...</p>
                  </div>
                )}
                <div className="whitespace-pre-wrap markdown-body">
                  {fixResult}
                </div>
                <div ref={resultEndRef} />
              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="bg-surface border-t border-slate-800 p-4 flex justify-between items-center shrink-0 z-20">
            <div className="text-xs text-slate-500 hidden sm:block">
              {isConnected ? `Connected to ${endpoint}` : 'Not Connected'}
            </div>
            <div className="flex gap-3 ml-auto">
                <button 
                  onClick={() => {
                    setSourceCode('');
                    setTestCode('');
                    setErrorLog('');
                    setFixResult('');
                  }}
                  className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
                <button 
                  onClick={handleFix}
                  disabled={isFixing || !isConnected}
                  className={`px-6 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-all shadow-lg
                    ${isFixing || !isConnected 
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/25'
                    }`}
                >
                  {isFixing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Fixing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Run Jester Fix
                    </>
                  )}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TabButton = ({ active, onClick, icon, label, alert }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, alert?: boolean }) => (
  <button 
    onClick={onClick}
    className={`group relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all w-14
      ${active ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}
    `}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
    {active && <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full" />}
    {alert && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
  </button>
);

export default App;