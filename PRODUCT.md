# Product

## Register

product

## Users

Two distinct personas:

1. **External contacts / clients** — receive a card link or scan a QR code on a phone. They want to read contact info quickly and save it as a vCard contact. Mobile is the primary surface; this is a one-shot, low-attention interaction (open link → save contact → leave).
2. **SCW internal staff (IT/admin)** — use the `admin/` tool to add, edit, and delete employee cards via the GitHub API. They want speed and clear feedback (save succeeded, token invalid, etc.), not visual flourish.

## Product Purpose

Give every Siam Cotton Wool Ltd. employee a digital business card that can be shared instantly via QR code or link, replacing printed cards. The `admin/` tool lets non-developers (IT staff) manage employee card data without touching code or running a build.

## Brand Personality

Modern & Minimal. Clean, clear, no unnecessary ornamentation. The card should read as professional and trustworthy without feeling corporate-stiff — it represents a real person's contact info, not a marketing pitch.

## Anti-references

Must not read as AI-generated: no gradient text, no repeated uppercase eyebrow tags, no identical card-grid filler, no glassmorphism used decoratively. The existing SCW green identity (`#1D9E75` family) is committed brand color — preserve it rather than reinventing the palette.

## Design Principles

- **Function over decoration** — every element serves either "share contact info" or "manage employee data." Nothing is there to look impressive.
- **Mobile-first for the card surface** — cards are opened from a QR scan on a phone far more often than desktop.
- **One shared source of truth** — all employee cards reuse `assets/card.css` / `assets/card.js`; visual changes happen once, not per-card.
- **Admin clarity over admin beauty** — loading states, save confirmations, and gating (e.g. disabling actions until a save succeeds) matter more than visual polish in the admin tool.
- **Preserve existing identity** — don't replace the SCW green palette or established card layout without a clear reason.

## Accessibility & Inclusion

Standard WCAG AA expectations: sufficient color contrast, readable type sizes, keyboard-operable admin forms. No additional accommodations requested beyond the standard baseline.
