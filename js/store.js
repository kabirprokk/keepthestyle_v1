/**
 * KeepTheStyle - Application State Management
 * Central store for all application data with real-time updates
 */

class Store {
    constructor() {
        this.state = {
            elements: [],
            pages: [],
            activePageId: null,
            selectedElements: [],
            clipboard: null,
            history: [],
            historyIndex: -1,
            maxHistory: 50,
            zoom: 1,
            gridVisible: true,
            guidelinesVisible: true,
            rulersVisible: true,
            snapEnabled: true,
            pageSize: { width: 1920, height: 1080 },
            activeBreakpoint: 'base',
            basePageSize: { width: 1920, height: 1080 },
            darkMode: false,
            activeTab: 'html',
            projectName: 'Untitled Project',
            siteLanguage: 'en',
            textDirection: 'auto',
            siteDescription: '',
            siteKeywords: '',
            canonicalUrl: '',
            socialImage: '',
            siteTheme: 'system',
            designTokens: {
                primary: '#4d6bff', secondary: '#7b61ff', accent: '#20c997',
                surface: '#ffffff', text: '#111827', muted: '#667085',
                radius: 12, spacing: 8, fontBody: 'Inter', fontHeading: 'Inter'
            },
            themeColor: '#4d6bff',
            pageTransition: 'fade',
            pageTransitionDuration: 450,
            pageTransitionEasing: 'ease-in-out',
            pageTransitions: [],
            isDragging: false,
            hasLoadedProject: false,
            dragOffset: { x: 0, y: 0 },
            selectedTool: 'select',
            lastUpdate: Date.now()
        };

        this.listeners = [];
        this.documentRevision = 0;
        this.lastPersistedRevision = -1;
        this.storageSaveTimer = null;
        this.historyMedia = new Map();
        this.updateHistoryTimer = null;
        this.init();
    }

    init() {
        // Load from localStorage if available
        this.loadFromStorage();
        this.ensurePageModel();
        if (!this.state.history.length) this.saveHistory();
        
        // Auto-save every 5 seconds
        this.autoSaveInterval = setInterval(() => this.saveToStorage(), 5000);
    }

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.push(listener);
        // Call listener immediately with current state
        listener(this.state);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Notify all listeners of state change in real-time
    notify(documentChanged = true) {
        if (documentChanged) this.documentRevision++;
        this.listeners.forEach(listener => {
            try {
                listener(this.state);
            } catch (e) {
                console.error('Error in store listener:', e);
            }
        });
    }

    // Get current state
    getState() {
        return this.state;
    }

    // Update state with real-time notification
    setState(newState) {
        const elementsChanged = Object.prototype.hasOwnProperty.call(newState, 'elements') && JSON.stringify(this.state.elements) !== JSON.stringify(newState.elements);
        this.state = { ...this.state, ...newState };
        if (Object.prototype.hasOwnProperty.call(newState, 'elements')) this.syncActivePage();
        this.state.lastUpdate = Date.now();
        if (elementsChanged) this.saveHistory();
        
        this.notify();
        this.saveToStorage();
    }

    // Check if state change should be saved to history
    shouldSaveHistory(oldState, newState) {
        // Compare elements array for changes
        if (JSON.stringify(oldState.elements) !== JSON.stringify(newState.elements)) {
            return true;
        }
        return false;
    }

    // History management
    saveHistory() {
        clearTimeout(this.updateHistoryTimer);
        this.updateHistoryTimer = null;
        // Remove any future history if we're not at the end
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
        }
        
        // Add current state to history
        const snapshot = this.createHistorySnapshot();
        if (this.state.history[this.state.historyIndex] === snapshot) return;
        this.state.history.push(snapshot);
        this.state.historyIndex = this.state.history.length - 1;
        
