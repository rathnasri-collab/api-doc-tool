import { NextRequest, NextResponse } from 'next/server';

interface HubSpotPropertyV1 {
  name: string;
  label: string;
  type: string;
  fieldType: string;
  description: string;
  groupName: string;
  createdUserId?: string;
  calculated?: boolean;
  hubspotDefined?: boolean;
  options?: { label: string; value: string }[];
}

export async function POST(request: NextRequest) {
  const { accessToken } = await request.json();

  if (!accessToken) {
    return NextResponse.json({ error: 'accessToken is required' }, { status: 400 });
  }

  try {
    // Step 1: Fetch all properties
    const propsRes = await fetch('https://api.hubapi.com/properties/v1/contacts/properties', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!propsRes.ok) {
      const errText = await propsRes.text();
      return NextResponse.json(
        { error: `HubSpot API error (${propsRes.status}): ${errText}` },
        { status: propsRes.status }
      );
    }

    const properties: HubSpotPropertyV1[] = await propsRes.json();
    const propertyNames = properties.map((p) => p.name);

    // Step 2: Fetch a sample of contacts with all properties to calculate usage
    // We fetch 100 contacts and check which properties are populated
    const sampleRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=100&archived=false&properties=' + propertyNames.slice(0, 150).join(','), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    let totalContacts = 0;
    const usageCountMap: Record<string, number> = {};
    let sampleSize = 0;

    if (sampleRes.ok) {
      const sampleData = await sampleRes.json();
      totalContacts = sampleData.total || 0;
      const contacts = sampleData.results || [];
      sampleSize = contacts.length;

      // Count how many contacts have each property populated
      for (const contact of contacts) {
        const props = contact.properties || {};
        for (const propName of Object.keys(props)) {
          if (props[propName] !== null && props[propName] !== '' && props[propName] !== undefined) {
            usageCountMap[propName] = (usageCountMap[propName] || 0) + 1;
          }
        }
      }
    }

    const simplified = properties.map((p) => {
      const sampleCount = usageCountMap[p.name] || 0;
      // Calculate usage percentage from sample
      const usedPercentage = sampleSize > 0 ? Math.round((sampleCount / sampleSize) * 100) : null;

      return {
        name: p.name,
        label: p.label,
        type: p.type,
        fieldType: p.fieldType,
        description: p.description || '',
        groupName: p.groupName || '',
        createdBy: p.createdUserId || 'HubSpot',
        hubspotDefined: p.hubspotDefined || false,
        usedPercentage,
        options: (p.options || []).map((o: { label: string; value: string }) => ({
          label: o.label,
          value: o.value,
        })),
      };
    });

    return NextResponse.json({ properties: simplified, totalContacts, sampleSize });
  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json(
      { error: `Failed to fetch contact properties: ${err}` },
      { status: 500 }
    );
  }
}
