---
name: Marine Synth Architecture Studio
colors:
  surface: '#0d1418'
  surface-dim: '#0d1418'
  surface-bright: '#333a3f'
  surface-container-lowest: '#080f13'
  surface-container-low: '#161d21'
  surface-container: '#1a2125'
  surface-container-high: '#242b2f'
  surface-container-highest: '#2f363a'
  on-surface: '#dce3e9'
  on-surface-variant: '#bcc9c4'
  inverse-surface: '#dce3e9'
  inverse-on-surface: '#2a3136'
  outline: '#87948f'
  outline-variant: '#3d4945'
  surface-tint: '#6ad9bf'
  primary: '#6ad9bf'
  on-primary: '#00382e'
  primary-container: '#2ca58d'
  on-primary-container: '#00332a'
  inverse-primary: '#006b5a'
  secondary: '#f0be7b'
  on-secondary: '#452b00'
  secondary-container: '#654209'
  on-secondary-container: '#e1b06e'
  tertiary: '#bac8d3'
  on-tertiary: '#25323a'
  tertiary-container: '#87959f'
  on-tertiary-container: '#212e36'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#87f6db'
  primary-fixed-dim: '#6ad9bf'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#005143'
  secondary-fixed: '#ffddb5'
  secondary-fixed-dim: '#f0be7b'
  on-secondary-fixed: '#2a1800'
  on-secondary-fixed-variant: '#624007'
  tertiary-fixed: '#d6e4ef'
  tertiary-fixed-dim: '#bac8d3'
  on-tertiary-fixed: '#101d25'
  on-tertiary-fixed-variant: '#3b4851'
  background: '#0d1418'
  on-background: '#dce3e9'
  surface-variant: '#2f363a'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  title-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-default:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-muted:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  mono-code-block:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  mono-schema-row:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.005em
  mono-micro-tag:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.06em
  label-action:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
This design system defines an authoritative, high-density backend architecture studio and relational schema synthesizer engineered specifically for technical founders, systems architects, and infrastructure engineers. The aesthetic bridges the tactical precision of industrial terminal consoles with modern developer-first SaaS products (such as Linear, Supabase, and Railway). 

The visual style is **Technical Minimalist / Precision Dark Mode**:
- Unapologetic structural hierarchy reliant on 1px hairlines, disciplined density, and deep chromatic petrol layers instead of ambient drop shadows or decorative blurs.
- Information architecture optimized for instantaneous legibility of schema relationships, column data types, foreign keys, and orchestration states.
- High functional contrast that minimizes eye strain during extended architectural sessions while keeping visual focal points anchored directly to primary state transitions and generation triggers.

## Colors
The palette is calibrated around deep, desaturated petrol-marine values to evoke mechanical stability, paired with surgical data-accent tones:

- **Canvas Base (`#0C1317`)**: Deep Marine Petrol serving as the structural backdrop for all workbench tooling, schematic canvases, and global navigation shells.
- **Card / Surface Container (`#131D23`)**: Dark Slate Petrol applied to parent panels, wizard boundaries, template wrappers, and high-level workbench panes.
- **Sub-surface / Schema Card (`#19262E`)**: Muted Abyss dedicated to child entities, database table headers, nested relation cards, and secondary interactive blocks.
- **Structural Hairlines (`#24353F`)**: Uniform 1px boundaries dividing all panes, headers, grid matrices, and component borders without color bleed or glow.
- **Primary Text (`#E6EEF0`)**: Crisp Ice Gray engineered for extreme high-contrast readability against dark canvas layers.
- **Secondary / Supporting Text (`#7F939D`)**: Cool Pewter for system metadata, property specs, SQL flags, and non-active controls.
- **Primary CTA & Indicator (`#2CA58D`)**: Oxidized Seafoam utilized strictly for compilation actions, active status dots, successful health checks, and active mode toggles. Paired with deep dark ink (`#081210`) text when rendered on filled surfaces.
- **Schema Type & Syntax Accent (`#C99A5B`)**: Muted Ochre Sand applied specifically to data types (`uuid`, `fk`, `varchar`, `timestamp`), primary key indicators, and schema warning annotations.

## Typography
The system enforces a dual-typeface strategy to demarcate natural human interface prompts from structured machine syntax:

- **Inter** executes primary UI, navigation headers, instructional narratives, and structural titles. Headings utilize tight negative tracking (`-0.02em` to `-0.03em`) for a condensed, engineered presence.
- **JetBrains Mono** governs all data models, field schemas, engine state telemetry, command bar inputs, foreign key references, and uppercase status badges.
- All technical micro-tags (`mono-micro-tag`) must be displayed in strict uppercase with expanded tracking (`0.06em`) to ensure instant categorization in dense layout matrices.

## Layout & Spacing
The layout model is governed by a strict 8px base rhythm with 4px sub-pixel alignment for micro-elements:

