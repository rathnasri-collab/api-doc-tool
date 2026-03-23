'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { ENVIRONMENTS } from '@/lib/constants';
import { CredentialEntry } from '@/lib/types';

interface Props {
  onSave: (entry: Omit<CredentialEntry, 'id'>) => void;
  onCancel: () => void;
  initial?: CredentialEntry;
}

export default function SettingsForm({ onSave, onCancel, initial }: Props) {
  const [accounts, setAccounts] = useState<{ id: string; label: string }[]>([]);
  const [account, setAccount] = useState(initial?.account || '');
  const [environment, setEnvironment] = useState(initial?.environment || '');

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(setAccounts).catch(() => {});
  }, []);
  const [accountId, setAccountId] = useState(initial?.accountId || '');
  const [accessToken, setAccessToken] = useState(initial?.accessToken || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !environment || !accountId || !accessToken) return;
    onSave({ account, environment, accountId, accessToken });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <Select
        label="Account"
        id="account"
        value={account}
        onChange={(e) => setAccount(e.target.value)}
        options={accounts.map(a => ({ value: a.id, label: a.label }))}
      />
      <Select
        label="Environment"
        id="environment"
        value={environment}
        onChange={(e) => setEnvironment(e.target.value)}
        options={ENVIRONMENTS.map(e => ({ value: e.id, label: e.label }))}
      />
      <Input
        label="Account ID"
        id="accountId"
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        placeholder="Enter account ID"
      />
      <Input
        label="Access Token"
        id="accessToken"
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
        placeholder="Enter access token"
      />
      <div className="flex gap-3 pt-2">
        <Button type="submit">{initial ? 'Update' : 'Add Credential'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
