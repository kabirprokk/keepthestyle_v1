/**
 * KeepTheStyle - Canvas Manager
 * Handles the canvas rendering and element interaction
 */

class CanvasManager {
    constructor(container) {
        this.container = container;
        this.canvasPage = container.querySelector('.canvas-page');
        this.canvasStage = container.querySelector('.canvas-stage');
        this.canvasWrapper = container.querySelector('.canvas-wrapper');
        this.store = window.store;
        
        this.isDragging = false;
        this.dragTarget = null;
        this.dragOffset = { x: 0, y: 0 };
        this.zoomLevel = 1;
        this.zoomMode = 'manual';
        this.interaction = null;
        this.contextMenu = null;
        this.installPageControls();
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.subscribeToStore();
        this.renderCanvas();
        this.fitToScreen();
        this.resizeObserver = new ResizeObserver(() => {
            if (this.zoomMode === 'fit') this.fitToScreen();
        });
        this.resizeObserver.observe(this.canvasWrapper);
    }

    installPageControls() {
        const controls = this.container.querySelector('.canvas-controls');
        const group = document.createElement('div');
        group.className = 'page-manager-controls';
        group.innerHTML = `<span class="page-manager-label">Page</span><select class="page-switcher" aria-label="Current page"></select><input class="page-name-input" aria-label="Page name" maxlength="50"><button data-page-action="add" title="Add page">＋</button><button data-page-action="duplicate" title="Duplicate page">⧉</button><button data-page-action="delete" title="Delete page">×</button>`;
        controls.appendChild(group);
        const select = group.querySelector('.page-switcher');
        const name = group.querySelector('.page-name-input');
        select.addEventListener('change', () => this.store.switchPage(select.value));
        name.addEventListener('change', () => this.store.renamePage(this.store.getState().activePageId, name.value));
        name.addEventListener('keydown', e => { if (e.key === 'Enter') name.blur(); });
        group.querySelector('[data-page-action="add"]').addEventListener('click', () => this.store.addPage(`Page ${this.store.getState().pages.length + 1}`));
        group.querySelector('[data-page-action="duplicate"]').addEventListener('click', () => this.store.duplicatePage(this.store.getState().activePageId));
        group.querySelector('[data-page-action="delete"]').addEventListener('click', async () => {
            if (this.store.getState().pages.length <= 1) { showToast('A project needs at least one page', 'error'); return; }
            const confirmed = await showChoiceDialog('Delete this page?', 'The page and all of its elements will be removed.', [{ label: 'Delete page', value: true, primary: true }, { label: 'Cancel', value: false }]);
            if (confirmed) this.store.deletePage(this.store.getState().activePageId);
        });
        this.pageControls = group;
        this.syncPageControls();
    }

    syncPageControls() {
        if (!this.pageControls) return;
        const state = this.store.getState();
        const select = this.pageControls.querySelector('.page-switcher');
        const signature = state.pages.map(page => `${page.id}:${page.name}`).join('|');
        if (select.dataset.signature !== signature) {
            select.innerHTML = '';
            state.pages.forEach(page => {
                const option = document.createElement('option');
                option.value = page.id; option.textContent = page.name;
                select.appendChild(option);
            });
            select.dataset.signature = signature;
        }
        select.value = state.activePageId;
        const page = state.pages.find(item => item.id === state.activePageId);
        const input = this.pageControls.querySelector('.page-name-input');
        if (document.activeElement !== input) input.value = page?.name || '';
        this.pageControls.querySelector('[data-page-action="delete"]').disabled = state.pages.length <= 1;
    }

    subscribeToStore() {
        this.lastDocumentRevision = -1;
        this.lastPageSizeJSON = '';
        
        this.store.subscribe((state) => {
            this.syncPageControls();
            const currentPageSizeJSON = JSON.stringify(state.pageSize);
            
            if (this.store.documentRevision !== this.lastDocumentRevision || currentPageSizeJSON !== this.lastPageSizeJSON) {
                this.lastDocumentRevision = this.store.documentRevision;
                this.lastPageSizeJSON = currentPageSizeJSON;
                this.renderCanvas();
            } else {
                this.updateSelectionOutlines(state.selectedElements);
            }
        });
    }

