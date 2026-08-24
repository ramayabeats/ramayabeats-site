# RDS-001 — Global Header v1.0

**Status:** Implemented / visual approval pending
**Scope:** Home, Incubator and all collection pages

## Purpose

Give every Ramaya page one stable brand and navigation layer while allowing individual worlds to keep their own local interface below it.

## Navigation

`HOME · INCUBATOR · COLLECTIONS · YOUTUBE`

- The current section uses `aria-current="page"` and a thin cyan indicator.
- YouTube opens in a new tab.
- The mobile menu is keyboard accessible, closes with Escape and locks page scrolling while open.

## Visual direction

- Premium dark archive: restrained borders, generous spacing and translucent material.
- NASA-like system metadata is secondary to navigation.
- `SYSTEM ONLINE` is atmospheric status, not a primary action.
- Brainrot Incubator uses a separate local module below the global header.

## Branding asset

The header uses the approved transparent `assets/ramaya-logo-header-transparent.png` artwork alongside the typographic Ramaya Beats Studio lockup. This keeps the brand legible without visually dominating the global navigation. A transparent compact derivative at `assets/ramaya-emblem-transparent.png` is used as the browser favicon and small universe mark.

The rejected horizontal artwork, temporary `assets/favicon.svg` and legacy `assets/favicon + prawdziwe logo strony.png` are not rendered by the header.
