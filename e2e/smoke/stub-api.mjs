// API factice pour la batterie E2E « smoke » (aucune base, aucun secret).
//
// Elle répond comme une API Elintys pour un VISITEUR ANONYME : `/auth/me` et
// `/auth/refresh` renvoient 401, tout le reste 404. Les specs qui ont besoin
// d'un autre contrat le déclarent explicitement avec `page.route()`, qui
// intercepte les requêtes avant qu'elles n'atteignent ce serveur.
//
// Usage : node e2e/smoke/stub-api.mjs   (port STUB_API_PORT, défaut 3999)
import http from 'node:http';

const port = Number(process.env.STUB_API_PORT ?? 3999);
const allowedOrigin = process.env.STUB_API_ALLOWED_ORIGIN ?? 'http://localhost:3000';

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://stub').pathname;
  if (req.method === 'OPTIONS') return send(res, 204);
  if (path === '/api/v1/health') return send(res, 200, { status: 'ok', service: 'elintys-api-stub' });
  if (path === '/api/v1/auth/me' || path === '/api/v1/auth/refresh') {
    return send(res, 401, { statusCode: 401, message: 'Non authentifié.' });
  }
  return send(res, 404, { statusCode: 404, message: 'Ressource absente de l’API factice.', path });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`stub-api listening on http://127.0.0.1:${port}`);
});
