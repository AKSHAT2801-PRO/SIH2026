# Theme & Design Tokens

## Token Summary
- **Background**: `#f8fafc` (slate-50)
- **Foreground / Text**: `#0f172a` (slate-900)
- **Primary Accent**: `#0284c7` (sky-600) / `#0ea5e9` (sky-500)
- **Sidebar Background**: `#1e293b` (slate-800)
- **Risk Severity Colors**:
  - Critical / High Risk: `#ef4444` (red-500), bg `#fef2f2`, border `#fca5a5`
  - Medium Risk: `#f59e0b` (amber-500), bg `#fffbeb`, border `#fcd34d`
  - Low Risk: `#10b981` (emerald-500), bg `#ecfdf5`, border `#6ee7b7`
- **Typography**: Inter, system-ui, sans-serif

## Raw Source Dumps

### `frontend/app/globals.css`
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@import "tailwindcss";

:root {
  --background: #f8fafc;
  --foreground: #0f172a;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: 'Inter', system-ui, sans-serif;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```
