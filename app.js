/* =========================================================
   BWG BOOKSWAGON LABEL STUDIO
   FULL UPDATED JAVASCRIPT
   Compatible with updated HTML + CSS
   ========================================================= */

"use strict";


/* =========================================================
   GLOBAL STATE
   ========================================================= */

const state = {

    activeTool: "coco",

    coco: {
        mode: "manual",
        excelRows: [],
        excelHeaders: []
    },

    other: {
        mode: "manual",
        excelRows: [],
        excelHeaders: []
    },

    isbn: {
        mode: "manual",
        excelRows: [],
        excelHeaders: []
    },

    address: {
        mode: "manual",
        excelRows: [],
        excelHeaders: []
    }

};


/* =========================================================
   SHORT HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


function getValue(id, fallback = "") {

    const el = $(id);

    if (!el) {
        return fallback;
    }

    return String(el.value ?? "").trim();
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function sleep(ms) {

    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "green") {

    const container = $("toast");

    if (!container) {
        return;
    }

    const item =
        document.createElement("div");

    item.className =
        type === "red"
            ? "toast-item toast-red"
            : "toast-item toast-green";

    item.textContent = message;

    container.appendChild(item);

    setTimeout(() => {

        item.style.opacity = "0";

        item.style.transform =
            "translateX(100%)";

        setTimeout(() => {
            item.remove();
        }, 250);

    }, 2600);

}


/* =========================================================
   RENDER ALL PREVIEWS
   ========================================================= */

function renderAll() {

    renderCoco();
    renderOther();
    renderISBN();
    renderAddress();
    updateLabelCountBadges();

}


/* =========================================================
   TOOL SWITCHING
   ========================================================= */

document
.querySelectorAll(".tool")
.forEach(button => {

    button.addEventListener("click", () => {

        const tool =
            button.dataset.tool;

        if (!tool) {
            return;
        }

        state.activeTool =
            tool;

        document
        .querySelectorAll(".tool")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item === button
            );

        });


        document
        .querySelectorAll(".panel")
        .forEach(panel => {

            panel.classList.toggle(
                "active",
                panel.id === `${tool}Panel`
            );

        });


        renderAll();

    });

});


/* =========================================================
   CREATE 20 MANUAL INPUT BOXES
   ========================================================= */

function createManualInputs(
    containerId,
    className,
    label
) {

    const container =
        $(containerId);

    if (!container) {
        return;
    }

    container.innerHTML = "";

    for (let i = 1; i <= 20; i++) {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "field";

        wrapper.innerHTML = `

            <label>
                ${label} ${i}
            </label>

            <input
                type="text"
                class="${className}"
                data-index="${i}"
                placeholder="Enter ${label}"
                autocomplete="off"
            >

        `;

        container.appendChild(wrapper);

    }

}


createManualInputs(
    "cocoManualGrid",
    "cocoManual",
    "PO"
);


createManualInputs(
    "otherManualGrid",
    "otherManual",
    "PO"
);


createManualInputs(
    "isbnManualGrid",
    "isbnManual",
    "ISBN"
);


/* =========================================================
   MODE BUTTONS
   ========================================================= */

function setupModeButtons(
    selector,
    dataAttribute,
    feature
) {

    document
    .querySelectorAll(selector)
    .forEach(button => {

        button.addEventListener("click", () => {

            const selectedMode =
                button.dataset[dataAttribute];

            if (!selectedMode) {
                return;
            }

            state[feature].mode =
                selectedMode;


            document
            .querySelectorAll(selector)
            .forEach(item => {

                item.classList.toggle(
                    "active",
                    item === button
                );

            });


            const panelNames = [
                "manual",
                "bulk",
                "excel"
            ];


            panelNames.forEach(name => {

                const first =
                    name.charAt(0)
                    .toUpperCase();

                const id =
                    `${feature}${first}${name.slice(1)}`;

                const panel =
                    $(id);

                if (!panel) {
                    return;
                }

                panel.classList.toggle(
                    "active",
                    name === selectedMode
                );

            });


            showToast(
                `${selectedMode.toUpperCase()} mode enabled.`,
                "green"
            );


            renderAll();

        });

    });

}


setupModeButtons(
    "[data-coco-mode]",
    "cocoMode",
    "coco"
);


setupModeButtons(
    "[data-other-mode]",
    "otherMode",
    "other"
);


setupModeButtons(
    "[data-isbn-mode]",
    "isbnMode",
    "isbn"
);


setupModeButtons(
    "[data-address-mode]",
    "addressMode",
    "address"
);


/* =========================================================
   GET MANUAL VALUES
   ========================================================= */

function getManualValues(className) {

    return [
        ...document.querySelectorAll(
            `.${className}`
        )
    ]
    .map(input =>
        String(input.value || "").trim()
    )
    .filter(Boolean);

}


/* =========================================================
   GET BULK VALUES
   ========================================================= */

function parseCommaSeparated(text) {

    return String(text || "")
        .split(/[,;\n]+/)
        .map(value =>
            value.trim()
        )
        .filter(Boolean);

}


/* =========================================================
   EXCEL COLUMN DETECTION
   ========================================================= */

function normalizeHeader(value) {

    return String(value || "")
        .toLowerCase()
        .replace(/[\s_\-().]/g, "");
}


function findColumnIndex(
    headers,
    possibleNames
) {

    const normalized =
        headers.map(normalizeHeader);


    for (
        const name of possibleNames
    ) {

        const wanted =
            normalizeHeader(name);

        const index =
            normalized.indexOf(wanted);

        if (index !== -1) {
            return index;
        }

    }


    for (
        let i = 0;
        i < normalized.length;
        i++
    ) {

        for (
            const name of possibleNames
        ) {

            const wanted =
                normalizeHeader(name);

            if (
                normalized[i].includes(wanted) ||
                wanted.includes(normalized[i])
            ) {

                return i;

            }

        }

    }


    return -1;

}


/* =========================================================
   COCO PO DATA
   ========================================================= */

function getCocoPOValues() {

    const mode =
        state.coco.mode;


    if (mode === "manual") {

        return getManualValues(
            "cocoManual"
        );

    }


    if (mode === "bulk") {

        return parseCommaSeparated(
            getValue("cocoBulkInput")
        );

    }


    if (mode === "excel") {

        const rows =
            state.coco.excelRows;

        const headers =
            state.coco.excelHeaders;


        if (!rows.length) {
            return [];
        }


        let column =
            findColumnIndex(
                headers,
                [
                    "PO",
                    "PO Number",
                    "PO No",
                    "PONumber",
                    "PONo",
                    "Purchase Order",
                    "Purchase Order Number"
                ]
            );


        if (column === -1) {
            column = 0;
        }


        return rows
        .map(row =>
            String(
                row[column] ?? ""
            ).trim()
        )
        .filter(Boolean);

    }


    return [];

}


/* =========================================================
   OTHER PO DATA
   ========================================================= */

function getOtherPOValues() {

    const mode =
        state.other.mode;


    if (mode === "manual") {

        return getManualValues(
            "otherManual"
        );

    }


    if (mode === "bulk") {

        return parseCommaSeparated(
            getValue("otherBulkInput")
        );

    }


    if (mode === "excel") {

        const rows =
            state.other.excelRows;

        const headers =
            state.other.excelHeaders;


        if (!rows.length) {
            return [];
        }


        let column =
            findColumnIndex(
                headers,
                [
                    "PO",
                    "PO Number",
                    "PO No",
                    "PONumber",
                    "PONo",
                    "Purchase Order",
                    "Purchase Order Number"
                ]
            );


        if (column === -1) {
            column = 0;
        }


        return rows
        .map(row =>
            String(
                row[column] ?? ""
            ).trim()
        )
        .filter(Boolean);

    }


    return [];

}


/* =========================================================
   ISBN DATA
   ========================================================= */

function getISBNValues() {

    const mode =
        state.isbn.mode;


    if (mode === "manual") {

        return getManualValues(
            "isbnManual"
        );

    }


    if (mode === "bulk") {

        return parseCommaSeparated(
            getValue("isbnBulkInput")
        );

    }


    if (mode === "excel") {

        const rows =
            state.isbn.excelRows;

        const headers =
            state.isbn.excelHeaders;


        if (!rows.length) {
            return [];
        }


        let column =
            findColumnIndex(
                headers,
                [
                    "ISBN",
                    "ISBN Number",
                    "ISBN No",
                    "ISBN13",
                    "ISBN-13"
                ]
            );


        if (column === -1) {
            column = 0;
        }


        return rows
        .map(row =>
            String(
                row[column] ?? ""
            ).trim()
        )
        .filter(Boolean);

    }


    return [];

}


/* =========================================================
   COCO RANGE
   ========================================================= */

function getCocoRange() {

    let start =
        parseInt(
            getValue(
                "cocoStartBox",
                "1"
            ),
            10
        );


    let end =
        parseInt(
            getValue(
                "cocoEndBox",
                "1"
            ),
            10
        );


    if (Number.isNaN(start)) {
        start = 1;
    }


    if (Number.isNaN(end)) {
        end = start;
    }


    const error =
        $("cocoRangeError");


    if (start > end) {

        if (error) {

            error.style.display =
                "block";

            error.classList.add("show");

            error.textContent =
                "Start Box Number cannot be greater than End Box Number.";

        }

        return null;

    }


    if (error) {

        error.style.display =
            "none";

        error.classList.remove("show");

    }


    return {
        start,
        end
    };

}


/* =========================================================
   COCO ITEMS
========================================================= */

function getCocoItems() {

    const poValues =
        getCocoPOValues();


    const range =
        getCocoRange();


    if (!range || !poValues.length) {
        return [];
    }


    const result = [];


    poValues.forEach(po => {

        for (
            let box = range.start;
            box <= range.end;
            box++
        ) {

            result.push({
                po,
                box
            });

        }

    });


    return result;

}


/* =========================================================
   COCO CONTENT FREEZE
========================================================= */

