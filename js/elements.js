/**
 * KeepTheStyle - Element Definitions
 * Defines all available HTML elements with their properties and icons
 */

const ELEMENTS_CATEGORIES = {
    'Basic HTML': {
        icon: '📄',
        elements: [
            { name: 'Div', tag: 'div', icon: '⊞' },
            { name: 'Span', tag: 'span', icon: '⊟' },
            { name: 'Paragraph', tag: 'p', icon: '¶' },
            { name: 'Heading', tag: 'h1', icon: 'H' },
            { name: 'Image', tag: 'img', icon: '🖼' },
            { name: 'Button', tag: 'button', icon: '◆' },
        ]
    },
    'Typography': {
        icon: 'A',
        elements: [
            { name: 'Heading 1', tag: 'h1', icon: 'H1' },
            { name: 'Heading 2', tag: 'h2', icon: 'H2' },
            { name: 'Heading 3', tag: 'h3', icon: 'H3' },
            { name: 'Heading 4', tag: 'h4', icon: 'H4' },
            { name: 'Paragraph', tag: 'p', icon: '¶' },
            { name: 'Span', tag: 'span', icon: 'S' },
            { name: 'Link', tag: 'a', icon: '🔗' },
        ]
    },
    'Layout': {
        icon: '⊞',
        elements: [
            { name: 'Container', tag: 'div', icon: '⊞' },
            { name: 'Section', tag: 'section', icon: '▤' },
            { name: 'Article', tag: 'article', icon: '▥' },
            { name: 'Header', tag: 'header', icon: '▨' },
            { name: 'Footer', tag: 'footer', icon: '▩' },
            { name: 'Navbar', tag: 'nav', icon: '☰' },
            { name: 'Aside', tag: 'aside', icon: '▯' },
            { name: 'Main', tag: 'main', icon: '▮' },
        ]
    },
    'Shapes': {
        icon: '◆',
        elements: [
            { name: 'Rectangle', tag: 'div', icon: '▭', size: { width: 220, height: 140 }, styles: { backgroundColor: '#4D6BFF', border: 'none', borderRadius: '0', padding: '0' }, content: '' },
            { name: 'Rounded Rectangle', tag: 'div', icon: '▢', size: { width: 220, height: 140 }, styles: { backgroundColor: '#7B61FF', border: 'none', borderRadius: '24px', padding: '0' }, content: '' },
            { name: 'Circle', tag: 'div', icon: '●', size: { width: 150, height: 150 }, styles: { backgroundColor: '#FF6B6B', border: 'none', borderRadius: '50%', padding: '0' }, content: '' },
            { name: 'Pill', tag: 'div', icon: '▬', size: { width: 220, height: 80 }, styles: { backgroundColor: '#20C997', border: 'none', borderRadius: '999px', padding: '0' }, content: '' },
            { name: 'Line', tag: 'div', icon: '━', size: { width: 240, height: 4 }, styles: { backgroundColor: '#202124', border: 'none', borderRadius: '999px', padding: '0' }, content: '' },
            { name: 'Triangle', tag: 'div', icon: '▲', size: { width: 160, height: 150 }, styles: { backgroundColor: '#FFB020', border: 'none', padding: '0', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }, content: '' },
            { name: 'Diamond', tag: 'div', icon: '◆', size: { width: 150, height: 150 }, styles: { backgroundColor: '#E64980', border: 'none', padding: '0', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }, content: '' },
            { name: 'Star', tag: 'div', icon: '★', size: { width: 170, height: 170 }, styles: { backgroundColor: '#FFD43B', border: 'none', padding: '0', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 94%, 50% 72%, 21% 94%, 32% 57%, 2% 35%, 39% 35%)' }, content: '' },
            { name: 'Blob', tag: 'div', icon: '⬟', size: { width: 190, height: 170 }, styles: { backgroundColor: '#15AABF', border: 'none', padding: '0', borderRadius: '63% 37% 54% 46% / 55% 48% 52% 45%' }, content: '' }
        ]
    },
    'Forms': {
        icon: '✓',
        elements: [
            { name: 'Input', tag: 'input', icon: '⌨' },
            { name: 'Textarea', tag: 'textarea', icon: '▭' },
            { name: 'Checkbox', tag: 'input', icon: '☐', attributes: { type: 'checkbox' } },
            { name: 'Radio', tag: 'input', icon: '◉', attributes: { type: 'radio' } },
            { name: 'Select', tag: 'select', icon: '▽' },
            { name: 'Label', tag: 'label', icon: 'L' },
            { name: 'Form', tag: 'form', icon: '📋' },
            { name: 'Fieldset', tag: 'fieldset', icon: '▣' },
        ]
    },
    'Media': {
        icon: '▶',
        elements: [
            { name: 'Image', tag: 'img', icon: '🖼' },
            { name: 'Video', tag: 'video', icon: '▶' },
            { name: 'Audio', tag: 'audio', icon: '♫' },
            { name: 'Canvas', tag: 'canvas', icon: '▭' },
            { name: 'SVG', tag: 'svg', icon: '◈' },
            { name: 'Iframe', tag: 'iframe', icon: '⊞' },
            { name: 'Picture', tag: 'picture', icon: '🖼' },
        ]
    },
    'Buttons': {
        icon: '◆',
        elements: [
            { name: 'Button', tag: 'button', icon: '◆' },
            { name: 'Primary Button', tag: 'button', icon: '◆' },
            { name: 'Secondary Button', tag: 'button', icon: '◆' },
            { name: 'Link Button', tag: 'a', icon: '◆' },
            { name: 'Icon Button', tag: 'button', icon: '■' },
        ]
    },
    'Navigation': {
        icon: '☰',
        elements: [
            { name: 'Navbar', tag: 'nav', icon: '☰' },
            { name: 'Menu', tag: 'ul', icon: '☰' },
            { name: 'Menu Item', tag: 'li', icon: '•' },
            { name: 'Breadcrumb', tag: 'nav', icon: '›' },
            { name: 'Pagination', tag: 'nav', icon: '⋯' },
        ]
    }
};

// Default styles for elements
const DEFAULT_STYLES = {
    'div': {
        width: '200px',
        height: '150px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8E8E8',
        borderRadius: '4px',
        padding: '16px'
    },
    'span': {
        display: 'inline-block',
        padding: '4px 8px',
        backgroundColor: '#F5F5F5',
        borderRadius: '4px'
    },
    'p': {
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#000000',
        margin: '0'
    },
    'h1': {
        fontSize: '32px',
        fontWeight: '700',
        lineHeight: '1.2',
        margin: '0'
    },
    'h2': {
        fontSize: '24px',
        fontWeight: '600',
        lineHeight: '1.3',
        margin: '0'
    },
    'button': {
        padding: '8px 16px',
        backgroundColor: '#4D6BFF',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    'input': {
        padding: '8px 12px',
        border: '1px solid #E8E8E8',
        borderRadius: '4px',
        fontSize: '14px',
        width: '200px'
    },
    'img': {
        width: '100%',
        height: 'auto',
        display: 'block'
    }
};

// Helper function to get element defaults
function getElementDefaults(tag) {
    const defaultStyle = DEFAULT_STYLES[tag] || DEFAULT_STYLES['div'];
    return {
        tag: tag,
        styles: { ...defaultStyle },
        content: getDefaultContent(tag),
        attributes: getDefaultAttributes(tag)
    };
}

function getDefaultContent(tag) {
    const contentMap = {
        'p': 'Lorem ipsum dolor sit amet.',
        'h1': 'Heading 1',
        'h2': 'Heading 2',
        'h3': 'Heading 3',
        'h4': 'Heading 4',
        'button': 'Button',
        'span': 'Text',
        'a': 'Link',
        'div': 'Container',
        'section': 'Section',
        'article': 'Article',
        'header': 'Header',
        'footer': 'Footer',
        'nav': 'Navigation',
        'label': 'Label',
        'option': 'Option'
    };
    return contentMap[tag] || '';
}

function getDefaultAttributes(tag) {
    const attrMap = {
        'img': { src: 'https://via.placeholder.com/200x150', alt: 'Image' },
        'input': { type: 'text', placeholder: 'Enter text...' },
        'textarea': { rows: '4', cols: '50', placeholder: 'Enter text...' },
        'checkbox': { type: 'checkbox' },
        'radio': { type: 'radio' },
        'a': { href: '#' },
        'video': { controls: true, width: '400', height: '300' },
        'audio': { controls: true },
        'iframe': { src: 'about:blank', width: '100%', height: '300px' }
    };
    return attrMap[tag] || {};
}

// Get all elements as a flat list
function getAllElements() {
    const elements = [];
    Object.values(ELEMENTS_CATEGORIES).forEach(category => {
        category.elements.forEach(el => {
            const normalizedTag = el.tag.startsWith('input[') ? 'input' : el.tag;
            elements.push({
                ...el,
                tag: normalizedTag,
                defaults: {
                    ...getElementDefaults(normalizedTag),
                    size: el.size || { width: 200, height: 150 },
                    styles: { ...getElementDefaults(normalizedTag).styles, ...(el.styles || {}) },
                    content: el.content !== undefined ? el.content : getElementDefaults(normalizedTag).content,
                    attributes: { ...getElementDefaults(normalizedTag).attributes, ...(el.name === 'Checkbox' ? { type: 'checkbox' } : {}), ...(el.name === 'Radio' ? { type: 'radio' } : {}) }
                }
            });
        });
    });
    return elements;
}

// Get categories with their elements
function getCategoriesWithElements() {
    const categories = {};
    Object.entries(ELEMENTS_CATEGORIES).forEach(([name, data]) => {
        categories[name] = {
            ...data,
            elements: data.elements.map(el => ({
                ...el,
                tag: el.tag.startsWith('input[') ? 'input' : el.tag,
                defaults: {
                    ...getElementDefaults(el.tag.startsWith('input[') ? 'input' : el.tag),
                    size: el.size || { width: 200, height: 150 },
                    styles: { ...getElementDefaults(el.tag.startsWith('input[') ? 'input' : el.tag).styles, ...(el.styles || {}) },
                    content: el.content !== undefined ? el.content : getElementDefaults(el.tag.startsWith('input[') ? 'input' : el.tag).content,
                    attributes: {
                        ...getElementDefaults(el.tag.startsWith('input[') ? 'input' : el.tag).attributes,
                        ...(el.name === 'Checkbox' ? { type: 'checkbox' } : {}),
                        ...(el.name === 'Radio' ? { type: 'radio' } : {})
                    }
                }
            }))
        };
    });
    return categories;
}
