import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { CredentialEntry, ApiDoc } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // already exists
  }
}

async function readJson<T>(filename: string, fallback: T): Promise<T> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    await writeFile(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

async function writeJson<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

// Accounts
export interface AccountEntry {
  id: string;
  label: string;
}

const DEFAULT_ACCOUNTS: AccountEntry[] = [
  { id: 'india', label: 'India' },
  { id: 'menap', label: 'MENAP' },
  { id: 'sea', label: 'SEA' },
  { id: 'sa', label: 'SA' },
  { id: 'janz', label: 'JANZ' },
];

export async function getAccounts(): Promise<AccountEntry[]> {
  return readJson<AccountEntry[]>('accounts.json', DEFAULT_ACCOUNTS);
}

export async function saveAccounts(accounts: AccountEntry[]): Promise<void> {
  await writeJson('accounts.json', accounts);
}

// Settings
export async function getSettings(): Promise<CredentialEntry[]> {
  return readJson<CredentialEntry[]>('settings.json', []);
}

export async function saveSettings(settings: CredentialEntry[]): Promise<void> {
  await writeJson('settings.json', settings);
}

// Docs
export async function getDocs(): Promise<ApiDoc[]> {
  return readJson<ApiDoc[]>('docs.json', []);
}

export async function getDoc(id: string): Promise<ApiDoc | undefined> {
  const docs = await getDocs();
  return docs.find(d => d.id === id);
}

export async function saveDoc(doc: ApiDoc): Promise<void> {
  const docs = await getDocs();
  docs.unshift(doc);
  await writeJson('docs.json', docs);
}

export async function deleteDoc(id: string): Promise<boolean> {
  const docs = await getDocs();
  const filtered = docs.filter(d => d.id !== id);
  if (filtered.length === docs.length) return false;
  await writeJson('docs.json', filtered);
  return true;
}
