# Index111 Full Redesign Design Spec

> **Date**: 2026-04-28
> **Scope**: Complete rebuild to match indexrusher.com experience
> **Status**: Ready for implementation

---

## 1. Current State vs Target

### 1.1 IndexRusher (Target)
- **Landing Page**: Hero with "Fast search engine indexing", Product Hunt badge, Wall of Love (testimonials), Pricing tiers, FAQ accordion
- **Auth**: Google Search Console OAuth — single-click login
- **Dashboard**: KPIs, trends, actionable buttons, indexing status visibility
- **Value Loop**: Add site → see URLs → submit → see results → track over time

### 1.2 Index111 (Current)
- No landing page (redirects to dashboard)
- Fake auth (hardcoded demo user)
- Read-only dashboard with static numbers
- No index status checking
- No manual submit buttons
- No trend visualization

---

## 2. Architecture Decisions

### 2.1 Keep
- Next.js 16 App Router + React 19
- Tailwind CSS v4
- Drizzle ORM + SQLite (local dev)
- Google Indexing API integration (`lib/services/google-indexing.ts`)
- Sitemap parsing (`lib/services/sitemap.ts`)
- Existing DB schema (sites, urls, submitLogs, users)

### 2.2 Change
- **Auth**: Replace fake auth with real NextAuth v5 + Google OAuth (with Search Console scope)
- **Pages**: Add Landing Page, redesign Dashboard/Sites/Site Detail
- **Visual Design**: Move from generic slate theme to IndexRusher-inspired dark/light with emerald accents
- **Interactivity**: Add client-side actions (submit URL, refresh status, toggle auto-submit)
- **Data**: Actually query Google for indexing status; show trends over time

### 2.3 New Components
- `LandingPage` — marketing page
- `GoogleSignInButton` — GSC OAuth
- `IndexStatusBadge` — colored status indicator
- `UrlActions` — submit/refresh buttons per URL
- `TrendChart` — simple bar/line chart for submission history
- `StatsCards` — animated KPI cards
- `OnboardingBanner` — prompts to connect GSC if not connected

---

## 3. Page-by-Page Design

### 3.1 Landing Page (`/` — unauthenticated)

**Hero Section**
- Large headline: "Fast search engine indexing"
- Subheadline: "Get your pages indexed by Google in hours, not days"
- CTA button: "Index My Pages Now" → redirects to sign-in
- Product Hunt-style badge (placeholder)

**Social Proof**
- "Wall of Love" section with testimonial cards
- 3-4 fake testimonials with avatars, names, Twitter handles

**Pricing**
- 3 tiers: Free (1 site), Pro (10 sites), Custom
- Simple card layout with feature lists

**FAQ**
- Accordion with 6 common SEO indexing questions

**Footer**
- Links to Blog, Pricing, Contact
- Built by attribution

### 3.2 Sign In (`/auth/signin`)
- Clean centered card
- "Continue with Google Search Console" button
- Uses NextAuth Google provider with `https://www.googleapis.com/auth/webmasters.readonly` + `https://www.googleapis.com/auth/indexing` scopes

### 3.3 Dashboard (`/` — authenticated)

**Header Bar**
- Site logo + nav (Dashboard, Sites)
- User avatar dropdown (profile, logout)
- "MVP Mode" badge removed

**Onboarding Alert** (if no GSC connected)
- Banner: "Connect Google Search Console to start indexing"
- Button to re-auth with GSC scope

**Stats Row**
- 4 cards: Sites | Total URLs | Indexed | Today's Submissions
- Numbers animate on load
- "Indexed" is NEW — queries GSC API for actual status

**Trend Section** (NEW)
- Simple line chart: submissions over last 7 days
- Bars: successful vs failed submissions

**Recent Activity**
- Table of last 10 submit logs
- Shows engine, URL, status, time
- Click to expand error messages

**Quick Actions**
- "Add Site" button (modal)
- "Run Daily Submit Now" button (manual trigger)

### 3.4 Sites (`/sites`)

**Site List**
- Card-based layout (not table)
- Each card: domain, URL count, indexed count, auto-submit toggle
- "View" button → site detail
- "Add Site" floating button

**Empty State**
- Illustration + "Add your first website"

### 3.5 Site Detail (`/sites/[id]`)

**Header**
- Domain name, URL, sitemap link
- Auto-submit toggle
- "Submit All Now" button

**Stats**
- Total URLs | Indexed | Submitted | Pending
- Progress bar: indexed / total

**URL Table**
- Columns: Path | Status | Last Submitted | Submit Count | Actions
- Status: "indexed" (green), "not_indexed" (red), "pending" (yellow), "unknown" (gray)
- Actions: "Submit to Google" button per row
- "Refresh Status" button (queries GSC API)

