/**
 * KeepTheStyle - Toolbar Management
 * Handles top toolbar interactions
 */

class ToolbarManager {
    constructor(container) {
        this.container = container;
        this.store = window.store;
        this.isDarkMode = localStorage.getItem('keepthestyle_theme') === 'dark';
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        
        this.bindEvents();
        this.store.subscribe(() => this.updateUI());
        this.updateUI();
    }

    bindEvents() {
        // New Project
        this.container.querySelector('[title="New Project"]').addEventListener('click', () => {
            this.newProject();
        });
        
        // Open
        this.container.querySelector('[title="Open"]').addEventListener('click', () => {
            this.openProject();
        });
        
        // Save
        this.container.querySelector('[title="Save"]').addEventListener('click', () => {
            this.saveProject();
        });
        
        // Undo
        this.container.querySelector('[title="Undo"]').addEventListener('click', () => {
            this.undo();
        });
        
        // Redo
        this.container.querySelector('[title="Redo"]').addEventListener('click', () => {
            this.redo();
        });
        
        // Import HTML
        this.container.querySelector('[title="Import HTML"]').addEventListener('click', () => {
            this.importHTML();
        });

        this.container.querySelector('[title="Add Media"]').addEventListener('click', () => {
            this.openMediaDialog();
        });
        
        // Export
        this.container.querySelector('[title="Export"]').addEventListener('click', () => {
            this.exportProject();
        });
        
        // Preview
        this.container.querySelector('[title="Preview"]').addEventListener('click', () => {
            this.preview();
        });
        
        // Dark Mode toggle
        this.container.querySelector('[title="Dark Mode"]').addEventListener('click', () => {
            this.toggleDarkMode();
        });
        
        // Settings
        this.container.querySelector('[title="Settings"]').addEventListener('click', () => {
            this.openSettings();
        });
        this.container.querySelector('[title="Design System"]').addEventListener('click', () => this.openDesignSystem());
        const projectName = this.container.querySelector('.project-name');
        projectName.addEventListener('change', e => {
            const value = e.target.value.trim() || 'Untitled Project';
            e.target.value = value;
            this.store.setState({ projectName: value });
            this.showNotification('Project renamed');
        });
        projectName.addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
        

    }

    async newProject() {
        const confirmed = await showChoiceDialog('Create a new project?', 'Your current design is auto-saved locally. You can also download a project file before continuing.', [
            { label: 'Create project', value: true, primary: true }, { label: 'Cancel', value: false }
        ]);
        if (confirmed) {
            this.store.resetProject();
            this.updateUI();
            this.showNotification('New project created');
        }
    }

    openProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.ktstyle';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        if (this.store.importProject(data)) {
                            this.updateUI();
                            this.showNotification('Project loaded successfully');
                        }
                    } catch (err) {
                        this.showNotification('Failed to load project');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    openMediaDialog() {
        const backdrop = document.createElement('div');
        backdrop.className = 'app-dialog-backdrop';
        const dialog = document.createElement('div');
        dialog.className = 'app-dialog media-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.innerHTML = `
            <h2>Add media</h2>
            <p>Add media from a web URL or choose a small local file. Uploaded files are embedded into the project and exported website.</p>
            <form class="media-form">
                <div class="media-field"><label for="media-type">Media type</label><select id="media-type"><option value="image">Image</option><option value="video">Video</option><option value="audio">Audio</option><option value="embed">YouTube, Vimeo, or embed</option><option value="link">Media link or button</option></select></div>
                <div class="media-field media-source-field"><label for="media-source">Source</label><select id="media-source"><option value="url">Use a web link</option><option value="upload">Upload a local file</option></select></div>
                <div class="media-field media-url-field"><label for="media-url">Media URL</label><input id="media-url" type="url" placeholder="https://example.com/media.jpg"><span class="media-help">YouTube and Vimeo links are converted to embeds automatically.</span></div>
                <div class="media-field media-file-field" hidden><label for="media-file">Choose a local file</label><input id="media-file" type="file" accept="image/*"><span class="media-help">Maximum 20 MB. URLs are recommended for larger videos.</span></div>
                <div class="media-field media-destination-field"><label for="media-destination">Add image as</label><select id="media-destination"><option value="new">New image element</option></select></div>
                <div class="media-field media-label-field" hidden><label for="media-label">Link text</label><input id="media-label" type="text" maxlength="120"></div>
                <div class="app-dialog-actions"><button type="button" class="btn media-cancel">Cancel</button><button type="submit" class="btn btn-primary">Add to canvas</button></div>
            </form>`;
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);
        const form = dialog.querySelector('form');
        const type = dialog.querySelector('#media-type');
        const sourceMode = dialog.querySelector('#media-source');
        const url = dialog.querySelector('#media-url');
        const file = dialog.querySelector('#media-file');
        const label = dialog.querySelector('#media-label');
        const destination = dialog.querySelector('#media-destination');
        const state = this.store.getState();
        const selected = state.selectedElements.length === 1 ? state.elements.find(element => element.id === state.selectedElements[0]) : null;
        if (selected) {
            const option = document.createElement('option');
            option.value = 'selected';
            option.textContent = selected.tag === 'img' ? 'Replace selected image' : selected.tag === 'video' ? 'Use as selected video poster' : `Background of selected ${selected.name || selected.tag}`;
            destination.appendChild(option);
        }
        const onKeyDown = event => { if (event.key === 'Escape') close(); };
        const close = () => { document.removeEventListener('keydown', onKeyDown); backdrop.remove(); };
        const syncFields = () => {
            const accepts = { image: 'image/*', video: 'video/*', audio: 'audio/*' };
            const supportsFile = Object.hasOwn(accepts, type.value);
            if (!supportsFile) sourceMode.value = 'url';
            sourceMode.disabled = !supportsFile;
            dialog.querySelector('.media-url-field').hidden = sourceMode.value !== 'url';
            dialog.querySelector('.media-file-field').hidden = !supportsFile || sourceMode.value !== 'upload';
            url.disabled = sourceMode.value !== 'url';
            file.disabled = !supportsFile || sourceMode.value !== 'upload';
            dialog.querySelector('.media-destination-field').hidden = type.value !== 'image';
            dialog.querySelector('.media-label-field').hidden = !['image', 'embed', 'link'].includes(type.value);
            dialog.querySelector('.media-label-field label').textContent = type.value === 'image' ? 'Alt text' : type.value === 'embed' ? 'Embed title' : 'Link text';
            file.accept = accepts[type.value] || '';
            url.placeholder = type.value === 'embed' ? 'https://youtube.com/watch?v=...' : type.value === 'link' ? 'https://example.com' : `https://example.com/media.${type.value === 'image' ? 'jpg' : type.value === 'video' ? 'mp4' : 'mp3'}`;
        };
        type.addEventListener('change', syncFields);
        sourceMode.addEventListener('change', syncFields);
        dialog.querySelector('.media-cancel').addEventListener('click', close);
        backdrop.addEventListener('mousedown', event => { if (event.target === backdrop) close(); });
        document.addEventListener('keydown', onKeyDown);
        form.addEventListener('submit', async event => {
            event.preventDefault();
            try {
                let source = '';
                if (sourceMode.value === 'upload') {
                    if (!file.files[0]) throw new Error('Choose a local file to upload');
                    source = await this.readMediaFile(file.files[0], type.value);
                } else {
                    source = url.value.trim();
                    if (!source) throw new Error('Enter a media URL');
                }
                const applied = this.addMediaElement(type.value, source, label.value.trim(), destination.value);
                close();
                this.showNotification(applied ? 'Image applied to selected element' : 'Media added to canvas');
            } catch (error) {
                showToast(error.message || 'Unable to add media', 'error');
            }
        });
        syncFields();
        url.focus();
    }

    readMediaFile(file, type) {
        const expected = { image: 'image/', video: 'video/', audio: 'audio/' }[type];
        if (!expected || !file.type.startsWith(expected)) return Promise.reject(new Error(`Choose a valid ${type} file`));
        if (file.size > 20 * 1024 * 1024) return Promise.reject(new Error('Local media must be 20 MB or smaller. Use a URL for larger files.'));
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Unable to read the selected file'));
            reader.readAsDataURL(file);
        });
    }

    addMediaElement(type, source, label = '', destination = 'new') {
        if (/^\s*javascript:/i.test(source)) throw new Error('This URL type is not allowed');
        const state = this.store.getState();
        const page = state.pageSize;
        if (type === 'image' && destination === 'selected' && state.selectedElements.length === 1) {
            const selected = state.elements.find(element => element.id === state.selectedElements[0]);
            if (selected) {
                if (selected.tag === 'img') {
                    this.store.updateElement(selected.id, { attributes: { ...selected.attributes, src: source, alt: label || selected.attributes?.alt || 'Image' } });
                } else if (selected.tag === 'video') {
                    this.store.updateElement(selected.id, { attributes: { ...selected.attributes, poster: source } });
                } else {
                    const safeSource = source.replace(/["\\\n\r]/g, character => `\\${character}`);
                    this.store.updateElement(selected.id, { styles: { ...selected.styles, backgroundImage: `url("${safeSource}")`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } });
                }
                return true;
            }
        }
        const presets = {
            image: { tag: 'img', width: 480, height: 320, attributes: { src: source, alt: label || 'Image', loading: 'lazy' }, styles: { objectFit: 'contain' } },
            video: { tag: 'video', width: 640, height: 360, attributes: { src: source, controls: false, autoplay: true, muted: true, loop: true, playsinline: true, preload: 'auto' }, styles: { objectFit: 'cover', backgroundColor: '#000000' } },
            audio: { tag: 'audio', width: 480, height: 54, attributes: { src: source, controls: true, preload: 'metadata' }, styles: {} },
            embed: { tag: 'iframe', width: 640, height: 360, attributes: { src: type === 'embed' ? this.normalizeEmbedUrl(source) : source, title: label || 'Embedded media', loading: 'lazy', allowfullscreen: true, allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' }, styles: { border: '0' } },
            link: { tag: 'a', width: 220, height: 48, attributes: { href: source, target: '_blank', rel: 'noopener noreferrer' }, content: label || 'Open media', styles: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 18px', borderRadius: '8px', backgroundColor: '#4D6BFF', color: '#FFFFFF', textDecoration: 'none', fontWeight: '600' } }
        };
        const preset = presets[type];
        if (!preset) throw new Error('Unsupported media type');
        this.store.addElement({
            tag: preset.tag,
            name: type === 'embed' ? 'Media Embed' : `${type[0].toUpperCase()}${type.slice(1)}`,
            position: { x: Math.max(0, (page.width - preset.width) / 2), y: Math.max(0, (page.height - preset.height) / 2) },
            size: { width: Math.min(preset.width, page.width), height: Math.min(preset.height, page.height) },
            styles: preset.styles,
            content: preset.content || '',
            attributes: preset.attributes
        });
        return false;
    }

    normalizeEmbedUrl(value) {
        const url = new URL(value, window.location.href);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Embed URLs must use HTTP or HTTPS');
        if (url.hostname === 'youtu.be') return `https://www.youtube.com/embed/${encodeURIComponent(url.pathname.slice(1))}`;
        if (url.hostname.endsWith('youtube.com')) {
            if (url.pathname.startsWith('/embed/')) return url.href;
            const id = url.searchParams.get('v') || (url.pathname.startsWith('/shorts/') ? url.pathname.split('/')[2] : '');
            if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
        }
        if (url.hostname.endsWith('vimeo.com') && /^\/\d+/.test(url.pathname)) return `https://player.vimeo.com/video/${url.pathname.split('/')[1]}`;
        return url.href;
    }

    saveProject() {
        const data = this.store.exportProject();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeFilename(this.store.getState().projectName)}.ktstyle`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('Project saved');
    }

    undo() {
        if (this.store.undo()) {
            this.showNotification('Undo');
        }
    }

    redo() {
        if (this.store.redo()) {
            this.showNotification('Redo');
        }
    }

    importHTML() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.html';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    // Parse HTML and convert to elements
                    const html = event.target.result;
                    this.parseHTML(html);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    parseHTML(html) {
        // Simple HTML parsing - can be enhanced
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc.body;
        
        // Extract elements from body
        const elements = this.extractElements(body);
        if (elements.length > 0) {
            this.store.setState({ elements, selectedElements: [] });
            this.showNotification('HTML imported successfully');
        }
    }

    extractElements(node) {
        const elements = [];
        const children = node.children;
        
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (['script', 'style', 'meta', 'link', 'base', 'object', 'embed'].includes(child.tagName.toLowerCase())) continue;
            const el = {
                id: this.store.generateId(),
                tag: child.tagName.toLowerCase(),
                position: { x: 100 + i * 20, y: 100 + i * 20 },
                size: { width: 200, height: 150 },
                styles: {},
                content: child.textContent || '',
                attributes: {}
            };
            
            // Extract styles
            Array.from(child.style).forEach(key => {
                const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
                el.styles[camelKey] = child.style.getPropertyValue(key).trim();
            });
            
            // Extract attributes
            Array.from(child.attributes).forEach(attr => {
                if (attr.name !== 'style' && !/^on/i.test(attr.name)) {
                    el.attributes[attr.name] = attr.value;
                }
            });
            
            elements.push(el);
            
            // Recursively process children
            if (child.children.length > 0) {
                const childElements = this.extractElements(child);
                if (childElements.length > 0) {
                    // Add child elements (adjust positions)
                    childElements.forEach(ce => {
                        ce.position.x += 50;
                        ce.position.y += 50;
                        elements.push(ce);
                    });
                }
            }
        }
        
        return elements;
    }

    async exportProject() {
        const exportType = await showChoiceDialog('Download website', 'Choose one self-contained HTML file or a ZIP with separate pages.', [
            { label: 'Single HTML file', value: 'single', primary: true }, { label: 'Website ZIP', value: 'zip' }, { label: 'Project file', value: 'project' }, { label: 'Cancel', value: null }
        ]);
        if (exportType === 'single') this.exportSingleHTML();
        if (exportType === 'zip') this.exportZIP();
        if (exportType === 'project') this.saveProject();
    }

    exportSingleHTML() {
        const state = this.store.getState();
        const html = this.generatePreviewHTML(state, { download: true });
        this.downloadFile(html, `${safeFilename(state.projectName)}.html`, 'text/html');
        this.showNotification('Self-contained website downloaded');
    }

    exportHTML() {
        const state = this.store.getState();
        state.pages.forEach((page, index) => {
            const filename = page.slug === 'index' ? 'index.html' : `${safeFilename(page.slug)}.html`;
            setTimeout(() => this.downloadFile(this.generateFullHTML(page.elements), filename, 'text/html'), index * 120);
        });
        this.showNotification(`${state.pages.length} website page${state.pages.length === 1 ? '' : 's'} exported`);
    }

    generateFullHTML(elements) {
        const state = this.store.getState();
        const pageSize = state.activeBreakpoint === 'base' ? state.pageSize : (state.basePageSize || state.pageSize);
        const language = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(state.siteLanguage || '') ? state.siteLanguage : 'en';
        const direction = ['auto', 'ltr', 'rtl'].includes(state.textDirection) ? state.textDirection : 'auto';
        let html = `<!DOCTYPE html>
<html lang="${escapeHTML(language)}" dir="${direction}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHTML(state.siteDescription || '')}">
    <meta name="keywords" content="${escapeHTML(state.siteKeywords || '')}">
    <meta name="theme-color" content="${escapeHTML(state.themeColor || '#4d6bff')}">
    <meta name="generator" content="KeepTheStyle">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHTML(state.projectName)}">
    <meta property="og:description" content="${escapeHTML(state.siteDescription || '')}">
    ${state.canonicalUrl ? `<link rel="canonical" href="${escapeHTML(state.canonicalUrl)}">` : ''}
    ${state.socialImage ? `<meta property="og:image" content="${escapeHTML(state.socialImage)}">\n    <meta name="twitter:card" content="summary_large_image">\n    <meta name="twitter:image" content="${escapeHTML(state.socialImage)}">` : '<meta name="twitter:card" content="summary">'}
    <meta name="twitter:title" content="${escapeHTML(state.projectName)}">
    <meta name="twitter:description" content="${escapeHTML(state.siteDescription || '')}">
    <title>${escapeHTML(state.projectName)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&family=Lora:wght@400;500;600;700&family=Merriweather:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&family=Oswald:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Rubik:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* Generated CSS */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        ${this.getDesignTokenCSS(state)}
        body {
            font-family: var(--kts-font-body), 'Inter', -apple-system, sans-serif;
            color: var(--kts-text);
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000;
        }
        html { width: 100%; height: 100%; background: #000; }
        .kts-site-viewport { position: fixed; inset: 0; display: flex; overflow: auto; background: #000; }
        .kts-site-stage { position: relative; flex: 0 0 auto; margin: auto; }
         .kts-site-page { position: absolute; inset: 0 auto auto 0; width: ${pageSize.width}px; height: ${pageSize.height}px; overflow: hidden; transform-origin: top left; }
        ${getInteractionAnimationCSS()}
        ${getElementHoverCSS(elements)}
        ${generateResponsiveCSS(elements)}
    </style>
</head>
<body><div class="kts-site-viewport"><div class="kts-site-stage"><main class="kts-site-page">
`;
        
        elements.forEach(el => {
            html += this.renderElementHTML(el, 3);
        });
        html += `            </main></div></div>\n`;
        
        const currentPageId = state.pages.find(page => page.elements === elements)?.id || state.activePageId;
        const fitRuntime = `const ktsPageWidth=${pageSize.width},ktsPageHeight=${pageSize.height};function ktsFitSite(){const scale=Math.max(innerWidth/ktsPageWidth,innerHeight/ktsPageHeight);const stage=document.querySelector('.kts-site-stage');stage.style.width=(ktsPageWidth*scale)+'px';stage.style.height=(ktsPageHeight*scale)+'px';document.querySelector('.kts-site-page').style.transform='scale('+scale+')'}addEventListener('resize',ktsFitSite);ktsFitSite();`;
        const runtime = `${fitRuntime}\n${generatePageTransitionRuntime(state, { currentPageId })}\n${generateSiteRuntime(elements, state.pages)}`;
        html += `    <script>\n${runtime.split('\n').map(line => '    ' + line).join('\n')}\n    </script>\n`;
        html += `</body>
</html>`;
        return html;
    }

    renderElementHTML(element, indent) {
        const spaces = '    '.repeat(indent);
        const tag = element.tag || 'div';
        const content = escapeHTML(element.content || '');
        const styles = this.renderInlineStyles({ ...(element.styles || {}), position: 'absolute', left: `${element.position?.x || 0}px`, top: `${element.position?.y || 0}px`, width: `${element.size?.width || 1}px`, height: `${element.size?.height || 1}px` });
        const styleAttr = styles ? ` style="${styles.trim()}"` : '';
        const attributes = { ...(element.attributes || {}) };
        attributes.id = safeDomId(attributes.id || element.id);
        if (tag === 'img') { attributes.loading ||= 'lazy'; attributes.decoding ||= 'async'; }
        if (tag === 'iframe') attributes.loading ||= 'lazy';
        if (tag === 'video') { attributes.preload ||= 'metadata'; attributes.playsinline = true; }
        if (element.hidden) attributes.hidden = true;
        if (attributes.target === '_blank') attributes.rel = 'noopener noreferrer';
        const attrs = this.renderAttributes(attributes);
        
        const selfClosingTags = ['img', 'input', 'br', 'hr'];
        if (selfClosingTags.includes(tag)) {
            return `${spaces}<${tag}${attrs}${styleAttr} />\n`;
        }
        
        return `${spaces}<${tag}${attrs}${styleAttr}>${content}</${tag}>\n`;
    }

    renderInlineStyles(styles) {
        let css = '';
        Object.entries(styles).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                if (key !== 'customCSS') css += `${toKebabCase(key)}: ${value}; `;
            }
        });
        return css;
    }

    renderAttributes(attributes) {
        let html = '';
        Object.entries(attributes).forEach(([key, value]) => {
            if (value === undefined || value === null || value === false || value === '') return;
            if (!/^[a-z_:][a-z0-9:_.-]*$/i.test(key) || /^on/i.test(key) || key === 'style') return;
            if (['href', 'src', 'poster', 'action', 'formaction'].includes(key.toLowerCase())) {
                const url = String(value).trim();
                if (/^(?:javascript|vbscript):/i.test(url)) return;
                if (/^data:/i.test(url) && !/^data:(?:image\/(?!svg\+xml)|video\/|audio\/)/i.test(url)) return;
            }
            html += value === true ? ` ${escapeHTML(key)}` : ` ${escapeHTML(key)}="${escapeHTML(value)}"`;
        });
        return html;
    }

    exportCSS() {
        const state = this.store.getState();
        let css = this.generateCSS(state.elements);
        this.downloadFile(css, `${safeFilename(state.projectName)}.css`, 'text/css');
        this.showNotification('CSS exported');
    }

    generateCSS(elements) {
        let css = `/* KeepTheStyle Generated CSS */
${this.getDesignTokenCSS(this.store.getState())}
        
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

`;
        
        elements.forEach(el => {
            const selector = `#${safeDomId(el.attributes?.id || el.id, 'element')}`;
            const styles = el.styles || {};
            
            if (Object.keys(styles).length > 0 || el.position || el.size) {
                css += `${selector} {\n`;
                css += `    position: absolute;\n    left: ${el.position?.x || 0}px;\n    top: ${el.position?.y || 0}px;\n    width: ${el.size?.width || 1}px;\n    height: ${el.size?.height || 1}px;\n`;
                Object.entries(styles).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        if (key === 'customCSS' || ['position', 'left', 'top', 'right', 'bottom', 'width', 'height'].includes(key)) return;
                        const kebabKey = toKebabCase(key);
                        css += `    ${kebabKey}: ${value};\n`;
                    }
                });
                css += `}\n\n`;
            }
        });
        if (elements.some(el => el.styles?.animationName?.startsWith('kts') || (el.interactions || []).some(rule => rule.action === 'animate'))) css += `${getInteractionAnimationCSS()}\n`;
        css += getElementHoverCSS(elements);
        const responsiveCSS = generateResponsiveCSS(elements);
        if (responsiveCSS) css += `\n\n/* Responsive overrides */\n${responsiveCSS}\n`;
        return css;
    }

    exportZIP() {
        const state = this.store.getState();
        const files = state.pages.map(page => ({
            name: page.slug === 'index' ? 'index.html' : `${safeFilename(page.slug)}.html`,
            content: this.generateFullHTML(page.elements)
        }));
        files.push({ name: 'README.txt', content: `${state.projectName}\n\nExported with KeepTheStyle. Open index.html to view the website.` });
        const blob = createZipBlob(files);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${safeFilename(state.projectName)}-website.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        this.showNotification(`Website ZIP created with ${state.pages.length} page${state.pages.length === 1 ? '' : 's'}`);
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    preview() {
        const state = this.store.getState();
        const html = this.generatePreviewHTML(state);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }

    generatePreviewHTML(state, options = {}) {
        const pageSize = state.activeBreakpoint === 'base' ? state.pageSize : (state.basePageSize || state.pageSize);
        const language = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(state.siteLanguage || '') ? state.siteLanguage : 'en';
        const direction = ['auto', 'ltr', 'rtl'].includes(state.textDirection) ? state.textDirection : 'auto';
        const allElements = state.pages.flatMap(page => page.elements || []);
        const pages = state.pages.map(page => {
            const content = (page.elements || []).map(element => this.renderElementHTML(element, 2)).join('');
            return `    <main class="kts-preview-page" data-page-id="${escapeHTML(page.id)}"${page.id === state.activePageId ? '' : ' hidden'}>\n${content}    </main>`;
        }).join('\n');
        const runtime = generateSiteRuntime(allElements, state.pages, { preview: true, singleFile: options.download });
        const transitionRuntime = generatePageTransitionRuntime(state, { preview: true, currentPageId: state.activePageId });
        return `<!DOCTYPE html>
<html lang="${escapeHTML(language)}" dir="${direction}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${escapeHTML(state.siteDescription || '')}"><meta name="keywords" content="${escapeHTML(state.siteKeywords || '')}"><meta name="theme-color" content="${escapeHTML(state.themeColor || '#4d6bff')}"><meta name="generator" content="KeepTheStyle"><meta property="og:title" content="${escapeHTML(state.projectName)}"><meta property="og:description" content="${escapeHTML(state.siteDescription || '')}">${state.canonicalUrl ? `<link rel="canonical" href="${escapeHTML(state.canonicalUrl)}">` : ''}${state.socialImage ? `<meta property="og:image" content="${escapeHTML(state.socialImage)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${escapeHTML(state.socialImage)}">` : '<meta name="twitter:card" content="summary">'}
<title>${escapeHTML(state.projectName)}${options.download ? '' : ' Preview'}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&family=Lora:wght@400;500;600;700&family=Merriweather:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&family=Oswald:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Rubik:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
${this.getDesignTokenCSS(state)}*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;font-family:var(--kts-font-body),Inter,Arial,sans-serif;color:var(--kts-text)}.kts-preview-viewport{min-width:100%;min-height:100%;display:flex;overflow:auto}.kts-preview-stage{position:relative;flex:0 0 auto;margin:auto}.kts-preview-page{position:absolute;inset:0 auto auto 0;width:${pageSize.width}px;height:${pageSize.height}px;overflow:hidden;background:var(--kts-surface);transform-origin:top left}${getInteractionAnimationCSS()}${getElementHoverCSS(allElements)}${generateResponsiveCSS(allElements)}
</style></head><body><div class="kts-preview-viewport"><div class="kts-preview-stage">
${pages}
    </div></div><script>const ktsPageWidth=${pageSize.width};const ktsPageHeight=${pageSize.height};function ktsFitPreview(){const scale=Math.max(window.innerWidth/ktsPageWidth,window.innerHeight/ktsPageHeight);const stage=document.querySelector('.kts-preview-stage');stage.style.width=(ktsPageWidth*scale)+'px';stage.style.height=(ktsPageHeight*scale)+'px';document.querySelector('.kts-preview-viewport').style.background='#000';document.querySelectorAll('.kts-preview-page').forEach(page=>page.style.transform='scale('+scale+')')}window.addEventListener('resize',ktsFitPreview);
${transitionRuntime}
window.__ktsShowPage=function(id,updateHash=true,animate=true){const page=[...document.querySelectorAll('.kts-preview-page')].find(item=>item.dataset.pageId===id);if(!page)return;const swap=()=>{document.querySelectorAll('.kts-preview-page').forEach(item=>item.hidden=item!==page);if(window.__ktsSetCurrentPage)window.__ktsSetCurrentPage(id);if(updateHash&&location.hash!=='#'+id)history.pushState(null,'','#'+id);window.scrollTo(0,0);ktsFitPreview()};if(animate&&window.__ktsRunPageTransition)window.__ktsRunPageTransition(swap,id);else swap()};window.addEventListener('hashchange',()=>window.__ktsShowPage(location.hash.slice(1),false));const ktsInitialPage=location.hash.slice(1)||${safeInlineJSON(state.activePageId)};window.__ktsShowPage(ktsInitialPage,false,false);ktsFitPreview();
${runtime}</script></body></html>`;
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        localStorage.setItem('keepthestyle_theme', this.isDarkMode ? 'dark' : 'light');
        this.showNotification(this.isDarkMode ? 'Dark mode enabled' : 'Light mode enabled');
    }

    async openSettings() {
        const state = this.store.getState();
        const backdrop = document.createElement('div');
        backdrop.className = 'app-dialog-backdrop';
        const dialog = document.createElement('div');
        dialog.className = 'app-dialog settings-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'site-settings-title');
        dialog.innerHTML = `
            <h2 id="site-settings-title">Website settings</h2>
            <p>Configure the exported website for search engines, international visitors, and the editor workspace.</p>
            <form class="media-form settings-form">
                <div class="settings-grid">
                    <div class="media-field"><label for="site-language">Website language</label><input id="site-language" value="${escapeHTML(state.siteLanguage || 'en')}" maxlength="35" list="site-language-list" autocomplete="off"><datalist id="site-language-list"><option value="en"><option value="es"><option value="fr"><option value="de"><option value="pt-BR"><option value="hi"><option value="ar"><option value="zh-CN"><option value="ja"></datalist><span class="media-help">Use a BCP 47 code such as en, hi, ar, or pt-BR.</span></div>
                    <div class="media-field"><label for="text-direction">Text direction</label><select id="text-direction"><option value="auto">Automatic</option><option value="ltr">Left to right</option><option value="rtl">Right to left</option></select></div>
                </div>
                <div class="media-field"><label for="site-description">Search description</label><textarea id="site-description" maxlength="300" rows="3" placeholder="A concise description of this website">${escapeHTML(state.siteDescription || '')}</textarea><span class="media-help"><span class="description-count">${String(state.siteDescription || '').length}</span>/300 characters</span></div>
                <div class="media-field"><label for="site-keywords">Search keywords</label><input id="site-keywords" maxlength="300" value="${escapeHTML(state.siteKeywords || '')}" placeholder="portfolio, designer, studio"></div>
                <div class="settings-grid"><div class="media-field"><label for="canonical-url">Canonical URL</label><input id="canonical-url" type="url" value="${escapeHTML(state.canonicalUrl || '')}" placeholder="https://example.com/"></div><div class="media-field"><label for="social-image">Social share image URL</label><input id="social-image" type="url" value="${escapeHTML(state.socialImage || '')}" placeholder="https://example.com/share.jpg"></div></div>
                <div class="media-field color-field"><label for="theme-color">Browser theme color</label><input id="theme-color" type="color" value="${escapeHTML(state.themeColor || '#4d6bff')}"><output>${escapeHTML(state.themeColor || '#4d6bff')}</output></div>
                <fieldset class="settings-toggles transition-settings"><legend>Page transitions</legend><div class="media-field"><label for="page-transition">Style</label><select id="page-transition"><option value="none">None</option><option value="fade">Fade</option><option value="slide-left">Slide left</option><option value="slide-right">Slide right</option><option value="slide-up">Slide up</option><option value="zoom">Zoom</option><option value="blur">Blur</option><option value="flip">3D flip</option></select></div><div class="media-field"><label for="page-transition-duration">Duration (ms)</label><input id="page-transition-duration" type="number" min="100" max="2000" step="50" value="${Number(state.pageTransitionDuration) || 450}"></div><div class="media-field"><label for="page-transition-easing">Easing</label><select id="page-transition-easing"><option value="linear">Linear</option><option value="ease">Ease</option><option value="ease-in">Ease in</option><option value="ease-out">Ease out</option><option value="ease-in-out">Ease in/out</option></select></div></fieldset>
                <fieldset class="settings-toggles"><legend>Workspace</legend><label><input id="setting-grid" type="checkbox"${state.gridVisible ? ' checked' : ''}> Show grid</label><label><input id="setting-snap" type="checkbox"${state.snapEnabled ? ' checked' : ''}> Snap to grid</label><label><input id="setting-dark" type="checkbox"${this.isDarkMode ? ' checked' : ''}> Dark mode</label></fieldset>
                <div class="app-dialog-actions"><button type="button" class="btn settings-cancel">Cancel</button><button type="submit" class="btn btn-primary">Save settings</button></div>
            </form>`;
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);
        const form = dialog.querySelector('form');
        const language = dialog.querySelector('#site-language');
        const direction = dialog.querySelector('#text-direction');
        const description = dialog.querySelector('#site-description');
        const color = dialog.querySelector('#theme-color');
        const colorOutput = dialog.querySelector('output');
        direction.value = state.textDirection || 'auto';
        dialog.querySelector('#page-transition').value = state.pageTransition || 'fade';
        dialog.querySelector('#page-transition-easing').value = state.pageTransitionEasing || 'ease-in-out';
        const close = () => { document.removeEventListener('keydown', onKeyDown); backdrop.remove(); };
        const onKeyDown = event => { if (event.key === 'Escape') close(); };
        dialog.querySelector('.settings-cancel').addEventListener('click', close);
        backdrop.addEventListener('mousedown', event => { if (event.target === backdrop) close(); });
        document.addEventListener('keydown', onKeyDown);
        description.addEventListener('input', () => { dialog.querySelector('.description-count').textContent = description.value.length; });
        color.addEventListener('input', () => { colorOutput.value = color.value; });
        form.addEventListener('submit', event => {
            event.preventDefault();
            const languageCode = language.value.trim();
            if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(languageCode)) {
                showToast('Enter a valid language code such as en, hi, ar, or pt-BR', 'error');
                language.focus();
                return;
            }
            const wantsDarkMode = dialog.querySelector('#setting-dark').checked;
            this.store.setState({
                siteLanguage: languageCode,
                textDirection: direction.value,
                siteDescription: description.value.trim(),
                siteKeywords: dialog.querySelector('#site-keywords').value.trim(),
                canonicalUrl: dialog.querySelector('#canonical-url').value.trim(),
                socialImage: dialog.querySelector('#social-image').value.trim(),
                themeColor: color.value,
                pageTransition: dialog.querySelector('#page-transition').value,
                pageTransitionDuration: Math.min(2000, Math.max(100, Number(dialog.querySelector('#page-transition-duration').value) || 450)),
                pageTransitionEasing: dialog.querySelector('#page-transition-easing').value,
                gridVisible: dialog.querySelector('#setting-grid').checked,
                snapEnabled: dialog.querySelector('#setting-snap').checked
            });
            if (wantsDarkMode !== this.isDarkMode) this.toggleDarkMode();
            close();
            this.showNotification('Website settings saved');
        });
        language.focus();
    }

    getDesignTokenCSS(state = this.store.getState()) {
        const tokens = state.designTokens || {};
        const scheme = state.siteTheme === 'dark' ? 'dark' : state.siteTheme === 'light' ? 'light' : 'light dark';
        return `:root{color-scheme:${scheme};--kts-primary:${tokens.primary || '#4d6bff'};--kts-secondary:${tokens.secondary || '#7b61ff'};--kts-accent:${tokens.accent || '#20c997'};--kts-surface:${tokens.surface || '#ffffff'};--kts-text:${tokens.text || '#111827'};--kts-muted:${tokens.muted || '#667085'};--kts-radius:${Number(tokens.radius) || 12}px;--kts-space:${Number(tokens.spacing) || 8}px;--kts-font-body:"${tokens.fontBody || 'Inter'}";--kts-font-heading:"${tokens.fontHeading || 'Inter'}";}\n`;
    }

    applyDesignTokens() {
        const state = this.store.getState();
        const tokens = state.designTokens || {};
        const root = document.documentElement.style;
        Object.entries({ primary: tokens.primary, secondary: tokens.secondary, accent: tokens.accent, surface: tokens.surface, text: tokens.text, muted: tokens.muted, radius: `${tokens.radius}px`, space: `${tokens.spacing}px`, 'font-body': tokens.fontBody, 'font-heading': tokens.fontHeading }).forEach(([key, value]) => root.setProperty(`--kts-${key}`, value));
    }

    openDesignSystem() {
        const state = this.store.getState();
        const tokens = state.designTokens || {};
        const backdrop = document.createElement('div'); backdrop.className = 'app-dialog-backdrop';
        const dialog = document.createElement('div'); dialog.className = 'app-dialog design-system-dialog'; dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-labelledby', 'design-system-title');
        const colorField = (id, label, value) => `<div class="media-field token-color"><label for="${id}">${label}</label><input id="${id}" type="color" value="${escapeHTML(value)}"><output>${escapeHTML(value)}</output></div>`;
        dialog.innerHTML = `<h2 id="design-system-title">Design System</h2><p>Define reusable CSS variables shared by the editor, preview, and exported website.</p><form class="media-form"><fieldset class="token-grid"><legend>Color styles</legend>${colorField('token-primary','Primary',tokens.primary)}${colorField('token-secondary','Secondary',tokens.secondary)}${colorField('token-accent','Accent',tokens.accent)}${colorField('token-surface','Surface',tokens.surface)}${colorField('token-text','Text',tokens.text)}${colorField('token-muted','Muted',tokens.muted)}</fieldset><div class="settings-grid"><div class="media-field"><label for="token-font-body">Body font</label><input id="token-font-body" value="${escapeHTML(tokens.fontBody || 'Inter')}"></div><div class="media-field"><label for="token-font-heading">Heading font</label><input id="token-font-heading" value="${escapeHTML(tokens.fontHeading || 'Inter')}"></div><div class="media-field"><label for="token-radius">Default radius (px)</label><input id="token-radius" type="number" min="0" max="64" value="${Number(tokens.radius) || 12}"></div><div class="media-field"><label for="token-spacing">Spacing unit (px)</label><input id="token-spacing" type="number" min="2" max="32" value="${Number(tokens.spacing) || 8}"></div></div><div class="media-field"><label for="site-theme">Exported color scheme</label><select id="site-theme"><option value="system">Follow device</option><option value="light">Light</option><option value="dark">Dark</option></select></div><label class="design-apply-selection"><input type="checkbox" id="apply-token-selection"> Apply token styles to selected elements</label><div class="token-reference"><code>var(--kts-primary)</code><code>var(--kts-surface)</code><code>var(--kts-text)</code><code>var(--kts-radius)</code><code>var(--kts-space)</code></div><div class="app-dialog-actions"><button type="button" class="btn design-cancel">Cancel</button><button type="submit" class="btn btn-primary">Save design system</button></div></form>`;
        backdrop.appendChild(dialog); document.body.appendChild(backdrop); dialog.querySelector('#site-theme').value = state.siteTheme || 'system';
        dialog.querySelectorAll('.token-color input').forEach(input => input.addEventListener('input', () => { input.parentElement.querySelector('output').value = input.value; }));
        const close = () => { document.removeEventListener('keydown', onKeyDown); backdrop.remove(); }; const onKeyDown = event => { if (event.key === 'Escape') close(); };
        document.addEventListener('keydown', onKeyDown); dialog.querySelector('.design-cancel').addEventListener('click', close); backdrop.addEventListener('mousedown', event => { if (event.target === backdrop) close(); });
        dialog.querySelector('form').addEventListener('submit', event => {
            event.preventDefault();
            const designTokens = this.store.normalizeDesignTokens({ primary: dialog.querySelector('#token-primary').value, secondary: dialog.querySelector('#token-secondary').value, accent: dialog.querySelector('#token-accent').value, surface: dialog.querySelector('#token-surface').value, text: dialog.querySelector('#token-text').value, muted: dialog.querySelector('#token-muted').value, radius: dialog.querySelector('#token-radius').value, spacing: dialog.querySelector('#token-spacing').value, fontBody: dialog.querySelector('#token-font-body').value, fontHeading: dialog.querySelector('#token-font-heading').value });
            this.store.setState({ designTokens, siteTheme: dialog.querySelector('#site-theme').value });
            if (dialog.querySelector('#apply-token-selection').checked) this.applyTokensToSelection();
            close(); this.showNotification('Design system saved');
        });
        dialog.querySelector('#token-primary').focus();
    }

    applyTokensToSelection() {
        const state = this.store.getState();
        state.selectedElements.forEach(id => {
            const element = state.elements.find(item => item.id === id); if (!element) return;
            const styles = { ...element.styles, color: 'var(--kts-text)', borderRadius: 'var(--kts-radius)' };
            if (/^h[1-6]$/.test(element.tag)) styles.fontFamily = 'var(--kts-font-heading)'; else styles.fontFamily = 'var(--kts-font-body)';
            if (['button', 'a'].includes(element.tag)) { styles.backgroundColor = 'var(--kts-primary)'; styles.color = 'var(--kts-surface)'; }
            this.store.updateElement(id, { styles });
        });
    }

    updateUI() {
        const state = this.store.getState();
        this.applyDesignTokens();
        const projectNameEl = this.container.querySelector('.project-name');
        if (projectNameEl) {
            if (document.activeElement !== projectNameEl) projectNameEl.value = state.projectName;
        }
        const undo = this.container.querySelector('[title="Undo"]');
        const redo = this.container.querySelector('[title="Redo"]');
        if (undo) undo.disabled = state.historyIndex <= 0;
        if (redo) redo.disabled = state.historyIndex >= state.history.length - 1;
        
        // Update page size select
        const select = document.querySelector('.page-size-select');
        if (select) {
            const size = `${state.pageSize.width}x${state.pageSize.height}`;
            if ([...select.options].some(opt => opt.value === size)) {
                select.value = size;
            }
        }
    }

    showNotification(message) {
        showToast(message);
        return;
        // Use the same notification system from CodePanel
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 220px;
            right: 20px;
            background: #4D6BFF;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}
