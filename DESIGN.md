---
name: SCW Digital Card
description: Digital business card and admin tool for Siam Cotton Wool Ltd.
colors:
  scw-green: "#1D9E75"
  scw-green-dark: "#0F6E56"
  scw-green-deep: "#085041"
  scw-green-mid: "#9FE1CB"
  scw-green-pale: "#E1F5EE"
  slate-blue: "#4a6fa5"
  slate-blue-pale: "#e8f0fe"
  alert-red: "#b91c1c"
  alert-red-pale: "#fde8e8"
  neutral-bg: "#f0f4f2"
  neutral-surface: "#ffffff"
  neutral-ink: "#1a1a1a"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "normal"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.04em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "13.5px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "10.5px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.03em"
rounded:
  sm: "8px"
  md: "9px"
  btn-card: "10px"
  lg: "14px"
  xl: "18px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.scw-green}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "11px 16px"
  button-primary-hover:
    backgroundColor: "{colors.scw-green-dark}"
  button-secondary:
    backgroundColor: "{colors.scw-green-pale}"
    textColor: "{colors.scw-green-dark}"
    rounded: "{rounded.md}"
    padding: "11px 16px"
  button-danger:
    backgroundColor: "{colors.alert-red-pale}"
    textColor: "{colors.alert-red}"
    rounded: "{rounded.md}"
    padding: "11px 16px"
  badge-title-pill:
    backgroundColor: "rgba(255,255,255,0.92)"
    textColor: "{colors.scw-green-deep}"
    rounded: "999px"
    padding: "4px 12px"
  input-field:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  card-surface:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.xl}"
---

# Design System: SCW Digital Card

## 1. Overview

**Creative North Star: "The Pocket Introduction"**

This system exists to hand someone your contact details and get out of the way. Every surface in this project either *is* the introduction (the card a contact scans and saves) or *manages* the introduction (the admin tool IT staff use to keep that data correct). Neither surface is trying to impress; the card's job is to read clean on a phone screen for the five seconds between "scan QR" and "save contact," and the admin tool's job is to make CRUD operations against the GitHub API feel safe and obvious, not stylish.

The visual language stays close to its print-card ancestor: one brand green, a calm light surface, soft elevation, and no decoration that doesn't carry information. Per PRODUCT.md's anti-references, this system explicitly rejects gradient text, repeated uppercase eyebrow tags, identical card-grid filler, and decorative glassmorphism — none of those serve "share contact info" or "manage employee data," so none of them appear here.

**Key Characteristics:**
- One committed brand color (`#1D9E75`) carries identity; everything else is neutral or semantic.
- Soft, quiet elevation (shadow + hairline border) — never flat, never heavily layered.
- Mobile-first card surface; desktop-first admin surface. Same tokens, different density.
- Admin clarity (loading states, save confirmations, gated actions) outranks admin decoration.

## 2. Colors

The palette is restrained: one brand green family carries identity, a slate blue and alert red exist only for semantic admin states, and everything else is neutral.

### Primary
- **SCW Signal Green** (`#1D9E75`): the brand color. Card header background, primary buttons, focus rings, links to saved info (phone/email) on the card.
- **Deep Signal Green** (`#0F6E56`): hover/active state for Signal Green, and the text color used on tinted green surfaces (secondary buttons, info-icon labels) where full-saturation green would be too loud against a light tint.
- **Signal Green Tint** (`#E1F5EE`): the pale surface behind secondary buttons and info-icon badges — green's presence without green's weight.

### Secondary
- **Slate Info Blue** (`#4a6fa5`) / **Slate Info Blue Pale** (`#e8f0fe`): admin-only semantic pair for "edit" actions and informational states. Never appears on the public-facing card.

### Neutral
- **Mist Background** (`#f0f4f2`): the page background behind every card and every admin panel.
- **Paper Surface** (`#ffffff`): card and panel surfaces sitting on the mist background.
- **Near-Black Ink** (`#1a1a1a`): primary text and the toast notification background in admin.

### Named Rules
**The Single Accent Rule.** Signal Green is the only brand color in the system. Blue and red exist solely as semantic admin states (info/edit, danger), never as decoration, and never on the public card surface.

## 3. Typography

**Display/Body/Label Font:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif (system stack — no webfont load, no font-pairing decision to make; this keeps the card fast on a phone fresh off a QR scan).

**Character:** A plain, confident system sans doing all the work. No serif counterpoint, no display face — the personality comes from scale and color discipline, not typeface choice.

### Hierarchy
- **Display** (600, 22px, line-height 1.15): the employee's name on the card header — the single largest, most important piece of text in the system.
- **Headline** (600, 17px, line-height 1.3): admin page titles ("เพิ่มพนักงานใหม่", "แก้ไขพนักงาน").
- **Title** (600, 11px, letter-spacing 0.04em): the job-title pill on the card header — uppercase-weight emphasis without going full uppercase-eyebrow.
- **Body** (500, 13.5px, line-height 1.4): info-row values (phone, email, links) and admin field input text.
- **Label** (600, 10.5px, letter-spacing 0.03em): info-row captions and admin panel section labels — small and muted, never the loudest thing on screen.