function updateCocoCombinedFreeze() {

    const selected =
        document.querySelector(
            'input[name="cocoContent"]:checked'
        );


    const freeze =
        $("cocoFreeze");


    if (!selected || !freeze) {
        return;
    }


    if (
        selected.value ===
        "combined"
    ) {

        freeze.classList.add(
            "show"
        );

        freeze.textContent =
            "🔒 Combined PO + Box selected. PO and Box content are locked together.";

    }
    else {

        freeze.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   COCO CONTENT EVENTS
========================================================= */

document
.querySelectorAll(
    'input[name="cocoFlow"]'
)
.forEach(input => {

    input.addEventListener(
        "change",
        () => renderCoco()
    );

});


document
.querySelectorAll(
    'input[name="cocoContent"]'
)
.forEach(input => {

    input.addEventListener(
        "change",
        () => {

            updateCocoCombinedFreeze();

            renderCoco();

        }
    );

});


/* =========================================================
   COCO RENDER
========================================================= */

function renderCoco() {

    const area =
        $("cocoPreview");


    if (!area) {
        return;
    }


    area.innerHTML = "";


    updateCocoCombinedFreeze();


    const items =
        getCocoItems();


    /*
       IMPORTANT:
       Preview = maximum 5 pages.
       PDF = all pages.
    */

    const labelsPerPage =
        2;


    const totalPages =
        items.length
            ? Math.ceil(
                items.length /
                labelsPerPage
            )
            : 0;


    const previewPages = 1;


    const count =
        $("cocoPageCount");


    if (count) {

        count.textContent =
            `${previewPages} Preview Page${
                previewPages === 1
                    ? ""
                    : "s"
            }`;

    }


    if (!items.length) {

        area.innerHTML = `

            <div
                style="
                width:100%;
                padding:45px 20px;
                text-align:center;
                color:#667085;
                font-size:13px;
                font-weight:700;
                "
            >

                Enter PO data to see preview.

            </div>

        `;

        return;

    }


    const layout =
        document.querySelector(
            'input[name="cocoLayout"]:checked'
        )?.value ||
        "separate";


    const pageType =
        document.querySelector(
            'input[name="cocoPage"]:checked'
        )?.value ||
        "4x6";


    for (
        let pageIndex = 0;
        pageIndex < previewPages;
        pageIndex++
    ) {

        const page =
            createCocoPage(
                items.slice(
                    pageIndex *
                    labelsPerPage,

                    pageIndex *
                    labelsPerPage +
                    labelsPerPage
                ),
                pageType,
                layout
            );


        area.appendChild(page);

    }

    applyOnePagePreviewLimit(area);

}



/* =========================================================
   PER PAGE FONT + BORDER SETTINGS
========================================================= */

function numSetting(id, fallback, min, max) {
    const n = Number(getValue(id, String(fallback)));
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

function getFontCfg(prefix, type) {
    const po = type === "po";
    const p = po ? "Po" : "Box";

    return {
        size: numSetting(`${prefix}${p}FontSize`, po ? 24 : 19, 8, 120),
        opacity: numSetting(`${prefix}${p}Opacity`, 100, 0, 100),
        bold: $(`${prefix}${p}Bold`)?.checked ?? true,
        italic: $(`${prefix}${p}Italic`)?.checked ?? false,
        underline: $(`${prefix}${p}Underline`)?.checked ?? false,
        borderStyle: getValue(`${prefix}${p}BorderStyle`, "double"),
        borderWidth: getValue(`${prefix}${p}BorderWidth`, "3px")
    };
}

function applyLabelSettings(el, cfg) {
    el.style.fontSize = `${cfg.size}px`;
    el.style.opacity = String(cfg.opacity / 100);
    el.style.fontWeight = cfg.bold ? "900" : "400";
    el.style.fontStyle = cfg.italic ? "italic" : "normal";
    el.style.textDecoration = cfg.underline ? "underline" : "none";
    el.style.borderStyle = cfg.borderStyle;
    el.style.borderWidth = cfg.borderStyle === "none" ? "0" : cfg.borderWidth;
    el.style.borderColor = "#222";
    el.style.boxSizing = "border-box";
}

function setupFontSettingListeners() {
    [
        "cocoPoFontSize","cocoPoOpacity","cocoPoBold","cocoPoItalic","cocoPoUnderline",
        "cocoBoxFontSize","cocoBoxOpacity","cocoBoxBold","cocoBoxItalic","cocoBoxUnderline",
        "cocoPoBorderStyle","cocoPoBorderWidth","cocoBoxBorderStyle","cocoBoxBorderWidth",
        "otherPoFontSize","otherPoOpacity","otherPoBold","otherPoItalic","otherPoUnderline",
        "otherBoxFontSize","otherBoxOpacity","otherBoxBold","otherBoxItalic","otherBoxUnderline",
        "otherPoBorderStyle","otherPoBorderWidth","otherBoxBorderStyle","otherBoxBorderWidth"
    ].forEach(id => {
        const el = $(id);
        if (!el) return;
        el.addEventListener("input", renderAll);
        el.addEventListener("change", renderAll);
    });
}


/* =========================================================
   PDF FONT / BORDER HELPERS
========================================================= */

function pdfFontStyle(cfg) {
    if (cfg.bold && cfg.italic) return "bolditalic";
    if (cfg.bold) return "bold";
    if (cfg.italic) return "italic";
    return "normal";
}

function pdfBorder(pdf, x, y, w, h, cfg) {
    if (!cfg || cfg.borderStyle === "none") return;

    const width = Math.max(
        0.3,
        parseFloat(cfg.borderWidth) || 3
    );

    pdf.setLineWidth(width * 0.35);

    if (cfg.borderStyle === "dashed") {
        pdf.setLineDashPattern([3, 2], 0);
    } else if (cfg.borderStyle === "dotted") {
        pdf.setLineDashPattern([0.8, 1.8], 0);
    } else {
        pdf.setLineDashPattern([], 0);
    }

    pdf.rect(x, y, w, h);

    if (cfg.borderStyle === "double") {
        const inset = Math.max(1.1, width * 0.45);
        pdf.rect(
            x + inset,
            y + inset,
            Math.max(0, w - inset * 2),
            Math.max(0, h - inset * 2)
        );
    }

    pdf.setLineDashPattern([], 0);
}


function pdfDrawOne(
    pdf,
    text,
    cfg,
    preferredSize,
    x,
    y,
    availableWidth
) {
    const safeCfg =
        cfg || {
            size: preferredSize,
            opacity: 100,
            bold: false,
            italic: false,
            underline: false,
            borderStyle: "double",
            borderWidth: "3px"
        };

    const maxTextWidth =
        Math.max(
            10,
            Number(availableWidth || 50) * 0.86
        );

    const requestedSize =
        Math.max(
            5,
            Number(
                safeCfg.size
            ) || Number(preferredSize) || 10
        );

    const finalSize =
        pdfTextWithStyle(
            pdf,
            String(text),
            x,
            y,
            safeCfg,
            requestedSize,
            maxTextWidth
        );

    pdf.setFont(
        "helvetica",
        pdfFontStyle(safeCfg)
    );

    pdf.setFontSize(
        finalSize
    );

    const textWidth =
        Math.min(
            maxTextWidth,
            Math.max(
                12,
                pdf.getTextWidth(
                    String(text)
                ) + 8
            )
        );

    const textHeight =
        Math.max(
            8,
            finalSize * 0.55
        );

    pdfBorder(
        pdf,
        x - textWidth / 2,
        y - textHeight * 0.72,
        textWidth,
        textHeight,
        safeCfg
    );

    return finalSize;
}

function pdfTextWithStyle(pdf, text, x, y, cfg, size, maxWidth) {
    const style = pdfFontStyle(cfg);

    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);

    let output = String(text);

    while (
        maxWidth &&
        pdf.getTextWidth(output) > maxWidth &&
        size > 5
    ) {
        size -= 0.5;
        pdf.setFontSize(size);
    }

    pdf.setTextColor(0, 0, 0);
    pdf.text(output, x, y, { align: "center" });

    if (cfg.opacity < 100) {
        // jsPDF does not have a universal opacity API across versions.
        // Keep the setting visually represented without breaking PDF output.
        // The browser preview applies exact opacity.
    }

    if (cfg.underline) {
        const tw = pdf.getTextWidth(output);
        pdf.setLineWidth(0.35);
        pdf.line(
            x - tw / 2,
            y + 1.2,
            x + tw / 2,
            y + 1.2
        );
    }

    return size;
}

/* =========================================================
   LABEL FLOW HELPERS
========================================================= */

function getCocoFlow() {
    return document.querySelector(
        'input[name="cocoFlow"]:checked'
    )?.value || "ltr";
}

function getOtherFlow() {
    return document.querySelector(
        'input[name="otherFlow"]:checked'
    )?.value || "ltr";
}


/* =========================================================
   CREATE COCO PAGE
========================================================= */



function createCocoPage(
    items,
    pageType,
    layout
) {

    const page =
        document.createElement("div");


    let pageClass =
        "page-4x6";


    if (pageType === "a4") {

        pageClass =
            "page-a4";

    }
    else if (
        pageType === "70x35"
    ) {

        pageClass =
            "page-70x35";

    }


    page.className =
        `preview-page ${pageClass}`;


    page.style.display =
        "grid";

    const flow =
        getCocoFlow();

    if (flow === "ttb") {
        page.style.gridTemplateColumns =
            "1fr";

        page.style.gridTemplateRows =
            `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`;

        page.style.gridAutoFlow =
            "row";
    }
    else {
        page.style.gridTemplateColumns =
            `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`;

        page.style.gridTemplateRows =
            "1fr";

        page.style.gridAutoFlow =
            "column";
    }


    items.forEach(item => {

        const label =
            document.createElement("div");


        label.className =
            "coco-label";


        const wrapper =
            document.createElement("div");


        wrapper.className =
            layout === "same"
                ? "label-same"
                : "label-separate";


        const po =
            document.createElement("div");


        po.className =
            "po-label";


        po.textContent =
            `${getValue(
                "cocoPoPrefix"
            )}${item.po}`;

        applyLabelSettings(
            po,
            getFontCfg("coco", "po")
        );


        applyFinalPOBoxSliderStyles("coco", po, null);
        const box =
            document.createElement("div");


        box.className =
            "box-label";


        box.textContent =
            `${getValue(
                "cocoBoxPrefix",
                "BOX NO. "
            )}${item.box}`;

        applyLabelSettings(
            box,
            getFontCfg("coco", "box")
        );

        applyFinalPOBoxSliderStyles("coco", null, box);


        const content =
            document.querySelector(
                'input[name="cocoContent"]:checked'
            )?.value ||
            "combined";


        if (content === "po") {

            wrapper.appendChild(
                po
            );

        }
        else if (content === "box") {

            wrapper.appendChild(
                box
            );

        }
        else {

            arrangePoBox(wrapper, po, box, "coco");

        }


        addPOBarcodeToLabel(
            label,
            "coco",
            `${getValue("cocoPoPrefix")}${item.po}`,
            wrapper
        );


        page.appendChild(
            label
        );

    });


    return page;

}


/* =========================================================
   OTHER PO RENDER
========================================================= */

function renderOther() {

    const area =
        $("otherPreview");


    if (!area) {
        return;
    }


    area.innerHTML = "";


    const values =
        getOtherPOValues();


    const labelsPerPage =
        10;


    const totalPages =
        values.length
            ? Math.ceil(
                values.length /
                labelsPerPage
            )
            : 0;


    const previewPages = 1;


    const count =
        $("otherPageCount");


    if (count) {

        count.textContent =
            `${previewPages} Preview Page${
                previewPages === 1
                    ? ""
                    : "s"
            }`;

    }


    if (!values.length) {

        area.innerHTML = `

            <div
                style="
                width:100%;
                padding:45px 20px;
                text-align:center;
                color:#667085;
                font-size:13px;
                font-weight:700;
                "
            >

                Enter PO data to see preview.

            </div>

        `;

        return;

    }


    for (
        let pageIndex = 0;
        pageIndex < previewPages;
        pageIndex++
    ) {

        const page =
            document.createElement("div");


        page.className =
            "preview-page page-a4";


        page.style.display =
            "grid";

        const flow =
            getOtherFlow();

        page.style.gridTemplateColumns =
            "1fr 1fr";

        page.style.gridTemplateRows =
            "repeat(5, 1fr)";

        page.style.gridAutoFlow =
            flow === "ttb"
                ? "column"
                : "row";


        const pageValues =
            values.slice(
                pageIndex *
                labelsPerPage,

                pageIndex *
                labelsPerPage +
                labelsPerPage
            );


        pageValues.forEach(
            (po, index) => {

                const label =
                    document.createElement("div");


                label.className =
                    "coco-label";


                const wrapper =
                    document.createElement("div");


                wrapper.className =
                    "label-separate";


                const poLabel =
                    document.createElement("div");


                poLabel.className =
                    "po-label";


                poLabel.textContent =
                    `${getValue(
                        "otherPoPrefix"
                    )}${po}`;

                applyLabelSettings(
                    poLabel,
                    getFontCfg("other", "po")
                );

                applyFinalPOBoxSliderStyles("other", poLabel, null);


                const boxLabel =
                    document.createElement("div");


                boxLabel.className =
                    "box-label";


                const startBox =
                    parseInt(
                        getValue(
                            "otherStartBox",
                            "1"
                        ),
                        10
                    ) || 1;


                const boxNumber =
                    startBox +
                    pageIndex *
                    labelsPerPage +
                    index;


                boxLabel.textContent =
                    `${getValue(
                        "otherBoxPrefix",
                        "BOX NO. "
                    )}${boxNumber}`;

                applyLabelSettings(
                    boxLabel,
                    getFontCfg("other", "box")
                );

                applyFinalPOBoxSliderStyles("other", null, boxLabel);


                arrangePoBox(wrapper, poLabel, boxLabel, "other");


                addPOBarcodeToLabel(
                    label,
                    "other",
                    poLabel.textContent,
                    wrapper
                );


                page.appendChild(
                    label
                );

            }
        );


        area.appendChild(
            page
        );

        applyFinalPageDecor(page, "other");
        applyPreviewPageSize(page, "other");

    }

    applyOnePagePreviewLimit(area);

}


/* =========================================================
   ISBN RENDER
========================================================= */

function getCleanISBN(value) {

    return String(value || "")
        .replace(/[^\dXx]/g, "");

}


function makeBarcode(
    isbn
) {

    const clean =
        getCleanISBN(isbn);


    if (!clean) {
        return "";
    }


    let bars = "";


    /*
       Visual barcode representation.
       This keeps the preview and PDF
       independent from external barcode
       image services.
    */

    for (
        let i = 0;
        i < 125;
        i++
    ) {

        const digit =
            Number(
                clean[
                    i % clean.length
                ]
            ) || 0;


        const width =
            1 +
            (
                digit +
                i * 7
            ) % 3;


        bars += `

            <span
                style="
                display:block;
                flex:0 0 ${width}px;
                width:${width}px;
                height:70px;
                background:#111;
                margin-right:1px;
                "
            ></span>

        `;

    }


    return `

        <div
            style="
            width:100%;
            overflow:hidden;
            display:flex;
            justify-content:center;
            align-items:flex-start;
            height:70px;
            background:#fff;
            "
        >

            ${bars}

        </div>

    `;

}


function renderISBN() {

    const area =
        $("isbnPreview");


    if (!area) {
        return;
    }


    area.innerHTML = "";


    const values =
        getISBNValues();


    const previewCount = Math.min(values.length, getLabelsPerPage("isbn", 10));


    if (!values.length) {

        area.innerHTML = `

            <div
                style="
                width:100%;
                padding:45px 20px;
                text-align:center;
                color:#667085;
                font-size:13px;
                font-weight:700;
                "
            >

                Enter ISBN data to see preview.

            </div>

        `;

        return;

    }


    for (
        let i = 0;
        i < previewCount;
        i++
    ) {

        const isbn =
            values[i];


        const page =
            document.createElement("div");


        page.className =
            "preview-page page-4x6";


        page.style.display =
            "flex";

        page.style.flexDirection =
            "column";

        page.style.alignItems =
            "center";

        page.style.justifyContent =
            "center";

        page.style.gap =
            "16px";

        page.style.padding =
            "30px";


        page.innerHTML = `

            <div
                style="
                font-size:22px;
                font-weight:900;
                word-break:break-all;
                text-align:center;
                "
            >

                ${escapeHTML(isbn)}

            </div>


            <div
                style="
                width:min(80%, 430px);
                padding:14px;
                border:1px solid #222;
                background:#fff;
                "
            >

                ${makeBarcode(isbn)}

            </div>


            <div
                style="
                font-size:12px;
                font-weight:800;
                color:#667085;
                "
            >

                ${escapeHTML(
                    getValue(
                        "isbnType",
                        "EAN-13"
                    )
                )}

            </div>

        `;


        area.appendChild(
            page
        );

        applyFinalPageDecor(page, "isbn");
        applyPreviewPageSize(page, "isbn");

    }

}


/* =========================================================
   ADDRESS DATA
========================================================= */

function getAddressData() {

    const mode =
        state.address.mode;


    if (mode === "manual") {

        return [

            {

                fromName:
                    getValue("fromName"),

                fromPhone:
                    getValue("fromPhone"),

                fromAddress:
                    getValue("fromAddress"),

                toName:
                    getValue("toName"),

                toPhone:
                    getValue("toPhone"),

                toAddress:
                    getValue("toAddress")

            }

        ];

    }


    if (mode === "bulk") {

        return getValue(
            "addressBulkInput"
        )
        .split(/\r?\n/)
        .map(line =>
            line.trim()
        )
        .filter(Boolean)
        .map(line => {

            const parts =
                line.split("|");


            return {

                fromName: "",

                fromPhone: "",

                fromAddress:
                    String(
                        parts[0] || ""
                    ).trim(),

                toName: "",

                toPhone: "",

                toAddress:
                    parts
                    .slice(1)
                    .join("|")
                    .trim()

            };

        });

    }


    if (mode === "excel") {

        const rows =
            state.address.excelRows;

        const headers =
            state.address.excelHeaders;


        if (!rows.length) {
            return [];
        }


        let fromName =
            findColumnIndex(
                headers,
                [
                    "From Name",
                    "Sender Name",
                    "FromName",
                    "SenderName"
                ]
            );


        let fromPhone =
            findColumnIndex(
                headers,
                [
                    "From Phone",
                    "Sender Phone",
                    "FromPhone",
                    "SenderPhone"
                ]
            );


        let fromAddress =
            findColumnIndex(
                headers,
                [
                    "From Address",
                    "Sender Address",
                    "FromAddress",
                    "SenderAddress"
                ]
            );


        let toName =
            findColumnIndex(
                headers,
                [
                    "To Name",
                    "Receiver Name",
                    "ToName",
                    "ReceiverName"
                ]
            );


        let toPhone =
            findColumnIndex(
                headers,
                [
                    "To Phone",
                    "Receiver Phone",
                    "ToPhone",
                    "ReceiverPhone"
                ]
            );


        let toAddress =
            findColumnIndex(
                headers,
                [
                    "To Address",
                    "Receiver Address",
                    "ToAddress",
                    "ReceiverAddress"
                ]
            );


        /*
           Fallback:
           If columns are not named,
           use:
           0 From Name
           1 From Phone
           2 From Address
           3 To Name
           4 To Phone
           5 To Address
        */

        if (fromName === -1) fromName = 0;
        if (fromPhone === -1) fromPhone = 1;
        if (fromAddress === -1) fromAddress = 2;
        if (toName === -1) toName = 3;
        if (toPhone === -1) toPhone = 4;
        if (toAddress === -1) toAddress = 5;


        return rows.map(row => {

            return {

                fromName:
                    row[fromName] ?? "",

                fromPhone:
                    row[fromPhone] ?? "",

                fromAddress:
                    row[fromAddress] ?? "",

                toName:
                    row[toName] ?? "",

                toPhone:
                    row[toPhone] ?? "",

                toAddress:
                    row[toAddress] ?? ""

            };

        });

    }


    return [];

}


/* =========================================================
   ADDRESS BORDER
========================================================= */

function updateAddressBorderState() {

    const all =
        $("addressAllBorder");

    if (!all) {
        return;
    }


    const individualIds = [

        "addressPageBorder",

        "addressFromBorder",

        "addressToBorder"

    ];


    if (all.checked) {

        individualIds.forEach(id => {

            const input = $(id);

            if (!input) {
                return;
            }

            input.checked = true;

            input.disabled = true;

        });


        showToast(
            "All Border enabled. Individual border settings are frozen.",
            "green"
        );

    }
    else {

        individualIds.forEach(id => {

            const input = $(id);

            if (!input) {
                return;
            }

            input.disabled = false;

        });


        showToast(
            "All Border disabled. Individual border settings are enabled.",
            "red"
        );

    }

}


/* =========================================================
   ADDRESS RENDER
========================================================= */

function renderAddress() {

    const area =
        $("addressPreview");


    if (!area) {
        return;
    }


    area.innerHTML = "";


    const data =
        getAddressData()
        .filter(item =>
            item.fromName ||
            item.fromPhone ||
            item.fromAddress ||
            item.toName ||
            item.toPhone ||
            item.toAddress
        );


    const previewPages = 1;


    const count =
        $("addressPageCount");


    if (count) {

        count.textContent =
            `${previewPages} Preview Page${
                previewPages === 1
                    ? ""
                    : "s"
            }`;

    }


    if (!data.length) {

        area.innerHTML = `

            <div
                style="
                width:100%;
                padding:45px 20px;
                text-align:center;
                color:#667085;
                font-size:13px;
                font-weight:700;
                "
            >

                Enter From and To address data to see preview.

            </div>

        `;

        return;

    }


    const pageBorder =
        $("addressPageBorder")?.checked;


    const fromBorder =
        $("addressFromBorder")?.checked;


    const toBorder =
        $("addressToBorder")?.checked;


    for (
        let i = 0;
        i < previewPages;
        i++
    ) {

        const item =
            data[i];


        const page =
            document.createElement("div");


        page.className =
            "preview-page page-4x6";


        page.style.display =
            "flex";

        page.style.alignItems =
            "center";

        page.style.justifyContent =
            "center";


        const card =
            document.createElement("div");


        card.className =
            "address-preview-card";


        if (!pageBorder) {

            card.style.border =
                "none";

        }


        const from =
            document.createElement("div");


        from.className =
            "address-from";


        if (!fromBorder) {

            from.style.border =
                "none";

        }


        from.innerHTML = `

            <div class="address-label-title">
                📤 FROM
            </div>

            <div class="address-name">
                ${escapeHTML(
                    item.fromName ||
                    "Sender Name"
                )}
            </div>

            <div class="address-phone">
                ${escapeHTML(
                    item.fromPhone ||
                    ""
                )}
            </div>

            <div class="address-text">
                ${escapeHTML(
                    item.fromAddress ||
                    "Sender Address"
                )}
            </div>

        `;


        const to =
            document.createElement("div");


        to.className =
            "address-to";


        if (!toBorder) {

            to.style.border =
                "none";

        }


        to.innerHTML = `

            <div class="address-label-title">
                📥 TO
            </div>

            <div class="address-name">
                ${escapeHTML(
                    item.toName ||
                    "Receiver Name"
                )}
            </div>

            <div class="address-phone">
                ${escapeHTML(
                    item.toPhone ||
                    ""
                )}
            </div>

            <div class="address-text">
                ${escapeHTML(
                    item.toAddress ||
                    "Receiver Address"
                )}
            </div>

        `;


        card.append(
            from,
            to
        );


        page.appendChild(
            card
        );


        area.appendChild(
            page
        );

        applyFinalPageDecor(page, "address");
        applyPreviewPageSize(page, "address");

    }

    applyOnePagePreviewLimit(area);

}


/* =========================================================
   EXCEL TABLE RENDER
========================================================= */

function renderExcelTable(
    rows,
    headers,
    successId,
    tableId,
    headId,
    bodyId
) {

    const success =
        $(successId);

    const table =
        $(tableId);

    const head =
        $(headId);

    const body =
        $(bodyId);


    if (
        !success ||
        !table ||
        !head ||
        !body
    ) {
        return;
    }


    success.style.display =
        "block";


    success.innerHTML = `

        ✅ Your Excel file is uploaded successfully.

        <br>

        📊 Rows:
        <strong>
            ${rows.length}
        </strong>

        &nbsp; · &nbsp;

        📑 Columns:
        <strong>
            ${headers.length}
        </strong>

    `;


    table.classList.add(
        "show"
    );


    head.innerHTML = `

        <tr>

            <th>
                #
            </th>

            ${
                headers
                .map(header => `
                    <th>
                        ${escapeHTML(
                            header
                        )}
                    </th>
                `)
                .join("")
            }

        </tr>

    `;


    body.innerHTML =
        rows
        .slice(0, 50)
        .map((row, index) => `

            <tr>

                <td>
                    ${index + 1}
                </td>

                ${
                    headers
                    .map((_, colIndex) => `
                        <td>
                            ${escapeHTML(
                                row[colIndex] ?? ""
                            )}
                        </td>
                    `)
                    .join("")
                }

            </tr>

        `)
        .join("");

}


/* =========================================================
   EXCEL READER
========================================================= */

function readExcelFile(
    file,
    feature,
    successId,
    tableId,
    headId,
    bodyId
) {

    if (!file) {
        return;
    }


    if (
        typeof XLSX ===
        "undefined"
    ) {

        showToast(
            "Excel library is not loaded.",
            "red"
        );

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
    event => {

        try {

            const workbook =
                XLSX.read(
                    event.target.result,
                    {
                        type: "array"
                    }
                );


            if (
                !workbook.SheetNames.length
            ) {

                throw new Error(
                    "No worksheet found."
                );

            }


            const sheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];


            const matrix =
                XLSX.utils.sheet_to_json(
                    sheet,
                    {
                        header: 1,
                        defval: ""
                    }
                );


            if (!matrix.length) {

                throw new Error(
                    "Excel file is empty."
                );

            }


            const headers =
                matrix[0].map(
                    value =>
                        String(
                            value ?? ""
                        ).trim()
                );


            const rows =
                matrix
                .slice(1)
                .filter(row =>
                    row.some(value =>
                        String(
                            value ?? ""
                        ).trim() !== ""
                    )
                );


            state[feature].excelHeaders =
                headers;

            state[feature].excelRows =
                rows;


            renderExcelTable(
                rows,
                headers,
                successId,
                tableId,
                headId,
                bodyId
            );


            showToast(
                `Excel uploaded successfully. ${rows.length} rows found.`,
                "green"
            );


            renderAll();

        }
        catch (error) {

            console.error(
                "Excel Error:",
                error
            );


            showToast(
                "Unable to read Excel file. Please check the file format.",
                "red"
            );

        }

    };


    reader.onerror =
    () => {

        showToast(
            "Excel file could not be opened.",
            "red"
        );

    };


    reader.readAsArrayBuffer(
        file
    );

}


/* =========================================================
   EXCEL INPUT EVENTS
========================================================= */

function setupExcelInput(
    inputId,
    feature,
    successId,
    tableId,
    headId,
    bodyId
) {

    const input =
        $(inputId);


    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        event => {

            const file =
                event.target.files?.[0];


            if (!file) {
                return;
            }


            readExcelFile(
                file,
                feature,
                successId,
                tableId,
                headId,
                bodyId
            );

        }
    );

}


setupExcelInput(
    "cocoExcelFile",
    "coco",
    "cocoExcelSuccess",
    "cocoExcelTable",
    "cocoExcelHead",
    "cocoExcelBody"
);


setupExcelInput(
    "otherExcelFile",
    "other",
    "otherExcelSuccess",
    "otherExcelTable",
    "otherExcelHead",
    "otherExcelBody"
);


setupExcelInput(
    "isbnExcelFile",
    "isbn",
    "isbnExcelSuccess",
    "isbnExcelTable",
    "isbnExcelHead",
    "isbnExcelBody"
);


setupExcelInput(
    "addressExcelFile",
    "address",
    "addressExcelSuccess",
    "addressExcelTable",
    "addressExcelHead",
    "addressExcelBody"
);


/* =========================================================
   ADDRESS ALL BORDER
========================================================= */

const allBorder =
    $("addressAllBorder");


if (allBorder) {

    allBorder.addEventListener(
        "change",
        () => {

            updateAddressBorderState();

            renderAddress();

        }
    );

}


[
    "addressPageBorder",
    "addressFromBorder",
    "addressToBorder"
]
.forEach(id => {

    const input =
        $(id);

    if (!input) {
        return;
    }

    input.addEventListener(
        "change",
        renderAddress
    );

});


/* =========================================================
   LIVE INPUT LISTENER
========================================================= */

document.addEventListener(
    "input",
    event => {

        const target =
            event.target;


        if (
            target.closest(
                "#cocoPanel"
            )
        ) {

            renderCoco();

        }


        if (
            target.closest(
                "#otherPanel"
            )
        ) {

            renderOther();

        }


        if (
            target.closest(
                "#isbnPanel"
            )
        ) {

            renderISBN();

        }


        if (
            target.closest(
                "#addressPanel"
            )
        ) {

            renderAddress();

        }

    }
);


/* =========================================================
   CHANGE LISTENER
========================================================= */

document.addEventListener(
    "change",
    event => {

        const target =
            event.target;


        if (
            target.closest(
                "#cocoPanel"
            )
        ) {

            renderCoco();

        }


        if (
            target.closest(
                "#otherPanel"
            )
        ) {

            renderOther();

        }


        if (
            target.closest(
                "#isbnPanel"
            )
        ) {

            renderISBN();

        }


        if (
            target.closest(
                "#addressPanel"
            )
        ) {

            renderAddress();

        }

    }
);


/* =========================================================
   WAIT FOR FONTS / RENDER
========================================================= */

async function waitForRendering() {

    if (
        document.fonts &&
        document.fonts.ready
    ) {

        try {

            await document.fonts.ready;

        }
        catch (_) {}

    }


    await sleep(150);


    await new Promise(
        requestAnimationFrame
    );

}


/* =========================================================
   PREPARE CLONE FOR PDF
========================================================= */

function createPDFClone(
    page
) {

    const clone =
        page.cloneNode(true);


    clone.style.position =
        "relative";

    clone.style.left =
        "auto";

    clone.style.top =
        "auto";

    clone.style.width =
        `${page.offsetWidth}px`;

    clone.style.height =
        `${page.offsetHeight}px`;

    clone.style.maxWidth =
        "none";

    clone.style.margin =
        "0";

    clone.style.boxShadow =
        "none";

    clone.style.background =
        "#ffffff";


    return clone;

}


/* =========================================================
   DOWNLOAD PDF
========================================================= */

function getCocoPDFPageSize() {
    const cfg=getPageSizeConfig("coco");
    return {
        width: cfg.widthIn * 25.4,
        height: cfg.heightIn * 25.4
    };
}

function fitPDFText(pdf, text, maxWidth, startSize, minSize = 8) {
    let size = startSize;
    const value = String(text ?? "");
    while (size > minSize) {
        pdf.setFontSize(size);
        if (pdf.getTextWidth(value) <= maxWidth) break;
        size -= 1;
    }
    return size;
}

function drawCenteredPDFText(pdf, text, x, y, maxWidth, startSize, minSize = 7) {
    const value = String(text ?? "");
    const size = fitPDFText(pdf, value, maxWidth, startSize, minSize);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(size);
    pdf.text(value, x, y, { align: "center" });
    return size;
}


/* =========================================================
   ROBUST PDF FILE SAVE
   Uses the browser File System Access API when available.
   The save dialog opens during the original button click,
   before the large PDF is generated, so Chrome does not
   block the eventual file write.
========================================================= */

async function prepareBWGPDFSave(filename){

    if(
        typeof window.showSaveFilePicker === "function"
    ){
        try{

            const safeName =
                String(
                    filename ||
                    "BWG-Labels.pdf"
                ).replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );

            const handle =
                await window.showSaveFilePicker({
                    suggestedName: safeName,
                    types: [
                        {
                            description: "PDF document",
                            accept: {
                                "application/pdf": [
                                    ".pdf"
                                ]
                            }
                        }
                    ]
                });

            return {
                type: "picker",
                handle
            };

        }catch(error){

            if(
                error &&
                error.name ===
                    "AbortError"
            ){
                return {
                    type: "cancelled"
                };
            }

            console.warn(
                "Save picker unavailable:",
                error
            );
        }
    }

    return {
        type: "download"
    };
}

