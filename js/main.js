/**
 * KeepTheStyle - Main Application
 * Initializes all modules and starts the application with real-time support
 */

document.addEventListener('DOMContentLoaded', function() {
    try {
        document.querySelectorAll('button[title]').forEach(button => {
            if (!button.getAttribute('aria-label')) button.setAttribute('aria-label', button.title);
        });
        // Make store globally available
        window.store = window.store || new Store();
        
        // Initialize all managers
        const sidebar = new SidebarManager(document.getElementById('left-sidebar'));
        window.canvasManager = new CanvasManager(document.getElementById('canvas-container'));
        const properties = new PropertiesManager(document.getElementById('right-sidebar'));
        const codePanel = new CodePanel(document.getElementById('code-panel'));
        const toolbar = new ToolbarManager(document.getElementById('toolbar'));
        const shortcuts = new KeyboardShortcuts();
        document.querySelectorAll('button[title]').forEach(button => {
            if (!button.getAttribute('aria-label')) button.setAttribute('aria-label', button.title);
        });
        
        // Expose for debugging
        window.keepTheStyle = {
            store: window.store,
            sidebar,
            canvas: window.canvasManager,
            properties,
            codePanel,
            toolbar,
            shortcuts
        };
        
        console.log('🚀 KeepTheStyle initialized successfully!');
        console.log('Version: 1.4.0');
        
        // Add initial demo elements if canvas is empty
        const state = window.store.getState();
        if (state.elements.length === 0 && !state.hasLoadedProject) {
            // Add a demo heading
            window.store.addElement({
                tag: 'h1',
                position: { x: 100, y: 50 },
                size: { width: 400, height: 80 },
                styles: {
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#000000',
                    margin: '0'
                },
                content: 'Welcome to KeepTheStyle'
            });
            
            // Add a demo paragraph
            window.store.addElement({
                tag: 'p',
                position: { x: 100, y: 150 },
                size: { width: 500, height: 60 },
                styles: {
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#555555',
                    margin: '0'
                },
                content: 'Start building your design by dragging elements from the left sidebar or double-clicking to add them. All changes are saved in real-time.'
            });
            
            // Add a demo button
            window.store.addElement({
                tag: 'button',
                position: { x: 100, y: 240 },
                size: { width: 150, height: 48 },
                styles: {
                    backgroundColor: '#4D6BFF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    padding: '0 20px'
                },
                content: 'Get Started'
            });
        }
        
    } catch (error) {
        console.error('Failed to initialize KeepTheStyle:', error);
        showToast('Failed to initialize application', 'error', 5000);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.store) {
        window.store.saveToStorage(true);
        window.store.destroy();
    }
});
