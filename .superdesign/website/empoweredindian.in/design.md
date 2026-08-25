---
version: "superdesign-alpha"
name: "Civic Ledger Serif"
description: "A light, institutional data-dashboard system built on white-to-frost-blue surfaces, a Cormorant Garamond display serif for editorial gravitas, and a rationed slate-blue accent for interactive elements and metric emphasis."
colors:
  background: "#F7FAFC"
  surface: "#FFFFFF"
  surface-alt: "#F8FAFC"
  text-primary: "#0F172A"
  text-secondary: "#64748B"
  text-tertiary: "#475569"
  border: "#E2E8F0"
  accent: "#2563EB"
  accent-deep: "#2C5282"
  accent-ring: "#3C81F5"
typography:
  display-lg:
    fontFamily: "Cormorant Garamond"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: "1.25"
  headline-md:
    fontFamily: "Cormorant Garamond"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: "1.25"
  body-md:
    fontFamily: "Outfit"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: "1.63"
  label-md:
    fontFamily: "Cormorant Garamond"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "1.25"
    letterSpacing: "0.5px"
  body-base:
    fontFamily: "Outfit"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "1.5"
  accent-mono:
    fontFamily: "JetBrains Mono"
    fontWeight: 500
spacing:
  base: "4px"
  gap: "24px"
  section-padding: "32px"
rounded:
  control: "8px"
  card: "16px"
  pill: "9999px"
  chip: "6px"
components:
  navbar:
    background: "transparent"
    backdrop-filter: "blur(10px)"
    radius: "0px"
    height: "65px"
    width: "100%"
  button-hero-primary:
    background: "#2C5282"
    text-color: "#FFFFFF"
    radius: "8px"
    height: "40px"
    padding: "12px 16px"
    hover-background: "#2A4E7C"
  button-nav-cta:
    background: "linear-gradient(135deg, rgb(239, 246, 255) 0%, rgb(248, 250, 252) 100%)"
    text-color: "#2563EB"
    radius: "8px"
  button-ghost:
    background: "transparent"
    text-color: "#64748B"
    radius: "8px"
    height: "44px"
    padding: "8px 16px"
    hover-background: "#F1F5F9"
    hover-text-color: "#0F172A"
  button-outline:
    background: "#FFFFFF"
    text-color: "#0F172A"
    radius: "6px"
    height: "40px"
    padding: "8px 16px"
    border: "1px solid rgb(226, 232, 240)"
    hover-background: "#F1F5F9"
  card-metric:
    background: "linear-gradient(145deg, rgb(255, 255, 255) 0%, rgb(248, 250, 252) 100%)"
    radius: "16px"
    padding: "12px"
    shadow: "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px"
  card-panel:
    background: "transparent"
    radius: "0px"
    padding: "0px"
  card-footer-block:
    background: "#FFFFFF"
    radius: "12px"
    padding: "32px"
    shadow: "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px"
---
# Civic Ledger Serif
Source: https://empoweredindian.in/mplads

## Overview
This is a light, data-forward institutional dashboard — the visual grammar of civic transparency reporting rather than product marketing. It pairs a near-white, faintly blue-tinted background field with an editorial serif (Cormorant Garamond) for headlines and numerals, and a humanist grotesque (Outfit) for body and UI copy. The mood is trustworthy and quiet: no dark mode, no glass panels stacked over vivid gradients, just soft card elevation via 1px hairline shadows on white/frost-blue gradient tiles. Color is rationed almost entirely to one slate-blue accent used for links, active nav state, and a handful of icon chips; everything else lives in gray-and-white neutral structure.

## Composition
The first screen opens with a thin horizontal gradient rule beneath the navbar, then a serif page title, a one-line subhead, a search bar paired with an export control, and immediately a dense 6-up row of metric cards (with a 7th trailing card breaking to its own row) — the page leads with numbers, not a hero illustration. Scrolling down, the rhythm alternates labeled "band" sections (an icon + eyebrow-style title + descriptive subhead, each with a collapse chevron) with their content: a dual-axis bar/line chart panel paired with a segmented-bar utilization breakdown, then a project-status overview of icon-led stat cards, then a state-allocation accordion, then a two-panel "About / Quick Actions" pair, then a four-column footer. The deliberate choice is density-first stacking of many small metric and chart cards in tight 12px-padded gradient tiles rather than a spacious one-hero-metric-at-a-time layout — this rejects the "big number hero" pattern in favor of a dashboard scanability model where every KPI is visible without scrolling deep.

