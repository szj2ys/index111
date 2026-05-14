# Index111 Full Redesign — Implementation Plan

## Phase 1: Auth & Foundation — DONE (guest mode, no login required)
- [x] Remove auth redirects from dashboard layout
- [x] Remove auth checks from all API routes (use default user)
- [x] Ensure default guest user exists in DB
- [x] Remove Settings link from sidebar

## Phase 2: Landing Page — DONE
- [x] Build hero section with headline + CTA
- [x] Build Wall of Love (testimonials)
- [x] Build Pricing section (3 tiers)
- [x] Build FAQ accordion
- [x] Build footer
- [x] Make fully responsive

## Phase 3: Dashboard Redesign — DONE
- [x] New layout with design system
- [x] Real stats cards (sites, URLs, indexed, submissions)
- [x] Trend chart (7-day history)
- [x] Recent activity table with expandable errors
- [x] Onboarding banner for GSC connection
- [x] Quick action buttons

## Phase 4: Sites & URL Management — DONE
- [x] Redesign sites list as cards
- [x] Auto-submit toggle
- [x] Site detail page with URL table
- [x] Per-URL submit button
- [x] Per-URL status refresh
- [x] Submit-all button

## Phase 5: Multi-Engine Support — IN PROGRESS
- [x] Google Indexing API
- [ ] Bing Webmaster API
- [ ] Yandex Webmaster API
- [ ] Per-engine submission tracking
- [ ] Auto-submit to all engines

## Phase 6: Daily Report — PENDING
- [ ] /api/cron/daily-report endpoint
- [ ] Email template
- [ ] Resend integration
- [ ] Report data aggregation

## Phase 7: Polish
- [ ] Loading states
- [ ] Error toasts
- [ ] Empty states
- [ ] Mobile responsiveness
- [ ] Final visual pass with taste skill

## Verification
- [ ] All pages render correctly
- [ ] Add site works
- [ ] URL submission works (all engines)
- [ ] Status checking works
- [ ] Daily report sends
- [ ] Responsive on mobile
