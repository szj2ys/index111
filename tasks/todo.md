# Index111 Full Redesign — Implementation Plan

## Phase 1: Auth & Foundation
- [ ] Set up NextAuth v5 with Google OAuth (GSC scopes)
- [ ] Update auth.ts to use real session
- [ ] Protect dashboard routes
- [ ] Store Google tokens in user record
- [ ] Test login/logout flow end-to-end

## Phase 2: Landing Page
- [ ] Build hero section with headline + CTA
- [ ] Build Wall of Love (testimonials)
- [ ] Build Pricing section (3 tiers)
- [ ] Build FAQ accordion
- [ ] Build footer
- [ ] Make fully responsive

## Phase 3: Dashboard Redesign
- [ ] New layout with design system
- [ ] Real stats cards (sites, URLs, indexed, submissions)
- [ ] Trend chart (7-day history)
- [ ] Recent activity table with expandable errors
- [ ] Onboarding banner for GSC connection
- [ ] Quick action buttons

## Phase 4: Sites & URL Management
- [ ] Redesign sites list as cards
- [ ] Auto-submit toggle
- [ ] Site detail page with URL table
- [ ] Per-URL submit button
- [ ] Per-URL status refresh
- [ ] Submit-all button

## Phase 5: Index Status Integration
- [ ] GSC API status check endpoint
- [ ] Status badges (indexed/not_indexed/pending/unknown)
- [ ] Auto-refresh after submit
- [ ] Dashboard "Indexed" stat from real data

## Phase 6: Polish
- [ ] Loading states
- [ ] Error toasts
- [ ] Empty states
- [ ] Mobile responsiveness
- [ ] Final visual pass

## Verification
- [ ] All pages render correctly
- [ ] Auth flow works
- [ ] Site addition works
- [ ] URL submission works
- [ ] Status checking works
- [ ] Responsive on mobile