## Colors
Background is a near-white field — `#FFFFFF` and `#F7FAFC`/`#F8FAFC` frost-blue tints dominate the pixel field (over 90% combined), confirming this is a light system, not dark-mode. Card surfaces use the same near-white family lifted only by a subtle 145deg gradient (`#FFFFFF` → `#F8FAFC`) and a 1px/3px soft shadow — elevation is achieved by gradient-plus-shadow, not by darker fill. Text ink is `#0F172A` for primary content and `#64748B`/`#475569` for secondary/muted labels. The accent, `#2563EB` (with token ramp `--primary-50` `#EFF6FF` through `--primary-600` `#1D4ED8`), is rationed to interactive elements only: the nav CTA text, focus rings (`--tw-ring-color: #3C81F5`), icon-chip fills, and chart highlight bars. A deeper `#2C5282` slate-blue is reserved for the single most prominent filled button. Borders throughout are a pale `#E2E8F0`/`#CBD5E1` hairline. Warm/status colors (amber, teal, coral) appear only inside chart segments and small semantic icon chips — the surrounding UI chrome is deliberately left uncolored gray-on-white.

## Typography
Cormorant Garamond, a high-contrast serif, carries all display and label roles — the 40px/800 page title, 24px/800 sub-headings, and even 14px/500 tracked-out labels (0.5px letter-spacing) use this serif, giving the whole system an editorial, almost broadsheet-like authority unusual for a data dashboard. Outfit, a geometric sans, carries all body and UI text: 18px/500 for prose descriptions, and a denser 16px/400 mode at `#666666` for finer body copy. This creates a firm two-family hierarchy: serif announces (titles, section labels, numerals-as-headlines), sans explains (descriptions, card body text, nav items). A JetBrains Mono family is present in the system for tabular/numeric accents where digit alignment matters.

## Layout
Content is bounded by a 600px measure for prose blocks but the dashboard grids run full-width within the page container. The primary metric row is a 6-column grid (24px gap) of near-square cards sized ~16% each, with a 7th card overflowing to a second row alone — an uneven 6+1 composition, not a clean bento split. Lower on the page, a 2-column grid (32px gap, rows sized 39%/59%) pairs the fund-utilization bar/line chart against the utilization-tier breakdown. A 4-column grid (32px gap, two rows at 49% each) organizes paired panels such as About/Quick Actions. Card padding is tight — 12px on metric tiles — reflecting the compact, data-dense density. Radii step from 6px (outline button) to 8px (default controls) to 12–16px (cards), topping out at a 9999px pill for tag-like elements. Spacing units of 4/8/12/16/24/32px govern all gaps.

