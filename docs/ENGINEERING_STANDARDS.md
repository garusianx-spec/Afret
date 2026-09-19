# Afrat Engineering Standards & Protocols

This is the binding engineering handbook for the Afrat monorepo
(`apps/web`, `apps/realtime`, `packages/core`). It exists because a
maternal-health product carries real consequences for correctness,
privacy, and performance on low-end devices over unreliable networks —
"good enough" is not the bar. Every rule below is enforceable, not
aspirational, and every rule states what to do when the codebase does not
yet comply.

**Status:** adopted 2026-09-19. See [§8 Adoption & Migration](#8-adoption--migration)
for the honest list of pre-existing files that do not yet conform, and the
plan for bringing them into line without a disruptive big-bang rewrite.

---

## 1. Git Workflow & Strategy

### 1.1 Branching

One branch per unit of work, cut from the latest default branch:

```
<type>/<scope>-<short-description>
```

- `type` — one of `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`,
  `build`, `ci` (same vocabulary as commit types, §1.2).
- `scope` — the module or app it touches: `tracker`, `doctor`, `chat`,
  `realtime`, `core`, `pwa`, `auth`.
- `short-description` — kebab-case, 2–5 words, imperative.

```
feat/tracker-who-growth-percentiles
fix/realtime-vitals-sharing-leak
docs/engineering-standards
```

Never commit directly to the default branch. Never force-push a branch
another person has pulled.

### 1.2 Commits — Conventional Commits 1.0.0

```
<type>(<scope>): <summary, imperative, no trailing period>

<body — the *why*, wrapped at ~72 cols, optional>

<footer — BREAKING CHANGE:, Refs:, Co-Authored-By:, optional>
```

Rules:

- **Atomic.** One logical change per commit. A commit that both fixes a bug
  and reformats unrelated files is two commits.
- **Imperative mood.** `add growth percentile engine`, not `added` or
  `adds`.
- **Scope matches the branch scope** where practical (`feat(tracker): …`).
- **`BREAKING CHANGE:` footer** for anything that changes a persisted
  Zustand schema's shape, an API response shape, or a public `packages/core`
  export's signature.
- Body explains *why*, not *what* — the diff already shows what changed.

```
feat(core): add WHO growth-standard percentile engine

Replaces the hand-picked reference-band approximation with real LMS
tables (weianthro.txt/lenanthro.txt) so the growth chart's bands are
the actual WHO Child Growth Standard, not an editorial guess.
```

### 1.3 Pull requests

- Small enough to review in one sitting. A PR that touches more than
  ~400 changed lines outside of generated/data files should be split.
- The description states what changed and why, and lists the manual
  verification performed (which commands were run, which screens were
  checked).
- CI (typecheck, lint, build — see §6) must be green before requesting
  review. A red PR wastes a reviewer's time restating what CI already said.
- Squash-merge onto the default branch; the branch's own commit history is
  for the author's convenience during review, not the permanent record.

---

## 2. Code Architecture & Modularity

### 2.1 Monorepo layout

```
apps/web/         Next.js 15 App Router — the mother/doctor client
apps/realtime/     Fastify 5 + Socket.io 4 — auth, chat, doctor API
packages/core/     Framework-agnostic domain logic shared by both apps
                    (WHO growth math, clinical thresholds, sync schemas)
```

`packages/core` has zero dependency on React, Next, or Fastify. If a
function needs a DOM API, a Zustand store, or a Fastify request, it does
not belong there — it belongs in the app that has that dependency.
`packages/core` ships compiled output (`npm run build --workspace=packages/core`,
wired into the root `postinstall`/`dev`/`build` scripts so it never has to
be remembered by hand) rather than being consumed as raw source — both
`apps/web`'s webpack bundler and `apps/realtime`'s plain-Node production
run need real `.js` files to resolve, not a `moduleResolution: bundler`
type-checker's willingness to paper over a `.ts` file behind a `.js`
import specifier. When actively iterating on `packages/core` itself, run
`npm run build --workspace=packages/core -- --watch` in a second terminal
so consumers pick up changes without a manual rebuild each time.

### 2.2 Module structure (`apps/web/src/modules/<domain>/`)

```
<domain>/
  components/       Presentational + container React components
  hooks/             use<Feature>.ts — stateful logic extracted out of components
  store/             Zustand stores (persisted client state)
  api/               fetch wrappers for this domain's HTTP endpoints
  lib/               Pure calculation/mapping utilities (no React, no fetch)
  data/              Static content (checklist items, article text, tables)
  types.ts           Domain types not already covered by packages/core
```

A component file never reaches into another domain's `store/` directly for
write access — it goes through that domain's exported hook or store
selector. Read-only cross-domain composition (e.g. the Tools tab importing
a Profile-module checklist component) is fine; reaching past a domain's
public surface into its internals is not.

### 2.3 File size and function size

- **250 logical lines per file, hard ceiling.** Comments and blank lines
  count against readability even if a linter doesn't count them against
  the limit — write tight, but the ceiling is on lines as they appear in
  the file.
- **50 lines per function, hard ceiling.** A component's JSX return
  counts as part of the function; if the render is long, extract
  sub-components (see the growth chart's `GrowthChart` →
  `WhoGrowthPanel` → `PercentileChart` split for the pattern).
- **Cyclomatic complexity ≤ 3 per function.** Prefer early returns over
  nested conditionals:

  ```ts
  // Not this:
  function risk(systolic: number, diastolic: number) {
    if (systolic >= 140 || diastolic >= 90) {
      if (systolic >= 160 || diastolic >= 110) return 'urgent';
      return 'watch';
    } else {
      return 'normal';
    }
  }

  // This:
  function risk(systolic: number, diastolic: number) {
    if (systolic >= 160 || diastolic >= 110) return 'urgent';
    if (systolic >= 140 || diastolic >= 90) return 'watch';
    return 'normal';
  }
  ```

- When a file or function is about to cross either ceiling, that is the
  signal to extract — a hook (`use<Feature>.ts`), a pure utility
  (`<feature>.utils.ts` or `lib/<feature>.ts`), a type module
  (`<feature>.types.ts`), or a sub-component, per whichever seam the
  logic actually has. Splitting a file in half at an arbitrary line
  number without a real seam is not compliance, it is obfuscation —
  don't do it.
- Data files (LMS reference tables, curated content lists) are exempt from
  the line-count ceiling — the limit exists to bound *logic* a reviewer
  must hold in their head, not the length of a literal array. Keep pure
  data and the logic that operates on it in separate files regardless
  (`who-growth.data.ts` vs. `who-growth.ts`), so the exemption never
  becomes a hiding place for logic.

### 2.4 Strict TypeScript

- `strict: true` in every `tsconfig.json` in the monorepo. It already is —
  keep it that way.
- **Zero `any`.** `unknown` plus a type guard, a generic, or a Zod-derived
  type instead. If a third-party type is genuinely unknown, isolate the
  `any` behind a single narrow adapter function with a comment explaining
  why, not scattered inline.
- No non-null assertions (`!`) without a comment proving why the value is
  guaranteed — see `who-growth.ts`'s `table[lower]!` for the pattern: prove
  it in a comment, at the point of use, not just in your head.
- Prefer `type` for unions/aliases, `interface` for object shapes that
  might be extended — matches the existing codebase convention.

### 2.5 Zod-first validation

Every runtime boundary is validated, not just typed:

| Boundary | Validate with |
| --- | --- |
| HTTP request body/params (Fastify) | `z.object({...}).safeParse(request.body)` before touching `.data` |
| A payload crossing `apps/web` ↔ `apps/realtime` | A schema in `packages/core` shared by both sides (see `clinical-sync.ts`) so client and server can never silently drift |
| `localStorage`/Zustand `persist` writes that come from a form | Validate at the store's `add`/`save` method, not at the call site — see `babyGrowthStore.ts`'s `growthLogInputSchema` |
| WebSocket event payloads | Validate before dispatching to a handler — never trust a socket frame's shape |
| Environment variables consumed at startup | Parse once at boot (`apps/realtime/src/env.ts`), crash loudly on a bad value rather than limping along with `undefined` |

A Zod schema and its inferred TypeScript type are the single source of
truth for that shape — never hand-write a duplicate `interface` next to a
schema that already produces one via `z.infer<>`.

---

## 3. Security & Access Control

### 3.1 Role-Based Access Control

Roles (`mother`, `doctor`, `midwife`, `nutritionist`, `moderator`, `admin`)
map to a fixed permission set (`ROLE_PERMISSIONS` in
`apps/realtime/src/auth/types.ts`). Rules:

- **Every route that isn't public declares its requirement explicitly** via
  `requireAuth` or `requirePermission('<permission>')` in its Fastify
  `preHandler` — never inferred from "well, only doctors would call this
  URL in the UI." The UI hiding a button is not access control.
- **Ownership checks are separate from permission checks.** Holding
  `consult:respond` proves you are *a* doctor; it does not prove you are
  *this patient's* doctor. Every doctor-scoped endpoint re-derives the
  authorized patient set from the actual room-membership/consult-pair data
  (see `authorizedPatient()` in `doctorRoutes.ts`) before touching that
  patient's record. A doctor's own JWT claims are never sufficient to
  authorize an action on another user's data.
- **The server re-checks consent flags it did not just set.** `PUT
  /api/profile/vitals` re-reads `vitalsSharingEnabled` from the datastore
  rather than trusting the client sent the toggle request first — a stale
  UI or a replayed request must not be able to write data for an account
  that has sharing off.
- New roles or permissions are added to `ROLE_PERMISSIONS` and
  `ROLE_LABELS` together, in the same commit — a role with no label is a
  UI bug waiting to happen; a permission with no role granted it is dead
  code.

### 3.2 Input validation end-to-end

Client-side Zod validation is a UX convenience (fast, localized error
messages); it is never the security boundary. Every mutation the server
accepts is re-validated server-side with its own schema, even when the
client already validated the same shape — see §2.5.

### 3.3 Data minimization

- A field is added to a shared/synced payload only when there is a named
  consumer for it. `journeyMode`/`journeyWeek` and the opt-in clinical-sync
  snapshot (`ClinicalReading`) are the only health-adjacent data that ever
  leave a mother's device — everything else (mood, symptoms, BBT, cervical
  mucus) is local-only by architecture, not by an access-control rule that
  could be misconfigured.
