'use client';

import { SUB_APIS } from '@/lib/constants';
import Card from '@/components/ui/Card';

interface Props {
  category: string;
  value: string;
  onChange: (subApi: string) => void;
}

export default function Step5SubApi({ category, value, onChange }: Props) {
  const subApis = SUB_APIS[category] || [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Select Sub API</h2>
      <p className="text-sm text-gray-500 mb-6">Choose the specific API endpoint to document.</p>
      <div className="grid grid-cols-2 gap-4">
        {subApis.map((api) => (
          <Card
            key={api.id}
            selected={value === api.id}
            onClick={() => onChange(api.id)}
          >
            <h3 className="font-semibold text-gray-900">{api.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{api.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
