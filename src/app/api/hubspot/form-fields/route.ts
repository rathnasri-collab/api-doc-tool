import { NextRequest, NextResponse } from 'next/server';

interface HubSpotOption {
  label: string;
  value: string;
}

interface HubSpotField {
  name: string;
  label: string;
  objectTypeId: string;
  required: boolean;
  hidden: boolean;
  fieldType: string;
  options: HubSpotOption[];
}

export async function POST(request: NextRequest) {
  const { formId, accessToken } = await request.json();

  if (!formId || !accessToken) {
    return NextResponse.json({ error: 'formId and accessToken are required' }, { status: 400 });
  }

  try {
    // Fetch form fields and subscriptions in parallel
    const [fieldsRes, subsRes] = await Promise.all([
      fetch(`https://api.hubapi.com/forms/v2/fields/${formId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }),
      fetch('https://api.hubapi.com/email/public/v1/subscriptions', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }),
    ]);

    if (!fieldsRes.ok) {
      const errText = await fieldsRes.text();
      console.error('HubSpot API error:', fieldsRes.status, errText);
      try {
        const errJson = JSON.parse(errText);
        if (errJson.type === 'NOT_FOUND' || fieldsRes.status === 404) {
          return NextResponse.json({ error: 'Form not found. Check the Form ID and make sure it exists in your portal.' }, { status: 404 });
        }
        return NextResponse.json({ error: errJson.message || errText }, { status: fieldsRes.status });
      } catch {
        return NextResponse.json({ error: `HubSpot API error (${fieldsRes.status}): ${errText}` }, { status: fieldsRes.status });
      }
    }

    const fields: HubSpotField[] = await fieldsRes.json();

    const simplified = fields.map((f) => ({
      name: f.name,
      label: f.label,
      objectTypeId: f.objectTypeId || '0-1',
      required: f.required,
      hidden: f.hidden,
      fieldType: f.fieldType,
      options: (f.options || []).map((o) => ({ label: o.label, value: o.value })),
    }));

    // Parse subscriptions
    let subscriptionTypeId: number | null = null;
    if (subsRes.ok) {
      const subsData = await subsRes.json();
      // Find the first non-internal, active Marketing subscription
      const marketingSub = subsData.subscriptionDefinitions?.find(
        (s: { active: boolean; internal: boolean; category: string }) =>
          s.active && !s.internal && s.category === 'Marketing'
      );
      if (marketingSub) {
        subscriptionTypeId = marketingSub.id;
      } else {
        // Fallback to first active non-internal subscription
        const fallback = subsData.subscriptionDefinitions?.find(
          (s: { active: boolean; internal: boolean }) => s.active && !s.internal
        );
        if (fallback) subscriptionTypeId = fallback.id;
      }
    }

    return NextResponse.json({ fields: simplified, subscriptionTypeId });
  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json({ error: `Failed to fetch form fields: ${err}` }, { status: 500 });
  }
}
