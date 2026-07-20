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

function createZipBlob(files) {
    const encoder = new TextEncoder();
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let value = n;
        for (let bit = 0; bit < 8; bit++) value = (value & 1) ? (0xEDB88320 ^ (value >>> 1)) : (value >>> 1);
        table[n] = value >>> 0;
    }
    const crc32 = bytes => {
        let crc = 0xFFFFFFFF;
        bytes.forEach(byte => { crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8); });
        return (crc ^ 0xFFFFFFFF) >>> 0;
    };
    const write16 = (view, offset, value) => view.setUint16(offset, value, true);
    const write32 = (view, offset, value) => view.setUint32(offset, value >>> 0, true);
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    files.forEach(file => {
        const name = encoder.encode(file.name.replace(/\\/g, '/'));
        const data = typeof file.content === 'string' ? encoder.encode(file.content) : file.content;
        const crc = crc32(data);
        const local = new Uint8Array(30 + name.length);
        const localView = new DataView(local.buffer);
        write32(localView, 0, 0x04034B50); write16(localView, 4, 20); write16(localView, 6, 0x0800);
        write32(localView, 14, crc); write32(localView, 18, data.length); write32(localView, 22, data.length); write16(localView, 26, name.length);
        local.set(name, 30);
        localParts.push(local, data);

        const central = new Uint8Array(46 + name.length);
        const centralView = new DataView(central.buffer);
        write32(centralView, 0, 0x02014B50); write16(centralView, 4, 20); write16(centralView, 6, 20); write16(centralView, 8, 0x0800);
        write32(centralView, 16, crc); write32(centralView, 20, data.length); write32(centralView, 24, data.length); write16(centralView, 28, name.length); write32(centralView, 42, offset);
        central.set(name, 46);
        centralParts.push(central);
        offset += local.length + data.length;
    });
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    write32(endView, 0, 0x06054B50); write16(endView, 8, files.length); write16(endView, 10, files.length);
    write32(endView, 12, centralSize); write32(endView, 16, offset);
    return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
}

function getInteractionAnimationCSS() {
    return `
.kts-animate { animation-duration: .6s; animation-fill-mode: both; }
.kts-fade-in { animation-name: ktsFadeIn; }
.kts-fade-out { animation-name: ktsFadeOut; }
.kts-slide-up { animation-name: ktsSlideUp; }
.kts-slide-left { animation-name: ktsSlideLeft; }
.kts-slide-down { animation-name: ktsSlideDown; }
.kts-slide-right { animation-name: ktsSlideRight; }
.kts-zoom-in { animation-name: ktsZoomIn; }
.kts-zoom-out { animation-name: ktsZoomOut; }
.kts-bounce { animation-name: ktsBounce; }
.kts-shake { animation-name: ktsShake; }
.kts-pulse { animation-name: ktsPulse; }
.kts-rotate-in { animation-name: ktsRotateIn; }
.kts-flip-in { animation-name: ktsFlipIn; backface-visibility: hidden; }
.kts-swing { animation-name: ktsSwing; transform-origin: top center; }
.kts-float { animation-name: ktsFloat; }
.kts-blur-in { animation-name: ktsBlurIn; }
.kts-flash { animation-name: ktsFlash; }
.kts-heartbeat { animation-name: ktsHeartbeat; }
.kts-roll-in { animation-name: ktsRollIn; }
.kts-skew-in { animation-name: ktsSkewIn; }
.kts-reveal-up { animation-name: ktsRevealUp; }
.kts-wobble { animation-name: ktsWobble; }
@keyframes ktsFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes ktsFadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes ktsSlideUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
@keyframes ktsSlideLeft { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
@keyframes ktsSlideDown { from { opacity: 0; transform: translateY(-28px); } to { opacity: 1; transform: none; } }
@keyframes ktsSlideRight { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: none; } }
@keyframes ktsZoomIn { from { opacity: 0; transform: scale(.82); } to { opacity: 1; transform: none; } }
@keyframes ktsZoomOut { from { opacity: 0; transform: scale(1.18); } to { opacity: 1; transform: none; } }
@keyframes ktsBounce { 0%,20%,50%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-18px); } 60% { transform: translateY(-8px); } }
@keyframes ktsShake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-8px); } 40%,80% { transform: translateX(8px); } }
@keyframes ktsPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes ktsRotateIn { from { opacity: 0; transform: rotate(-12deg) scale(.92); } to { opacity: 1; transform: none; } }
@keyframes ktsFlipIn { from { opacity: 0; transform: perspective(600px) rotateY(75deg); } to { opacity: 1; transform: perspective(600px) rotateY(0); } }
@keyframes ktsSwing { 20% { transform: rotate(8deg); } 40% { transform: rotate(-6deg); } 60% { transform: rotate(3deg); } 80% { transform: rotate(-2deg); } 100% { transform: none; } }
@keyframes ktsFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
@keyframes ktsBlurIn { from { opacity: 0; filter: blur(12px); } to { opacity: 1; filter: blur(0); } }
@keyframes ktsFlash { 0%,50%,100% { opacity: 1; } 25%,75% { opacity: .2; } }
@keyframes ktsHeartbeat { 0%,100% { transform: scale(1); } 14%,42% { transform: scale(1.12); } 28%,70% { transform: scale(1); } }
@keyframes ktsRollIn { from { opacity: 0; transform: translateX(-70px) rotate(-120deg); } to { opacity: 1; transform: none; } }
@keyframes ktsSkewIn { from { opacity: 0; transform: skewX(-18deg) translateX(-24px); } to { opacity: 1; transform: none; } }
@keyframes ktsRevealUp { from { opacity: 0; clip-path: inset(100% 0 0 0); transform: translateY(20px); } to { opacity: 1; clip-path: inset(0); transform: none; } }
@keyframes ktsWobble { 0%,100% { transform: none; } 15% { transform: translateX(-18px) rotate(-4deg); } 30% { transform: translateX(14px) rotate(3deg); } 45% { transform: translateX(-9px) rotate(-2deg); } 60% { transform: translateX(5px) rotate(1deg); } }
@media (prefers-reduced-motion: reduce) { .kts-animate { animation-duration: .01ms !important; } }`.trim();
}

