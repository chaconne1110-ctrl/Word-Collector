---
name: Lexicon Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444651'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#442100'
  on-tertiary: '#ffffff'
  tertiary-container: '#653400'
  on-tertiary-container: '#fc922b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  term-en-title:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.015em
  term-kr-title:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-ui:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-lg: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers an authoritative, high-efficiency lexical study environment tailored for engineers, researchers, and technical scholars. The visual style merges modern academic utility with disciplined product engineering: clean structure, deliberate white space, crisp typography, and restrained tactile interactions.

### Personality & Tone
- **Intellectual & Rigorous:** Free of gamified clutter; emphasizes focus, clarity, and structural balance.
- **Systematic & Predictable:** Consistent interaction surfaces, calibrated tactile feedback, and intuitive spatial hierarchies.
- **Calm & High-Contrast:** Ensures prolonged readability under rigorous technical review, eliminating cognitive fatigue during intensive study sessions.

### Aesthetic Paradigm
The interface adopts a **Modern Structural Minimalism** approach supported by subtle tonal layering, refined hairline borders (`1px solid slate-200`), and ambient elevation. Semantic color accents guide comprehension: authoritative deep indigo for core interaction, emerald for validated mastery, and amber for algorithmic synthesis or pending review.

## Colors

The palette establishes an immediate sense of academic authority, balance, and technical precision. Surface contrasts are calibrated to meet strict WCAG AAA guidelines for primary text hierarchy and AA for secondary metadata.

### Core Swatches
- **Primary (`#1E3A8A` / Deep Indigo):** Anchor color for primary actions, selected navigation states, interactive states, and core technical headers.
- **Secondary (`#059669` / Emerald):** Verification status, validated lexical entries, memorization benchmarks, and positive retention outcomes.
- **Tertiary (`#D97706` / Technical Amber):** Temporary machine-generated insights, AI-assisted derivations, context-verification flags, and draft states.
- **Neutral Primary (`#0F172A` / Slate 900):** English headwords, core definitions, and authoritative body copy.

### Canvas & Surface Hierarchy
- **Canvas Base:** `#F8FAFC` (Slate 50) delivers a soft, glare-free background.
- **Card Surface:** `#FFFFFF` (Pure White) isolates discrete lexical records and inputs.
- **Muted Surface:** `#F1F5F9` (Slate 100) separates contextual metadata chips and IPA phonetic tracks.
- **Structural Outlines:** `#E2E8F0` (Slate 200) renders crisp 1px borders across all card containers.
- **Text Secondary / Muted:** `#475569` (Slate 600) for Korean equivalents and grammatical tags; `#94A3B8` (Slate 400) for phonetic guides and meta-timestamps.

## Typography

The typographic hierarchy balances technical rigor with multi-language legibility:
- **Headwords & Engineering Terminology (`Space Grotesk`):** Delivers clean geometric forms that give technical phrases and scientific jargon sharp structural definition.
- **Korean Definitions & Descriptive Prose (`Inter` / system-fallback `Pretendard`):** Provides uniform optical rhythm, high x-height, and neutral rendering for complex multi-script pairings.
- **Lexical Metadata, IPA & Syntax Tokens (`JetBrains Mono`):** Standardizes pronunciation keys, part-of-speech attributes, source references, and corpus indexing codes.

### Bilingual Typesetting Rules
- **English-to-Korean Headword Contrast:** In vocabulary cards, English terms take structural dominance via `Space Grotesk Bold` (`term-en-title`, 22px / Slate 900), followed immediately by the Korean definition in `Inter SemiBold` (`term-kr-title`, 17px / Slate 700) with a 4px vertical gap.
- **Phonetics & Grammar:** Displayed in `JetBrains Mono` (`label-mono`, 12px) wrapped in brackets or enclosed within tonal badges.

## Layout & Spacing

The layout is built on a disciplined 4px/8px modular rhythm, optimized specifically for vertical single-column mobile ergonomics and responsive tablet sheets.

### Mobile Grid & Layout Principles
- **Screen Margins:** Fixed `1rem` (16px) left/right padding on standard devices (360px–428px width); expands to `1.5rem` (24px) for tablet/foldable viewports.
- **Vertical Rhythm:** 
  - Standard intra-card padding: `1.25rem` (20px).
  - Inter-card list stack: `0.75rem` (12px) gap.
  - Section header margin-bottom: `0.75rem` (12px).
- **Touch Target Integrity:** All interactive affordances (icon buttons, tab bar triggers, status selectors) enforce a strict minimum target bounding box of `48px × 48px` with at least 8px clearance between adjacent hit targets.

## Elevation & Depth

Visual hierarchy uses a refined combination of flat structural borders and low-spread ambient shadows, maintaining a tactile feel without visual noise.

