const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function getCookieValue(cookieHeader, key) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((item) => item.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${key}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function html(body, headers = {}) {
  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      ...headers
    }
  });
}

function buildHandshakeScript(payloadExpression) {
  return `
<script>
(function () {
  const provider = 'github';

  function sendMessage(message) {
    if (window.opener) {
      window.opener.postMessage(message, '*');
    }
  }

  function waitForHandshakeThenSend(finalMessage) {
    const onMessage = function (event) {
      if (event.data !== 'authorizing:' + provider) return;
      window.removeEventListener('message', onMessage);
      sendMessage(finalMessage);
      setTimeout(function () { window.close(); }, 300);
    };

    window.addEventListener('message', onMessage);
    sendMessage('authorizing:' + provider);
  }

  const payload = ${payloadExpression};
  waitForHandshakeThenSend(payload);
})();
</script>`;
}

function authPage({ clientId, scope, state, redirectUri }) {
  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', scope || 'repo');
  authorizeUrl.searchParams.set('state', state);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OAuth</title>
  </head>
  <body>
    <p>Connexion GitHub en cours...</p>
    ${buildHandshakeScript(`'authorizing:github'`)}
    <script>
      (function () {
        const redirectUrl = ${JSON.stringify(authorizeUrl.toString())};

        const onMessage = function (event) {
          if (event.data !== 'authorizing:github') return;
          window.removeEventListener('message', onMessage);
          window.location.assign(redirectUrl);
        };

        window.addEventListener('message', onMessage);
      })();
    </script>
  </body>
</html>`;
}

function callbackSuccessPage(token) {
  const payload = JSON.stringify({ token, provider: 'github' });
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Auth success</title>
  </head>
  <body>
    <p>Authentification réussie. Tu peux fermer cette fenêtre.</p>
    ${buildHandshakeScript(`'authorization:github:success:' + ${JSON.stringify(payload)}`)}
  </body>
</html>`;
}

function callbackErrorPage(message) {
  const safeMessage = String(message || 'OAuth error');
  const payload = JSON.stringify({ message: safeMessage });
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Auth error</title>
  </head>
  <body>
    <p>Échec d'authentification: ${safeMessage}</p>
    ${buildHandshakeScript(`'authorization:github:error:' + ${JSON.stringify(payload)}`)}
  </body>
</html>`;
}

async function exchangeCodeForToken({ code, clientId, clientSecret, redirectUri }) {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    })
  });

  const payload = await response.json();
  if (!response.ok || payload.error || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || 'Unable to retrieve access token');
  }

  return payload.access_token;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({ ok: true, service: 'decap-oauth' });
    }

    if (url.pathname === '/auth') {
      const provider = url.searchParams.get('provider');
      if (provider !== 'github') {
        return json({ error: 'Only github provider is supported' }, 400);
      }

      if (!env.GITHUB_CLIENT_ID) {
        return json({ error: 'Missing GITHUB_CLIENT_ID secret' }, 500);
      }

      const scope = url.searchParams.get('scope') || 'repo';
      const state = randomState();
      const redirectUri = `${url.origin}/callback`;
      const page = authPage({
        clientId: env.GITHUB_CLIENT_ID,
        scope,
        state,
        redirectUri
      });

      return html(page, {
        'set-cookie': `oauth_state=${encodeURIComponent(state)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
      });
    }

    if (url.pathname === '/callback') {
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');
      if (error) {
        return html(callbackErrorPage(`${error}: ${errorDescription || 'Unknown error'}`));
      }

      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        return json({ error: 'Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET secret' }, 500);
      }

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const cookieState = getCookieValue(request.headers.get('cookie'), 'oauth_state');

      if (!code || !state || !cookieState || state !== cookieState) {
        return html(callbackErrorPage('Invalid OAuth state'));
      }

      try {
        const redirectUri = `${url.origin}/callback`;
        const token = await exchangeCodeForToken({
          code,
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
          redirectUri
        });

        return html(callbackSuccessPage(token), {
          'set-cookie': 'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
        });
      } catch (exchangeError) {
        return html(callbackErrorPage(exchangeError.message || 'Token exchange failed'));
      }
    }

    return new Response('Not found', { status: 404 });
  }
};
