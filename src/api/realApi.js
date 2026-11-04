/** Spring Boot JSON API를 세션 쿠키와 CSRF 토큰으로 호출한다. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let csrfToken = null;

async function readResponse(response) {
  if (response.status === 204) return null;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(body?.message ?? '요청을 처리하지 못했습니다.', response.status);
  }
  return body;
}

export async function getCsrf() {
  const response = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
  const body = await readResponse(response);
  csrfToken = body.token;
  return csrfToken;
}

async function request(path, options = {}) {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers ?? {});
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (isMutation) {
    if (!csrfToken) await getCsrf();
    headers.set('X-XSRF-TOKEN', csrfToken);
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: 'same-origin',
  });
  return readResponse(response);
}

export const signup = (credentials) =>
  request('/api/auth/signup', { method: 'POST', body: JSON.stringify(credentials) });

export const login = (credentials) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });

export const currentUser = () => request('/api/auth/me');

export const logout = () => request('/api/auth/logout', { method: 'POST' });

export const changeNickname = (nickname) =>
  request('/api/users/me/nickname', {
    method: 'PATCH',
    body: JSON.stringify({ nickname }),
  });

export const listChannels = () => request('/api/channels');

export const listMessages = (channelId, { afterId, limit } = {}) => {
  const query = new URLSearchParams();
  if (afterId !== undefined && afterId !== null) query.set('afterId', String(afterId));
  if (limit !== undefined) query.set('limit', String(limit));
  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  return request(`/api/channels/${channelId}/messages${suffix}`);
};

export const createMessage = (channelId, content) =>
  request(`/api/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
