'use client';

import { useEffect, useState } from 'react';
import { API_CATEGORIES, ENVIRONMENTS, SUB_APIS } from '@/lib/constants';

interface SubApiDetail {
  endpoint: string;
  method: string;
  requestBody: string;
  response: string;
  notes: string;
}

interface DocData {
  docTitle?: string;
  category: string;
  account: string;
  environment: string;
  accountId: string;
  accessToken: string;
  subApi: string;
  endpoint: string;
  method: string;
  requestBody: string;
  response: string;
  notes: string;
  subApiDetailsMap?: Record<string, SubApiDetail>;
}

function getLabel(list: readonly { id: string; label: string }[], id: string) {
  return list.find(item => item.id === id)?.label || id;
}

function formatJson(str: string): string {
  if (!str.trim()) return '';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

const methodColors: Record<string, string> = {
  GET: '#34a853',
  POST: '#4285f4',
  PATCH: '#fbbc04',
  DELETE: '#ea4335',
};

function SubApiSection({ label, detail }: { label: string; detail: SubApiDetail }) {
  const methodColor = methodColors[detail.method?.toUpperCase()] || '#5f6368';

  return (
    <div style={{ marginBottom: '40px' }}>
      {/* Sub-API Title */}
      <h2 style={{ fontSize: '18pt', fontWeight: 400, color: '#000', marginBottom: '16px', borderBottom: '2px solid #4285f4', paddingBottom: '8px' }}>
        {label}
      </h2>

      {/* Endpoint */}
      <h3 style={{ fontSize: '13pt', fontWeight: 500, color: '#202124', marginBottom: '8px' }}>
        Endpoint
      </h3>
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #dadce0',
        borderRadius: '8px',
        padding: '14px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: '4px',
          fontSize: '10pt',
          fontWeight: 700,
          fontFamily: "'Google Sans Mono', 'Roboto Mono', monospace",
          color: '#fff',
          background: methodColor,
        }}>
          {detail.method}
        </span>
        <code style={{ fontSize: '10pt', fontFamily: "'Google Sans Mono', 'Roboto Mono', monospace", color: '#202124', wordBreak: 'break-all' }}>
          {detail.endpoint}
        </code>
      </div>

      {/* Request Body */}
      {detail.requestBody && (
        <>
          <h3 style={{ fontSize: '13pt', fontWeight: 500, color: '#202124', marginBottom: '8px' }}>
            Request Body
          </h3>
          <div style={{
            background: '#1e1e1e',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '20px',
            overflowX: 'auto',
          }}>
            <pre style={{ margin: 0, fontSize: '9.5pt', lineHeight: 1.6, fontFamily: "'Google Sans Mono', 'Roboto Mono', monospace", color: '#d4d4d4' }}>
              {formatJson(detail.requestBody)}
            </pre>
          </div>
        </>
      )}

      {/* Response */}
      {detail.response && (
        <>
          <h3 style={{ fontSize: '13pt', fontWeight: 500, color: '#202124', marginBottom: '8px' }}>
            Response
          </h3>
          <div style={{
            background: '#1e1e1e',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '20px',
            overflowX: 'auto',
          }}>
            <pre style={{ margin: 0, fontSize: '9.5pt', lineHeight: 1.6, fontFamily: "'Google Sans Mono', 'Roboto Mono', monospace", color: '#d4d4d4' }}>
              {formatJson(detail.response)}
            </pre>
          </div>
        </>
      )}

      {/* Notes */}
      {detail.notes && (
        <>
          <h3 style={{ fontSize: '13pt', fontWeight: 500, color: '#202124', marginBottom: '8px' }}>
            Notes
          </h3>
          <p style={{ fontSize: '10.5pt', lineHeight: 1.7, color: '#3c4043', whiteSpace: 'pre-wrap' }}>
            {detail.notes}
          </p>
        </>
      )}
    </div>
  );
}

