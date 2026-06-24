# Pixel Forge Design System

## Product Read

- Product: portrait photo to pixel avatar generator.
- Primary users: casual creators who want a usable social avatar quickly.
- Primary job: upload a portrait, compare pixel treatments, download a PNG.
- Experience goal: crisp, tactile, image-first, lightweight, and trustworthy.
- Avoid: generic pixel-art toy site, noisy retro game UI, AI-purple gradients, fake metrics, competitor mentions.

## Principles

- Face first: the uploaded portrait and generated avatar are always the hero of the interface.
- Few decisions: expose presets first, keep detailed controls secondary.
- Immediate feedback: upload, preset selection, variant selection, and download must feel responsive.
- Clean craft: pixel aesthetics appear in the output and small texture details, not in every piece of typography.

## Visual Language

- Theme: cool off-white surface with graphite panels and one amber accent.
- Accent color: `#ff9f1c` for primary actions, active states, and selected controls only.
- Neutral palette: off-white `#f6f4ef`, graphite `#171717`, muted gray `#6d6a63`, line `rgba(23,23,23,.12)`.
- Typography: system sans stack with tight display headings and readable body copy.
- Radius system: 28-36px for large panels, 18-22px for cards, full pill for buttons and chips.
- Spacing scale: 8px base, generous hero spacing, compact control groups.
- Icon style: avoid decorative icons unless they clarify an action.
- Image style: use real demo portrait assets and generated canvas previews. Avoid fake product screenshots.

## Interaction Rules

- Navigation: one-line desktop nav, simplified mobile nav.
- Primary action: `上传照片` is the only primary intent across the page.
- Secondary action: `试试示例` is secondary and consistent.
- Feedback: status text must state the current generation state plainly.
- Motion: subtle entrance and scroll reveal only. Motion supports hierarchy, not spectacle.
- Loading: status text changes immediately while rendering.
- Empty state: upload drop zone explains what image works best.
- Error state: use plain language and keep the local preview path available.

## Components

- Button: pill shape, tactile pressed state, high contrast, no wrapping on desktop.
- Input: visible label, strong focus state, no placeholder-as-label.
- Card: use elevation only for the generator and image surfaces.
- Details panel: advanced controls stay collapsed by default.
- Toast / alert: not used in MVP. Prefer inline status.
- Form: controls are grouped by task, not by implementation detail.

## Accessibility

- Contrast: buttons and body text must pass WCAG AA.
- Keyboard: upload label, buttons, details summary, selects, and ranges must be keyboard reachable.
- Focus: use visible amber focus rings.
- Reduced motion: all GSAP animation disabled under `prefers-reduced-motion`.
- Touch target: interactive controls should be at least 44px tall.

## Banned Patterns

- Public competitor mentions.
- AI-purple/blue gradient identity.
- Fake precision metrics or fake testimonial copy.
- Three identical icon feature cards.
- Decorative status dots.
- Div-based fake screenshots.
- Dense retro-game UI that makes the tool harder to use.
