'use client';

import { ENVIRONMENTS } from '@/lib/constants';
import Card from '@/components/ui/Card';

interface Props {
  value: string;
  onChange: (env: string) => void;
}

export default function Step3Environment({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Select Environment</h2>
      <p className="text-sm text-gray-500 mb-6">Choose the target environment.</p>
      <div className="grid grid-cols-2 gap-4">
        {ENVIRONMENTS.map((env) => (
          <Card
            key={env.id}
            selected={value === env.id}
            onClick={() => onChange(env.id)}
          >
            <div className="text-center">
              <div className={`inline-block w-3 h-3 rounded-full mb-2 ${env.color === 'amber' ? 'bg-amber-400' : 'bg-green-400'}`} />
              <h3 className="font-semibold text-gray-900">{env.label}</h3>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
