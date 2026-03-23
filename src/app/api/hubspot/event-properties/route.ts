import { NextRequest, NextResponse } from 'next/server';

interface EventProperty {
  name: string;
  label: string;
  type: string;
  description: string;
}

interface EventDefinition {
  name: string;
  label: string;
  description: string;
  properties: EventProperty[];
}

export async function POST(request: NextRequest) {
  const { accessToken, eventName } = await request.json();

  if (!accessToken || !eventName) {
    return NextResponse.json(
      { error: 'accessToken and eventName are required' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.hubapi.com/events/v3/event-definitions/${encodeURIComponent(eventName)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `HubSpot API error (${res.status}): ${errText}` },
        { status: res.status }
      );
    }

    const definition: EventDefinition = await res.json();

    const properties = (definition.properties || []).map((p) => ({
      name: p.name,
      label: p.label || p.name,
      type: p.type || 'string',
      description: p.description || '',
    }));

    return NextResponse.json({
      eventName: definition.name,
      eventLabel: definition.label || definition.name,
      description: definition.description || '',
      properties,
    });
  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json(
      { error: `Failed to fetch event properties: ${err}` },
      { status: 500 }
    );
  }
}
