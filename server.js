'use strict';
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = Number(process.env.PORT || 3000);
const upstreamRaw = process.env.UPSTREAM_ORIGIN;
if (!upstreamRaw) {
  console.error('Missing UPSTREAM_ORIGIN. Set it to the HTTPS origin of a site/service you own or are authorized to proxy.');
  process.exit(1);
}
let upstream;
try { upstream = new URL(upstreamRaw); } catch { console.error('UPSTREAM_ORIGIN must be a valid URL.'); process.exit(1); }
if (!['http:', 'https:'].includes(upstream.protocol) || upstream.username || upstream.password || upstream.pathname !== '/' || upstream.search || upstream.hash) {
  console.error('UPSTREAM_ORIGIN must be a plain http(s) origin, e.g. https://app.example.com'); process.exit(1);
}
if (upstream.hostname === 'localhost' || upstream.hostname.endsWith('.localhost') || upstream.hostname.endsWith('.local') || /^127\./.test(upstream.hostname) || /^10\./.test(upstream.hostname) || /^192\.168\./.test(upstream.hostname) || /^169\.254\./.test(upstream.hostname) || upstream.hostname === '::1') {
  console.error('Private/local upstreams are blocked. Use a public domain you control.'); process.exit(1);
}
app.disable('x-powered-by');
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 0));
app.use(helmet({ contentSecurityPolicy: false }));
app.get('/healthz', (_req, res) => res.json({ ok: true, service: 'origin-restricted-proxy', upstream: upstream.origin }));
app.use('/proxy', rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Rate limit reached. Try again shortly.' } }));
app.use('/proxy', (req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).json({ error: 'Only GET and HEAD are supported.' });
  next();
}, createProxyMiddleware({
  target: upstream.origin,
  changeOrigin: true,
  xfwd: false,
  secure: true,
  proxyTimeout: 15000,
  timeout: 20000,
  on: {
    error: (_err, _req, res) => { if (!res.headersSent) res.status(502).json({ error: 'Upstream request failed.' }); }
  }
}));
app.get('/', (_req, res) => res.type('text').send('Origin restricted proxy is running. Health: /healthz. Authorized upstream path: /proxy/…'));
app.listen(port, '0.0.0.0', () => console.log(`Origin restricted proxy listening on ${port}; upstream ${upstream.origin}`));
