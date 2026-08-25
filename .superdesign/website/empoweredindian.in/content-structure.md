# MPLADS Dashboard

## Business Context
- **Type/Industry:** Government transparency / civic data platform
- **What they do:** Searchable dashboards for Member of Parliament Local Area Development Scheme (MPLADS) fund allocation, expenditure, and project tracking across India
- **Target audience:** Citizens, researchers, MPs, constituency stakeholders
- **Page goal:** Display fund utilization metrics, project status breakdown, and state-wise allocation with interactive filters and export capability

# Page Layout & Structure

### Hero
Left-aligned h1 "MPLADS Dashboard" + subtitle "Overview of Member of Parliament Local Area Development Scheme" (navy text on white). Below: horizontal search bar (combobox "Search MPs or Constituencies" + search button with icon) + right-aligned "Export Data" button (navy text, white background). No decorative elements; functional-only layout. White background throughout.

### Header / Navigation
Sticky horizontal nav: Empowered Indian logo (left) + 7 navigation links (Overview, Find Projects, Browse States, Browse MPs, Compare, Feedback, House dropdown) + "Both Houses" selector + user profile icon (right). White background, navy text. No primary CTA in nav.

### Key Metrics Row ×7 (masonry, 6 columns)
Seven 1×1 metric cards in masonry grid: **Total Allocated** (11,621.1 CR, blue badge), **Total Expenditure** (3,938.9 CR, green badge), **Fund Utilization** (33.9%, blue badge + info button), **Total MPs** (764, blue badge + info button), **Works Completed** (43,472 + ₹2,372.7 CR, green badge), **Works Pending** (40,145, yellow badge), **Incomplete Works** (1,566.2 CR, red badge + info button). Each card: rounded corners, colored left border (blue/green/yellow/red), h2 heading + value in larger navy text + muted blue subtitle + "Both Houses • Lok Sabha 2024–29" note. Light blue background per card.

### Key Metrics Overview (expandable section)
- **Purpose:** Collapsed/expanded visualization container for chart layers below.
- **Layout:** h3 heading + description text "Visual representation of MPLADS performance metrics" + expand button. Accordion-style toggle; white background, navy text.

### States by Fund Utilization
- **Purpose:** Show top-performing states and distribution across utilization tiers.
- **Layout:** h3 heading + info button + descriptive text "Top Performer: Nagaland (94.5%) Avg Utilization: 56.0% States: Top 10" + grouped bar chart (vertical bars, teal/green/orange/gray by tier) + legend below with 4 categories (High/Good/Moderate/Low Utilizers, color-coded). Light blue background section.

### Fund Utilization Pattern Analysis Chart
- **Purpose:** Categorical breakdown of MPs by utilization performance.
- **Layout:** Horizontal bar chart showing percentages: High Utilizers 1.3%, Good Utilizers 3.1%, Moderate Utilizers 17%, Low Utilizers 78.5%. Legend with navy/blue color swatches + descriptive text per tier. White background.

### Project Status (expandable section)
- **Purpose:** Collapsed/expanded container for project stage breakdown.
- **Layout:** h3 heading + description "Track the progress of MPLADS projects across different stages" + expand button. Accordion-style toggle.

### Project Status Overview (bento, 4 columns)
**Purpose:** Three equal-width status cards.
**Layout:** Bento grid, 4 cols, 4 cells (cells 1–3 span 1 col each, cell 4 empty/reserved):
- **Recommended** (h4): count 83,617 + subtitle "Projects recommended by MPs" + orange badge icon + 48.0% label. Light blue background.
- **In Progress** (h4): count 40,145 + subtitle "Projects awaiting completion" + orange badge icon + 48.0% label (orange accent text). Light blue background.
- **Completed** (h4): count 43,472 + subtitle "Projects successfully completed" + green badge icon + 52.0% label. Light blue background.

### State-wise Allocation (expandable section)
- **Purpose:** Collapsed/expanded region for state distribution data.
- **Layout:** h3 heading + description "Distribution of MPLADS funds across states and union territories" + expand button. Accordion-style toggle.

### About MPLADS & Quick Actions (2-column layout)
- **Purpose:** Contextual explainer + action buttons.
- **Layout:** Left column: h3 "About MPLADS" + body text explaining MPLADS scheme (2–3 sentences). Right column: h3 "Quick Actions" + 4 buttons arranged in 2×2 grid (View All States, Search MPs, View Top Performers [disabled], Download Report [disabled]). Each button navy background, white text; muted blue info icons on right pair. Light blue background section.

### Footer
Three-column layout: **Empowered Indian** tagline + mission text + social icons (left) | **Platform** links (MPLADS Dashboard, Browse States, Browse MPs, Compare) + **Company** links (About Us, FAQ, Privacy Policy, Terms of Service) (center) | **Supported By** + Malvern Ventures logo + "Funded as a social impact initiative" text (right). Fine print: "Data sourced from official MPLADS portal…" + copyright + "Made with ❤️ for India" (center). White background, navy headings, muted blue body text.

**Notable patterns:** Metric cards use masonry (6 cols, 7 cells, all 1×1). All sections alternate between white & light blue backgrounds. Expandable/accordion sections (Key Metrics, Project Status, State-wise) use button + region pattern. Project Status cards form bento grid (4 cols, 3 active + 1 reserved). Info buttons (ⓘ) appear on utilization, MP count, and incomplete works metrics. No horizontal image alternation. Badge colors (blue/green/yellow/red/orange) tied to metric type or status category.