async function finishBWGPDFSave(
    saveTarget,
    pdfBlob,
    filename
){

    if(
        !pdfBlob ||
        !pdfBlob.size
    ){
        throw new Error(
            "PDF file is empty."
        );
    }

    if(
        saveTarget?.type ===
            "cancelled"
    ){
        return false;
    }

    if(
        saveTarget?.type ===
            "picker" &&
        saveTarget.handle
    ){

        const writable =
            await saveTarget.handle.createWritable();

        await writable.write(
            pdfBlob
        );

        await writable.close();

        return true;
    }

    /*
     * Fallback for browsers without
     * showSaveFilePicker.
     */
    const url =
        URL.createObjectURL(
            pdfBlob
        );

    const a =
        document.createElement("a");

    a.href = url;
    a.download =
        String(
            filename ||
            "BWG-Labels.pdf"
        ).replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

    a.style.position = "fixed";
    a.style.left = "-9999px";

    document.body.appendChild(a);

    a.click();

    setTimeout(() => {
        try{
            a.remove();
        }catch(_){}

        try{
            URL.revokeObjectURL(url);
        }catch(_){}
    },30000);

    return true;
}

async function downloadCocoVectorPDF(filename) {
    const saveTarget =
        await prepareBWGPDFSave(
            filename
        );

    if(
        saveTarget?.type ===
            "cancelled"
    ){
        showToast(
            "PDF download cancelled.",
            "red"
        );
        return;
    }


    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {
        showToast(
            "PDF engine is not loaded. Please refresh the page.",
            "red"
        );
        return;
    }

    const items = getCocoItems();

    if (!items.length) {
        showToast(
            "Please enter PO data before downloading PDF.",
            "red"
        );
        return;
    }

    const { jsPDF } = window.jspdf;

    const pageSize =
        getCocoPDFPageSize();

    const perPage =
        getLabelsPerPage("coco", 10);

    const totalPages =
        Math.ceil(
            items.length / perPage
        );

    const poBox =
        typeof getPOBoxLayout === "function"
            ? getPOBoxLayout("coco")
            : {
                order: "po-box",
                layout: "separate",
                gap: 10
            };

    const flow =
        typeof getCocoFlow === "function"
            ? getCocoFlow()
            : "ttb";

    const content =
        document.querySelector(
            'input[name="cocoContent"]:checked'
        )?.value || "combined";

    const poPrefix =
        getValue("cocoPoPrefix");

    const boxPrefix =
        getValue(
            "cocoBoxPrefix",
            "BOX NO. "
        );

    const poCfg =
        typeof getFontCfg === "function"
            ? getFontCfg("coco", "po")
            : {
                size: 24,
                opacity: 100,
                bold: true,
                italic: false,
                underline: false,
                borderStyle: "double",
                borderWidth: "3px"
            };

    const boxCfg =
        typeof getFontCfg === "function"
            ? getFontCfg("coco", "box")
            : {
                size: 19,
                opacity: 100,
                bold: true,
                italic: false,
                underline: false,
                borderStyle: "double",
                borderWidth: "3px"
            };

    const pageCfg =
        typeof getPageBorderConfig === "function"
            ? getPageBorderConfig("coco")
            : {
                enabled: true,
                width: 1,
                scissors: true,
                scissorSize: 10
            };

    const width =
        Number(pageSize.width);

    const height =
        Number(pageSize.height);

    if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
    ) {
        showToast(
            "Invalid page size. Please check Page Size settings.",
            "red"
        );
        return;
    }

    const orientation =
        width > height
            ? "landscape"
            : "portrait";

    showToast(
        `Preparing ${totalPages} page PDF...`,
        "green"
    );

    let pdf = null;

    try {

        for (
            let pageIndex = 0;
            pageIndex < totalPages;
            pageIndex++
        ) {

            if (pageIndex === 0) {

                pdf =
                    new jsPDF({
                        orientation,
                        unit: "mm",
                        format: [width, height],
                        compress: true
                    });

            } else {

                pdf.addPage(
                    [width, height],
                    orientation
                );

            }

            /* ---------- PAGE BORDER ---------- */

            if (
                pageCfg.enabled &&
                pageCfg.width > 0
            ) {

                pdf.setLineWidth(
                    Math.max(
                        0.2,
                        pageCfg.width * 0.35
                    )
                );

                pdf.setDrawColor(
                    30,
                    30,
                    30
                );

                pdf.rect(
                    pageCfg.width * 0.35,
                    pageCfg.width * 0.35,
                    width -
                        pageCfg.width * 0.7,
                    height -
                        pageCfg.width * 0.7
                );
            }

            /* ---------- SCISSOR MARKS ---------- */

            if (
                pageCfg.scissors &&
                pageCfg.scissorSize > 0
            ) {

                pdf.setFont(
                    "helvetica",
                    "normal"
                );

                pdf.setFontSize(
                    Math.max(
                        7,
                        pageCfg.scissorSize
                    )
                );

                pdf.text(
                    "x",
                    2,
                    7
                );

                pdf.text(
                    "x",
                    width - 2,
                    7,
                    {
                        align: "right"
                    }
                );

                pdf.text(
                    "x",
                    2,
                    height - 2
                );

                pdf.text(
                    "x",
                    width - 2,
                    height - 2,
                    {
                        align: "right"
                    }
                );
            }

            const pageItems =
                items.slice(
                    pageIndex * perPage,
                    pageIndex * perPage + perPage
                );

            const barcodeUrls =
                isPOBarcodeEnabled("coco")
                    ? await Promise.all(
                        pageItems.map(
                            item =>
                                createPOBarcodeDataURL(
                                    `${poPrefix}${item.po}`
                                )
                        )
                    )
                    : [];

            const slotWidth =
                width / (
                    flow === "ttb"
                        ? Math.ceil(
                            Math.sqrt(perPage)
                        )
                        : Math.ceil(
                            Math.sqrt(perPage)
                        )
                );

            /*
              We use a predictable grid:
              - Top → Bottom fills rows first.
              - Left → Right fills columns first.
            */
            const cols =
                flow === "ttb"
                    ? Math.ceil(
                        Math.sqrt(perPage)
                    )
                    : Math.ceil(
                        Math.sqrt(perPage)
                    );

            const rows =
                Math.ceil(
                    perPage / cols
                );

            const actualSlotWidth =
                width / cols;

            const actualSlotHeight =
                height / rows;

            pageItems.forEach(
                (item, slotIndex) => {

                    let row;
                    let col;

                    if (flow === "ttb") {

                        row =
                            slotIndex % rows;

                        col =
                            Math.floor(
                                slotIndex / rows
                            );

                    } else {

                        col =
                            slotIndex % cols;

                        row =
                            Math.floor(
                                slotIndex / cols
                            );
                    }

                    const centerX =
                        col *
                            actualSlotWidth +
                        actualSlotWidth / 2;

                    const centerY =
                        row *
                            actualSlotHeight +
                        actualSlotHeight / 2;

                    const availableWidth =
                        actualSlotWidth;

                    const availableHeight =
                        actualSlotHeight;

                    const poText =
                        `${poPrefix}${item.po}`;

                    const boxText =
                        `${boxPrefix}${item.box}`;

                    const barcodeURL =
                        barcodeUrls[slotIndex] || null;

                    const showPOBarcode =
                        !!barcodeURL &&
                        content !== "box";

                    /* ---------- PO BARCODE ---------- */

                    if (showPOBarcode) {

                        const barcodeW =
                            Math.min(
                                actualSlotWidth * 0.72,
                                52
                            );

                        const barcodeH = 14;

                        pdf.addImage(
                            barcodeURL,
                            "PNG",
                            centerX - barcodeW / 2,
                            centerY -
                                actualSlotHeight * 0.30,
                            barcodeW,
                            barcodeH
                        );
                    }

                    const textCenterY =
                        showPOBarcode
                            ? centerY +
                                actualSlotHeight * 0.13
                            : centerY;

                    /* ---------- CONTENT ---------- */

                    if (
                        content === "po"
                    ) {

                        pdfDrawOne(
                            pdf,
                            poText,
                            poCfg,
                            availableWidth <= 70
                                ? 13
                                : poCfg.size,
                            centerX,
                            textCenterY
                        );

                        return;
                    }

                    if (
                        content === "box"
                    ) {

                        pdfDrawOne(
                            pdf,
                            boxText,
                            boxCfg,
                            availableWidth <= 70
                                ? 11
                                : boxCfg.size,
                            centerX,
                            textCenterY
                        );

                        return;
                    }

                    /* ---------- SAME LINE ---------- */

                    if (
                        poBox.layout === "same"
                    ) {

                        const gap =
                            Math.max(
                                0,
                                Number(
                                    poBox.gap
                                ) || 0
                            ) * 0.264583;

                        const firstIsBox =
                            poBox.order === "box-po";

                        const firstText =
                            firstIsBox
                                ? boxText
                                : poText;

                        const secondText =
                            firstIsBox
                                ? poText
                                : boxText;

                        const firstCfg =
                            firstIsBox
                                ? boxCfg
                                : poCfg;

                        const secondCfg =
                            firstIsBox
                                ? poCfg
                                : boxCfg;

                        pdf.setFont(
                            "helvetica",
                            pdfFontStyle(
                                firstCfg
                            )
                        );

                        pdf.setFontSize(
                            firstCfg.size
                        );

                        const firstW =
                            Math.min(
                                maxTextWidth * 0.46,
                                pdf.getTextWidth(
                                    firstText
                                ) + 8
                            );

                        pdf.setFont(
                            "helvetica",
                            pdfFontStyle(
                                secondCfg
                            )
                        );

                        pdf.setFontSize(
                            secondCfg.size
                        );

                        const secondW =
                            Math.min(
                                maxTextWidth * 0.46,
                                pdf.getTextWidth(
                                    secondText
                                ) + 8
                            );

                        const totalW =
                            firstW +
                            gap +
                            secondW;

                        pdfDrawOne(
                            pdf,
                            firstText,
                            firstCfg,
                            firstCfg.size,
                            centerX -
                                totalW / 2 +
                                firstW / 2,
                            centerY
                        );

                        pdfDrawOne(
                            pdf,
                            secondText,
                            secondCfg,
                            secondCfg.size,
                            centerX +
                                totalW / 2 -
                                secondW / 2,
                            centerY
                        );

                        return;
                    }

                    /* ---------- SEPARATE LINE ---------- */

                    const gap =
                        Math.max(
                            0,
                            Number(
                                poBox.gap
                            ) || 0
                        ) * 0.264583;

                    const firstIsBox =
                        poBox.order === "box-po";

                    const firstText =
                        firstIsBox
                            ? boxText
                            : poText;

                    const secondText =
                        firstIsBox
                            ? poText
                            : boxText;

                    const firstCfg =
                        firstIsBox
                            ? boxCfg
                            : poCfg;

                    const secondCfg =
                        firstIsBox
                            ? poCfg
                            : boxCfg;

                    const firstSize =
                        Math.min(
                            firstCfg.size,
                            availableWidth <= 70
                                ? 12
                                : firstCfg.size
                        );

                    const secondSize =
                        Math.min(
                            secondCfg.size,
                            availableWidth <= 70
                                ? 10
                                : secondCfg.size
                        );

                    const firstH =
                        Math.max(
                            9,
                            firstSize * 0.55
                        );

                    const secondH =
                        Math.max(
                            9,
                            secondSize * 0.55
                        );

                    const totalH =
                        firstH +
                        gap +
                        secondH;

                    const firstY =
                        textCenterY -
                        totalH / 2 +
                        firstH * 0.68;

                    const secondY =
                        textCenterY -
                        totalH / 2 +
                        firstH +
                        gap +
                        secondH * 0.68;

                    pdfDrawOne(
                            pdf,
                        firstText,
                        firstCfg,
                        firstSize,
                        centerX,
                        firstY
                    );

                    pdfDrawOne(
                            pdf,
                        secondText,
                        secondCfg,
                        secondSize,
                        centerX,
                        secondY
                    );

                }
            );

            if (
                pageIndex % 10 === 0
            ) {
                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            0
                        )
                );
            }
        }

        if (!pdf) {
            throw new Error(
                "PDF document was not created."
            );
        }

        const pdfBlob =
            pdf.output("blob");

        const saved =
            await finishBWGPDFSave(
                saveTarget,
                pdfBlob,
                filename
            );

        if(!saved){
            return;
        }

        showToast(
            `PDF downloaded successfully. ${totalPages} pages.`,
            "green"
        );

    } catch (error) {

        console.error(
            "Coco PDF generation failed:",
            error
        );

        showToast(
            `PDF generation failed: ${
                error?.message ||
                "Unknown error"
            }`,
            "red"
        );
    }
}