## Components
- **Navbar**: edge-to-edge square bar (0px radius, all four corners), 65px tall, full 100% viewport width, sticky, transparent fill with `blur(10px)` backdrop-filter — a frosted bar over scrolling content, not an inset capsule. Carries 8 nav items plus a logo lockup at left and a two-control cluster at right (a house-type filter dropdown and an LS-term dropdown). Its CTA is a soft gradient pill: `linear-gradient(135deg, rgb(239, 246, 255) 0%, rgb(248, 250, 252) 100%)` fill, `#2563EB` text, 8px radius.
- **Hero primary button** (observed, first screen — the search/export control area): a solid `#2C5282` deep-slate fill, white text, 8px radius (slightly-rounded), 40px height, 12px/16px padding, hover darkens to `#2A4E7C`. This is the highest-contrast filled control on the page and anchors the primary action role; it is distinct from the navbar's soft gradient CTA and from the ghost/outline utility buttons below.
- **Ghost button** (first screen, secondary utility): transparent fill, `#64748B` text, 8px radius, 44px height, 8px/16px padding, hover fills `#F1F5F9` with text shifting to `#0F172A`.
- **Outline button** (first screen, tertiary utility, e.g. export): white `#FFFFFF` fill, `#0F172A` text, 6px radius (near-sharp), 40px height, 8px/16px padding, 1px solid `#E2E8F0` border, hover fills `#F1F5F9`.
- **Metric card family** (×7, top-of-page KPI row): gradient fill `linear-gradient(145deg, rgb(255,255,255) 0%, rgb(248,250,252) 100%)`, 16px radius, 12px padding, shadow `rgba(0,0,0,0.1) 0px 1px 3px 0px, rgba(0,0,0,0.1) 0px 1px 2px -1px`. Arranged 6-per-row then 1 alone on a second row. Interior anatomy top-to-bottom: a small square icon chip (colored per metric — blue, orange, green, red), an uppercase-styled serif eyebrow label, a large bold numeral/value, a one-line muted description, and a small muted metadata caption (house/term scope) at the bottom.
- **Full-width panel card family** (×3, mid-page chart/status bands): transparent fill, 0px radius, 0px padding — these are unbounded content sections rather than boxed cards, each stacked in a single column of 100%-width rows containing a media-top area (chart/canvas), a heading, an expandable disclosure affordance, and body text.
- **Footer info-block card family** (×2, near page end — About / Quick Actions pair): solid white `#FFFFFF` fill, 12px radius, 32px padding, shadow `rgba(0,0,0,0.1) 0px 1px 3px 0px`. One holds a heading plus paragraph body text; the other holds a heading plus a row of action buttons with two info-icon-annotated variants.
- **Section header band**: a recurring molecule preceding each chart/status section — small circular icon at left, serif section title centered/left, muted sans subheading beneath, and a chevron disclosure control at the far right; sits on the page background with no card fill.
- **Footer**: `#F8FAFC` background, organized into 4 columns (brand/mission block with 3 social icons, Platform links, Company links, Supported-by block), totaling 13 links, closed by a hairline-divided legal row.

## Graphics & Effects
No large-scale decorative gradients exist on this page — gradients are confined to small elements: card fills use `linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)` at ~2.2% of page area, the nav CTA and similar soft buttons use `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)` at ~2%, and a small warm accent gradient `linear-gradient(135deg, rgb(30,64,175) 0%, rgb(217,119,6) 100%)` (blue-to-amber) appears at ~1.5% coverage, likely as a top decorative rule or single icon badge — treat it as a thin accent stripe, not a background wash. Two further micro-gradients (`rgb(219,234,254)→rgb(191,219,254)` and `rgb(209,250,229)→rgb(167,243,208)`) mark tiny semantic icon-chip fills at ~0.1% each. A live canvas element renders the bar/line utilization chart — stand in with a static rendered chart image or SVG when rebuilding. Elevation throughout is soft and shallow: `rgba(0,0,0,0.1) 0px 1px 3px 0px, rgba(0,0,0,0.1) 0px 1px 2px -1px` on cards, a lighter `rgba(0,0,0,0.05) 0px 1px 2px 0px` on subtler elements. The navbar's `blur(10px)` backdrop-filter is the only glass treatment on the page.

## Motion
Interactions are quick and utilitarian: `all 0.2s ease` and `color 0.2s ease` drive hover-state fills and text-color shifts on buttons and links; `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)` gives slightly eased transitions to interactive chips and controls; a slower `all 0.3s ease` covers larger state changes such as accordion/disclosure expansion (paired with `accordion-up`/`accordion-down` keyframes). `pulse` likely animates loading or live-data indicators, while `enter`/`exit` keyframes govern dropdown and disclosure mounting, and `spin` drives loading spinners. Overall motion is subtle and functional — feedback-oriented micro-transitions, never decorative or scroll-linked.

## Guardrails
- Never darken the page background — this is a light, near-white system; do not introduce dark-mode surfaces or saturated full-bleed gradients.
- Do not replace the metric-card gradient fill with a flat white; the 145deg white-to-frost-blue gradient plus dual soft shadow is the defining card treatment.
- Keep the accent blue (`#2563EB`/`#2C5282`) rationed to CTAs, links, and icon chips only — do not tint large surfaces or backgrounds with it.
- Preserve the navbar as an edge-to-edge, square-cornered, blurred-transparent sticky bar — do not convert it into a centered capsule or opaque bar.
- Do not merge the serif (Cormorant Garamond) into body copy or the sans (Outfit) into headlines — the display/body split is structural to the identity.
- Keep the 6+1 metric-row composition and the 12px tight card padding; do not evenly re-flow it into a generic 4-up or 3-up bento grid.