---
name: NeuroCut AI Studio
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb873'
  on-tertiary: '#4b2800'
  tertiary-container: '#e89337'
  on-tertiary-container: '#5b3200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdcbf'
  tertiary-fixed-dim: '#ffb873'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6a3b00'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  section-header:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.1em
  body-standard:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  stack-gap: 12px
---

## Brand & Style

The design system is engineered for a high-performance AI video production environment. It prioritizes an "Antigravity" aesthetic—elements should feel weightless, suspended in a deep-space vacuum. The target audience consists of professional creators and technical directors who require a high-density, distraction-free workspace that feels both futuristic and surgical.

The visual style is a hybrid of **Minimalism** and **Glassmorphism**. By utilizing deep blacks and translucent layers, the UI creates a sense of infinite depth. The emotional response should be one of "effortless power"—the interface stays out of the way until needed, then responds with precision and cinematic flair.

## Colors

The palette is anchored in a true-dark foundation to maximize contrast with glass layers.

- **Background**: `#09090b` (Zinc 950) provides the "void" for the antigravity effect.
- **Primary (Cyan)**: `#06b6d4` is used exclusively for active states, data processing indicators, and "Synthesis" highlights. It carries a subtle outer glow.
- **Success (Green)**: `#10b981` is reserved for "Asset Forging" completion and finalized pipeline stages.
- **Glass Layers**: Surfaces use `rgba(24, 24, 27, 0.4)` (Zinc 900 at 40%) with a heavy `blur(20px)` to create the frosted depth.

## Typography

This design system utilizes a trio of fonts to balance modernity with technical precision. 

**Geist** provides the structural, geometric foundation for all headlines and brand moments. **Inter** handles the heavy lifting of scripting and interface copy, ensuring readability at any scale. **JetBrains Mono** is introduced for technical metadata, timestamps, and pipeline stage labels (e.g., "ASSET FORGING") to reinforce the "studio tool" utility.

Text colors should remain high-contrast (Zinc 50) for primary content and mid-contrast (Zinc 400) for secondary metadata.

## Layout & Spacing

The layout utilizes a **Fixed Grid** philosophy for the main workspace to ensure timeline precision, transitioning to a **Fluid Grid** for the asset library.

- **Desktop**: 12-column grid with a fixed left-hand navigation sidebar (72px collapsed / 240px expanded). 
- **Workspaces**: Main stage panels (Scripting, Storyboarding) are separated by "air"—using 24px gutters to allow the background blur to be visible between modules, enhancing the antigravity feel.
- **Rhythm**: All spacing follows a 4px base unit. Component padding should favor generous horizontal breathing room (e.g., 12px vertical / 20px horizontal).

## Elevation & Depth

Depth is not achieved through shadows, but through **Tonal Opacity** and **Backdrop Blurs**.

- **Level 0 (Floor)**: `#09090b` solid.
- **Level 1 (Panels)**: `rgba(24, 24, 27, 0.4)` with `backdrop-filter: blur(20px)`. These panels feature a `1px` border of `white/10`.
- **Level 2 (Modals/Popovers)**: `rgba(39, 39, 42, 0.6)` with `backdrop-filter: blur(40px)`. These should have a subtle top-down gradient stroke (white/20 at the top, white/5 at the bottom).
- **Floating Effect**: Interactive elements like active video playheads or synthesis nodes utilize a **Cyan Glow** (`0px 0px 15px rgba(6, 182, 212, 0.3)`) rather than a traditional black shadow.

## Shapes

The design system employs a **Soft** (Level 1) roundedness strategy. This 4px–12px range maintains a technical, "engineered" appearance without the aggression of sharp corners or the playfulness of pill shapes.

- **Standard Elements**: 4px (`0.25rem`) for buttons, inputs, and small modules.
- **Containers**: 8px (`0.5rem`) for main workspace panels and cards.
- **Media**: Video thumbnails and canvas previews should use 12px (`0.75rem`) to create a distinct visual frame for the content.

## Components

### Buttons
- **Primary**: Solid Cyan background with black text. On hover, apply a 20px Cyan outer glow.
- **Secondary**: Glass background (`white/5`) with `white/10` border and Cyan text.
- **Ghost**: No background, `white/40` text. Transitions to `white/100` on hover.

### Pipeline Status (The "Forge" Indicator)
A specialized component for the five stages (Ingestion to Synthesis). Each stage is represented by a Mono-labeled chip.
- **Inactive**: `white/10` border, `white/20` text.
- **Active**: Cyan border, Cyan text, and a pulsing "Antigravity" dot animation.
- **Complete**: Green border, Green text.

### Input Fields
Minimalist underline or subtle glass box. No background by default; `white/5` background on focus. Text cursor is always Cyan.

### Cards & Media Modules
All cards must use the `backdrop-blur-xl` and `border-white/10` specification. Titles should be in Geist, while technical stats (FPS, Resolution, Tokens) use JetBrains Mono in a smaller font size.