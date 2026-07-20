# KeepTheStyle Feature Matrix

This matrix tracks the professional-builder roadmap against the current browser-only application. `Available` means the feature is usable now, `Partial` means a useful foundation exists, and `Planned` means it requires further product work. Backend-dependent features are identified separately so the editor does not expose controls that cannot work.

## Available now

| Area | Capabilities |
| --- | --- |
| Editor | Drag/drop and click-to-add, pixel positioning, multi-select, copy/paste, duplicate, undo/redo, grid snapping, guides, rulers, layers, rename, lock/hide, ordering, Group/Ungroup, 10%–800% zoom, light/dark workspace |
| Layout and styling | Absolute/relative/fixed/sticky positioning, Flexbox, CSS Grid, sizing constraints, spacing, borders, per-corner radius, shadows, filters, blend modes, transforms, backgrounds, typography, custom CSS and HTML attributes |
| Elements | Text, headings, links, buttons, images, video, audio, SVG, canvas, iframe, forms, inputs, textarea, checkbox, radio, select, shapes, navigation, semantic layout, cards, columns, divider, slider, progress, toggle, quote and code block |
| Media | URL and local upload, image replacement/background application, clean video playback, posters, looping, sound, lazy editor loading, YouTube/Vimeo embedding |
| Pages and motion | Unlimited local pages, route transitions, 22 animations, trigger-based interactions, and configurable glow/lift/scale/tilt/brightness/blur hover effects on every element |
| Code and export | Live HTML/CSS/JS, IDs/classes/attributes, custom CSS, HTML import, single-file export, multi-page ZIP, editable project backup/restore |
| SEO and accessibility | Language/direction, title, description, keywords, canonical URL, Open Graph, Twitter cards, theme color, alt text, ARIA fields, keyboard editing, focus states and reduced-motion support |
| Performance | Revision-aware rendering/autosave, compact media history, lazy images/iframes, asynchronous image decoding, selective editor media playback, cache-versioned editor assets |

## Partial foundations

| Area | Current foundation | Next product step |
| --- | --- | --- |
| Responsive design | Page presets and full-viewport preview/export | Per-breakpoint style overrides and device visibility |
| Nested design | Element child data and semantic containers | Visual parent/child drop zones and DOM-tree nesting controls |
| Components | Page duplication and grouped elements | Named reusable components, instances and override management |
| Global design | Design System manager, exported CSS variables, theme mode and shared font catalog | Named token sets, aliases and global class manager |
| Forms | Native form controls and interaction runtime | Visual validation, conditional steps and configurable submission endpoints |
| Assets | Upload/URL media and embedded project assets | Searchable project library, folders, deduplication and compression UI |
| Developer tools | Live source, CSS inspector properties and custom code | State/pseudo-element editor, inheritance viewer and breakpoint inspector |
| Offline/PWA | Static, local-first editor | Manifest, service worker and install/update lifecycle |

## Requires backend architecture

These features need authenticated storage, databases, queues, secure server-side secrets, or multi-user synchronization. They should be built as a separate hosted platform layer rather than simulated in the static editor:

- CMS collections, dynamic records, drafts, scheduled publishing and server search
- User authentication, roles, permissions and private content
- Real-time collaboration, activity logs and durable cloud version history
- Email notifications, spam protection and secure form processing
- Database integrations, secret API connections, workflows and real-time data
- CDN delivery, server redirects, analytics aggregation and white-label account management

## Quality rule

New controls must produce working preview and exported behavior, persist through `.ktstyle` save/load, respect accessibility preferences, and pass JavaScript syntax checks plus `git diff --check` before release.
