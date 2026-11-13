# SYSTEM.md — RecruAI Frontend Design System Contract (LOCKED)

> **Authority.** This file is the single source of truth for UI consistency across the
> RecruAI web app (`frontend/`). It locks the global shell structure, spacing rhythm,
> button variants, icon sizing, and light/dark contrast rules. Every page, shared
> component, and layout asset must comply. Parallel refactor agents are bound to this
> contract; deviations require a documented reason in the PR/commit.
>
> **Scope.** `frontend/src/**` (React 18 + CRA + Tailwind 3). The `admin/` control plane
> is a separate app and is out of scope for this contract.
>
> **Inherited design language.** The existing token system (below) is the shipped brand
> and wins over any generic checklist. We only fix inconsistencies *within* it — we do
> not redesign the brand.

---

## 1. Design tokens (locked, both themes)

CSS variables live in `frontend/src/index.css` (`:root` = light, `.dark` = dark) and map
to Tailwind colors in `frontend/tailwind.config.js`. **Use tokens only. Never raw
`#hex`, `bg-white`, `border-gray-200`, or `text-black` for shell/surface/type color.**

| Token / class | Meaning | Light | Dark |
|---|---|---|---|
| `surface` / `canvas` | page background | gray-00 (255 255 255) | gray-00 (23 23 23) |
| `ink` | primary text | gray-1k (13 13 13) | gray-1k (250 250 250) |
| gray-500 / gray-600 | muted text (secondary) | cast slate | light slate |
| gray-400 | subtle text / icons (placeholder level) | — | — |
| `line` | hairline borders | gray-200 | gray-100 (51 51 51) |
| `brand` | primary brand green | 0 135 62 | 0 135 62 |
| `brand-text` | text on brand surfaces | 0 116 47 | 82 200 125 |
| `brand-underline` | active underline | 82 192 120 | — |
| `brand/10`, `brand/20` | soft active fills | alpha | alpha |
| `shadow-s5 / s10 / s15` | elevation scale | layered, low-alpha | same scale |

**Rules**
- `bg-white` / `border-gray-200` / `text-black` / raw `#…` **are forbidden** in new or
  normalized code except: (a) image overlays where an explicit white/black surface is the
  design intent (auth glass cards, video controls, avatars), (b) `text-white` **on**
  brand surfaces (button labels), (c) `after:bg-white` toggle knobs (a real white knob on
  a colored track is the pattern).
- Text hierarchy: `text-ink` primary, `text-gray-600`/`text-secondary` secondary,
  `text-gray-400`/`text-subtle` tertiary. Muted body must stay ≥ 4.5:1 against surface;
  use gray-500 for small secondary text, gray-600 for regular secondary text.
- Brand hover: `hover:bg-brand/90` (light + dark). **The arbitrary hover
  `hover:bg-[#009b3f]` and active `active:bg-[#008a38]` are banned** — replace with
  `hover:bg-brand/90` / `active:bg-brand/80`.
- Focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30`
  for buttons; inputs use `focus:border-brand focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-600/50`.
- Elevation: `shadow-s5` default card, `shadow-s10` hover/elevated, `shadow-s15` popover/menu.

### Radius ladder (locked)
| Radius | Class | Use |
|---|---|---|
| 6px | `rounded-md` | compact chips/meta only (existing) |
| 8px | `rounded-lg` | inputs, compact controls |
| 12px | `rounded-xl` | **primary**: buttons, cards, nav items, icon buttons |
| 16px | `rounded-2xl` | large surfaces, media blocks |
| full | `rounded-full` | pills, avatars, badges, toggles |

### Typography (locked)
- Families: `font-sans` = Geist Variable (body/UI), `font-serif` = Instrument Serif
  (display accents on marketing surfaces), `font-mono` = Geist Mono (numbers, data,
  timestamps, badges).
- Scale: page titles `text-lg/text-xl font-bold`; section `h2` `text-sm font-semibold`;
  body `text-sm`; meta `text-xs`; labels `text-[10px]/text-[11px] uppercase tracking-wider`.
- Do not introduce new display sizes inside app surfaces; marketing pages may keep their
  own hero scale.

---

## 2. Global shell structure (locked)

There are exactly **four top-level chrome constructs**. A page may only render inside one
of them; no page may build its own header/sidebar/footer.

### 2.1 `AppShell` — individual workspace (`/feed`, `/in/*`, `/notifications`, `/search`)
- File: `frontend/src/components/layout/AppShell.jsx`. Children: `Sidebar` (left, h-screen
  sticky, w 208/220) + `main` (min-w-0 flex-1, max-w-5xl) + optional `RightRail`
  (w 296/348, border-l) + `MobileNav` (< lg, h-[74px], safe-area) + `ComposeFab`.
- `Sidebar` (`layout/Sidebar.jsx`): single active rail (sliding `useActiveRail`), brand
  lockup, grouped nav, footer meta row (Blog • Careers • Support • Legal + theme toggle +
  © line). **One profile affordance only**: `SignedInAccountBar` lives in `CenterBar`
  (or PageManagerLayout); sidebars do NOT render a second profile pill.
- `CenterBar`: sticky h-14, `border-b border-line`, `bg-surface/95 backdrop-blur-[6px]`,
  back button `h-8 w-8 rounded-xl`, actions right.

### 2.2 `OrgAppShell` — organization workspace (`/org/*`)
- File: `frontend/src/components/layout/OrgAppShell.jsx`. `OrgSidebar` (w 200/212,
  grouped nav, `ORG_NAV`) + `CenterBar` + `main` + optional rail + `OrgMobileNav`.
- When inside `PageManagerContext`, OrgAppShell renders children bare (no double chrome).

### 2.3 `PageManagerLayout` — company-page back office (`/page/*`)
- File: `frontend/src/components/page/PageManagerLayout.jsx`. Own sidebar (w 210/220,
  lucide icons, active rail marker) + mobile drawer + `SignedInAccountBar compact` +
  micro-footer block (Blog/Careers/Support/Legal + theme toggle + ©).
- Logo/identity row in sidebar: single `h-9 w-9` avatar tile + name + role line.

### 2.4 Public & auth shells
- Public pages (`/`, `/about`, `/blog`, `/careers`, `/community`, `/contact`, legal,
  `/status`, search results public shell): `RecruAINavbar` (`components/product/RecruAINavbar.js`)
  + `Footer` (`components/Footer.js`). No other headers/footers on public routes.
- Auth pages (`/signin`, `/register`, `/forgot-password`, `/reset-password`,
  `/accept-invite`): `AuthLayout` (`components/auth/AuthLayout.jsx`).

### 2.5 Remove (dead or duplicate chrome)
These files are unreferenced legacy duplicates — delete after verifying zero imports:
- `components/layout/Header.jsx`, `components/layout/IndividualNavbar.jsx`,
  `components/layout/OrganizationNavbar.jsx`, `components/layout/DashboardFooter.jsx`
- `pages/Dashboard.jsx`, `pages/dashboards/IndividualDashboard.jsx`
- `components/layout/DashboardLayout.jsx` is a thin wrapper used by legacy routes; migrate
  callers to the real shells, then delete.

**No page may render a second sticky header, an inline footer, or a second account pill.
Any duplicated sub-navigation must be removed in favor of the shell nav.**

---

## 3. UI primitives (locked)

> **Cleanup note (2026-11):** unused primitives `ui/Card`, `ui/Chip`, `ui/Tabs`,
> `ui/Segmented`, `ui/StatCard`, `ui/RecommendationCard` were removed during the dead-code
> audit; live card anatomy is `layout/UtilityRail` `RailCard` (below) and the CVAI shell
> components. Keep the grid below aligned with what actually ships.

| Component | Contract |
|---|---|
| `ui/Button` | variants `primary \| secondary \| ghost \| quiet \| dark \| danger`; sizes `sm(8) \| md(9) \| lg(10)`; rounded-xl; `active:scale-[0.98]`. Primary hover `hover:bg-brand/90`. |
| `ui/ButtonLink` | same contract for `<Link>`. |
| `ui/IconButton` | `h-8 w-8 rounded-xl hover:bg-gray-50 hover:text-ink`, required `aria-label`. |
| `ui/Input` | `h-9 rounded-lg border-line bg-surface`, focus per §1. |
| `ui/EmptyState` | icon tile h-20 w-20, gray-50/gray-25, brand dots, `animate-popIn`. |
| `ui/Avatar` | `size` sm/md/lg; ring `ring-1 ring-line`. |
| `layout/UtilityRail` | `RailCard` anatomy: `rounded-xl border border-line bg-surface p-4 shadow-s5`. `QuickLinksCard`/`TipCard`/`StatListCard`/`PeopleCard` only render **data**, never navigation that duplicates the sidebar (§2). |
| Switch/toggle | canonical class string: `peer h-5 w-9 rounded-full bg-gray-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-4 dark:bg-gray-25`. Reuse verbatim everywhere. |

---

## 4. Icons (locked)

- **Approved libraries**: `lucide-react` (preferred for new code) and `react-icons/fi`
  (feather, visually identical stroke family). Keep the two; they render as one family.
- **Forbidden**: `react-icons/fa` (Font Awesome solid) except `ThinkingDisplay.jsx`
  (AI-fluency visual, deliberately distinct); raw FontAwesome `<i class="fa-solid …">`
  markup anywhere.
- **Sizes**:
  - nav items (sidebars, tab bar): `h-4 w-4` (16)
  - mobile bottom nav: `h-5 w-5` (20)
  - inline meta/links: `h-3.5 w-3.5` (14)
  - action buttons / icon buttons: `h-4 w-4` (16) or `h-[18px] w-[18px]` (18)
  - empty-state: `h-7 w-7` (28)
  - pro/section hero icons: `h-5 w-5` (20)
  - normalize `w-4 h-4` (space-inconsistent) to `h-4 w-4` everywhere.
- **Stroke width**: `1.75` default, `2` for active/highlight states (via prop or class).
- **Semantics**: decorative icons get `aria-hidden` + explicit `gap` spacing from labels
  (never a bare whitespace char). Meaningful icons get a text label or `aria-label`.

---

## 5. Spacing & rhythm (locked)

- **Page columns**: shell main content max `max-w-5xl`; page padding `px-4 md:px-6 py-4/5`.
- **Card padding**: `p-4` default, `p-5` rich, `p-6` large surfaces.
- **Stack rhythm**: `space-y-4/5` for page sections; `space-y-3` within cards;
  `gap-2.5` rows in lists; `gap-3` between header/body elements.
- **Section header anatomy**: `flex items-center justify-between gap-3` with
  `text-sm font-semibold text-ink` + optional action (small Button/IconButton).
- **Alignments**: center column content keeps consistent left-edge; avoid mixed
  `justify-center`/`justify-between` for the same component type on one page.

---

## 6. Light/dark mode (locked)

- `.dark` is applied on `<html>` by `ThemeContext`. Every surface must have a dark twin.
- All colors from tokens §1. `dark:` overrides must target the same semantic (e.g.
  `dark:border-line`, `dark:bg-gray-25`, `dark:text-gray-400`).
- **Never** leave `bg-white text-gray-900` shells without dark overrides (the classic
  "white box in dark mode" bug). Audit every card/dialog/menu for its dark state.
- Contrast floor: body ≥ 4.5:1, large text/UI ≥ 3:1 (WCAG 2.2 AA).
- Theme toggle: use `useTheme()` + the sidebar/layout toggle only — one per shell.

---

## 7. Page-group ownership (parallel refactor map)

Agents may edit ONLY their group's files (listed) plus shared files explicitly granted.
Anything else: flag to coordinator.

| Group | Files |
|---|---|
| **G1 Individual** | `pages/individual/**` (all pages + `components/**` incl. `sections/*`), `pages/dashboards/OrganizationDashboard.jsx` is NOT in G1 (it's org), `components/feed/IndividualFeed.jsx`, `components/feed/IndividualFeedContainer.jsx`, `components/people/**`, `components/profile/**`, `components/jobs/**`, `pages/Notifications.jsx`, `pages/SearchResults.jsx` (AppShell pages), `components/ui/StatCard.jsx`, `components/ui/RecommendationCard.jsx`, `components/ui/EmploymentStatus.jsx`, `components/ui/FollowButton.jsx`, `components/ui/DualTime.jsx`, `components/ui/TimezoneSelector.jsx` |
| **G2 CVAI** | `pages/cvai/**` (+ `CvaiShell` local primitives → align to §3), `components/motion/AnimatedTabBar.jsx`, `components/motion/AnimatedNumber.jsx`, `components/motion/InteractiveCard.jsx`, `components/motion/ShimmerButton.jsx`, `components/motion/Stagger.jsx`, `components/motion/SmartSkeleton.jsx` |
| **G3 Organization** | `pages/organization/**` (all), `components/org/**`, `pages/InterviewAnalysis.jsx`, `pages/InterviewRoom.jsx`, `components/interviews/VideoRoom.jsx`, `components/interviews/TextInterview.jsx`, `components/interviews/ThinkingDisplay.jsx` (keep Fa icons here) |
| **G4 Page manager & public profiles** | `pages/page/**`, `components/page/PageManagerLayout.jsx`, `components/page/PageManagerContext.jsx` (no change), `pages/PublicProfileBySlug.jsx`, `pages/PublicProfile.jsx`, `pages/AcceptInvite.jsx` (if kept) |
| **G5 Public & auth** | `pages/RecruAILanding.js`, `components/Hero.js`, `components/Features.js`, `components/HowItWorks.js`, `components/Pricing.js`, `components/Testimonials.js`, `components/CTA.js`, `components/CustomerSegments.js`, `components/FeaturedJobs.js`, `components/product/RecruAINavbar.js`, `components/Footer.js`, `pages/AboutUs.jsx`, `pages/Blog.jsx`, `pages/Careers.js`, `pages/Community.jsx`, `pages/ContactUs.jsx`, `pages/TermsAndConditions.jsx`, `pages/PrivacyPolicy.jsx`, `pages/CookiesPolicy.jsx`, `pages/SystemStatus.jsx`, `pages/NotFound.jsx`, `pages/SignIn.js`, `pages/Register.js`, `pages/ForgotPassword.jsx`, `pages/ResetPassword.jsx`, `components/auth/AuthLayout.jsx`, `components/auth/OtpVerify.jsx` |

**Shared files the coordinator owns (do not edit without permission):**
`index.css`, `App.css`, `tailwind.config.js`, `components/ui/Button.jsx`,
`components/ui/Card.jsx`, `components/ui/Chip.jsx`, `components/ui/Input.jsx`,
`components/layout/*` (AppShell, OrgAppShell, Sidebar, RightRail, UtilityRail,
SignedInAccountBar, useActiveRail), `components/theme/ThemeContext.jsx`, `App.js`.

---

## 8. Definition of done (every group)

1. Every page renders inside exactly one shell (§2); no duplicate header/footer/pill.
2. All `hover:bg-[#009b3f]` and `active:bg-[#008a38]` replaced (§1).
3. No raw `bg-white`/`border-gray-200` on app surfaces; dark-mode overrides present.
4. Icons conform to §4 (sizes, stroke, `h-4 w-4` order, aria).
5. Buttons/inputs/cards/chips use ui primitives or the canonical class strings (§3).
6. No dead imports; run `npx eslint <file>` on every touched file (0 errors, warnings OK).
7. Self-review screenshot pass on at least one page per group in light + dark (desktop)
   and one mobile width; fix anything visibly broken.
8. Hand report to coordinator: files touched, patterns replaced, anything left incomplete.
