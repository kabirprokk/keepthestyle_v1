(function () {
    'use strict';

    const intro = document.getElementById('kts-intro');
    const loader = intro.querySelector('.intro-loader');
    const percent = intro.querySelector('.intro-percent');
    const status = intro.querySelector('.intro-status');
    const actions = intro.querySelector('.intro-actions');
    const start = intro.querySelector('.intro-start');
    const skip = intro.querySelector('.intro-skip');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduceMotion ? 250 : 6400;
    const startedAt = performance.now();
    let parentReady = window.parent === window;
    let finished = false;
    let frameId = 0;

    const setProgress = value => {
        const rounded = Math.max(0, Math.min(100, Math.round(value)));
        document.documentElement.style.setProperty('--intro-progress', `${rounded}%`);
        percent.value = `${rounded}%`;
        status.textContent = rounded < 25 ? 'Preparing your canvas'
            : rounded < 52 ? 'Loading creative tools'
                : rounded < 78 ? 'Composing your workspace'
                    : rounded < 100 ? 'Polishing every detail' : 'Ready to create';
    };

    const revealStart = () => {
        if (finished) return;
        finished = true;
        setProgress(100);
        window.setTimeout(() => {
            loader.classList.add('is-complete');
            actions.classList.add('is-visible');
            start.focus({ preventScroll: true });
        }, reduceMotion ? 20 : 420);
    };

    const tick = now => {
        const elapsed = now - startedAt;
        const timeline = Math.min(1, elapsed / duration);
        // Smoothstep gives the progress bar a soft cinematic acceleration and landing.
        const eased = timeline * timeline * (3 - 2 * timeline);
        setProgress(Math.min(parentReady ? 100 : 96, eased * 100));
        if (parentReady && timeline >= 1) revealStart();
        else frameId = requestAnimationFrame(tick);
    };

    const leave = () => {
        cancelAnimationFrame(frameId);
        intro.classList.add('is-leaving');
        window.parent.postMessage({ type: 'kts-intro-complete' }, window.location.origin === 'null' ? '*' : window.location.origin);
    };

    window.addEventListener('message', event => {
        if (event.source !== window.parent || event.data?.type !== 'kts-app-ready') return;
        parentReady = true;
    });
    start.addEventListener('click', leave);
    skip.addEventListener('click', leave);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') leave(); });
    frameId = requestAnimationFrame(tick);
    window.parent.postMessage({ type: 'kts-intro-loaded' }, '*');
})();
