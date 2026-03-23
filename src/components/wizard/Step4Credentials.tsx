'use client';

import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';

interface Props {
  account: string;
  environment: string;
  accountId: string;
  accessToken: string;
  onChange: (creds: { accountId: string; accessToken: string }) => void;
}

export default function Step4Credentials({ account, environment, accountId, accessToken, onChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [autoFilled, setAutoFilled] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    async function fetchCredentials() {
      try {
        const res = await fetch('/api/settings');
        const settings = await res.json();
        const match = settings.find(
          (s: { account: string; environment: string }) =>
            s.account === account && s.environment === environment
        );
        if (match) {
          onChange({ accountId: match.accountId, accessToken: match.accessToken });
          setAutoFilled(true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, environment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-500">Loading credentials...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Credentials</h2>
      <p className="text-sm text-gray-500 mb-6">
        {autoFilled
          ? 'Credentials auto-filled from settings. You can override them below.'
          : 'Enter credentials for this account and environment. Save them in Settings for auto-fill.'}
      </p>
      {autoFilled && (
        <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          Auto-filled from saved settings
        </div>
      )}
      <div className="space-y-4 max-w-md">
        <Input
          label="Account ID"
          id="accountId"
          value={accountId}
          onChange={(e) => onChange({ accountId: e.target.value, accessToken })}
          placeholder="Enter account ID"
        />
        <div className="relative">
          <Input
            label="Access Token"
            id="accessToken"
            type={showToken ? 'text' : 'password'}
            value={accessToken}
            onChange={(e) => onChange({ accountId, accessToken: e.target.value })}
            placeholder="Enter access token"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
            title={showToken ? 'Hide token' : 'Show token'}
          >
            {showToken ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
