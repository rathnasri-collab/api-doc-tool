'use client';

import { useState } from 'react';

interface ApiTesterProps {
  method: string;
  url: string;
  accessToken: string;
  requestBody: string;
  onClose: () => void;
  onCurlUpdate: (curl: string, response: string) => void;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
}

function buildCurl(method: string, url: string, accessToken: string, body: string): string {
  let curl = `curl --location '${url}' \\\n`;
  curl += `--header 'Authorization: Bearer ${accessToken}' \\\n`;
  curl += `--header 'Content-Type: application/json'`;
  if (body?.trim() && method !== 'GET') {
    const cleanBody = body.replace(/\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
    try {
      const formatted = JSON.stringify(JSON.parse(cleanBody), null, 4);
      curl += ` \\\n--data-raw '${formatted}'`;
    } catch {
      curl += ` \\\n--data-raw '${body}'`;
    }
  }
  return curl;
}

function getMethodColor(m: string) {
  switch (m) {
    case 'GET': return 'bg-green-500';
    case 'POST': return 'bg-blue-500';
    case 'PUT': return 'bg-orange-500';
    case 'PATCH': return 'bg-amber-500';
    case 'DELETE': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

export default function ApiTester({ method, url, accessToken, requestBody, onClose, onCurlUpdate }: ApiTesterProps) {
  const [maximized, setMaximized] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [editUrl, setEditUrl] = useState(url);
  const [editBody, setEditBody] = useState(requestBody);
  const [editToken, setEditToken] = useState(accessToken);
  const [reqTab, setReqTab] = useState<'body' | 'headers' | 'auth' | 'curl'>('body');
  const [resTab, setResTab] = useState<'body' | 'headers'>('body');
  const [copied, setCopied] = useState(false);

  const curl = buildCurl(method, editUrl, editToken, editBody);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendRequest = async () => {
    setLoading(true);
    setResponse(null);

    let cleanBody = editBody;
    try {
      cleanBody = editBody.replace(/\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
      JSON.parse(cleanBody);
    } catch {
      cleanBody = editBody;
    }

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: editUrl,
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${editToken}`,
          },
          body: cleanBody,
        }),
      });
      const data: ApiResponse = await res.json();
      setResponse(data);
      setResTab('body');
      onCurlUpdate(curl, data.body);
    } catch {
      setResponse({ status: 0, statusText: 'Error', headers: {}, body: 'Failed to send request', duration: 0 });
    } finally {
      setLoading(false);
    }
  };

  const statusColor = response
    ? response.status >= 200 && response.status < 300
      ? 'bg-green-100 text-green-700'
      : response.status >= 400
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700'
    : '';

  const reqTabs: { id: typeof reqTab; label: string }[] = [
    { id: 'body', label: 'Body' },
    { id: 'headers', label: 'Headers' },
    { id: 'auth', label: 'Auth' },
    { id: 'curl', label: 'Curl' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className={`bg-white flex flex-col transition-all duration-200 ${
          maximized ? 'w-full h-full' : 'w-full max-w-5xl rounded-t-2xl'
        }`}
        style={maximized ? {} : { height: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar — like Postman */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 shrink-0" style={maximized ? {} : { borderRadius: '16px 16px 0 0' }}>
          <span className="text-sm font-semibold text-white">API Tester</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setMaximized(!maximized)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 text-xs">{maximized ? '◱' : '◳'}</button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400">✕</button>
          </div>
        </div>

        {/* URL Bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          <span className={`px-3 py-1.5 rounded-md text-xs font-bold text-white ${getMethodColor(method)}`}>{method}</span>
          <input
            type="text"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
            className="flex-1 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg outline-none focus:border-indigo-400 bg-gray-50"
          />
          <button
            onClick={sendRequest}
            disabled={loading || !editUrl}
            className="px-6 py-2 text-sm font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        {/* Main content: request tabs + response */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Request Section */}
          <div className="flex flex-col border-b border-gray-200" style={{ height: response ? '45%' : '100%' }}>
            {/* Request Tabs */}
            <div className="flex items-center border-b border-gray-100 px-4 shrink-0">
              {reqTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setReqTab(tab.id)}
                  className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                    reqTab === tab.id
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Request Tab Content */}
            <div className="flex-1 overflow-auto p-4">
              {reqTab === 'body' && method !== 'GET' && (
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full h-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg outline-none focus:border-indigo-400 resize-none bg-gray-50"
                />
              )}
              {reqTab === 'body' && method === 'GET' && (
                <p className="text-sm text-gray-400">GET requests don&apos;t have a body.</p>
              )}

              {reqTab === 'headers' && (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-500 px-1">
                    <span>Key</span><span>Value</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="px-3 py-2 bg-gray-50 rounded-md text-xs text-gray-600 font-mono">Content-Type</div>
                    <div className="px-3 py-2 bg-gray-50 rounded-md text-xs text-gray-600 font-mono">application/json</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="px-3 py-2 bg-gray-50 rounded-md text-xs text-gray-600 font-mono">Authorization</div>
                    <div className="px-3 py-2 bg-gray-50 rounded-md text-xs text-gray-600 font-mono truncate">Bearer {editToken.substring(0, 20)}...</div>
                  </div>
                </div>
              )}

              {reqTab === 'auth' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Bearer Token</p>
                  <input
                    type="text"
                    value={editToken}
                    onChange={(e) => setEditToken(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg outline-none focus:border-indigo-400 bg-gray-50"
                  />
                </div>
              )}

              {reqTab === 'curl' && (
                <div className="relative">
                  <button
                    onClick={() => handleCopy(curl)}
                    className="absolute top-2 right-2 px-3 py-1 text-xs font-medium rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <pre className="text-xs font-mono bg-gray-900 text-gray-300 rounded-lg p-4 overflow-auto whitespace-pre-wrap" style={{ minHeight: '100px' }}>
                    {curl}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Response Section */}
          {response && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Response header bar */}
              <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
                <span className="text-xs font-semibold text-gray-600">Response</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor}`}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-xs text-gray-400">{response.duration}ms</span>
                <span className="text-xs text-gray-400">{response.body.length} bytes</span>

                {/* Response sub-tabs */}
                <div className="flex items-center gap-1 ml-auto">
                  {(['body', 'headers'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setResTab(tab)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        resTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'body' ? 'Body' : `Headers (${Object.keys(response.headers).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response content */}
              <div className="flex-1 overflow-auto p-4">
                {resTab === 'body' ? (
                  <pre className="text-xs font-mono bg-gray-900 text-green-400 rounded-lg p-4 overflow-auto whitespace-pre-wrap h-full">
                    {response.body}
                  </pre>
                ) : (
                  <div className="space-y-1 text-xs">
                    {Object.entries(response.headers).map(([key, val]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-indigo-600 font-medium w-44 shrink-0">{key}</span>
                        <span className="text-gray-600 break-all">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
