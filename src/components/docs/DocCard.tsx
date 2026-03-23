'use client';

import Link from 'next/link';
import { ApiDoc } from '@/lib/types';
import { formatDate, getMethodColor } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { API_CATEGORIES, SUB_APIS } from '@/lib/constants';
import { useEffect, useState } from 'react';

function getLabel(list: { id: string; label: string }[], id: string) {
  return list.find(item => item.id === id)?.label || id;
}

interface Props {
  doc: ApiDoc;
  onDelete: (id: string) => void;
}

export default function DocCard({ doc, onDelete }: Props) {
  const [accounts, setAccounts] = useState<{ id: string; label: string }[]>([]);
  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(setAccounts).catch(() => {});
  }, []);

  const subApiLabel = (SUB_APIS[doc.category] || []).find(s => s.id === doc.subApi)?.label || doc.subApi;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={getMethodColor(doc.method)}>{doc.method}</Badge>
            <Badge className="bg-gray-100 text-gray-600">{getLabel(API_CATEGORIES as unknown as { id: string; label: string }[], doc.category)}</Badge>
            <Badge className="bg-indigo-100 text-indigo-700">{getLabel(accounts, doc.account)}</Badge>
            <Badge className={doc.environment === 'production' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
              {doc.environment}
            </Badge>
          </div>
          <Link href={`/docs/${doc.id}`} className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
            {subApiLabel}
          </Link>
          <p className="text-sm text-gray-500 mt-1 font-mono truncate">{doc.endpoint}</p>
          <p className="text-xs text-gray-400 mt-2">{formatDate(doc.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Link href={`/docs/${doc.id}`}>
            <Button variant="ghost" size="sm">View</Button>
          </Link>
          <Button variant="danger" size="sm" onClick={() => onDelete(doc.id)}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