        // Limit history size
        if (this.state.history.length > this.state.maxHistory) {
            this.state.history.shift();
            this.state.historyIndex--;
        }
        this.syncPageHistory();
    }

    createHistorySnapshot() {
        return JSON.stringify(this.state.elements, (key, value) => {
            if (typeof value !== 'string' || !value.startsWith('data:') || value.length < 1024) return value;
            let hash = value.length;
            for (let index = 0; index < Math.min(value.length, 256); index++) hash = ((hash * 31) ^ value.charCodeAt(index)) >>> 0;
            const token = `__KTS_MEDIA_${value.length}_${hash}__`;
            this.historyMedia.set(token, value);
            return token;
        });
    }

    restoreHistorySnapshot(snapshot) {
        return JSON.parse(snapshot, (key, value) => typeof value === 'string' && this.historyMedia.has(value) ? this.historyMedia.get(value) : value);
    }

    undo() {
        this.flushHistory();
        if (this.state.historyIndex > 0) {
            this.state.historyIndex--;
            const snapshot = this.state.history[this.state.historyIndex];
            this.state.elements = this.restoreHistorySnapshot(snapshot);
            this.syncActivePage();
            this.syncPageHistory();
            this.state.lastUpdate = Date.now();
            this.notify();
            this.saveToStorage();
            return true;
        }
        return false;
    }

    redo() {
        this.flushHistory();
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.historyIndex++;
            const snapshot = this.state.history[this.state.historyIndex];
            this.state.elements = this.restoreHistorySnapshot(snapshot);
            this.syncActivePage();
            this.syncPageHistory();
            this.state.lastUpdate = Date.now();
            this.notify();
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // Element operations
    addElement(elementData) {
        const element = {
            ...elementData,
            id: this.generateId(),
            position: elementData.position || { x: 100, y: 100 },
            size: elementData.size || { width: 200, height: 150 },
            styles: elementData.styles || {},
            responsiveStyles: elementData.responsiveStyles || {},
            content: elementData.content || '',
            attributes: elementData.attributes || {},
            interactions: Array.isArray(elementData.interactions) ? elementData.interactions : [],
            children: elementData.children || []
        };
        this.state.elements.push(element);
        this.syncActivePage();
        this.state.selectedElements = [element.id];
        this.saveHistory();
        this.notify();
        this.saveToStorage();
        return element;
    }

    deleteElement(id) {
        this.state.elements = this.state.elements.filter(el => el.id !== id);
        this.state.elements.forEach(el => { el.interactions = (el.interactions || []).filter(rule => rule.targetId !== id); });
        this.state.selectedElements = this.state.selectedElements.filter(sid => sid !== id);
        this.syncActivePage();
        this.saveHistory();
        this.notify();
        this.saveToStorage();
    }

    deleteElements(ids) {
        const remove = new Set(ids);
        if (!remove.size) return;
        this.state.elements = this.state.elements.filter(el => !remove.has(el.id));
        this.state.elements.forEach(el => { el.interactions = (el.interactions || []).filter(rule => !remove.has(rule.targetId)); });
        this.state.selectedElements = this.state.selectedElements.filter(id => !remove.has(id));
        this.syncActivePage();
        this.saveHistory();
        this.notify();
        this.saveToStorage();
    }

    updateElement(id, updates) {
        const element = this.state.elements.find(el => el.id === id);
        if (element) {
            Object.assign(element, updates);
            this.notify();
            this.saveToStorage();
            clearTimeout(this.updateHistoryTimer);
            this.updateHistoryTimer = setTimeout(() => { this.saveHistory(); this.notify(false); }, 250);
        }
    }

    updateElements(updates, options = {}) {
        const entries = Array.isArray(updates) ? updates : [];
        let changed = false;
        entries.forEach(entry => {
            const element = this.state.elements.find(item => item.id === entry?.id);
            if (!element || !entry.updates) return;
            Object.assign(element, entry.updates);
            changed = true;
        });
        if (!changed) return false;
        clearTimeout(this.updateHistoryTimer);
        if (options.immediateHistory) this.saveHistory();
        else this.updateHistoryTimer = setTimeout(() => { this.saveHistory(); this.notify(false); }, 250);
        this.syncActivePage();
        this.notify();
        this.saveToStorage();
        return true;
    }

    selectElement(id) {
        if (!this.state.selectedElements.includes(id)) {
            this.state.selectedElements.push(id);
            this.notify(false);
        }
    }

    deselectElement(id) {
        this.state.selectedElements = this.state.selectedElements.filter(sid => sid !== id);
        this.notify(false);
    }

    clearSelection() {
        this.state.selectedElements = [];
        this.notify(false);
    }

    selectElements(ids) {
        const valid = new Set(this.state.elements.map(element => element.id));
        this.state.selectedElements = [...new Set(ids)].filter(id => valid.has(id));
        this.notify(false);
    }

    duplicateElement(id) {
        const element = this.state.elements.find(el => el.id === id);
        if (element) {
            const newElement = deepClone({
                ...element,
                id: this.generateId(),
                position: {
                    x: Math.max(0, Math.min(element.position.x + 20, this.state.pageSize.width - (element.size?.width || 1))),
                    y: Math.max(0, Math.min(element.position.y + 20, this.state.pageSize.height - (element.size?.height || 1)))
                }
            });
            if (newElement.attributes?.id) delete newElement.attributes.id;
            newElement.interactions = (newElement.interactions || []).map(rule => ({ ...rule, targetId: rule.targetId === id ? newElement.id : rule.targetId }));
            delete newElement.groupId;
            this.state.elements.push(newElement);
            this.state.selectedElements = [newElement.id];
            this.saveHistory();
            this.notify();
            this.saveToStorage();
        }
    }

    duplicateElements(ids) {
        const idMap = new Map(ids.map(id => [id, this.generateId()]));
        const groupMap = new Map();
        const copies = ids.map(id => this.state.elements.find(el => el.id === id)).filter(Boolean).map(element => deepClone({
            ...element, id: idMap.get(element.id),
            position: {
                x: Math.max(0, Math.min((element.position?.x || 0) + 20, this.state.pageSize.width - (element.size?.width || 1))),
                y: Math.max(0, Math.min((element.position?.y || 0) + 20, this.state.pageSize.height - (element.size?.height || 1)))
            }
        }));
        copies.forEach(copy => { if (copy.groupId) { if (!groupMap.has(copy.groupId)) groupMap.set(copy.groupId, `group_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`); copy.groupId = groupMap.get(copy.groupId); } });
        copies.forEach(copy => { if (copy.attributes?.id) delete copy.attributes.id; });
        copies.forEach(copy => { copy.interactions = (copy.interactions || []).map(rule => ({ ...rule, targetId: idMap.get(rule.targetId) || rule.targetId })); });
        if (!copies.length) return;
        this.state.elements.push(...copies);
        this.state.selectedElements = copies.map(el => el.id);
        this.saveHistory(); this.notify(); this.saveToStorage();
    }

    copyElements(ids) {
        this.state.clipboard = ids.map(id => this.state.elements.find(el => el.id === id)).filter(Boolean).map(deepClone);
    }

    pasteElements() {
        if (!Array.isArray(this.state.clipboard) || !this.state.clipboard.length) return;
        const idMap = new Map(this.state.clipboard.map(element => [element.id, this.generateId()]));
        const groupMap = new Map();
        const copies = this.state.clipboard.map(element => deepClone({ ...element, id: idMap.get(element.id), position: {
            x: Math.max(0, Math.min((element.position?.x || 0) + 20, this.state.pageSize.width - (element.size?.width || 1))),
            y: Math.max(0, Math.min((element.position?.y || 0) + 20, this.state.pageSize.height - (element.size?.height || 1)))
        } }));
        copies.forEach(copy => { if (copy.groupId) { if (!groupMap.has(copy.groupId)) groupMap.set(copy.groupId, `group_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`); copy.groupId = groupMap.get(copy.groupId); } });
        copies.forEach(copy => { if (copy.attributes?.id) delete copy.attributes.id; });
        copies.forEach(copy => { copy.interactions = (copy.interactions || []).map(rule => ({ ...rule, targetId: idMap.get(rule.targetId) || rule.targetId })); });
        this.state.clipboard = copies.map(deepClone);
        this.state.elements.push(...copies);
        this.state.selectedElements = copies.map(el => el.id);
        this.saveHistory(); this.notify(); this.saveToStorage();
    }

    groupElements(ids = this.state.selectedElements) {
        const members = ids.map(id => this.state.elements.find(element => element.id === id)).filter(Boolean);
        if (members.length < 2) return false;
        const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        members.forEach(element => { element.groupId = groupId; });
        this.saveHistory(); this.notify(); this.saveToStorage();
        return true;
    }

    ungroupElements(ids = this.state.selectedElements) {
        const groups = new Set(ids.map(id => this.state.elements.find(element => element.id === id)?.groupId).filter(Boolean));
        if (!groups.size) return false;
        this.state.elements.forEach(element => { if (groups.has(element.groupId)) delete element.groupId; });
        this.saveHistory(); this.notify(); this.saveToStorage();
        return true;
    }

    reorderElement(id, action) {
        const index = this.state.elements.findIndex(el => el.id === id);
        if (index < 0) return;
        let target = index;
        if (action === 'front') target = this.state.elements.length - 1;
        if (action === 'forward') target = Math.min(this.state.elements.length - 1, index + 1);
        if (action === 'backward') target = Math.max(0, index - 1);
        if (action === 'back') target = 0;
        if (target === index) return;
        const [element] = this.state.elements.splice(index, 1);
        this.state.elements.splice(target, 0, element);
        this.syncActivePage();
        this.saveHistory();
        this.notify();
        this.saveToStorage();
    }

    generateId() {
        return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generatePageId() {
        return `page_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }

    ensurePageModel() {
        if (!Array.isArray(this.state.pages) || !this.state.pages.length) {
            const page = { id: 'page_home', name: 'Home', slug: 'index', elements: this.state.elements, history: [], historyIndex: -1 };
            this.state.pages = [page];
            this.state.activePageId = page.id;
        }
        let active = this.state.pages.find(page => page.id === this.state.activePageId) || this.state.pages[0];
        active.elements = Array.isArray(active.elements) ? active.elements : [];
        active.history = Array.isArray(active.history) ? active.history : [];
        active.historyIndex = Number.isInteger(active.historyIndex) ? active.historyIndex : active.history.length - 1;
        this.state.activePageId = active.id;
        this.state.elements = active.elements;
        if (active.history.length) { this.state.history = active.history; this.state.historyIndex = active.historyIndex; }
    }

    syncActivePage() {
        const page = this.state.pages.find(item => item.id === this.state.activePageId);
        if (page) page.elements = this.state.elements;
    }

    syncPageHistory() {
        const page = this.state.pages.find(item => item.id === this.state.activePageId);
        if (page) { page.history = this.state.history; page.historyIndex = this.state.historyIndex; }
    }

    addPage(name = 'New Page') {
        this.syncActivePage();
        const base = safeDomId(name.toLowerCase(), 'page');
        let slug = base;
        let suffix = 2;
        while (this.state.pages.some(page => page.slug === slug)) slug = `${base}-${suffix++}`;
        const page = { id: this.generatePageId(), name, slug, elements: [], history: [], historyIndex: -1 };
        this.state.pages.push(page);
        this.state.activePageId = page.id;
        this.state.elements = page.elements;
        this.state.selectedElements = [];
        this.state.history = [];
        this.state.historyIndex = -1;
        this.saveHistory(); this.notify(); this.saveToStorage();
        return page;
    }

    resetProject() {
        const page = { id: 'page_home', name: 'Home', slug: 'index', elements: [], history: [], historyIndex: -1 };
        this.state.pages = [page];
        this.state.activePageId = page.id;
        this.state.elements = page.elements;
        this.state.selectedElements = [];
        this.state.projectName = 'Untitled Project';
        this.state.siteLanguage = 'en';
        this.state.textDirection = 'auto';
        this.state.siteDescription = '';
        this.state.siteKeywords = '';
        this.state.canonicalUrl = '';
        this.state.socialImage = '';
        this.state.siteTheme = 'system';
        this.state.designTokens = this.normalizeDesignTokens();
        this.state.themeColor = '#4d6bff';
        this.state.pageTransition = 'fade';
        this.state.pageTransitionDuration = 450;
        this.state.pageTransitionEasing = 'ease-in-out';
        this.state.pageTransitions = [];
        this.state.history = [];
        this.state.historyIndex = -1;
        this.saveHistory(); this.notify(); this.saveToStorage();
    }

    switchPage(id) {
        if (id === this.state.activePageId) return;
        this.flushHistory();
        this.syncActivePage();
        this.syncPageHistory();
        const page = this.state.pages.find(item => item.id === id);
        if (!page) return;
        this.state.activePageId = page.id;
        this.state.elements = page.elements;
        this.state.selectedElements = [];
        this.state.history = Array.isArray(page.history) ? page.history : [];
        this.state.historyIndex = Number.isInteger(page.historyIndex) ? page.historyIndex : this.state.history.length - 1;
        if (!this.state.history.length) this.saveHistory();
        this.notify(); this.saveToStorage();
    }

    renamePage(id, name) {
        const page = this.state.pages.find(item => item.id === id);
        if (!page) return;
        page.name = name.trim() || 'Untitled Page';
        if (page.slug !== 'index') {
            const base = safeDomId(page.name.toLowerCase(), 'page');
            let slug = base; let suffix = 2;
            while (this.state.pages.some(item => item.id !== id && item.slug === slug)) slug = `${base}-${suffix++}`;
            page.slug = slug;
        }
        this.notify(); this.saveToStorage();
    }

    duplicatePage(id) {
        const source = this.state.pages.find(item => item.id === id);
        if (!source) return;
        const copy = this.addPage(`${source.name} Copy`);
        const idMap = new Map(source.elements.map(item => [item.id, this.generateId()]));
        copy.elements = deepClone(source.elements).map(item => ({ ...item, id: idMap.get(item.id), interactions: (item.interactions || []).map(rule => ({ ...rule, targetId: idMap.get(rule.targetId) || rule.targetId, value: rule.action === 'page' && rule.value === source.id ? copy.id : rule.value })) }));
        this.state.elements = copy.elements;
        this.state.history = []; this.state.historyIndex = -1;
        this.saveHistory(); this.notify(); this.saveToStorage();
    }

    deletePage(id) {
        if (this.state.pages.length <= 1) return false;
        const index = this.state.pages.findIndex(item => item.id === id);
        if (index < 0) return false;
        this.state.pages.splice(index, 1);
        this.state.pageTransitions = (this.state.pageTransitions || []).filter(route => route.fromId !== id && route.toId !== id);
        this.state.pages.forEach(page => page.elements.forEach(element => { element.interactions = (element.interactions || []).filter(rule => !(rule.action === 'page' && rule.value === id)); }));
        if (this.state.activePageId === id) this.switchPage(this.state.pages[Math.max(0, index - 1)].id);
        else { this.notify(); this.saveToStorage(); }
        return true;
    }

    flushHistory() {
        if (this.updateHistoryTimer) this.saveHistory();
    }

    getSerializablePages() {
        return this.state.pages.map(({ id, name, slug, elements }) => ({ id, name, slug, elements }));
    }

    // Local Storage
    saveToStorage(immediate = false) {
        clearTimeout(this.storageSaveTimer);
        if (immediate) return this.persistToStorage();
        this.storageSaveTimer = setTimeout(() => this.persistToStorage(), 500);
    }

    persistToStorage() {
        if (this.lastPersistedRevision === this.documentRevision) return;
        try {
            const data = {
                elements: this.state.elements,
                pages: this.getSerializablePages(),
                activePageId: this.state.activePageId,
                projectName: this.state.projectName,
                siteLanguage: this.state.siteLanguage,
                textDirection: this.state.textDirection,
                siteDescription: this.state.siteDescription,
                siteKeywords: this.state.siteKeywords,
                canonicalUrl: this.state.canonicalUrl,
                socialImage: this.state.socialImage,
                siteTheme: this.state.siteTheme,
                designTokens: this.state.designTokens,
                themeColor: this.state.themeColor,
                pageTransition: this.state.pageTransition,
                pageTransitionDuration: this.state.pageTransitionDuration,
                pageTransitionEasing: this.state.pageTransitionEasing,
                pageTransitions: this.state.pageTransitions,
                pageSize: this.state.activeBreakpoint === 'base' ? this.state.pageSize : (this.state.basePageSize || this.state.pageSize),
                gridVisible: this.state.gridVisible,
                snapEnabled: this.state.snapEnabled,
                lastUpdate: this.state.lastUpdate
            };
            localStorage.setItem('keepthestyle_project', JSON.stringify(data));
            this.lastPersistedRevision = this.documentRevision;
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
            this.lastPersistedRevision = this.documentRevision;
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('keepthestyle_project');
            if (data) {
                const parsed = JSON.parse(data);
                this.state.elements = parsed.elements || [];
                this.state.pages = parsed.pages || [];
                this.state.activePageId = parsed.activePageId || null;
                this.state.hasLoadedProject = true;
                this.state.projectName = parsed.projectName || 'Untitled Project';
                this.state.siteLanguage = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(parsed.siteLanguage || '') ? parsed.siteLanguage : 'en';
                this.state.textDirection = ['auto', 'ltr', 'rtl'].includes(parsed.textDirection) ? parsed.textDirection : 'auto';
                this.state.siteDescription = String(parsed.siteDescription || '').slice(0, 300);
                this.state.siteKeywords = String(parsed.siteKeywords || '').slice(0, 300);
                this.state.canonicalUrl = String(parsed.canonicalUrl || '').slice(0, 500);
                this.state.socialImage = String(parsed.socialImage || '').slice(0, 2000);
                this.state.siteTheme = ['system', 'light', 'dark'].includes(parsed.siteTheme) ? parsed.siteTheme : 'system';
                this.state.designTokens = this.normalizeDesignTokens(parsed.designTokens);
                this.state.themeColor = /^#[0-9a-f]{6}$/i.test(parsed.themeColor || '') ? parsed.themeColor : '#4d6bff';
                this.applyPageTransitionSettings(parsed);
                this.state.pageSize = this.normalizePageSize(parsed.pageSize);
                this.state.basePageSize = { ...this.state.pageSize };
                this.state.activeBreakpoint = 'base';
                this.state.gridVisible = parsed.gridVisible !== false;
                this.state.snapEnabled = parsed.snapEnabled !== false;
                this.saveHistory();
            }
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
        }
    }

    // Export/Import
    exportProject() {
        return {
            elements: this.state.elements,
            pages: this.getSerializablePages(),
            activePageId: this.state.activePageId,
            projectName: this.state.projectName,
            siteLanguage: this.state.siteLanguage,
            textDirection: this.state.textDirection,
            siteDescription: this.state.siteDescription,
            siteKeywords: this.state.siteKeywords,
            canonicalUrl: this.state.canonicalUrl,
            socialImage: this.state.socialImage,
            siteTheme: this.state.siteTheme,
            designTokens: this.state.designTokens,
            themeColor: this.state.themeColor,
            pageTransition: this.state.pageTransition,
            pageTransitionDuration: this.state.pageTransitionDuration,
            pageTransitionEasing: this.state.pageTransitionEasing,
            pageTransitions: this.state.pageTransitions,
            pageSize: this.state.activeBreakpoint === 'base' ? this.state.pageSize : (this.state.basePageSize || this.state.pageSize),
            gridVisible: this.state.gridVisible,
            snapEnabled: this.state.snapEnabled,
            version: '2.0.0'
        };
    }

    importProject(data) {
        try {
            if (!data || (!Array.isArray(data.elements) && !Array.isArray(data.pages))) throw new Error('Invalid project file');
            const usedElementIds = new Set();
            const normalizeElements = items => (Array.isArray(items) ? items : []).map(item => {
                let id = safeDomId(item?.id || this.generateId(), this.generateId());
                while (usedElementIds.has(id)) id = this.generateId();
                usedElementIds.add(id);
                const x = Number(item?.position?.x), y = Number(item?.position?.y);
                const width = Number(item?.size?.width), height = Number(item?.size?.height);
                const attributes = item?.attributes && typeof item.attributes === 'object' && !Array.isArray(item.attributes) ? { ...item.attributes } : {};
                Object.keys(attributes).forEach(key => { if (/^on/i.test(key) || key === 'style') delete attributes[key]; });
                return {
                    ...item,
                    id,
                    tag: /^[a-z][a-z0-9-]*$/i.test(item?.tag || '') ? item.tag.toLowerCase() : 'div',
                    name: String(item?.name || item?.tag || 'Element').slice(0, 100),
                    position: { x: Number.isFinite(x) ? Math.max(0, x) : 100, y: Number.isFinite(y) ? Math.max(0, y) : 100 },
                    size: { width: Number.isFinite(width) ? Math.max(1, width) : 200, height: Number.isFinite(height) ? Math.max(1, height) : 150 },
                    styles: item?.styles && typeof item.styles === 'object' && !Array.isArray(item.styles) ? item.styles : {},
                    responsiveStyles: item?.responsiveStyles && typeof item.responsiveStyles === 'object' && !Array.isArray(item.responsiveStyles) ? {
                        tablet: item.responsiveStyles.tablet && typeof item.responsiveStyles.tablet === 'object' ? item.responsiveStyles.tablet : {},
                        mobile: item.responsiveStyles.mobile && typeof item.responsiveStyles.mobile === 'object' ? item.responsiveStyles.mobile : {}
                    } : {},
                    attributes,
                    interactions: Array.isArray(item?.interactions) ? item.interactions : [],
                    children: Array.isArray(item?.children) ? item.children : []
                };
            });
            const usedPageIds = new Set();
            const usedSlugs = new Set();
            const pageIdMap = new Map();
            this.state.pages = Array.isArray(data.pages) && data.pages.length ? data.pages.map((page, index) => {
                let id = safeDomId(page?.id || this.generatePageId(), this.generatePageId());
                while (usedPageIds.has(id)) id = this.generatePageId();
                usedPageIds.add(id);
                if (page?.id) pageIdMap.set(String(page.id), id);
                const name = String(page?.name || `Page ${index + 1}`).trim().slice(0, 50) || `Page ${index + 1}`;
                let slug = index === 0 ? 'index' : safeDomId(page?.slug || name.toLowerCase(), `page-${index + 1}`);
                const base = slug;
                let suffix = 2;
                while (usedSlugs.has(slug)) slug = `${base}-${suffix++}`;
                usedSlugs.add(slug);
                return { id, name, slug, elements: normalizeElements(page?.elements), history: [], historyIndex: -1 };
            }) : [];
            this.state.pages.forEach(page => page.elements.forEach(element => {
                element.interactions = element.interactions.map(rule => rule?.action === 'page' && pageIdMap.has(String(rule.value)) ? { ...rule, value: pageIdMap.get(String(rule.value)) } : rule);
            }));
            this.state.activePageId = pageIdMap.get(String(data.activePageId)) || this.state.pages[0]?.id || null;
            this.state.elements = this.state.pages.length ? [] : normalizeElements(data.elements);
            this.ensurePageModel();
            this.state.selectedElements = [];
            this.state.projectName = data.projectName || 'Imported Project';
            this.state.siteLanguage = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(data.siteLanguage || '') ? data.siteLanguage : 'en';
            this.state.textDirection = ['auto', 'ltr', 'rtl'].includes(data.textDirection) ? data.textDirection : 'auto';
            this.state.siteDescription = String(data.siteDescription || '').slice(0, 300);
            this.state.siteKeywords = String(data.siteKeywords || '').slice(0, 300);
            this.state.canonicalUrl = String(data.canonicalUrl || '').slice(0, 500);
            this.state.socialImage = String(data.socialImage || '').slice(0, 2000);
            this.state.siteTheme = ['system', 'light', 'dark'].includes(data.siteTheme) ? data.siteTheme : 'system';
            this.state.designTokens = this.normalizeDesignTokens(data.designTokens);
            this.state.themeColor = /^#[0-9a-f]{6}$/i.test(data.themeColor || '') ? data.themeColor : '#4d6bff';
            this.applyPageTransitionSettings({ ...data, pageTransitions: (data.pageTransitions || []).map(route => ({ ...route, fromId: pageIdMap.get(String(route.fromId)) || route.fromId, toId: pageIdMap.get(String(route.toId)) || route.toId })) });
            this.state.pageSize = this.normalizePageSize(data.pageSize);
            this.state.basePageSize = { ...this.state.pageSize };
            this.state.activeBreakpoint = 'base';
            this.state.gridVisible = data.gridVisible !== false;
            this.state.snapEnabled = data.snapEnabled !== false;
            this.state.history = [];
            this.state.historyIndex = -1;
            this.saveHistory();
            this.notify();
            this.saveToStorage();
            return true;
        } catch (e) {
            console.error('Failed to import project:', e);
            return false;
        }
    }

    destroy() {
        clearTimeout(this.updateHistoryTimer);
        clearTimeout(this.storageSaveTimer);
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }

    normalizePageSize(size) {
        const width = Math.round(Number(size?.width));
        const height = Math.round(Number(size?.height));
        return {
            width: Number.isFinite(width) ? Math.min(10000, Math.max(100, width)) : 1920,
            height: Number.isFinite(height) ? Math.min(10000, Math.max(100, height)) : 1080
        };
    }

    normalizeDesignTokens(tokens = {}) {
        const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
        const font = (value, fallback) => String(value || fallback).replace(/[<>"'`;{}]/g, '').trim().slice(0, 80) || fallback;
        return {
            primary: color(tokens.primary, '#4d6bff'), secondary: color(tokens.secondary, '#7b61ff'), accent: color(tokens.accent, '#20c997'),
            surface: color(tokens.surface, '#ffffff'), text: color(tokens.text, '#111827'), muted: color(tokens.muted, '#667085'),
            radius: Math.min(64, Math.max(0, Number(tokens.radius) || 12)), spacing: Math.min(32, Math.max(2, Number(tokens.spacing) || 8)),
            fontBody: font(tokens.fontBody, 'Inter'), fontHeading: font(tokens.fontHeading, 'Inter')
        };
    }

    applyPageTransitionSettings(data = {}) {
        const transitions = ['none', 'fade', 'slide-left', 'slide-right', 'slide-up', 'zoom', 'blur', 'flip'];
        const easings = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'];
        const pageIds = new Set((this.state.pages || []).map(page => page.id));
        this.state.pageTransition = transitions.includes(data.pageTransition) ? data.pageTransition : 'fade';
        this.state.pageTransitionDuration = Math.min(2000, Math.max(100, Math.round(Number(data.pageTransitionDuration) || 450)));
        this.state.pageTransitionEasing = easings.includes(data.pageTransitionEasing) ? data.pageTransitionEasing : 'ease-in-out';
        const routeKeys = new Set();
        this.state.pageTransitions = Array.isArray(data.pageTransitions) ? data.pageTransitions.filter(route => {
            if (!route || !pageIds.has(route.fromId) || !pageIds.has(route.toId) || route.fromId === route.toId) return false;
            const key = `${route.fromId}\u0000${route.toId}`;
            if (routeKeys.has(key)) return false;
            routeKeys.add(key);
            return true;
        }).map(route => ({
            fromId: route.fromId,
            toId: route.toId,
            type: transitions.includes(route.type) ? route.type : this.state.pageTransition,
            exitType: transitions.includes(route.exitType) ? route.exitType : (transitions.includes(route.type) ? route.type : this.state.pageTransition),
            enterType: transitions.includes(route.enterType) ? route.enterType : (transitions.includes(route.type) ? route.type : this.state.pageTransition),
            duration: Math.min(2000, Math.max(100, Math.round(Number(route.duration) || this.state.pageTransitionDuration))),
            easing: easings.includes(route.easing) ? route.easing : this.state.pageTransitionEasing,
            delay: Math.min(1500, Math.max(0, Math.round(Number(route.delay) || 0))),
            distance: Math.min(50, Math.max(2, Number(route.distance) || 8)),
            color: /^#[0-9a-f]{6}$/i.test(route.color || '') ? route.color : '#000000'
        })) : [];
    }
}

// Create singleton instance
const store = new Store();
window.store = store;
