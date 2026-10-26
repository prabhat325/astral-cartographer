---
name: Astral Cartographer
colors:
  surface: '#f9f9ff'
  surface-dim: '#d6dae7'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e9eefb'
  surface-container-high: '#e4e8f6'
  surface-container-highest: '#dee2f0'
  on-surface: '#171c25'
  on-surface-variant: '#454652'
  inverse-surface: '#2b303b'
  inverse-on-surface: '#ecf0fe'
  outline: '#757683'
  outline-variant: '#c5c5d3'
  surface-tint: '#4458ae'
  primary: '#4156ab'
  on-primary: '#ffffff'
  primary-container: '#5b6fc6'
  on-primary-container: '#fffbff'
  inverse-primary: '#b8c3ff'
  secondary: '#4758a9'
  on-secondary: '#ffffff'
  secondary-container: '#98a9ff'
  on-secondary-container: '#283a8a'
  tertiary: '#795600'
  on-tertiary: '#ffffff'
  tertiary-container: '#996d00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001355'
  on-primary-fixed-variant: '#2a3f94'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b9c3ff'
  on-secondary-fixed: '#001257'
  on-secondary-fixed-variant: '#2e408f'
  tertiary-fixed: '#ffdea8'
  tertiary-fixed-dim: '#f6bd50'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5e4200'
  background: '#f9f9ff'
  on-background: '#171c25'
  surface-variant: '#dee2f0'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses clarity, structural elegance, and intellectual poise. Designed for engineers, software architects, and engineering leadership navigating intricate codebases, the visual language balances the precision of an analytical workbench with the warmth and spaciousness of an architectural studio. 

The aesthetic is Modern Minimalist infused with tactile, architectural order:
- **Atmosphere:** Sunlit, airy, and grounded. Generous margins and deliberate negative space replace high-density clutter.
- **Visual Cadence:** Structured, quiet, and balanced. Interface chromes recede gracefully so that graphical topologies, dependency trees, and repository metrics remain the uncontested focal point.
- **Material Tone:** Pristine opaque planes, hairline boundaries, and weightless, ambient shadows. It deliberately rejects dark-mode clichés, sci-fi tropes, and harsh neon luminescence in favor of a timeless, paper-and-canvas instrument.

## Colors

The palette relies on high-purity neutrals with an intentional thermal warmth, punctuated by an intellectual slate-indigo accent and balanced semantic markers.

### Palette Architecture
- **Canvas & Background:** `#F8F9FA` (Warm Studio Canvas). Sets a calm, non-glaring backdrop that reduces fatigue during prolonged repository audits.
- **Surfaces & Cards:** `#FFFFFF` (Crisp Paper). High-purity white used for raised panels, node cards, toolbars, and inspector sheets.
- **Primary Brand Accent:** `#6478D0` (Muted Slate-Indigo). Employed selectively for focal actions, active graph selections, and prime navigation states.
- **Accent Hover / Pressed:** `#5364B5` (Deep Slate-Indigo). Provides an organic, weighted transition upon interaction.
- **Primary Typography:** `#252A34` (Deep Charcoal). Delivers deep contrast without the harsh, sterile punch of `#000000`.
- **Secondary / Supporting Typography:** `#6B7280` (Muted Graphite). Governs metadata, table headers, breadcrumbs, and structural framing.
- **Hairlines & Dividers:** `#E5E7EB` (Pencil Gray). Subtle, disciplined boundaries that define panels without visual heaviness.

### Semantic Tones
Semantic signals are applied with strict discipline—never for ambient decoration, only to convey actionable code state:
- **Optimal / Low Complexity:** `#10B981` (Emerald). Signals test coverage, pure modules, and clean build states.
- **Attention / Moderate Debt:** `#F59E0B` (Amber). Indicates cyclomatic spikes, deprecation warnings, or medium blast-radius components.
- **Critical / Circular Risk:** `#EF4444` (Coral Crimson). Pinpoints circular imports, deadlocks, untyped boundaries, and severe vulnerabilities.

## Typography

The typographic hierarchy couples **Inter** for narrative, controls, and structural orientation with **JetBrains Mono** for mechanical clarity across code snippets, AST expressions, commits, and hash identifiers.

- **Scale & Balance:** Large titles favor negative tracking (`-0.025em` to `-0.015em`) to retain compactness in dashboard banners and repository headers. Body text maintains natural, open line heights (`1.5` to `1.6`) for rapid scanning of documentation and git manifests.
- **Technical Precision:** Monospaced elements are set slightly smaller than surrounding proportional text to maintain optical balance alongside Inter's x-height.
- **Labels & Badges:** Micro-labels utilize slight positive tracking (`0.02em` to `0.04em`) to safeguard legibility at small sizes without requiring loud capitalization.

## Layout & Spacing

This design system is built upon a modular 8px baseline rhythm, scaling down to 4px for fine mechanical alignments.

### Viewport Adaptation & Grid Models
- **Desktop (1280px+):** Employs an expansive fluid workbench layout. Toolbars and global state bars anchor to the top and bottom. A persistent, collapsible master tree navigates repositories, alongside a boundless node-graph canvas and an overlay/docked inspector drawer (380px fixed width).
- **Tablet (768px – 1279px):** Inspector drawers transition into layered slide-over modals; sidebars default to icon-rail configurations with dynamic hover sheets. Margins condense to `1.5rem`.
- **Mobile (< 768px):** Adapts to a single-column linear layout. The interactive canvas shifts to touch-pan controls, while dense metrics cards stack vertically. Margins compress to `1rem` with `0.75rem` gutters.

