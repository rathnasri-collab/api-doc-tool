import { NextResponse } from 'next/server';
import { getDocs, saveDoc } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { ApiDoc } from '@/lib/types';

export async function GET() {
  const docs = await getDocs();
  return NextResponse.json(docs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const doc: ApiDoc = {
    ...body,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  await saveDoc(doc);
  return NextResponse.json(doc, { status: 201 });
}