- **Consent is revocable and revocation is destructive.** Turning off
  `vitalsSharingEnabled` deletes the stored snapshot server-side in the
  same request — "stop syncing" and "forget what was already synced" are
  the same action, not two features where only one got built.
- Payloads that accept a list (chat message history, synced readings) cap
  the list length in the Zod schema itself (`clinicalSyncPayloadSchema`'s
  `.max(20)`) — minimization enforced by the type, not by a comment asking
  the client nicely to behave.
- A doctor-facing endpoint returns "not shared" rather than a stale or
  partial snapshot for a patient who has not opted in — there is no
  degraded-but-still-informative response for data that was never
  consented to.

### 3.4 OWASP Top 10 — where each is handled

| Risk | Where |
| --- | --- |
| Broken access control | §3.1 — permission + ownership checks on every route |
| Cryptographic failures | Argon2id for passwords (OWASP 2024 params), JWT access tokens kept in memory only, refresh tokens as HttpOnly/Secure cookies, hashed at rest |
| Injection | Zod validation on every input; no string-built queries anywhere in the stack (the in-memory stores use `Map`/array methods, not a query language) |
| Insecure design | Threat-model consent flows before building them — see the clinical-sync design note in `clinical-sync.ts` reasoning about what must never sync |
| Security misconfiguration | CORS origins from env, not wildcarded; rate limiting per-route tuned to that route's abuse profile (`credentialRateLimit` on auth endpoints) |
| Vulnerable/outdated components | `npm audit` reviewed before merging a dependency bump; no dependency added without checking its last-publish date and download count |
| Auth/session failures | Refresh-token rotation with reuse detection (a replayed rotated token revokes every session on the account) |
| Software/data integrity | Zod at every deploy-relevant boundary (§2.5); service worker precache uses `cache: 'reload'` so a redeploy can't precache a stale offline page |
| Logging/monitoring failures | Structured `pino` logs on the realtime service tagged with `userId`/route; never log a password, token, or raw health reading |
| Server-side request forgery | No endpoint accepts a URL from the client and fetches it server-side; the sole external fetch surface (web push) uses a fixed, configured endpoint |

