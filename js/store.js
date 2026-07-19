/**
 * KeepTheStyle - Application State Management
 * Central store for all application data with real-time updates
 */

class Store {
    constructor() {
        this.state = {
            elements: [],
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
            darkMode: false,
            activeTab: 'html',
            projectName: 'Untitled Project',
            isDragging: false,
            hasLoadedProject: false,
            dragOffset: { x: 0, y: 0 },
            selectedTool: 'select',
            lastUpdate: Date.now()
        };

        this.listeners = [];
        this.updateHistoryTimer = null;
        this.init();
    }

    init() {
        // Load from localStorage if available
        this.loadFromStorage();
        
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
    notify() {
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
        const snapshot = JSON.stringify(this.state.elements);
        if (this.state.history[this.state.historyIndex] === snapshot) return;
        this.state.history.push(snapshot);
        this.state.historyIndex = this.state.history.length - 1;
        
        // Limit history size
        if (this.state.history.length > this.state.maxHistory) {
            this.state.history.shift();
            this.state.historyIndex--;
        }
    }

    undo() {
        this.flushHistory();
        if (this.state.historyIndex > 0) {
            this.state.historyIndex--;
            const snapshot = this.state.history[this.state.historyIndex];
            this.state.elements = JSON.parse(snapshot);
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
            this.state.elements = JSON.parse(snapshot);
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
            content: elementData.content || '',
            attributes: elementData.attributes || {},
            children: elementData.children || []
        };
        this.state.elements.push(element);
        this.state.selectedElements = [element.id];
        this.saveHistory();
        this.notify();
        this.saveToStorage();
        return element;
    }

    deleteElement(id) {
        this.state.elements = this.state.elements.filter(el => el.id !== id);
        this.state.selectedElements = this.state.selectedElements.filter(sid => sid !== id);
        this.saveHistory();
        this.notify();
        this.saveToStorage();
    }

    deleteElements(ids) {
        const remove = new Set(ids);
        if (!remove.size) return;
        this.state.elements = this.state.elements.filter(el => !remove.has(el.id));
        this.state.selectedElements = this.state.selectedElements.filter(id => !remove.has(id));
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
            this.updateHistoryTimer = setTimeout(() => this.saveHistory(), 250);
        }
    }

    selectElement(id) {
        if (!this.state.selectedElements.includes(id)) {
            this.state.selectedElements.push(id);
            this.notify();
        }
    }

    deselectElement(id) {
        this.state.selectedElements = this.state.selectedElements.filter(sid => sid !== id);
        this.notify();
    }

    clearSelection() {
        this.state.selectedElements = [];
        this.notify();
    }

    duplicateElement(id) {
        const element = this.state.elements.find(el => el.id === id);
        if (element) {
            const newElement = deepClone({
                ...element,
                id: this.generateId(),
                position: {
                    x: element.position.x + 20,
                    y: element.position.y + 20
                }
            });
            this.state.elements.push(newElement);
            this.state.selectedElements = [newElement.id];
            this.saveHistory();
            this.notify();
            this.saveToStorage();
        }
    }

    duplicateElements(ids) {
        const copies = ids.map(id => this.state.elements.find(el => el.id === id)).filter(Boolean).map(element => deepClone({
            ...element, id: this.generateId(),
            position: { x: (element.position?.x || 0) + 20, y: (element.position?.y || 0) + 20 }
        }));
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
        const copies = this.state.clipboard.map(element => deepClone({ ...element, id: this.generateId(), position: { x: (element.position?.x || 0) + 20, y: (element.position?.y || 0) + 20 } }));
        this.state.clipboard = copies.map(deepClone);
        this.state.elements.push(...copies);
        this.state.selectedElements = copies.map(el => el.id);
        this.saveHistory(); this.notify(); this.saveToStorage();
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
        this.saveHistory();
        this.notify();
        this.saveToStorage();
    }

    generateId() {
        return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    flushHistory() {
        if (this.updateHistoryTimer) this.saveHistory();
    }

    // Local Storage
    saveToStorage() {
        try {
            const data = {
                elements: this.state.elements,
                projectName: this.state.projectName,
                pageSize: this.state.pageSize,
                lastUpdate: this.state.lastUpdate
            };
            localStorage.setItem('keepthestyle_project', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('keepthestyle_project');
            if (data) {
                const parsed = JSON.parse(data);
                this.state.elements = parsed.elements || [];
                this.state.hasLoadedProject = true;
                this.state.projectName = parsed.projectName || 'Untitled Project';
                this.state.pageSize = parsed.pageSize || { width: 1920, height: 1080 };
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
            projectName: this.state.projectName,
            pageSize: this.state.pageSize,
            version: '1.0.0'
        };
    }

    importProject(data) {
        try {
            if (!data || !Array.isArray(data.elements)) throw new Error('Invalid project file');
            this.state.elements = data.elements.map(item => ({
                ...item,
                id: item.id || this.generateId(),
                tag: /^[a-z][a-z0-9-]*$/i.test(item.tag || '') ? item.tag.toLowerCase() : 'div',
                position: item.position || { x: 100, y: 100 },
                size: item.size || { width: 200, height: 150 },
                styles: item.styles || {}, attributes: item.attributes || {}, children: item.children || []
            }));
            this.state.selectedElements = [];
            this.state.projectName = data.projectName || 'Imported Project';
            this.state.pageSize = data.pageSize || { width: 1920, height: 1080 };
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
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

// Create singleton instance
const store = new Store();
window.store = store;