### Named Rules
**The One Display Rule.** Only the employee's name uses the 22px display size. Job titles, section headers, and everything else stay at headline size or smaller, so the name is unmistakably the page's one hero element.

## 4. Elevation

This system is lifted, not flat — every primary surface (card, admin panel) carries a soft ambient shadow plus a near-invisible hairline border, never a hard drop shadow. Depth is consistently shallow: nothing floats far off the page, nothing stacks more than one layer deep.

### Shadow Vocabulary
- **Card Lift** (`box-shadow: 0 2px 12px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06)`): the digital card surface against the mist background.
- **Panel Lift** (`box-shadow: 0 1px 6px rgba(0,0,0,.06), 0 0 0 .5px rgba(0,0,0,.05)`): admin panels — slightly quieter than the card lift, since the admin tool is a workspace, not a presentation surface.

### Named Rules
**The Lifted-but-Quiet Rule.** Every shadow pairs a soft blur with a hairline border at half-pixel width. The border keeps edges crisp at low shadow opacity; never increase blur or opacity to fake more depth — add the hairline instead.

## 5. Components

### Buttons
- **Shape:** admin buttons use a gently rounded corner (9px); the card's save button rounds slightly more (10px) to feel native to the card's own 18px outer radius.
- **Primary:** solid Signal Green background, white text, 11px/16px padding (`button-primary`). Used for the one primary action per screen — save, send.
- **Hover / Focus:** primary buttons darken to Deep Signal Green on hover; focus shows a 3px Signal-Green glow ring (`box-shadow: 0 0 0 3px rgba(29,158,117,.1)`) shared with input focus states, so keyboard focus reads consistently across the whole admin tool.
- **Secondary / Danger:** Secondary uses Signal Green Tint background with Deep Signal Green text and border — same shape and padding as primary, lower visual weight. Danger swaps in Alert Red Pale / Alert Red for destructive admin actions (delete card), with a solid-red variant reserved for the final confirm step.

### Cards / Containers
- **Corner Style:** 18px on the public card shell, 14px on admin panels — the public card is allowed a softer, more generous curve since it's the product's hero surface.
- **Background:** Paper Surface (`#ffffff`) on Mist Background (`#f0f4f2`).
- **Shadow Strategy:** Card Lift / Panel Lift, see Elevation.
- **Border:** none beyond the hairline baked into the shadow.
- **Internal Padding:** scales from `md` (12px) to `2xl` (24px) depending on surface density — admin panels run tighter, the card's header runs looser.

### Inputs / Fields
- **Style:** white background, 1px `#e4e4e4` border, 8px radius.
- **Focus:** border shifts to Signal Green plus the same 3px green glow ring used on buttons — one focus language for the whole admin tool.
- **Error / Disabled:** disabled inputs are not used as a gating mechanism in this system — see the Don'ts below; sections that aren't ready yet are hidden (`display:none`), not shown disabled.

### Title Pill (signature component)
The job-title badge on the card header: a near-opaque white pill (`rgba(255,255,255,0.92)` background, Deep Signal Green text, fully rounded) sitting directly on the Signal Green header. Originally translucent white-on-white-tint with white text, but that recipe capped contrast at 2.74:1 — below WCAG AA even for the page's highest-visibility text. Revised to a solid-reading badge so the job title stays legible without inventing a new color (text uses the existing `--scw-green-deep` token).

## 6. Do's and Don'ts

### Do:
- **Do** keep Signal Green (`#1D9E75`) as the only brand accent — preserve the existing palette per PRODUCT.md rather than reinventing it.
- **Do** pair every shadow with a 0.5px hairline border (Card Lift / Panel Lift) — never a bare blur.
- **Do** hide admin sections that depend on an unsaved record (`display:none`) rather than showing them disabled with a hint message — this system gates by visibility, not by `disabled` + caption.
- **Do** use the shared 3px Signal-Green focus glow on every focusable control (buttons and inputs alike) for one consistent keyboard-focus language.

### Don't:
- **Don't** use gradient text. PRODUCT.md flags this explicitly as a tell of AI-generated design.
- **Don't** add a tiny uppercase tracked eyebrow above sections — PRODUCT.md calls out "repeated uppercase eyebrow tags" by name as something this system must not read as.
- **Don't** repeat identical card-grid filler — each employee card is one specific person's information, not a templated grid tile.
- **Don't** use glassmorphism decoratively. The system has no decorative translucent surfaces; the Title Pill is now a solid badge for contrast reasons (see Components).
- **Don't** invent a second brand color. Blue and red exist only as admin semantic states (info/edit, danger) and must never appear on the public card.
