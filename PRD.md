# PRD: Icon Assets Generator Experiment

## Status

Experimental product direction for expanding IconSlicer from an image slicing/editor tool into an AI-assisted icon asset generator.

## Summary

IconSlicer currently helps users upload an icon sheet, crop it, remove backgrounds, adjust visual properties, define slice grids, and export individual icons. This experiment adds a generation workflow powered by Banana/Nano Banana-style image generation so users can create coherent icon sheets from prompts, edit/regenerate selected assets, then use the existing slicing and export pipeline.

## Assumption: “Banana”

For this PRD, “banana” means Nano Banana / Gemini image generation capabilities: text-to-image and image-editing APIs suitable for generating or transforming visual assets. If a different provider named Banana is intended, update the integration section before implementation.

## Goals

- Generate production-ready icon sets from a short creative brief.
- Preserve the existing upload → crop → slice → export workflow.
- Add AI generation as an optional starting point, not a replacement for manual image processing.
- Support consistent style across all generated icons in one asset pack.
- Export icons as transparent PNG files and zipped asset bundles.

## Non-Goals

- Full vector/SVG authoring in the first experiment.
- Marketplace publishing or asset licensing management.
- Multi-user collaboration.
- Persistent cloud project storage.
- Fine-tuned custom models.

## Target Users

- Indie game developers needing fast UI/item/ability icons.
- App builders needing placeholder-to-polished icon assets.
- Designers exploring style directions for icon packs.
- Developers who want quick transparent PNG exports without manual slicing work.

## Current Baseline

- Stack: Next.js, React, TypeScript, Tailwind CSS.
- Current product language: IconSlicer.
- Existing capabilities:
  - Image upload/dropzone.
  - Crop workspace.
  - Grid-based slicing.
  - Background removal through local `rembg` API route.
  - Lasso selection, hue edits, effects, undo/redo.
  - ZIP export of sliced icons.

## Proposed User Flow

1. User chooses **Generate Icon Set** from the upload/start state.
2. User enters:
   - Theme/subject, e.g. “fantasy potion ingredients”.
   - Style, e.g. “isometric pixel-art, warm palette”.
   - Icon count/grid, e.g. `4x4`, `8x8`, or custom count.
   - Output size, e.g. `64x64`, `128x128`, `256x256`.
   - Background preference: transparent, flat color, checker-safe silhouette.
3. App builds a generation prompt optimized for a uniform icon sheet.
4. Banana generates an icon sheet preview.
5. User can:
   - Accept and continue to crop/slice.
   - Regenerate entire sheet.
   - Regenerate selected cells.
   - Remove background.
   - Apply existing hue/effects tools.
6. User exports individual PNG files and a ZIP bundle.

## MVP Scope

### Generation Panel

- Add a generation entry point beside image upload.
- Inputs:
  - Prompt/theme.
  - Style preset.
  - Grid size.
  - Icon size.
  - Negative prompt / avoid list.
  - Seed, if supported.
- Display generation status, errors, and cost/latency hints.

### Banana Integration API Route

- Add a server-side API route to call the Banana image model.
- Keep provider credentials server-only.
- Validate request size and supported generation options.
- Return a generated PNG or base64 image payload consumable by the existing editor.
- Store no generated images by default in the experiment.

### Prompt Builder

- Generate structured prompts for consistent icon sheets.
- Include grid layout, transparent background request, spacing, style consistency, and no text/watermarks.
- Preserve editable advanced prompt text for power users.

### Generated Sheet Handoff

- Load generated output into the same state path as uploaded images.
- Reuse crop, grid slicing, background removal, effects, and ZIP export.
- Add generated metadata to exported ZIP, e.g. `prompt.json`.

### Regeneration

- MVP: regenerate whole sheet.
- Stretch: regenerate selected cell or selected lasso region using image editing/inpainting if the Banana API supports it.

## Style Presets

- Game item icons.
- App UI outline icons.
- Pixel-art sprites.
- 3D clay icons.
- Flat vector-like icons.
- Hand-drawn sticker icons.
- Monochrome glyphs.

Each preset should define prompt modifiers, recommended icon size, and background defaults.

## Functional Requirements

- Users can generate an icon sheet without uploading a source image.
- Users can continue using existing manual tools on generated output.
- Users can export generated icon packs as ZIP.
- App prevents generation requests with empty prompts or unsupported grid sizes.
- App exposes clear retry behavior for model/API failures.
- App handles slow generation with cancellable or safely ignored pending requests.
- Generated assets are treated as temporary client/session data unless persistence is explicitly added later.

## UX Requirements

- Keep the existing canvas-first workspace.
- Generation controls should not crowd the slicing/editing tools.
- Show prompt, style, grid, and size in a compact generation summary.
- Make regeneration feel reversible by integrating with the existing undo/redo model where practical.
- Include a visible reminder that AI output may need review before commercial use.

## Technical Requirements

- Server-only environment variable for provider key, e.g. `BANANA_API_KEY` or provider-specific equivalent.
- API route must run in Node.js runtime if provider SDK or binary processing requires it.
- Convert provider image output into an `HTMLImageElement`/data URL flow compatible with existing image state.
- Normalize generated sheets to PNG.
- Preserve transparent alpha when available.
- Avoid committing generated assets to the repository.

## Risks and Open Questions

- Which exact Banana provider/API is intended?
- Does the selected model reliably generate transparent backgrounds?
- Does the API support seed control, image editing, masks, or cell-level regeneration?
- What are expected latency and cost limits per generation?
- Are generated assets legally usable for commercial products under the provider terms?
- How should NSFW, trademark, or copyrighted-character prompts be handled?

## Success Metrics

- User can generate and export a ZIP icon pack in under 2 minutes.
- Generated sheet requires minimal manual grid adjustment.
- At least 80% of generated cells are recognizable as separate icons in internal tests.
- Existing upload/slice/export workflow remains unchanged and functional.
- Failed generation requests provide actionable error messages.

## Milestones

### Milestone 1: Generation Spike

- Confirm exact Banana API and credentials.
- Add minimal `/api/generate-icons` route.
- Generate one icon sheet from prompt and load it into the editor.

### Milestone 2: MVP UX

- Add generation panel and style presets.
- Add loading/error states.
- Export prompt metadata with ZIP.

### Milestone 3: Quality Loop

- Add whole-sheet regenerate.
- Add prompt refinement controls.
- Improve generated grid alignment and default slicing suggestions.

### Milestone 4: Advanced Editing Stretch

- Add selected-cell regeneration if provider supports image editing/masks.
- Add seed and variant controls.
- Add asset naming templates.

## Implementation Notes

- Prefer extending existing app modes with a `GENERATE` entry state rather than creating a separate app.
- Keep provider-specific code isolated behind a small adapter so Banana can be swapped or mocked.
- Reuse existing `slicer.ts`, image edit helpers, and export flow.
- Add a mock generation mode for local development without API calls.
