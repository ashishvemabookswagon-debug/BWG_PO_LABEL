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
   TOOL SWITCHING
   ========================================================= */

/* =========================================================
   RENDER ALL PREVIEWS
========================================================= */

function renderAll() {

    renderCoco();

    renderOther();

    renderISBN();

    renderAddress();

}



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


    const previewPages =
        Math.min(
            totalPages,
            5
        );


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

    page.style.gridTemplateColumns =
        "1fr 1fr";


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


        const box =
            document.createElement("div");


        box.className =
            "box-label";


        box.textContent =
            `${getValue(
                "cocoBoxPrefix",
                "BOX NO. "
            )}${item.box}`;


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

            wrapper.append(
                po,
                box
            );

        }


        label.appendChild(
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


    const previewPages =
        Math.min(
            totalPages,
            5
        );


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

        page.style.gridTemplateColumns =
            "1fr 1fr";

        page.style.gridTemplateRows =
            "repeat(5, 1fr)";


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


                wrapper.append(
                    poLabel,
                    boxLabel
                );


                label.appendChild(
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

    }

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


    const previewCount =
        Math.min(
            values.length,
            5
        );


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


    const previewPages =
        Math.min(
            data.length,
            5
        );


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

    }

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

async function downloadPDF(
    previewId,
    filename
) {

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


        pdf.save(
            filename
        );


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


                    wrapper.append(
                        poLabel,
                        boxLabel
                    );


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
