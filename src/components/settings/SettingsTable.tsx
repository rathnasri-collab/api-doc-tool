'use client';

import { useEffect, useState } from 'react';
import { CredentialEntry } from '@/lib/types';
import { ENVIRONMENTS } from '@/lib/constants';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

function getLabel(list: { id: string; label: string }[], id: string) {
  return list.find(item => item.id === id)?.label || id;
}

interface Props {
  entries: CredentialEntry[];
  onEdit: (entry: CredentialEntry) => void;
  onDelete: (id: string) => void;
}

export default function SettingsTable({ entries, onEdit, onDelete }: Props) {
  const [accounts, setAccounts] = useState<{ id: string; label: string }[]>([]);
  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(setAccounts).catch(() => {});
  }, []);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-500">No credentials saved yet.</p>
        <p className="text-sm text-gray-400 mt-1">Add your first credential to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Account</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Environment</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Account ID</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Access Token</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <Badge className="bg-indigo-100 text-indigo-700">{getLabel(accounts, entry.account)}</Badge>
              </td>
              <td className="px-6 py-4">
                <Badge className={entry.environment === 'production' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                  {getLabel(ENVIRONMENTS as unknown as { id: string; label: string }[], entry.environment)}
                </Badge>
              </td>
              <td className="px-6 py-4 text-sm font-mono text-gray-700">{entry.accountId}</td>
              <td className="px-6 py-4 text-sm font-mono text-gray-700">{entry.accessToken.substring(0, 8)}{'•'.repeat(8)}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(entry)}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(entry.id)}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
