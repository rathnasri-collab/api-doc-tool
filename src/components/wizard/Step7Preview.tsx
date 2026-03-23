'use client';

import { useState, useMemo } from 'react';
import { WizardState } from '@/lib/types';
import { SUB_APIS } from '@/lib/constants';
import DocRenderer from '@/components/docs/DocRenderer';
import ApiTester from '@/components/ui/ApiTester';
import Button from '@/components/ui/Button';

interface Props {
  state: WizardState;
  onSave: () => void;
  saving: boolean;
  onGoogleDoc: () => void;
  onUpdateFromTest?: (updates: { response?: string; curl?: string }) => void;
}

export default function Step7Preview({ state, onSave, saving, onGoogleDoc, onUpdateFromTest }: Props) {
  const [showTester, setShowTester] = useState(false);
  const [testingSubApiId, setTestingSubApiId] = useState<string | null>(null);

  // Build the list of testable APIs from subApiDetailsMap
  const testableApis = useMemo(() => {
    const entries: { id: string; label: string; method: string; endpoint: string; requestBody: string }[] = [];
    const selectedSubApis = state.subApi ? state.subApi.split(',') : [];
    const categories = state.category ? state.category.split(',') : [];

    if (state.subApiDetailsMap && Object.keys(state.subApiDetailsMap).length > 0) {
      for (const saId of selectedSubApis) {
        if (saId === 'conflict') {
          // Expand to conflict-update-by-id and conflict-update-by-email
          const conflictKeys = ['conflict-update-by-id', 'conflict-update-by-email'];
          const conflictLabels: Record<string, string> = {
            'conflict-update-by-id': '409 Conflict - Update by Contact ID',
            'conflict-update-by-email': '409 Conflict - Update by Email',
          };
          for (const ck of conflictKeys) {
            const detail = state.subApiDetailsMap[ck];
            if (detail) {
              entries.push({ id: ck, label: conflictLabels[ck], method: detail.method, endpoint: detail.endpoint, requestBody: detail.requestBody });
            }
          }
          continue;
        }
        if (saId === 'event') {
          // Collect all event-N entries
          const eventKeys = Object.keys(state.subApiDetailsMap)
            .filter((k) => k.startsWith('event-'))
            .sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
          for (const ek of eventKeys) {
            const detail = state.subApiDetailsMap[ek];
            const eventNote = detail.notes || '';
            const eventLabel = eventNote.startsWith('Event: ') ? eventNote.slice(7) : ek;
            entries.push({ id: ek, label: eventLabel + ' Event', method: detail.method, endpoint: detail.endpoint, requestBody: detail.requestBody });
          }
          // Fallback
          if (eventKeys.length === 0 && state.subApiDetailsMap[saId]) {
            entries.push({ id: saId, label: 'Event', method: state.subApiDetailsMap[saId].method, endpoint: state.subApiDetailsMap[saId].endpoint, requestBody: state.subApiDetailsMap[saId].requestBody });
          }
          continue;
        }
        const detail = state.subApiDetailsMap[saId];
        if (!detail) continue;
        let label = saId;
        for (const cat of categories) {
          const found = (SUB_APIS[cat] || []).find((s) => s.id === saId);
          if (found) { label = found.label; break; }
        }
        entries.push({ id: saId, label, method: detail.method, endpoint: detail.endpoint, requestBody: detail.requestBody });
      }
    }

    // Include Form API if form category is selected
    if (categories.includes('form') && state.subApiDetailsMap?.['submit-form']) {
      const formDetail = state.subApiDetailsMap['submit-form'];
      entries.unshift({ id: 'submit-form', label: 'Form', method: formDetail.method, endpoint: formDetail.endpoint, requestBody: formDetail.requestBody });
    }

    // Fallback: if no subApiDetailsMap entries, use the primary state
    if (entries.length === 0 && state.endpoint && state.method) {
      entries.push({ id: '_primary', label: 'API', method: state.method, endpoint: state.endpoint, requestBody: state.requestBody });
    }

    return entries;
  }, [state]);

  const currentTestApi = testableApis.find((a) => a.id === testingSubApiId) || testableApis[0];

  const handleCurlUpdate = (curl: string, response: string) => {
    if (onUpdateFromTest) {
      onUpdateFromTest({ response, curl });
    }
  };

  const openTester = (apiId: string) => {
    setTestingSubApiId(apiId);
    setShowTester(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Preview & Generate</h2>
          <p className="text-sm text-gray-500 mt-1">Review your API documentation before saving.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onSave} disabled={saving} size="lg" variant="secondary">
            {saving ? 'Saving...' : 'Save Locally'}
          </Button>
          <Button onClick={onGoogleDoc} size="lg">
            Open in Google Docs
          </Button>
        </div>
      </div>

      <div style={{ background: '#f0f0f0', padding: '24px 0', borderRadius: '8px' }}>
        <div style={{ maxWidth: '864px', margin: '0 auto', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)', borderRadius: '2px' }}>
          <DocRenderer doc={state} />
        </div>
      </div>

      {/* Test API Buttons — one per sub-API */}
      <div className="mt-4 flex justify-center gap-3 flex-wrap">
        {testableApis.map((api) => (
          <button
            key={api.id}
            onClick={() => openTester(api.id)}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-lg"
          >
            <span className="text-green-400">▶</span>
            Test {api.label} API
          </button>
        ))}
      </div>

      {/* API Tester Modal */}
      {showTester && currentTestApi && (
        <ApiTester
          method={currentTestApi.method}
          url={currentTestApi.endpoint}
          accessToken={state.accessToken}
          requestBody={currentTestApi.requestBody}
          onClose={() => setShowTester(false)}
          onCurlUpdate={handleCurlUpdate}
        />
      )}
    </div>
  );
}
