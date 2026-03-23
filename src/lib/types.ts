export interface CredentialEntry {
  id: string;
  account: string;
  environment: string;
  accountId: string;
  accessToken: string;
}

export interface ApiDoc {
  id: string;
  createdAt: string;
  docTitle: string;
  category: string;
  account: string;
  environment: string;
  accountId: string;
  accessToken: string;
  subApi: string;
  endpoint: string;
  method: string;
  requestBody: string;
  response: string;
  notes: string;
  subApiDetailsMap?: Record<string, SubApiDetail>;
}

export interface SubApiDetail {
  endpoint: string;
  method: string;
  requestBody: string;
  response: string;
  notes: string;
}

export interface WizardState {
  docTitle: string;
  category: string;
  account: string;
  environment: string;
  accountId: string;
  accessToken: string;
  subApi: string;
  endpoint: string;
  method: string;
  requestBody: string;
  response: string;
  notes: string;
  subApiDetailsMap: Record<string, SubApiDetail>;
}

export type WizardAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_CATEGORY'; payload: { categories: string; subApis: string } }
  | { type: 'SET_ACCOUNT'; payload: string }
  | { type: 'SET_ENVIRONMENT'; payload: string }
  | { type: 'SET_CREDENTIALS'; payload: { accountId: string; accessToken: string } }
  | { type: 'SET_SUB_API'; payload: string }
  | { type: 'SET_API_DETAILS'; payload: { endpoint: string; method: string; requestBody: string; response: string; notes: string } }
  | { type: 'SET_SUB_API_DETAILS'; payload: { subApiId: string; details: SubApiDetail } }
  | { type: 'RESTORE'; payload: Partial<WizardState> }
  | { type: 'RESET' };