### 3.5 XSS and content sanitization

- React's default JSX escaping is the baseline — `dangerouslySetInnerHTML`
  is not used anywhere in this codebase, and a PR introducing it needs a
  named reviewer sign-off in the description explaining why escaping isn't
  possible.
- Chat message bodies and doctor-composed prescriptions render as plain
  text nodes, never as HTML — a doctor's free-text field is exactly as
  untrusted as a patient's.
- User-supplied file uploads (milestone photos) are rendered via object
  URLs scoped to `img.src`, never injected into markup as a string.

### 3.6 Rate limiting

- Global per-IP rate limit at the Fastify app level as a floor.
- Credential endpoints (`/api/auth/login`, `/register`, `/change-password`)
  get a tighter, sliding-window limit (`@fastify/rate-limit`, 10/minute) —
  a login endpoint tolerating 20 attempts/minute from one IP is an
  unguarded door, not a chatty API.
- A new endpoint that writes shared/doctor-visible state (a flag, a
  prescription, a vitals snapshot) gets its abuse profile considered
  explicitly before shipping, not left on the global default by omission.

---

## 4. Performance & Core Web Vitals

### 4.1 Budgets

| Metric | Budget | Why this number |
| --- | --- | --- |
| LCP | < 2.0 s | On a throttled 3G-equivalent connection, which is the realistic baseline for this audience, not a fast wifi lab measurement |
| INP | < 150 ms | A tap on a logger button (glucose, mood, kick counter) must feel instant — this is the app's core interaction, dozens of times a day |
| CLS | < 0.05 | A layout shift while a mother is mid-tap on a health-logging form risks a mis-tap on a medical input |

