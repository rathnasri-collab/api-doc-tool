'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import DocCard from '@/components/docs/DocCard';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { ApiDoc } from '@/lib/types';

export default function DocsListPage() {
  const [docs, setDocs] = useState<ApiDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDocs = async () => {
    const res = await fetch('/api/docs');
    const data = await res.json();
    setDocs(data);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this documentation?')) return;
    await fetch(`/api/docs/${id}`, { method: 'DELETE' });
    showToast('Documentation deleted.');
    fetchDocs();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Header title="Saved Documentation" description={`${docs.length} document${docs.length !== 1 ? 's' : ''} saved.`}>
        <Link href="/create">
          <Button>Create New</Button>
        </Link>
      </Header>

      {docs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-4">No documentation created yet.</p>
          <Link href="/create">
            <Button>Create Your First Doc</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map(doc => (
            <DocCard key={doc.id} doc={doc} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg text-sm animate-fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
