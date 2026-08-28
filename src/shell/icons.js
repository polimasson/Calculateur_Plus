export function fileSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/>
        <path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <path fill="#0a0a0a" d="M9 14h14v2H9z M9 18h14v2H9z M9 22h9v2H9z"/>
    </svg>`;
}
export function imageFileSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/><path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <rect x="9" y="12" width="14" height="10" fill="#8ec6ff" stroke="#0a0a0a"/><circle cx="13" cy="15" r="2" fill="#ffd24a" stroke="#0a0a0a"/><path fill="#2ecc71" stroke="#0a0a0a" d="M9 21l5-5 4 3 5-6v9H9z"/>
    </svg>`;
}
export function audioFileSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/><path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <path fill="none" stroke="#0a0a0a" stroke-width="2" d="M11 18q4-4 8 0"/><path fill="#000080" d="M13 17h3v7h-3z M18 14h3v10h-3z"/>
    </svg>`;
}
export function videoFileSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/><path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <rect x="9" y="14" width="14" height="9" rx="1" fill="#1a1a1a" stroke="#0a0a0a"/><path fill="#fff" d="M14 17l6 2.5-6 2.5z"/>
    </svg>`;
}

export function folderSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#ffd24a" stroke="#c4a000" d="M3 8h10l2 3h14v16H3z"/>
        <path fill="#ffe680" d="M5 12h22v13H5z"/>
    </svg>`;
}

export function systemFolderSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#c9c9c9" stroke="#8a8a8a" d="M3 8h10l2 3h14v16H3z"/>
        <path fill="#e0e0e0" d="M5 12h22v13H5z"/>
    </svg>`;
}

export function shortcutBadge() {
    return `<g>
        <rect x="1" y="20" width="13" height="11" fill="#f0f0f0" stroke="#0a0a0a"/>
        <rect x="3" y="22" width="9" height="7" fill="#f0f0f0"/>
        <path fill="#0a0a0a" d="M8 24l4 4-4 4v-2.5H4v-3h4z"/>
    </g>`;
}

export function shortcutFileSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/>
        <path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <path fill="#0a0a0a" d="M9 14h14v2H9z M9 18h14v2H9z M9 22h9v2H9z"/>
        ${shortcutBadge()}
    </svg>`;
}
export function shortcutImageSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/><path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <rect x="9" y="12" width="14" height="10" fill="#8ec6ff" stroke="#0a0a0a"/><circle cx="13" cy="15" r="2" fill="#ffd24a" stroke="#0a0a0a"/><path fill="#2ecc71" stroke="#0a0a0a" d="M9 21l5-5 4 3 5-6v9H9z"/>${shortcutBadge()}
    </svg>`;
}
export function shortcutAudioSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/><path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <path fill="none" stroke="#0a0a0a" stroke-width="2" d="M11 18q4-4 8 0"/><path fill="#000080" d="M13 17h3v7h-3z M18 14h3v10h-3z"/>${shortcutBadge()}
    </svg>`;
}
export function shortcutVideoSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/><path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <rect x="9" y="14" width="14" height="9" rx="1" fill="#1a1a1a" stroke="#0a0a0a"/><path fill="#fff" d="M14 17l6 2.5-6 2.5z"/>${shortcutBadge()}
    </svg>`;
}

export function shortcutFolderSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#ffd24a" stroke="#c4a000" d="M3 8h10l2 3h14v16H3z"/>
        <path fill="#ffe680" d="M5 12h22v13H5z"/>
        ${shortcutBadge()}
    </svg>`;
}

export function programSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4" y="3" width="24" height="26" fill="#c3c7cb" stroke="#0a0a0a"/>
        <rect x="6" y="5" width="20" height="12" fill="#000080"/>
        <rect x="8" y="20" width="6" height="5" fill="#000080"/>
        <rect x="16" y="20" width="8" height="2" fill="#0a0a0a"/>
        <rect x="16" y="23" width="8" height="2" fill="#0a0a0a"/>
    </svg>`;
}

