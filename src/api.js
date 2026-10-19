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

// sessionStorage is per tab, so two adjusters can be logged in side by side (handy for the race demo).
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

async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const session = loadSession();
  if (session) headers.Authorization = `Bearer ${session.token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
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
    if (response.status === 401 && session) {
      clearSession();
      window.dispatchEvent(new Event('session-expired'));
    }
    throw new ApiError(response.status, data?.message || `שגיאה (${response.status})`, data);
  }

  return data;
}

export async function login(username, password) {
  const result = await request('/api/auth/login', { method: 'POST', body: { username, password } });
  const session = { token: result.token, expiresAt: result.expiresAt, employee: result.employee };
  saveSession(session);
  return session;
}

export function register({ fullName, username, password, specializationIds }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: { fullName, username, password, specializationIds },
  });
}

export function getInsuranceTypes() {
  return request('/api/insurance-types');
}

export function getClaims({ page, pageSize, status, handlerId }) {
  const params = new URLSearchParams({ page, pageSize, sortBy: 'CreatedAt', descending: 'true' });
  if (status) params.set('status', status);
  if (handlerId) params.set('handlerId', handlerId);
  return request(`/api/claims?${params}`);
}

/** "Take for handling" = update the claim handler. 409 means another employee won. */
export function takeClaim(claimId, version) {
  return request(`/api/claims/${claimId}/handler`, { method: 'PUT', body: { version } });
}

export function updateClaimStatus(claimId, status, version) {
  return request(`/api/claims/${claimId}/status`, { method: 'PUT', body: { status, version } });
}

/** Flattens field validation errors from a 400 response into readable lines. */
export function validationMessages(error) {
  const errors = error?.body?.errors;
  if (!errors) return [];
  return Object.values(errors).flat();
}