### Layer Architecture
1. **Canvas Layer (Level 0):** Background surface (`#F8FAFC`). Pure flat plane without elevation or borders.
2. **Card Surface (Level 1):** White container (`#FFFFFF`) with a `1px` solid outline in `#E2E8F0` and an ambient shadow: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`.
3. **Active / Pressed Cards (Level 1 Hover/Press):** Border transitions to `#CBD5E1`, with elevation adjusting to `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
4. **Floating Chrome & Bottom Navigation Bar (Level 2):** Elevated sticky bar anchored to the bottom edge. Features a frosted background (`rgba(255, 255, 255, 0.92)` with `backdrop-filter: blur(12px)`), framed with a top hairline border (`1px solid #E2E8F0`) and an ambient upward projection: `box-shadow: 0 -4px 12px 0 rgba(15, 23, 42, 0.04)`.
5. **Modal / Action Drawers (Level 3):** Rendered with a solid white background, framed by a soft boundary shadow: `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)`.

## Shapes

The shape hierarchy establishes precise structure across all components:
- **Base Geometry (`roundedness: 2`):** Primary cards, search fields, and contextual modals use an `8px` (`0.5rem`) corner radius.
- **Containers & Prominent Cards (`rounded-lg`):** Vocabulary focus cards and study modules use a `16px` (`1rem`) radius to produce balanced inner and outer edge contours.
- **Functional Chips & Badges (`rounded-full`):** Grammatical category flags, IPA pronunciation tags, and verification indicators use pill geometry (`9999px`) to visually differentiate them from actionable rectangular cards.
- **Action Buttons:** Standard action buttons use an `8px` corner radius, while the central floating navigation trigger ("Plus") uses an ergonomic squircle or unified circular target.

## Components

### Vocabulary Term Card (Primary Atom)
- **Container:** Pure white card surface, `1px solid #E2E8F0`, `16px` corner radius, `20px` internal padding.
- **Header Row:** Flex container aligning English Term (`term-en-title`, `#0F172A`) on the left, with the Bookmark toggle icon button (`44px × 44px` touch region) on the right.
- **Sub-Header:** Part of speech pill (`#F1F5F9`, text `#475569`, `label-mono`) followed by IPA pronunciation (`#94A3B8`).
- **Translation Body:** Korean equivalent rendered in `term-kr-title` (`#1E293B`), followed by sample sentence strings in `body-sm` (`#475569`) with keyword bolding in `#1E3A8A`.
- **Status Footer:** Dynamic verification indicator badge:
  - *Verified State:* Emerald pill (`#ECFDF5`, text `#047857`, 1px border `#A7F3D0`) with a checkmark icon.
  - *AI Review State:* Amber pill (`#FFFBEB`, text `#B45309`, 1px border `#FDE68A`) with a spark/caution icon.

### 3-Tab Bottom Navigation Bar
- **Geometry:** Height of `68px` (excluding iOS Home indicator safe-area offset), pinned to the screen bottom. Translucent white base with `backdrop-filter: blur(12px)` and a top border in `#E2E8F0`.
- **Layout:** 3-column equidistant layout:
  1. **Home:** Icon + label (`11px` Inter). Active: `#1E3A8A`; Inactive: `#94A3B8`.
  2. **Plus (Quick Capture / AI Parser):** Elevated circular button (`48px × 48px`) centered within its column, filled with `#1E3A8A`, featuring an internal `20px` white plus icon. Elevated with `box-shadow: 0 4px 10px rgba(30, 58, 138, 0.3)`.
  3. **Bookmark (Saved Archive):** Icon + label (`11px` Inter). Displays count badge in `#059669` when new items are saved.

### Buttons
- **Primary:** Filled `#1E3A8A`, text `#FFFFFF`, height `48px`, font `label-ui` (14px SemiBold). Pressed state: `#172554`.
- **Secondary / Surface:** Background `#F1F5F9`, text `#1E3A8A`, border `1px solid #E2E8F0`, height `48px`.
- **Ghost Action:** Background transparent, text `#475569`, hover/press `#F8FAFC`.

### Chips & Badges
- **Engineering Taxonomy Chips:** Padding `4px 10px`, font `label-mono` (12px), background `#F8FAFC`, border `1px solid #CBD5E1`, text `#334155`.
- **AI Temporary Review Badge:** Amber container (`#FEF3C7`), text `#92400E`, border `1px solid #FCD34D`.
- **Mastered / Verified Badge:** Emerald container (`#D1FAE5`), text `#065F46`, border `1px solid #6EE7B7`.

### Input Fields & Search Query Bar
- **Base Style:** Height `50px`, background `#FFFFFF`, border `1px solid #CBD5E1`, corner radius `8px`, horizontal padding `16px`.
- **Focus State:** Border switches to `2px solid #1E3A8A`, zero native outline, soft focus ring with 3px spread of `rgba(30, 58, 138, 0.08)`.
- **Placeholder:** `#94A3B8`, typographic style `body-md`.

### Checkbox & Radio Selection
- **Checkbox:** `20px × 20px`, corner radius `4px`, border `1.5px solid #CBD5E1`. Selected state: `#1E3A8A` background with crisp white geometric checkmark.
- **Radio Button:** `20px × 20px`, outer ring `1.5px solid #CBD5E1`. Selected state: `#1E3A8A` ring enclosing a solid `10px` indigo center dot.