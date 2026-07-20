/**
 * KeepTheStyle - Keyboard Shortcuts
 * Manages global keyboard shortcuts
 */

class KeyboardShortcuts {
    constructor() {
        this.store = window.store;
        this.shortcuts = {
            'ctrl+z': 'undo',
            'ctrl+shift+z': 'redo',
            'ctrl+y': 'redo',
            'ctrl+s': 'save',
            'ctrl+o': 'open',
            'ctrl+n': 'new',
            'ctrl+d': 'duplicate',
            'ctrl+c': 'copyElements',
            'ctrl+v': 'pasteElements',
            'delete': 'delete',
            'backspace': 'delete',
            'escape': 'deselect',
            'ctrl+a': 'selectAll',
            'ctrl+g': 'group',
            'ctrl+shift+g': 'ungroup'
        };
        
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleKeyDown(e) {
        // If typing in an input/textarea/contenteditable, ignore edit shortcuts
        const activeEl = document.activeElement;
        const isTyping = activeEl && (
            activeEl.tagName === 'INPUT' || 
            activeEl.tagName === 'TEXTAREA' || 
            activeEl.isContentEditable
        );

        // Build shortcut key string
        const keys = [];
        if (e.ctrlKey || e.metaKey) keys.push('ctrl');
        if (e.shiftKey) keys.push('shift');
        if (e.altKey) keys.push('alt');
        keys.push(e.key.toLowerCase());
        
        const shortcut = keys.join('+');
        const action = this.shortcuts[shortcut];
        
        if (action) {
            // Ignore certain shortcuts if user is typing
            if (isTyping && ['delete', 'backspace', 'ctrl+a', 'ctrl+d', 'ctrl+c', 'ctrl+v', 'ctrl+z', 'ctrl+y', 'ctrl+g', 'ctrl+shift+g'].includes(shortcut)) {
                return;
            }
            e.preventDefault();
            this.executeAction(action);
        }
    }

    executeAction(action) {
        switch(action) {
            case 'undo':
                this.store.undo();
                break;
            case 'redo':
                this.store.redo();
                break;
            case 'save':
                // Trigger save
                document.querySelector('[title="Save"]')?.click();
                break;
            case 'open':
                document.querySelector('[title="Open"]')?.click();
                break;
            case 'new':
                document.querySelector('[title="New Project"]')?.click();
                break;
            case 'duplicate':
                const state = this.store.getState();
                this.store.duplicateElements(state.selectedElements);
                break;
            case 'copyElements':
                this.store.copyElements(this.store.getState().selectedElements);
                break;
            case 'pasteElements':
                this.store.pasteElements();
                break;
            case 'delete':
                const stateDel = this.store.getState();
                this.store.deleteElements(stateDel.selectedElements);
                break;
            case 'deselect':
                this.store.clearSelection();
                break;
            case 'selectAll':
                const stateAll = this.store.getState();
                this.store.selectElements(stateAll.elements.map(element => element.id));
                break;
            case 'group':
                this.store.groupElements();
                break;
            case 'ungroup':
                this.store.ungroupElements();
                break;
        }
    }
}
