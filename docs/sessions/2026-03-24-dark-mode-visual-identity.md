# Session — 2026-03-24

## What was done

- Applied a full visual identity system to the dashboard based on a custom design spec
- Iterated from light theme → dark mode after first pass looked wrong
- Final dark theme modeled on a reference UI (WraithWatchers dashboard) for aesthetic direction
- Used Playwright MCP to screenshot the reference UI live at localhost:3000

## Decisions made

- **Dark teal over generic dark**: chose `#0c1e1c` background (deep teal-green) rather than a neutral dark gray, giving the dashboard a distinct character
- **Single surface token**: all cards, filter panel, and config card now use the same `--surface` color (`#112a27`) — no special-casing per section. Simpler and more consistent.
- **Removed `.filters-panel` override**: the first dark pass added a separate navy filter panel class; scrapped it since the whole page is dark and the distinction added complexity without value
- **Chart grid lines**: `rgba(255,255,255,0.06)` — very subtle so they don't compete with the data
- **KPI accent color**: changed from indigo/emerald per-section to consistent teal `#00C896` for all section dividers

## Fixes applied

- Chart grid/tick colors were `#334155` / `#94a3b8` (Tailwind slate dark), which looked wrong on white cards — replaced with `#D0D5E8` in light pass, then `rgba(255,255,255,0.06)` / `#5a8a80` for dark
- All `text-slate-*` Tailwind classes replaced with CSS variable equivalents
- Hardcoded light colors (`#F4F6FB`, `#0D1B2A` text, `#fff` card backgrounds) cleaned up across HTML and JS template strings
- Progress bar text was dark on dark background — fixed to use `var(--text-1)`
- Table group header row had leftover dark slate inline styles — updated to teal accent

## Unfinished / follow-up

- No visual regression testing — worth doing a side-by-side screenshot of upload screen, filter panel, KPI cards, charts, and table to verify nothing looks off before next release
- The `--text-inv` variable (`#0c1e1c`) is used on the green CTA button text — worth checking contrast ratio meets WCAG AA at that small font size
- Chart dataset colors (`#818cf8` indigo, `#10b981` emerald, etc.) are unchanged — could be refreshed to match the new teal palette more cohesively
- No dark mode / light mode toggle — if one is ever added, all CSS vars are already in `:root` making it straightforward to add a `[data-theme=light]` override

## Commits

- `fde2a78` — apply visual identity system throughout dashboard
- `b91a2ff` — dark mode: deep teal surface, subtle borders, teal accent
