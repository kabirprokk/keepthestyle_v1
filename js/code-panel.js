/**
 * KeepTheStyle - Code Panel
 * Generates and displays HTML, CSS, and JavaScript code
 */

class CodePanel {
    constructor(container) {
        this.container = container;
        this.codeDisplay = container.querySelector('code');
        this.store = window.store;
        this.currentTab = 'html';
        this.installPanelControls();
        
        this.bindEvents();
        this.subscribe();
        this.generateCode();
    }

    installPanelControls() {
        const handle = document.createElement('div');
        handle.className = 'code-resize-handle';
        this.container.prepend(handle);
        const toggle = document.createElement('button');
        toggle.className = 'code-panel-toggle';
        toggle.title = 'Collapse code panel';
        toggle.textContent = '⌄';
        this.container.querySelector('.code-actions').prepend(toggle);
        const savedHeight = parseInt(localStorage.getItem('keepthestyle_code_height'), 10);
        if (savedHeight >= 120) this.container.style.height = `${savedHeight}px`;
        toggle.addEventListener('click', () => {
            const collapsed = this.container.classList.toggle('collapsed');
            toggle.textContent = collapsed ? '⌃' : '⌄';
            toggle.title = collapsed ? 'Expand code panel' : 'Collapse code panel';
        });
        handle.addEventListener('pointerdown', event => {
            event.preventDefault();
            const startY = event.clientY;
            const startHeight = this.container.getBoundingClientRect().height;
            const move = e => {
                const height = Math.max(120, Math.min(window.innerHeight * .65, startHeight + startY - e.clientY));
                this.container.style.height = `${height}px`;
            };
            const up = () => {
                localStorage.setItem('keepthestyle_code_height', String(Math.round(this.container.getBoundingClientRect().height)));
                document.removeEventListener('pointermove', move);
                document.removeEventListener('pointerup', up);
            };
            document.addEventListener('pointermove', move);
            document.addEventListener('pointerup', up);
        });
    }

