export const byId = id => document.getElementById(id);

export const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export const clearNode = node => {
    if (node) {
        node.innerHTML = '';
    }
};

export function createElement(tagName, className = '') {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    return element;
}
