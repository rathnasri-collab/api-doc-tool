'use client';

import { useEffect, useState, useMemo } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { HTTP_METHODS, CONTACT_API_DEFAULTS } from '@/lib/constants';

interface ApiDetails {
  endpoint: string;
  method: string;
  requestBody: string;
  response: string;
  notes: string;
}

interface Props {
  value: ApiDetails;
  onChange: (details: ApiDetails) => void;
  onSubApiDetailChange?: (subApiId: string, details: ApiDetails) => void;
  category?: string;
  subApi?: string;
  accountId?: string;
  accessToken?: string;
}

const FORM_API_BASE = 'https://api.hsforms.com/submissions/v3/integration/secure/submit';

function buildFormEndpoint(accountId: string, formId: string): string {
  return `${FORM_API_BASE}/${accountId}/${formId}`;
}

interface FieldOption {
  label: string;
  value: string;
}

interface FormField {
  name: string;
  label: string;
  objectTypeId: string;
  required: boolean;
  hidden: boolean;
  fieldType: string;
  options: FieldOption[];
}

// HubSpot contact property from the properties API
interface ContactProperty {
  name: string;
  label: string;
  type: string;
  fieldType: string;
  description: string;
  groupName: string;
  createdBy: string;
  usedPercentage: number | null;
  options: FieldOption[];
}

function FieldInput({ field, value, onChange }: { field: FormField; value: string; onChange: (val: string) => void }) {
  const label = field.required ? `${field.label} *` : field.label;
  const id = `field-${field.name}`;

  switch (field.fieldType) {
    case 'select':
    case 'radio':
      return (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors bg-white"
          >
            <option value="">Select {field.label}...</option>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );

    case 'checkbox':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <div className="flex flex-wrap gap-2">
            {field.options.map((o) => {
              const selected = value.split(';').filter(Boolean);
              const isChecked = selected.includes(o.value);
              return (
                <label key={o.value} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const updated = isChecked
                        ? selected.filter((v) => v !== o.value)
                        : [...selected, o.value];
                      onChange(updated.join(';'));
                    }}
                    className="rounded border-gray-300"
                  />
                  {o.label}
                </label>
              );
            })}
          </div>
          {value && <p className="text-xs text-gray-400 mt-1">Value: {value}</p>}
        </div>
      );

    case 'booleancheckbox':
      return (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={() => onChange(value === 'true' ? 'false' : 'true')}
              className="rounded border-gray-300"
            />
            {label}
          </label>
        </div>
      );

    case 'number':
      return (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            id={id}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
          />
        </div>
      );

    case 'date':
      return (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            id={id}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
          />
        </div>
      );

    case 'datetime':
      return (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            id={id}
            type="datetime-local"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
          />
        </div>
      );

    case 'phonenumber':
      return (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            id={id}
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
          />
        </div>
      );

    default: // text, file, etc.
      return (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
          />
        </div>
      );
  }
}

function buildRequestBody(
  fields: FormField[],
  requiredValues: Record<string, string>,
  subscriptionTypeId: number | string
): string {
  const fieldEntries = fields.map((f) => {
    const val = requiredValues[f.name] || '';
    let comment = f.required ? `Required - ${f.label}` : `Pass the ${f.label} value here`;
    // Add available options info for select/radio/checkbox
    if (f.options.length > 0 && ['select', 'radio', 'checkbox'].includes(f.fieldType)) {
      const optionValues = f.options.map((o) => o.value).join(', ');
      comment += ` [Options: ${optionValues}]`;
    }
    if (f.fieldType === 'booleancheckbox') {
      comment += ` [true/false]`;
    }
    if (f.fieldType === 'date') {
      comment += ` [Format: YYYY-MM-DD]`;
    }
    if (f.fieldType === 'datetime') {
      comment += ` [Format: YYYY-MM-DDTHH:mm]`;
    }
    return `        {\n            "objectTypeId": "${f.objectTypeId}",\n            "name": "${f.name}",\n            "value": "${val}" // ${comment}\n        }`;
  });

  return `{
    "fields": [
${fieldEntries.join(',\n')}
    ],
    "context": {
        "hutk": "${requiredValues['__hutk'] || ''}", //pass the cookie value of "hubspotutk"
        "pageUri": "www.example.com", // static. Pass the url of the page where the form is submitted
        "pageName": "example page" // static. Pass the name of the page here
    },
    "legalConsentOptions": {
        "consent": {
            "consentToProcess": true,
            "text": "I agree to allow Example to store and process my personal data.", // if you need, you can change this based on your microsite
            "communications": [
                {
                    "value": true,
                    "subscriptionTypeId": ${subscriptionTypeId},
                    "text": "I agree to receive marketing communications from Example." // if you need, you can change this based on your microsite
                }
            ]
        }
    }
}`;
}

