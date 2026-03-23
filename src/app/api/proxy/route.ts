import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url, method, headers, body } = await request.json();

    if (!url || !method) {
      return NextResponse.json({ error: 'url and method are required' }, { status: 400 });
    }

    const fetchOptions: RequestInit = {
      method,
      headers: headers || {},
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const startTime = Date.now();
    const res = await fetch(url, fetchOptions);
    const duration = Date.now() - startTime;

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody: string;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('json')) {
      const json = await res.json();
      responseBody = JSON.stringify(json, null, 2);
    } else {
      responseBody = await res.text();
    }

    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      body: responseBody,
      duration,
    });
  } catch (err) {
    return NextResponse.json({
      status: 0,
      statusText: 'Error',
      headers: {},
      body: String(err),
      duration: 0,
    });
  }
}
