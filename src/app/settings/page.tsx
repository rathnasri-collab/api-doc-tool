'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import SettingsTable from '@/components/settings/SettingsTable';
import SettingsForm from '@/components/settings/SettingsForm';
import Button from '@/components/ui/Button';
import { CredentialEntry } from '@/lib/types';

export default function SettingsPage() {
  const [entries, setEntries] = useState<CredentialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CredentialEntry | undefined>();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (entry: Omit<CredentialEntry, 'id'>) => {
    const action = editing ? 'update' : 'add';
    const payload = editing ? { ...entry, id: editing.id } : entry;
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, entry: payload }),
    });
    setShowForm(false);
    setEditing(undefined);
    showToast(editing ? 'Credential updated!' : 'Credential added!');
    fetchSettings();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this credential?')) return;
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', entry: { id } }),
    });
    showToast('Credential deleted.');
    fetchSettings();
  };

  const handleEdit = (entry: CredentialEntry) => {
    setEditing(entry);
    setShowForm(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Header title="Settings" description="Manage API credentials for each account and environment.">
        {!showForm && (
          <Button onClick={() => { setEditing(undefined); setShowForm(true); }}>
            Add Credential
          </Button>
        )}
      </Header>

      {showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit Credential' : 'Add New Credential'}</h2>
          <SettingsForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(undefined); }}
          />
        </div>
      ) : (
        <SettingsTable entries={entries} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg text-sm animate-fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
