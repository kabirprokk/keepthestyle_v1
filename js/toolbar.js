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
        const exportType = await showChoiceDialog('Export project', 'Choose the format you want to generate.', [
            { label: 'Website ZIP', value: '3', primary: true }, { label: 'HTML pages', value: '1' }, { label: 'CSS', value: '2' }, { label: 'Project file', value: 'project' }, { label: 'Cancel', value: null }
        ]);
        if (exportType === 'project') this.saveProject();
        else this.showExportDialog(exportType);
    }

    showExportDialog(exportType) {
        if (exportType === '1') {
            this.exportHTML();
        } else if (exportType === '2') {
            this.exportCSS();
        } else if (exportType === '3') {
            this.exportZIP();
        }
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
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(this.store.getState().projectName)}</title>
    <style>
        /* Generated CSS */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
        }
        ${getInteractionAnimationCSS()}
    </style>
</head>
<body>
`;
        
        elements.forEach(el => {
            html += this.renderElementHTML(el, 1);
        });
        
        html += `    <script>\n${generateSiteRuntime(elements, this.store.getState().pages).split('\n').map(line => '    ' + line).join('\n')}\n    </script>\n`;
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
        if (element.hidden) attributes.hidden = true;
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
            if (value && value !== '') {
                if (key !== 'customCSS') css += `${toKebabCase(key)}: ${value}; `;
            }
        });
        return css;
    }

    renderAttributes(attributes) {
        let html = '';
        Object.entries(attributes).forEach(([key, value]) => {
            if (value && value !== '') {
                if (/^on/i.test(key) || key === 'style') return;
                html += ` ${escapeHTML(key)}="${escapeHTML(value)}"`;
            }
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
                    if (value && value !== '') {
                        if (key === 'customCSS' || ['position', 'left', 'top', 'right', 'bottom', 'width', 'height'].includes(key)) return;
                        const kebabKey = toKebabCase(key);
                        css += `    ${kebabKey}: ${value};\n`;
                    }
                });
                css += `}\n\n`;
            }
        });
        if (elements.some(el => (el.interactions || []).some(rule => rule.action === 'animate'))) css += `${getInteractionAnimationCSS()}\n`;
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

    generatePreviewHTML(state) {
        const allElements = state.pages.flatMap(page => page.elements || []);
        const pages = state.pages.map(page => {
            const content = (page.elements || []).map(element => this.renderElementHTML(element, 2)).join('');
            return `    <main class="kts-preview-page" data-page-id="${escapeHTML(page.id)}"${page.id === state.activePageId ? '' : ' hidden'}>\n${content}    </main>`;
        }).join('\n');
        const runtime = generateSiteRuntime(allElements, state.pages, { preview: true });
        return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHTML(state.projectName)} Preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Montserrat:wght@300;400;500;600;700&family=Oswald:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;font-family:Inter,Arial,sans-serif}.kts-preview-viewport{min-width:100%;min-height:100%;display:flex;overflow:auto}.kts-preview-stage{position:relative;flex:0 0 auto;margin:auto}.kts-preview-page{position:absolute;inset:0 auto auto 0;width:${state.pageSize.width}px;height:${state.pageSize.height}px;overflow:hidden;background:#fff;transform-origin:top left}${getInteractionAnimationCSS()}
</style></head><body><div class="kts-preview-viewport"><div class="kts-preview-stage">
${pages}
</div></div><script>const ktsPageWidth=${state.pageSize.width};const ktsPageHeight=${state.pageSize.height};function ktsFitPreview(){const scale=Math.min(window.innerWidth/ktsPageWidth,window.innerHeight/ktsPageHeight,1);const stage=document.querySelector('.kts-preview-stage');stage.style.width=(ktsPageWidth*scale)+'px';stage.style.height=(ktsPageHeight*scale)+'px';document.querySelectorAll('.kts-preview-page').forEach(page=>page.style.transform='scale('+scale+')')}window.addEventListener('resize',ktsFitPreview);window.__ktsShowPage=function(id){document.querySelectorAll('.kts-preview-page').forEach(page=>page.hidden=page.dataset.pageId!==id);window.scrollTo(0,0);ktsFitPreview()};ktsFitPreview();
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
        const action = await showChoiceDialog('Workspace settings', `Theme: ${this.isDarkMode ? 'Dark' : 'Light'}\nAuto-save: Enabled\nGrid: ${state.gridVisible ? 'Visible' : 'Hidden'}\nSnap: ${state.snapEnabled ? 'Enabled' : 'Disabled'}`, [
            { label: state.snapEnabled ? 'Disable snap' : 'Enable snap', value: 'snap', primary: true }, { label: 'Toggle theme', value: 'theme' }, { label: state.gridVisible ? 'Hide grid' : 'Show grid', value: 'grid' }, { label: 'Close', value: null }
        ]);
        if (action === 'theme') this.toggleDarkMode();
        if (action === 'grid') this.store.setState({ gridVisible: !state.gridVisible });
        if (action === 'snap') {
            this.store.setState({ snapEnabled: !state.snapEnabled });
            this.showNotification(`Snap to grid ${state.snapEnabled ? 'disabled' : 'enabled'}`);
        }
    }

    updateUI() {
        const state = this.store.getState();
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
