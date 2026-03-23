import { NextResponse } from 'next/server';
import { getValidAccessToken, getGoogleClientId } from '@/lib/google';

export async function GET() {
  const configured = !!getGoogleClientId();
  if (!configured) {
    return NextResponse.json({ status: 'not_configured' });
  }

  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json({ status: 'not_authenticated' });
  }

  return NextResponse.json({ status: 'ready' });
}
