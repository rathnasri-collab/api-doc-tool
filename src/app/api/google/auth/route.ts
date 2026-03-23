import { NextResponse } from 'next/server';
import { getAuthUrl, getGoogleClientId } from '@/lib/google';

export async function GET() {
  if (!getGoogleClientId()) {
    return NextResponse.json(
      { error: 'Google credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local' },
      { status: 500 }
    );
  }
  return NextResponse.redirect(getAuthUrl());
}
