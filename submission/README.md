# Awwwards submission package

Everything here is generated from the live page by `npm run cards` and `npm run proof`. Regenerate
before submitting, because a thumbnail captured during the build will not match a page that has
changed since.

## Files

| File | What it is | Where it comes from |
|---|---|---|
| `thumb-desktop.png` | 1200x900, the shelf mid-scroll with a card interaction readable | `npm run cards` |
| `thumb-mobile.png` | 840x1492 at 2x, built for the format rather than squeezed from desktop | `npm run cards` |
| `../docs/proof/hover-card.png` | The hover cursor over a shelf card | `npm run proof` |
| `../docs/proof/sheet-open.png` | The booking sheet raised, real Calendly embed mounted | `npm run proof` |
| `../docs/proof/featured-pin.png` | The featured pin mid-hold with step 03 lit | `npm run proof` |
| `../assets/img/og.png` | 1200x630 social card | `npm run cards` |

The desktop thumbnail is deliberately a mid-scroll frame rather than the hero. The shelf is the
idea, so the thumbnail shows the shelf.

## Description, two or three sentences

> A shelf of thirteen live sites, laid out the way a shop lays out stock, where every card opens the
> real deployment in a new tab instead of a case study. The persistent bottom bar that a storefront
> gives to its cart is given to a real booking sheet instead, so the gesture a shopper reaches for
> when they are ready to buy is the same gesture that picks a time. The logo is a browser window
> holding two chevrons and a cursor, and all three parts are reused as the page's only ornament:
> dots mark the sections, chevrons bracket the numbers, and on a fine pointer the cursor itself
> becomes the hover label.

## Categories

Portfolio, Web and Interactive, Typography, Animation.

## Technologies

GSAP, ScrollTrigger, SplitText, Lenis, Calendly, Node. No framework and no CMS. Switzer,
self-hosted.

## Elements worth submitting separately

This is the most underused route to visibility on the platform, and a two or three minute screen
recording of each costs almost nothing.

1. **Shelf to sheet.** Hover a card so the cursor becomes the label, open the real site, come back,
   then hit the bar and pick a time. The whole argument of the site in one gesture.
2. **The featured pin.** The PAS FACILE screenshot holding while four lines of real build detail
   advance beside it, then releasing. `npm run pin` reports that it holds through the final step
   across 40 to 56 percent of the section depending on viewport height.

## Before submitting

Run the full suite against the live URL, not localhost:

```bash
NS_URL=https://<live-url>/ npm run check
NS_URL=https://<live-url>/ npm run a11y
NS_URL=https://<live-url>/ npm run vitals
```

A juror who opens a broken link on a developer's own portfolio has already decided. `npm run check`
fetches all thirteen shelf links and exits non-zero if any of them stops answering.

## What is honest to claim, and what is not

Claimable, because it is measured and reproducible: Lighthouse mobile 100 across performance,
accessibility, best practices and SEO. Zero axe-core violations in four states. CLS of 0. Thirteen
of thirteen shelf links answering.

Not claimable: any traffic, ranking or conversion result for the client sites. There is no
analytics access to any of them, so the page describes what each build does rather than what it
achieved. Do not add a number to this submission that you cannot show someone.
