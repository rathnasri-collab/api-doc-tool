'use client';

import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = 'json' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let formatted = code;
  if (language === 'json' && code.trim()) {
    try {
      formatted = JSON.stringify(JSON.parse(code), null, 2);
    } catch {
      // keep original
    }
  }

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
        <span className="text-xs text-gray-400 uppercase">{language}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-900 p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-gray-100 font-mono whitespace-pre">{formatted}</code>
      </pre>
    </div>
  );
}