export function controlPrefSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="4" width="26" height="24" fill="#c3c7cb" stroke="#0a0a0a"/>
        <rect x="6" y="10" width="9" height="3" fill="#0a0a0a"/>
        <rect x="6" y="19" width="9" height="3" fill="#0a0a0a"/>
        <circle cx="18" cy="11.5" r="3" fill="#000080" stroke="#0a0a0a"/>
        <circle cx="22" cy="20.5" r="3" fill="#000080" stroke="#0a0a0a"/>
    </svg>`;
}

export function controlCheckSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="3" width="26" height="26" fill="#c3c7cb" stroke="#0a0a0a"/>
        <rect x="7" y="7" width="18" height="18" fill="#fff" stroke="#0a0a0a"/>
        <path fill="none" stroke="#008000" stroke-width="4" d="M10 16l5 5 8-10"/>
    </svg>`;
}

export function controlThemeSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="16" cy="17" r="12" fill="#e8e8e8" stroke="#0a0a0a"/>
        <circle cx="10" cy="11" r="2" fill="#ff0000"/>
        <circle cx="18" cy="9" r="2" fill="#00b000"/>
        <circle cx="23" cy="15" r="2" fill="#0000c0"/>
        <circle cx="9" cy="18" r="2" fill="#ffff00"/>
        <path fill="none" stroke="#0a0a0a" stroke-width="2" d="M15 26l6-6"/>
    </svg>`;
}

export function trashSvg() {
    return trashEmptySvg();
}
export function trashEmptySvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#e8e8e8" stroke="#0a0a0a" d="M8 8l2-4h12l2 4z"/>
        <path fill="#e8e8e8" stroke="#0a0a0a" d="M6 8h20l-2 22H8z"/>
        <path fill="#0a0a0a" d="M14 13h2v11h-2z M18 13h2v11h-2z"/>
        <path fill="#fff" stroke="#0a0a0a" d="M12 4l1 4h6l1-4z"/>
    </svg>`;
}
export function trashFullSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#e8e8e8" stroke="#0a0a0a" d="M8 8l2-4h12l2 4z"/>
        <path fill="#e8e8e8" stroke="#0a0a0a" d="M6 8h20l-2 22H8z"/>
        <path fill="#d0d0d0" stroke="#0a0a0a" d="M10 12h12l-1 6H11z"/><path fill="#fff" stroke="#0a0a0a" d="M12 14h8v2H12z"/>
        <path fill="#0a0a0a" d="M14 18h2v6h-2z M18 18h2v6h-2z"/>
    </svg>`;
}
export function explorerDesktopSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#ffd24a" stroke="#c4a000" d="M3 8h10l2 3h14v16H3z"/><path fill="#ffe680" d="M5 12h22v13H5z"/>
        <circle cx="20" cy="20" r="6" fill="#fff" stroke="#0a0a0a" stroke-width="1.2"/><path fill="none" stroke="#0a0a0a" stroke-width="1.5" d="M24.2 24.2l4 4"/>
        <circle cx="20" cy="20" r="2" fill="#000080"/>
    </svg>`;
}
export function controlPanelDesktopSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="#c3c7cb" stroke="#0a0a0a"/><rect x="7" y="7" width="18" height="3" fill="#000080"/>
        <g fill="#fff" stroke="#0a0a0a"><circle cx="11" cy="16" r="3"/><circle cx="21" cy="16" r="3"/><circle cx="16" cy="23" r="3"/></g>
        <path fill="#0a0a0a" d="M11 15h-1v2h1z M21 15h-1v2h1z M16 22h-1v2h1z"/>
    </svg>`;
}
export function infoDesktopSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4" y="3" width="24" height="26" rx="3" fill="#fff" stroke="#0a0a0a"/><rect x="6" y="5" width="20" height="7" rx="1" fill="#000080"/>
        <circle cx="16" cy="19" r="6" fill="#0080ff" stroke="#0a0a0a"/><rect x="15" y="15" width="2" height="7" fill="#fff" rx="1"/><rect x="15" y="13" width="2" height="2" fill="#fff"/>
    </svg>`;
}
