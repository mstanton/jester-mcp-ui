import React from 'react';

interface EditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label: string;
  language?: string;
  readOnly?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  label,
  readOnly = false 
}) => {
  return (
    <div className="flex flex-col h-full bg-surface rounded-lg border border-slate-700 overflow-hidden shadow-sm">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{label}</span>
        {readOnly && <span className="text-xs text-slate-500">Read Only</span>}
      </div>
      <textarea
        className={`flex-1 w-full bg-[#1e293b] p-4 font-mono text-sm text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-slate-600 ${readOnly ? 'opacity-90' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        readOnly={readOnly}
      />
    </div>
  );
};