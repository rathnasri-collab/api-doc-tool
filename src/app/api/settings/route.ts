import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { CredentialEntry } from '@/lib/types';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { action, entry } = body as { action: string; entry: CredentialEntry & { id?: string } };
  const settings = await getSettings();

  if (action === 'add') {
    const newEntry: CredentialEntry = { ...entry, id: generateId() };
    settings.push(newEntry);
    await saveSettings(settings);
    return NextResponse.json(newEntry, { status: 201 });
  }

  if (action === 'update') {
    const idx = settings.findIndex(s => s.id === entry.id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    settings[idx] = { ...settings[idx], ...entry };
    await saveSettings(settings);
    return NextResponse.json(settings[idx]);
  }

  if (action === 'delete') {
    const filtered = settings.filter(s => s.id !== entry.id);
    await saveSettings(filtered);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