Measured with Lighthouse mobile (throttled) on the actual pages a mother
spends time on — Home, Tracker, Chat — not just the marketing/landing
route. A PR that regresses any of these on a touched page fixes it before
merge, not in a follow-up.

### 4.2 Rendering strategy

- **Server Components by default; `'use client'` only at the leaf that
  actually needs interactivity, state, or a browser API.** This is the
  target for all new code. It is *not* yet true of most of the existing
  app — see §8 for the honest state and the incremental path there.
- A page-level component that is a server component composes client
  islands for the interactive pieces (a form, a chart, a toggle) rather
  than the whole page opting into `'use client'` because one child needs
  it.
- Static informational content (`InfoGuideCard`, article bodies, the
  cord-blood eligibility checklist's copy) has no reason to be inside a
  client boundary at all — only the checklist's own toggle state does.

### 4.3 State management rules

- **Select the narrowest slice a component needs.** `useStore((s) =>
  s.logs)` and derive with `useMemo` in the component, not
  `useStore((s) => s.logs.filter(...))` inline — the inline version
  returns a new array reference every render regardless of whether the
  underlying data changed, which defeats Zustand's reference-equality
  bail-out and re-renders the component on every unrelated store update.
  See `ShareVitalsToggle.tsx` for the corrected pattern and the comment
  explaining why.
- A store that holds a large, frequently-updated collection (chat
  messages, health logs) is never subscribed to as a whole object by a
  component that only reads one derived value from it.
- Cross-cutting non-reactive reads (the socket layer resolving the current
  user id) use `store.getState()` directly rather than a hook, so the
  socket layer's own updates don't trigger component re-renders it has no
  business causing.

### 4.4 Code splitting

- `next/dynamic` for anything with a meaningfully heavy client bundle that
  isn't needed on first paint of its page: the SVG percentile chart engine,
  the background-audio engine (`useBackgroundAudio` plus its player UI),
  and any future rich visualizer. `ssr: false` where the feature is
  inherently browser-only (Web Audio, Media Session).
- A chart or player component is dynamically imported at the call site
  that renders it, with an explicit loading skeleton — not eagerly bundled
  into the page that merely links to the tab containing it.

### 4.5 Fonts and images

- `@font-face` with `font-display: swap`, preloaded only when the file is
  actually present on disk at build time (see `layout.tsx`'s
  `existsSync` guard) — a licensed font that hasn't been dropped in yet
  must never 404 a preload link.
- `next/image` for any raster asset in a Server Component context; a
  `<img>` tag is only acceptable for a client-generated object URL (a
  locally attached photo before it's ever persisted anywhere), and carries
  an eslint-disable comment saying exactly that.

---

## 5. Accessibility, SEO & RTL

### 5.1 WCAG 2.1 AA

- **Contrast.** Every text/background pairing in the design system is
  checked against WCAG AA (4.5:1 body text, 3:1 large text/UI components)
  before it ships — `--afrat-ink` on `--afrat-surface` is verified at
  16.2:1, logged in the token's own comment in `globals.css`. Any new
  color token gets the same treatment, not an eyeballed "looks fine."
- **Touch targets.** Minimum 44×44px (`afrat-tap` utility) on every
  interactive element — a logging app used one-handed, often one-handed
  while holding a baby, cannot have small tap targets.
- **Keyboard/focus.** Every custom interactive element (radio-pill groups,
  the toggle switches) uses the correct ARIA role (`role="radiogroup"` +
  `aria-checked`, `aria-pressed`, `aria-expanded`) and is reachable and
  operable via keyboard, not just touch.
- **No interactive element nested inside another.** A `<button>` inside a
  `<button>` is invalid HTML and unpredictable across browsers — when a
  row needs both a primary tap target and a secondary action (a favorite
  toggle on a list row), they are siblings in a flex container, never
  nested (see `BabyNameCard.tsx`).
- **Pinch-zoom stays enabled.** `maximumScale` in the viewport config is
  never set to `1` — disabling pinch-zoom fails WCAG 1.4.4 and this is a
  health app used by people who may need to zoom.
- **Motion.** Any future animation respects
  `prefers-reduced-motion`.

### 5.2 Semantic markup

- Headings (`h1`–`h3`) reflect actual document structure, not just
  whatever font size was wanted — a `CardTitle` renders a real heading
  element, not a styled `<div>`.
- Lists are `<ul>`/`<ol>`/`<li>`, definitions are `<dl>`/`<dt>`/`<dd>`
  (see the tracker's `Stat` component) — don't reach for a `<div>` grid
  when a semantic element already means what you're building.
- Every meaningful icon has `aria-hidden="true"` (decorative, paired with
  visible text) or an explicit `aria-label` (icon-only control) — never
  neither.

### 5.3 CSS logical properties — mandatory, no exceptions

Persian is RTL. Every spacing/positioning utility is direction-agnostic:

| Never | Always |
| --- | --- |
| `mr-*`, `ml-*` | `me-*` (margin-end), `ms-*` (margin-start) |
| `pr-*`, `pl-*` | `pe-*` (padding-end), `ps-*` (padding-start) |
| `left-*`, `right-*` | `start-*`, `end-*` |
| `text-left`, `text-right` | `text-start`, `text-end` |
| `border-l`, `border-r` | `border-s`, `border-e` |

This is not a style preference — a `pl-3` on an icon that's meant to sit
before the text is on the *wrong side* the moment the layout is RTL, which
it always is here. Tailwind's logical-property utilities exist precisely
so `ps-*`/`pe-*` compile to the correct physical property under `dir="rtl"`
automatically; using the physical utility instead means personally
re-deriving which physical side "start" happens to be, which is exactly
the class of bug a linter should catch (see §6.4 for the enforcement plan).

### 5.4 Typography & numerals

- `IRANYekanWeb` is the only body/heading font family; the `@font-face`
  fallback chain (`Vazirmatn, IRANSans, Tahoma, system-ui, sans-serif`)
  exists only for the brief window before the web font loads or on a
  build where the licensed file hasn't been dropped in — it is not a
  design choice, it's a loading-state fallback.
- **All user-facing numerals are Persian digits** (`toFaDigits`), except
  inside a value that is itself a Latin-alphabet unit or protocol string
  (an `mmHg`/`mg/dL` unit suffix, a raw `mobile` value before display
  formatting). Numbers a mother reads (weeks, doses, dates, percentiles)
  are always `۰۱۲۳۴۵۶۷۸۹`, produced via the shared `toFaDigits`/`toEnDigits`
  pair in `lib/persian.ts` — never hand-rolled digit substitution.
- Dates render in the Jalali calendar (`date-fns-jalali`, via
  `lib/jalali.ts`'s helpers) everywhere a human reads them; ISO strings are
  for storage and the wire only.

---

## 6. Execution Protocol

This is the standard operating procedure for every task, from a one-line
fix to a multi-feature turn. Skipping a step is a choice to make
explicitly and say so, not an oversight.

### 6.1 Understand

1. Read the request fully before touching any file. If a requirement is
   ambiguous and the ambiguity changes the design, ask; if it doesn't
   change the design, make the reasonable call and note the assumption.
2. Locate the actual code the task touches — read the existing
   implementation and its neighbors before writing anything. A change that
   doesn't match the codebase's existing patterns (state management,
   error handling, naming) is a worse change even if it works.
3. For anything touching real-world data (medical reference tables, drug
   interactions, statistics presented as fact), verify against a primary
   source rather than reconstructing from memory. If a number can't be
   verified, it is presented as an estimate/placeholder and labeled as
   such — never as authoritative data it isn't.

### 6.2 Plan

4. For anything non-trivial (3+ files, a new data flow, a new store), name
   the pieces before writing code: which files are new, which existing
   ones change, where the Zod boundary sits, which permission gates the
   new endpoint.
5. Identify what must stay backward compatible (a persisted store's shape
   a real user's browser already has data in, an API response shape a
   deployed client already parses) versus what is safe to change freely.

### 6.3 Implement

6. Write the smallest change that correctly satisfies the requirement —
   §2's file/function-size and Zod rules apply to new code from the first
   draft, not as a cleanup pass afterward.
7. Match existing naming and structural conventions in the module being
   touched over introducing a new pattern, even a marginally "better" one
   — consistency inside one domain beats a locally-optimal file.
8. Real bugs noticed incidentally while working nearby are fixed in the
   same pass if small and clearly in scope; anything larger is flagged
   rather than folded in silently.

### 6.4 Verify — before calling anything done

9. **Typecheck every workspace touched:**
   ```
   npm run typecheck --workspace=packages/core
   npm run typecheck --workspace=apps/web
   npm run typecheck --workspace=apps/realtime
   ```
10. **Lint:** `npm run lint --workspace=apps/web` (ESLint via `next lint`
    today; migrating to the standalone ESLint CLI before Next.js 16 removes
    `next lint` is tracked separately). A lint config addition worth
    making explicit here: an `eslint-plugin-tailwindcss` (or equivalent
    custom rule) rejecting `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-` class
    names outright, so §5.3 is caught in CI rather than in review.
11. **Build:** `npm run build --workspace=apps/web` for any change that
    could affect the production build (new dependency, new route, new
    workspace package wiring) — a clean dev server is not proof a
    production build succeeds.
12. **Runtime-verify UI changes in an actual browser**, not just by
    reading the code: start the dev server(s), exercise the golden path
    and at least one edge case (empty state, error state, the other
    lifecycle mode) for anything touched. Screenshot or describe what was
    actually seen, not what should theoretically render.
13. **Runtime-verify backend changes with real requests** (`curl` against
    the running service, or the actual client) for anything touching auth,
    permissions, or a new endpoint — a type-checked handler that was never
    invoked has not been tested.
14. Re-read your own diff once, adversarially, before considering it done:
    what input would break this? What did the "happy path" test not
    cover?

### 6.5 Report

15. State plainly what changed, what was verified and how, and any known
    gap or caveat — an approximation presented as exact, a feature that
    degrades without a fallback, a file left over the size ceiling. Silence
    on a known limitation is worse than naming it.
16. Git hygiene before any commit: `git status`/`git diff` reviewed for
    anything unintended (a stray debug file, a secret, an unrelated
    formatting pass) before staging. Conventional commit message per §1.2.

---

## 7. Tooling reference

| Command | Runs |
| --- | --- |
| `npm install` | Installs and links workspaces; `postinstall` builds `packages/core` so it's immediately consumable |
| `npm run typecheck` (root) | `tsc --noEmit` across every workspace with a `typecheck` script |
| `npm run lint` | ESLint (`next lint`) for `apps/web` |
| `npm run build` | Builds `packages/core`, then the `apps/web` production build |
| `npm run build:realtime` | Builds `packages/core`, then `apps/realtime`'s `dist/` |
| `npm run dev` / `npm run dev:realtime` | Builds `packages/core` once, then starts the respective local dev server |

`packages/core` has its own `build` and `typecheck` scripts and is picked
up automatically by the root's `--workspaces --if-present` fan-out for
typecheck — a new package added under `packages/` should follow the same
`package.json` shape (compiled `dist/` output, `build` + `typecheck`
scripts) so both apps can depend on it the same way.

---

## 8. Adoption & Migration

This handbook is adopted **today**, for all new code, starting now. It is
**not** retroactively true of the entire existing codebase, and pretending
otherwise would defeat the point of writing it down. The known gap, as of
this adoption date:

**Files currently over the 250-line ceiling** (largest first — audited
2026-09-19):

`useChatSocket.ts` (663), `messageStore.ts` [realtime] (452),
`gateway.ts` (378), `HealthLoggers.tsx` (348), `chatStore.ts` (346),
`authRoutes.ts` (337), `MessageComposer.tsx` (310),
`MessageBubble.tsx` (296), `ChatRoom.tsx` (287),
`useBackgroundAudio.ts` (273), `AuthScreen.tsx` (273),
`GestationOverrideCard.tsx` (272), `TodayHero.tsx` (271),
`chatRoutes.ts` (256).

None of these are being split as a side effect of writing this document —
that would mean refactoring the realtime chat core (the highest-risk,
most load-bearing code in the app) under time pressure with no dedicated
regression pass, which is a worse outcome than a known, tracked gap. The
migration path:

- **No new file is added to this list.** Every file created from this
  adoption date forward complies from its first commit (see the
  Turn-4-and-later feature work — `packages/core`, the growth-chart
  decomposition, the doctor vitals drawer, the tools modules — as the
  worked examples).
- **A file on this list is split the next time it is substantively
  modified** for an unrelated feature or fix — the change that touches it
  brings it into compliance as part of that change, the way
  `tracker/page.tsx` (279 → 47 lines, logic moved into
  `tracker-content/*.tsx`) was handled in this same adoption pass, rather
  than deferred again.
- **A dedicated refactor pass is scheduled, not assumed.** Splitting
  `useChatSocket.ts` and `gateway.ts` in particular needs its own PR with
  a real-device regression pass against the socket reconnect/offline-queue
  behavior specifically, given how much of the app's reliability story
  lives in that file. That PR is tracked, not folded into feature work.
- Similarly, **RSC-by-default (§4.2) is the target for new pages**, not a
  claim that the existing `'use client'`-heavy page tree has been
  converted — that conversion is a deliberate, incremental effort (start
  with the pages that render the most static content: the tools guides,
  the article lists) rather than a flag-day rewrite of a working app.

Treat this section as a living log: when a file above is split or a
`'use client'` boundary is pushed down, remove it from the list in the
same commit.
