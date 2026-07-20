# KeepTheStyle

KeepTheStyle is a browser-based, visual website builder for creating multi-page websites without writing code. It combines a precision design canvas, a professional property inspector, no-code interactions, live source generation, and production-ready website export in one lightweight application.

The project is built with plain HTML, CSS, and JavaScript. It has no framework dependency, package installation, compilation step, or backend requirement.

## Highlights

- Drag-and-drop HTML elements, layout blocks, forms, media, shapes, and navigation components
- Precision canvas with zoom, fit-to-screen, resizing, multi-selection, locking, and layer ordering
- Functional 10px snap-to-grid with page-bound placement and an `Alt` key precision override
- Real-time property editing for layout, typography, spacing, borders, effects, transforms, and attributes
- Sixteen open-source Google Font families available directly in the typography inspector
- Inline text editing directly on the canvas
- Multi-page projects with page creation, duplication, renaming, deletion, and navigation actions
- No-code interactions for clicks, hover, page load, and scroll-into-view events
- Animation presets with configurable duration, delay, easing, and repetition
- Accurate, responsive preview that preserves the canvas coordinate system
- Live HTML, CSS, and JavaScript generation
- One-file website export with inline HTML, CSS, and JavaScript, plus multi-page ZIP and editable project-file export
- HTML import and portable `.ktstyle` project files
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
2. Drag components from the left sidebar onto the canvas, or double-click a component to add it centrally.
3. Move and resize elements visually. Grid snapping is enabled by default; hold `Alt` while dragging for free placement.
4. Use the right inspector to configure content, appearance, HTML attributes, visibility, locking, and interactions.
5. Add and connect pages with the page manager and navigation actions.
6. Select **Preview** to test the website in a proportionally scaled, coordinate-accurate view.
7. Select **Export** to download a deployable website ZIP or another supported format.

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
