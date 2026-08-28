export function el(tag, className) {
    const n = document.createElement(tag);
    n.className = className;
    return n;
}
