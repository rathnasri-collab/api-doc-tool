import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import WizardShell from '@/components/wizard/WizardShell';

export default function CreatePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Header
        title="Create API Documentation"
        description="Follow the steps below to generate professional API documentation."
      />
      <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
        <WizardShell />
      </Suspense>
    </div>
  );
}
