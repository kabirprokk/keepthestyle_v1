/**
 * KeepTheStyle - Properties Panel
 * Manages the right sidebar with element properties
 */

class PropertiesManager {
    constructor(container) {
        this.container = container;
        this.content = container.querySelector('.properties-content');
        this.store = window.store;
        
        // Flag states for individual side inputs expansion
        this.paddingExpanded = false;
        this.marginExpanded = false;
        this.radiusExpanded = false;
        this.shadowExpanded = false;
        
        this.propertyGroups = this.getPropertyGroups(null);
        this.selectedElement = null;
        this.searchQuery = '';
        try { this.groupState = JSON.parse(localStorage.getItem('keepthestyle_property_groups') || '{}'); }
        catch (_) { this.groupState = {}; }
        this.buildInspectorToolbar();
        
        // Clear selection button binding
        this.clearSelectionBtn = container.querySelector('.clear-selection');
        if (this.clearSelectionBtn) {
            this.clearSelectionBtn.addEventListener('click', () => {
                this.store.clearSelection();
            });
        }
        
        // Subscribe to store changes
        this.store.subscribe(() => this.update());
        
        // Initialize
        this.update();
    }

    buildInspectorToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'inspector-toolbar';
        toolbar.innerHTML = `<div class="inspector-search-wrap"><span class="inspector-search-icon">⌕</span><input class="inspector-search" type="search" placeholder="Search properties" aria-label="Search properties"><button class="inspector-search-clear" title="Clear search">×</button></div><div class="inspector-selection-meta" aria-live="polite"></div>`;
        this.container.insertBefore(toolbar, this.content);
        const input = toolbar.querySelector('.inspector-search');
        const clear = toolbar.querySelector('.inspector-search-clear');
        input.addEventListener('input', () => { this.searchQuery = input.value.trim().toLowerCase(); clear.classList.toggle('visible', !!this.searchQuery); if (this.selectedElement) this.renderProperties(this.selectedElement); });
        clear.addEventListener('click', () => { input.value = ''; this.searchQuery = ''; clear.classList.remove('visible'); input.focus(); if (this.selectedElement) this.renderProperties(this.selectedElement); });
        this.selectionMeta = toolbar.querySelector('.inspector-selection-meta');
    }

    getPropertyGroups(element) {
        const layoutProperties = [];
        
        // Constraints (actual object dimensions live in Position & Size)
        layoutProperties.push(
            { key: 'minWidth', label: 'Min Width', type: 'number', units: ['px', '%', 'em', 'rem', 'auto'], default: 'auto' },
            { key: 'maxWidth', label: 'Max Width', type: 'number', units: ['px', '%', 'em', 'rem', 'auto'], default: 'auto' }
        );

        // Padding (with expansion toggle)
        if (!this.paddingExpanded) {
            layoutProperties.push({ key: 'padding', label: 'Padding', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0', expandable: true, expandedKey: 'paddingExpanded' });
        } else {
            layoutProperties.push(
                { key: 'padding', label: 'Padding (All)', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0', collapsable: true, expandedKey: 'paddingExpanded' },
                { key: 'paddingTop', label: '  Top', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0', isSubOption: true },
                { key: 'paddingRight', label: '  Right', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0', isSubOption: true },
                { key: 'paddingBottom', label: '  Bottom', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0', isSubOption: true },
                { key: 'paddingLeft', label: '  Left', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0', isSubOption: true }
            );
        }

        // Margin (with expansion toggle)
        if (!this.marginExpanded) {
            layoutProperties.push({ key: 'margin', label: 'Margin', type: 'number', units: ['px', '%', 'em', 'rem', 'auto'], default: '0', expandable: true, expandedKey: 'marginExpanded' });
        } else {
            layoutProperties.push(
                { key: 'margin', label: 'Margin (All)', type: 'number', units: ['px', '%', 'em', 'rem', 'auto'], default: '0', collapsable: true, expandedKey: 'marginExpanded' },
                { key: 'marginTop', label: '  Top', type: 'number', units: ['px', '%', 'em', 'rem', 'auto'], default: '0', isSubOption: true },
                { key: 'marginRight', label: '  Right', type: 'number', units: ['px', '%', 'em', 'rem', 'auto'], default: '0', isSubOption: true },
                { key: 'marginBottom', label: '  Bottom', type: 'number', units: ['px', '%', 'em', 'rem', 'auto'], default: '0', isSubOption: true },
                { key: 'marginLeft', label: '  Left', type: 'number', units: ['px', '%', 'em', 'rem', 'auto'], default: '0', isSubOption: true }
            );
        }

        // Spacing gaps, display, position, overflow
        layoutProperties.push(
            { key: 'gap', label: 'Gap', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0' },
            { key: 'display', label: 'Display', type: 'select', options: ['block', 'inline', 'flex', 'grid', 'none'], default: 'block' },
            { key: 'position', label: 'Position', type: 'select', options: ['static', 'relative', 'absolute', 'fixed', 'sticky'], default: 'static' },
            { key: 'overflow', label: 'Overflow', type: 'select', options: ['visible', 'hidden', 'scroll', 'auto'], default: 'visible' }
        );

        const groups = {
            'Element': { expanded: true, properties: [
                { key: 'elementName', label: 'Name', type: 'text', default: '' },
                { key: 'elementId', label: 'HTML ID', type: 'text', default: '' },
                { key: 'className', label: 'Classes', type: 'text', default: '' },
                { key: 'initialVisibility', label: 'On Load', type: 'select', options: ['visible', 'hidden'], default: 'visible' }
            ]},
            'Interactions': { expanded: true, properties: [
                { key: 'interactions', label: 'Interactions', type: 'interactions' }
            ]},
            'Animation & Transition': { expanded: true, properties: [
                { key: 'animationActions', label: 'Preview', type: 'animationActions' },
                { key: 'animationPreset', label: 'Animation', type: 'select', options: ['none', 'fade-in', 'fade-out', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'zoom-in', 'zoom-out', 'rotate-in', 'flip-in', 'blur-in', 'reveal-up', 'roll-in', 'skew-in', 'bounce', 'shake', 'wobble', 'pulse', 'heartbeat', 'flash', 'swing', 'float'], default: 'none' },
                { key: 'animationDuration', label: 'Duration', type: 'number', units: ['ms', 's'], min: 0, step: 50, default: '600ms' },
                { key: 'animationDelay', label: 'Delay', type: 'number', units: ['ms', 's'], min: 0, step: 50, default: '0ms' },
                { key: 'animationTimingFunction', label: 'Easing', type: 'select', options: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'cubic-bezier(.2,.8,.2,1)'], default: 'ease' },
                { key: 'animationIterationCount', label: 'Repeats', type: 'number', min: 1, max: 100, step: 1, default: '1' },
                { key: 'animationDirection', label: 'Direction', type: 'select', options: ['normal', 'reverse', 'alternate', 'alternate-reverse'], default: 'normal' },
                { key: 'animationFillMode', label: 'After Animation', type: 'select', options: ['none', 'forwards', 'backwards', 'both'], default: 'both' },
                { key: 'animationPlayState', label: 'Playback', type: 'select', options: ['running', 'paused'], default: 'running' },
                { key: 'transitionProperty', label: 'Transition Property', type: 'text', default: 'all' },
                { key: 'transitionDuration', label: 'Transition Duration', type: 'number', units: ['ms', 's'], min: 0, step: 50, default: '180ms' },
                { key: 'transitionTimingFunction', label: 'Transition Easing', type: 'select', options: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'cubic-bezier(.2,.8,.2,1)'], default: 'ease' },
                { key: 'transitionDelay', label: 'Transition Delay', type: 'number', units: ['ms', 's'], min: 0, step: 50, default: '0ms' }
            ]},
            'Position & Size': { expanded: true, properties: [
                { key: 'canvasX', label: 'X', type: 'number', units: ['px'], default: '0', min: 0 },
                { key: 'canvasY', label: 'Y', type: 'number', units: ['px'], default: '0', min: 0 },
                { key: 'canvasWidth', label: 'W', type: 'number', units: ['px'], default: '200', min: 1 },
                { key: 'canvasHeight', label: 'H', type: 'number', units: ['px'], default: '150', min: 1 }
            ]},
            'Layout': {
                expanded: true,
                properties: layoutProperties
            }
        };

        // Contextual Flexbox layouts
        if (element) {
            groups['Attributes'] = { expanded: false, properties: this.getAttributeProperties(element) };
            const displayValue = element.styles.display || 'block';
            if (displayValue === 'flex') {
                groups['Flexbox'] = {
                    expanded: true,
                    properties: [
                        { key: 'flexDirection', label: 'Direction', type: 'select', options: ['row', 'column', 'row-reverse', 'column-reverse'], default: 'row' },
                        { key: 'justifyContent', label: 'Justify', type: 'select', options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'], default: 'flex-start' },
                        { key: 'alignItems', label: 'Align', type: 'select', options: ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'], default: 'stretch' },
                        { key: 'flexWrap', label: 'Wrap', type: 'select', options: ['nowrap', 'wrap', 'wrap-reverse'], default: 'nowrap' }
                    ]
                };
            }

            // Contextual Grid layouts
            if (displayValue === 'grid') {
                groups['Grid'] = {
                    expanded: true,
                    properties: [
                        { key: 'gridTemplateColumns', label: 'Columns', type: 'text', default: '1fr 1fr' },
                        { key: 'gridTemplateRows', label: 'Rows', type: 'text', default: 'auto' },
                        { key: 'columnGap', label: 'Col Gap', type: 'number', units: ['px', '%', 'em', 'rem'], default: '10px' },
                        { key: 'rowGap', label: 'Row Gap', type: 'number', units: ['px', '%', 'em', 'rem'], default: '10px' }
                    ]
                };
            }

            // Contextual Placement offsets
            const positionValue = element.styles.position || 'static';
            if (positionValue !== 'static') {
                groups['Placement'] = {
                    expanded: true,
                    properties: [
                        { key: 'top', label: 'Top', type: 'number', units: ['px', '%', 'em', 'rem', 'auto'], default: 'auto' },
                        { key: 'left', label: 'Left', type: 'number', units: ['px', '%', 'em', 'rem', 'auto'], default: 'auto' },
                        { key: 'right', label: 'Right', type: 'number', units: ['px', '%', 'em', 'rem', 'auto'], default: 'auto' },
                        { key: 'bottom', label: 'Bottom', type: 'number', units: ['px', '%', 'em', 'rem', 'auto'], default: 'auto' },
                        { key: 'zIndex', label: 'Z-Index', type: 'number', default: 'auto' }
                    ]
                };
            }
        }

        // Standard typography, background, borders, and effects
        groups['Typography'] = {
            expanded: true,
            properties: [
                { key: 'fontFamily', label: 'Font Family', type: 'select', options: ['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Montserrat', 'DM Sans', 'Nunito', 'Raleway', 'Rubik', 'Source Sans 3', 'Oswald', 'Bebas Neue', 'Playfair Display', 'Lora', 'Merriweather', 'JetBrains Mono', 'sans-serif', 'serif', 'monospace'], default: 'Inter' },
                { key: 'fontSize', label: 'Font Size', type: 'number', units: ['px', 'em', 'rem', '%'], default: '16' },
                { key: 'fontWeight', label: 'Font Weight', type: 'number', min: 100, max: 900, step: 100, default: '400' },
                { key: 'lineHeight', label: 'Line Height', type: 'number', min: 1, max: 3, step: 0.1, default: '1.5' },
                { key: 'letterSpacing', label: 'Letter Spacing', type: 'number', units: ['px', 'em', 'rem'], default: '0' },
                { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right', 'justify'], default: 'left' },
                { key: 'textDecoration', label: 'Decoration', type: 'select', options: ['none', 'underline', 'line-through', 'overline'], default: 'none' },
                { key: 'textTransform', label: 'Transform', type: 'select', options: ['none', 'uppercase', 'lowercase', 'capitalize'], default: 'none' },
                { key: 'color', label: 'Color', type: 'color', default: '#000000' },
                { key: 'textShadow', label: 'Text Shadow', type: 'text', default: 'none' }
            ]
        };

        groups['Background'] = {
            expanded: true,
            properties: [
                { key: 'backgroundColor', label: 'Background Color', type: 'color', default: '#FFFFFF' },
                { key: 'backgroundImage', label: 'Image / Gradient', type: 'text', default: 'none' },
                { key: 'backgroundRepeat', label: 'Repeat', type: 'select', options: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y'], default: 'repeat' },
                { key: 'backgroundPosition', label: 'Position', type: 'text', default: '0% 0%' },
                { key: 'backgroundSize', label: 'Size', type: 'text', default: 'auto' },
                { key: 'opacity', label: 'Opacity', type: 'number', min: 0, max: 1, step: 0.01, default: '1' }
            ]
        };

        const borderProperties = [];
        if (!this.radiusExpanded) {
            borderProperties.push({ key: 'borderRadius', label: 'Radius', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0', expandable: true, expandedKey: 'radiusExpanded' });
        } else {
            borderProperties.push(
                { key: 'borderRadius', label: 'Radius (All)', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0', collapsable: true, expandedKey: 'radiusExpanded' },
                { key: 'borderTopLeftRadius', label: '  Top Left', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0', isSubOption: true },
                { key: 'borderTopRightRadius', label: '  Top Right', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0', isSubOption: true },
                { key: 'borderBottomRightRadius', label: '  Bottom Right', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0', isSubOption: true },
                { key: 'borderBottomLeftRadius', label: '  Bottom Left', type: 'number', units: ['px', '%', 'em', 'rem'], default: '0', isSubOption: true }
            );
        }
        
        borderProperties.push(
            { key: 'borderWidth', label: 'Width', type: 'number', units: ['px', 'em', 'rem'], default: '1' },
            { key: 'borderColor', label: 'Color', type: 'color', default: '#E8E8E8' },
            { key: 'borderStyle', label: 'Style', type: 'select', options: ['none', 'solid', 'dashed', 'dotted', 'double'], default: 'solid' }
            ,{ key: 'outline', label: 'Outline', type: 'text', default: 'none' }
        );

        groups['Border'] = {
            expanded: false,
            properties: borderProperties
        };

        const effectProperties = [];
        if (!this.shadowExpanded) {
            effectProperties.push({ key: 'boxShadow', label: 'Box Shadow', type: 'text', default: 'none', expandable: true, expandedKey: 'shadowExpanded' });
        } else {
            effectProperties.push(
                { key: 'boxShadow', label: 'Shadow (All)', type: 'text', default: 'none', collapsable: true, expandedKey: 'shadowExpanded' },
                { key: 'shadowType', label: '  Type', type: 'select', options: ['none', 'outset', 'inset'], default: 'none', isSubOption: true },
                { key: 'shadowX', label: '  X Offset', type: 'number', units: ['px'], default: '0', isSubOption: true },
                { key: 'shadowY', label: '  Y Offset', type: 'number', units: ['px'], default: '0', isSubOption: true },
                { key: 'shadowBlur', label: '  Blur', type: 'number', units: ['px'], default: '0', isSubOption: true },
                { key: 'shadowSpread', label: '  Spread', type: 'number', units: ['px'], default: '0', isSubOption: true },
                { key: 'shadowColor', label: '  Color', type: 'color', default: '#000000', isSubOption: true }
            );
        }
        
        effectProperties.push(
            { key: 'filter', label: 'Filter', type: 'text', default: 'none' },
            { key: 'backdropFilter', label: 'Backdrop Filter', type: 'text', default: 'none' },
            { key: 'mixBlendMode', label: 'Mix Blend', type: 'select', options: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'], default: 'normal' },
            { key: 'transform', label: 'Transform', type: 'text', default: 'none' },
            { key: 'transformOrigin', label: 'Transform Origin', type: 'text', default: 'center center' },
            { key: 'clipPath', label: 'Clip Path', type: 'text', default: 'none' },
            { key: 'perspective', label: 'Perspective', type: 'number', units: ['px'], default: 'none' },
            { key: 'isolation', label: 'Isolation', type: 'select', options: ['auto', 'isolate'], default: 'auto' }
        );

        groups['Effects'] = {
            expanded: false,
            properties: effectProperties
        };

        groups['Advanced'] = {
            expanded: false,
            properties: [
                { key: 'cursor', label: 'Cursor', type: 'select', options: ['auto', 'pointer', 'grab', 'text', 'move', 'default', 'not-allowed'], default: 'auto' },
                { key: 'pointerEvents', label: 'Pointer Events', type: 'select', options: ['auto', 'none'], default: 'auto' },
                { key: 'visibility', label: 'Visibility', type: 'select', options: ['visible', 'hidden'], default: 'visible' },
                { key: 'customCSS', label: 'Custom CSS', type: 'textarea', default: '' }
            ]
        };

        if (element) {
            const textTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'button', 'a', 'label', 'section', 'article', 'header', 'footer'];
            if (textTags.includes(element.tag)) {
                groups['Content'] = {
                    expanded: true,
                    properties: [
                        { key: 'content', label: 'Text Content', type: 'textarea', default: '' }
                    ]
                };
            }
            if (['img', 'video', 'iframe'].includes(element.tag)) {
                groups['Media'] = {
                    expanded: true,
                    properties: [
                        { key: 'objectFit', label: 'Fit', type: 'select', options: ['cover', 'contain', 'fill', 'none', 'scale-down'], default: 'cover' },
                        { key: 'objectPosition', label: 'Position', type: 'text', default: 'center center' },
                        { key: 'aspectRatio', label: 'Aspect Ratio', type: 'text', default: 'auto' }
                    ]
                };
            }
        }

        return groups;
    }

    getAttributeProperties(element) {
        const common = [{ key: 'attr:title', label: 'Title', type: 'text', default: '' }, { key: 'attr:aria-label', label: 'ARIA Label', type: 'text', default: '' }];
        const byTag = {
            a: [{ key: 'attr:href', label: 'URL', type: 'text', default: '#' }, { key: 'attr:target', label: 'Target', type: 'select', options: ['_self', '_blank'], default: '_self' }, { key: 'attr:rel', label: 'Relationship', type: 'text', default: 'noopener noreferrer' }, { key: 'attr:download', label: 'Download Filename', type: 'text', default: '' }],
            img: [{ key: 'attr:src', label: 'Source', type: 'text', default: '' }, { key: 'attr:alt', label: 'Alt Text', type: 'text', default: '' }, { key: 'attr:loading', label: 'Loading', type: 'select', options: ['lazy', 'eager'], default: 'lazy' }, { key: 'attr:decoding', label: 'Decoding', type: 'select', options: ['async', 'sync', 'auto'], default: 'async' }],
            video: [
                { key: 'attr:src', label: 'Video Source', type: 'text', default: '' }, { key: 'attr:poster', label: 'Poster Image', type: 'text', default: '' },
                { key: 'videoPlayback', label: 'Playback', type: 'select', options: ['play', 'stop'], default: 'play' },
                { key: 'videoControls', label: 'Player Controls', type: 'select', options: ['hidden', 'visible'], default: 'hidden' },
                { key: 'videoLoop', label: 'Loop', type: 'select', options: ['on', 'off'], default: 'on' },
                { key: 'videoMuted', label: 'Sound', type: 'select', options: ['muted', 'on'], default: 'muted' }
            ],
            audio: [
                { key: 'attr:src', label: 'Audio Source', type: 'text', default: '' },
                { key: 'videoPlayback', label: 'Playback', type: 'select', options: ['play', 'stop'], default: 'stop' },
                { key: 'videoControls', label: 'Player Controls', type: 'select', options: ['hidden', 'visible'], default: 'visible' },
                { key: 'videoLoop', label: 'Loop', type: 'select', options: ['on', 'off'], default: 'off' },
                { key: 'videoMuted', label: 'Sound', type: 'select', options: ['muted', 'on'], default: 'on' }
            ],
            input: [{ key: 'attr:type', label: 'Type', type: 'select', options: ['text', 'email', 'number', 'password', 'checkbox', 'radio', 'date'], default: 'text' }, { key: 'attr:placeholder', label: 'Placeholder', type: 'text', default: '' }],
            button: [{ key: 'attr:type', label: 'Type', type: 'select', options: ['button', 'submit', 'reset'], default: 'button' }],
            iframe: [{ key: 'attr:src', label: 'Embed Source', type: 'text', default: 'about:blank' }]
        };
        const base = common.concat(byTag[element.tag] || []);
        const known = new Set(base.map(p => p.key.slice(5)));
        if (['video', 'audio'].includes(element.tag)) ['autoplay', 'controls', 'loop', 'muted', 'playsinline', 'preload'].forEach(key => known.add(key));
        const custom = Object.keys(element.attributes || {}).filter(key => !known.has(key) && key !== 'id' && key !== 'class').map(key => ({ key: `attr:${key}`, label: key, type: 'text', default: '' }));
        return base.concat(custom);
    }

    update() {
        const state = this.store.getState();
        const selectedIds = state.selectedElements;
        
        if (selectedIds.length === 0) {
            this.selectedElement = null;
            if (this.selectionMeta) this.selectionMeta.textContent = 'Nothing selected';
            this.content.innerHTML = '<div class="no-selection">Select an element to edit its properties</div>';
            return;
        }
        
        const id = selectedIds[0];
        const element = state.elements.find(el => el.id === id);
        
        if (!element) {
            this.selectedElement = null;
            this.content.innerHTML = '<div class="no-selection">Element not found</div>';
            return;
        }
        if (this.selectionMeta) this.selectionMeta.textContent = selectedIds.length > 1 ? `${selectedIds.length} elements selected · editing all` : `<${element.tag}> · ${element.id.slice(-6)}`;

        // Dynamically get property groups (incorporates tag-specific groups like Content)
        const newGroups = this.getPropertyGroups(element);
        
        // Check if group structure or property keys changed
        const currentProps = Object.values(this.propertyGroups).map(g => g.properties.map(p => p.key).join('-')).join('|');
        const newProps = Object.values(newGroups).map(g => g.properties.map(p => p.key).join('-')).join('|');
        
        this.propertyGroups = newGroups;
        
        // If selection changed or the group structure/property layout changed, do a full render
        if (!this.selectedElement || this.selectedElement.id !== element.id || currentProps !== newProps) {
            this.selectedElement = element;
            this.renderProperties(element);
        } else {
            // Update input values in-place so we don't destroy focus or break dragging
            this.selectedElement = element;
            this.updateInputValues(element);
        }
    }

    updateInputValues(element) {
        Object.entries(this.propertyGroups).forEach(([groupName, group]) => {
            if (!group.expanded) return;
            
            group.properties.forEach(prop => {
                let value;
                if (prop.key === 'content') {
                    value = element.content;
                } else if (this.isMetaProperty(prop.key)) {
                    value = this.getMetaValue(prop.key, element, prop.default);
                } else if (prop.key.startsWith('shadow')) {
                    const shadowVal = element.styles['boxShadow'] || 'none';
                    const parsedShadow = this.parseBoxShadow(shadowVal);
                    if (prop.key === 'shadowType') value = parsedShadow.type;
                    else if (prop.key === 'shadowX') value = parsedShadow.x + 'px';
                    else if (prop.key === 'shadowY') value = parsedShadow.y + 'px';
                    else if (prop.key === 'shadowBlur') value = parsedShadow.blur + 'px';
                    else if (prop.key === 'shadowSpread') value = parsedShadow.spread + 'px';
                    else if (prop.key === 'shadowColor') value = parsedShadow.color;
                } else {
                    value = element.styles[prop.key] ?? prop.default;
                }
                
                const selector = `[data-key="${prop.key}"]`;
                const inputs = this.content.querySelectorAll(selector);
                
                inputs.forEach(input => {
                    if (prop.type === 'number') {
                        const parsed = this.parseCSSValueAndUnit(value, prop.units ? 'px' : '');
                        
                        if (document.activeElement !== input) {
                            input.value = parsed.value;
                            if (parsed.unit === 'auto') {
                                input.disabled = true;
                                input.style.opacity = '0.5';
                            } else {
                                input.disabled = false;
                                input.style.opacity = '1';
                            }
                        }
                        
                        // Sync unit select sibling
                        const wrapper = input.parentElement;
                        if (wrapper) {
                            const unitSelect = wrapper.querySelector('.property-unit-select');
                            if (unitSelect && document.activeElement !== unitSelect) {
                                unitSelect.value = parsed.unit;
                            }
                            
                            const slider = wrapper.querySelector('.property-slider');
                            if (slider && document.activeElement !== slider) {
                                if (parsed.unit === 'auto') {
                                    slider.style.display = 'none';
                                } else {
                                    slider.style.display = 'block';
                                    this.configureSliderBounds(slider, prop, parsed.unit);
                                    slider.value = parsed.value !== '' ? parsed.value : 0;
                                }
                            }
                        }
                    } else if (prop.type === 'color') {
                        if (input.classList.contains('property-text')) {
                            if (document.activeElement !== input) {
                                input.value = value || '';
                            }
                            // Find the color picker sibling
                            const wrapper = input.parentElement;
                            if (wrapper) {
                                const picker = wrapper.querySelector('.property-color');
                                if (picker && document.activeElement !== picker) {
                                    picker.value = this.convertToHex(value) || '#000000';
                                }
                            }
                        }
                    } else {
                        if (document.activeElement !== input) {
                            input.value = value || '';
                        }
                    }
                });
            });
        });
    }

    renderProperties(element) {
        this.content.innerHTML = '';
        
        Object.entries(this.propertyGroups).forEach(([groupName, group]) => {
            if (this.groupState[groupName] !== undefined) group.expanded = this.groupState[groupName];
            const visibleProperties = group.properties.filter(prop => !this.searchQuery || `${groupName} ${prop.label} ${prop.key}`.toLowerCase().includes(this.searchQuery));
            if (this.searchQuery && visibleProperties.length === 0) return;
            if (this.searchQuery) group.expanded = true;
            const groupDiv = document.createElement('div');
            groupDiv.className = 'property-group';
            
            // Header
            const header = document.createElement('div');
            header.className = 'property-group-header';
            header.innerHTML = `
                <span class="property-group-title">${groupName}</span>
                <span class="property-group-toggle">${group.expanded ? '−' : '+'}</span>
            `;
            header.addEventListener('click', () => {
                group.expanded = !group.expanded;
                this.groupState[groupName] = group.expanded;
                localStorage.setItem('keepthestyle_property_groups', JSON.stringify(this.groupState));
                this.renderProperties(element);
            });
            
            groupDiv.appendChild(header);
            
            // Content
            if (group.expanded) {
                const content = document.createElement('div');
                content.className = 'property-group-content';
                
                visibleProperties.forEach(prop => {
                    const control = prop.type === 'interactions' ? this.createInteractionsEditor(element) : prop.type === 'animationActions' ? this.createAnimationActions(element) : this.createPropertyControl(prop, element);
                    content.appendChild(control);
                });
                
                groupDiv.appendChild(content);
            }
            
            this.content.appendChild(groupDiv);
        });
        if (!this.content.children.length) this.content.innerHTML = '<div class="no-selection">No matching properties</div>';
    }

    createAnimationActions(element) {
        const wrapper = document.createElement('div');
        wrapper.className = 'animation-actions';
        const replay = document.createElement('button');
        replay.className = 'btn btn-primary'; replay.textContent = 'Replay'; replay.title = 'Restart animation on the canvas';
        replay.addEventListener('click', () => {
            const node = [...(window.canvasManager?.canvasPage.querySelectorAll('[data-id]') || [])].find(item => item.dataset.id === element.id);
            const name = element.styles?.animationName;
            if (!node || !name) { showToast('Choose an animation preset first', 'error'); return; }
            node.style.animationName = 'none';
            void node.offsetWidth;
            node.style.animationName = name;
            node.style.animationPlayState = 'running';
        });
        const toggle = document.createElement('button');
        const paused = element.styles?.animationPlayState === 'paused';
        toggle.className = 'btn'; toggle.textContent = paused ? 'Resume' : 'Pause';
        toggle.addEventListener('click', () => this.store.updateElement(element.id, { styles: { ...element.styles, animationPlayState: paused ? 'running' : 'paused' } }));
        const clear = document.createElement('button');
        clear.className = 'btn'; clear.textContent = 'Clear';
        clear.addEventListener('click', () => {
            const styles = { ...element.styles };
            ['animationName', 'animationDuration', 'animationDelay', 'animationTimingFunction', 'animationIterationCount', 'animationDirection', 'animationFillMode', 'animationPlayState'].forEach(key => delete styles[key]);
            this.store.updateElement(element.id, { styles });
        });
        wrapper.append(replay, toggle, clear);
        return wrapper;
    }

    createPropertyControl(propConfig, element) {
        const div = document.createElement('div');
        div.className = 'property-control';
        if (propConfig.isSubOption) {
            div.style.paddingLeft = '16px'; // Indent sub-options
            div.style.opacity = '0.85';
        }
        
        const labelWrapper = document.createElement('div');
        labelWrapper.className = 'property-label-wrapper';
        labelWrapper.style.display = 'flex';
        labelWrapper.style.alignItems = 'center';
        labelWrapper.style.justifyContent = 'space-between';
        labelWrapper.style.minWidth = '80px';
        
        const label = document.createElement('label');
        label.className = 'property-label';
        label.textContent = propConfig.label;
        labelWrapper.appendChild(label);

        if (!propConfig.isSubOption && !['elementName', 'canvasX', 'canvasY', 'canvasWidth', 'canvasHeight'].includes(propConfig.key)) {
            const reset = document.createElement('button');
            reset.className = 'property-reset';
            reset.textContent = '↺';
            reset.title = `Reset ${propConfig.label}`;
            reset.addEventListener('click', e => { e.stopPropagation(); this.resetProperty(propConfig, element); });
            labelWrapper.appendChild(reset);
        }
        
        // Expand/Collapse buttons for Spacing & Borders
        if (propConfig.expandable) {
            const btn = document.createElement('button');
            btn.className = 'spacing-toggle-btn';
            btn.innerHTML = '⊞';
            btn.title = 'Individual Sides';
            btn.style.cssText = 'background:transparent; border:none; color:var(--color-dark-gray); cursor:pointer; font-size:11px; margin-left:4px; padding:0;';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this[propConfig.expandedKey] = true;
                this.update();
            });
            labelWrapper.appendChild(btn);
        } else if (propConfig.collapsable) {
            const btn = document.createElement('button');
            btn.className = 'spacing-toggle-btn';
            btn.innerHTML = '⊟';
            btn.title = 'Link All Sides';
            btn.style.cssText = 'background:transparent; border:none; color:var(--color-accent); cursor:pointer; font-size:11px; margin-left:4px; padding:0;';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Clear individual side/corner values to avoid style pollution
                const sideKeys = propConfig.expandedKey === 'paddingExpanded' 
                    ? ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']
                    : propConfig.expandedKey === 'marginExpanded'
                        ? ['marginTop', 'marginRight', 'marginBottom', 'marginLeft']
                        : propConfig.expandedKey === 'radiusExpanded'
                            ? ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius']
                            : ['shadowType', 'shadowX', 'shadowY', 'shadowBlur', 'shadowSpread', 'shadowColor'];
                    
                const styles = { ...element.styles };
                sideKeys.forEach(k => delete styles[k]);
                
                // If re-linking shadow, also revert boxShadow to none
                if (propConfig.expandedKey === 'shadowExpanded') {
                    styles.boxShadow = 'none';
                }
                
                this.store.updateElement(element.id, { styles });
                this[propConfig.expandedKey] = false;
                this.update();
            });
            labelWrapper.appendChild(btn);
        }
        
        const input = this.createInput(propConfig, element);
        
        div.appendChild(labelWrapper);
        div.appendChild(input);
        
        return div;
    }

    createInteractionsEditor(element) {
        const wrapper = document.createElement('div');
        wrapper.className = 'interactions-editor';
        const interactions = Array.isArray(element.interactions) ? element.interactions : [];
        if (!interactions.length) {
            const empty = document.createElement('div');
            empty.className = 'interactions-empty';
            empty.innerHTML = '<strong>No interactions yet</strong><span>Add a trigger to make this element interactive.</span>';
            wrapper.appendChild(empty);
        }
        interactions.forEach((interaction, index) => wrapper.appendChild(this.createInteractionCard(element, interaction, index)));
        const add = document.createElement('button');
        add.className = 'interaction-add';
        add.innerHTML = '<span>＋</span> Add interaction';
        add.addEventListener('click', () => {
            const next = interactions.concat({ trigger: 'click', action: 'toggle', targetId: element.id, value: '' });
            this.store.updateElement(element.id, { interactions: next });
            this.selectedElement = null;
            this.update();
        });
        wrapper.appendChild(add);
        const hint = document.createElement('div');
        hint.className = 'interaction-hint';
        hint.innerHTML = '<span>▶</span><span>Use <strong>Preview</strong> in the top bar to test behaviors.</span>';
        wrapper.appendChild(hint);
        return wrapper;
    }

    createInteractionCard(element, interaction, index) {
        const card = document.createElement('div');
        card.className = 'interaction-card';
        const heading = document.createElement('div');
        heading.className = 'interaction-card-heading';
        heading.innerHTML = `<span class="interaction-number">${index + 1}</span><strong>When → Do</strong>`;
        const remove = document.createElement('button');
        remove.className = 'interaction-remove';
        remove.title = 'Remove interaction';
        remove.textContent = '×';
        remove.addEventListener('click', () => {
            const next = (element.interactions || []).filter((_, itemIndex) => itemIndex !== index);
            this.store.updateElement(element.id, { interactions: next });
            this.selectedElement = null;
            this.update();
        });
        heading.appendChild(remove);
        card.appendChild(heading);

        const trigger = this.createInteractionSelect('Trigger', interaction.trigger || 'click', [
            ['click', 'Click'], ['dblclick', 'Double click'], ['mouseenter', 'Mouse enters'], ['mouseleave', 'Mouse leaves'], ['focus', 'Receives focus'], ['blur', 'Loses focus'], ['input', 'Input changes'], ['change', 'Value commits'], ['ended', 'Media finishes'], ['scroll', 'Scrolls into view'], ['load', 'Page loads']
        ], value => this.updateInteraction(element, index, { trigger: value }));
        const action = this.createInteractionSelect('Action', interaction.action || 'toggle', [
            ['show', 'Show element'], ['hide', 'Hide element'], ['toggle', 'Toggle visibility'], ['text', 'Change text'],
            ['navigate', 'Open link'], ['page', 'Go to page'], ['animate', 'Play animation'], ['playMedia', 'Play media'], ['pauseMedia', 'Pause media'], ['restartMedia', 'Restart media'], ['toggleMute', 'Toggle sound'], ['addClass', 'Add CSS class'], ['removeClass', 'Remove CSS class']
        ], value => this.updateInteraction(element, index, { action: value, value: value === 'page' ? (this.store.getState().pages[0]?.id || '') : value === 'animate' ? 'fade-in' : '' }));
        card.append(trigger, action);

        if (!['navigate', 'page'].includes(interaction.action)) {
            const targets = this.store.getState().elements.map(item => [item.id, `${item.name || item.tag} · ${item.id.slice(-5)}`]);
            card.appendChild(this.createInteractionSelect('Target', interaction.targetId || element.id, targets, value => this.updateInteraction(element, index, { targetId: value })));
        }

        const valueLabels = { text: 'New text', navigate: 'URL', page: 'Destination', animate: 'Animation', addClass: 'Class name', removeClass: 'Class name' };
        if (valueLabels[interaction.action]) {
            if (interaction.action === 'page') {
                card.appendChild(this.createInteractionSelect('Destination', interaction.value || this.store.getState().pages[0]?.id, this.store.getState().pages.map(page => [page.id, page.name]), value => this.updateInteraction(element, index, { value })));
            } else if (interaction.action === 'animate') {
                card.appendChild(this.createInteractionSelect('Animation', interaction.value || 'fade-in', [
                    ['fade-in', 'Fade in'], ['fade-out', 'Fade out'], ['slide-up', 'Slide up'], ['slide-down', 'Slide down'], ['slide-left', 'Slide left'], ['slide-right', 'Slide right'], ['zoom-in', 'Zoom in'], ['zoom-out', 'Zoom out'], ['rotate-in', 'Rotate in'], ['flip-in', 'Flip in'], ['blur-in', 'Blur in'], ['reveal-up', 'Reveal up'], ['roll-in', 'Roll in'], ['skew-in', 'Skew in'], ['bounce', 'Bounce'], ['shake', 'Shake'], ['wobble', 'Wobble'], ['pulse', 'Pulse'], ['heartbeat', 'Heartbeat'], ['flash', 'Flash'], ['swing', 'Swing'], ['float', 'Float']
                ], value => this.updateInteraction(element, index, { value })));
                card.appendChild(this.createInteractionSelect('Easing', interaction.easing || 'ease', [['ease', 'Smooth'], ['ease-in', 'Ease in'], ['ease-out', 'Ease out'], ['ease-in-out', 'Ease in/out'], ['linear', 'Linear']], value => this.updateInteraction(element, index, { easing: value })));
                const timing = document.createElement('div');
                timing.className = 'interaction-timing';
                [['Duration', 'duration', interaction.duration ?? 600, 50], ['Delay', 'delay', interaction.delay ?? 0, 0], ['Repeat', 'repeat', interaction.repeat ?? 1, 1]].forEach(([labelText, key, current, min]) => {
                    const label = document.createElement('label');
                    label.innerHTML = `<span>${labelText}</span>`;
                    const input = document.createElement('input');
                    input.type = 'number'; input.min = min; input.step = key === 'repeat' ? 1 : 50; input.value = current;
                    input.addEventListener('change', () => this.updateInteraction(element, index, { [key]: Math.max(min, Number(input.value) || min) }));
                    label.appendChild(input); timing.appendChild(label);
                });
                card.appendChild(timing);
            } else {
                const row = document.createElement('label');
                row.className = 'interaction-field';
                const label = document.createElement('span');
                label.textContent = valueLabels[interaction.action];
                const input = document.createElement('input');
                input.type = interaction.action === 'navigate' ? 'url' : 'text';
                input.value = interaction.value || '';
                input.placeholder = interaction.action === 'navigate' ? 'https://example.com' : 'Enter value';
                input.addEventListener('input', debounce(() => this.updateInteraction(element, index, { value: input.value }), 180));
                row.append(label, input);
                card.appendChild(row);
            }
        }
        return card;
    }

    createInteractionSelect(labelText, value, options, onChange) {
        const row = document.createElement('label');
        row.className = 'interaction-field';
        const label = document.createElement('span');
        label.textContent = labelText;
        const select = document.createElement('select');
        options.forEach(([optionValue, optionLabel]) => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionLabel;
            option.selected = optionValue === value;
            select.appendChild(option);
        });
        select.addEventListener('change', () => onChange(select.value));
        row.append(label, select);
        return row;
    }

    updateInteraction(element, index, updates) {
        const interactions = (element.interactions || []).map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item);
        this.store.updateElement(element.id, { interactions });
        if (updates.action) {
            this.selectedElement = null;
            this.update();
        }
    }

    createInput(propConfig, element) {
        let value;
        let isShadow = false;
        
        if (propConfig.key.startsWith('shadow')) {
            isShadow = true;
            const shadowVal = element.styles['boxShadow'] || 'none';
            const parsed = this.parseBoxShadow(shadowVal);
            if (propConfig.key === 'shadowType') value = parsed.type;
            else if (propConfig.key === 'shadowX') value = parsed.x + 'px';
            else if (propConfig.key === 'shadowY') value = parsed.y + 'px';
            else if (propConfig.key === 'shadowBlur') value = parsed.blur + 'px';
            else if (propConfig.key === 'shadowSpread') value = parsed.spread + 'px';
            else if (propConfig.key === 'shadowColor') value = parsed.color;
        } else if (this.isMetaProperty(propConfig.key)) {
            value = this.getMetaValue(propConfig.key, element, propConfig.default);
        } else {
            value = propConfig.key === 'content' ? element.content : (element.styles[propConfig.key] ?? propConfig.default);
        }
        
        const changeCallback = (val) => {
            if (isShadow) {
                this.updateShadowProperty(propConfig.key, val, element);
            } else {
                this.updateProperty(propConfig.key, val, element);
            }
        };
        
        switch(propConfig.type) {
            case 'color':
                return this.createColorInput(propConfig, value, changeCallback);
            case 'number':
                return this.createNumberInput(propConfig, value, changeCallback);
            case 'select':
                return this.createSelectInput(propConfig, value, changeCallback);
            case 'text':
                return this.createTextInput(propConfig, value, changeCallback);
            case 'textarea':
                return this.createTextAreaInput(propConfig, value, changeCallback);
            default:
                return this.createTextInput(propConfig, value, changeCallback);
        }
    }

    createColorInput(propConfig, value, onChange) {
        const wrapper = document.createElement('div');
        wrapper.className = 'property-color-wrapper';
        wrapper.style.display = 'flex';
        wrapper.style.gap = '8px';
        wrapper.style.alignItems = 'center';
        wrapper.style.flex = '1';
        
        // Visual color picker (swatch)
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.className = 'property-color';
        colorPicker.value = this.convertToHex(value) || '#000000';
        
        // Text input for arbitrary color values
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'property-text';
        textInput.style.flex = '1';
        textInput.style.width = '0'; // Allow it to flex properly
        textInput.dataset.key = propConfig.key;
        textInput.value = value || '';
        
        // Event listeners
        textInput.addEventListener('change', (e) => {
            const val = e.target.value;
            colorPicker.value = this.convertToHex(val) || '#000000';
            onChange(val);
        });
        
        colorPicker.addEventListener('input', (e) => {
            const val = e.target.value;
            textInput.value = val;
            onChange(val);
        });
        
        wrapper.appendChild(colorPicker);
        wrapper.appendChild(textInput);
        
        return wrapper;
    }

    createNumberInput(propConfig, value, onChange) {
        const wrapper = document.createElement('div');
        wrapper.className = 'property-number-wrapper';
        
        const parsed = this.parseCSSValueAndUnit(value, propConfig.units ? 'px' : '');
        
        // Number field
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'property-number';
        input.dataset.key = propConfig.key;
        input.value = parsed.value;
        if (parsed.unit === 'auto') {
            input.disabled = true;
            input.style.opacity = '0.5';
        }
        
        if (propConfig.min !== undefined) input.min = propConfig.min;
        if (propConfig.max !== undefined) input.max = propConfig.max;
        if (propConfig.step !== undefined) input.step = propConfig.step;
        
        // Unit selector dropdown
        const unitSelect = document.createElement('select');
        unitSelect.className = 'property-unit-select';
        unitSelect.style.cssText = 'padding: 4px 2px; font-size: 11px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-white); outline: none; cursor: pointer; color: var(--color-dark-gray);';
        
        const units = propConfig.units || [''];
        units.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u;
            opt.textContent = u || '—';
            if (u === parsed.unit) opt.selected = true;
            unitSelect.appendChild(opt);
        });
        
        // Slider range
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'property-slider';
        
        // Configure slider bounds based on the current unit chosen
        this.configureSliderBounds(slider, propConfig, parsed.unit);
        slider.value = parsed.value !== '' ? parsed.value : 0;
        
        // Show/hide slider based on unit
        if (parsed.unit === 'auto') {
            slider.style.display = 'none';
        }
        
        // Change event for number input
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            slider.value = val;
            const currentUnit = unitSelect.value;
            const finalVal = currentUnit === 'auto' ? 'auto' : (val !== '' ? val + currentUnit : '');
            onChange(finalVal);
        });
        
        // Change event for unit selector
        unitSelect.addEventListener('change', (e) => {
            const currentUnit = e.target.value;
            if (currentUnit === 'auto') {
                input.value = '';
                input.disabled = true;
                input.style.opacity = '0.5';
                slider.style.display = 'none';
                onChange('auto');
            } else {
                input.disabled = false;
                input.style.opacity = '1';
                slider.style.display = 'block';
                
                // Reconfigure slider bounds for the new unit
                this.configureSliderBounds(slider, propConfig, currentUnit);
                
                // Get default values or current number
                let numVal = input.value;
                if (numVal === '') {
                    numVal = parseFloat(propConfig.default) || 0;
                    input.value = numVal;
                }
                slider.value = numVal;
                
                onChange(numVal + currentUnit);
            }
        });
        
        // Input event for slider
        slider.addEventListener('input', (e) => {
            const val = e.target.value;
            input.value = val;
            const currentUnit = unitSelect.value;
            onChange(val + currentUnit);
        });
        
        wrapper.appendChild(input);
        wrapper.appendChild(unitSelect);
        wrapper.appendChild(slider);
        
        return wrapper;
    }

    configureSliderBounds(slider, propConfig, unit) {
        let min = propConfig.min;
        let max = propConfig.max;
        let step = propConfig.step;
        
        if (min === undefined) {
            const negativeKeys = ['margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'top', 'left', 'right', 'bottom', 'shadowX', 'shadowY', 'letterSpacing'];
            min = negativeKeys.includes(propConfig.key) ? -250 : 0;
        }
        
        if (max === undefined) {
            if (unit === '%') {
                max = 100;
            } else if (unit === 'em' || unit === 'rem') {
                max = 10;
                if (step === undefined) step = 0.1;
            } else if (unit === 'vh' || unit === 'vw') {
                max = 100;
            } else {
                // px, etc.
                const k = propConfig.key;
                if (['width', 'height', 'minWidth', 'maxWidth', 'top', 'left', 'right', 'bottom', 'canvasX', 'canvasY', 'canvasWidth', 'canvasHeight'].includes(k)) {
                    max = 2000;
                } else if (k === 'padding' || k === 'margin' || k === 'gap' || k === 'paddingTop' || k === 'paddingRight' || k === 'paddingBottom' || k === 'paddingLeft' || k === 'marginTop' || k === 'marginRight' || k === 'marginBottom' || k === 'marginLeft' || k === 'shadowX' || k === 'shadowY' || k === 'shadowBlur' || k === 'shadowSpread') {
                    max = 250;
                } else if (k === 'fontSize') {
                    max = 120;
                } else if (k === 'borderRadius' || k === 'borderWidth' || k === 'borderTopLeftRadius' || k === 'borderTopRightRadius' || k === 'borderBottomRightRadius' || k === 'borderBottomLeftRadius') {
                    max = 50;
                } else {
                    max = 100;
                }
            }
        }
        
        if (step === undefined) step = 1;
        
        slider.min = min;
        slider.max = max;
        slider.step = step;
    }

    createSelectInput(propConfig, value, onChange) {
        const select = document.createElement('select');
        select.className = 'property-select';
        select.dataset.key = propConfig.key;
        
        propConfig.options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option.charAt(0).toUpperCase() + option.slice(1);
            if (option === value) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
        
        select.addEventListener('change', (e) => {
            onChange(e.target.value);
        });
        
        return select;
    }

    createTextInput(propConfig, value, onChange) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'property-text';
        input.dataset.key = propConfig.key;
        input.value = value || propConfig.default || '';
        
        input.addEventListener('input', (e) => {
            onChange(e.target.value);
        });
        
        return input;
    }

    createTextAreaInput(propConfig, value, onChange) {
        const textarea = document.createElement('textarea');
        textarea.className = 'property-textarea';
        textarea.dataset.key = propConfig.key;
        textarea.value = value || propConfig.default || '';
        textarea.rows = 4;
        
        textarea.addEventListener('input', (e) => {
            onChange(e.target.value);
        });
        
        return textarea;
    }

    updateProperty(key, value, element) {
        const selected = this.store.getState().selectedElements;
        const targets = selected.length ? selected : [element.id];
        if (this.isMetaProperty(key)) {
            targets.forEach(id => {
                const target = this.store.getState().elements.find(item => item.id === id);
                if (target) this.updateMetaProperty(key, value, target);
            });
            return;
        }
        if (key === 'content') {
            targets.forEach(id => this.store.updateElement(id, { content: value }));
        } else {
            targets.forEach(id => {
                const target = this.store.getState().elements.find(item => item.id === id);
                if (target) this.store.updateElement(id, { styles: { ...target.styles, [key]: value } });
            });
        }
    }

    isMetaProperty(key) {
        return key.startsWith('attr:') || ['elementName', 'elementId', 'className', 'initialVisibility', 'canvasX', 'canvasY', 'canvasWidth', 'canvasHeight', 'animationPreset', 'videoPlayback', 'videoControls', 'videoLoop', 'videoMuted'].includes(key);
    }

    getMetaValue(key, element, fallback = '') {
        if (key === 'elementName') return element.name || `${element.tag} element`;
        if (key === 'elementId') return (element.attributes || {}).id || '';
        if (key === 'className') return (element.attributes || {}).class || '';
        if (key === 'initialVisibility') return element.hidden ? 'hidden' : 'visible';
        if (key === 'canvasX') return `${element.position?.x || 0}px`;
        if (key === 'canvasY') return `${element.position?.y || 0}px`;
        if (key === 'canvasWidth') return `${element.size?.width || 200}px`;
        if (key === 'canvasHeight') return `${element.size?.height || 150}px`;
        if (key === 'animationPreset') {
            const names = { ktsFadeIn: 'fade-in', ktsFadeOut: 'fade-out', ktsSlideUp: 'slide-up', ktsSlideDown: 'slide-down', ktsSlideLeft: 'slide-left', ktsSlideRight: 'slide-right', ktsZoomIn: 'zoom-in', ktsZoomOut: 'zoom-out', ktsRotateIn: 'rotate-in', ktsFlipIn: 'flip-in', ktsBlurIn: 'blur-in', ktsRevealUp: 'reveal-up', ktsRollIn: 'roll-in', ktsSkewIn: 'skew-in', ktsBounce: 'bounce', ktsShake: 'shake', ktsWobble: 'wobble', ktsPulse: 'pulse', ktsHeartbeat: 'heartbeat', ktsFlash: 'flash', ktsSwing: 'swing', ktsFloat: 'float' };
            return names[element.styles?.animationName] || 'none';
        }
        if (key === 'videoPlayback') return element.attributes?.autoplay === false ? 'stop' : 'play';
        if (key === 'videoControls') return element.attributes?.controls ? 'visible' : 'hidden';
        if (key === 'videoLoop') return element.attributes?.loop === false ? 'off' : 'on';
        if (key === 'videoMuted') return element.attributes?.muted === false ? 'on' : 'muted';
        if (key.startsWith('attr:')) {
            const value = (element.attributes || {})[key.slice(5)] ?? fallback;
            if (typeof value === 'string' && value.startsWith('data:') && value.length > 1024) {
                return `[Embedded media · ${(value.length / 1024 / 1024).toFixed(1)} MB · use Add Media to replace]`;
            }
            return value;
        }
        return fallback;
    }

    updateMetaProperty(key, value, element) {
        if (key === 'elementName') return this.store.updateElement(element.id, { name: value.trim() });
        if (key === 'initialVisibility') {
            const styles = { ...element.styles };
            if (value === 'hidden') styles.visibility = 'hidden'; else if (styles.visibility === 'hidden') delete styles.visibility;
            return this.store.updateElement(element.id, { hidden: value === 'hidden', styles });
        }
        if (key === 'canvasX' || key === 'canvasY') {
            const axis = key === 'canvasX' ? 'x' : 'y';
            return this.store.updateElement(element.id, { position: { ...element.position, [axis]: Math.max(0, parseFloat(value) || 0) } });
        }
        if (key === 'canvasWidth' || key === 'canvasHeight') {
            const axis = key === 'canvasWidth' ? 'width' : 'height';
            return this.store.updateElement(element.id, { size: { ...element.size, [axis]: Math.max(1, parseFloat(value) || 1) } });
        }
        if (key === 'animationPreset') {
            const names = { 'fade-in': 'ktsFadeIn', 'fade-out': 'ktsFadeOut', 'slide-up': 'ktsSlideUp', 'slide-down': 'ktsSlideDown', 'slide-left': 'ktsSlideLeft', 'slide-right': 'ktsSlideRight', 'zoom-in': 'ktsZoomIn', 'zoom-out': 'ktsZoomOut', 'rotate-in': 'ktsRotateIn', 'flip-in': 'ktsFlipIn', 'blur-in': 'ktsBlurIn', 'reveal-up': 'ktsRevealUp', 'roll-in': 'ktsRollIn', 'skew-in': 'ktsSkewIn', bounce: 'ktsBounce', shake: 'ktsShake', wobble: 'ktsWobble', pulse: 'ktsPulse', heartbeat: 'ktsHeartbeat', flash: 'ktsFlash', swing: 'ktsSwing', float: 'ktsFloat' };
            const styles = { ...element.styles };
            if (value === 'none') delete styles.animationName;
            else {
                styles.animationName = names[value];
                styles.animationDuration ||= '600ms';
                styles.animationTimingFunction ||= 'ease';
                styles.animationIterationCount ||= '1';
                styles.animationFillMode ||= 'both';
            }
            return this.store.updateElement(element.id, { styles });
        }
        if (key.startsWith('video')) {
            const attributes = { ...(element.attributes || {}) };
            if (key === 'videoPlayback') attributes.autoplay = value === 'play';
            if (key === 'videoControls') attributes.controls = value === 'visible';
            if (key === 'videoLoop') attributes.loop = value === 'on';
            if (key === 'videoMuted') attributes.muted = value === 'muted';
            if (attributes.autoplay) attributes.playsinline = true;
            return this.store.updateElement(element.id, { attributes });
        }
        const attr = key === 'elementId' ? 'id' : key === 'className' ? 'class' : key.slice(5);
        const attributes = { ...(element.attributes || {}) };
        if (value === '') delete attributes[attr]; else attributes[attr] = value;
        this.store.updateElement(element.id, { attributes });
    }

    resetProperty(prop, element) {
        if (prop.key === 'content') return this.updateProperty(prop.key, prop.default || '', element);
        if (this.isMetaProperty(prop.key)) return this.updateProperty(prop.key, '', element);
        const targets = this.store.getState().selectedElements;
        targets.forEach(id => {
            const target = this.store.getState().elements.find(item => item.id === id);
            if (!target) return;
            const styles = { ...target.styles };
            delete styles[prop.key];
            this.store.updateElement(id, { styles });
        });
    }

    updateShadowProperty(key, val, element) {
        const shadowVal = element.styles['boxShadow'] || 'none';
        const parsed = this.parseBoxShadow(shadowVal);
        
        if (key === 'shadowType') parsed.type = val;
        else if (key === 'shadowX') parsed.x = parseFloat(val) || 0;
        else if (key === 'shadowY') parsed.y = parseFloat(val) || 0;
        else if (key === 'shadowBlur') parsed.blur = parseFloat(val) || 0;
        else if (key === 'shadowSpread') parsed.spread = parseFloat(val) || 0;
        else if (key === 'shadowColor') parsed.color = val;
        
        const finalShadow = this.stringifyBoxShadow(parsed);
        const styles = { ...element.styles, boxShadow: finalShadow };
        this.store.updateElement(element.id, { styles });
    }

    parseBoxShadow(shadowStr) {
        if (!shadowStr || shadowStr === 'none') {
            return { type: 'none', x: 0, y: 0, blur: 0, spread: 0, color: '#000000' };
        }
        const str = shadowStr.trim();
        const isInset = str.includes('inset');
        const cleanStr = str.replace('inset', '').trim();
        
        // Extract color: rgba/rgb or hex or named colors
        const colorMatch = cleanStr.match(/(rgba?\(.*?\)|#[a-fA-F0-9]{3,8}|[a-zA-Z]+)/);
        const color = colorMatch ? colorMatch[1] : '#000000';
        
        // Extract dimensions
        const dimsStr = cleanStr.replace(color, '').trim();
        const dims = dimsStr.split(/\s+/).map(parseFloat).filter(n => !isNaN(n));
        
        return {
            type: isInset ? 'inset' : 'outset',
            x: dims[0] || 0,
            y: dims[1] || 0,
            blur: dims[2] || 0,
            spread: dims[3] || 0,
            color: color
        };
    }

    stringifyBoxShadow(shadowObj) {
        if (shadowObj.type === 'none') return 'none';
        const inset = shadowObj.type === 'inset' ? 'inset ' : '';
        return `${inset}${shadowObj.x}px ${shadowObj.y}px ${shadowObj.blur}px ${shadowObj.spread}px ${shadowObj.color}`;
    }

    parseCSSValueAndUnit(colorVal, defaultUnit = 'px') {
        if (colorVal === undefined || colorVal === null || colorVal === '' || colorVal === 'auto') {
            return { value: '', unit: 'auto' };
        }
        const valStr = String(colorVal).trim();
        const num = parseFloat(valStr);
        if (isNaN(num)) {
            return { value: '', unit: 'auto' };
        }
        const unitMatch = valStr.match(/([a-zA-Z%]+)$/);
        const unit = unitMatch ? unitMatch[1] : defaultUnit;
        return { value: num, unit: unit };
    }

    convertToHex(colorVal) {
        if (!colorVal) return '';
        colorVal = colorVal.trim().toLowerCase();
        if (colorVal.startsWith('#')) {
            if (colorVal.length === 4) {
                return '#' + colorVal[1] + colorVal[1] + colorVal[2] + colorVal[2] + colorVal[3] + colorVal[3];
            }
            return colorVal;
        }
        if (colorVal === 'transparent') {
            return '';
        }
        const namedColors = {
            'white': '#ffffff',
            'black': '#000000',
            'red': '#ff0000',
            'green': '#00ff00',
            'blue': '#0000ff',
            'yellow': '#ffff00',
            'gray': '#808080',
            'grey': '#808080',
            'silver': '#c0c0c0',
            'maroon': '#800000',
            'purple': '#800080',
            'fuchsia': '#ff00ff',
            'lime': '#00ff00',
            'olive': '#808000',
            'navy': '#000080',
            'teal': '#008080',
            'aqua': '#00ffff',
            'orange': '#ffa500'
        };
        if (namedColors[colorVal]) {
            return namedColors[colorVal];
        }
        
        const rgbMatch = colorVal.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
            const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
            const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        }
        
        return '';
    }
}