    updateSelectionOutlines(selectedIds) {
        const childNodes = this.canvasPage.children;
        for (let i = 0; i < childNodes.length; i++) {
            const el = childNodes[i];
            const id = el.dataset.id;
            if (!id) continue;
            if (selectedIds.includes(id)) {
                el.classList.add('selected');
                el.style.outline = '2px solid #4D6BFF';
            } else {
                el.classList.remove('selected');
                el.style.outline = '';
            }
        }
        this.syncEditorMediaPlayback(selectedIds);
        this.renderSelectionOverlay();
    }

    syncEditorMediaPlayback(selectedIds) {
        this.canvasPage.querySelectorAll('video, audio').forEach(media => {
            const element = this.store.getState().elements.find(item => item.id === media.dataset.id);
            const shouldPlay = selectedIds.includes(media.dataset.id) && element?.attributes?.autoplay !== false;
            media.muted = element?.attributes?.muted !== false;
            media.loop = element?.attributes?.loop !== false;
            if (shouldPlay) {
                media.preload = 'auto';
                media.play().catch(() => {});
            } else {
                media.pause();
                media.preload = 'none';
            }
        });
    }

    bindEvents() {
        // Zoom controls
        const zoomBtns = this.container.querySelectorAll('.zoom-btn');
        zoomBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this.handleZoom(action);
            });
        });

        // Canvas controls
        const canvasBtns = this.container.querySelectorAll('.canvas-btn');
        canvasBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this.handleCanvasControl(action);
            });
        });

        // Page size
        const pageSelect = this.container.querySelector('.page-size-select');
        pageSelect.addEventListener('change', (e) => {
            const [width, height] = e.target.value.split('x').map(Number);
            this.store.setState({ pageSize: { width, height } });
            this.fitToScreen();
        });

        this.canvasWrapper.addEventListener('wheel', event => {
            if (!(event.ctrlKey || event.metaKey)) return;
            event.preventDefault();
            this.zoomMode = 'manual';
            const direction = event.deltaY < 0 ? 1 : -1;
            this.setZoom(this.zoomLevel + direction * 0.1, { x: event.clientX, y: event.clientY });
        }, { passive: false });

        // Drag and drop from sidebar
        this.canvasPage.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.canvasPage.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = e.dataTransfer.getData('text/plain');
            if (data) {
                try {
                    const elementData = JSON.parse(data);
                    const pageRect = this.canvasPage.getBoundingClientRect();
                    const x = (e.clientX - pageRect.left) / this.zoomLevel;
                    const y = (e.clientY - pageRect.top) / this.zoomLevel;
                    
                    const defaults = elementData.defaults || {};
                    const defaultSize = defaults.size || { width: 200, height: 150 };
                    const state = this.store.getState();
                    const snap = value => state.snapEnabled && !e.altKey ? Math.round(value / 10) * 10 : value;
                    const newElement = {
                        tag: elementData.tag,
                        name: elementData.name,
                        position: {
                            x: Math.max(0, Math.min(snap(x - defaultSize.width / 2), state.pageSize.width - defaultSize.width)),
                            y: Math.max(0, Math.min(snap(y - defaultSize.height / 2), state.pageSize.height - defaultSize.height))
                        },
                        size: defaultSize,
                        styles: defaults.styles || {},
                        content: defaults.content || '',
                        attributes: defaults.attributes || {}
                    };
                    this.store.addElement(newElement);
                } catch (err) {
                    console.warn('Failed to parse dragged element:', err);
                }
            }
        });

        // Clear selection on canvas click
        this.canvasPage.addEventListener('mousedown', (e) => {
            if (e.target === this.canvasPage) {
                this.store.clearSelection();
            }
        });

        document.addEventListener('mousedown', e => {
            if (this.contextMenu && !this.contextMenu.contains(e.target)) this.closeContextMenu();
        });
        document.addEventListener('scroll', () => this.closeContextMenu(), true);
        window.addEventListener('resize', () => this.closeContextMenu());
        document.addEventListener('keydown', e => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
            const active = document.activeElement;
            if (active && (active.matches('input, textarea, select') || active.isContentEditable)) return;
            const state = this.store.getState();
            if (!state.selectedElements.length) return;
            e.preventDefault();
            const amount = e.shiftKey ? 10 : 1;
            const delta = { x: e.key === 'ArrowLeft' ? -amount : e.key === 'ArrowRight' ? amount : 0, y: e.key === 'ArrowUp' ? -amount : e.key === 'ArrowDown' ? amount : 0 };
            const items = state.selectedElements.map(id => state.elements.find(element => element.id === id)).filter(item => item && !item.locked);
            if (!items.length) return;
            const dx = Math.max(
                Math.max(...items.map(item => -(item.position?.x || 0))),
                Math.min(delta.x, Math.min(...items.map(item => state.pageSize.width - (item.position?.x || 0) - (item.size?.width || 1))))
            );
            const dy = Math.max(
                Math.max(...items.map(item => -(item.position?.y || 0))),
                Math.min(delta.y, Math.min(...items.map(item => state.pageSize.height - (item.position?.y || 0) - (item.size?.height || 1))))
            );
            items.forEach(item => {
                this.store.updateElement(item.id, { position: { x: (item.position?.x || 0) + dx, y: (item.position?.y || 0) + dy } });
            });
        });
    }

    handleZoom(action) {
        switch(action) {
            case 'zoom-in':
                this.zoomMode = 'manual';
                this.setZoom(this.zoomLevel + 0.1);
                break;
            case 'zoom-out':
                this.zoomMode = 'manual';
                this.setZoom(this.zoomLevel - 0.1);
                break;
            case 'fit-screen':
                this.fitToScreen();
                break;
        }
    }

    fitToScreen() {
        this.zoomMode = 'fit';
        const styles = getComputedStyle(this.canvasWrapper);
        const availableWidth = this.canvasWrapper.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
        const availableHeight = this.canvasWrapper.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
        const pageSize = this.store.getState().pageSize;
        this.setZoom(Math.min(availableWidth / pageSize.width, availableHeight / pageSize.height, 1));
    }

    setZoom(value, anchor = null) {
        const nextZoom = Math.max(0.1, Math.min(Number(value) || 1, 3));
        const wrapperRect = this.canvasWrapper.getBoundingClientRect();
        const anchorX = anchor ? anchor.x - wrapperRect.left : this.canvasWrapper.clientWidth / 2;
        const anchorY = anchor ? anchor.y - wrapperRect.top : this.canvasWrapper.clientHeight / 2;
        const logicalX = (this.canvasWrapper.scrollLeft + anchorX - this.canvasStage.offsetLeft) / this.zoomLevel;
        const logicalY = (this.canvasWrapper.scrollTop + anchorY - this.canvasStage.offsetTop) / this.zoomLevel;
        this.zoomLevel = nextZoom;
        this.updateCanvasTransform();
        requestAnimationFrame(() => {
            this.canvasWrapper.scrollLeft = this.canvasStage.offsetLeft + logicalX * nextZoom - anchorX;
            this.canvasWrapper.scrollTop = this.canvasStage.offsetTop + logicalY * nextZoom - anchorY;
        });
    }

    updateCanvasTransform() {
        const pageSize = this.store.getState().pageSize;
        this.canvasPage.style.transform = `scale(${this.zoomLevel})`;
        this.canvasStage.style.width = `${pageSize.width * this.zoomLevel}px`;
        this.canvasStage.style.height = `${pageSize.height * this.zoomLevel}px`;
        this.updateZoomLevel();
    }

    handleCanvasControl(action) {
        const state = this.store.getState();
        switch(action) {
            case 'grid':
                this.store.setState({ gridVisible: !state.gridVisible });
                break;
            case 'guidelines':
                this.store.setState({ guidelinesVisible: !state.guidelinesVisible });
                break;
            case 'rulers':
                this.store.setState({ rulersVisible: !state.rulersVisible });
                break;
        }
        this.syncCanvasControls();
    }

    syncCanvasControls() {
        const state = this.store.getState();
        this.container.querySelectorAll('.canvas-btn').forEach(btn => {
            const active = btn.dataset.action === 'grid' ? state.gridVisible : btn.dataset.action === 'guidelines' ? state.guidelinesVisible : state.rulersVisible;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', String(active));
        });
    }

    updateZoomLevel() {
        const zoomText = this.container.querySelector('.zoom-level');
        if (zoomText) {
            zoomText.textContent = Math.round(this.zoomLevel * 100) + '%';
        }
    }

    renderCanvas() {
        const state = this.store.getState();
        const elements = state.elements;
        const selectedIds = state.selectedElements;
        
        this.canvasPage.innerHTML = '';
        
        // Update page size
        this.canvasPage.style.width = state.pageSize.width + 'px';
        this.canvasPage.style.height = state.pageSize.height + 'px';
        this.canvasPage.style.backgroundColor = '#FFFFFF';
        this.canvasPage.style.position = 'absolute';
        this.canvasPage.classList.toggle('grid-visible', state.gridVisible);
        
        elements.forEach(element => {
            const el = this.createElementNode(element, selectedIds);
            this.canvasPage.appendChild(el);
        });
        this.renderCanvasAids(state);
        this.renderSelectionOverlay();
        this.syncEditorMediaPlayback(selectedIds);
        
        this.syncCanvasControls();
        this.canvasPage.style.transformOrigin = 'top left';
        this.updateCanvasTransform();
    }

    createElementNode(element, selectedIds) {
        const el = document.createElement(element.tag || 'div');
        el.dataset.id = element.id;
        el.dataset.tag = element.tag || 'div';
        
        // Position
        el.style.position = 'absolute';
        if (element.position) {
            el.style.left = element.position.x + 'px';
            el.style.top = element.position.y + 'px';
        }
        
        // Size
        if (element.size) {
            el.style.width = element.size.width + 'px';
            el.style.height = element.size.height + 'px';
        }
        
        // Styles
        if (element.styles) {
            Object.entries(element.styles).forEach(([prop, value]) => {
                try {
                    if (['position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight'].includes(prop)) return;
                    if (element.hidden && prop === 'visibility') return;
                    el.style[prop] = value;
                } catch (e) {
                    console.warn(`Failed to set style ${prop}:`, e);
                }
            });
        }
        // Canvas objects always use document geometry; authored position values must not break editing.
        el.style.position = 'absolute';
        
        // Content
        const selfClosingTags = ['img', 'input', 'br', 'hr', 'video', 'audio', 'iframe'];
        if (element.content && !selfClosingTags.includes(element.tag)) {
            if (element.tag === 'select') {
                const option = document.createElement('option');
                option.textContent = element.content || 'Option';
                el.appendChild(option);
            } else {
                el.textContent = element.content;
            }
        }
        
        // Attributes
        if (element.attributes) {
            Object.entries(element.attributes).forEach(([attr, value]) => {
                try {
                    if (/^on/i.test(attr) || attr === 'style') return;
                    if (['href', 'src'].includes(attr.toLowerCase()) && /^javascript:/i.test(String(value).trim())) return;
                    if (value === false || value === null || value === undefined) el.removeAttribute(attr);
                    else if (value === true) el.setAttribute(attr, '');
                    else el.setAttribute(attr, value);
                } catch (e) {
                    console.warn(`Failed to set attribute ${attr}:`, e);
                }
            });
        }
        if (element.tag === 'video') {
            el.removeAttribute('autoplay');
            el.removeAttribute('controls');
            el.preload = 'none';
            el.muted = true;
        }
        if (element.hidden) {
            el.classList.add('editor-hidden');
            el.style.visibility = 'visible';
            el.style.opacity = '0.22';
        }
        
        // Selection
        if (selectedIds.includes(element.id)) {
            el.classList.add('selected');
            el.style.outline = '2px solid #4D6BFF';
        }
        
        el.style.cursor = element.locked ? 'not-allowed' : 'move';
        el.style.userSelect = 'none';
        
        // Click to select
        el.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            
            if (e.shiftKey) {
                const state = this.store.getState();
                if (state.selectedElements.includes(element.id)) {
                    this.store.deselectElement(element.id);
                } else {
                    this.store.selectElement(element.id);
                }
            } else {
                if (!this.store.getState().selectedElements.includes(element.id)) {
                    this.store.clearSelection();
                    this.store.selectElement(element.id);
                }
            }
            
            if (element.locked || e.button !== 0 || el.isContentEditable) return;
            // Start drag
            this.isDragging = true;
            this.dragTarget = el;
            const rect = el.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            const state = this.store.getState();
            this.dragGroup = state.selectedElements.map(id => {
                const item = state.elements.find(candidate => candidate.id === id);
                return item && !item.locked ? { id, position: { ...item.position } } : null;
            }).filter(Boolean);
        });

        el.addEventListener('dblclick', e => {
            e.stopPropagation();
            this.startInlineEditing(el, element);
        });
        if (['a', 'button', 'input', 'select', 'textarea'].includes(element.tag)) {
            el.addEventListener('click', e => e.preventDefault());
        }
        el.addEventListener('contextmenu', e => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.store.getState().selectedElements.includes(element.id)) {
                this.store.clearSelection();
                this.store.selectElement(element.id);
            }
            this.openContextMenu(e.clientX, e.clientY, element.id);
        });
        
        return el;
    }

    renderCanvasAids(state) {
        if (state.guidelinesVisible) {
            const guides = document.createElement('div');
            guides.className = 'canvas-guides';
            guides.innerHTML = '<i class="guide-x"></i><i class="guide-y"></i>';
            this.canvasPage.appendChild(guides);
        }
        if (state.rulersVisible) {
            const rulers = document.createElement('div');
            rulers.className = 'canvas-ruler-overlay';
            rulers.innerHTML = '<div class="ruler-horizontal"></div><div class="ruler-vertical"></div>';
            this.canvasPage.appendChild(rulers);
        }
    }

    renderSelectionOverlay() {
        this.canvasPage.querySelector('.selection-overlay')?.remove();
        const state = this.store.getState();
        if (state.selectedElements.length !== 1) return;
        const element = state.elements.find(item => item.id === state.selectedElements[0]);
        if (!element) return;
        const overlay = document.createElement('div');
        overlay.className = `selection-overlay${element.locked ? ' is-locked' : ''}`;
        overlay.style.left = `${element.position?.x || 0}px`;
        overlay.style.top = `${element.position?.y || 0}px`;
        overlay.style.width = `${element.size?.width || 1}px`;
        overlay.style.height = `${element.size?.height || 1}px`;
        overlay.innerHTML = `<div class="selection-tag">${element.name || element.tag}${element.locked ? ' · Locked' : ''}</div>`;
        if (!element.locked) {
            ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(direction => {
                const handle = document.createElement('button');
                handle.className = `resize-handle handle-${direction}`;
                handle.dataset.direction = direction;
                handle.setAttribute('aria-label', `Resize ${direction}`);
                handle.addEventListener('mousedown', e => this.startResize(e, element));
                overlay.appendChild(handle);
            });
        }
        this.canvasPage.appendChild(overlay);
    }

    startResize(event, element) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
        this.dragTarget = null;
        this.interaction = {
            type: 'resize', id: element.id, direction: event.currentTarget.dataset.direction,
            startX: event.clientX, startY: event.clientY,
            position: { ...element.position }, size: { ...element.size },
            ratio: (element.size?.width || 1) / (element.size?.height || 1)
        };
        document.body.classList.add('canvas-interacting');
    }

    updateResize(event) {
        const action = this.interaction;
        if (!action || action.type !== 'resize') return;
        const dx = (event.clientX - action.startX) / this.zoomLevel;
        const dy = (event.clientY - action.startY) / this.zoomLevel;
        const dir = action.direction;
        let { x, y } = action.position;
        let { width, height } = action.size;
        if (dir.includes('e')) width += dx;
        if (dir.includes('s')) height += dy;
        if (dir.includes('w')) { width -= dx; x += dx; }
        if (dir.includes('n')) { height -= dy; y += dy; }
        if (event.shiftKey && dir.length === 2) {
            if (Math.abs(dx) > Math.abs(dy)) height = width / action.ratio;
            else width = height * action.ratio;
            if (dir.includes('w')) x = action.position.x + action.size.width - width;
            if (dir.includes('n')) y = action.position.y + action.size.height - height;
        }
        const pageSize = this.store.getState().pageSize;
        if (this.store.getState().snapEnabled && !event.altKey && !event.shiftKey) {
            const snap = value => Math.round(value / 10) * 10;
            const right = x + width;
            const bottom = y + height;
            if (dir.includes('w')) { x = snap(x); width = right - x; }
            if (dir.includes('n')) { y = snap(y); height = bottom - y; }
            if (dir.includes('e')) width = snap(width);
            if (dir.includes('s')) height = snap(height);
        }
        width = Math.max(16, Math.round(width));
        height = Math.max(16, Math.round(height));
        x = Math.max(0, Math.min(Math.round(x), pageSize.width - 16));
        y = Math.max(0, Math.min(Math.round(y), pageSize.height - 16));
        width = Math.min(width, pageSize.width - x);
        height = Math.min(height, pageSize.height - y);
        const node = this.canvasPage.querySelector(`[data-id="${action.id}"]`);
        const overlay = this.canvasPage.querySelector('.selection-overlay');
        [node, overlay].forEach(target => { if (target) { target.style.left = `${x}px`; target.style.top = `${y}px`; target.style.width = `${width}px`; target.style.height = `${height}px`; } });
        action.current = { position: { x, y }, size: { width, height } };
    }

    finishResize() {
        const action = this.interaction;
        if (!action || action.type !== 'resize') return;
        if (action.current) this.store.updateElement(action.id, action.current);
        this.interaction = null;
        document.body.classList.remove('canvas-interacting');
    }

    startInlineEditing(node, element) {
        const editableTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'button', 'a', 'label', 'section', 'article', 'header', 'footer'];
        if (!editableTags.includes(element.tag) || element.locked) return;
        this.isDragging = false;
        node.contentEditable = 'true';
        node.classList.add('inline-editing');
        node.focus();
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        const finish = () => {
            node.contentEditable = 'false';
            node.classList.remove('inline-editing');
            this.store.updateElement(element.id, { content: node.textContent });
        };
        node.addEventListener('blur', finish, { once: true });
        node.addEventListener('keydown', e => {
            if (e.key === 'Escape') { node.textContent = element.content || ''; node.blur(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') node.blur();
        });
    }

    openContextMenu(x, y, id) {
        this.closeContextMenu();
        const element = this.store.getState().elements.find(item => item.id === id);
        if (!element) return;
        const menu = document.createElement('div');
        menu.className = 'canvas-context-menu';
        const actions = [
            ['edit', 'Edit text', 'Double-click'], ['duplicate', 'Duplicate', 'Ctrl+D'],
            ['front', 'Bring to front', ''], ['forward', 'Bring forward', ''],
            ['backward', 'Send backward', ''], ['back', 'Send to back', ''],
            ['lock', element.locked ? 'Unlock' : 'Lock', ''], ['visibility', element.hidden ? 'Show' : 'Hide', ''],
            ['delete', 'Delete', 'Delete']
        ];
        actions.forEach(([action, label, shortcut], index) => {
            if ([2, 6, 8].includes(index)) menu.appendChild(document.createElement('div')).className = 'context-divider';
            const button = document.createElement('button');
            button.innerHTML = `<span>${label}</span><kbd>${shortcut}</kbd>`;
            button.className = action === 'delete' ? 'danger' : '';
            if (action === 'edit' && !['div','span','p','h1','h2','h3','h4','button','a','label'].includes(element.tag)) button.disabled = true;
            button.addEventListener('click', () => { this.runContextAction(action, id); this.closeContextMenu(); });
            menu.appendChild(button);
        });
        document.body.appendChild(menu);
        const rect = menu.getBoundingClientRect();
        menu.style.left = `${Math.min(x, window.innerWidth - rect.width - 8)}px`;
        menu.style.top = `${Math.min(y, window.innerHeight - rect.height - 8)}px`;
        this.contextMenu = menu;
    }

    runContextAction(action, id) {
        const element = this.store.getState().elements.find(item => item.id === id);
        if (!element) return;
        if (action === 'duplicate') this.store.duplicateElement(id);
        else if (action === 'delete') this.store.deleteElement(id);
        else if (action === 'lock') this.store.updateElement(id, { locked: !element.locked });
        else if (action === 'visibility') this.store.updateElement(id, { hidden: !element.hidden, styles: { ...element.styles, visibility: element.hidden ? 'visible' : 'hidden' } });
        else if (['front', 'forward', 'backward', 'back'].includes(action)) this.store.reorderElement(id, action);
        else if (action === 'edit') this.startInlineEditing(this.canvasPage.querySelector(`[data-id="${id}"]`), element);
    }

    closeContextMenu() {
        this.contextMenu?.remove();
        this.contextMenu = null;
    }
}

