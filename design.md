# Dokuly — "Clinical Architect" Design Language

## Product

**Dokuly** is a **Product Lifecycle Management (PLM)** web application for engineering and operations teams: parts, PCBAs, assemblies, documents, projects, purchasing, inventory, production, requirements, ECOs, customers, and time tracking. The UI is **desktop-first**, data-dense, and built with **Bootstrap 4** components (React) with custom CSS overrides.

---

## Visual Foundation

### Typography

- **Primary font**: Inter (loaded via Google Fonts with weights 400, 500, 600, 700).
- **Tabular numerals**: Enabled globally via `font-feature-settings: 'tnum' 1` on `body`. Use `.dokuly-tabular-nums` for explicit opt-in on specific elements.
- **Heading hierarchy**: Avoid oversized marketing-style headers. Use semantic, clear hierarchy:
  - Page titles: `font-size: 1.5rem; font-weight: 700` (`.title-container`)
  - Section labels: `font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280` (`.dokuly-section-label`)
  - Tab labels: `font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em`
- **Button text**: `font-weight: 600` (semibold, not bold).

### Color Palette

| Role | Value | CSS class |
|------|-------|-----------|
| **Primary (Deep Forest Green)** | `#165216` | `.dokuly-bg-primary`, `.dokuly-primary` |
| **Primary hover** | `#104610` | — |
| **Primary active** | `#0e3a0e` | — |
| **Secondary (Teal)** | `#108E82` | `.dokuly-bg-secondary`, `.dokuly-secondary` |
| **Info (Magenta)** | `#DA4678` | `.dokuly-bg-info`, `.dokuly-info` |
| **Success** | `#07a20f` | `.dokuly-bg-success`, `.dokuly-success` |
| **Warning (Gold)** | `#F6C208` | `.dokuly-bg-warning`, `.dokuly-warning` |
| **Danger (Crimson)** | `#B00020` | `.dokuly-bg-danger`, `.dokuly-danger` |
| **Page background** | `#FAFAFA` | — |
| **Header background** | `#FFFFFF` | `.topheader-bg-color` |
| **Sidebar background** | `#FFFFFF` | `.sidebar-bg-color` |
| **Card background** | `#FFFFFF` | `.card` |
| **Borders / dividers** | `#E5E5E5` | `.dokuly-divider` |
| **Table row borders** | `#F0F0F0` | — |
| **Muted text** | `#6B7280` | — |

---

## Components & Layout

### Application Shell

1. **Top header** — Full width, sticky, white background with `1px solid #E5E5E5` bottom border. Contains logo (left) and notifications + user avatar dropdown (right).
2. **Sidebar** — Fixed left, white background, `56px` collapsed (icon-only) below 1610px viewport, `166px` on wide screens. Expands to `200px` on hover when collapsed, revealing labels. Active item: `2px solid #165216` left border.
3. **Main content** — Fluid container to the right of the sidebar, `#FAFAFA` background.

### Cards & Containers

- **Background**: White `#FFFFFF`
- **Border**: `1px solid #E5E5E5` (hairline)
- **Border radius**: `4px` (global `.rounded` override)
- **Box shadow**: None
- Default card class: `card rounded m-3 p-3` (via `DokulyCard` component)

### Tables (Linear-inspired)

- **Headers**: Subtle gray background `#F5F5F5`, uppercase labels, `font-size: 0.75rem`, `font-weight: 600`, `letter-spacing: 0.05em`, `color: #6B7280`, tight padding `0.5rem 0.75rem`.
- **Rows**: Tight vertical padding `0.5rem 0.75rem`, hairline borders `1px solid #F0F0F0`.
- **Hover**: Quiet background shift `#F9FAFB` (no brightness filter).

### Tabs (Segmented Control)

- Horizontal tabs with `1px solid #E5E5E5` bottom border on container.
- Tab links: No background, no rounded corners, `2px solid transparent` bottom border.
- **Active tab**: `2px solid #165216` bottom border, `color: #165216`.
- **Hover**: `2px solid #D1D5DB` bottom border hint.
- Implemented via React Bootstrap `<Tabs>` with CSS overrides. Tab title uses `<span>` (not `<h6>`).

### Buttons

- **Primary**: `#165216` background, white text, `font-weight: 600`.
- **Hover**: Darker `#104610`, `opacity: 0.9` (no scale-up).
- **Active/click**: `#0e3a0e`, `transform: scale(0.98)` (subtle scale-down).
- **Danger**: `#B00020` with same hover/active pattern.
- **Transparent**: Clear background, black text, `#F5F5F5` hover background.

### Interaction Design

- **Hover feedback**: Subtle opacity or background shift. No scale-up transforms.
- **Click feedback**: Subtle `scale(0.98)` on buttons.
- **Sidebar hover**: Background highlight `#F5F5F5` with `border-radius: 4px`. No scale transforms.
- **Dividers**: Use `.dokuly-divider` (hairline `1px solid #E5E5E5`, `margin: 1rem 0`) to separate content and reduce card fatigue.

---

## Routing & Information Architecture

The app uses **hash-based URLs** (`/#/...`).

### Unauthenticated

- `/login`, `/passwordRecovery/...`

### Authenticated — top-level modules

| Path | Purpose |
|------|---------|
| `/`, `/home` | Home dashboard |
| `/adminPage/*` | Administration (admins only) |
| `/timesheet` | Time tracking |
| `/customers` | Customers |
| `/projects`, `/projects/:id/*` | Projects |
| `/requirements`, `/requirement/:id` | Requirements |
| `/eco`, `/eco/:id/*` | ECOs |
| `/documents`, `/documents/:id/*` | Documents |
| `/parts`, `/parts/:id/*` | Parts |
| `/assemblies`, `/assemblies/:id/*` | Assemblies |
| `/pcbas`, `/pcbas/:id/*` | PCBAs |
| `/suppliers`, `/suppliers/:id` | Suppliers |
| `/procurement`, `/procurement/:id/*` | Procurement |
| `/production`, `/production/:id` | Production |
| `/profile` | User profile |

### Sidebar grouping

Vertical nav items separated by thin horizontal rules between functional groups. Administration near the top for admins. Home is the entry point.

---

## Core User Flows

1. **Login** → Home dashboard. Global frame (header + sidebar) always visible.
2. **Sidebar navigation** → Module list or dashboard in main content.
3. **List → detail** → `/:module/:id` with tabbed sub-views (overview, BOM, files, etc.).
4. **Create / edit** → Modal or form; toast feedback on success.
5. **Cross-linking** → Jump between entity detail pages via BOMs, traceability, issues.
6. **Back navigation** → Arrow-back icon (inline, top-left of detail pages) with subtle hover highlight.
