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
        
        this.categories = window.getCategoriesWithElements();
        this.currentCategory = Object.keys(this.categories)[0];
        
        this.init();
    }

    init() {
        this.renderCategories();
        this.renderElements();
        this.bindEvents();
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
    }
}