async function downloadPDF(
    previewId,
    filename
) {
    let genericSaveTarget = null;

    if(previewId !== "cocoPreview"){
        genericSaveTarget =
            await prepareBWGPDFSave(
                filename
            );

        if(
            genericSaveTarget?.type ===
                "cancelled"
        ){
            showToast(
                "PDF download cancelled.",
                "red"
            );
            return;
        }
    }



    if (previewId === "cocoPreview") {
        await downloadCocoVectorPDF(filename);
        return;
    }

    const source =
        $(previewId);


    if (!source) {

        showToast(
            "Preview area not found.",
            "red"
        );

        return;

    }


    if (
        typeof html2canvas ===
        "undefined"
    ) {

        showToast(
            "PDF renderer is not loaded.",
            "red"
        );

        return;

    }


    if (
        typeof window.jspdf ===
        "undefined"
    ) {

        showToast(
            "jsPDF library is not loaded.",
            "red"
        );

        return;

    }


    /*
       IMPORTANT:
       Do NOT use only the visible 5-page preview.
       PDF generation uses ALL generated pages.
    */

    const pages =
        getAllPDFPages(
            previewId
        );


    if (!pages.length) {

        showToast(
            "Please enter data before downloading PDF.",
            "red"
        );

        return;

    }


    showToast(
        `Preparing ${pages.length} page PDF...`,
        "green"
    );


    try {

        await waitForRendering();


        const {
            jsPDF
        } =
        window.jspdf;


        let pdf = null;


        /*
           Render every page individually.
        */

        for (
            let i = 0;
            i < pages.length;
            i++
        ) {

            const original =
                pages[i];


            /*
               Temporarily make the page
               visible and measurable.
            */

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.style.position =
                "fixed";

            wrapper.style.left =
                "-100000px";

            wrapper.style.top =
                "0";

            wrapper.style.width =
                `${Math.max(
                    original.offsetWidth,
                    700
                )}px`;

            wrapper.style.background =
                "#ffffff";

            wrapper.style.zIndex =
                "-1";


            const clone =
                createPDFClone(
                    original
                );


            wrapper.appendChild(
                clone
            );


            document.body.appendChild(
                wrapper
            );


            await sleep(80);


            const canvas =
                await html2canvas(
                    clone,
                    {
                        scale: 2,

                        useCORS: true,

                        allowTaint: true,

                        backgroundColor:
                            "#ffffff",

                        logging: false,

                        imageTimeout:
                            15000,

                        removeContainer:
                            true
                    }
                );


            wrapper.remove();


            const width =
                canvas.width / 2;

            const height =
                canvas.height / 2;


            const orientation =
                width >= height
                    ? "landscape"
                    : "portrait";


            if (!pdf) {

                pdf =
                    new jsPDF({

                        orientation,

                        unit: "px",

                        format:
                            [width, height],

                        compress: true

                    });

            }
            else {

                pdf.addPage(
                    [width, height],
                    orientation
                );

            }


            const image =
                canvas.toDataURL(
                    "image/jpeg",
                    0.96
                );


            pdf.addImage(
                image,
                "JPEG",
                0,
                0,
                width,
                height,
                undefined,
                "FAST"
            );

        }


        if (!pdf) {

            throw new Error(
                "PDF object was not created."
            );

        }


        const genericBlob =
             pdf.output("blob");

         const saved =
             await finishBWGPDFSave(
                 genericSaveTarget,
                 genericBlob,
                 filename
             );

         if(!saved){
             return;
         }

         showToast(
             `PDF downloaded successfully. ${pages.length} pages.`,
             "green"
         );

    }
    catch (error) {

        console.error(
            "PDF generation failed:",
            error
        );


        showToast(
            "PDF generation failed. Please try again.",
            "red"
        );

    }

}


