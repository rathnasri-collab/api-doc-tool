export const API_CATEGORIES = [
  { id: 'form', label: 'Form API', description: 'APIs for form submission and management' },
  { id: 'contact', label: 'Contact API', description: 'APIs for contact management and operations' },
] as const;

// Default accounts — actual accounts are stored in data/accounts.json
export const DEFAULT_ACCOUNTS = [
  { id: 'india', label: 'India' },
  { id: 'menap', label: 'MENAP' },
  { id: 'sea', label: 'SEA' },
  { id: 'sa', label: 'SA' },
  { id: 'janz', label: 'JANZ' },
];

// Keep ACCOUNTS as alias for backward compat
export const ACCOUNTS = DEFAULT_ACCOUNTS;

export const ENVIRONMENTS = [
  { id: 'staging', label: 'Staging', color: 'amber' },
  { id: 'production', label: 'Production', color: 'green' },
] as const;

export const SUB_APIS: Record<string, { id: string; label: string; description: string }[]> = {
  form: [
    { id: 'submit-form', label: 'Submit Form', description: 'Submit a new form entry' },
    { id: 'get-forms', label: 'Get Forms', description: 'Retrieve form submissions' },
  ],
  contact: [
    { id: 'search', label: 'Search', description: 'Search contacts by criteria' },
    { id: 'create-or-update', label: 'Create or Update using Email', description: 'Create or update a contact using email' },
    { id: 'create', label: 'Create', description: 'Create a new contact (if contact not found)' },
    { id: 'update', label: 'Update', description: 'Update an existing contact (if contact found)' },
    { id: 'conflict', label: '409 Conflict', description: 'Handle 409 conflict — update contact by Contact ID or Email' },
    { id: 'event', label: 'Event', description: 'Manage contact events' },
    { id: 'otp-sent', label: 'OTP Sent', description: 'Send OTP to contact' },
  ],
};

export const HTTP_METHODS = ['GET', 'POST', 'PATCH'] as const;

// Pre-filled defaults for Contact API sub-APIs
export interface ContactApiDefault {
  endpoint: string | ((param: string) => string);
  method: string;
  buildRequestBody: (param: string, properties?: { property: string; value: string }[]) => string;
  sampleResponse: string;
  sampleResponseAlt?: string;
  requiredField?: { label: string; placeholder: string; key: string };
}