export default function DocRenderer({ doc }: { doc: DocData }) {
  const [accounts, setAccounts] = useState<{ id: string; label: string }[]>([]);
  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(setAccounts).catch(() => {});
  }, []);

  const categories = doc.category ? doc.category.split(',') : [];
  const categoryLabels = categories.map((c) => getLabel(API_CATEGORIES, c)).join(', ');
  const accountLabel = getLabel(accounts, doc.account) || doc.account;
  const envLabel = getLabel(ENVIRONMENTS, doc.environment);
  const selectedSubApis = doc.subApi ? doc.subApi.split(',') : [];

  // Check if we have multiple sub-API details stored
  const hasMultipleSubApis = doc.subApiDetailsMap && Object.keys(doc.subApiDetailsMap).length > 0;

  // Build sub-API sections
  const subApiSections: { id: string; label: string; detail: SubApiDetail }[] = [];
  if (hasMultipleSubApis) {
    for (const sa of selectedSubApis) {
      if (sa === 'conflict') {
        const conflictKeys = ['conflict-update-by-id', 'conflict-update-by-email'];
        const conflictLabels: Record<string, string> = {
          'conflict-update-by-id': '409 Conflict - Update by Contact ID',
          'conflict-update-by-email': '409 Conflict - Update by Email',
        };
        for (const ck of conflictKeys) {
          const detail = doc.subApiDetailsMap![ck];
          if (detail) {
            subApiSections.push({ id: ck, label: conflictLabels[ck] + ' API', detail });
          }
        }
        continue;
      }
      if (sa === 'event') {
        // Collect all event-N entries from subApiDetailsMap
        const eventKeys = Object.keys(doc.subApiDetailsMap!)
          .filter((k) => k.startsWith('event-'))
          .sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
        for (const ek of eventKeys) {
          const detail = doc.subApiDetailsMap![ek];
          const eventNote = detail.notes || '';
          const eventLabel = eventNote.startsWith('Event: ') ? eventNote.slice(7) : ek;
          subApiSections.push({ id: ek, label: eventLabel + ' Event API', detail });
        }
        // Fallback: if no event-N keys, use the "event" key directly
        if (eventKeys.length === 0 && doc.subApiDetailsMap![sa]) {
          subApiSections.push({ id: sa, label: 'Event API', detail: doc.subApiDetailsMap![sa] });
        }
      } else if (doc.subApiDetailsMap![sa]) {
        let subApiLabel = sa;
        for (const cat of categories) {
          const found = (SUB_APIS[cat] || []).find((s) => s.id === sa);
          if (found) { subApiLabel = found.label; break; }
        }
        subApiSections.push({ id: sa, label: subApiLabel + ' API', detail: doc.subApiDetailsMap![sa] });
      }
    }
  }

  // Include Form API if form category is selected
  if (categories.includes('form') && doc.subApiDetailsMap?.['submit-form']) {
    subApiSections.unshift({ id: 'submit-form', label: 'Form API', detail: doc.subApiDetailsMap['submit-form'] });
  }

  // Single sub-API label for overview
  const subApiLabel = selectedSubApis.length > 0
    ? selectedSubApis.map((sa) => {
        for (const cat of categories) {
          const found = (SUB_APIS[cat] || []).find((s) => s.id === sa);
          if (found) return found.label;
        }
        return sa;
      }).join(', ')
    : '';

  const methodColor = methodColors[doc.method?.toUpperCase()] || '#5f6368';

  return (
    <div className="bg-white" style={{ fontFamily: "'Google Sans', Arial, sans-serif" }}>
      {/* Google Docs-style page */}
      <div style={{ maxWidth: '816px', margin: '0 auto', padding: '72px 96px', minHeight: '1056px', background: '#fff' }}>

        {/* Document Title */}
        <h1 style={{ fontSize: '26pt', fontWeight: 400, color: '#000', marginBottom: '4px', lineHeight: 1.2 }}>
          {doc.docTitle || `${subApiLabel} API Documentation`}
        </h1>
        <div style={{ borderBottom: '1px solid #dadce0', paddingBottom: '16px', marginBottom: '24px' }}>
          <span style={{ fontSize: '10pt', color: '#5f6368' }}>
            {categoryLabels} &bull; {accountLabel} &bull; {envLabel}
          </span>
        </div>

        {/* Overview Table */}
        <h2 style={{ fontSize: '16pt', fontWeight: 400, color: '#000', marginBottom: '12px' }}>
          Overview
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px', fontSize: '10pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 12px', border: '1px solid #dadce0', background: '#f8f9fa', fontWeight: 500, width: '160px', color: '#202124' }}>
                Category
              </td>
              <td style={{ padding: '8px 12px', border: '1px solid #dadce0', color: '#3c4043' }}>
                {categoryLabels}
              </td>
            </tr>
            {subApiLabel && (
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #dadce0', background: '#f8f9fa', fontWeight: 500, color: '#202124' }}>
                  Sub APIs
                </td>
                <td style={{ padding: '8px 12px', border: '1px solid #dadce0', color: '#3c4043' }}>
                  {subApiLabel}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '8px 12px', border: '1px solid #dadce0', background: '#f8f9fa', fontWeight: 500, color: '#202124' }}>
                Account
              </td>
              <td style={{ padding: '8px 12px', border: '1px solid #dadce0', color: '#3c4043' }}>
                {accountLabel}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', border: '1px solid #dadce0', background: '#f8f9fa', fontWeight: 500, color: '#202124' }}>
                Environment
              </td>
              <td style={{ padding: '8px 12px', border: '1px solid #dadce0', color: '#3c4043' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '9pt',
                  fontWeight: 500,
                  background: doc.environment === 'production' ? '#e6f4ea' : '#fef7e0',
                  color: doc.environment === 'production' ? '#137333' : '#b06000',
                }}>
                  {envLabel}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Authentication */}
        <h2 style={{ fontSize: '16pt', fontWeight: 400, color: '#000', marginBottom: '12px' }}>
          Authentication
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px', fontSize: '10pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 12px', border: '1px solid #dadce0', background: '#f8f9fa', fontWeight: 500, width: '160px', color: '#202124' }}>
                Account ID
              </td>
              <td style={{ padding: '8px 12px', border: '1px solid #dadce0' }}>
                <code style={{ fontFamily: "'Google Sans Mono', 'Roboto Mono', monospace", color: '#3c4043', fontSize: '10pt' }}>
                  {doc.accountId}
                </code>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', border: '1px solid #dadce0', background: '#f8f9fa', fontWeight: 500, color: '#202124' }}>
                Access Token
              </td>
              <td style={{ padding: '8px 12px', border: '1px solid #dadce0' }}>
                <code style={{ fontFamily: "'Google Sans Mono', 'Roboto Mono', monospace", color: '#3c4043', fontSize: '10pt' }}>
                  {doc.accessToken.substring(0, 8)}{'*'.repeat(12)}
                </code>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Multiple sub-API sections */}
        {subApiSections.length > 0 ? (
          <>
            <div style={{ borderBottom: '3px solid #202124', marginBottom: '32px', paddingBottom: '4px' }}>
              <h2 style={{ fontSize: '20pt', fontWeight: 400, color: '#000', margin: 0 }}>
                API Endpoints
              </h2>
            </div>
            {subApiSections.map((section, idx) => (
              <SubApiSection key={section.id} label={`${idx + 1}. ${section.label}`} detail={section.detail} />
            ))}
          </>
        ) : (
          <>
            {/* Single API — Endpoint */}
            <h2 style={{ fontSize: '16pt', fontWeight: 400, color: '#000', marginBottom: '12px' }}>
              Endpoint
            </h2>
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #dadce0',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '10pt',
                fontWeight: 700,
                fontFamily: "'Google Sans Mono', 'Roboto Mono', monospace",
                color: '#fff',
                background: methodColor,
              }}>
                {doc.method}
              </span>
              <code style={{ fontSize: '10pt', fontFamily: "'Google Sans Mono', 'Roboto Mono', monospace", color: '#202124', wordBreak: 'break-all' }}>
                {doc.endpoint}
              </code>
            </div>

            {/* Request Body */}
            {doc.requestBody && (
              <>
                <h2 style={{ fontSize: '16pt', fontWeight: 400, color: '#000', marginBottom: '12px' }}>
                  Request Body
                </h2>
                <div style={{
                  background: '#1e1e1e',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  marginBottom: '28px',
                  overflowX: 'auto',
                }}>
                  <pre style={{ margin: 0, fontSize: '9.5pt', lineHeight: 1.6, fontFamily: "'Google Sans Mono', 'Roboto Mono', monospace", color: '#d4d4d4' }}>
                    {formatJson(doc.requestBody)}
                  </pre>
                </div>
              </>
            )}

            {/* Response */}
            {doc.response && (
              <>
                <h2 style={{ fontSize: '16pt', fontWeight: 400, color: '#000', marginBottom: '12px' }}>
                  Response
                </h2>
                <div style={{
                  background: '#1e1e1e',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  marginBottom: '28px',
                  overflowX: 'auto',
                }}>
                  <pre style={{ margin: 0, fontSize: '9.5pt', lineHeight: 1.6, fontFamily: "'Google Sans Mono', 'Roboto Mono', monospace", color: '#d4d4d4' }}>
                    {formatJson(doc.response)}
                  </pre>
                </div>
              </>
            )}

            {/* Notes */}
            {doc.notes && (
              <>
                <h2 style={{ fontSize: '16pt', fontWeight: 400, color: '#000', marginBottom: '12px' }}>
                  Notes
                </h2>
                <p style={{ fontSize: '10.5pt', lineHeight: 1.7, color: '#3c4043', whiteSpace: 'pre-wrap' }}>
                  {doc.notes}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
