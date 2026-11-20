// Only fixed public paths are recorded. Unknown paths may contain personal data.
const publicPaths = new Set([
  '/', '/index.html', '/app.mjs', '/model.mjs', '/style.css',
  '/data.json', '/data-eso.json', '/favicon.ico', '/robots.txt', '/sitemap.xml',
]);

function logFailure(request, status) {
  const pathname = new URL(request.url).pathname;
  console.warn(JSON.stringify({
    event: 'asset_error',
    path: publicPaths.has(pathname) ? pathname : '[other]',
    status,
    timestamp: new Date().toISOString(),
  }));
}

export default {
  async fetch(request, env) {
    let response;
    try {
      // Return the original response without buffering or changing cache headers.
      response = await env.ASSETS.fetch(request);
    } catch {
      // Do not log exception messages: they can include request details.
      logFailure(request, 500);
      return new Response('Internal Server Error', { status: 500 });
    }
    if (response.status >= 400) logFailure(request, response.status);
    return response;
  },
};