/* =========================================================
   GET ALL PAGES FOR PDF
   ========================================================= */

function getAllPDFPages(
    previewId
) {

    /*
       The preview itself intentionally
       contains only 5 pages.

       Therefore we temporarily generate
       all pages from the data.
    */

    const pages = [];


    if (
        previewId ===
        "cocoPreview"
    ) {

        const items =
            getCocoItems();


        const perPage =
            2;


        const pageType =
            document.querySelector(
                'input[name="cocoPage"]:checked'
            )?.value ||
            "4x6";


        const layout =
            document.querySelector(
                'input[name="cocoLayout"]:checked'
            )?.value ||
            "separate";


        for (
            let i = 0;
            i < items.length;
            i += perPage
        ) {

            pages.push(
                createCocoPage(
                    items.slice(
                        i,
                        i + perPage
                    ),
                    pageType,
                    layout
                )
            );

        }


        return pages;

    }


    if (
        previewId ===
        "otherPreview"
    ) {

        const values =
            getOtherPOValues();


        const perPage =
            10;


        for (
            let i = 0;
            i < values.length;
            i += perPage
        ) {

            const page =
                document.createElement(
                    "div"
                );


            page.className =
                "preview-page page-a4";


            page.style.display =
                "grid";

            page.style.gridTemplateColumns =
                "1fr 1fr";

            page.style.gridTemplateRows =
                "repeat(5,1fr)";

            page.style.gridAutoFlow =
                getOtherFlow() === "ttb"
                    ? "column"
                    : "row";


            values
            .slice(
                i,
                i + perPage
            )
            .forEach(
                (po, index) => {

                    const label =
                        document.createElement(
                            "div"
                        );


                    label.className =
                        "coco-label";


                    const wrapper =
                        document.createElement(
                            "div"
                        );


                    wrapper.className =
                        "label-separate";


                    const poLabel =
                        document.createElement(
                            "div"
                        );


                    poLabel.className =
                        "po-label";


                    poLabel.textContent =
                        `${getValue(
                            "otherPoPrefix"
                        )}${po}`;

                    applyLabelSettings(
                        poLabel,
                        getFontCfg("other", "po")
                    );


                    const boxLabel =
                        document.createElement(
                            "div"
                        );


                    boxLabel.className =
                        "box-label";


                    const start =
                        parseInt(
                            getValue(
                                "otherStartBox",
                                "1"
                            ),
                            10
                        ) || 1;


                    boxLabel.textContent =
                        `${getValue(
                            "otherBoxPrefix",
                            "BOX NO. "
                        )}${start + i + index}`;

                    applyLabelSettings(
                        boxLabel,
                        getFontCfg("other", "box")
                    );


                    arrangePoBox(wrapper, poLabel, boxLabel, "other");


                    label.appendChild(
                        wrapper
                    );


                    page.appendChild(
                        label
                    );

                }
            );


            pages.push(page);

        }


        return pages;

    }


    if (
        previewId ===
        "isbnPreview"
    ) {

        const values =
            getISBNValues();


        values.forEach(isbn => {

            const page =
                document.createElement(
                    "div"
                );


            page.className =
                "preview-page page-4x6";


            page.style.display =
                "flex";

            page.style.flexDirection =
                "column";

            page.style.justifyContent =
                "center";

            page.style.alignItems =
                "center";

            page.style.gap =
                "16px";

            page.style.padding =
                "30px";


            page.innerHTML = `

                <div
                    style="
                    font-size:22px;
                    font-weight:900;
                    word-break:break-all;
                    text-align:center;
                    "
                >

                    ${escapeHTML(isbn)}

                </div>

                <div
                    style="
                    width:min(80%, 430px);
                    padding:14px;
                    border:1px solid #222;
                    background:#fff;
                    "
                >

                    ${makeBarcode(isbn)}

                </div>

                <div
                    style="
                    font-size:12px;
                    font-weight:800;
                    color:#667085;
                    "
                >

                    ${escapeHTML(
                        getValue(
                            "isbnType",
                            "EAN-13"
                        )
                    )}

                </div>

            `;


            pages.push(
                page
            );

        });


        return pages;

    }


    if (
        previewId ===
        "addressPreview"
    ) {

        const data =
            getAddressData()
            .filter(item =>
                item.fromName ||
                item.fromPhone ||
                item.fromAddress ||
                item.toName ||
                item.toPhone ||
                item.toAddress
            );


        data.forEach(item => {

            const page =
                document.createElement(
                    "div"
                );


            page.className =
                "preview-page page-4x6";


            page.style.display =
                "flex";

            page.style.alignItems =
                "center";

            page.style.justifyContent =
                "center";


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "address-preview-card";


            const pageBorder =
                $("addressPageBorder")
                ?.checked;


            const fromBorder =
                $("addressFromBorder")
                ?.checked;


            const toBorder =
                $("addressToBorder")
                ?.checked;


            if (!pageBorder) {

                card.style.border =
                    "none";

            }


            const from =
                document.createElement(
                    "div"
                );


            from.className =
                "address-from";


            if (!fromBorder) {

                from.style.border =
                    "none";

            }


            from.innerHTML = `

                <div class="address-label-title">
                    📤 FROM
                </div>

                <div class="address-name">
                    ${escapeHTML(
                        item.fromName ||
                        "Sender Name"
                    )}
                </div>

                <div class="address-phone">
                    ${escapeHTML(
                        item.fromPhone ||
                        ""
                    )}
                </div>

                <div class="address-text">
                    ${escapeHTML(
                        item.fromAddress ||
                        "Sender Address"
                    )}
                </div>

            `;


            const to =
                document.createElement(
                    "div"
                );


            to.className =
                "address-to";


            if (!toBorder) {

                to.style.border =
                    "none";

            }


            to.innerHTML = `

                <div class="address-label-title">
                    📥 TO
                </div>

                <div class="address-name">
                    ${escapeHTML(
                        item.toName ||
                        "Receiver Name"
                    )}
                </div>

                <div class="address-phone">
                    ${escapeHTML(
                        item.toPhone ||
                        ""
                    )}
                </div>

                <div class="address-text">
                    ${escapeHTML(
                        item.toAddress ||
                        "Receiver Address"
                    )}
                </div>

            `;


            card.append(
                from,
                to
            );


            page.appendChild(
                card
            );


            pages.push(
                page
            );

        });


        return pages;

    }


    return pages;

}


