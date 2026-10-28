---
name: Campus Spaces
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#004598'
  on-tertiary: '#ffffff'
  tertiary-container: '#005cc6'
  on-tertiary-container: '#cedbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: '0'
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an academic yet highly modern utility platform tailored for higher-education space reservation, event management, and facility planning. The design merges **Modern Corporate** structure with lightweight, SaaS-grade polish. 

### Audience & Mood
The primary audience comprises university students, faculty, department administrators, and campus facilities teams. The interface balances high-density information architecture with effortless spatial orientation, projecting confidence, academic structure, and crisp digital hygiene. The user experience should feel:
- **Direct & Frictionless:** Instant feedback for room queries, availability heatmaps, and approval statuses.
- **Architectural & Organized:** Clean visual boundaries through high-contrast structural framing (slate headers anchored over soft canvas foundations).
- **Legible & Accessible:** Explicit, unambiguous color coding for reservation categories with rigorous contrast ratios exceeding WCAG AA standards.

## Colors

The palette leverages a dark-anchored navigation frame, soft slate canvas, crisp white container cards, and vivid functional accents.

### Core Palettes
- **Primary Accent (`#4F46E5` / `#6366F1`):** Represents interactive priority—primary reservation CTA buttons, active state indicators, calendar focus frames, and linked pathways.
- **Header & Structural Anchor (`#0F172A` Slate Dark):** Applied across the top navigation bar, primary modal headers, and dominant display typography to project institutional authority.
- **Canvas Base (`#F8FAFC` to `#F1F5F9`):** Ground level page canvas providing a low-glare, neutral backdrop that causes pure white cards to pop naturally without heavy drop shadows.
- **Neutral Framework (`#64748B` Slate Gray):** Controls secondary typography, inactive metadata chips, borders, and input outlines.

### Category & Status Tokens
Functional color coding drives real-time calendar and card scans:
- **Exams (`#EF4444` / Crimson Tint `#FEF2F2`):** Reserved for strict examination schedules and urgent conflict warnings.
- **Classes (`#3B82F6` / Sky Tint `#EFF6FF`):** Dedicated to recurring academic lectures and seminars.
- **Labs (`#10B981` / Emerald Tint `#ECFDF5`):** Denotes specialized scientific, media, or computer laboratories.
- **Events (`#F97316` / Amber Tint `#FFF7ED`):** Highlights public conferences, student organization gatherings, and guest lectures.

All status chips pair saturated text colors against matching 10% opacity tinted backgrounds to prevent visual fatigue while keeping tags distinctly distinguishable.

## Typography

Typography pairs **Plus Jakarta Sans** for structural headers and section identity with **Inter** for data tables, form controls, schedule grids, and metadata labels.

- **Plus Jakarta Sans** delivers geometric crispness with human warmth, preventing the app from feeling overly bureaucratic. Used exclusively from `headline-sm` up to `display-lg`.
- **Inter** handles high-density micro-copy, time indicators, room capacities, and reservation tabular data with optical precision and neutral clarity.
- Tabular figures (`tnum`) should be enabled across all reservation timestamps, room capacity counts, and time selector pickers.

## Layout & Spacing

This design system is engineered desktop-first, prioritizing expansive multi-column schedule grids, spatial calendar matrix views, and master-detail split panels for facility administrators.

### Layout Philosophy & Grid System
- **Desktop (1280px+):** A 12-column layout with `2rem` outer canvas padding and `1.5rem` gutters. Maximum layout container bound is `1440px`. Top navigation spans full width (`100vw`) with an inner boundary matched to the canvas.
- **Tablet (768px – 1279px):** An 8-column layout with `1.5rem` outer margins. Filter sidebars collapse into slide-over panels or horizontally scrolling chips.
- **Mobile (< 768px):** A 4-column layout with `1rem` outer margin and `1rem` gutters. Calendar day views supersede weekly/monthly grid matrixes.

