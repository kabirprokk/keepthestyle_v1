/**
 * KeepTheStyle - Main Application
 * Initializes all modules and starts the application with real-time support
 */

function createStartupIntro() {
    const intro = document.getElementById('kts-intro');
    const app = document.getElementById('app');
    if (!intro) return { ready() {}, fail() {} };

    const progressBar = intro.querySelector('.intro-progress');
    const percent = intro.querySelector('.intro-percent');
    const status = intro.querySelector('.intro-status');
    const skip = intro.querySelector('.intro-skip');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startedAt = performance.now();
    const minimumRunTime = reduceMotion ? 120 : 2800;
    let applicationReady = false;
    let completed = false;
    let frameId = 0;

    if (app) app.inert = true;

    const setProgress = value => {
        const rounded = Math.max(0, Math.min(100, Math.round(value)));
        intro.style.setProperty('--intro-progress', `${rounded}%`);
        if (percent) percent.value = `${rounded}%`;
        if (status) {
            status.textContent = rounded < 34 ? 'Preparing your canvas'
                : rounded < 68 ? 'Loading creative tools'
                    : rounded < 96 ? 'Polishing the workspace' : 'Ready to create';
        }
    };

    const close = () => {
        if (completed) return;
        completed = true;
        cancelAnimationFrame(frameId);
        setProgress(100);
        document.body.classList.remove('intro-active');
        intro.classList.add('is-leaving');
        if (app) app.inert = false;
        const removeDelay = reduceMotion ? 140 : 760;
        window.setTimeout(() => intro.remove(), removeDelay);
    };

    const tick = now => {
        if (completed) return;
        const elapsed = now - startedAt;
        // Ease quickly through real startup work, then hold just below completion.
        const staged = Math.min(96, 96 * (1 - Math.exp(-elapsed / 820)));
        setProgress(staged);
        if (applicationReady && elapsed >= minimumRunTime) close();
        else frameId = requestAnimationFrame(tick);
    };

    skip?.addEventListener('click', close);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !completed) close();
    }, { once: true });
    frameId = requestAnimationFrame(tick);

    return {
        ready() { applicationReady = true; },
        fail() { if (status) status.textContent = 'Opening workspace'; applicationReady = true; }
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
