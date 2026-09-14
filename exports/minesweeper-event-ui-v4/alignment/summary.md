# Minesweeper / Common Event UI alignment verification

- Version: `minesweeper-event-ui-v4`, based on `packaging-factory-v3`
- Local URL: `http://127.0.0.1:4173/`
- Primary viewport: 1920 × 1080, device scale factor 1
- Deterministic seed: `0x5a17 + layout index`

## Confirmed causes and fixes

1. The common scene background is already a UI-free 1672 × 941 scene. The circular plate and wooden HUD are separate decorative layers attached to the existing mark and HUD nodes; they are not duplicated or baked into the background.
2. The title-panel artwork used `inset: 6px 10px`, so its visible edge did not match the shared header container. It now uses the container's full bounds.
3. Event mode changed the title/dialogue font family, which changed glyph metrics. Both modes now use the same inherited font metrics, with safe line height and non-layout padding to avoid clipping.
4. Closed cells used `background-size: contain` while open and numbered cells used `100% 100%`. All tile backgrounds now use the same cell bounds.
5. The flag layer had independent width/height scaling. It now preserves its source aspect ratio with `auto 74%` and remains centered inside the unchanged button hit area.
6. The asset script removed every magenta-looking pixel in an image. It now removes only edge/transparent-boundary-connected magenta pixels, preserving internal pink, red, purple, highlights, and shadows.

## Verification results

- Valid Minesweeper Packaging combinations: 1023
- Combination failures: 0
- Console/page errors: 0
- Duplicate game frame, game stage, board, HUD, or Packaging panel: none
- Full sprite atlas displayed at runtime: no
- Prototype/event maximum `getBoundingClientRect()` delta: 0 CSS px for all three representative layouts
- Game state preserved during conversion, reveal, and restore: yes
- Continued interaction after conversion: yes
- Text overflow in the three representative layouts: none
- Decorative pointer events: disabled
- Header artwork inset: 0 px on all sides
- Cell hit areas: square and consistently sized within the 1 CSS px acceptance threshold

### Responsive matrix

All three layouts passed at 1920 × 1080, 1440 × 900, and 1366 × 768: no horizontal overflow, no Packaging clipping, board inside the game container, modules inside the frame, and frame fully visible.

At 390 × 844, the existing mobile design intentionally becomes vertically scrollable. It still has no horizontal overflow, no clipped Packaging content, and keeps both the board and modules inside their containers.

## Screenshots

Each layout has a prototype screenshot, event screenshot, and a debug screenshot. Debug colors show the shared component bounds and the visual decoration bounds without changing layout.

- `screenshots/sidebar-right-prototype.png`
- `screenshots/sidebar-right-event.png`
- `screenshots/sidebar-right-debug.png`
- `screenshots/bottom-cards-prototype.png`
- `screenshots/bottom-cards-event.png`
- `screenshots/bottom-cards-debug.png`
- `screenshots/sidebar-left-prototype.png`
- `screenshots/sidebar-left-event.png`
- `screenshots/sidebar-left-debug.png`

Machine-readable measurements and asset alpha bounds are in `verification-report.json`.

## Deferred, out of scope

Maze wall/floor fragment rendering remains a separate asset-reference and slice-alignment task. No Maze or Tetris layout/game code was changed in this pass.
