import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.mjs';

// Keep console capture within one sequential test to avoid global-state races.
test('asset responses retain their semantics and error logs exclude sensitive input', async () => {
  const entries = [];
  const originalWarn = console.warn;
  console.warn = message => entries.push(JSON.parse(message));
  try {
    for (const status of [200, 301, 304, 404, 405, 503]) {
      const response = new Response(null, {
        status,
        headers: { 'cache-control': 'public, max-age=600', etag: 'fixture' },
      });
      const request = new Request('https://example.test/favicon.ico?secret=private');
      const result = await worker.fetch(request, {
        ASSETS: { fetch: async received => {
          assert.equal(received, request);
          return response;
        } },
      });
      assert.equal(result, response);
    }
    assert.deepEqual(entries.map(entry => entry.status), [404, 405, 503]);
    for (const entry of entries) {
      assert.deepEqual(Object.keys(entry).sort(), ['event', 'path', 'status', 'timestamp']);
      assert.equal(entry.event, 'asset_error');
      assert.equal(entry.path, '/favicon.ico');
      assert.ok(Number.isFinite(Date.parse(entry.timestamp)));
    }
    const request = new Request('https://example.test/private/person@example.test?token=private', {
      headers: { authorization: 'Bearer private', cookie: 'session=private' },
    });
    await worker.fetch(request, { ASSETS: { fetch: async () => new Response(null, { status: 404 }) } });
    assert.equal(entries.at(-1).path, '[other]');
    const result = await worker.fetch(request, { ASSETS: { fetch: async () => {
      throw new Error('private exception details');
    } } });
    assert.equal(result.status, 500);
    assert.equal(await result.text(), 'Internal Server Error');
    assert.equal(entries.at(-1).status, 500);
    assert.doesNotMatch(JSON.stringify(entries), /private|secret|token|person@|Bearer|session/);
  } finally {
    console.warn = originalWarn;
  }
});
