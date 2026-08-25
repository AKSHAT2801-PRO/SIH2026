# Page Component Dependency Trees

## / (Overview Dashboard)
Entry: `frontend/app/page.tsx`
Dependencies:
- `frontend/components/overview/StatCard.tsx`
- `frontend/components/overview/RiskDistributionChart.tsx`
- `frontend/components/overview/StateDrillTable.tsx`
- `frontend/components/overview/RecentFlagsPanel.tsx`
  - `frontend/components/shared/RiskBadge.tsx`
- `frontend/components/layout/Sidebar.tsx`
- `frontend/components/layout/TopBar.tsx`

## /queue (Investigation Queue)
Entry: `frontend/app/queue/page.tsx`
Dependencies:
- `frontend/components/queue/WorkTable.tsx`
  - `frontend/components/shared/RiskBadge.tsx`
  - `frontend/components/shared/EmptyState.tsx`
- `frontend/components/queue/FilterPanel.tsx`

## /work/[id] (Work Detail View)
Entry: `frontend/app/work/[id]/page.tsx`
Dependencies:
- `frontend/components/work/RiskBreakdown.tsx`
- `frontend/components/work/AnomalyList.tsx`
- `frontend/components/work/EvidenceSection.tsx`
- `frontend/components/shared/RiskBadge.tsx`

## /map (GIS Map View)
Entry: `frontend/app/map/page.tsx`
Dependencies:
- `frontend/components/map/StateHeatmap.tsx`
- `frontend/components/map/MapViewClient.tsx`