### Vertical Rhythm
Section blocks adhere to an 8px base rhythm. Form fields utilize `space-md` gaps, card internal padding uses `space-lg`, and major dashboard sections are partitioned by `space-xl`.

## Elevation & Depth

Visual depth is achieved through high-contrast boundary layering rather than dramatic drop shadows, ensuring rapid rendering and clean lines.

### Elevation Levels
1. **Level 0 (Canvas Base):** Background canvas rendered in `#F8FAFC`.
2. **Level 1 (Surface Cards & Panels):** Solid `#FFFFFF` fill overlaid with a subtle hairline border (`1px solid #E2E8F0`) and an ambient micro-shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`.
3. **Level 2 (Interactive Flyouts & Hover Cards):** Elevated reservation previews and dropdown panels: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
4. **Level 3 (Modals & Reservation Drawers):** `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`, framed against a 50% opacity slate backdrop (`#0F172A80`).

### Top Navigation Bar
The dark navbar (`#0F172A`) uses zero elevation shadow; it establishes absolute visual grounding through pure chromatic contrast against the light canvas.

## Shapes

The interface balances soft friendliness with structured precision using a standard base radius of `0.5rem` (8px). 

- **Cards & Modal Containers:** Utilize `rounded-xl` (16px) or `rounded-2xl` (24px for major dashboard summary containers) to create prominent content areas.
- **Buttons, Form Controls, and Search Bars:** Standardize on `rounded-lg` (8px to 10px) to maintain a compact, functional aesthetic.
- **Status Tags, Category Chips, and Avatars:** Employ fully pill-shaped contours (`9999px`) to immediately differentiate categorical metadata from actionable input controls.

## Components

### Top Navigation Bar
- Background: Deep slate (`#0F172A`).
- Height: Fixed 68px.
- Elements: White institutional logo mark with an indigo accent pip; horizontal navigation links in `#94A3B8` shifting to `#FFFFFF` on hover; primary right-hand actions contain campus building selector dropdown, notification bell with badge dot, and user avatar.

### Cards (Space & Room Cards)
- Background `#FFFFFF`, border `1px solid #E2E8F0`, rounded corners (`16px`).
- Internal layout features a 16:9 room image container with category badges floating at top-left.
- Content zone: Bold room identifier (`headline-sm`), capacity indicator with dual person icon, active equipment tags, and dynamic availability indicator (Green dot for "Available Now", Amber for "Reserved at 2:00 PM").

### Buttons
- **Primary:** Background `#4F46E5`, text `#FFFFFF`, font `label-lg`, hover state `#4338CA`, active compression effect.
- **Secondary:** Surface `#FFFFFF`, border `1px solid #E2E8F0`, text `#1E293B`, hover `#F8FAFC`.
- **Destructive:** Surface `#FEF2F2`, border `1px solid #FCA5A5`, text `#B91C1C`.

### Status & Type Chips
- Structured as `label-sm`, pill-shaped, height 24px, padding `0 10px`.
- **Exams:** Background `#FEF2F2`, text `#DC2626`, border `1px solid #FEE2E2`.
- **Classes:** Background `#EFF6FF`, text `#2563EB`, border `1px solid #DBEAFE`.
- **Labs:** Background `#ECFDF5`, text `#059669`, border `1px solid #D1FAE5`.
- **Events:** Background `#FFF7ED`, text `#EA580C`, border `1px solid #FFEDD5`.

### Form Fields & Reservation Time Selectors
- Standard text inputs, date pickers, and room filter dropdowns feature `#FFFFFF` surface, `1px solid #CBD5E1` border, `8px` corner radius, and subtle focus ring (`0 0 0 3px rgba(79, 70, 229, 0.15)` with `#4F46E5` border).

### Interactive Schedule Timeline / Grid Slots
- Daily and weekly schedule calendar tracks reserve a clean white canvas segmented by vertical 1-hour lines (`#F1F5F9`).
- Block slots use the respective category colors with a 15% opacity fill, 3px solid left accent strip, and high-contrast text for event titles and reserving faculty.