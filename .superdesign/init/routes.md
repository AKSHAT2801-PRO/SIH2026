# Routes Mapping

| Route Path | Component File | Description | Layout Used |
|------------|----------------|-------------|-------------|
| `/` | `frontend/app/page.tsx` | Main Overview Dashboard (stats, risk distribution, state drill-down table, recent flags) | `RootLayout` |
| `/queue` | `frontend/app/queue/page.tsx` | Investigation Queue (search, filter panel, work items table) | `RootLayout` |
| `/work/[id]` | `frontend/app/work/[id]/page.tsx` | Work Detail View (risk score breakdown, anomaly flags, evidence, audit log) | `RootLayout` |
| `/map` | `frontend/app/map/page.tsx` | GIS Map View (state risk heatmap, interactive map markers, district breakdown) | `RootLayout` |