function getElementHoverCSS(elements = []) {
    const allowedEffects = ['glow', 'lift', 'scale', 'tilt', 'brightness', 'blur', 'border-glow'];
    let css = '';
    const motionSelectors = [];
    elements.forEach(element => {
        const hover = element.hover || {};
        if (!allowedEffects.includes(hover.effect)) return;
        const selector = `#${safeDomId(element.attributes?.id || element.id, 'element')}`;
        motionSelectors.push(selector);
        const intensity = Math.min(100, Math.max(1, Number(hover.intensity) || 24));
        const duration = Math.min(2000, Math.max(0, Number(hover.duration) || 220));
        const color = /^#[0-9a-f]{6}$/i.test(hover.color || '') ? hover.color : '#4d6bff';
        const easing = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'].includes(hover.easing) ? hover.easing : 'ease-out';
        const declarations = {
            glow: `box-shadow:0 0 ${intensity}px ${color},0 0 ${Math.round(intensity * 2)}px color-mix(in srgb,${color} 45%,transparent)!important;filter:brightness(${1 + intensity / 250})!important`,
            lift: `transform:translateY(-${Math.max(2, Math.round(intensity / 5))}px)!important;box-shadow:0 ${Math.max(6, Math.round(intensity / 2))}px ${Math.max(12, intensity)}px color-mix(in srgb,${color} 28%,transparent)!important`,
            scale: `transform:scale(${(1 + intensity / 500).toFixed(3)})!important`,
            tilt: `transform:perspective(700px) rotateX(${(intensity / 12).toFixed(1)}deg) rotateY(-${(intensity / 10).toFixed(1)}deg)!important`,
            brightness: `filter:brightness(${(1 + intensity / 150).toFixed(2)}) saturate(${(1 + intensity / 250).toFixed(2)})!important`,
            blur: `filter:blur(${(intensity / 20).toFixed(1)}px)!important`,
            'border-glow': `box-shadow:inset 0 0 0 ${Math.max(1, Math.round(intensity / 20))}px ${color},0 0 ${intensity}px color-mix(in srgb,${color} 55%,transparent)!important`
        };
        css += `${selector}{transition:transform ${duration}ms ${easing},box-shadow ${duration}ms ${easing},filter ${duration}ms ${easing},border-color ${duration}ms ${easing}!important}\n${selector}:hover,${selector}:focus-visible{${declarations[hover.effect]};will-change:transform,filter}\n`;
    });
    if (motionSelectors.length) css += `@media (prefers-reduced-motion:reduce){${motionSelectors.join(',')}{transition-duration:.01ms!important}}\n`;
    return css;
}

