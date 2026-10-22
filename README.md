# Origin Proxy Server Starter (restricted reverse proxy)

This is a deployable Node.js reverse-proxy starter for a **single upstream service you own or are authorized to operate**. It is not an unrestricted web-browsing proxy and does not accept a destination URL from visitors.

## Deploy

1. Push the `proxy-server` folder to a private or public GitHub repository you control (include the license/attribution of any third-party code you add).
2. Create a Node/Docker web service on a host that supports long-running processes (for example, a VM or a compatible app host). GitHub Pages and the static Netlify site cannot run this Node process.
3. Set `UPSTREAM_ORIGIN` in the host's environment variables to a public HTTPS origin you own or are authorized to proxy, e.g. `https://app.example.com`. Do not commit secrets or `.env` files.
4. Deploy with Dockerfile or run `npm install && npm start`. The default port is 3000; the host's `PORT` variable is respected.
5. Check `/healthz`. Forwarded content is available at `/proxy/` plus the path on the configured upstream.
6. Only after the backend is deployed, connect the Origin frontend to its public HTTPS URL if you want a status indicator or an authorized-service link. Do not expose it as an arbitrary URL fetcher.

## Limits and safety

- Fixed `UPSTREAM_ORIGIN`; visitor input cannot choose a target host.
- Local/private upstream hostnames and common private IPv4 ranges are rejected at startup. Keep cloud metadata endpoints and internal networks blocked at the network/firewall layer too.
- GET/HEAD only, rate-limited, Helmet security headers, timeouts.
- This is a basic reverse proxy, not a CroxyProxy replacement. It will not make arbitrary websites work in a browser, and some apps need a dedicated integration or more configuration.
- Do not use it to bypass school/work network policies or access services without authorization.

## Local test

```sh
cd proxy-server
cp .env.example .env
# Edit UPSTREAM_ORIGIN to a public site/service you are authorized to proxy.
npm install
UPSTREAM_ORIGIN=https://app.example.com npm start
# Open http://localhost:3000/healthz
```

## GitHub project researched

[smartfoloo/arsenic](https://github.com/smartfoloo/arsenic) is a separate, fuller Svelte + Node.js proxy project under the Mozilla Public License 2.0. Review its current code, deployment requirements, license, and host rules before deciding to use or fork it. This starter does not bundle Arsenic source code.