- **Workbench Canvas Grid**: Built for a primary desktop canvas (1440x900 base viewport), featuring a persistent 56px utility activity sidebar on the extreme left, a 48px global command rail top bar, and a centered schema builder area.
- **Canvas Dot Matrix**: The unbounded canvas background incorporates a micro-dot matrix pattern spaced on a 16px grid using `#24353F` at 40% opacity, providing visual anchors for panning node trees and canvas positioning.
- **Template Multi-Columns**: Pre-configured architectural card templates sit within an auto-fitting 3-column horizontal track utilizing `gutter` (16px) separation and unified card paddings (`space-md`).
- **Nesting Hierarchy**: Parent container padding is fixed to `space-lg` (24px) or `space-xl` (32px), while nested schema table cards compress down to `space-sm` (8px) internal padding to maintain information density.

## Elevation & Depth
This design system intentionally rejects heavy diffuse dropshadows and glowing neon halos. Depth is articulated purely through tonal luminance stacking and crisp 1px borders:

- **Level 0 (Canvas)**: `#0C1317` (Deep Marine Petrol), flat dot matrix background.
- **Level 1 (Panels & Shell Containers)**: `#131D23` (Dark Slate Petrol) bounded by a solid `1px solid #24353F` border.
- **Level 2 (Nested Schema Tables & Modals)**: `#19262E` (Muted Abyss) framed inside parent containers with `1px solid #24353F` dividers.
- **Interactive State Elevation**: Hovering over interactive cards or entity models does not cast a shadow; instead, the 1px hairline border transitions from `#24353F` to `#3D5463`, accompanied by a subtle 2% surface background lightening.
- **Active State Marker**: Modally selected or currently focused schema blocks highlight with a `1px solid #2CA58D` border stroke and a discrete 2px solid seafoam top accent line.

## Shapes
Shapes adhere to a disciplined, low-radius architectural geometric scale:

- **Standard Cards & Modals**: 6px corner radius (`rounded-md`), presenting a sharp, industrial enclosure without harsh zero-radius points.
- **Badges, Pills, Buttons, & Schema Rows**: 4px corner radius (`rounded-sm`), preventing visual clutter when dozens of field types and tags appear simultaneously on screen.
- **Dividers & Hairlines**: Strict 1px thickness with zero border radius. Never use dashed borders unless indicating an empty drag-and-drop relationship drop zone.

## Components

### Buttons & Action Bars
- **Primary Generator Button**: Background in `#2CA58D` (Oxidized Seafoam), foreground in bold `#081210` with JetBrains Mono `11px` uppercase tracking. Hover state transitions to `#36BEA3`. No drop shadows; corners fixed at 4px.
- **Secondary / Ghost Action**: `#131D23` background with `1px solid #24353F` hairline border and `#E6EEF0` text. Hover shifts border to `#3D5463`.
- **System Command Trigger**: Monospaced utility triggers in uppercase bracketed notation (e.g. `[NL_INPUT]`, `[GENERATE]`), sized at 28px height with 8px horizontal padding.

### Chips, Status Badges & Schema Indicators
- **Active Indicator Chip**: Bordered pill (`1px solid #2CA58D`), `#0C1317` background, containing an oxidized seafoam micro status indicator dot (`5px x 5px`) followed by uppercase mono text.
- **Type Badges**: Minimalist rectangles with 4px border radius. Ochre tone (`#C99A5B`) at 15% opacity with `#C99A5B` solid text for `pk`, `fk`, `enum`, `uuid`, and data types.

### Schema Entity Cards
- **Table Card Wrapper**: 6px rounded border (`#24353F`), `#131D23` card background. Header features an integrated tabular bar in `#19262E` with the entity name in bold mono (`User`, `Post`, `Workspace`) and an action glyph.
- **Field Rows**: Alternating or hairline-separated (`1px solid #24353F`) rows. Left-aligned field identifier in `#E6EEF0`, right-aligned type definition in `#C99A5B` mono.

### Text Inputs & Specification Areas
- **Prompt Synthesizer Input**: Recessed surface in `#0C1317`, framed with `1px solid #24353F`. Typography set to Inter 13px with placeholder in `#7F939D`. Focused state transitions hairline border to `#2CA58D`.
- **Character Counter / System Metadata**: Positioned at the top right of the input boundary in JetBrains Mono 10px uppercase (`MAX 250 CHARS`).

### Navigation & Mode Selectors
- **Segmented Mode Switcher**: Encapsulated container in `#0C1317` with `1px solid #24353F`. Active mode cards display `#131D23` background, a 2px green indicator bar, and a distinct `ACTIVE` status badge.
- **Workbench Activity Rail**: 56px fixed left column featuring high-contrast icon buttons housed inside 36px squared touch targets, separated by clean 1px horizontal hairlines.