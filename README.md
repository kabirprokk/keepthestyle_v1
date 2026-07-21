# KeepTheStyle

KeepTheStyle is a browser-based, visual website builder for creating multi-page websites without writing code. It combines a precision design canvas, a professional property inspector, no-code interactions, live source generation, and production-ready website export in one lightweight application.

See [FEATURES.md](FEATURES.md) for the implemented capability matrix and [PLATFORM_ROADMAP.md](PLATFORM_ROADMAP.md) for the staged architecture covering responsive layout, reusable components, motion timelines, effects, 3D and professional inspection.

The project is built with plain HTML, CSS, and JavaScript. It has no framework dependency, package installation, compilation step, or backend requirement.

## Highlights

- Drag-and-drop HTML elements, layout blocks, forms, media, shapes, and navigation components
- Media dialog for URL-based or embedded images, video, audio, YouTube, Vimeo, iframes, and external links
- Clean autoplay video blocks with optional controls, looping, sound, play/stop settings, posters, and no-code playback actions
- Optimized large-media editing with lazy canvas video loading, compact undo snapshots, and revision-aware rendering and autosave
- Precision canvas with zoom, fit-to-screen, resizing, multi-selection, locking, and layer ordering
- Responsive authoring with cascading desktop, tablet, and mobile style overrides
- Logical Group/Ungroup with grouped selection and movement, visible canvas controls, context actions, keyboard shortcuts, and 10%–800% zoom
- Atomic multi-element moves, nudges, and shared property edits for smoother rendering and cleaner undo history
- Resilient imports that repair malformed geometry, unsafe attributes, duplicate page identities, slugs, and transition routes
- Design System manager with reusable color, typography, spacing and radius tokens exported as CSS variables
- Designer-style Layers workspace with live selection, renaming, visibility, locking, and front-to-back reordering
- Functional 10px snap-to-grid with page-bound placement and an `Alt` key precision override
- Real-time property editing for layout, typography, spacing, borders, effects, transforms, and attributes
- Sixteen open-source Google Font families available directly in the typography inspector
- Inline text editing directly on the canvas
- Multi-page projects with page creation, duplication, renaming, deletion, and navigation actions
- Editable page-to-page transitions with independent exit/entrance effects, transition color, timing, easing, pause, and movement intensity
- A dedicated `+` button beside the page selector for creating different transitions between specific page pairs
- No-code interactions for clicks, hover, page load, and scroll-into-view events
- Animation presets with configurable duration, delay, easing, and repetition
- Twenty-two animation presets including slides, zooms, rotate, flip, blur, reveal, roll, skew, wobble, heartbeat, swing, and float
- First-class animation and transition controls on every element for timing, delay, easing, repeats, direction, fill behavior, and playback state
- Configurable hover and keyboard-focus effects on every element: glow, lift, scale, tilt, brightness, blur, and border glow
- Accurate, responsive preview that preserves the canvas coordinate system
- Full-viewport cover rendering that removes background gutters in both previews and exported websites
- Live HTML, CSS, and JavaScript generation
- One-file website export with inline HTML, CSS, and JavaScript, plus multi-page ZIP and editable project-file export
- International website settings for language codes, automatic/LTR/RTL direction, search descriptions, browser theme color, and social metadata
- HTML import and portable `.ktstyle` project files
- Expanded SEO controls for keywords, canonical URLs, Open Graph images, and Twitter cards
- Automatic browser storage, undo/redo history, keyboard shortcuts, and light/dark themes

## Getting started

### Run locally

1. Clone the repository:

   ```bash
   git clone https://github.com/kabirprokk/keepthestyle_v1.git
   cd keepthestyle_v1
   ```

2. Open `index.html` in a modern browser.

No installation or build command is required. For development, a local static server is recommended so browser behavior matches normal hosting:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Building a website

1. Choose a target page size from the canvas toolbar.
2. Use the **Viewport** selector to switch between Desktop, Tablet, and Mobile. Desktop values are the base; tablet and mobile edits create compact cascading overrides.
3. Drag components from the left sidebar onto the canvas, or double-click a component to add it centrally.
4. Move and resize elements visually. Grid snapping is enabled by default; hold `Alt` while dragging for free placement.
5. Use the right inspector to configure content, appearance, HTML attributes, visibility, locking, and interactions.
6. Add and connect pages with the page manager and navigation actions.
7. Open **Settings** to choose the website language, text direction, search description, and browser theme color.
8. Select **Preview** to test the website in a proportionally scaled, coordinate-accurate view.
9. Select **Export** to download a deployable website ZIP or another supported format.

Projects are saved automatically in browser storage. Use **Save** to download a portable `.ktstyle` file before clearing browser data or moving to another device.

## Precision controls

| Action | Control |
| --- | --- |
| Move selection by 1px | Arrow keys |
| Move selection by 10px | `Shift` + arrow keys |
| Temporarily bypass grid snapping | Hold `Alt` while dragging or resizing |
| Preserve aspect ratio while resizing | Hold `Shift` while resizing a corner |
| Zoom around the pointer | `Ctrl/Cmd` + mouse wheel |
| Multi-select | `Shift` + click |
| Select all | `Ctrl/Cmd` + `A` |
| Copy / paste | `Ctrl/Cmd` + `C` / `V` |
| Duplicate | `Ctrl/Cmd` + `D` |
| Undo / redo | `Ctrl/Cmd` + `Z` / `Shift` + `Z` |
| Delete selection | `Delete` or `Backspace` |
| Deselect | `Escape` |

## Export formats

- **Single HTML file** — every page, style, and interaction runtime integrated into one portable `.html` document
- **Website ZIP** — separate connected HTML pages and runtime behavior in a deployable archive
- **Project file** — editable `.ktstyle` source for backup and continued editing

Exported websites contain standard HTML, CSS, and JavaScript and can be hosted on any static hosting provider.

## Project structure

```text
keepthestyle_v1/
├── index.html          Application shell
├── css/                Canvas, toolbar, inspector, sidebar, and workspace styles
└── js/
    ├── store.js        Project state, persistence, pages, and history
    ├── canvas.js       Rendering, selection, movement, and resizing
    ├── properties.js   Visual property and interaction inspector
    ├── toolbar.js      Project commands, preview, import, and export
    ├── code-panel.js   Live source-code generation
    └── utils.js        Shared safety, dialog, runtime, and export utilities
```

## Technical principles

- **Local-first:** editing and auto-save happen in the browser.
- **Framework-free:** the application runs directly from static files.
- **Portable output:** exported websites do not depend on the editor.
- **Safe generation:** generated identifiers, attributes, filenames, and runtime behavior are normalized before export.
- **Consistent geometry:** editor, preview, and export share document-space coordinates for predictable placement.

## Browser support

Use a current version of Chrome, Edge, Firefox, or Safari. Clipboard, file-download, local-storage, and preview behavior depend on standard modern browser APIs.

## Data and privacy

KeepTheStyle has no application backend. Project data remains in local browser storage unless the user explicitly imports, downloads, or exports a file. Google Fonts may be requested by the editor and generated preview when an internet connection is available.

## Contributing

Contributions should keep the project dependency-free unless a new dependency provides a clear product benefit. Before submitting changes:

```bash
node --check js/*.js
git diff --check
```

Test canvas placement, zoom, preview accuracy, project persistence, and website export manually in at least one modern browser.

## License

No license has been added yet. Until one is provided, all rights remain with the repository owner.
