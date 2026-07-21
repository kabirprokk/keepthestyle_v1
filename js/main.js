/**
 * KeepTheStyle - Main Application
 * Initializes all modules and starts the application with real-time support
 */

function createStartupIntro() {
    const app = document.getElementById('app');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = document.createElement('iframe');
    frame.src = 'intro.html';
    frame.title = 'KeepTheStyle introduction';
    frame.setAttribute('aria-label', 'KeepTheStyle introduction');
    frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483646;background:#05060a;opacity:1;transition:opacity 900ms cubic-bezier(.22,1,.36,1);';
    let applicationReady = false;
    let introLoaded = false;
    let closed = false;

    if (app) app.inert = true;
    document.body.appendChild(frame);

    const notifyReady = () => {
        if (applicationReady && introLoaded) frame.contentWindow?.postMessage({ type: 'kts-app-ready' }, '*');
    };

    const close = () => {
        if (closed) return;
        closed = true;
        document.body.classList.remove('intro-active');
        if (app) app.inert = false;
        frame.style.opacity = '0';
        window.setTimeout(() => frame.remove(), reduceMotion ? 140 : 920);
    };

    const onMessage = event => {
        if (event.source !== frame.contentWindow) return;
        if (event.data?.type === 'kts-intro-loaded') {
            introLoaded = true;
            notifyReady();
        } else if (event.data?.type === 'kts-intro-complete') {
            window.removeEventListener('message', onMessage);
            close();
        }
    };
    window.addEventListener('message', onMessage);
    frame.addEventListener('load', () => { introLoaded = true; notifyReady(); }, { once: true });

    return {
        ready() { applicationReady = true; notifyReady(); },
        fail() { applicationReady = true; notifyReady(); }
    };
}

document.addEventListener('DOMContentLoaded', function() {
    const startupIntro = createStartupIntro();
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
        console.log('Version: 2.3.0');
        
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
        startupIntro.ready();
        
    } catch (error) {
        console.error('Failed to initialize KeepTheStyle:', error);
        showToast('Failed to initialize application', 'error', 5000);
        startupIntro.fail();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.store) {
        window.store.saveToStorage(true);
        window.store.destroy();
    }
});
