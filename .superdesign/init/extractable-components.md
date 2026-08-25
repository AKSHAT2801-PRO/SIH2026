# Extractable Components

## Sidebar
- Source: `frontend/components/layout/Sidebar.tsx`
- Category: layout
- Description: Fixed left sidebar with logo, role selector, navigation links, and version footer
- Extractable props: activePath (string, default: "/"), role (string, default: "Central Authority")
- Hardcoded: Navigation links, role dropdown options, logo SVG, branding labels

## TopBar
- Source: `frontend/components/layout/TopBar.tsx`
- Category: layout
- Description: Top header bar with search input and report generation action
- Extractable props: searchQuery (string, default: ""), reportButtonDisabled (boolean, default: true)
- Hardcoded: Search placeholder, report button text and icon

## RiskBadge
- Source: `frontend/components/shared/RiskBadge.tsx`
- Category: basic
- Description: Color-coded risk level badge with score and severity
- Extractable props: score (number, 0-100), size ("sm" | "md")
- Hardcoded: Risk severity thresholds (0-30 Low, 31-69 Medium, 70+ Critical)