/* =========================================================
   PRINT
========================================================= */

function printPDF(
    previewId
) {

    const pages =
        getAllPDFPages(
            previewId
        );


    if (!pages.length) {

        showToast(
            "Please enter data before printing.",
            "red"
        );

        return;

    }


    const existing =
        $("printArea");


    if (existing) {
        existing.remove();
    }


    const printArea =
        document.createElement(
            "div"
        );


    printArea.id =
        "printArea";


    pages.forEach(page => {

        const clone =
            createPDFClone(
                page
            );


        clone.style.width =
            "100%";

        clone.style.maxWidth =
            "none";

        clone.style.margin =
            "0";

        clone.style.boxShadow =
            "none";


        printArea.appendChild(
            clone
        );

    });


    document.body.appendChild(
        printArea
    );


    setTimeout(() => {

        window.print();

    }, 500);

}


window.addEventListener(
    "afterprint",
    () => {

        const printArea =
            $("printArea");


        if (printArea) {
            printArea.remove();
        }

    }
);


/* =========================================================
   PDF BUTTONS
========================================================= */

function bindButton(
    id,
    callback
) {

    const button =
        $(id);


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            callback();

        }
    );

}


bindButton(
    "cocoDownload",
    () =>
        downloadPDF(
            "cocoPreview",
            "BWG-Coco-Blue.pdf"
        )
);