export const CONTACT_API_DEFAULTS: Record<string, ContactApiDefault> = {
  search: {
    endpoint: 'https://api.hubapi.com/crm/v3/objects/contacts/search',
    method: 'POST',
    buildRequestBody: (phoneNumber: string) => JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'phone',
              operator: 'EQ',
              value: phoneNumber,
            },
          ],
        },
      ],
    }, null, 4),
    sampleResponse: '',
    sampleResponseAlt: '',
    requiredField: { label: 'Phone Number', placeholder: 'Enter phone number', key: 'phone' },
  },
  'create-or-update': {
    endpoint: (email: string) => `https://api.hubapi.com/contacts/v1/contact/createOrUpdate/email/${email || '{email}'}`,
    method: 'POST',
    buildRequestBody: (_email: string, properties?: { property: string; value: string }[]) => {
      const props = properties && properties.length > 0
        ? properties
        : [
            { property: 'firstname', value: '' },
            { property: 'email', value: '' },
            { property: 'phone', value: '' },
          ];
      return JSON.stringify({ properties: props }, null, 4);
    },
    sampleResponse: '',
    requiredField: { label: 'Email Address', placeholder: 'Enter email address', key: 'email' },
  },
  create: {
    endpoint: 'https://api.hubapi.com/crm/v3/objects/contacts',
    method: 'POST',
    buildRequestBody: (phone: string, properties?: { property: string; value: string }[]) => {
      const propsObj: Record<string, string> = { phone };
      if (properties && properties.length > 0) {
        properties.forEach((p) => { propsObj[p.property] = p.value; });
      }
      return JSON.stringify({ properties: propsObj }, null, 4);
    },
    sampleResponse: '',
    requiredField: { label: 'Phone Number', placeholder: 'Enter phone number', key: 'phone' },
  },
  update: {
    endpoint: (contactId: string) => `https://api.hubapi.com/crm/v3/objects/contacts/${contactId || '{contact_id}'}`,
    method: 'PATCH',
    buildRequestBody: (_contactId: string, properties?: { property: string; value: string }[]) => {
      if (properties && properties.length > 0) {
        const propsObj: Record<string, string> = {};
        properties.forEach((p) => { propsObj[p.property] = p.value; });
        return JSON.stringify({ properties: propsObj }, null, 4);
      }
      return JSON.stringify({
        properties: {},
      }, null, 4);
    },
    sampleResponse: '',
    requiredField: { label: 'Contact ID', placeholder: 'Enter contact ID', key: 'contactId' },
  },
  event: {
    endpoint: 'https://api.hubapi.com/events/v3/send',
    method: 'POST',
    buildRequestBody: (contactId: string, properties?: { property: string; value: string }[]) => {
      const propsObj: Record<string, string> = {};
      if (properties && properties.length > 0) {
        properties.forEach((p) => { propsObj[p.property] = p.value; });
      }
      return JSON.stringify({
        eventName: '',
        properties: propsObj,
        objectId: contactId,
      }, null, 4);
    },
    sampleResponse: 'No response body (204 status code)',
    requiredField: { label: 'Contact ID', placeholder: 'Enter contact ID', key: 'contactId' },
  },
  'conflict-update-by-id': {
    endpoint: (contactId: string) => `https://api.hubapi.com/crm/v3/objects/contacts/${contactId || '{contact_id}'}`,
    method: 'PATCH',
    buildRequestBody: (_contactId: string, properties?: { property: string; value: string }[]) => {
      if (properties && properties.length > 0) {
        const propsObj: Record<string, string> = {};
        properties.forEach((p) => { propsObj[p.property] = p.value; });
        return JSON.stringify({ properties: propsObj }, null, 4);
      }
      return JSON.stringify({ properties: {} }, null, 4);
    },
    sampleResponse: '',
    requiredField: { label: 'Contact ID', placeholder: 'Enter contact ID', key: 'contactId' },
  },
  'conflict-update-by-email': {
    endpoint: (email: string) => `https://api.hubapi.com/crm/v3/objects/contacts/${email || '{email}'}?idProperty=email`,
    method: 'PATCH',
    buildRequestBody: (_email: string, properties?: { property: string; value: string }[]) => {
      if (properties && properties.length > 0) {
        const propsObj: Record<string, string> = {};
        properties.forEach((p) => { propsObj[p.property] = p.value; });
        return JSON.stringify({ properties: propsObj }, null, 4);
      }
      return JSON.stringify({ properties: {} }, null, 4);
    },
    sampleResponse: '',
    requiredField: { label: 'Email Address', placeholder: 'Enter email address', key: 'email' },
  },
  'otp-sent': {
    endpoint: 'https://api.hubapi.com/marketing/v4/email/single-send',
    method: 'POST',
    buildRequestBody: (recipientEmail: string, properties?: { property: string; value: string }[]) => {
      const otp = properties?.find((p) => p.property === 'otp')?.value || '';
      return JSON.stringify({
        emailId: '',
        message: {
          to: recipientEmail || '',
        },
        contactProperties: {
          '': otp,
        },
      }, null, 4);
    },
    sampleResponse: '',
    requiredField: { label: 'Recipient Email', placeholder: 'Enter recipient email', key: 'recipientEmail' },
  },
};

export type ApiCategory = (typeof API_CATEGORIES)[number]['id'];
export type Account = string;
export type Environment = (typeof ENVIRONMENTS)[number]['id'];
export type HttpMethod = (typeof HTTP_METHODS)[number];
