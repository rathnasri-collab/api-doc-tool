import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/google';
import { API_CATEGORIES, ENVIRONMENTS, SUB_APIS } from '@/lib/constants';
import { getAccounts } from '@/lib/storage';

function getLabel(list: readonly { id: string; label: string }[], id: string) {
  return list.find(item => item.id === id)?.label || id;
}

function formatJson(str: string): string {
  if (!str?.trim()) return '';
  try {
    return JSON.stringify(JSON.parse(str), null, 4);
  } catch {
    return str;
  }
}

function buildCurl(method: string, endpoint: string, accessToken: string, requestBody: string): string {
  let curl = `curl --location '${endpoint}' \\\n`;
  curl += `--header 'Authorization: Bearer ${accessToken}' \\\n`;
  curl += `--header 'Content-Type: application/json'`;
  if (requestBody?.trim() && method.toUpperCase() !== 'GET') {
    curl += ` \\\n--data-raw '${formatJson(requestBody)}'`;
  }
  return curl;
}

export async function POST(request: NextRequest) {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: 'not_authenticated', authUrl: '/api/google/auth' }, { status: 401 });
  }

  const doc = await request.json();

  const accounts = await getAccounts();
  const categoryLabel = getLabel(API_CATEGORIES, doc.category);
  const accountLabel = getLabel(accounts, doc.account);
  const envLabel = getLabel(ENVIRONMENTS, doc.environment);
  const subApiLabel = (SUB_APIS[doc.category] || []).find((s: { id: string }) => s.id === doc.subApi)?.label || doc.subApi;

  const title = doc.docTitle || `${categoryLabel} - ${accountLabel} (${envLabel})`;

  // Step 1: Create blank Google Doc
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    return NextResponse.json({ error: `Failed to create doc: ${err}` }, { status: 500 });
  }

  const createdDoc = await createRes.json();
  const documentId = createdDoc.documentId;

  // Step 2: Build document content using batchUpdate
  const requests: object[] = [];
  let idx = 1;

  function insertText(text: string) {
    requests.push({ insertText: { location: { index: idx }, text } });
    idx += text.length;
  }

  function applyStyle(start: number, end: number, style: string) {
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: start, endIndex: end },
        paragraphStyle: { namedStyleType: style },
        fields: 'namedStyleType',
      },
    });
  }

  function applyBold(start: number, end: number) {
    requests.push({
      updateTextStyle: {
        range: { startIndex: start, endIndex: end },
        textStyle: { bold: true },
        fields: 'bold',
      },
    });
  }

  function applyColor(start: number, end: number, r: number, g: number, b: number) {
    requests.push({
      updateTextStyle: {
        range: { startIndex: start, endIndex: end },
        textStyle: {
          foregroundColor: {
            color: { rgbColor: { red: r, green: g, blue: b } },
          },
        },
        fields: 'foregroundColor',
      },
    });
  }

  function addHeading(text: string, level: 'HEADING_1' | 'HEADING_2' | 'HEADING_3') {
    const start = idx;
    insertText(text + '\n');
    applyStyle(start, idx, level);
  }

  function addBoldLabel(label: string, value: string) {
    const start = idx;
    insertText(label);
    applyBold(start, idx);
    insertText(value + '\n');
  }

  function addCodeBlock(code: string) {
    insertText(code + '\n');
  }

  function addCodeBlockWithHighlightedComments(code: string) {
    const blockStart = idx;
    insertText(code + '\n');
    const lines = code.split('\n');
    let scanIdx = blockStart;
    for (const line of lines) {
      const commentMatch = line.indexOf('//');
      if (commentMatch !== -1) {
        const commentStart = scanIdx + commentMatch;
        const commentEnd = scanIdx + line.length;
        requests.push({
          updateTextStyle: {
            range: { startIndex: commentStart, endIndex: commentEnd },
            textStyle: {
              backgroundColor: {
                color: { rgbColor: { red: 1, green: 1, blue: 0 } },
              },
            },
            fields: 'backgroundColor',
          },
        });
      }
      scanIdx += line.length + 1;
    }
  }

  function addBlankLine() {
    insertText('\n');
  }

  // === Build the Document ===

  // Title
  addHeading(title, 'HEADING_1');
  addBlankLine();

  // Credentials section
  addHeading('HubSpot Credentials', 'HEADING_2');
  addBoldLabel('Access Token: ', doc.accessToken);
  addBoldLabel('Account ID / Portal ID: ', doc.accountId);
  addBlankLine();

  // Horizontal rule
  insertText('─'.repeat(60) + '\n');
  addBlankLine();

  // Build list of API sections from subApiDetailsMap (multiple) or fallback to single
  const selectedSubApis = doc.subApi ? doc.subApi.split(',') : [];
  const categories = doc.category ? doc.category.split(',') : [];

  interface ApiSection {
    label: string;
    method: string;
    endpoint: string;
    requestBody: string;
    response: string;
    notes: string;
  }

  const apiSections: ApiSection[] = [];

  if (doc.subApiDetailsMap && Object.keys(doc.subApiDetailsMap).length > 0) {
    for (const saId of selectedSubApis) {
      if (saId === 'conflict') {
        const conflictKeys = ['conflict-update-by-id', 'conflict-update-by-email'];
        const conflictLabels: Record<string, string> = {
          'conflict-update-by-id': '409 Conflict - Update by Contact ID',
          'conflict-update-by-email': '409 Conflict - Update by Email',
        };
        for (const ck of conflictKeys) {
          const detail = doc.subApiDetailsMap[ck];
          if (detail) {
            apiSections.push({
              label: conflictLabels[ck] + ' API',
              method: detail.method,
              endpoint: detail.endpoint,
              requestBody: detail.requestBody,
              response: detail.response,
              notes: detail.notes,
            });
          }
        }
        continue;
      }
      if (saId === 'event') {
        // Collect all event-N entries from subApiDetailsMap
        const eventKeys = Object.keys(doc.subApiDetailsMap)
          .filter((k: string) => k.startsWith('event-'))
          .sort((a: string, b: string) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
        for (const ek of eventKeys) {
          const detail = doc.subApiDetailsMap[ek];
          const eventNote = detail.notes || '';
          const eventLabel = eventNote.startsWith('Event: ') ? eventNote.slice(7) : ek;
          apiSections.push({
            label: eventLabel + ' Event API',
            method: detail.method,
            endpoint: detail.endpoint,
            requestBody: detail.requestBody,
            response: detail.response,
            notes: '',
          });
        }
        // Fallback: if no event-N keys, use the "event" key directly
        if (eventKeys.length === 0 && doc.subApiDetailsMap[saId]) {
          const detail = doc.subApiDetailsMap[saId];
          apiSections.push({
            label: 'Event API',
            method: detail.method,
            endpoint: detail.endpoint,
            requestBody: detail.requestBody,
            response: detail.response,
            notes: detail.notes,
          });
        }
        continue;
      }
      const detail = doc.subApiDetailsMap[saId];
      if (!detail) continue;
      let label = saId;
      for (const cat of categories) {
        const found = (SUB_APIS[cat] || []).find((s: { id: string }) => s.id === saId);
        if (found) { label = found.label; break; }
      }
      apiSections.push({
        label: label + ' API',
        method: detail.method,
        endpoint: detail.endpoint,
        requestBody: detail.requestBody,
        response: detail.response,
        notes: detail.notes,
      });
    }
  }

  // Include Form API if form category is selected
  if (categories.includes('form') && doc.subApiDetailsMap?.['submit-form']) {
    const formDetail = doc.subApiDetailsMap['submit-form'];
    apiSections.unshift({
      label: 'Form API',
      method: formDetail.method,
      endpoint: formDetail.endpoint,
      requestBody: formDetail.requestBody,
      response: formDetail.response,
      notes: formDetail.notes,
    });
  }

  // Fallback: single API from top-level fields
  if (apiSections.length === 0) {
    apiSections.push({
      label: subApiLabel,
      method: doc.method,
      endpoint: doc.endpoint,
      requestBody: doc.requestBody,
      response: doc.response,
      notes: doc.notes,
    });
  }

  // Render each API section
  apiSections.forEach((section, sectionIdx) => {
    const apiNumber = String(sectionIdx + 1);
    addHeading(`${apiNumber}. ${section.label}`, 'HEADING_2');
    addBlankLine();

    // Request Type
    addBoldLabel('Request Type: ', section.method);
    addBlankLine();

    // Endpoint
    const eLabelStart = idx;
    insertText('Endpoint:\n');
    applyBold(eLabelStart, idx);
    addBlankLine();

    const urlStart = idx;
    insertText(section.endpoint + '\n');
    applyColor(urlStart, idx, 0.06, 0.36, 0.72);
    addBlankLine();

    // Request Body
    if (section.requestBody?.trim()) {
      addHeading('Request Body:', 'HEADING_3');
      addBlankLine();
      addCodeBlockWithHighlightedComments(section.requestBody);
      addBlankLine();
    }

    // Response
    if (section.response?.trim()) {
      addHeading('Response:', 'HEADING_3');
      addBlankLine();
      addCodeBlock(section.response);
      addBlankLine();
    }

    // Curl Request
    addHeading('Curl Request:', 'HEADING_3');
    addBlankLine();
    const curl = buildCurl(section.method, section.endpoint, doc.accessToken, section.requestBody);
    addCodeBlock(curl);
    addBlankLine();

    // Notes per section
    if (section.notes?.trim()) {
      addHeading('Notes:', 'HEADING_3');
      insertText(section.notes + '\n');
      addBlankLine();
    }

    // Separator between API sections
    if (sectionIdx < apiSections.length - 1) {
      insertText('─'.repeat(60) + '\n');
      addBlankLine();
    }
  });

  // Global notes (from top-level, only if we used subApiDetailsMap and there are top-level notes)
  if (apiSections.length > 1 && doc.notes?.trim()) {
    insertText('─'.repeat(60) + '\n');
    addBlankLine();
    addHeading('Notes', 'HEADING_2');
    insertText(doc.notes + '\n');
  }

  // Step 3: Apply all formatting
  // Split requests: first do all inserts, then set global font, then apply specific styles
  const insertRequests = requests.filter((r: any) => r.insertText);
  const styleRequests = requests.filter((r: any) => !r.insertText);

  const allRequests = [
    ...insertRequests,
    // Global font: Times New Roman for entire doc
    {
      updateTextStyle: {
        range: { startIndex: 1, endIndex: idx },
        textStyle: {
          weightedFontFamily: { fontFamily: 'Times New Roman', weight: 400 },
        },
        fields: 'weightedFontFamily',
      },
    },
    // Then specific overrides (headings, bold, code blocks with Courier New, etc.)
    ...styleRequests,
  ];
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests: allRequests }),
  });

  if (!updateRes.ok) {
    const err = await updateRes.text();
    return NextResponse.json({ error: `Failed to update doc: ${err}` }, { status: 500 });
  }

  const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;
  return NextResponse.json({ documentId, url: docUrl });
}
