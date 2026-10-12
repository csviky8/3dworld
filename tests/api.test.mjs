import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = (await readFile(new URL('../src/metawebApi.js', import.meta.url), 'utf8')).replaceAll('import.meta.env', '({})')
const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('session client preserves custom headers, credentials and encoded CSRF cookie', async () => {
  const originalFetch = globalThis.fetch, originalDocument = globalThis.document
  try {
    globalThis.document = { cookie: 'XSRF-TOKEN=csrf%2Bvalue' }
    let request
    globalThis.fetch = async (url, options) => { request = { url, options }; return new Response('{"user":{}}', { status: 200 }) }
    await api.getMetawebSession({ headers: { 'X-Test': 'yes' } })
    assert.equal(request.options.credentials, 'include')
    assert.equal(request.options.headers.Accept, 'application/json')
    assert.equal(request.options.headers['X-XSRF-TOKEN'], 'csrf+value')
    assert.equal(request.options.headers['X-Test'], 'yes')
  } finally { globalThis.fetch = originalFetch; globalThis.document = originalDocument }
})

test('client rejects HTML success pages instead of inventing an empty snapshot', async () => {
  const originalFetch = globalThis.fetch, originalDocument = globalThis.document
  try {
    globalThis.document = { cookie: '' }
    globalThis.fetch = async () => new Response('<html>Wrong API root</html>', { status: 200 })
    await assert.rejects(api.getMetawebWorld(), /invalid response/)
  } finally { globalThis.fetch = originalFetch; globalThis.document = originalDocument }
})

test('request cancellation reaches fetch and HTTP authentication failures retain status', async () => {
  const originalFetch = globalThis.fetch, originalDocument = globalThis.document
  try {
    globalThis.document = { cookie: '' }
    const controller = new AbortController()
    globalThis.fetch = async (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
    const pending = api.getMetawebRecord('CUS-1', { signal: controller.signal })
    controller.abort()
    await assert.rejects(pending, { name: 'AbortError' })
    globalThis.fetch = async () => new Response('{"message":"Unauthenticated"}', { status: 401 })
    await assert.rejects(api.getMetawebSession(), { status: 401 })
  } finally { globalThis.fetch = originalFetch; globalThis.document = originalDocument }
})
