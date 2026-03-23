'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';

interface HeaderEntry {
  key: string;
  value: string;
  enabled: boolean;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

function getMethodColor(method: string) {
  switch (method) {
    case 'GET': return 'text-green-600';
    case 'POST': return 'text-blue-600';
    case 'PUT': return 'text-orange-600';
    case 'PATCH': return 'text-amber-600';
    case 'DELETE': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
  if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-800';
  if (status >= 400 && status < 500) return 'bg-amber-100 text-amber-800';
  if (status >= 500) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

export default function PostmanPage() {
  const [method, setMethod] = useState<string>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<HeaderEntry[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: 'Authorization', value: '', enabled: true },
  ]);
  const [body, setBody] = useState('');
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'auth'>('headers');
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ method: string; url: string; status: number }[]>([]);

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled', val: string | boolean) => {
    const updated = [...headers];
    updated[index] = { ...updated[index], [field]: val };
    setHeaders(updated);
  };

  const sendRequest = async () => {
    if (!url) return;
    setLoading(true);
    setResponse(null);

    const headerObj: Record<string, string> = {};
    headers.filter((h) => h.enabled && h.key).forEach((h) => {
      headerObj[h.key] = h.value;
    });

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method,
          headers: headerObj,
          body: body || undefined,
        }),
      });
      const data: ApiResponse = await res.json();
      setResponse(data);
      setHistory((prev) => [{ method, url, status: data.status }, ...prev.slice(0, 19)]);
    } catch {
      setResponse({ status: 0, statusText: 'Network Error', headers: {}, body: 'Failed to send request', duration: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (entry: { method: string; url: string }) => {
    setMethod(entry.method);
    setUrl(entry.url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Header title="API Tester" description="Quick API testing — like Postman, built in." />

      <div className="flex gap-6">
        {/* Main Panel */}
        <div className="flex-1 space-y-4">
          {/* URL Bar */}
          <div className="flex gap-2 bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={`px-3 py-2 text-sm font-bold rounded-lg bg-gray-50 border border-gray-200 outline-none ${getMethodColor(method)}`}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
              placeholder="https://api.example.com/v1/resource"
              className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
            />
            <button
              onClick={sendRequest}
              disabled={loading || !url}
              className="px-6 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>

          {/* Request Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200">
              {(['headers', 'body', 'auth'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'headers' ? `Headers (${headers.filter(h => h.enabled && h.key).length})` : tab === 'body' ? 'Body' : 'Auth'}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === 'headers' && (
                <div className="space-y-2">
                  {headers.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={h.enabled}
                        onChange={(e) => updateHeader(i, 'enabled', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <input
                        type="text"
                        value={h.key}
                        onChange={(e) => updateHeader(i, 'key', e.target.value)}
                        placeholder="Header name"
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:border-indigo-400"
                      />
                      <input
                        type="text"
                        value={h.value}
                        onChange={(e) => updateHeader(i, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:border-indigo-400"
                      />
                      <button onClick={() => removeHeader(i)} className="text-gray-400 hover:text-red-500 text-sm px-1">✕</button>
                    </div>
                  ))}
                  <button onClick={addHeader} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                    + Add Header
                  </button>
                </div>
              )}

              {activeTab === 'body' && (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{\n  "key": "value"\n}'
                  rows={10}
                  className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg outline-none focus:border-indigo-400 resize-y"
                />
              )}

              {activeTab === 'auth' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Set the Authorization header with a Bearer token:</p>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-gray-600 font-medium w-20">Bearer</span>
                    <input
                      type="text"
                      value={headers.find((h) => h.key === 'Authorization')?.value.replace('Bearer ', '') || ''}
                      onChange={(e) => {
                        const token = e.target.value;
                        const idx = headers.findIndex((h) => h.key === 'Authorization');
                        if (idx >= 0) {
                          updateHeader(idx, 'value', token ? `Bearer ${token}` : '');
                        } else {
                          setHeaders([...headers, { key: 'Authorization', value: `Bearer ${token}`, enabled: true }]);
                        }
                      }}
                      placeholder="pat-na1-xxxx-xxxx-xxxx"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Response */}
          {response && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Response status bar */}
              <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(response.status)}`}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-xs text-gray-500">{response.duration}ms</span>
                <span className="text-xs text-gray-500">{response.body.length} bytes</span>
              </div>

              {/* Response tabs */}
              <div className="flex border-b border-gray-200">
                {(['body', 'headers'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setResponseTab(tab)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      responseTab === tab
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'body' ? 'Body' : `Headers (${Object.keys(response.headers).length})`}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {responseTab === 'body' && (
                  <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-words max-h-96 overflow-auto bg-gray-50 rounded-lg p-4">
                    {response.body}
                  </pre>
                )}
                {responseTab === 'headers' && (
                  <div className="space-y-1">
                    {Object.entries(response.headers).map(([key, val]) => (
                      <div key={key} className="flex text-sm">
                        <span className="text-indigo-600 font-medium w-48 shrink-0">{key}</span>
                        <span className="text-gray-700 break-all">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        {history.length > 0 && (
          <div className="w-56 shrink-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">History</h3>
            <div className="space-y-1">
              {history.map((entry, i) => (
                <button
                  key={i}
                  onClick={() => loadFromHistory(entry)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  <span className={`font-bold ${getMethodColor(entry.method)}`}>{entry.method}</span>
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${getStatusColor(entry.status)}`}>{entry.status}</span>
                  <p className="text-gray-500 truncate mt-0.5">{entry.url}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