**Submit Result Toast**
- After manual submit, show success/failure per URL

---

## 4. API Changes

### 4.1 Auth (`lib/auth.ts`)
Replace fake auth with real NextAuth v5:
- Google OAuth provider
- Store `googleAccessToken` and `googleRefreshToken` in user record
- JWT strategy with token refresh
- Required scopes: `openid`, `email`, `profile`, `webmasters.readonly`, `indexing`

### 4.2 New Endpoints
- `POST /api/urls/[id]/submit` — submit single URL
- `POST /api/urls/[id]/status` — check indexing status via GSC API
- `POST /api/sites/[id]/submit-all` — submit all pending URLs for a site
- `POST /api/sites/[id]/toggle-auto` — toggle auto-submit
- `GET /api/stats/trend` — 7-day submission history for charts

### 4.3 Modified Endpoints
- `POST /api/sites` — require real auth; use user's Google token
- `POST /api/submit` — require real auth
- `GET /api/cron/daily-submit` — use real auth

### 4.4 Index Status Query
Use Google Search Console API (not just Indexing API) to check if URL is indexed:
- `searchanalytics.query` with `query` filter for specific URL
- Or use `webmasters.urlTestingTools.run` (Mobile Friendly Test as proxy)
- Fallback: mark as "pending" if submitted but no confirmation

---

## 5. Visual Design System

### 5.1 Colors
```
Primary:    #10b981 (emerald-500)
PrimaryDark:#059669 (emerald-600)
BgLight:    #f8fafc (slate-50)
BgDark:     #0f172a (slate-900)
TextDark:   #1e293b (slate-800)
TextLight:  #64748b (slate-500)
Success:    #22c55e (green-500)
Warning:    #f59e0b (amber-500)
Danger:     #ef4444 (red-500)
```

### 5.2 Typography
- Headlines: `font-bold tracking-tight`
- Body: `text-slate-600`
- Use `text-4xl` for hero, `text-2xl` for page titles

### 5.3 Components Style
- Cards: `bg-white rounded-xl border border-slate-200 shadow-sm`
- Buttons: `rounded-lg font-medium transition-all`
- Primary: `bg-emerald-600 text-white hover:bg-emerald-700`
- Secondary: `border border-slate-300 hover:bg-slate-50`

---

## 6. Data Flow

### 6.1 Adding a Site
1. User clicks "Add Site", enters URL
2. Backend normalizes URL, discovers sitemap
3. Parses sitemap, inserts URLs into DB
4. Shows confirmation with URL count
5. If auto-submit enabled, queues for next daily run

### 6.2 Manual Submit
1. User clicks "Submit" on a URL or "Submit All"
2. Backend validates Google token
3. Calls Google Indexing API for each URL
4. Records result in submitLogs
5. Updates URL's lastSubmittedGoogle + submitCountGoogle
6. Returns results, frontend shows toast

### 6.3 Status Check
1. User clicks "Refresh Status" or auto-check runs
2. Backend queries GSC for URL indexing status
3. Updates `urls.indexStatus`
4. Frontend shows colored badge

---

## 7. Implementation Phases

### Phase 1: Auth & Foundation
- Set up real NextAuth with Google OAuth
- Update user schema if needed
- Create auth middleware for protected routes
- Test login/logout flow

### Phase 2: Landing Page
- Build hero, testimonials, pricing, FAQ sections
- Responsive design
- CTA links to sign-in

### Phase 3: Dashboard Redesign
- Redesign layout with new design system
- Add real stats (query actual data)
- Add trend chart component
- Add onboarding banner for GSC connection

### Phase 4: Sites & URL Management
- Redesign sites list as cards
- Add auto-submit toggle
- Build site detail page with actionable URL table
- Add per-URL submit and status refresh

### Phase 5: Index Status Integration
- Implement GSC status check API
- Add status badges to URL table
- Add "Indexed" stat to dashboard
- Auto-refresh status after submit

### Phase 6: Polish
- Add loading states
- Add error toasts
- Add empty states
- Mobile responsiveness check
- Final visual pass

---

## 8. Testing Plan

- [ ] Landing page renders on mobile/desktop
- [ ] Google OAuth sign-in works
- [ ] Adding a site parses sitemap correctly
- [ ] Manual URL submit calls Google API
- [ ] Status check returns real GSC data
- [ ] Dashboard stats update after actions
- [ ] Auto-submit toggle persists
- [ ] Trend chart shows data
- [ ] All pages responsive

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| GSC API quotas | Rate limit to 20/day for free tier; cache results |
| Google OAuth complexity | Use NextAuth v5 built-in Google provider |
| Index status API unreliable | Fallback to "pending" state; allow manual override |
| Large sitemaps | Cap at 1000 URLs per site (already in schema) |
| Breaking existing data | Keep schema compatible; only add fields |