// Properties modal component
function PropertiesModal({
  properties,
  selectedProperties,
  onToggle,
  onClose,
}: {
  properties: ContactProperty[];
  selectedProperties: string[];
  onToggle: (name: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return properties;
    const q = search.toLowerCase();
    return properties.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.groupName.toLowerCase().includes(q)
    );
  }, [properties, search]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Contact Properties ({properties.length})
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
            >
              X
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties by label or internal name..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            {selectedProperties.length} selected | Click a row to add/remove from request body
          </p>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600 w-10"></th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Label</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Internal Name</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Used</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Field Type</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Created By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isSelected = selectedProperties.includes(p.name);
                const pct = p.usedPercentage;
                const barColor =
                  pct === null ? 'bg-gray-200'
                    : pct >= 70 ? 'bg-green-500'
                    : pct >= 30 ? 'bg-amber-400'
                    : pct > 0 ? 'bg-red-400'
                    : 'bg-gray-200';
                return (
                  <tr
                    key={p.name}
                    onClick={() => onToggle(p.name)}
                    className={`cursor-pointer border-b border-gray-100 transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(p.name)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">{p.label}</td>
                    <td className="px-4 py-2 text-gray-600 font-mono text-xs">{p.name}</td>
                    <td className="px-4 py-2 w-28">
                      {pct !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-9 text-right">{pct}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {p.fieldType}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{p.createdBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-8">No properties found</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Done ({selectedProperties.length} selected)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Step6ApiDetails({ value, onChange, onSubApiDetailChange, category, subApi, accountId, accessToken }: Props) {
  const categories = category ? category.split(',') : [];
  const subApis = subApi ? subApi.split(',') : [];
  const isFormApi = categories.includes('form');
  const isContactApi = categories.includes('contact');
  const hasSearchApi = subApis.includes('search');
  // Sub-APIs that have property-based request bodies (Add Properties button)
  const PROPERTY_SUB_APIS = ['create-or-update', 'create', 'update', 'conflict-update-by-id', 'conflict-update-by-email'];
  const [formId, setFormId] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [subTypeId, setSubTypeId] = useState<number | string>('SUBSCRIPTION_TYPE_ID');
  const [requiredValues, setRequiredValues] = useState<Record<string, string>>({});
  const [fetched, setFetched] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchInitialized, setSearchInitialized] = useState(false);
  // OTP Sent state (per sub-API via perSubApiRequiredField for email, separate for OTP value)
  const [perSubApiOtpValue, setPerSubApiOtpValue] = useState<Record<string, string>>({});
  const [otpEmailId, setOtpEmailId] = useState('');
  const [otpPropertyName, setOtpPropertyName] = useState('');
  const [activeContactSubApi, setActiveContactSubApi] = useState(subApis[0] || '');

  // 409 Conflict state — two inner APIs (by Contact ID / by Email)
  const [activeConflictTab, setActiveConflictTab] = useState<'conflict-update-by-id' | 'conflict-update-by-email'>('conflict-update-by-id');
  const [conflictRequiredFields, setConflictRequiredFields] = useState<Record<string, string>>({});
  const [conflictSelectedProps, setConflictSelectedProps] = useState<Record<string, string[]>>({});
  const [conflictPropValues, setConflictPropValues] = useState<Record<string, Record<string, string>>>({});

  // Event sub-API state — supports multiple events
  interface EventEntry {
    eventName: string;
    properties: { name: string; label: string; type: string; description: string }[];
    selectedProps: string[];
    propValues: Record<string, string>;
    fetching: boolean;
    fetched: boolean;
    fetchError: string;
  }
  const [eventEntries, setEventEntries] = useState<EventEntry[]>([]);
  const [eventContactId, setEventContactId] = useState('');
  const [showEventPropsModal, setShowEventPropsModal] = useState<number | null>(null); // index of event entry
  const [eventPropsSearch, setEventPropsSearch] = useState('');

  // Per sub-API state: each sub-API has its own required field, selected properties, and values
  const [perSubApiRequiredField, setPerSubApiRequiredField] = useState<Record<string, string>>({});
  const [contactInitialized, setContactInitialized] = useState<Record<string, boolean>>({});
  const [contactProperties, setContactProperties] = useState<ContactProperty[]>([]);
  const [perSubApiSelectedProps, setPerSubApiSelectedProps] = useState<Record<string, string[]>>({});
  const [perSubApiPropValues, setPerSubApiPropValues] = useState<Record<string, Record<string, string>>>({});
  const [fetchingProperties, setFetchingProperties] = useState(false);
  const [propertiesFetched, setPropertiesFetched] = useState(false);
  const [propsFetchError, setPropsFetchError] = useState('');
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);

  // Getters for current sub-API state
  const contactRequiredFieldValue = perSubApiRequiredField[activeContactSubApi] || '';
  const selectedPropertyNames = perSubApiSelectedProps[activeContactSubApi] || [];
  const propertyValues = perSubApiPropValues[activeContactSubApi] || {};

  const requiredFields = fields.filter((f) => f.required);
  const optionalFields = fields.filter((f) => !f.required);

  // Extract formId from endpoint on initial load
  useEffect(() => {
    if (isFormApi && value.endpoint) {
      const parts = value.endpoint.split('/');
      const id = parts[parts.length - 1];
      if (id && id !== accountId) {
        setFormId(id);
      }
    }
  }, []);

  const update = (field: keyof ApiDetails, val: string) => {
    const updated = { ...value, [field]: val };
    onChange(updated);
    // Also store for the active sub-API
    if (isContactApi && activeContactSubApi) {
      onSubApiDetailChange?.(activeContactSubApi, updated);
    }
  };

  const handleFormIdChange = (newFormId: string) => {
    setFormId(newFormId);
    const endpoint = buildFormEndpoint(accountId || '', newFormId);
    onChange({ ...value, endpoint, method: 'POST' });
    setFields([]);
    setFetched(false);
    setRequiredValues({});
    setFetchError('');
  };

  // Rebuild request body whenever required values change
  const rebuildBody = (currentFields: FormField[], currentValues: Record<string, string>, currentSubId: number | string) => {
    const requestBody = buildRequestBody(currentFields, currentValues, currentSubId);
    const endpoint = buildFormEndpoint(accountId || '', formId);
    const defaultResponse = `{\n    "inlineMessage": "Thanks for submitting the form."\n}`;
    const details = { endpoint, method: 'POST', requestBody, response: defaultResponse, notes: value.notes };
    onChange({ ...value, ...details });
    // Store form details in subApiDetailsMap for multi-API docs
    onSubApiDetailChange?.('submit-form', details);
  };

  const handleRequiredValueChange = (fieldName: string, fieldValue: string) => {
    const updated = { ...requiredValues, [fieldName]: fieldValue };
    setRequiredValues(updated);
    rebuildBody(fields, updated, subTypeId);
  };

  const fetchFormFields = async () => {
    if (!formId || !accessToken) return;

    setFetching(true);
    setFetchError('');
    setFields([]);
    setFetched(false);
    setRequiredValues({});

    try {
      const res = await fetch('/api/hubspot/form-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, accessToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error || 'Failed to fetch fields');
        return;
      }

      const fetchedFields: FormField[] = data.fields;
      const fetchedSubId: number | string = data.subscriptionTypeId || 'SUBSCRIPTION_TYPE_ID';

      setFields(fetchedFields);
      setSubTypeId(fetchedSubId);
      setFetched(true);

      // Initialize required values as empty
      const initValues: Record<string, string> = {};
      fetchedFields.filter((f) => f.required).forEach((f) => { initValues[f.name] = ''; });
      setRequiredValues(initValues);

      // Build initial body
      const requestBody = buildRequestBody(fetchedFields, initValues, fetchedSubId);
      const endpoint = buildFormEndpoint(accountId || '', formId);
      const defaultResponse = `{\n    "inlineMessage": "Thanks for submitting the form."\n}`;
      onChange({ ...value, endpoint, method: 'POST', requestBody, response: defaultResponse });
    } catch {
      setFetchError('Failed to fetch form fields');
    } finally {
      setFetching(false);
    }
  };

  // Auto-set method to POST for form API
  useEffect(() => {
    if (isFormApi && !value.method) {
      onChange({ ...value, method: 'POST' });
    }
  }, [isFormApi]);

  // Auto-fill for first contact sub-API on mount and store initial details for all
  useEffect(() => {
    if (!isContactApi || !subApis.length) return;
    const firstSubApi = subApis[0];
    if (contactInitialized[firstSubApi]) return;

    // Initialize details for ALL selected sub-APIs
    for (const sa of subApis) {
      const def = CONTACT_API_DEFAULTS[sa];
      if (def) {
        const ep = typeof def.endpoint === 'function' ? def.endpoint('') : def.endpoint;
        onSubApiDetailChange?.(sa, {
          endpoint: ep,
          method: def.method,
          requestBody: def.buildRequestBody(''),
          response: def.sampleResponse,
          notes: '',
        });
      }
    }

    const defaults = CONTACT_API_DEFAULTS[firstSubApi];
    if (defaults) {
      setContactInitialized((prev) => ({ ...prev, [firstSubApi]: true }));
      setActiveContactSubApi(firstSubApi);
      const endpoint = typeof defaults.endpoint === 'function' ? defaults.endpoint('') : defaults.endpoint;
      onChange({
        ...value,
        endpoint,
        method: defaults.method,
        requestBody: defaults.buildRequestBody(''),
        response: defaults.sampleResponse,
      });
    }
  }, [isContactApi, subApis.length]);

  // Update request body when phone number changes (for search API)
  const handlePhoneChange = (phone: string) => {
    setPhoneNumber(phone);
    const defaults = CONTACT_API_DEFAULTS['search'];
    if (defaults) {
      const endpoint = typeof defaults.endpoint === 'function' ? defaults.endpoint(phone) : defaults.endpoint;
      const details = {
        endpoint,
        method: defaults.method,
        requestBody: defaults.buildRequestBody(phone),
        response: value.response || defaults.sampleResponse,
        notes: value.notes,
      };
      onChange({ ...value, ...details });
      onSubApiDetailChange?.('search', details);
    }
  };

  // Update request body when OTP fields change — builds from user-entered values only
  const rebuildOtpDetails = (recipientEmail: string, otpValue: string, emailId: string, propName: string) => {
    const contactProps: Record<string, string> = {};
    if (propName) {
      contactProps[propName] = otpValue;
    }
    const requestBody = JSON.stringify({
      emailId: emailId ? Number(emailId) || emailId : '',
      message: {
        to: recipientEmail,
      },
      contactProperties: contactProps,
    }, null, 4);
    const details = {
      endpoint: 'https://api.hubapi.com/marketing/v4/email/single-send',
      method: 'POST',
      requestBody,
      response: value.response || '',
      notes: value.notes,
    };
    onChange({ ...value, ...details });
    onSubApiDetailChange?.('otp-sent', details);
  };

  const handleOtpEmailChange = (email: string) => {
    setPerSubApiRequiredField((prev) => ({ ...prev, 'otp-sent': email }));
    rebuildOtpDetails(email, perSubApiOtpValue['otp-sent'] || '', otpEmailId, otpPropertyName);
  };

  const handleOtpValueChange = (otp: string) => {
    setPerSubApiOtpValue((prev) => ({ ...prev, 'otp-sent': otp }));
    rebuildOtpDetails(perSubApiRequiredField['otp-sent'] || '', otp, otpEmailId, otpPropertyName);
  };

  const handleOtpEmailIdChange = (id: string) => {
    setOtpEmailId(id);
    rebuildOtpDetails(perSubApiRequiredField['otp-sent'] || '', perSubApiOtpValue['otp-sent'] || '', id, otpPropertyName);
  };

  const handleOtpPropertyNameChange = (name: string) => {
    setOtpPropertyName(name);
    rebuildOtpDetails(perSubApiRequiredField['otp-sent'] || '', perSubApiOtpValue['otp-sent'] || '', otpEmailId, name);
  };

  // === 409 Conflict handlers ===
  const buildConflictRequestBody = (tabId: string, reqVal: string, propNames: string[], propVals: Record<string, string>) => {
    const defaults = CONTACT_API_DEFAULTS[tabId];
    if (!defaults) return;
    const properties = propNames.map((name) => ({ property: name, value: propVals[name] || '' }));
    const endpoint = typeof defaults.endpoint === 'function' ? defaults.endpoint(reqVal) : defaults.endpoint;
    const details = {
      endpoint,
      method: defaults.method,
      requestBody: defaults.buildRequestBody(reqVal, properties),
      response: value.response || '',
      notes: value.notes,
    };
    onChange({ ...value, ...details });
    onSubApiDetailChange?.(tabId, details);
  };

  const handleConflictRequiredFieldChange = (val: string) => {
    setConflictRequiredFields((prev) => ({ ...prev, [activeConflictTab]: val }));
    buildConflictRequestBody(activeConflictTab, val, conflictSelectedProps[activeConflictTab] || [], conflictPropValues[activeConflictTab] || {});
  };

  const handleConflictPropValueChange = (name: string, val: string) => {
    const updated = { ...(conflictPropValues[activeConflictTab] || {}), [name]: val };
    setConflictPropValues((prev) => ({ ...prev, [activeConflictTab]: updated }));
    buildConflictRequestBody(activeConflictTab, conflictRequiredFields[activeConflictTab] || '', conflictSelectedProps[activeConflictTab] || [], updated);
  };

  const toggleConflictProperty = (name: string) => {
    const current = conflictSelectedProps[activeConflictTab] || [];
    const currentVals = { ...(conflictPropValues[activeConflictTab] || {}) };
    let updatedNames: string[];
    if (current.includes(name)) {
      updatedNames = current.filter((n) => n !== name);
      delete currentVals[name];
    } else {
      updatedNames = [...current, name];
    }
    setConflictSelectedProps((prev) => ({ ...prev, [activeConflictTab]: updatedNames }));
    setConflictPropValues((prev) => ({ ...prev, [activeConflictTab]: currentVals }));
    buildConflictRequestBody(activeConflictTab, conflictRequiredFields[activeConflictTab] || '', updatedNames, currentVals);
  };

  const switchConflictTab = (tabId: 'conflict-update-by-id' | 'conflict-update-by-email') => {
    setActiveConflictTab(tabId);
    const defaults = CONTACT_API_DEFAULTS[tabId];
    if (defaults) {
      const reqVal = conflictRequiredFields[tabId] || '';
      const propNames = conflictSelectedProps[tabId] || [];
      const propVals = conflictPropValues[tabId] || {};
      const endpoint = typeof defaults.endpoint === 'function' ? defaults.endpoint(reqVal) : defaults.endpoint;
      const properties = propNames.map((n) => ({ property: n, value: propVals[n] || '' }));
      const details = {
        endpoint,
        method: defaults.method,
        requestBody: defaults.buildRequestBody(reqVal, properties),
        response: value.response || '',
        notes: value.notes,
      };
      onChange({ ...value, ...details });
    }
  };

  // Get selected conflict properties for display
  const conflictSelectedPropDetails = useMemo(() => {
    return (conflictSelectedProps[activeConflictTab] || [])
      .map((name) => contactProperties.find((p) => p.name === name))
      .filter(Boolean) as ContactProperty[];
  }, [activeConflictTab, conflictSelectedProps, contactProperties]);

  // === Event sub-API handlers ===
  const buildEventRequestBody = (entries: EventEntry[], contactId: string) => {
    // Build a combined request body showing all events
    if (entries.length === 0) {
      return JSON.stringify({
        eventName: '',
        properties: {},
        objectId: contactId,
      }, null, 4);
    }
    if (entries.length === 1) {
      const e = entries[0];
      const propsObj: Record<string, string> = {};
      e.selectedProps.forEach((name) => { propsObj[name] = e.propValues[name] || ''; });
      return JSON.stringify({
        eventName: e.eventName,
        properties: propsObj,
        objectId: contactId,
      }, null, 4);
    }
    // Multiple events: show as array of event payloads
    const payloads = entries.map((e) => {
      const propsObj: Record<string, string> = {};
      e.selectedProps.forEach((name) => { propsObj[name] = e.propValues[name] || ''; });
      return {
        eventName: e.eventName,
        properties: propsObj,
        objectId: contactId,
      };
    });
    return JSON.stringify(payloads, null, 4);
  };

  const updateEventDetails = (entries: EventEntry[], contactId: string) => {
    const requestBody = buildEventRequestBody(entries, contactId);
    const details = {
      endpoint: 'https://api.hubapi.com/events/v3/send',
      method: 'POST',
      requestBody,
      response: 'No response body (204 status code)',
      notes: value.notes,
    };
    onChange({ ...value, ...details });
    onSubApiDetailChange?.('event', details);

    // Also store individual event sub-entries in subApiDetailsMap for multi-event docs
    entries.forEach((e, idx) => {
      if (e.eventName) {
        const propsObj: Record<string, string> = {};
        e.selectedProps.forEach((name) => { propsObj[name] = e.propValues[name] || ''; });
        const eventLabel = e.eventName.split('_').slice(1).join('_') || e.eventName;
        onSubApiDetailChange?.(`event-${idx}`, {
          endpoint: 'https://api.hubapi.com/events/v3/send',
          method: 'POST',
          requestBody: JSON.stringify({
            eventName: e.eventName,
            properties: propsObj,
            objectId: contactId,
          }, null, 4),
          response: 'No response body (204 status code)',
          notes: `Event: ${eventLabel}`,
        });
      }
    });
  };

  const addEventEntry = () => {
    const updated = [...eventEntries, {
      eventName: '',
      properties: [],
      selectedProps: [],
      propValues: {},
      fetching: false,
      fetched: false,
      fetchError: '',
    }];
    setEventEntries(updated);
  };

  const removeEventEntry = (idx: number) => {
    const updated = eventEntries.filter((_, i) => i !== idx);
    setEventEntries(updated);
    updateEventDetails(updated, eventContactId);
  };

  const updateEventName = (idx: number, name: string) => {
    const updated = [...eventEntries];
    updated[idx] = { ...updated[idx], eventName: name, properties: [], selectedProps: [], propValues: {}, fetched: false, fetchError: '' };
    setEventEntries(updated);
    updateEventDetails(updated, eventContactId);
  };

  const fetchEventProperties = async (idx: number) => {
    const entry = eventEntries[idx];
    if (!entry.eventName || !accessToken) return;

    const updated = [...eventEntries];
    updated[idx] = { ...updated[idx], fetching: true, fetchError: '' };
    setEventEntries(updated);

    try {
      const res = await fetch('/api/hubspot/event-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, eventName: entry.eventName }),
      });
      const data = await res.json();

      if (!res.ok) {
        const updated2 = [...eventEntries];
        updated2[idx] = { ...updated2[idx], fetching: false, fetchError: data.error || 'Failed to fetch' };
        setEventEntries(updated2);
        return;
      }

      const updated2 = [...eventEntries];
      updated2[idx] = { ...updated2[idx], fetching: false, fetched: true, properties: data.properties || [] };
      setEventEntries(updated2);
    } catch {
      const updated2 = [...eventEntries];
      updated2[idx] = { ...updated2[idx], fetching: false, fetchError: 'Failed to fetch event properties' };
      setEventEntries(updated2);
    }
  };

  const toggleEventProperty = (eventIdx: number, propName: string) => {
    const updated = [...eventEntries];
    const entry = updated[eventIdx];
    let newSelected: string[];
    const newValues = { ...entry.propValues };
    if (entry.selectedProps.includes(propName)) {
      newSelected = entry.selectedProps.filter((n) => n !== propName);
      delete newValues[propName];
    } else {
      newSelected = [...entry.selectedProps, propName];
    }
    updated[eventIdx] = { ...entry, selectedProps: newSelected, propValues: newValues };
    setEventEntries(updated);
    updateEventDetails(updated, eventContactId);
  };

  const updateEventPropValue = (eventIdx: number, propName: string, val: string) => {
    const updated = [...eventEntries];
    const entry = updated[eventIdx];
    updated[eventIdx] = { ...entry, propValues: { ...entry.propValues, [propName]: val } };
    setEventEntries(updated);
    updateEventDetails(updated, eventContactId);
  };

  const handleEventContactIdChange = (id: string) => {
    setEventContactId(id);
    updateEventDetails(eventEntries, id);
  };

  const addManualEventProperty = (eventIdx: number) => {
    const updated = [...eventEntries];
    const entry = updated[eventIdx];
    // Generate a unique placeholder name
    let propName = 'property_name';
    let counter = 1;
    while (entry.selectedProps.includes(propName)) {
      propName = `property_name_${counter}`;
      counter++;
    }
    updated[eventIdx] = { ...entry, selectedProps: [...entry.selectedProps, propName] };
    setEventEntries(updated);
    updateEventDetails(updated, eventContactId);
  };

  const renameManualEventProperty = (eventIdx: number, oldName: string, newName: string) => {
    const updated = [...eventEntries];
    const entry = updated[eventIdx];
    const newSelected = entry.selectedProps.map((n) => n === oldName ? newName : n);
    const newValues = { ...entry.propValues };
    if (oldName in newValues) {
      newValues[newName] = newValues[oldName];
      delete newValues[oldName];
    }
    updated[eventIdx] = { ...entry, selectedProps: newSelected, propValues: newValues };
    setEventEntries(updated);
    updateEventDetails(updated, eventContactId);
  };

  // Initialize event entries with one empty entry when event tab is first activated
  const initEventIfNeeded = () => {
    if (eventEntries.length === 0) {
      setEventEntries([{
        eventName: '',
        properties: [],
        selectedProps: [],
        propValues: {},
        fetching: false,
        fetched: false,
        fetchError: '',
      }]);
    }
  };

  // Generic: build request body for property-based sub-APIs (create-or-update, create, update)
  const buildContactRequestBody = (subApiId: string, reqFieldVal: string, propNames: string[], propVals: Record<string, string>) => {
    const defaults = CONTACT_API_DEFAULTS[subApiId];
    if (!defaults) return;
    const properties = propNames.map((name) => ({
      property: name,
      value: propVals[name] || '',
    }));
    const endpoint = typeof defaults.endpoint === 'function' ? defaults.endpoint(reqFieldVal) : defaults.endpoint;
    const details = {
      endpoint,
      method: defaults.method,
      requestBody: defaults.buildRequestBody(reqFieldVal, properties),
      response: defaults.sampleResponse,
      notes: value.notes,
    };
    onChange({ ...value, ...details });
    onSubApiDetailChange?.(subApiId, details);
  };

  // Handle required field change for property-based sub-APIs
  const handleContactRequiredFieldChange = (val: string) => {
    setPerSubApiRequiredField((prev) => ({ ...prev, [activeContactSubApi]: val }));
    buildContactRequestBody(activeContactSubApi, val, selectedPropertyNames, propertyValues);
  };

  // Handle property value change (per sub-API)
  const handlePropertyValueChange = (name: string, val: string) => {
    const updated = { ...propertyValues, [name]: val };
    setPerSubApiPropValues((prev) => ({ ...prev, [activeContactSubApi]: updated }));
    buildContactRequestBody(activeContactSubApi, contactRequiredFieldValue, selectedPropertyNames, updated);
  };

  // Toggle property selection (per sub-API)
  const toggleProperty = (name: string) => {
    let updatedNames: string[];
    let updatedVals = { ...propertyValues };
    if (selectedPropertyNames.includes(name)) {
      updatedNames = selectedPropertyNames.filter((n) => n !== name);
      delete updatedVals[name];
    } else {
      updatedNames = [...selectedPropertyNames, name];
    }
    setPerSubApiSelectedProps((prev) => ({ ...prev, [activeContactSubApi]: updatedNames }));
    setPerSubApiPropValues((prev) => ({ ...prev, [activeContactSubApi]: updatedVals }));
    buildContactRequestBody(activeContactSubApi, contactRequiredFieldValue, updatedNames, updatedVals);
  };

  // Fetch contact properties
  const fetchContactProperties = async () => {
    if (!accessToken) return;
    setFetchingProperties(true);
    setPropsFetchError('');

    try {
      const res = await fetch('/api/hubspot/contact-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPropsFetchError(data.error || 'Failed to fetch properties');
        return;
      }

      setContactProperties(data.properties);
      setPropertiesFetched(true);
      setShowPropertiesModal(true);
    } catch {
      setPropsFetchError('Failed to fetch contact properties');
    } finally {
      setFetchingProperties(false);
    }
  };

  // Switch active contact sub-API tab — restore that sub-API's own state
  const switchContactSubApi = (sa: string) => {
    setActiveContactSubApi(sa);
    // Conflict sub-API: restore from conflict state
    if (sa === 'conflict') {
      switchConflictTab(activeConflictTab);
      return;
    }
    // Event sub-API: restore from event state
    if (sa === 'event') {
      initEventIfNeeded();
      updateEventDetails(eventEntries.length > 0 ? eventEntries : [{
        eventName: '', properties: [], selectedProps: [], propValues: {},
        fetching: false, fetched: false, fetchError: '',
      }], eventContactId);
      return;
    }
    const defaults = CONTACT_API_DEFAULTS[sa];
    if (defaults) {
      const isPropertyBased = PROPERTY_SUB_APIS.includes(sa);
      const isOtpSent = sa === 'otp-sent';
      const reqVal = perSubApiRequiredField[sa] || '';
      const propNames = perSubApiSelectedProps[sa] || [];
      const propVals = perSubApiPropValues[sa] || {};
      const endpoint = typeof defaults.endpoint === 'function' ? defaults.endpoint(reqVal) : defaults.endpoint;
      let properties: { property: string; value: string }[] | undefined;
      if (isPropertyBased) {
        properties = propNames.map((n) => ({ property: n, value: propVals[n] || '' }));
      } else if (isOtpSent) {
        // Rebuild OTP details from stored state
        rebuildOtpDetails(reqVal, perSubApiOtpValue[sa] || '', otpEmailId, otpPropertyName);
        return;
      }
      const details = {
        endpoint,
        method: defaults.method,
        requestBody: defaults.buildRequestBody(reqVal, properties),
        response: value.response || '',
        notes: value.notes,
      };
      onChange({ ...value, ...details });
    }
  };

  // Get selected property details for display (per active sub-API)
  const selectedProps = useMemo(() => {
    return selectedPropertyNames
      .map((name) => contactProperties.find((p) => p.name === name))
      .filter(Boolean) as ContactProperty[];
  }, [activeContactSubApi, selectedPropertyNames, contactProperties]);

  // Get current sub-API defaults for rendering
  const activeDefaults = CONTACT_API_DEFAULTS[activeContactSubApi];
  const isPropertyBasedSubApi = PROPERTY_SUB_APIS.includes(activeContactSubApi);

  // Color schemes for different sub-API types
  const subApiColors: Record<string, { border: string; bg: string; text: string; heading: string }> = {
    'create-or-update': { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-700', heading: 'text-green-900' },
    create: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', heading: 'text-emerald-900' },
    update: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', heading: 'text-amber-900' },
    'otp-sent': { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', heading: 'text-purple-900' },
    'conflict-update-by-id': { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700', heading: 'text-red-900' },
    'conflict-update-by-email': { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-700', heading: 'text-orange-900' },
  };
  const activeColors = subApiColors[activeContactSubApi] || { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-700', heading: 'text-gray-900' };

  // Sub-API display names
  const subApiDisplayNames: Record<string, string> = {
    'create-or-update': 'Create or Update Contact using Email',
    create: 'Create Contact (if contact not found)',
    update: 'Update Contact (if contact found)',
    'otp-sent': 'Send OTP Email',
    'conflict-update-by-id': 'Update Contact using Contact ID (409 Conflict)',
    'conflict-update-by-email': 'Update Contact using Email (409 Conflict)',
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">API Details</h2>
      <p className="text-sm text-gray-500 mb-6">Enter the API endpoint details and sample payloads.</p>

      {/* API tabs — shown when there are multiple APIs to configure */}
      {((isContactApi && subApis.length > 1) || (isFormApi && isContactApi)) && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {/* Form API tab when both categories selected */}
          {isFormApi && isContactApi && (
            <button
              type="button"
              onClick={() => setActiveContactSubApi('__form__')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeContactSubApi === '__form__'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Form API
            </button>
          )}
          {subApis.map((sa) => (
            <button
              key={sa}
              type="button"
              onClick={() => switchContactSubApi(sa)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeContactSubApi === sa
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {sa.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4 max-w-2xl">
        {/* Contact Search API — phone number input + pre-filled fields */}
        {isContactApi && activeContactSubApi === 'search' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Search Contact by Phone Number</h3>
              <p className="text-xs text-blue-700 mb-3">Enter a phone number to search for contacts. The endpoint and request body are pre-filled.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL (pre-filled)</label>
              <div className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-700 font-mono break-all">
                {value.endpoint}
              </div>
            </div>

            <div className="flex gap-4 items-end">
              <div className="w-36">
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <div className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-700 font-medium">
                  {value.method}
                </div>
              </div>
              <div className="flex-1">
                <Input
                  label="Phone Number *"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="123456789"
                />
              </div>
            </div>

            <p className="text-xs text-blue-600">Use the Test API button on the Preview step to get the actual response.</p>
          </div>
        )}

        {/* Contact OTP Sent sub-API */}
        {isContactApi && activeContactSubApi === 'otp-sent' && (
          <div key="otp-sent" className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-purple-900 mb-1">Send OTP Email</h3>
              <p className="text-xs text-purple-700 mb-3">
                Send a single-send email with an OTP value. Fill in all fields below to build the request body.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL (pre-filled)</label>
              <div className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm text-gray-700 font-mono break-all">
                {value.endpoint}
              </div>
            </div>

            <div className="flex gap-4 items-end">
              <div className="w-36">
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <div className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm text-gray-700 font-medium">
                  {value.method}
                </div>
              </div>
              <div className="flex-1">
                <Input
                  label="Email ID (emailId) *"
                  id="otpEmailId"
                  value={otpEmailId}
                  onChange={(e) => handleOtpEmailIdChange(e.target.value)}
                  placeholder="Enter the HubSpot email ID"
                />
              </div>
            </div>

            <div>
              <Input
                label="Recipient Email (message.to) *"
                id="otpRecipientEmail"
                value={perSubApiRequiredField['otp-sent'] || ''}
                onChange={(e) => handleOtpEmailChange(e.target.value)}
                placeholder="Enter recipient email"
              />
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  label="Contact Property Name *"
                  id="otpPropertyName"
                  value={otpPropertyName}
                  onChange={(e) => handleOtpPropertyNameChange(e.target.value)}
                  placeholder="Enter the contact property name for OTP"
                />
              </div>
              <div className="flex-1">
                <Input
                  label="OTP Value *"
                  id="otpValue"
                  value={perSubApiOtpValue['otp-sent'] || ''}
                  onChange={(e) => handleOtpValueChange(e.target.value)}
                  placeholder="Enter OTP value"
                />
              </div>
            </div>
          </div>
        )}

        {/* 409 Conflict sub-API — two inner tabs */}
        {isContactApi && activeContactSubApi === 'conflict' && (() => {
          const conflictTabs: { id: 'conflict-update-by-id' | 'conflict-update-by-email'; label: string; reqLabel: string; reqPlaceholder: string }[] = [
            { id: 'conflict-update-by-id', label: 'Update by Contact ID', reqLabel: 'Contact ID *', reqPlaceholder: 'Enter contact ID' },
            { id: 'conflict-update-by-email', label: 'Update by Email', reqLabel: 'Email Address *', reqPlaceholder: 'Enter email address' },
          ];
          const activeTab = conflictTabs.find((t) => t.id === activeConflictTab) || conflictTabs[0];
          const defaults = CONTACT_API_DEFAULTS[activeConflictTab];
          const currentEndpoint = defaults
            ? (typeof defaults.endpoint === 'function' ? defaults.endpoint(conflictRequiredFields[activeConflictTab] || '') : defaults.endpoint)
            : '';
          const currentProps = conflictSelectedProps[activeConflictTab] || [];
          const currentVals = conflictPropValues[activeConflictTab] || {};

          return (
          <div key="conflict" className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-red-900 mb-1">409 Conflict — Update Contact</h3>
              <p className="text-xs text-red-700 mb-3">
                When you get a 409 Conflict response, use these APIs to update the contact by Contact ID or Email.
              </p>
            </div>

            {/* Inner tabs */}
            <div className="flex gap-2">
              {conflictTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchConflictTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeConflictTab === tab.id
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-red-700 border border-red-300 hover:bg-red-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div key={activeConflictTab} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                <div className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-700 font-mono break-all">
                  {currentEndpoint}
                </div>
              </div>

              <div className="flex gap-4 items-end">
                <div className="w-36">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <div className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-700 font-medium">
                    PATCH
                  </div>
                </div>
                <div className="flex-1">
                  <Input
                    label={activeTab.reqLabel}
                    id={`conflict-req-${activeConflictTab}`}
                    value={conflictRequiredFields[activeConflictTab] || ''}
                    onChange={(e) => handleConflictRequiredFieldChange(e.target.value)}
                    placeholder={activeTab.reqPlaceholder}
                  />
                </div>
              </div>

              {/* Add Properties button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (propertiesFetched) {
                      setShowPropertiesModal(true);
                    } else {
                      fetchContactProperties();
                    }
                  }}
                  disabled={fetchingProperties || !accessToken}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {fetchingProperties ? 'Fetching...' : propertiesFetched ? `Add Properties (${contactProperties.length} available)` : 'Add Properties'}
                </button>
                {propsFetchError && <p className="text-red-500 text-xs">{propsFetchError}</p>}
              </div>

              {/* Selected properties */}
              {currentProps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">Selected Properties ({currentProps.length}):</p>
                  {currentProps.map((propName) => {
                    const prop = contactProperties.find((p) => p.name === propName);
                    return (
                      <div key={`${activeConflictTab}-${propName}`} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {prop?.label || propName} <span className="text-gray-400 font-mono">({propName})</span>
                          </label>
                          <input
                            type="text"
                            value={currentVals[propName] || ''}
                            onChange={(e) => handleConflictPropValueChange(propName, e.target.value)}
                            placeholder={`Enter ${(prop?.label || propName).toLowerCase()}`}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleConflictProperty(propName)}
                          className="px-2 py-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                          title="Remove property"
                        >
                          X
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* Contact Event sub-API — multiple events with property fetching */}
        {isContactApi && activeContactSubApi === 'event' && (
          <div key="event" className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-indigo-900 mb-1">Events API</h3>
              <p className="text-xs text-indigo-700 mb-3">
                Add one or more events. Enter the event name, then either fetch properties from HubSpot or add them manually.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL (pre-filled)</label>
              <div className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-gray-700 font-mono break-all">
                https://api.hubapi.com/events/v3/send
              </div>
            </div>

            <div className="flex gap-4 items-end">
              <div className="w-36">
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <div className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-gray-700 font-medium">
                  POST
                </div>
              </div>
              <div className="flex-1">
                <Input
                  label="Contact ID (objectId) *"
                  id="eventContactId"
                  value={eventContactId}
                  onChange={(e) => handleEventContactIdChange(e.target.value)}
                  placeholder="158289596169"
                />
              </div>
            </div>

            {/* Event entries */}
            {eventEntries.map((entry, idx) => (
              <div key={idx} className="rounded-lg border border-indigo-300 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-indigo-800">
                    Event {eventEntries.length > 1 ? `#${idx + 1}` : ''}
                  </h4>
                  {eventEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEventEntry(idx)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Event name + fetch button */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      label="Event Name *"
                      id={`eventName-${idx}`}
                      value={entry.eventName}
                      onChange={(e) => updateEventName(idx, e.target.value)}
                      placeholder="pe5686032_oreo_world_cup_2026_login_signup_event"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchEventProperties(idx)}
                    disabled={!entry.eventName || !accessToken || entry.fetching}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {entry.fetching ? 'Fetching...' : 'Fetch Properties'}
                  </button>
                </div>

                {/* Fetch properties OR add manually */}
                {entry.fetchError && (
                  <div className="text-xs">
                    <p className="text-amber-600">{entry.fetchError}</p>
                    <p className="text-gray-500 mt-1">You can add properties manually below.</p>
                  </div>
                )}
                {entry.fetched && (
                  <p className="text-green-600 text-xs">{entry.properties.length} properties found.</p>
                )}

                {/* Select properties button (when fetched from API) */}
                {entry.fetched && entry.properties.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowEventPropsModal(idx)}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    Select Properties ({entry.selectedProps.length} / {entry.properties.length} selected)
                  </button>
                )}

                {/* Add property manually button */}
                <button
                  type="button"
                  onClick={() => addManualEventProperty(idx)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-colors"
                >
                  + Add Property Manually
                </button>

                {/* Selected / manual property values */}
                {entry.selectedProps.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600">Properties ({entry.selectedProps.length}):</p>
                    {entry.selectedProps.map((propName) => {
                      const prop = entry.properties.find((p) => p.name === propName);
                      const isManual = !prop;
                      return (
                        <div key={`${idx}-${propName}`} className="flex gap-2 items-end">
                          {isManual ? (
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Property Name</label>
                              <input
                                type="text"
                                value={propName}
                                onChange={(e) => renameManualEventProperty(idx, propName, e.target.value)}
                                placeholder="property_name"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors font-mono"
                              />
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                {prop.label} <span className="text-gray-400 font-mono">({propName})</span>
                              </label>
                            </div>
                          )}
                          <div className="flex-1">
                            {isManual && (
                              <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
                            )}
                            <input
                              type="text"
                              value={entry.propValues[propName] || ''}
                              onChange={(e) => updateEventPropValue(idx, propName, e.target.value)}
                              placeholder={isManual ? 'value' : `Enter ${(prop?.label || propName).toLowerCase()}`}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleEventProperty(idx, propName)}
                            className="px-2 py-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                            title="Remove property"
                          >
                            X
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Add another event button */}
            <button
              type="button"
              onClick={addEventEntry}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border-2 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-100 transition-colors w-full justify-center"
            >
              + Add Another Event
            </button>
          </div>
        )}

        {/* Event Properties Selection Modal */}
        {showEventPropsModal !== null && eventEntries[showEventPropsModal] && (() => {
          const modalEntry = eventEntries[showEventPropsModal];
          const q = eventPropsSearch.toLowerCase();
          const filteredProps = q
            ? modalEntry.properties.filter((p) => p.label.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q))
            : modalEntry.properties;
          return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Event Properties ({modalEntry.properties.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => { setShowEventPropsModal(null); setEventPropsSearch(''); }}
                    className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
                  >
                    X
                  </button>
                </div>
                <input
                  type="text"
                  value={eventPropsSearch}
                  onChange={(e) => setEventPropsSearch(e.target.value)}
                  placeholder="Search properties by label or internal name..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {modalEntry.selectedProps.length} selected | Click a row to add/remove
                </p>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600 w-10"></th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Label</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Internal Name</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProps.map((p) => {
                      const isSelected = modalEntry.selectedProps.includes(p.name);
                      return (
                        <tr
                          key={p.name}
                          onClick={() => toggleEventProperty(showEventPropsModal, p.name)}
                          className={`cursor-pointer border-b border-gray-100 transition-colors ${
                            isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleEventProperty(showEventPropsModal, p.name)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2 font-medium text-gray-900">{p.label}</td>
                          <td className="px-4 py-2 text-gray-600 font-mono text-xs">{p.name}</td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {p.type}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProps.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-gray-400 py-8">No properties found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => { setShowEventPropsModal(null); setEventPropsSearch(''); }}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Done ({modalEntry.selectedProps.length} selected)
                </button>
              </div>
            </div>
          </div>
          );
        })()}

        {/* Property-based sub-APIs (Create, Update, Conflict Update, etc.) */}
        {isContactApi && isPropertyBasedSubApi && activeDefaults && (
          <div key={activeContactSubApi} className={`rounded-lg border ${activeColors.border} ${activeColors.bg} p-4 space-y-4`}>
            <div>
              <h3 className={`text-sm font-semibold ${activeColors.heading} mb-1`}>
                {subApiDisplayNames[activeContactSubApi] || activeContactSubApi}
              </h3>
              <p className={`text-xs ${activeColors.text} mb-3`}>
                Enter the {activeDefaults.requiredField?.label.toLowerCase()} (required).
                {typeof activeDefaults.endpoint === 'function' ? ' The endpoint URL updates automatically.' : ''} Add properties to include in the request body.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endpoint URL {typeof activeDefaults.endpoint === 'function' ? '(auto-generated)' : '(pre-filled)'}
              </label>
              <div className={`w-full rounded-lg border ${activeColors.border} bg-white px-3 py-2 text-sm text-gray-700 font-mono break-all`}>
                {value.endpoint}
              </div>
            </div>

            <div className="flex gap-4 items-end">
              <div className="w-36">
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <div className={`w-full rounded-lg border ${activeColors.border} bg-white px-3 py-2 text-sm text-gray-700 font-medium`}>
                  {value.method}
                </div>
              </div>
              <div className="flex-1">
                <Input
                  label={`${activeDefaults.requiredField?.label || 'Required Field'} *`}
                  id={`contactRequiredField-${activeContactSubApi}`}
                  value={contactRequiredFieldValue}
                  onChange={(e) => handleContactRequiredFieldChange(e.target.value)}
                  placeholder={activeDefaults.requiredField?.placeholder || ''}
                />
              </div>
            </div>

            {/* Add Properties button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (propertiesFetched) {
                    setShowPropertiesModal(true);
                  } else {
                    fetchContactProperties();
                  }
                }}
                disabled={fetchingProperties || !accessToken}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {fetchingProperties ? 'Fetching...' : propertiesFetched ? `Add Properties (${contactProperties.length} available)` : 'Add Properties'}
              </button>
              {propsFetchError && <p className="text-red-500 text-xs">{propsFetchError}</p>}
            </div>

            {/* Selected properties as input fields */}
            {selectedProps.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Selected Properties ({selectedProps.length}):</p>
                <div className="space-y-2">
                  {selectedProps.map((prop) => (
                    <div key={`${activeContactSubApi}-${prop.name}`} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {prop.label} <span className="text-gray-400 font-mono">({prop.name})</span>
                        </label>
                        <input
                          type="text"
                          value={propertyValues[prop.name] || ''}
                          onChange={(e) => handlePropertyValueChange(prop.name, e.target.value)}
                          placeholder={`Enter ${prop.label.toLowerCase()}`}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleProperty(prop.name)}
                        className="px-2 py-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                        title="Remove property"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form API section */}
        {((isFormApi && !isContactApi) || (isFormApi && isContactApi && activeContactSubApi === '__form__')) && (
          <div className="flex gap-4">
            <div className="w-36">
              <Select
                label="Method"
                id="method"
                value={value.method}
                onChange={(e) => update('method', e.target.value)}
                options={HTTP_METHODS.map(m => ({ value: m, label: m }))}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="formId" className="block text-sm font-medium text-gray-700 mb-1">Form ID</label>
              <div className="flex gap-2">
                <input
                  id="formId"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                  value={formId}
                  onChange={(e) => handleFormIdChange(e.target.value)}
                  placeholder="7c9e9ac7-1cd1-430c-ac68-c8db62453cc1"
                />
                <button
                  type="button"
                  onClick={fetchFormFields}
                  disabled={!formId || !accessToken || fetching}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {fetching ? 'Fetching...' : 'Fetch Fields'}
                </button>
              </div>
              {fetchError && <p className="text-red-500 text-xs mt-1">{fetchError}</p>}
              {fetched && <p className="text-green-600 text-xs mt-1">{fields.length} fields fetched. {requiredFields.length > 0 ? `Fill in ${requiredFields.length} required field(s) below.` : 'Request body generated.'}</p>}
            </div>
          </div>
        )}

        {/* Generic method + endpoint for non-configured APIs */}
        {((!isFormApi && !isContactApi) || (isContactApi && !CONTACT_API_DEFAULTS[activeContactSubApi] && activeContactSubApi !== '__form__' && activeContactSubApi !== 'conflict')) && (
          <div className="flex gap-4">
            <div className="w-36">
              <Select
                label="Method"
                id="method"
                value={value.method}
                onChange={(e) => update('method', e.target.value)}
                options={HTTP_METHODS.map(m => ({ value: m, label: m }))}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Endpoint URL"
                id="endpoint"
                value={value.endpoint}
                onChange={(e) => update('endpoint', e.target.value)}
                placeholder="https://api.example.com/v1/resource"
              />
            </div>
          </div>
        )}

        {((isFormApi && !isContactApi) || (isFormApi && isContactApi && activeContactSubApi === '__form__')) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL (auto-generated)</label>
            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 font-mono break-all">
              {value.endpoint || `${FORM_API_BASE}/${accountId || '{AccountId}'}/{'{FormId}'}`}
            </div>
          </div>
        )}

        {/* Required field inputs after fetch */}
        {((isFormApi && !isContactApi) || (isFormApi && isContactApi && activeContactSubApi === '__form__')) && fetched && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
            <p className="text-sm font-medium text-amber-800">Required Fields — enter sample values:</p>
            {requiredFields.map((f) => (
              <FieldInput
                key={f.name}
                field={f}
                value={requiredValues[f.name] || ''}
                onChange={(val) => handleRequiredValueChange(f.name, val)}
              />
            ))}
            <Input
              label="hutk (hubspotutk cookie) *"
              id="req-hutk"
              value={requiredValues['__hutk'] || ''}
              onChange={(e) => handleRequiredValueChange('__hutk', e.target.value)}
              placeholder="1da13634e1605f07c2d4f6e89fcf1bd0"
            />
          </div>
        )}

        {/* Optional field inputs */}
        {((isFormApi && !isContactApi) || (isFormApi && isContactApi && activeContactSubApi === '__form__')) && fetched && optionalFields.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              {showOptional ? '▾ Hide' : '▸ Show'} optional fields ({optionalFields.length})
            </button>
            {showOptional && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-600">Optional Fields — enter sample values:</p>
                {optionalFields.map((f) => (
                  <FieldInput
                    key={f.name}
                    field={f}
                    value={requiredValues[f.name] || ''}
                    onChange={(val) => handleRequiredValueChange(f.name, val)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <Textarea
          label="Request Body (JSON)"
          id="requestBody"
          value={value.requestBody}
          onChange={(e) => update('requestBody', e.target.value)}
          placeholder='{"key": "value"}'
          rows={12}
        />
        <Textarea
          label="Response (JSON)"
          id="response"
          value={value.response}
          onChange={(e) => update('response', e.target.value)}
          placeholder='{"status": "success", "data": {}}'
        />
        <Textarea
          label="Notes (optional)"
          id="notes"
          value={value.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Any additional notes about this API..."
          rows={3}
        />
      </div>

      {/* Properties Modal */}
      {showPropertiesModal && (
        <PropertiesModal
          properties={contactProperties}
          selectedProperties={activeContactSubApi === 'conflict' ? (conflictSelectedProps[activeConflictTab] || []) : selectedPropertyNames}
          onToggle={activeContactSubApi === 'conflict' ? toggleConflictProperty : toggleProperty}
          onClose={() => setShowPropertiesModal(false)}
        />
      )}
    </div>
  );
}