// JSON embedded in a <script> must not be able to terminate the script element.
function safeInlineJSON(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function generatePageTransitionRuntime(settings = {}, options = {}) {
    const allowed = ['none', 'fade', 'slide-left', 'slide-right', 'slide-up', 'zoom', 'blur', 'flip'];
    const easingOptions = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'];
    const config = {
        type: allowed.includes(settings.pageTransition) ? settings.pageTransition : 'fade',
        duration: Math.min(2000, Math.max(100, Number(settings.pageTransitionDuration) || 450)),
        easing: easingOptions.includes(settings.pageTransitionEasing) ? settings.pageTransitionEasing : 'ease-in-out',
        color: '#000000',
        preview: Boolean(options.preview),
        currentPageId: options.currentPageId || settings.activePageId || '',
        routes: (settings.pageTransitions || []).map(route => ({ fromId: route.fromId, toId: route.toId, type: allowed.includes(route.type) ? route.type : 'fade', exitType: allowed.includes(route.exitType) ? route.exitType : (allowed.includes(route.type) ? route.type : 'fade'), enterType: allowed.includes(route.enterType) ? route.enterType : (allowed.includes(route.type) ? route.type : 'fade'), duration: Math.min(2000, Math.max(100, Number(route.duration) || 450)), easing: easingOptions.includes(route.easing) ? route.easing : 'ease-in-out', delay: Math.min(1500, Math.max(0, Number(route.delay) || 0)), distance: Math.min(50, Math.max(2, Number(route.distance) || 8)), color: /^#[0-9a-f]{6}$/i.test(route.color || '') ? route.color : '#000000' })),
        destinations: (settings.pages || []).map(page => ({ id: page.id, file: page.slug === 'index' ? 'index.html' : `${page.slug}.html` }))
    };
    return `(function(){
const config=${safeInlineJSON(config)};
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentPageId=config.currentPageId;
window.__ktsSetCurrentPage=id=>{if(id)currentPageId=id};
const transitionFor=(destinationId)=>config.routes.find(route=>route.fromId===currentPageId&&route.toId===destinationId)||config;
const frames=(entering,active)=>{const distance=active.distance||8;const presets={fade:[{opacity:0},{opacity:1}],'slide-left':[{opacity:0,transform:'translateX('+distance+'%)'},{opacity:1,transform:'translateX(0)'}],'slide-right':[{opacity:0,transform:'translateX(-'+distance+'%)'},{opacity:1,transform:'translateX(0)'}],'slide-up':[{opacity:0,transform:'translateY('+distance+'%)'},{opacity:1,transform:'translateY(0)'}],zoom:[{opacity:0,transform:'scale('+(1-distance/100)+')'},{opacity:1,transform:'scale(1)'}],blur:[{opacity:0,filter:'blur('+(distance*1.5)+'px)'},{opacity:1,filter:'blur(0)'}],flip:[{opacity:0,transform:'perspective(900px) rotateY('+(distance*1.25)+'deg)'},{opacity:1,transform:'perspective(900px) rotateY(0)'}],none:[{opacity:1},{opacity:1}]};const effect=entering?(active.enterType||active.type):(active.exitType||active.type);const pair=presets[effect]||presets.fade;return entering?pair:[pair[1],pair[0]]};
let running=false;
window.__ktsRunPageTransition=async function(swap,destinationId){if(running)return;const active=transitionFor(destinationId);if((active.exitType||active.type)==='none'&&(active.enterType||active.type)==='none'||reduced||!Element.prototype.animate){swap();currentPageId=destinationId||currentPageId;return}running=true;const root=config.preview?document.querySelector('.kts-preview-stage'):document.body;const colorHost=config.preview?document.querySelector('.kts-preview-viewport'):document.documentElement;const previousColor=colorHost.style.backgroundColor;colorHost.style.backgroundColor=active.color||'#000000';let swapped=false;const applySwap=()=>{if(!swapped){swapped=true;swap();currentPageId=destinationId||currentPageId}};try{await root.animate(frames(false,active),{duration:active.duration/2,easing:active.easing,fill:'both'}).finished;if(active.delay)await new Promise(resolve=>setTimeout(resolve,active.delay));applySwap();await root.animate(frames(true,active),{duration:active.duration/2,easing:active.easing,fill:'both'}).finished}catch(error){applySwap()}finally{colorHost.style.backgroundColor=previousColor;running=false}};
window.__ktsNavigatePage=function(url,destinationId){if(!url)return;const active=transitionFor(destinationId);try{sessionStorage.setItem('kts-page-enter',JSON.stringify(active))}catch(error){}window.__ktsRunPageTransition(()=>{window.location.href=url},destinationId)};
if(!config.preview){document.addEventListener('click',event=>{if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const link=event.target.closest('a[href]');if(!link||link.target==='_blank'||link.hasAttribute('download'))return;const url=new URL(link.href,location.href);if(url.origin!==location.origin||!url.pathname.toLowerCase().endsWith('.html'))return;const filename=url.pathname.split('/').pop()||'index.html';const destination=config.destinations.find(item=>item.file===filename);event.preventDefault();window.__ktsNavigatePage(link.href,destination?.id)});let enter=null;try{enter=JSON.parse(sessionStorage.getItem('kts-page-enter'));sessionStorage.removeItem('kts-page-enter')}catch(error){}if(enter&&enter.type!=='none'&&!reduced)requestAnimationFrame(()=>{const previous=document.documentElement.style.backgroundColor;document.documentElement.style.backgroundColor=enter.color||'#000000';const animation=document.body.animate(frames(true,enter),{duration:enter.duration/2,easing:enter.easing});animation.finished.finally(()=>{document.documentElement.style.backgroundColor=previous})})}
})();`;
}

if (typeof document !== 'undefined') {
    const editorAnimationStyles = document.createElement('style');
    editorAnimationStyles.id = 'kts-animation-presets';
    editorAnimationStyles.textContent = getInteractionAnimationCSS();
    document.head.appendChild(editorAnimationStyles);
}

function generateInteractionRuntime(elements, pages = []) {
    const rules = [];
    (elements || []).forEach(source => {
        (source.interactions || []).forEach(rule => rules.push({
            sourceId: safeDomId(source.attributes?.id || source.id),
            targetId: safeDomId((elements.find(item => item.id === rule.targetId)?.attributes?.id) || rule.targetId || source.attributes?.id || source.id),
            trigger: rule.trigger || 'click', action: rule.action || 'toggle', value: String(rule.value || ''),
            pageUrl: (() => { const page = pages.find(item => item.id === rule.value); return page ? (page.slug === 'index' ? 'index.html' : `${page.slug}.html`) : ''; })(),
            duration: Math.max(50, Number(rule.duration) || 600), delay: Math.max(0, Number(rule.delay) || 0), repeat: Math.max(1, Number(rule.repeat) || 1), easing: rule.easing || 'ease'
        }));
    });
    const payload = JSON.stringify(rules).replace(/<\//g, '<\\/');
    return `// Generated by KeepTheStyle — visual interactions\n(function () {\n    'use strict';\n    const rules = ${payload};\n    const run = (rule) => {\n        const target = document.getElementById(rule.targetId);\n        if (!target && rule.action !== 'navigate') return;\n        switch (rule.action) {\n            case 'show': target.hidden = false; target.style.visibility = 'visible'; break;\n            case 'hide': target.hidden = true; break;\n            case 'toggle': target.hidden = !target.hidden; if (!target.hidden) target.style.visibility = 'visible'; break;\n            case 'text': target.textContent = rule.value; break;\n            case 'navigate': if (/^(https?:|mailto:|tel:|\/|#)/i.test(rule.value)) window.location.href = rule.value; break;\n            case 'addClass': rule.value.split(/\\s+/).filter(Boolean).forEach(name => target.classList.add(name)); break;\n            case 'removeClass': rule.value.split(/\\s+/).filter(Boolean).forEach(name => target.classList.remove(name)); break;\n            case 'animate': {\n                const name = 'kts-' + (rule.value || 'fade-in');\n                target.classList.remove('kts-animate', name);\n                void target.offsetWidth;\n                target.classList.add('kts-animate', name);\n                target.addEventListener('animationend', () => target.classList.remove('kts-animate', name), { once: true });\n                break;\n            }\n        }\n    };\n    const bind = () => rules.forEach(rule => {\n        if (rule.trigger === 'load') { run(rule); return; }\n        const source = document.getElementById(rule.sourceId);\n        if (source) source.addEventListener(rule.trigger, () => run(rule));\n    });\n    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();\n})();`;
}

function generateSiteRuntime(elements, pages = [], options = {}) {
    const rules = [];
    (elements || []).forEach(source => (source.interactions || []).forEach(rule => {
        const page = pages.find(item => item.id === rule.value);
        rules.push({
            sourceId: safeDomId(source.attributes?.id || source.id),
            targetId: safeDomId((elements.find(item => item.id === rule.targetId)?.attributes?.id) || rule.targetId || source.id),
            trigger: rule.trigger || 'click', action: rule.action || 'toggle', value: String(rule.value || ''),
            pageUrl: page ? ((options.preview || options.singleFile) ? `#${page.id}` : (page.slug === 'index' ? 'index.html' : `${page.slug}.html`)) : '',
            duration: Math.max(50, Number(rule.duration) || 600), delay: Math.max(0, Number(rule.delay) || 0),
            repeat: Math.max(1, Number(rule.repeat) || 1), easing: rule.easing || 'ease'
        });
    }));
    const payload = JSON.stringify(rules).replace(/<\//g, '<\\/');
    return `// Generated by KeepTheStyle — no-code runtime
(function () {
    'use strict';
    const rules = ${payload};
    const run = (rule) => {
        const target = document.getElementById(rule.targetId);
        if (!target && !['navigate', 'page'].includes(rule.action)) return;
        switch (rule.action) {
            case 'show': target.hidden = false; target.style.visibility = 'visible'; break;
            case 'hide': target.hidden = true; break;
            case 'toggle': target.hidden = !target.hidden; if (!target.hidden) target.style.visibility = 'visible'; break;
            case 'text': target.textContent = rule.value; break;
            case 'playMedia': if (typeof target.play === 'function') target.play().catch(() => {}); break;
            case 'pauseMedia': if (typeof target.pause === 'function') target.pause(); break;
            case 'restartMedia': if (typeof target.pause === 'function') { target.currentTime = 0; target.play().catch(() => {}); } break;
            case 'toggleMute': if ('muted' in target) target.muted = !target.muted; break;
            case 'navigate': if (/^(https?:|mailto:|tel:|#)/i.test(rule.value) || rule.value.startsWith('/')) window.location.href = rule.value; break;
            case 'page': if (rule.pageUrl) { if (rule.pageUrl.startsWith('#') && window.__ktsShowPage) window.__ktsShowPage(rule.pageUrl.slice(1)); else if (window.__ktsNavigatePage) window.__ktsNavigatePage(rule.pageUrl,rule.value); else window.location.href = rule.pageUrl; } break;
            case 'addClass': rule.value.split(/\\s+/).filter(Boolean).forEach(name => target.classList.add(name)); break;
            case 'removeClass': rule.value.split(/\\s+/).filter(Boolean).forEach(name => target.classList.remove(name)); break;
            case 'animate': {
                const name = 'kts-' + (rule.value || 'fade-in');
                target.classList.remove('kts-animate', name);
                void target.offsetWidth;
                Object.assign(target.style, { animationDuration: rule.duration + 'ms', animationDelay: rule.delay + 'ms', animationTimingFunction: rule.easing, animationIterationCount: rule.repeat });
                target.classList.add('kts-animate', name);
                target.addEventListener('animationend', () => target.classList.remove('kts-animate', name), { once: true });
                break;
            }
        }
    };
    const bind = () => rules.forEach(rule => {
        if (rule.trigger === 'load') { run(rule); return; }
        const source = document.getElementById(rule.sourceId);
        if (!source) return;
        if (rule.trigger === 'scroll') {
            const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { run(rule); observer.unobserve(source); } }), { threshold: .2 });
            observer.observe(source);
        } else source.addEventListener(rule.trigger, () => run(rule));
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();`;
}

// Backward-compatible alias for projects or extensions using the original helper.
generateInteractionRuntime = generateSiteRuntime;

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
        const onKeyDown = event => { if (event.key === 'Escape') close(null); };
        const close = value => { document.removeEventListener('keydown', onKeyDown); backdrop.remove(); resolve(value); };
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
        document.addEventListener('keydown', onKeyDown);
        backdrop.addEventListener('mousedown', e => { if (e.target === backdrop) close(null); });
        dialog.querySelector('button')?.focus();
    });
}
