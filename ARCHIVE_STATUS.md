# Archive status — 2026-09-15

This repository preserves the latest local PixelLife work-in-progress state.

Validation at archive time:

- `npm run validate:content`: passed
- `npm run build`: failed because the locally deleted `index.html` remains the
  Vite entry point
- The deletions, content edits, and new `src/game/` work were intentionally
  preserved as-is instead of being repaired during archival.

To resume, restore or replace the Vite entry point, run `npm install`, and then
rerun the content validation and build commands.
