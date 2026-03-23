import { NextRequest, NextResponse } from 'next/server';
import { getAccounts, saveAccounts } from '@/lib/storage';

export async function GET() {
  const accounts = await getAccounts();
  return NextResponse.json(accounts);
}

// Add or update account
export async function POST(request: NextRequest) {
  const { id, label } = await request.json();
  if (!id || !label) {
    return NextResponse.json({ error: 'id and label are required' }, { status: 400 });
  }

  const accounts = await getAccounts();
  const existing = accounts.findIndex((a) => a.id === id);
  if (existing >= 0) {
    accounts[existing].label = label;
  } else {
    accounts.push({ id, label });
  }
  await saveAccounts(accounts);
  return NextResponse.json(accounts);
}

// Delete account
export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const accounts = await getAccounts();
  const filtered = accounts.filter((a) => a.id !== id);
  await saveAccounts(filtered);
  return NextResponse.json(filtered);
}
