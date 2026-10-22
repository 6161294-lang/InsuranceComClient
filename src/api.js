// Thin wrapper around fetch: adds the JWT to every request and turns error responses
// ({ status, message, correlationId, errors }) into ApiError.

const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const SESSION_KEY = 'insurance-claims.session';

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// sessionStorage is per tab, so two appraisers can be logged in side by side (handy for the race demo).
export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return new Date(session.expiresAt) > new Date() ? session : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

async function request(path, { method = 'GET', body, query } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const session = loadSession();
  if (session) headers.Authorization = `Bearer ${session.token}`;

  let url = `${BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, value);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'לא ניתן להתחבר לשרת. ודאו שהשרת פועל.', null);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // An expired or invalid token on an authenticated request ends the session.
    if (response.status === 401 && session) {
      clearSession();
      window.dispatchEvent(new Event('session-expired'));
    }
    throw new ApiError(response.status, data?.message || `שגיאה (${response.status})`, data);
  }

  return data;
}

// ---------- auth ----------
export async function login(email, password) {
  const result = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  const session = { token: result.token, expiresAt: result.expiresAt, user: result.user };
  saveSession(session);
  return session;
}

export const registerClient = (data) => request('/api/auth/register', { method: 'POST', body: data });

// ---------- insurance types ----------
export const getInsuranceTypes = () => request('/api/insurance-types');
export const createInsuranceType = (data) => request('/api/insurance-types', { method: 'POST', body: data });
export const updateInsuranceType = (id, data) => request(`/api/insurance-types/${id}`, { method: 'PUT', body: data });
export const deleteInsuranceType = (id) => request(`/api/insurance-types/${id}`, { method: 'DELETE' });

// ---------- claims ----------
export const getClaims = (query) => request('/api/claims', { query: { sortBy: 'OpenedAt', descending: true, ...query } });
export const createClaim = (data) => request('/api/claims', { method: 'POST', body: data });
export const updateClaim = (id, data) => request(`/api/claims/${id}`, { method: 'PUT', body: data });
export const deleteClaim = (id) => request(`/api/claims/${id}`, { method: 'DELETE' });

/** "Take for handling" = update the claim handler. 409 means another appraiser won. */
export const takeClaim = (id, version) => request(`/api/claims/${id}/handler`, { method: 'PUT', body: { version } });

/** Cancelling a claim, submitting a draft, approving and rejecting are status updates. */
export const setClaimStatus = (id, status, version) =>
  request(`/api/claims/${id}/status`, { method: 'PUT', body: { status, version } });

// ---------- clients ----------
export const getClients = (query) => request('/api/clients', { query });
export const getClient = (id) => request(`/api/clients/${id}`);
export const updateClient = (id, data) => request(`/api/clients/${id}`, { method: 'PUT', body: data });
export const updateClientInsuranceTypes = (id, insuranceTypeIds) =>
  request(`/api/clients/${id}/insurance-types`, { method: 'PUT', body: { insuranceTypeIds } });

// ---------- referrals ----------
export const getReferrals = (query) => request('/api/referrals', { query });
export const updateReferral = (id, notes) => request(`/api/referrals/${id}`, { method: 'PUT', body: { notes } });

// ---------- employees ----------
export const getEmployees = (query) => request('/api/employees', { query });
export const createEmployee = (data) => request('/api/employees', { method: 'POST', body: data });
export const deleteEmployee = (id) => request(`/api/employees/${id}`, { method: 'DELETE' });

/** Flattens field validation errors from a 400 response into readable lines. */
export function validationMessages(error) {
  const errors = error?.body?.errors;
  if (!errors) return [];
  return Object.values(errors).flat();
}
