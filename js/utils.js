/**
 * KeepTheStyle - Utility Functions
 * Shared utilities for the application
 */

// Debounce function for optimizing real-time updates
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for performance optimization
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format CSS value with units
function formatCSSValue(value, defaultUnit = 'px') {
    if (!value) return '';
    if (typeof value === 'number') return value + defaultUnit;
    return value;
}

// Parse CSS value to number
function parseCSSValue(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const match = value.match(/^([0-9.-]+)/);
        return match ? parseFloat(match[1]) : 0;
    }
    return 0;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function toKebabCase(value) {
    return String(value).replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
}

function safeFilename(value, fallback = 'untitled') {
    const clean = String(value || '').trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/[. ]+$/g, '').slice(0, 100);
    return clean || fallback;
}

function safeDomId(value, fallback = 'element') {
    const clean = String(value || '').trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    return clean || fallback;
}

// Deep clone object
function deepClone(obj) {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (e) {
        console.error('Failed to deep clone object:', e);
        return obj;
    }
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 220px;
        right: 20px;
        background: ${type === 'error' ? '#FF4D4F' : type === 'success' ? '#52C41A' : '#4D6BFF'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, duration);
}

function showChoiceDialog(title, message, choices) {
    return new Promise(resolve => {
        const backdrop = document.createElement('div');
        backdrop.className = 'app-dialog-backdrop';
        const dialog = document.createElement('div');
        dialog.className = 'app-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        const heading = document.createElement('h2');
        heading.textContent = title;
        const body = document.createElement('p');
        body.textContent = message;
        const actions = document.createElement('div');
        actions.className = 'app-dialog-actions';
        const close = value => { backdrop.remove(); resolve(value); };
        choices.forEach(choice => {
            const button = document.createElement('button');
            button.textContent = choice.label;
            button.className = `btn ${choice.primary ? 'btn-primary' : ''}`;
            button.addEventListener('click', () => close(choice.value));
            actions.appendChild(button);
        });
        dialog.append(heading, body, actions);
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);
        backdrop.addEventListener('mousedown', e => { if (e.target === backdrop) close(null); });
        dialog.querySelector('button')?.focus();
    });
}
