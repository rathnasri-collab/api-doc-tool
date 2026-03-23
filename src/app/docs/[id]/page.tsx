'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import DocRenderer from '@/components/docs/DocRenderer';
import Button from '@/components/ui/Button';
import { ApiDoc } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function DocViewPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<ApiDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchDoc() {
      try {
        const res = await fetch(`/api/docs/${params.id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setDoc(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchDoc();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Delete this documentation?')) return;
    await fetch(`/api/docs/${params.id}`, { method: 'DELETE' });
    router.push('/docs');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  }

  if (error || !doc) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Documentation not found.</p>
        <Button onClick={() => router.push('/docs')}>Back to Docs</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Header title="View Documentation" description={`Created ${formatDate(doc.createdAt)}`}>
        <Button variant="secondary" onClick={() => router.push('/docs')}>Back</Button>
        <Button variant="danger" onClick={handleDelete}>Delete</Button>
      </Header>
      <div style={{ background: '#f0f0f0', padding: '24px 0' }}>
        <div style={{ maxWidth: '864px', margin: '0 auto', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)', borderRadius: '2px' }}>
          <DocRenderer doc={doc} />
        </div>
      </div>
    </div>
  );
}
