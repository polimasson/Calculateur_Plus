/**
 * Module de Génération de Codes-Barres
 * Utilise bwip-js (Barcode Writer in Pure PostScript) pour générer tous les types de codes-barres.
 * 86+ symbologies supportées : 1D, 2D, composites, postaux, médical, pharma, etc.
 */

export async function init(container) {
    if (typeof bwipjs === "undefined") {
        try {
            await loadScript("dependencies/bwip-js.js");
        } catch (e) {
            showError(container, "Impossible de charger la librairie bwip-js.");
            return;
        }
    }
    setup(container);
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Catalogue des symbologies supportées par bwip-js, organisé par catégorie.
// Chaque entrée : { bcid, name, desc, charset (numeric|ascii|latin1|bytes|any) }
const SYMBOLS = {
    "1d": [
        { bcid: "code128",      name: "Code 128",            charset: "any",    desc: "Standard polyvalent (logistique, colis)" },
        { bcid: "code39",       name: "Code 39",            charset: "ascii",  desc: "Industriel : 0-9 A-Z -. $/+% space" },
        { bcid: "code39ext",    name: "Code 39 étendu",      charset: "latin1", desc: "Code 39 avec caractères ASCII complets" },
        { bcid: "code93",       name: "Code 93",            charset: "ascii",  desc: "Compacifié, plus sûr que Code 39" },
        { bcid: "code93ext",     name: "Code 93 étendu",      charset: "latin1", desc: "Code 93 avec ASCII complet" },
        { bcid: "code11",       name: "Code 11",            charset: "numeric",desc: "Télécommunications (chiffres + tiret)" },
        { bcid: "code32",       name: "Code 32",            charset: "ascii",  desc: "Pharma italienne (A-Z + 0-9)" },
        { bcid: "msi",          name: "MSI / Plessey",      charset: "numeric",desc: "Code à chiffres pour entrepôts" },
        { bcid: "plessey",      name: "Plessey",            charset: "numeric",desc: "Hex (0-9 A-F), ancien standard UK" },
        { bcid: "telepennumeric", name: "Telepen Numeric", charset: "numeric", desc: "Version numérique du Telepen" },
        { bcid: "telepen",      name: "Telepen",            charset: "ascii",  desc: "Bibliothèques UK" },
        { bcid: "pharmacode",   name: "Pharmacode",         charset: "numeric",desc: "1 à 32768, emballage pharma" },
        { bcid: "pharmacode2",  name: "Pharmacode 2-track", charset: "numeric",desc: "Code à deux pistes" },
    ],
    "2d": [
        { bcid: "qrcode",              name: "QR Code",                 charset: "bytes", desc: "Standard mondial (URL, texte)" },
        { bcid: "microqrcode",         name: "Micro QR Code",          charset: "bytes", desc: "Plus petit QR" },
        { bcid: "rectangularmicroqrcode", name: "rMQR",                charset: "bytes", desc: "Micro QR rectangulaire" },
        { bcid: "azteccode",           name: "Aztec Code",             charset: "bytes", desc: "Billets de transport, UID" },
        { bcid: "azteccodecompact",    name: "Aztec Compact",          charset: "bytes", desc: "Compact Aztec" },
        { bcid: "aztecrune",           name: "Aztec Rune",              charset: "numeric",desc: "Petits glyphes"} ,
        { bcid: "datamatrix",          name: "Data Matrix",            charset: "bytes", desc: "Industrie/aérospatial" },
        { bcid: "datamatrixrectangular", name: "Data Matrix Rectangular", charset: "bytes", desc: "Forme rectangulaire" },
        { bcid: "datamatrixrectangularextension", name: "Data Matrix Rect. Ext", charset: "bytes", desc: "Extension rectangulaire" },
        { bcid: "pdf417",              name: "PDF417",                  charset: "bytes", desc: "Cartes d'identité, transports" },
        { bcid: "pdf417compact",       name: "PDF417 Compact",          charset: "bytes", desc: "Variante allégée du PDF417" },
        { bcid: "micropdf417",         name: "MicroPDF417",             charset: "bytes", desc: "Variante réduite du PDF417" },
        { bcid: "maxicode",            name: "MaxiCode",                charset: "bytes", desc: "Logistique UPS" },
        { bcid: "dotcode",             name: "DotCode",                 charset: "bytes", desc: "Pointillé, marquage industriel" },
        { bcid: "jabcode",             name: "JAB Code",                charset: "bytes", desc: "Code 2D couleur" },
        { bcid: "codeone",             name: "Code One",                charset: "bytes", desc: "Code 2D ancien PDF417-like" },
        { bcid: "ultracode",           name: "Ultracode",               charset: "bytes", desc: "Code 2D optique couleur" },
        { bcid: "hanxin",              name: "Han Xin Code",            charset: "bytes", desc: "Standard chinois"} ,
    ],
    "stacked": [
        { bcid: "codablockf",       name: "Codablock F",       charset: "ascii",  desc: "Code 39 empilé plusieurs lignes"},
        { bcid: "code16k",          name: "Code 16K",          charset: "ascii",  desc: "Code 128 empilé"},
        { bcid: "code49",           name: "Code 49",           charset: "ascii",  desc: "Empilé Code 39/2-of-5"},
        { bcid: "ean13composite",   name: "EAN-13 Composite",  charset: "any",    desc: "EAN-13 + code 2D additionnel"},
        { bcid: "ean8composite",    name: "EAN-8 Composite",   charset: "any",    desc: "EAN-8 + code 2D additionnel"},
        { bcid: "upcacomposite",    name: "UPC-A Composite",   charset: "any",    desc: "UPC-A + code 2D additionnel"},
        { bcid: "upcecomposite",    name: "UPC-E Composite",    charset: "any",    desc: "UPC-E + code 2D additionnel"},
        { bcid: "databarexpandedcomposite",         name: "GS1 DataBar Expanded Composite",         charset: "any", desc: "Composite Expanded" },
        { bcid: "databarexpandedstackedcomposite",  name: "GS1 DataBar Expanded Stacked Composite", charset: "any", desc: "Composite Expanded Stacked" },
        { bcid: "databarlimitedcomposite",         name: "GS1 DataBar Limited Composite",         charset: "any", desc: "Composite Limited" },
        { bcid: "databaromnicomposite",             name: "GS1 DataBar Omni Composite",             charset: "any", desc: "Composite Omni" },
        { bcid: "databarstackedcomposite",          name: "GS1 DataBar Stacked Composite",          charset: "any", desc: "Composite Stacked" },
        { bcid: "databarstackedomnicomposite",      name: "GS1 DataBar Stacked Omni Composite",     charset: "any", desc: "Composite Stacked Omni" },
        { bcid: "databartruncatedcomposite",        name: "GS1 DataBar Truncated Composite",        charset: "any", desc: "Composite Truncated" },
    ],
    "postal": [
        { bcid: "auspost",       name: "Australia Post",          charset: "numeric",desc: "Code postal australien"},
        { bcid: "postnet",       name: "POSTNET",                 charset: "numeric",desc: "Code postal USA"},
        { bcid: "planet",        name: "PLANET",                  charset: "numeric",desc: "Suivi courrier USPS"},
        { bcid: "royalmail",     name: "Royal Mail (RM4SCC)",     charset: "numeric",desc: "Code postal UK"},
        { bcid: "kix",           name: "KIX Code (Pays-Bas)",     charset: "numeric",desc: "Code postal néerlandais"},
        { bcid: "japanpost",     name: "Japan Post",              charset: "numeric",desc: "Code postal japonais"},
        { bcid: "mailmark",      name: "Royal Mail Mailmark",     charset: "numeric",desc: "Standard nouvelle génération UK"},
        { bcid: "identcode",     name: "Identcode ( Deutsche Post)", charset: "numeric",desc: "Suivi colis allemand"},
        { bcid: "leitcode",      name: "Leitcode (Deutsche Post)", charset: "numeric",desc: "Code postal allemand"},
        { bcid: "onecode",       name: "USPS Intelligent Mail",  charset: "numeric",desc: "Code postal USPS nouvelle gen"},
    ],
    "gs1": [
        { bcid: "ean13",         name: "EAN-13",  charset: "numeric", desc: "Codes-produits mondiaux (13 chiffres)"},
        { bcid: "ean8",          name: "EAN-8",   charset: "numeric", desc: "EAN court pour petits produits (8 chiffres)"},
        { bcid: "ean5",          name: "EAN-5",   charset: "numeric", desc: "Add-on prix (livres)"},
        { bcid: "ean2",          name: "EAN-2",   charset: "numeric", desc: "Add-on 2 chiffres"},
        { bcid: "upca",          name: "UPC-A",   charset: "numeric", desc: "Codes-produits USA/Canada (12 chiffres)"},
        { bcid: "upce",          name: "UPC-E",   charset: "numeric", desc: "UPC compressé"},
        { bcid: "isbn",          name: "ISBN",    charset: "numeric", desc: "Code-barres livre (EAN-13)"},
        { bcid: "ismn",          name: "ISMN",    charset: "numeric", desc: "Partitions musicales"},
        { bcid: "issn",          name: "ISSN",   charset: "numeric", desc: "Publications périodiques"},
        { bcid: "ean14",         name: "EAN-14 (ITF-14)", charset: "numeric", desc: "Cartons/logistique"},
        { bcid: "itf14",         name: "ITF-14",  charset: "numeric", desc: "Interleaved 2/5 logistique 14 chiffres"},
        { bcid: "sscc18",        name: "SSCC-18", charset: "numeric", desc: "Identifiant unité logistique"},
        { bcid: "databaromni",             name: "GS1 DataBar Omni",             charset: "numeric", desc: "GS1 DataBar plein format"},
        { bcid: "databartruncated",        name: "GS1 DataBar Truncated",        charset: "numeric", desc: "DataBar tronqué"},
        { bcid: "databarstacked",          name: "GS1 DataBar Stacked",          charset: "numeric", desc: "DataBar empilé"},
        { bcid: "databarstackedomni",      name: "GS1 DataBar Stacked Omni",     charset: "numeric", desc: "DataBar empilé omni"},
        { bcid: "databarexpanded",         name: "GS1 DataBar Expanded",         charset: "any", desc: "DataBar Extended"},
        { bcid: "databarexpandedstacked",   name: "GS1 DataBar Expanded Stacked", charset: "any", desc: "DataBar Expanded empilé"},
        { bcid: "databarlimited",          name: "GS1 DataBar Limited",          charset: "numeric", desc: "DataBar Limited"},
        { bcid: "gs1qrcode",              name: "GS1 QR Code",              charset: "bytes", desc: "QR Code avec données GS1"},
        { bcid: "gs1datamatrix",          name: "GS1 Data Matrix",          charset: "bytes", desc: "Data Matrix avec données GS1"},
        { bcid: "gs1datamatrixrectangular", name: "GS1 Data Matrix Rectangular", charset: "bytes", desc: "GS1 DM rect." },
        { bcid: "gs1dotcode",             name: "GS1 DotCode",              charset: "bytes", desc: "DotCode GS1"},
        { bcid: "gs1dldatamatrix",        name: "GS1 DL Data Matrix",       charset: "bytes", desc: "Digital Link DM"},
        { bcid: "gs1dlqrcode",            name: "GS1 DL QR Code",           charset: "bytes", desc: "Digital Link QR"},
        { bcid: "gs1northamericancoupon", name: "GS1 North American Coupon", charset: "any", desc: "Coupon nord-americain"},
        { bcid: "swissqrcode",            name: "Swiss QR Code",            charset: "bytes", desc: "QR-facture Suisse (QR-IBAN)"},
    ],
    "hibc": [
        { bcid: "hibccodablockf",   name: "HIBC Codablock F",   charset: "ascii", desc: "HIBC Codablock F"},
        { bcid: "hibccode128",      name: "HIBC Code 128",       charset: "ascii", desc: "HIBC Code 128"},
        { bcid: "hibccode39",       name: "HIBC Code 39",        charset: "ascii", desc: "HIBC Code 39"},
        { bcid: "hibcdatamatrix",   name: "HIBC Data Matrix",   charset: "bytes", desc: "HIBC Data Matrix"},
        { bcid: "hibcdatamatrixrectangular", name: "HIBC DM Rectangular", charset: "bytes", desc: "HIBC DM rect" },
        { bcid: "hibcmicropdf417",  name: "HIBC MicroPDF417",   charset: "bytes", desc: "HIBC MicroPDF417"},
        { bcid: "hibcpdf417",       name: "HIBC PDF417",         charset: "bytes", desc: "HIBC PDF417"},
        { bcid: "hibcqrcode",       name: "HIBC QR Code",        charset: "bytes", desc: "HIBC QR"},
        { bcid: "hibcazteccode",    name: "HIBC Aztec Code",     charset: "bytes", desc: "HIBC Aztec"},
    ],
    "pharma": [
        { bcid: "pzn",            name: "PZN",            charset: "numeric", desc: "Pharma-zentralnummer (Allemagne)"},
    ],
    "special": [
        { bcid: "code2of5",       name: "Code 2 of 5",       charset: "numeric", desc: "Standard 2/5"},
        { bcid: "interleaved2of5", name: "Interleaved 2 of 5", charset: "numeric", desc: "2/5 entrelacé"},
        { bcid: "iata2of5",       name: "IATA 2 of 5",       charset: "numeric", desc: "Aviation 2/5"},
        { bcid: "industrial2of5", name: "Industrial 2 of 5", charset: "numeric", desc: "Industriel 2/5"},
        { bcid: "matrix2of5",     name: "Matrix 2 of 5",     charset: "numeric", desc: "Matriciel 2/5"},
        { bcid: "datalogic2of5",  name: "Datalogic 2 of 5",  charset: "numeric", desc: "Standard Datalogic"},
        { bcid: "coop2of5",       name: "Coop 2 of 5",       charset: "numeric", desc: "Standard Coop"},
        { bcid: "bc412",          name: "BC412",              charset: "ascii", desc: "Semiconducteurs (single digit)"},
        { bcid: "channelcode",    name: "Channel Code",       charset: "numeric", desc: "Code à canal unique"},
        { bcid: "flattermarken",  name: "Flattermarken",     charset: "numeric", desc: "Repérage de pagination"},
        { bcid: "posicode",       name: "PosiCode",           charset: "any", desc: "Code industriel à position"},
        { bcid: "raw",            name: "Raw (manuel)",       charset: "bytes", desc: "Manuel raw pattern"},
        { bcid: "symbol",         name: "Symbol (custom)",    charset: "any", desc: "Symbole personnalisable"},
        { bcid: "daft",          name: "DAFT",                charset: "any", desc: "Code couplé (test/rendu)"},
        { bcid: "mands",         name: "M&S (Marks & Spencer)", charset: "numeric", desc: "Standard M&S"},
    ],
};

// Map bcid -> meta pour accès rapide
const BCID_META = {};
Object.values(SYMBOLS).forEach(list => list.forEach(s => BCID_META[s.bcid] = s));

function setup(container) {
    const typeSelect     = container.querySelector("#barcode-type");
    const textInput      = container.querySelector("#barcode-text");
    const scaleSlider    = container.querySelector("#barcode-scale");
    const scaleValue     = container.querySelector("#barcode-scale-value");
    const autofitCb      = container.querySelector("#barcode-autofit");
    const heightSlider   = container.querySelector("#barcode-height");
    const heightValue    = container.querySelector("#barcode-height-value");
    const rotateSelect   = container.querySelector("#barcode-rotate");
    const includeSelect  = container.querySelector("#barcode-includetext");
    const fgInput        = container.querySelector("#barcode-fg");
    const bgInput        = container.querySelector("#barcode-bg");
    const padxSlider     = container.querySelector("#barcode-padx");
    const padxValue      = container.querySelector("#barcode-padx-value");
    const padySlider     = container.querySelector("#barcode-pady");
    const padyValue      = container.querySelector("#barcode-pady-value");
    const twoDGroup      = container.querySelector("#twoD-options");
    const eccSelect      = container.querySelector("#barcode-ecc");
    const versionSlider  = container.querySelector("#barcode-version");
    const versionValue   = container.querySelector("#barcode-version-value");
    const parseCb        = container.querySelector("#barcode-parse");
    const aztecEccSlider = container.querySelector("#barcode-aztec-ecc");
    const aztecEccValue  = container.querySelector("#barcode-aztec-ecc-value");
    const pdf417EccSlider= container.querySelector("#barcode-pdf417-ecc");
    const pdf417EccValue = container.querySelector("#barcode-pdf417-ecc-value");
    const pdf417ColsSlider= container.querySelector("#barcode-pdf417-cols");
    const pdf417ColsValue = container.querySelector("#barcode-pdf417-cols-value");
    const dmFormatSelect  = container.querySelector("#barcode-dm-format");
    const addtextInput   = container.querySelector("#barcode-addtext");
    const generateBtn    = container.querySelector("#barcode-generate");
    const pngBtn         = container.querySelector("#barcode-download-png");
    const svgBtn         = container.querySelector("#barcode-download-svg");
    const copyBtn        = container.querySelector("#barcode-copy");
    const canvas         = container.querySelector("#barcode-canvas");
    const viewport       = container.querySelector("#barcode-viewport");
    const zoomIndicator  = container.querySelector("#barcode-zoom-indicator");
    const zoomSlider     = container.querySelector("#barcode-zoom-slider");
    const zoomResetBtn   = container.querySelector("#barcode-zoom-reset");
    const infoEl         = container.querySelector("#barcode-info");
    const errorEl        = container.querySelector("#barcode-error");
    const hintEl         = container.querySelector("#barcode-reader-hint");

    // Remplir le select par catégorie
    const categories = {
        "1d":     container.querySelector("#cat-1d"),
        "2d":     container.querySelector("#cat-2d"),
        "stacked": container.querySelector("#cat-stacked"),
        "postal": container.querySelector("#cat-postal"),
        "gs1":    container.querySelector("#cat-gs1"),
        "hibc":   container.querySelector("#cat-hibc"),
        "pharma": container.querySelector("#cat-pharma"),
        "special":container.querySelector("#cat-special"),
    };

    for (const cat in SYMBOLS) {
        const group = categories[cat];
        SYMBOLS[cat].forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.bcid;
            opt.textContent = `${s.name} (${s.bcid})`;
            group.appendChild(opt);
        });
    }

    // QR Code par defaut universellement utile
    typeSelect.value = "qrcode";

    // Renvoie true si le bcid est un code 1D (linéaire) — seuls les 1D
    // utilisent l'option "height" (hauteur des barres). La passer aux 2D
    // déforme/brouille le rendu.
    const BCID_1D = new Set(SYMBOLS["1d"].map(s => s.bcid));
    function is1D(bcid) { return BCID_1D.has(bcid); }

    // --- Capacites des symbologies 2D ---
    // Permet d'afficher/masquer dynamiquement les controles pertinents
    // (ECC, version, encoding...) dans le panneau "options 2D".
    //
    //  caps.ecc        : pertinent pour QR/Legacy/QR Compact/Swiss QR
    //  caps.version    : version forcee (1-40 pour QR, 1-4 pour MicroQR)
    //  caps.encoding   : forcer le mode d'encodage (numeric/alphanumeric/byte/kanji)
    //  caps.aztecEcc   : Aztec a un systeme different (1-100%)
    //  caps.pdf417Ecc  : PDF417 ecc (seclevel) 0-8
    //  caps.dmFormat   : Data Matrix rows/cols (format)
    const BCID_CAPS = {
        // QR family
        qrcode:                { ecc: true, version: true, encoding: true, versionMax: 40 },
        microqrcode:           { ecc: true, version: true, encoding: true, versionMax: 4, eccLevels: ["L","M","Q"] },
        rectangularmicroqrcode:{ ecc: true, version: true, encoding: true, versionMax: 38 },
        gs1qrcode:             { ecc: true, version: true, encoding: true, versionMax: 40 },
        gs1dlqrcode:           { ecc: true, version: true, encoding: true, versionMax: 40 },
        swissqrcode:           { ecc: true, version: true, encoding: true, versionMax: 40, eccFixed: "M" },
        hibcqrcode:            { ecc: true, version: true, encoding: true, versionMax: 40 },
        // Aztec family
        azteccode:             { aztecEcc: true },
        azteccodecompact:      { aztecEcc: true },
        hibcazteccode:         { aztecEcc: true },
        // DataMatrix family
        datamatrix:                 { dmFormat: true },
        datamatrixrectangular:      { dmFormat: true },
        datamatrixrectangularextension: { dmFormat: true },
        hibcdatamatrix:             { dmFormat: true },
        hibcdatamatrixrectangular:  { dmFormat: true },
        gs1datamatrix:              { dmFormat: true },
        gs1datamatrixrectangular:   { dmFormat: true },
        gs1dldatamatrix:            { dmFormat: true },
        // PDF417 family
        pdf417:                { pdf417Ecc: true, pdf417Columns: true },
        pdf417compact:         { pdf417Columns: true },
        micropdf417:           { pdf417Columns: true },
        hibcpdf417:            { pdf417Ecc: true, pdf417Columns: true },
        hibcmicropdf417:       { pdf417Columns: true },
    };
    function getCaps(bcid) { return BCID_CAPS[bcid] || null; }

    // Met à jour l'UI selon que le type sélectionné est 1D ou 2D
    function updateHeightVisibility() {
        const bcid = typeSelect.value;
        const isLinear = is1D(bcid);
        heightSlider.disabled = !isLinear;
        heightSlider.parentElement.style.opacity = isLinear ? "1" : "0.4";
        heightSlider.parentElement.title = isLinear
            ? ""
            : "Hauteur applicable uniquement aux codes 1D linéaires";
    }

    // Affiche/masque la section "Options 2D" et les lignes pertinentes
    // (ECC, version, encoding, aztecEcc, pdf417Ecc, pdf417Columns, dmFormat)
    // selon les capacites du bcid selectionne (voir BCID_CAPS).
    function update2DOptions() {
        const bcid = typeSelect.value;
        const caps = getCaps(bcid);

        if (!caps) {
            twoDGroup.classList.add("hidden");
            return;
        }
        twoDGroup.classList.remove("hidden");

        // Active/desactive chaque range data-cap
        const capRows = twoDGroup.querySelectorAll("[data-cap]");
        capRows.forEach(row => {
            const cap = row.getAttribute("data-cap");
            if (caps[cap]) {
                row.classList.add("active");
            } else {
                row.classList.remove("active");
            }
        });

        // Ajuste la version max pour MicroQR (4) ou QR (40) etc.
        if (caps.version && caps.versionMax) {
            versionSlider.max = String(caps.versionMax);
            if (parseInt(versionSlider.value, 10) > caps.versionMax) {
                versionSlider.value = "0";
                versionValue.textContent = "0";
            }
        }

        // Si ECC fixé (ex: swissqrcode force "M"), on vérouille le select
        if (caps.eccFixed) {
            eccSelect.value = caps.eccFixed;
            eccSelect.disabled = true;
        } else if (caps.ecc) {
            eccSelect.disabled = false;
            // Restreint les niveaux pour MicroQR (L/M/Q seulement)
            if (caps.eccLevels) {
                [...eccSelect.options].forEach(opt => {
                    opt.hidden = !caps.eccLevels.includes(opt.value);
                });
            } else {
                [...eccSelect.options].forEach(opt => { opt.hidden = false; });
            }
        }
    }

    // --- Zoom / Pan (inspection des barres fines) ---
    // Coordonnees de "pan" en pixels viewport (le canvas est translate puis
    // mis a l'echelle, avec transform-origin: 0 0, de sorte que le point
    // (panX, panY) du viewport coincide avec le coin haut-gauche du canvas
    // non-zoome.
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let dragStartX, dragStartY, dragPanX, dragPanY;

    // Dernier scale calcule par l'auto-fit (pour le reutiliser sans
    // re-prober le rendu a chaque appel).
    let lastFitScale = 3;

    function applyTransform() {
        // Ordre : on translate d'abord, puis on scale autour de (0,0).
        canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
        const pct = Math.round(zoom * 100);
        if (zoomIndicator) {
            zoomIndicator.textContent = `${pct}%`;
            zoomIndicator.classList.toggle("hidden", zoom <= 1);
        }
        if (zoomSlider) {
            // Evite la boucle : on ne set value que si different
            const v = String(Math.round(zoom * 10) / 10);
            if (zoomSlider.value !== v) zoomSlider.value = v;
        }
    }

    function resetView() {
        zoom = 1;
        panX = 0;
        panY = 0;
        applyTransform();
    }

    // Centre initialement le canvas (uniquement quand zoom = 1) en placant
    // son coin haut-gauche au centre du viewport moins la moitie de sa taille.
    function centerCanvas() {
        if (zoom !== 1) return;
        const vpRect = viewport.getBoundingClientRect();
        // On lit les dimensions logo du canvas (intrinsic, pas les CSS).
        const cw = canvas.width || 0;
        const ch = canvas.height || 0;
        panX = Math.max(0, (vpRect.width - cw) / 2);
        panY = Math.max(0, (vpRect.height - ch) / 2);
        applyTransform();
    }

    function setupZoomPan() {
        if (!viewport) return;

        viewport.addEventListener("wheel", (e) => {
            e.preventDefault();
            const rect = viewport.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const oldZoom = zoom;
            const step = e.deltaY < 0 ? 1.2 : 1 / 1.2;
            zoom = Math.min(20, Math.max(1, zoom * step));

            // Position du point vise dans l'image (avant zoom), en pixels image
            const imgX = (mouseX - panX) / oldZoom;
            const imgY = (mouseY - panY) / oldZoom;
            // Apres zoom, on veut que ce point soit toujours sous la souris
            panX = mouseX - imgX * zoom;
            panY = mouseY - imgY * zoom;

            applyTransform();
        }, { passive: false });

        viewport.addEventListener("mousedown", (e) => {
            // Drag autorise si on a zoome OU si le canvas deborde (pan libre)
            const cw = canvas.width || 0;
            const ch = canvas.height || 0;
            const rect = viewport.getBoundingClientRect();
            const overflows = cw * zoom > rect.width || ch * zoom > rect.height;
            if (zoom <= 1 && !overflows) return;
            e.preventDefault();
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragPanX = panX;
            dragPanY = panY;
            viewport.style.cursor = "grabbing";
            viewport.classList.add("dragging");
        });

        window.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            panX = dragPanX + (e.clientX - dragStartX);
            panY = dragPanY + (e.clientY - dragStartY);
            applyTransform();
        });

        window.addEventListener("mouseup", () => {
            if (!isDragging) return;
            isDragging = false;
            viewport.style.cursor = "grab";
            viewport.classList.remove("dragging");
        });

        // Double-clic : reset zoom/pan (recentre le canvas)
        viewport.addEventListener("dblclick", () => {
            resetView();
            centerCanvas();
        });

        // Slider de zoom : applique le zoom en gardant le centre du
        // viewport comme point fixe (comportement intuitif).
        if (zoomSlider) {
            zoomSlider.addEventListener("input", () => {
                const newZoom = Math.min(20, Math.max(1, parseFloat(zoomSlider.value) || 1));
                const oldZoom = zoom;
                if (newZoom === oldZoom) return;
                const rect = viewport.getBoundingClientRect();
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const imgX = (cx - panX) / oldZoom;
                const imgY = (cy - panY) / oldZoom;
                zoom = newZoom;
                panX = cx - imgX * zoom;
                panY = cy - imgY * zoom;
                applyTransform();
            });
        }

        // Bouton reset : zoom=1 + recentrage
        if (zoomResetBtn) {
            zoomResetBtn.addEventListener("click", () => {
                resetView();
                centerCanvas();
            });
        }
    }

    function showError(msg) {
        errorEl.textContent = "⚠ " + msg;
        errorEl.classList.remove("hidden");
        infoEl.classList.add("hidden");
    }
    function clearError() {
        errorEl.textContent = "";
        errorEl.classList.add("hidden");
    }

    // Convertit la couleur #rrggbb en valeur bwip-js attendue (RRGGBB sans #)
    function toBwipColor(hex) {
        return hex.replace("#", "").toUpperCase();
    }

    // Parse la zone "Options avancées" : "key1 key2=val key3"
    function parseAdvanced(text) {
        const opts = {};
        if (!text || !text.trim()) return opts;
        text.trim().split(/\s+/).forEach(token => {
            const idx = token.indexOf("=");
            if (idx === -1) {
                opts[token] = true;
            } else {
                const k = token.slice(0, idx);
                let v = token.slice(idx + 1);
                // booléens textuels
                if (v === "true") v = true;
                else if (v === "false") v = false;
                opts[k] = v;
            }
        });
        return opts;
    }

    // Remplace les caracteres speciaux GS1 (FNC1) par escape hex si recu
    // Pour simplicite, on accepte aussi "(13)...(21)..." classique pour GS1
    function normalizeText(bcid, text) {
        if (typeof text !== "string") return text;
        // bwip-js accepte directement les parentheses GS1 pour les bcid gs1*
        return text;
    }

    // Construit l'objet options bwip-js à partir de l'UI courante.
    // Retourne la valeur de scale a utiliser pour le prochain rendu.
    // Si Auto-fit est_active, on prend le maximum de barres/modules possibles
    // pour remplir le viewport sans deborder. Sinon, on se fie au slider.
    function getCurrentScale() {
        if (!autofitCb || !autofitCb.checked) {
            return parseInt(scaleSlider.value, 10);
        }
        return lastFitScale;
    }

    // Calcule (en memoire) le scale optimal pour faire tenir le code-barres
    // dans le viewport. Renvoie un entier >= 1 (et <= 10 pour éviter
    // les rendus gigantesques).
    function computeFitScale(bcid, text, baseOpts) {
        let probeOpts = { ...baseOpts, scale: 1 };
        try {
            const probe = document.createElement("canvas");
            bwipjs.toCanvas(probe, probeOpts);
            const cw = probe.width || 1;
            const ch = probe.height || 1;
            const vpRect = viewport.getBoundingClientRect();
            const availW = Math.max(50, vpRect.width - 32);
            const availH = Math.max(50, vpRect.height - 32);
            const scaleX = availW / cw;
            const scaleY = availH / ch;
            const ideal = Math.min(scaleX, scaleY);
            let scale = Math.max(1, Math.floor(ideal));
            scale = Math.min(scale, 10);
            return scale;
        } catch (e) {
            return 1;
        }
    }

    // "height" n'est inclus QUE pour les codes 1D linéaires.
    function buildOpts(bcid, text, customScale) {
        const opts = {
            bcid:        bcid,
            text:        text,
            scale:       customScale != null ? customScale : getCurrentScale(),
            rotate:      rotateSelect.value,
            includetext: includeSelect.value === "true",
            textcolor:   toBwipColor(fgInput.value),
            barcolor:    toBwipColor(fgInput.value),
            backgroundcolor: toBwipColor(bgInput.value),
            paddingwidth:  parseInt(padxSlider.value, 10),
            paddingheight: parseInt(padySlider.value, 10),
        };

        if (is1D(bcid)) {
            opts.height = parseInt(heightSlider.value, 10);
        }

        // --- Options 2D (ECC/version/encodage/aztec/pdf417/dmFormat) ---
        const caps = getCaps(bcid);
        if (caps) {
            // Demande `version` (obligatoire pour MicroQR ; ignoré sinon)
            // Toujours envoyer une `version` sur QR family : 0 = auto.
            const vers = parseInt(versionSlider.value, 10);
            if (vers > 0) {
                opts.version = vers;
            }          // bwip-js côté qrcode accepte version=1..40
            // bwip-js `ecclevel` pour QR family (ignore si pas pertinent)
            opts.eclevel = eccSelect.value;
            // encoding ignore si "auto"
            if (parseCb && parseCb.checked) {
                opts.parse = true;
            }
            // Aztec ec_data pus % (bwip-js côté aztec utilise processTilde & ec)
            if (caps.aztecEcc) {
                opts.eclevel = parseInt(aztecEccSlider.value, 10);
            }
            // PDF417 ECC
            // =gb bwipp/pdf417, option `security level` (0-8)
            if (caps.pdf417Ecc) {
                opts.eclevel = parseInt(pdf417EccSlider.value, 10);
            }
            const cols = parseInt(pdf417ColsSlider.value, 10);
            if (caps.pdf417Columns && cols > 0) {
                opts.columns = cols;
            }
            // DataMatrix si format forfire
            if (caps.dmFormat && dmFormatSelect.value) {
                opts.format = dmFormatSelect.value;
            }
        }

        return {
            ...opts,
            ...parseAdvanced(addtextInput.value),
        };
    }

    // Genere le code-barres sur le canvas
    function generate() {
        clearError();
        const bcid   = typeSelect.value;
        const text   = normalizeText(bcid, textInput.value);
        if (!text) {
            showError("Veuillez saisir les données à encoder.");
            return;
        }

        const baseOpts = buildOpts(bcid, text, 1);
        let scaleToUse;
        if (autofitCb && autofitCb.checked) {
            scaleToUse = computeFitScale(bcid, text, baseOpts);
            lastFitScale = scaleToUse;
            scaleSlider.value = String(scaleToUse);
            scaleValue.textContent = scaleToUse;
        } else {
            scaleToUse = parseInt(scaleSlider.value, 10);
        }
        const opts = buildOpts(bcid, text, scaleToUse);

        try {
            bwipjs.toCanvas(canvas, opts);
            const meta = BCID_META[bcid] || {};
            const px = `${canvas.width} × ${canvas.height} px`;
            const scaleK = opts.scale != null ? `×${opts.scale}` : "";
            infoEl.textContent = `${meta.name || bcid} — ${meta.desc || ""} | ${px}${scaleK ? " (scale " + scaleK + ")" : ""}`.trim();
            infoEl.classList.remove("hidden");
            hintEl.textContent = readerHint(bcid);
            resetView();
            centerCanvas();
        } catch (err) {
            showError(formatBwipError(err, bcid));
            canvas.width = 300; canvas.height = 1;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            resetView();
        }
    }

    function readerHint(bcid) {
        const meta = BCID_META[bcid] || {};
        const cs = { numeric:"Numérique", ascii:"ASCII", latin1:"Latin-1", bytes:"Octets (binaire)", any:"Toute chaîne" }[meta.charset] || "Variable";
        return `Jeu de caractères attendu : ${cs}`;
    }

    function formatBwipError(err, bcid) {
        let msg = err && err.message ? err.message : String(err);
        // bwip-js renvoie souvent des messages techniques mais précis
        if (/bwipp\.[^:]+:\s*(.+)/.test(msg)) {
            const m = msg.match(/bwipp\.[^:]+:\s*(.+)/);
            if (m) msg = m[1];
        }
        return `Erreur [${bcid}] : ${msg}`;
    }

    function downloadPNG() {
        if (!canvas.width || !canvas.height) {
            showError("Générez d'abord un code-barres.");
            return;
        }
        canvas.toBlob((blob) => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `barcode_${typeSelect.value}_${Date.now()}.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }, "image/png");
    }

    function downloadSVG() {
        clearError();
        const bcid = typeSelect.value;
        const text = normalizeText(bcid, textInput.value);
        if (!text) { showError("Veuillez saisir les données."); return; }
        const opts = buildOpts(bcid, text);
        try {
            const svg = bwipjs.toSVG(opts);
            const blob = new Blob([svg], { type: "image/svg+xml" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `barcode_${bcid}_${Date.now()}.svg`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        } catch (err) {
            showError(formatBwipError(err, bcid));
        }
    }

    async function copyImage() {
        if (!canvas.width || !canvas.height) {
            showError("Générez d'abord un code-barres.");
            return;
        }
        try {
            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                    copyBtn.textContent = "✓";
                    setTimeout(() => copyBtn.textContent = "📋", 1000);
                } catch (e) {
                    showError("Copie non supportée par ce navigateur.");
                }
            }, "image/png");
        } catch (e) {
            showError("Échec de la copie.");
        }
    }

    // Listeners
    scaleSlider.addEventListener("input", () => scaleValue.textContent = scaleSlider.value);
    heightSlider.addEventListener("input", () => heightValue.textContent = heightSlider.value);
    padxSlider.addEventListener("input", () => padxValue.textContent = padxSlider.value);
    padySlider.addEventListener("input", () => padyValue.textContent = padySlider.value);
    versionSlider.addEventListener("input", () => versionValue.textContent = versionSlider.value);
    aztecEccSlider.addEventListener("input", () => aztecEccValue.textContent = aztecEccSlider.value);
    pdf417EccSlider.addEventListener("input", () => pdf417EccValue.textContent = pdf417EccSlider.value);
    pdf417ColsSlider.addEventListener("input", () => pdf417ColsValue.textContent = pdf417ColsSlider.value);
    typeSelect.addEventListener("change", () => {
        updateHeightVisibility();
        update2DOptions();
    });
    generateBtn.addEventListener("click", generate);
    pngBtn.addEventListener("click", downloadPNG);
    svgBtn.addEventListener("click", downloadSVG);
    copyBtn.addEventListener("click", copyImage);

    // Toggle Auto-fit on/off : active/desactive le slider Echelle et
    // regenere immediatement pour appliquer le nouveau mode.
    function updateScaleControlState() {
        const isAuto = autofitCb && autofitCb.checked;
        scaleSlider.disabled = isAuto;
        scaleSlider.parentElement.style.opacity = isAuto ? "0.6" : "1";
    }
    if (autofitCb) {
        autofitCb.addEventListener("change", () => {
            updateScaleControlState();
            clearTimeout(debounce);
            debounce = setTimeout(generate, 120);
        });
    }

    // Régénération auto sur changement de paramètres (debounce léger)
    let debounce;
    [scaleSlider, heightSlider, padxSlider, padySlider, versionSlider, aztecEccSlider, pdf417EccSlider, pdf417ColsSlider, rotateSelect, includeSelect, fgInput, bgInput, addtextInput, textInput].forEach(el => {
        el.addEventListener("input", () => {
            clearTimeout(debounce);
            debounce = setTimeout(generate, 180);
        });
    });
    // select interfaces triggers debounce
    [typeSelect, eccSelect, parseCb, dmFormatSelect].forEach(el => {
        el.addEventListener("change", () => {
            clearTimeout(debounce);
            debounce = setTimeout(generate, 180);
        });
    });

    // Recalcul du scale auto en cas de redimensionnement du viewport
    // (responsive / rotation / ouverture-fermeture devtools...).
    if (viewport && typeof ResizeObserver !== "undefined") {
        let roDebounce;
        const ro = new ResizeObserver(() => {
            if (!autofitCb || !autofitCb.checked) return;
            clearTimeout(roDebounce);
            roDebounce = setTimeout(generate, 200);
        });
        ro.observe(viewport);
    }

    // État initial de l'UI + génération
    setupZoomPan();
    updateHeightVisibility();
    update2DOptions();
    updateScaleControlState();
    generate();
}
