'use client';

import { useReducer, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WizardState, WizardAction } from '@/lib/types';
import StepIndicator from './StepIndicator';
import Step1Category from './Step1Category';
import Step2Account from './Step2Account';
import Step3Environment from './Step3Environment';
import Step4Credentials from './Step4Credentials';
import Step5SubApi from './Step5SubApi';
import Step6ApiDetails from './Step6ApiDetails';
import Step7Preview from './Step7Preview';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const STORAGE_KEY = 'wizard-state';
const STEP_KEY = 'wizard-step';
const PENDING_GDOC_KEY = 'wizard-pending-gdoc';

const initialState: WizardState = {
  docTitle: '',
  category: '',
  account: '',
  environment: '',
  accountId: '',
  accessToken: '',
  subApi: '',
  endpoint: '',
  method: '',
  requestBody: '',
  response: '',
  notes: '',
  subApiDetailsMap: {},
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, docTitle: action.payload };
    case 'SET_CATEGORY':
      return { ...initialState, docTitle: state.docTitle, account: state.account, category: action.payload.categories, subApi: action.payload.subApis };
    case 'SET_ACCOUNT':
      return { ...state, account: action.payload, accountId: '', accessToken: '' };
    case 'SET_ENVIRONMENT':
      return { ...state, environment: action.payload, accountId: '', accessToken: '' };
    case 'SET_CREDENTIALS':
      return { ...state, ...action.payload };
    case 'SET_SUB_API':
      return { ...state, subApi: action.payload };
    case 'SET_API_DETAILS':
      return { ...state, ...action.payload };
    case 'SET_SUB_API_DETAILS':
      return {
        ...state,
        subApiDetailsMap: {
          ...state.subApiDetailsMap,
          [action.payload.subApiId]: action.payload.details,
        },
      };
    case 'RESTORE':
      return { ...state, ...action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Each step definition: id, label, canProceed check, and which categories to skip for
type StepDef = {
  id: string;
  label: string;
  canProceed: (state: WizardState) => boolean;
  skipFor?: string[]; // category ids to skip this step for
};

const ALL_STEPS: StepDef[] = [
  { id: 'title', label: 'Title', canProceed: (s) => !!s.docTitle.trim() },
  { id: 'account', label: 'Account', canProceed: (s) => !!s.account },
  { id: 'category', label: 'Category', canProceed: (s) => {
    if (!s.category) return false;
    const cats = s.category.split(',');
    // If contact is selected, at least one sub-api must be chosen
    if (cats.includes('contact') && !s.subApi) return false;
    return true;
  }},
  { id: 'environment', label: 'Environment', canProceed: (s) => !!s.environment },
  { id: 'credentials', label: 'Credentials', canProceed: (s) => !!s.accountId && !!s.accessToken },
  { id: 'details', label: 'API Details', canProceed: (s) => !!s.endpoint && !!s.method },
  { id: 'preview', label: 'Preview', canProceed: () => true },
];

export default function WizardShell() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [autoCreating, setAutoCreating] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter steps based on current category
  const steps = useMemo(() => {
    return ALL_STEPS.filter(s => !s.skipFor || !s.skipFor.includes(state.category));
  }, [state.category]);

  const stepLabels = useMemo(() => steps.map(s => s.label), [steps]);
  const currentStep = steps[stepIndex];
  const totalSteps = steps.length;

  // Restore state after Google OAuth redirect
  useEffect(() => {
    const googleAuth = searchParams.get('google_auth');
    if (googleAuth === 'success') {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      const savedStep = sessionStorage.getItem(STEP_KEY);
      const pendingGdoc = sessionStorage.getItem(PENDING_GDOC_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          dispatch({ type: 'RESTORE', payload: parsed });
          if (savedStep) setStepIndex(parseInt(savedStep, 10));
          if (pendingGdoc === 'true') {
            sessionStorage.removeItem(PENDING_GDOC_KEY);
            setAutoCreating(true);
          }
        } catch {
          // ignore
        }
      }
      window.history.replaceState({}, '', '/create');
    }
  }, [searchParams]);

  // Auto-create Google Doc after restoring state from auth redirect
  useEffect(() => {
    if (!autoCreating || !state.endpoint) return;
    setAutoCreating(false);
    createGoogleDoc(state);
  }, [autoCreating, state]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const createGoogleDoc = useCallback(async (docState: WizardState) => {
    try {
      const res = await fetch('/api/google/create-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docState),
      });
      const data = await res.json();

      if (data.error === 'not_authenticated') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(docState));
        sessionStorage.setItem(STEP_KEY, String(stepIndex));
        sessionStorage.setItem(PENDING_GDOC_KEY, 'true');
        window.location.href = '/api/google/auth';
        return;
      }

      if (data.url) {
        showToast('Google Doc created! Opening...');
        window.open(data.url, '_blank');
      } else if (data.error) {
        showToast(`Error: ${data.error}`);
      }
    } catch {
      showToast('Failed to create Google Doc.');
    }
  }, [stepIndex]);

  const handleGoogleDoc = async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    sessionStorage.setItem(STEP_KEY, String(stepIndex));
    sessionStorage.setItem(PENDING_GDOC_KEY, 'true');
    await createGoogleDoc(state);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      if (!res.ok) throw new Error('Failed to save');
      const doc = await res.json();
      showToast('Documentation saved successfully!');
      setTimeout(() => router.push(`/docs/${doc.id}`), 1000);
    } catch {
      showToast('Failed to save documentation.');
    } finally {
      setSaving(false);
    }
  };

  const renderCurrentStep = () => {
    if (!currentStep) return null;
    switch (currentStep.id) {
      case 'title':
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Document Title</h2>
            <p className="text-sm text-gray-500 mb-6">Enter a title for your API documentation.</p>
            <div className="max-w-md">
              <Input
                label="Document Title"
                id="docTitle"
                value={state.docTitle}
                onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
                placeholder="e.g. PII Form API - India (Staging)"
              />
            </div>
          </div>
        );
      case 'category':
        return <Step1Category value={state.category} subApis={state.subApi} onChange={(cats, subs) => dispatch({ type: 'SET_CATEGORY', payload: { categories: cats, subApis: subs } })} />;
      case 'account':
        return <Step2Account value={state.account} onChange={(v) => dispatch({ type: 'SET_ACCOUNT', payload: v })} />;
      case 'environment':
        return <Step3Environment value={state.environment} onChange={(v) => dispatch({ type: 'SET_ENVIRONMENT', payload: v })} />;
      case 'credentials':
        return (
          <Step4Credentials
            account={state.account}
            environment={state.environment}
            accountId={state.accountId}
            accessToken={state.accessToken}
            onChange={(creds) => dispatch({ type: 'SET_CREDENTIALS', payload: creds })}
          />
        );
      case 'subapi':
        return null; // Sub-API selection is now inline in the category step
      case 'details':
        return (
          <Step6ApiDetails
            value={{
              endpoint: state.endpoint,
              method: state.method,
              requestBody: state.requestBody,
              response: state.response,
              notes: state.notes,
            }}
            onChange={(details) => dispatch({ type: 'SET_API_DETAILS', payload: details })}
            onSubApiDetailChange={(subApiId, details) => dispatch({ type: 'SET_SUB_API_DETAILS', payload: { subApiId, details } })}
            category={state.category}
            subApi={state.subApi}
            accountId={state.accountId}
            accessToken={state.accessToken}
          />
        );
      case 'preview':
        return (
          <Step7Preview
            state={state}
            onSave={handleSave}
            saving={saving}
            onGoogleDoc={handleGoogleDoc}
            onUpdateFromTest={(updates) => {
              dispatch({
                type: 'SET_API_DETAILS',
                payload: {
                  endpoint: state.endpoint,
                  method: state.method,
                  requestBody: state.requestBody,
                  response: updates.response || state.response,
                  notes: state.notes,
                },
              });
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <StepIndicator currentStep={stepIndex + 1} steps={stepLabels} />
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        {renderCurrentStep()}
      </div>
      <div className="flex justify-between mt-6">
        <Button
          variant="secondary"
          onClick={() => setStepIndex((s) => s - 1)}
          disabled={stepIndex === 0}
        >
          Back
        </Button>
        {stepIndex < totalSteps - 1 && (
          <Button
            onClick={() => setStepIndex((s) => s + 1)}
            disabled={!currentStep?.canProceed(state)}
          >
            Next
          </Button>
        )}
      </div>
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg text-sm animate-fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