bindButton(
    "cocoPrint",
    () =>
        printPDF(
            "cocoPreview"
        )
);


bindButton(
    "otherDownload",
    () =>
        downloadPDF(
            "otherPreview",
            "BWG-Other-PO.pdf"
        )
);


bindButton(
    "otherPrint",
    () =>
        printPDF(
            "otherPreview"
        )
);


bindButton(
    "isbnDownload",
    () =>
        downloadPDF(
            "isbnPreview",
            "BWG-ISBN-Barcodes.pdf"
        )
);


bindButton(
    "isbnPrint",
    () =>
        printPDF(
            "isbnPreview"
        )
);


bindButton(
    "addressDownload",
    () =>
        downloadPDF(
            "addressPreview",
            "BWG-Address-Labels.pdf"
        )
);


bindButton(
    "addressPrint",
    () =>
        printPDF(
            "addressPreview"
        )
);


document
.querySelectorAll(
    'input[name="otherFlow"]'
)
.forEach(input => {

    input.addEventListener(
        "change",
        () => renderOther()
    );

});


setupFontSettingListeners();



/* =========================================================
   FINAL ONE-PAGE PREVIEW + SLIDER + SCISSOR CONTROLS
========================================================= */

function finalRange(id, fallback) {
    const el = $(id);
    if (!el) return fallback;
    const n = Number(el.value);
    return Number.isFinite(n) ? n : fallback;
}

function finalSliderText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
}

function finalPageConfig(prefix) {
    return {
        poSize: finalRange(`${prefix}PoFontSlider`, 24),
        poOpacity: finalRange(`${prefix}PoOpacitySlider`, 100),
        boxSize: finalRange(`${prefix}BoxFontSlider`, 19),
        boxOpacity: finalRange(`${prefix}BoxOpacitySlider`, 100),
        borderWidth: finalRange(`${prefix}PageBorderSlider`, 1),
        scissorSize: finalRange(`${prefix}ScissorSlider`, 10),
        borderEnabled: $(`${prefix}PageBorderEnabled`)?.checked ?? true,
        scissorEnabled: $(`${prefix}ScissorEnabled`)?.checked ?? true
    };
}

function applyFinalPageDecor(page, prefix) {
    const cfg = finalPageConfig(prefix);

    page.classList.add("final-page-border");

    if (cfg.borderEnabled && cfg.borderWidth > 0) {
        page.classList.add("enabled");
        page.style.setProperty(
            "--final-page-border-width",
            `${cfg.borderWidth}px`
        );
    } else {
        page.classList.remove("enabled");
    }

    page.querySelectorAll(".final-scissor").forEach(el => el.remove());

    if (!cfg.scissorEnabled || cfg.scissorSize <= 0) return;

    ["tl","tr","bl","br"].forEach(pos => {
        const mark = document.createElement("span");
        mark.className = `final-scissor ${pos}`;
        mark.textContent = "✂";
        mark.style.fontSize = `${cfg.scissorSize}px`;
        page.appendChild(mark);
    });
}

function applyFinalFontToElement(el, size, opacity) {
    el.style.fontSize = `${size}px`;
    el.style.opacity = String(opacity / 100);
}

function setupFinalSliders(prefix) {
    const bindings = [
        [`${prefix}PoFontSlider`, `${prefix}PoFontSliderValue`, v => `${v} px`],
        [`${prefix}PoOpacitySlider`, `${prefix}PoOpacitySliderValue`, v => `${v}%`],
        [`${prefix}BoxFontSlider`, `${prefix}BoxFontSliderValue`, v => `${v} px`],
        [`${prefix}BoxOpacitySlider`, `${prefix}BoxOpacitySliderValue`, v => `${v}%`],
        [`${prefix}PageBorderSlider`, `${prefix}PageBorderSliderValue`, v => `${v} px`],
        [`${prefix}ScissorSlider`, `${prefix}ScissorSliderValue`, v => `${v} px`]
    ];

    bindings.forEach(([inputId, valueId, formatter]) => {
        const input = $(inputId);
        if (!input) return;

        const update = () => {
            finalSliderText(
                valueId,
                formatter(input.value)
            );
            renderAll();
        };

        input.addEventListener("input", update);
        input.addEventListener("change", update);
        update();
    });

    [`${prefix}PageBorderEnabled`, `${prefix}ScissorEnabled`]
        .forEach(id => {
            const el = $(id);
            if (!el) return;
            el.addEventListener("change", renderAll);
        });
}

/* Replace old font settings for preview with sliders when available. */
function applyFinalPOBoxSliderStyles(prefix, poEl, boxEl) {
    const cfg = finalPageConfig(prefix);

    if (poEl) {
        applyFinalFontToElement(
            poEl,
            cfg.poSize,
            cfg.poOpacity
        );
    }

    if (boxEl) {
        applyFinalFontToElement(
            boxEl,
            cfg.boxSize,
            cfg.boxOpacity
        );
    }
}


setupFinalSliders("coco");
setupFinalSliders("other");
setupFinalSliders("isbn");
setupFinalSliders("address");


/* =========================================================
   LOGIN GATE
========================================================= */

(function setupBWGLogin(){

    const gate = document.getElementById("bwgLoginGate");
    const idInput = document.getElementById("bwgLoginId");
    const passInput = document.getElementById("bwgLoginPassword");
    const btn = document.getElementById("bwgLoginBtn");
    const error = document.getElementById("bwgLoginError");

    if (!gate || !idInput || !passInput || !btn) return;

    const LOGIN_ID = "BWG213";
    const LOGIN_PASSWORD = "D9212";

    function doLogin(){

        const id = idInput.value.trim();
        const password = passInput.value;

        if (id === LOGIN_ID && password === LOGIN_PASSWORD) {
            gate.style.display = "none";
            document.body.classList.remove("bwg-locked");
            sessionStorage.setItem("bwgLabelStudioLoggedIn","1");
            return;
        }

        error.textContent = "Invalid Login ID or Password.";
        passInput.value = "";
        passInput.focus();
    }

    if (
        sessionStorage.getItem("bwgLabelStudioLoggedIn") === "1"
    ) {
        gate.style.display = "none";
        document.body.classList.remove("bwg-locked");
    }

    btn.addEventListener("click", doLogin);

    [idInput, passInput].forEach(input => {
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                doLogin();
            }
        });
    });

    setTimeout(() => {
        if (
            sessionStorage.getItem(
                "bwgLabelStudioLoggedIn"
            ) !== "1"
        ) {
            gate.style.display = "flex";
            document.body.classList.add("bwg-locked");
            idInput.focus();
        }
    }, 0);

})();


/* =========================================================
   LABELS PER PAGE / DIVIDE CONTROLS
========================================================= */

function getLabelsPerPage(prefix, fallback = 10){

    const select = $(`${prefix}LabelsPerPage`);

    if (!select) return fallback;

    if (select.value === "custom") {
        const custom =
            Number(
                getValue(
                    `${prefix}CustomCount`,
                    String(fallback)
                )
            );

        if (
            Number.isFinite(custom) &&
            custom >= 1
        ){
            return Math.min(
                200,
                Math.max(1, Math.floor(custom))
            );
        }

        return fallback;
    }

    const value = Number(select.value);

    return Number.isFinite(value)
        ? Math.max(1, Math.floor(value))
        : fallback;
}

function getDivideMode(prefix){

    return getValue(
        `${prefix}DivideMode`,
        "auto"
    );
}

function setupLabelCountControls(prefix){

    const select =
        $(`${prefix}LabelsPerPage`);

    const customWrap =
        $(`${prefix}CustomCountWrap`);

    const custom =
        $(`${prefix}CustomCount`);

    function refresh(){

        if (!select) return;

        if (customWrap){
            customWrap.classList.toggle(
                "show",
                select.value === "custom"
            );
        }

        renderAll();
    }

    if (select){
        select.addEventListener(
            "change",
            refresh
        );
    }

    if (custom){
        custom.addEventListener(
            "input",
            renderAll
        );

        custom.addEventListener(
            "change",
            renderAll
        );
    }

    const divide =
        $(`${prefix}DivideMode`);

    if (divide){
        divide.addEventListener(
            "change",
            renderAll
        );
    }

    refresh();
}