### Spatial Discipline
Padding within panels, cards, and canvas nodes must feel expansive. Information density is achieved through crisp alignment and typographic precision, not by crowding elements.

## Elevation & Depth

Depth is established primarily through **tonal planes** and **micro-soft ambient shadows**, eliminating heavy drop shadows or intrusive dark borders.

### Surface Tiers
- **Tier 0 (Base Canvas):** Solid `#F8F9FA`. The infinite background for graph canvases, repository landing shells, and outer gutters.
- **Tier 1 (Resting Cards & Panes):** Pure white `#FFFFFF` layered over the base canvas, framed with a 1px boundary of `#E5E7EB`.
- **Tier 2 (Interactive Flyouts & Floating Node Cards):** `#FFFFFF` paired with an ultra-diffuse ambient shadow: `0 4px 20px -2px rgba(37, 42, 52, 0.05), 0 1px 3px 0 rgba(37, 42, 52, 0.04)`.
- **Tier 3 (Modals & Toolbars):** Deep, soft diffusion: `0 12px 36px -4px rgba(37, 42, 52, 0.08), 0 4px 12px -2px rgba(37, 42, 52, 0.03)`.

### Border Discipline
Borders are rendered at a uniform 1px width in `#E5E7EB`. Under active selection or keyboard focus, borders transition smoothly to `#6478D0` without layout shifts, accompanied by a soft halo: `0 0 0 3px rgba(100, 120, 208, 0.15)`.

## Shapes

The interface embraces a calibrated **Rounded** aesthetic (`roundedness: 2`). This keeps the platform approachable and modern without losing technical authority.

- **Base Components (Inputs, Buttons, Badges):** `8px` (`0.5rem`).
- **Cards, Panels, and Graph Node Blocks:** `16px` (`1rem`).
- **Floating Modals, Quick-Action Command Palettes:** `24px` (`1.5rem`).
- **Graph Connection Pins & State Pills:** Fully rounded / pill (`9999px`) to create clear geometric contrast against rectangular content cards.

## Components

### Buttons
- **Primary:** Solid `#6478D0` background, white Inter medium typography, 8px corner radius. On hover: `#5364B5`. Active: `#465499`. Padding: 10px 18px.
- **Secondary / Ghost:** Pure white `#FFFFFF` surface, 1px border of `#E5E7EB`, `#252A34` text. On hover: border `#6478D0`, background `#F8F9FA`.
- **Icon / Canvas Actions:** 36x36px square with 8px radius, `#FFFFFF` fill, 1px `#E5E7EB` border. Active state renders `#6478D0` icon with subtle `#6478D0`/10% background tint.

### Repository Graph Nodes (Visualizer Core)
- **Container:** Pure `#FFFFFF` surface, 16px corner radius, hairline border `#E5E7EB`.
- **Header:** Top strip featuring a monospaced module title (`code-md`), accompanied by an inline semantic health pill (e.g., Emerald dot with text for 0 circular references).
- **Body:** Shows internal symbols, exports, and cyclomatic complexity bars.
- **Selected State:** Border color shifts to `#6478D0` with a 3px soft focus halo.

### Input Fields & Search Bars
- **Style:** Flat `#FFFFFF` surface, 1px border `#E5E7EB`, 8px corner radius. Padding: 10px 14px.
- **Placeholder:** `#6B7280`. Text: `#252A34`.
- **Repository Omnibar:** Monospaced prefix indicators (e.g., `repo:`, `symbol:`, `file:`) in muted slate pills inside the field.

### Status Chips & Pills
- **Geometry:** Height 22px, pill-radius (`9999px`), padding 2px 10px.
- **Color Systems:**
  - *Clean / Stable:* `#10B981` at 10% background fill with `#047857` text.
  - *Warning / Complexity:* `#F59E0B` at 10% background fill with `#B45309` text.
  - *Cycle Risk / Error:* `#EF4444` at 10% background fill with `#B91C1C` text.
  - *Neutral / Tag:* `#F3F4F6` background with `#4B5563` text.

### Segmented Controls & Navigation Tabs
- **Container:** Enclosed capsule in `#F8F9FA` with 10px border radius and 4px internal padding.
- **Tab Item:** Seamless `#FFFFFF` card when active, accompanied by an ultra-subtle ambient shadow and `#252A34` text. Inactive tabs feature transparent backgrounds and `#6B7280` text.

### Contextual Tooltips & Hovercards
- **Style:** Solid `#252A34` background with crisp `#FFFFFF` text (Inter, `body-sm`). Radius: 6px. No heavy arrows; uses an intentional 6px vertical offset with an opacity transition of 120ms.

### Selection Checkboxes & Radio Indicators
- **Style:** 16x16px boxes with 4px radius (checkbox) or circular (radio). Unchecked: `#FFFFFF` fill with 1.5px `#E5E7EB` outline. Checked: `#6478D0` fill with white checkmark icon.