// Mouse events for dragging
document.addEventListener('mousemove', (e) => {
    if (window.canvasManager?.interaction?.type === 'resize') { window.canvasManager.updateResize(e); return; }
    if (!window.canvasManager || !window.canvasManager.isDragging || !window.canvasManager.dragTarget) return;
    
    const manager = window.canvasManager;
    const pageRect = manager.canvasPage.getBoundingClientRect();
    let x = (e.clientX - pageRect.left - manager.dragOffset.x) / manager.zoomLevel;
    let y = (e.clientY - pageRect.top - manager.dragOffset.y) / manager.zoomLevel;
    
    const primary = manager.dragGroup?.find(item => item.id === manager.dragTarget.dataset.id);
    const state = manager.store.getState();
    if (state.snapEnabled && !e.altKey) {
        x = Math.round(x / 10) * 10;
        y = Math.round(y / 10) * 10;
    }
    let dx = x - (primary?.position.x || 0);
    let dy = y - (primary?.position.y || 0);
    const group = manager.dragGroup || [];
    if (group.length) {
        const getElement = id => state.elements.find(element => element.id === id);
        const minDx = Math.max(...group.map(item => -item.position.x));
        const minDy = Math.max(...group.map(item => -item.position.y));
        const maxDx = Math.min(...group.map(item => {
            const element = getElement(item.id);
            return state.pageSize.width - item.position.x - (element?.size?.width || 1);
        }));
        const maxDy = Math.min(...group.map(item => {
            const element = getElement(item.id);
            return state.pageSize.height - item.position.y - (element?.size?.height || 1);
        }));
        dx = Math.max(minDx, Math.min(dx, maxDx));
        dy = Math.max(minDy, Math.min(dy, maxDy));
    }
    group.forEach(item => {
        const node = manager.canvasPage.querySelector(`[data-id="${item.id}"]`);
        if (!node) return;
        node.style.left = Math.max(0, item.position.x + dx) + 'px';
        node.style.top = Math.max(0, item.position.y + dy) + 'px';
    });
});

document.addEventListener('mouseup', () => {
    if (window.canvasManager?.interaction?.type === 'resize') { window.canvasManager.finishResize(); return; }
    if (window.canvasManager && window.canvasManager.isDragging && window.canvasManager.dragTarget) {
        const manager = window.canvasManager;
        (manager.dragGroup || []).forEach(item => {
            const node = manager.canvasPage.querySelector(`[data-id="${item.id}"]`);
            if (node) window.store.updateElement(item.id, { position: { x: parseFloat(node.style.left) || 0, y: parseFloat(node.style.top) || 0 } });
        });
        
        manager.isDragging = false;
        manager.dragTarget = null;
        manager.dragGroup = null;
    }
});
