import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, saveToken } from '@/lib/google';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/create?google_auth=error', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/create?google_auth=missing_code', request.url));
  }

  try {
    const result = await exchangeCode(code);
    await saveToken({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expiry: Date.now() + result.expires_in * 1000,
    });
    return NextResponse.redirect(new URL('/create?google_auth=success', request.url));
  } catch {
    return NextResponse.redirect(new URL('/create?google_auth=error', request.url));
  }
}
