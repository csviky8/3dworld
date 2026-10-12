# Metaweb — Australian CRM World

A real-data React / Three.js workspace for the existing Metaweb CRM. An interactive Australian miniature world provides spatial navigation; the searchable directory is the complete interface for every record returned in the current snapshot.

## Run and validate

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
```

The local Vite proxy forwards `/api` and `/sanctum` to the configured Laravel installation (`http://localhost/metaweb` by default). `.env.local` is ignored. Never put credentials or private keys in `VITE_` variables: they are browser-visible.

## Real user workflows

- **Overview:** a balanced sample of customers, leads, quotations, contracts, services, tickets, staff and teams on the map. All loaded records remain searchable in the directory.
- **My work:** records whose explicit ownership IDs or exact owner/assignee/account-manager labels match the authenticated user, plus their staff profile. Missing ownership is not inferred. This is a snapshot, not a complete task queue.
- **People:** actual staff and team records. Staff workspaces and team pavilions represent actual records, without inferred reporting relationships.
- **Customers:** account summaries and their API-supplied related records.
- **Attention:** records the API marks red or amber. The actual status remains visible; no invented SLA, risk score, presence, productivity metric or workload is shown.
- **Workflow modules:** shortcuts to permitted leads, quotes, contracts, onboarding/services and tickets. Counts in this navigation represent loaded records, not conversion rates.
- **Details:** selecting a record loads details/customer relationships with loading, retry, unavailable and expired-session states. Selecting a person shows available owned records. Stale responses are cancelled and keyed to the selected record/session.
- **Refresh:** explicitly reloads the session, authorized snapshot and permitted team directory. A failed refresh retains the previous snapshot and its timestamp.

Authentication uses email OTP and the existing Laravel Sanctum web session, including the CSRF cookie/header. A failed logout stays visible rather than silently pretending that the server session ended. Live mode is the default; illustrative demo mode requires `VITE_METAWEB_LIVE_AUTH=false`. The live sign-in does not offer a role picker or fake writes.

## World and accessibility

The post-login scene is procedural 3D geometry with sunlit terrain, forests, sandy coastline, rocky inland ridges, ocean shading, glass/metal materials, reflection lighting, soft shadows and Tasmania. Eight regional navigation anchors connect to a central company HQ. Fixed regional landmarks are geographic navigation hubs, not businesses or staff. Separate record buildings represent actual returned records. The existing login scene is preserved separately in `WelcomeScene.jsx`.

Explicit Australian location fields map records to states. The current backend snapshot omits these fields, so records appear in the central **Company workspace / location not supplied** area (the Unassigned filter). Workflow `state_name`, record names and business-name mentions never determine geography. Regional counts include every loaded record, while the 3D scene shows a balanced sample of up to 48 filtered records plus the selection. Building heights distinguish record types, not financial value or employee seniority.

The post-login canvas renders on demand to avoid continuous GPU work while idle. Selection and reset use interruptible camera easing; reduced-motion or pause skips the animation. The responsive directory remains a complete alternative to the scene, with search, type/location filters, keyboard shortcut `/`, detail retry states, and an accessible guide. No remote model or environment assets are required. Fonts have system fallbacks.

The original reference remains at `public/references/australian-world-approved.png`; it is not used as a background. The map is a schematic company navigation surface, not a geographic or property map.

## API contract and genuine limitations

The application calls:

```text
GET  /sanctum/csrf-cookie
POST /api/crm/auth/request-otp
POST /api/crm/auth/verify-otp
GET  /api/crm/me
GET  /api/crm/world
GET  /api/crm/world/teams
GET  /api/crm/world/search?q=...
GET  /api/crm/world/record/{id}
GET  /api/crm/customer360/{id}
POST /api/crm/logout
```

The world response's user/module list includes the server-provided `teams` capability, unlike the older `/me` payload. The UI combines these authenticated payloads and filters every record by its module. Backend authorization remains the actual security boundary.

Backend work is still required for:

1. Explicit geographic fields, stable owner IDs, team membership and reporting lines. Exact display-name ownership matching is a compatibility fallback and cannot disambiguate duplicate staff names.
2. Contacts, write actions, workflow transitions and realtime events. No supported endpoints exist in the inspected CRM contract; the UI does not simulate successful writes or streaming updates.
3. Full permission-scoped search, pagination and direct detail lookup outside the initial snapshot. The current Laravel search/detail routes operate on an overview limited to 20 rows per main module and 30 services. A related record can be valid but absent from the detail endpoint's snapshot; the UI explains this and preserves its summary.
4. Production access review: the teams directory currently returns a broad authenticated staff directory; customer overview scoping and inactive-user rules also require server-side review against the intended policy. The frontend does not claim to fix server authorization.
5. OTP response normalization: successful and unknown-email response bodies still differ. Existing rate limiting, single-use consumption and session regeneration are preserved, but enumeration protection needs correction in Laravel.

No neighboring Laravel files are modified by this frontend rework. Database migrations, mail delivery and backend changes should be made only in the appropriate approved development environment. The original workspace notes reported a missing OTP migration against a staging-named database; current migration state must be verified independently before any migration is run.

## Deployment

`npm run build` writes `dist`. Serve it with HTTPS and appropriate static caching. Vite's proxy is a development facility, not a production reverse proxy: the web server must route `/api` and `/sanctum` to Laravel, or configure `VITE_METAWEB_API_ROOT` at build time with compatible Sanctum stateful domains, cookie settings and exact credentialed CORS origins.

For hosting under a subpath, set `VITE_METAWEB_BASE_PATH=/3d-metaweb/` (or the actual deployment prefix) before building. Root hosting defaults to `/`. Do not expose the Vite development server as production hosting. No deployment has been performed.

## Main source files

- `src/CrmWorld.jsx` — authenticated workspace, navigation, request lifecycles, directory and detail panels.
- `src/world/AustraliaScene.jsx` — interactive Australian terrain, architecture, movement and controls.
- `src/crm/worldModel.js` — permission filtering, explicit geography/ownership, typed record identity and map sampling.
- `src/metawebApi.js` — cookie-authenticated API client, cancellation, request timeout and response validation.
- `src/CrmWorld.css` — responsive desktop/tablet/mobile UI.
- `tests/*.test.mjs` — built-in Node tests for data semantics, permissions, camera behavior and API failure handling.

Older unused scene helpers are retained to avoid removing unrelated work. Their mixed exports were split so the project lint check can pass.


The first-step natural-world preview is available during development at /artifacts/natural-world.html. It uses no business records, supports regional selection, zoom and reset, and does not bypass CRM authentication. It is not included in the production build.


## Image-matched post-login overview

The default authenticated landing view now uses the selected regenerated artwork at `public/references/meta-world-natural-v2.png`. Its headquarters and eight region labels are accessible, percentage-positioned buttons, so their positions stay aligned when the artwork scales or zooms. The complete 3:2 composition is contained rather than cropped. The record directory starts closed. Region selection opens existing CRM region details; headquarters opens the workspace directory. No city in the artwork is treated as actual customer or employee data.

This landing view is a rendered image with interactive hotspots, not an orbitable 3D model. **Explore 3D** switches to the existing live Three.js world and **Image overview** returns to the artwork. Existing authentication, permissions, API data, and detail workflows remain in use. The development-only `/artifacts/artwork-overview.html` checks this same image component without authentication or business data; it is not an authentication bypass and is not part of the production build.
#   3 d w o r l d  
 