import React, { useState } from 'react';
import { CopyIcon } from './icons/CopyIcon';

interface CodeBlockProps {
  fileName: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ fileName, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-lg overflow-hidden my-4">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800">
        <span className="font-mono text-sm text-slate-400">{fileName}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <CopyIcon className="h-4 w-4" />
          {copied ? 'تم النسخ!' : 'نسخ الكود'}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto">
        <code className="language-python text-slate-300">{code}</code>
      </pre>
    </div>
  );
};
