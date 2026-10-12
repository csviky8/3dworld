const apiRoot = (import.meta.env.VITE_METAWEB_API_ROOT || '').replace(/\/+$/, '')

export const liveAuthEnabled = import.meta.env.VITE_METAWEB_LIVE_AUTH !== 'false'

function xsrfToken() {
  const cookie = document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='))
  if (!cookie) return ''

  try {
    return decodeURIComponent(cookie.slice('XSRF-TOKEN='.length))
  } catch {
    return cookie.slice('XSRF-TOKEN='.length)
  }
}

async function jsonRequest(path, options = {}) {
  const { headers, ...requestOptions } = options
  const response = await boundedFetch(`${apiRoot}${path}`, {
    ...requestOptions,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(xsrfToken() ? { 'X-XSRF-TOKEN': xsrfToken() } : {}),
      ...headers,
    },
  })

  const payload = response.status === 204 ? {} : await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(payload?.message || `Metaweb request failed (${response.status}).`)
    error.status = response.status
    throw error
  }

  if (!payload || typeof payload !== 'object') throw new Error('The CRM returned an invalid response. Check the API connection and try again.')
  return payload
}

async function boundedFetch(url, options = {}) {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  if (options.signal?.aborted) controller.abort()
  options.signal?.addEventListener('abort', cancel, { once: true })
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, 20000)
  try { return await fetch(url, { ...options, signal: controller.signal }) }
  catch (error) {
    if (timedOut) throw new Error('The CRM took too long to respond. Please try again.', { cause: error })
    throw error
  } finally { clearTimeout(timer); options.signal?.removeEventListener('abort', cancel) }
}

async function requestCsrfCookie() {
  const response = await boundedFetch(`${apiRoot}/sanctum/csrf-cookie`, { credentials: 'include' })
  if (!response.ok) throw new Error('Could not initialize the secure Laravel session.')
}

export async function requestMetawebOtp(email) {
  await requestCsrfCookie()
  return jsonRequest('/api/crm/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function verifyMetawebOtp(email, otp) {
  return jsonRequest('/api/crm/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
}

export function getMetawebSession(options) {
  return jsonRequest('/api/crm/me', options)
}

export function getMetawebWorld(options) {
  return jsonRequest('/api/crm/world', options)
}

export function logoutFromMetaweb() {
  return jsonRequest('/api/crm/logout', { method: 'POST' })
}

export function getMetawebDirectory() {
  return jsonRequest('/api/crm/world/directory')
}

export function searchMetawebWorld(query, options) {
  return jsonRequest(`/api/crm/world/search?q=${encodeURIComponent(query)}`, options)
}

export function getMetawebRecord(id, options) {
  return jsonRequest(`/api/crm/world/record/${encodeURIComponent(id)}`, options)
}

export function getMetawebTeams(options) {
  return jsonRequest('/api/crm/world/teams', options)
}

export function getMetawebCustomer360(id, options) {
  return jsonRequest(`/api/crm/customer360/${encodeURIComponent(id)}`, options)
}
