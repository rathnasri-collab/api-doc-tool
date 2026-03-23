'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';

interface Account {
  id: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (account: string) => void;
}

export default function Step2Account({ value, onChange }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState('');

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSave = async () => {
    const label = formLabel.trim();
    if (!label) return;
    const id = editingId || label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, label }),
    });

    setFormLabel('');
    setEditingId(null);
    setShowForm(false);
    await fetchAccounts();
  };

  const handleEdit = (acc: Account) => {
    setEditingId(acc.id);
    setFormLabel(acc.label);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this account?')) return;
    await fetch('/api/accounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (value === id) onChange('');
    await fetchAccounts();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormLabel('');
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading accounts...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Select Account</h2>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormLabel(''); }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Add Account
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-6">Choose which account this API belongs to.</p>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-4 p-4 rounded-lg border border-indigo-200 bg-indigo-50">
          <p className="text-sm font-medium text-indigo-800 mb-3">{editingId ? 'Edit Account' : 'New Account'}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Account name (e.g. India)"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={!formLabel.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Account Cards */}
      <div className="grid grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="relative group">
            <Card
              selected={value === acc.id}
              onClick={() => onChange(acc.id)}
            >
              <h3 className="font-semibold text-gray-900 text-center">{acc.label}</h3>
            </Card>
            {/* Edit/Delete buttons on hover */}
            <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(acc); }}
                className="w-6 h-6 flex items-center justify-center rounded bg-white shadow text-gray-500 hover:text-indigo-600 text-xs border border-gray-200"
                title="Edit"
              >
                ✎
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(acc.id); }}
                className="w-6 h-6 flex items-center justify-center rounded bg-white shadow text-gray-500 hover:text-red-600 text-xs border border-gray-200"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No accounts yet. Click &quot;+ Add Account&quot; to create one.</p>
      )}
    </div>
  );
}