/* =========================================================
   ONE-PAGE PREVIEW
========================================================= */


function updateLabelCountBadges(){

    const configs = [
        ["coco","cocoPageCount"],
        ["other","otherPageCount"],
        ["isbn","isbnPageCount"],
        ["address","addressPageCount"]
    ];

    configs.forEach(([prefix,badgeId]) => {

        const badge = $(badgeId);
        if (!badge) return;

        const count =
            getLabelsPerPage(prefix, 10);

        badge.textContent =
            `${count} Labels / Page`;

    });
}


function applyOnePagePreviewLimit(container){

    if (!container) return;

    const pages =
        container.querySelectorAll(
            ".preview-page"
        );

    pages.forEach(
        (page,index) => {
            page.style.display =
                index === 0
                    ? ""
                    : "none";
        }
    );
}


setupLabelCountControls("coco");
setupLabelCountControls("other");
setupLabelCountControls("isbn");
setupLabelCountControls("address");


/* =========================================================
   CUSTOM PAGE SIZE
========================================================= */

const BWG_PAGE_SIZES = {
    A4:      { w: 8.27, h: 11.69 },
    "4x6":   { w: 4.00, h: 6.00 },
    "70x35": { w: 70 / 25.4, h: 35 / 25.4 }
};

function getPageSizeConfig(prefix){

    const select =
        $(`${prefix}PageSize`);

    const type =
        select?.value || "4x6";

    if (type !== "CUSTOM") {

        const preset =
            BWG_PAGE_SIZES[type] ||
            BWG_PAGE_SIZES["4x6"];

        return {
            type,
            widthIn: preset.w,
            heightIn: preset.h,
            unit: "in",
            orientation: "portrait"
        };
    }

    let width =
        Number(
            getValue(
                `${prefix}CustomPageWidth`,
                "4"
            )
        );

    let height =
        Number(
            getValue(
                `${prefix}CustomPageHeight`,
                "6"
            )
        );

    if (!Number.isFinite(width) || width <= 0)
        width = 4;

    if (!Number.isFinite(height) || height <= 0)
        height = 6;

    const unit =
        getValue(
            `${prefix}CustomPageUnit`,
            "in"
        );

    const orientation =
        getValue(
            `${prefix}CustomPageOrientation`,
            "portrait"
        );

    let widthIn = width;
    let heightIn = height;

    if (unit === "mm") {
        widthIn = width / 25.4;
        heightIn = height / 25.4;
    }

    if (unit === "cm") {
        widthIn = width / 2.54;
        heightIn = height / 2.54;
    }

    if (orientation === "landscape") {
        [widthIn, heightIn] =
            [heightIn, widthIn];
    }

    return {
        type: "CUSTOM",
        widthIn,
        heightIn,
        unit,
        orientation
    };
}

function applyPreviewPageSize(page, prefix){

    const cfg =
        getPageSizeConfig(prefix);

    page.style.aspectRatio =
        `${cfg.widthIn} / ${cfg.heightIn}`;

    page.dataset.pageWidthIn =
        String(cfg.widthIn);

    page.dataset.pageHeightIn =
        String(cfg.heightIn);
}

function setupPageSizeControls(prefix){

    const select = $(`${prefix}PageSize`);

    const customFields =
        $(`${prefix}CustomSizeFields`);

    const pageSection =
        select?.closest(".bwg-page-size-section");

    const customCards =
        pageSection
            ? pageSection.querySelectorAll(
                ".bwg-custom-only"
            )
            : [];

    function refresh(){

        const isCustom =
            select?.value === "CUSTOM";

        customCards.forEach(card => {
            card.classList.toggle(
                "show",
                isCustom
            );
        });

        if (customFields) {
            customFields.classList.toggle(
                "show",
                isCustom
            );
        }

        if (typeof renderAll === "function") {
            renderAll();
        }
    }

    if (select) {
        select.addEventListener(
            "change",
            refresh
        );
    }

    [
        `${prefix}CustomPageWidth`,
        `${prefix}CustomPageHeight`,
        `${prefix}CustomPageUnit`,
        `${prefix}CustomPageOrientation`
    ].forEach(id => {

        const el = $(id);
        if (!el) return;

        el.addEventListener(
            "input",
            renderAll
        );

        el.addEventListener(
            "change",
            renderAll
        );
    });

    refresh();
}

function getJsPdfPageFormat(prefix){

    const cfg =
        getPageSizeConfig(prefix);

    return {
        format: [
            cfg.widthIn * 25.4,
            cfg.heightIn * 25.4
        ],
        widthMm: cfg.widthIn * 25.4,
        heightMm: cfg.heightIn * 25.4,
        orientation:
            cfg.widthIn > cfg.heightIn
                ? "landscape"
                : "portrait"
    };
}


setupPageSizeControls("coco");
setupPageSizeControls("other");
setupPageSizeControls("isbn");
setupPageSizeControls("address");


/* =========================================================
   PO + BOX ORDER / LINE / GAP
========================================================= */

function getPoBoxArrangement(prefix){

    return {
        order:
            getValue(
                `${prefix}PoBoxOrder`,
                "po-box"
            ),
        lineMode:
            getValue(
                `${prefix}PoBoxLineMode`,
                "separate"
            ),
        gap:
            Math.max(
                0,
                Number(
                    getValue(
                        `${prefix}PoBoxGap`,
                        "10"
                    )
                ) || 0
            )
    };
}

function arrangePoBox(wrapper, poEl, boxEl, prefix){

    if (!wrapper || !poEl || !boxEl)
        return;

    const cfg =
        getPoBoxArrangement(prefix);

    wrapper.innerHTML = "";

    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.flexDirection =
        cfg.lineMode === "same"
            ? "row"
            : "column";

    wrapper.style.gap =
        `${cfg.gap}px`;

    const first =
        cfg.order === "box-po"
            ? boxEl
            : poEl;

    const second =
        cfg.order === "box-po"
            ? poEl
            : boxEl;

    wrapper.append(
        first,
        second
    );
}

function setupPoBoxArrangement(prefix){

    const order =
        $(`${prefix}PoBoxOrder`);

    const line =
        $(`${prefix}PoBoxLineMode`);

    const gap =
        $(`${prefix}PoBoxGap`);

    const gapValue =
        $(`${prefix}PoBoxGapValue`);

    function update(){

        if (gapValue && gap) {
            gapValue.textContent =
                `${gap.value} px`;
        }

        renderAll();
    }

    [order,line,gap].forEach(el => {

        if (!el) return;

        el.addEventListener(
            "input",
            update
        );

        el.addEventListener(
            "change",
            update
        );
    });

    update();
}


setupPoBoxArrangement("coco");
setupPoBoxArrangement("other");


document
.querySelectorAll('input[name="cocoLayout"]')
.forEach(input => {
    input.addEventListener("change", () => {
        const select = $("cocoPoBoxLineMode");
        if (!select || !input.checked) return;
        select.value = input.value === "same" ? "same" : "separate";
        renderAll();
    });
});


/* =========================================================
   LOGOUT
========================================================= */

(function setupBWGLogout(){

    const btn = document.getElementById("bwgLogoutBtn");
    const gate = document.getElementById("bwgLoginGate");

    if (!btn || !gate) return;

    btn.addEventListener("click", () => {

        sessionStorage.removeItem(
            "bwgLabelStudioLoggedIn"
        );

        document.body.classList.add("bwg-locked");

        gate.style.display = "flex";

        const idInput =
            document.getElementById("bwgLoginId");

        const passInput =
            document.getElementById("bwgLoginPassword");

        const error =
            document.getElementById("bwgLoginError");

        if (idInput) idInput.value = "";
        if (passInput) passInput.value = "";
        if (error) error.textContent = "";

        if (idInput) idInput.focus();

        window.scrollTo({
            top: 0,
            behavior: "instant"
        });
    });

})();


window.addEventListener(
    "error",
    event => {
        if (
            event?.message &&
            /PDF|jsPDF|html2canvas|downloadPDF/i.test(
                String(event.message)
            )
        ) {
            try {
                showToast(
                    `PDF error: ${event.message}`,
                    "red"
                );
            } catch (_) {}
        }
    }
);


/* =========================================================
   PO NUMBER BARCODE
========================================================= */

function isPOBarcodeEnabled(prefix){
    return !!$(`${prefix}POBarcodeEnabled`)?.checked;
}

function createPOBarcodeSVG(prefix,value){
    if(!isPOBarcodeEnabled(prefix) || typeof JsBarcode !== "function")
        return null;

    const svg=document.createElementNS(
        "http://www.w3.org/2000/svg","svg"
    );

    svg.className="bwg-po-barcode-preview";

    try{
        JsBarcode(svg,String(value),{
            format:"CODE128",
            displayValue:true,
            fontSize:10,
            height:42,
            width:1.6,
            margin:2,
            textMargin:2,
            lineColor:"#111"
        });
    }catch(e){
        console.error("PO barcode:",e);
        return null;
    }
    return svg;
}

function addPOBarcodeToLabel(label,prefix,poValue,wrapper){
    if(!isPOBarcodeEnabled(prefix)){
        label.appendChild(wrapper);
        return;
    }

    const wrap=document.createElement("div");
    wrap.className="bwg-po-barcode-preview";

    const svg=createPOBarcodeSVG(prefix,poValue);
    if(svg) wrap.appendChild(svg);

    if(wrap.childNodes.length)
        label.appendChild(wrap);

    label.appendChild(wrapper);
}

function setupPOBarcodeControls(prefix){
    const el=$(`${prefix}POBarcodeEnabled`);
    if(!el) return;
    el.addEventListener("change",renderAll);
}

async function createPOBarcodeDataURL(value){
    if(typeof JsBarcode !== "function") return null;

    const canvas=document.createElement("canvas");

    try{
        JsBarcode(canvas,String(value),{
            format:"CODE128",
            displayValue:true,
            fontSize:13,
            height:42,
            width:2,
            margin:5,
            textMargin:3,
            lineColor:"#111",
            background:"#fff"
        });
        return canvas.toDataURL("image/png");
    }catch(e){
        console.error("PO barcode canvas:",e);
        return null;
    }
}


setupPOBarcodeControls("coco");
setupPOBarcodeControls("other");

/* =========================================================
   INITIAL STATE
========================================================= */

updateCocoCombinedFreeze();

updateAddressBorderState();

renderCoco();

renderOther();

renderISBN();

renderAddress();


/* =========================================================
   DEBUG MESSAGE
========================================================= */

console.log(
    "BWG BooksWagon Label Studio — Updated JS Loaded Successfully."
);