    bindEvents() {
        // Tab switching
        this.container.querySelectorAll('.code-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                this.container.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.generateCode();
            });
        });
        
        // Copy button
        this.container.querySelector('.code-btn[data-action="copy"]').addEventListener('click', () => {
            this.copyCode();
        });
        
        // Download button
        this.container.querySelector('.code-btn[data-action="download"]').addEventListener('click', () => {
            this.downloadCode();
        });
        
        // Clear button
        this.container.querySelector('.code-btn[data-action="clear"]').addEventListener('click', () => {
            this.clearCode();
        });
        
        // Format button
        this.container.querySelector('.code-btn[data-action="format"]').addEventListener('click', () => {
            this.formatCode();
        });
    }

    subscribe() {
        this.lastDocumentRevision = this.store.documentRevision;
        this.store.subscribe(() => {
            if (this.lastDocumentRevision === this.store.documentRevision) return;
            this.lastDocumentRevision = this.store.documentRevision;
            clearTimeout(this.generateTimer);
            this.generateTimer = setTimeout(() => this.generateCode(), 120);
        });
    }

    generateCode() {
        const state = this.store.getState();
        const elements = state.elements;
        
        let code = '';
        switch(this.currentTab) {
            case 'html':
                code = this.generateHTML(elements);
                break;
            case 'css':
                code = this.generateCSS(elements);
                break;
            case 'javascript':
                code = this.generateJavaScript(elements);
                break;
        }
        
        this.codeDisplay.textContent = code;
        this.highlightCode();
    }

    generateHTML(elements) {
        const state = this.store.getState();
        const language = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(state.siteLanguage || '') ? state.siteLanguage : 'en';
        const direction = ['auto', 'ltr', 'rtl'].includes(state.textDirection) ? state.textDirection : 'auto';
        let html = `<!DOCTYPE html>\n<html lang="${escapeHTML(language)}" dir="${direction}">\n<head>\n`;
        html += `    <meta charset="UTF-8">\n`;
        html += `    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
        html += `    <meta name="description" content="${escapeHTML(state.siteDescription || '')}">\n`;
        html += `    <meta name="keywords" content="${escapeHTML(state.siteKeywords || '')}">\n`;
        if (state.canonicalUrl) html += `    <link rel="canonical" href="${escapeHTML(state.canonicalUrl)}">\n`;
        html += `    <meta name="theme-color" content="${escapeHTML(state.themeColor || '#4d6bff')}">\n`;
        html += `    <title>${escapeHTML(state.projectName)}</title>\n`;
        html += `    <link rel="stylesheet" href="styles.css">\n`;
        html += `    <script src="script.js" defer></script>\n`;
        html += `</head>\n<body>\n`;
        
        elements.forEach(el => {
            html += this.renderElementHTML(el, 1);
        });
        
        html += `</body>\n</html>`;
        return html;
    }

    renderElementHTML(element, indent) {
        const spaces = '    '.repeat(indent);
        const tag = element.tag || 'div';
        const content = escapeHTML(element.content || '');
        const attributes = { ...(element.attributes || {}) };
        attributes.id = safeDomId(attributes.id || element.id);
        if (tag === 'img') { attributes.loading ||= 'lazy'; attributes.decoding ||= 'async'; }
        if (tag === 'iframe') attributes.loading ||= 'lazy';
        if (tag === 'video') { attributes.preload ||= 'metadata'; attributes.playsinline = true; }
        if (element.hidden) attributes.hidden = true;
        if (attributes.target === '_blank') attributes.rel = 'noopener noreferrer';
        const renderedAttributes = this.renderAttributes(attributes);
        
        const selfClosingTags = ['img', 'input', 'br', 'hr'];
        if (selfClosingTags.includes(tag)) {
            return `${spaces}<${tag}${renderedAttributes}>\n`;
        }
        
        let html = `${spaces}<${tag}${renderedAttributes}>`;
        
        if (content) {
            html += content;
        }
        
        // Render children
        if (element.children && element.children.length > 0) {
            html += '\n';
            element.children.forEach(child => {
                html += this.renderElementHTML(child, indent + 1);
            });
            html += spaces;
        }
        
        html += `</${tag}>\n`;
        return html;
    }

    renderAttributes(attributes) {
        let html = '';
        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== false && value !== '') {
                if (!/^[a-z_:][a-z0-9:_.-]*$/i.test(key) || /^on/i.test(key) || key === 'style') return;
                if (['href', 'src', 'poster', 'action', 'formaction'].includes(key.toLowerCase())) {
                    const url = String(value).trim();
                    if (/^(?:javascript|vbscript):/i.test(url)) return;
                    if (/^data:/i.test(url) && !/^data:(?:image\/(?!svg\+xml)|video\/|audio\/)/i.test(url)) return;
                }
                if (value === true) { html += ` ${escapeHTML(key)}`; return; }
                const renderedValue = typeof value === 'string' && value.startsWith('data:') && value.length > 1024
                    ? `${value.slice(0, value.indexOf(',') + 1)}[embedded media omitted from live code view]`
                    : value;
                html += ` ${escapeHTML(key)}="${escapeHTML(renderedValue)}"`;
            }
        });
        return html;
    }

    renderInlineStyles(styles) {
        let css = '';
        Object.entries(styles).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                css += `${key}: ${value}; `;
            }
        });
        return css;
    }

    generateCSS(elements) {
        let css = `/* KeepTheStyle Generated CSS */\n\n`;
        const tokens = this.store.getState().designTokens || {};
        css += `:root {\n    --kts-primary: ${tokens.primary || '#4d6bff'};\n    --kts-secondary: ${tokens.secondary || '#7b61ff'};\n    --kts-accent: ${tokens.accent || '#20c997'};\n    --kts-surface: ${tokens.surface || '#ffffff'};\n    --kts-text: ${tokens.text || '#111827'};\n    --kts-muted: ${tokens.muted || '#667085'};\n    --kts-radius: ${Number(tokens.radius) || 12}px;\n    --kts-space: ${Number(tokens.spacing) || 8}px;\n}\n\n`;
        css += `* {\n`;
        css += `    margin: 0;\n`;
        css += `    padding: 0;\n`;
        css += `    box-sizing: border-box;\n`;
        css += `}\n\n`;
        
        elements.forEach(el => {
            const selector = this.getSelector(el);
            const styles = el.styles || {};
            
            if (Object.keys(styles).length > 0 || el.position || el.size) {
                css += `${selector} {\n`;
                css += `    position: absolute;\n`;
                if (el.position) { css += `    left: ${Math.round(el.position.x || 0)}px;\n`; css += `    top: ${Math.round(el.position.y || 0)}px;\n`; }
                if (el.size) { css += `    width: ${Math.round(el.size.width || 1)}px;\n`; css += `    height: ${Math.round(el.size.height || 1)}px;\n`; }
                Object.entries(styles).forEach(([key, value]) => {
                    if (key !== 'customCSS' && !['position', 'left', 'top', 'right', 'bottom', 'width', 'height'].includes(key) && value !== undefined && value !== null && value !== '') {
                        const kebabKey = toKebabCase(key);
                        css += `    ${kebabKey}: ${value};\n`;
                    }
                });
                if (styles.customCSS) css += `    ${String(styles.customCSS).trim().replace(/\n/g, '\n    ')}\n`;
                css += `}\n\n`;
            }
        });
        if (elements.some(el => el.styles?.animationName?.startsWith('kts') || (el.interactions || []).some(rule => rule.action === 'animate'))) css += `${getInteractionAnimationCSS()}\n`;
        return css;
    }

    getSelector(element) {
        // Generate a unique selector based on position
        const id = safeDomId(element.attributes?.id || element.id, 'element');
        return `#${id}`;
    }

    generateJavaScript(elements) {
        const state = this.store.getState();
        return `${generatePageTransitionRuntime(state)}\n\n${generateSiteRuntime(elements, state.pages)}`;
    }

    highlightCode() {
        // Simple syntax highlighting - can be enhanced with a library
        const code = this.codeDisplay.textContent;
        // Apply basic formatting
        this.codeDisplay.innerHTML = this.syntaxHighlight(code);
    }

    syntaxHighlight(code) {
        // Simple highlighting for demo
        return code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/(&lt;\/?[a-z][a-z0-9]*\s*&gt;)/gi, '<span class="hl-tag">$1</span>')
            .replace(/(&lt;!--.*?--&gt;)/g, '<span class="hl-comment">$1</span>')
            .replace(/(&quot;.*?&quot;)/g, '<span class="hl-string">$1</span>');
    }

    copyCode() {
        const code = this.codeDisplay.textContent;
        navigator.clipboard.writeText(code).then(() => {
            this.showNotification('Code copied to clipboard!');
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showNotification('Code copied to clipboard!');
        });
    }

    downloadCode() {
        const code = this.codeDisplay.textContent;
        const extension = this.getFileExtension();
        const filename = `${safeFilename(this.store.getState().projectName)}.${extension}`;
        
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getFileExtension() {
        switch(this.currentTab) {
            case 'html': return 'html';
            case 'css': return 'css';
            case 'javascript': return 'js';
            default: return 'txt';
        }
    }

    async clearCode() {
        const confirmed = await showChoiceDialog('Clear the canvas?', 'This removes every element from the current design. You can undo the action afterward.', [
            { label: 'Clear canvas', value: true, primary: true }, { label: 'Cancel', value: false }
        ]);
        if (confirmed) {
            this.store.setState({
                elements: [], selectedElements: []
            });
            this.generateCode();
        }
    }

    formatCode() {
        // Simple formatting - can be enhanced with a proper formatter
        const code = this.codeDisplay.textContent;
        const formatted = code
            .replace(/\n\s*\n/g, '\n\n')
            .replace(/\{\s*\}/g, '{}')
            .trim();
        this.codeDisplay.textContent = formatted;
        this.highlightCode();
        this.showNotification('Code formatted!');
    }

    showNotification(message) {
        showToast(message);
        return;
        // Simple notification system
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

// Add keyframe animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
