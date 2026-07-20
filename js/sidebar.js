/**
 * KeepTheStyle - Sidebar Management
 * Manages the left sidebar with elements and categories
 */

class SidebarManager {
    constructor(container) {
        this.container = container;
        this.nav = container.querySelector('.sidebar-nav');
        this.elementsList = container.querySelector('.sidebar-elements');
        this.searchInput = container.querySelector('.sidebar-search input');
        this.layersList = container.querySelector('.sidebar-layers');
        this.tabs = container.querySelectorAll('[data-sidebar-view]');
        this.currentView = 'insert';
        
        this.categories = window.getCategoriesWithElements();
        this.currentCategory = Object.keys(this.categories)[0];
        
        this.init();
    }

    init() {
        this.renderCategories();
        this.renderElements();
        this.bindEvents();
        window.store.subscribe(() => { if (this.currentView === 'layers') this.renderLayers(); });
    }

    renderCategories() {
        this.nav.innerHTML = '';
        const preferredOrder = ['Basic HTML', 'Shapes', 'Typography', 'Layout', 'Forms', 'Media', 'Buttons', 'Navigation'];
        Object.keys(this.categories).sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b)).forEach(name => {
            const btn = document.createElement('button');
            btn.className = `category-btn ${name === this.currentCategory ? 'active' : ''}`;
            const icon = name === 'Shapes' ? '◆' : this.categories[name].icon || '•';
            btn.innerHTML = `<span class="category-icon">${icon}</span><span>${name}</span>`;
            btn.dataset.category = name;
            btn.title = `Browse ${name}`;
            btn.addEventListener('click', () => {
                this.currentCategory = name;
                this.renderCategories();
                this.renderElements();
            });
            this.nav.appendChild(btn);
        });
    }

    renderElements(filter = '') {
        const query = filter.trim().toLowerCase();
        const elements = query
            ? Object.values(this.categories).flatMap(category => category.elements).filter(el => `${el.name} ${el.tag}`.toLowerCase().includes(query))
            : this.categories[this.currentCategory].elements;
        this.elementsList.innerHTML = '';
        elements.forEach(el => {
            const item = this.createElementItem(el);
            this.elementsList.appendChild(item);
        });
        if (!elements.length) this.elementsList.innerHTML = '<div class="sidebar-empty"><strong>No elements found</strong><span>Try another name or tag.</span></div>';
        this.nav.classList.toggle('searching', !!query);
    }

    createElementItem(element) {
        const div = document.createElement('div');
        div.className = 'element-item';
        div.draggable = true;
        div.dataset.tag = element.tag;
        const shapeNames = ['Rectangle', 'Rounded Rectangle', 'Circle', 'Pill', 'Line', 'Triangle', 'Diamond', 'Star', 'Blob'];
        if (shapeNames.includes(element.name)) div.classList.add('shape-item');
        
        const icon = document.createElement('span');
        icon.className = 'element-icon';
        icon.textContent = element.icon || '⊞';
        
        const name = document.createElement('span');
        name.className = 'element-name';
        name.textContent = element.name;
        
        div.appendChild(icon);
        div.appendChild(name);
        const add = document.createElement('button');
        add.className = 'element-add';
        add.textContent = '+';
        add.title = `Add ${element.name}`;
        add.addEventListener('click', e => { e.stopPropagation(); this.insertElement(element); });
        div.appendChild(add);
        
        // Double click to insert
        div.addEventListener('dblclick', () => {
            this.insertElement(element);
        });
        
        // Drag and drop
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', JSON.stringify({
                tag: element.tag,
                name: element.name,
                defaults: element.defaults
            }));
        });
        
        return div;
    }

    insertElement(element) {
        const defaults = deepClone(element.defaults || {});
        const page = window.store.getState().pageSize;
        const newElement = {
            tag: element.tag,
            name: element.name,
            position: { x: Math.max(0, page.width / 2 - (defaults.size?.width || 200) / 2), y: Math.max(0, page.height / 2 - (defaults.size?.height || 150) / 2) },
            size: defaults.size || { width: 200, height: 150 },
            styles: defaults.styles || {},
            content: defaults.content || '',
            attributes: defaults.attributes || {}
        };
        
        window.store.addElement(newElement);
    }

    bindEvents() {
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            this.renderElements(query);
        });
        this.tabs.forEach(tab => tab.addEventListener('click', () => this.setView(tab.dataset.sidebarView)));
    }

    setView(view) {
        this.currentView = view;
        this.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.sidebarView === view));
        const showLayers = view === 'layers';
        this.container.querySelector('.sidebar-search').hidden = showLayers;
        this.nav.hidden = showLayers;
        this.elementsList.hidden = showLayers;
        this.layersList.hidden = !showLayers;
        if (showLayers) this.renderLayers();
    }

    renderLayers() {
        const state = window.store.getState();
        this.layersList.innerHTML = '';
        [...state.elements].reverse().forEach(element => {
            const row = document.createElement('div');
            row.className = 'layer-item';
            row.classList.toggle('selected', state.selectedElements.includes(element.id));
            row.classList.toggle('is-hidden', !!element.hidden);
            row.classList.toggle('is-locked', !!element.locked);
            row.innerHTML = `<span class="layer-type">${escapeHTML((element.tag || 'div').slice(0, 3).toUpperCase())}</span><span class="layer-name">${escapeHTML(element.name || element.tag || 'Element')}</span>`;
            const actions = document.createElement('span');
            actions.className = 'layer-actions';
            const controls = [
                ['visibility', element.hidden ? 'Show layer' : 'Hide layer', element.hidden ? '○' : '●'],
                ['lock', element.locked ? 'Unlock layer' : 'Lock layer', element.locked ? 'L' : 'U'],
                ['up', 'Bring forward', '↑'], ['down', 'Send backward', '↓']
            ];
            controls.forEach(([action, title, text]) => {
                const button = document.createElement('button');
                button.dataset.layerAction = action; button.title = title; button.textContent = text;
                button.addEventListener('click', event => { event.stopPropagation(); this.runLayerAction(element, action); });
                actions.appendChild(button);
            });
            row.appendChild(actions);
            row.addEventListener('click', event => {
                if (!event.shiftKey) window.store.clearSelection();
                if (event.shiftKey && state.selectedElements.includes(element.id)) window.store.deselectElement(element.id);
                else window.store.selectElement(element.id);
            });
            row.addEventListener('dblclick', () => {
                const name = window.prompt('Layer name', element.name || element.tag || 'Element');
                if (name?.trim()) window.store.updateElement(element.id, { name: name.trim() });
            });
            this.layersList.appendChild(row);
        });
        if (!state.elements.length) this.layersList.innerHTML = '<div class="sidebar-empty"><strong>No layers yet</strong><span>Add an element to start designing.</span></div>';
    }

    runLayerAction(element, action) {
        if (action === 'lock') window.store.updateElement(element.id, { locked: !element.locked });
        if (action === 'visibility') {
            const styles = { ...element.styles };
            if (!element.hidden) styles.visibility = 'hidden'; else if (styles.visibility === 'hidden') delete styles.visibility;
            window.store.updateElement(element.id, { hidden: !element.hidden, styles });
        }
        if (action === 'up') window.store.reorderElement(element.id, 'forward');
        if (action === 'down') window.store.reorderElement(element.id, 'backward');
    }
}
