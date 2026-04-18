// By: Colime.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return new Response('<p>about:blank</p>', {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    let targetUrlStr = url.pathname.substring(1) + url.search;

    if (!targetUrlStr.startsWith('http://') && !targetUrlStr.startsWith('https://')) {
      targetUrlStr = 'http://' + targetUrlStr;
    }

    let targetUrl;
    try {
      targetUrl = new URL(targetUrlStr);
    } catch (e) {
      return new Response('Invalid target URL provided.', { status: 400 });
    }

    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', targetUrl.hostname);
    newHeaders.forEach((value, key) => {
        if (key.startsWith('cf-') || key.toLowerCase() === 'x-real-ip') {
            newHeaders.delete(key);
        }
    });

    try {
      const upstreamResponse = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: newHeaders,
        body: request.body,
        redirect: 'follow',
      });

      const responseHeaders = new Headers(upstreamResponse.headers);

      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', '*');
      responseHeaders.set('Access-Control-Allow-Headers', '*');

      responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      responseHeaders.set('Pragma', 'no-cache');
      responseHeaders.set('Expires', '0');
      
      responseHeaders.delete('Content-Security-Policy');
      responseHeaders.delete('X-Frame-Options');

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });

    } catch (error) {
      return new Response('Upstream server fetch failed. Please check the URL and network.', { status: 502 });
    }
  },
};

function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
