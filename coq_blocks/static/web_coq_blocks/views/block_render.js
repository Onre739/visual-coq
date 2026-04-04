import { AtomicBlock, BoolBlock, ConstructorBlock, DefinitionBlock, NatBlock, StringBlock } from "../models/block.js";
import { formatType, resolveTypeParams } from "../services/type_utils.js";

/**
 * DOM element representing a block output dot.
 */
class Dot {
    constructor(typeObj, parentBlockEl, color) {
        this.typeObj = typeObj; // Data type object, JSON
        this.type = typeObj;
        this.color = color; // Color
        this.parentBlockEl = parentBlockEl; // Reference to parent block
        this.dotLabelWidth = 0; // Width of dot label for block width
        this.element = document.createElement("div"); // DOM element
    }

    /**
     * Creates and appends DOM for the dot.
     */
    createElement() {
        let dot = this.element;
        this.parentBlockEl.appendChild(dot);

        dot.setAttribute("class", "block-dot");
        dot.style.backgroundColor = this.color;
        dot.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left-circle-fill" viewBox="0 0 16 16" style="display:inline;"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z"/></svg>';

        let dotLabel = document.createElement("div");
        dot.appendChild(dotLabel);

        dotLabel.innerText = formatType(this.typeObj);
        dotLabel.style.position = "absolute";
        dotLabel.style.left = "25px";
        dotLabel.style.top = "0";
        dotLabel.style.whiteSpace = "nowrap";

        this.dotLabelWidth = dotLabel.offsetWidth;
        this.element = dot;
    }
}

/**
 * DOM element representing a block input plug.
 */
class Plug {
    constructor(typeObj, parentBlockEl, index, plugPosition, color) {
        this.typeObj = typeObj; // Data type object, or string "any" (exception, SnapManager -> areTypesEqual handles it)
        this.type = typeObj;
        this.parentBlockEl = parentBlockEl; // Reference to parent block
        this.index = index; // Order
        this.plugPosition = plugPosition; // Plug position
        this.color = color;

        this.width = 0; // Width = plug + plug label
        this.element = document.createElement("div"); // DOM element
        this.occupied = false; // If plug is occupied
    }

    /**
     * Creates and appends DOM for the plug.
     */
    createElement() {
        let plug = this.element;
        this.parentBlockEl.appendChild(plug);
        plug.setAttribute("class", "block-plug");
        plug.style.top = this.plugPosition + "px";
        plug.style.backgroundColor = this.color;

        // Label pro plug
        let typeLabel = document.createElement("div");
        plug.appendChild(typeLabel);

        typeLabel.innerText = formatType(this.typeObj);
        typeLabel.style.position = "absolute";
        typeLabel.style.right = "120%";
        typeLabel.style.top = "2px";
        typeLabel.style.whiteSpace = "nowrap";

        this.width = typeLabel.offsetWidth + plug.offsetWidth;
        this.element = plug;
    }
}

/**
 * Initializes common block DOM structure (root, buttons).
 * @param {Object} block
 * @param {HTMLElement} el
 */
function initBlockElement(block, el) {
    el.setAttribute("id", block.id);
    el.className = "block draggable";
    el.style.backgroundColor = block.color;

    // Delete button
    let deleteBtn = document.createElement("div");
    deleteBtn.className = "delete-block-btn";
    deleteBtn.style.display = "flex";
    deleteBtn.style.opacity = "1";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.title = "Delete this block";
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
    </svg>`;
    deleteBtn.addEventListener("mousedown", (e) => e.stopPropagation());
    el.appendChild(deleteBtn);

    // Settings button
    let settingBtn = document.createElement("div");
    settingBtn.className = "settings-block-btn";
    settingBtn.title = "Nastavení parametrů instance bloku";
    settingBtn.innerHTML = `
        <svg class="text-dark" style="cursor: pointer; transition: transform 0.2s;"
             data-bs-toggle="modal" 
             data-bs-target="#settingModal" 
             onmouseover="this.style.transform='scale(1.1)'" 
             onmouseout="this.style.transform='scale(1)'"
             xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.86z"/>
        </svg>`;
    settingBtn.addEventListener("mousedown", (e) => e.stopPropagation());
    el.appendChild(settingBtn);
}

/**
 * Adds a title label to a block element.
 * @param {HTMLElement} el
 * @param {string} text
 */
function addBlockName(el, text) {
    let blockNameEl = document.createElement("div");
    blockNameEl.setAttribute("class", "blockName");
    blockNameEl.style.position = "absolute";
    blockNameEl.style.top = "5px";
    blockNameEl.style.left = "30px";
    blockNameEl.style.fontWeight = "bold";
    blockNameEl.style.whiteSpace = "nowrap";
    blockNameEl.innerText = text;
    el.appendChild(blockNameEl);
}

/**
 * Renders a DefinitionBlock to a DOM element.
 * @param {DefinitionBlock} block
 * @returns {HTMLElement}
 */
function renderDefinitionBlock(block) {
    const el = document.createElement("div");
    initBlockElement(block, el);
    addBlockName(el, "Definition");
    el.classList.add("definition-block-" + block.varName);

    // Export button
    let exportIcon = document.createElement("div");
    exportIcon.className = "export-icon";
    exportIcon.style.position = "absolute";
    exportIcon.style.bottom = "5px";
    exportIcon.style.left = "5px";
    exportIcon.style.cursor = "pointer";
    exportIcon.style.color = "#000";
    exportIcon.style.transition = "transform 0.2s, color 0.2s";
    exportIcon.title = "Export this definition";

    exportIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
        <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
    </svg>`;

    exportIcon.onmouseover = () => {
        exportIcon.style.transform = "scale(1.2)";
        exportIcon.style.color = "#000";
    };
    exportIcon.onmouseout = () => {
        exportIcon.style.transform = "scale(1)";
        exportIcon.style.color = "#000";
    };

    // To prevent drag on export icon click
    exportIcon.addEventListener("mousedown", (e) => e.stopPropagation());
    el.appendChild(exportIcon);

    // Plug
    block.plugObjects = [];
    const plugObject = new Plug("any", el, 0, 0, block.color);
    plugObject.createElement();
    block.plugObjects.push(plugObject);

    return el;
}

/**
 * Renders a ConstructorBlock to a DOM element.
 * @param {ConstructorBlock} block
 * @returns {HTMLElement}
 */
function renderConstructorBlock(block) {
    const el = document.createElement("div");
    initBlockElement(block, el);
    addBlockName(el, block.blockName);
    el.classList.add("constructor-block-" + block.constructorName);

    // Dot
    const dot = new Dot(block.returnTypeObj, el, block.color);
    dot.createElement();
    block.dotObject = dot;

    // Plugs
    const typeParamMap = block.getTypeParamMap();   // Map for substituting type parameters
    let allPlugsData = [];
    const args = block.constructorObj.args || [];

    args.forEach(arg => {
        const resolvedType = resolveTypeParams(arg.type, typeParamMap);
        if (arg.names && arg.names.length > 0) {    // Binder style: (n m : nat)
            arg.names.forEach(name => {
                allPlugsData.push({ type: resolvedType, label: name });
            });
        } else {    // Arrow style: nat -> bool
            allPlugsData.push({ type: resolvedType, label: "" });
        }
    });

    block.plugObjects = [];
    block.plugsCount = allPlugsData.length;

    allPlugsData.forEach((plugData, index) => {
        let plugObject = new Plug(plugData.type, el, index, 0, block.color);
        plugObject.createElement();
        block.plugObjects.push(plugObject);
    });

    return el;
}

/**
 * Creates an input element for an AtomicBlock (type-specific).
 * @param {AtomicBlock} block
 * @returns {HTMLElement}
 */
function createAtomicInput(block) {
    if (block instanceof NatBlock) {
        let inputEl = document.createElement("input");
        inputEl.setAttribute("type", "text");
        inputEl.setAttribute("inputmode", "numeric"); // For mobiles numeric keyboard
        inputEl.setAttribute("maxlength", "14");
        inputEl.setAttribute("class", "form-control p-0");
        inputEl.value = "0";
        block.value = "0";

        inputEl.addEventListener("input", (e) => {
            let cleaned = e.target.value.replace(/\D/g, '');
            cleaned = cleaned.replace(/^0+(?=\d)/, '');
            e.target.value = cleaned;
            block.value = cleaned === "" ? "0" : cleaned;
        });

        inputEl.addEventListener("blur", (e) => {
            if (e.target.value === "") {
                e.target.value = "0";
                block.value = "0";
            }
        });

        return inputEl;
    }

    if (block instanceof BoolBlock) {
        let selectEl = document.createElement("select");
        selectEl.setAttribute("class", "form-select p-0");
        selectEl.style.backgroundPosition = "right 2px center";
        selectEl.innerHTML = `
            <option value="true">true</option>
            <option value="false">false</option>
        `;
        selectEl.addEventListener("change", (e) => {
            block.value = e.target.value;
        });
        return selectEl;
    }

    if (block instanceof StringBlock) {
        let inputEl = document.createElement("input");
        inputEl.setAttribute("type", "text");
        inputEl.setAttribute("maxlength", "30");
        inputEl.setAttribute("class", "form-control p-0");
        inputEl.addEventListener("input", (e) => {
            block.value = `"${e.target.value}"`;
        });
        return inputEl;
    }

    // Generic AtomicBlock
    let inputEl = document.createElement("input");
    inputEl.setAttribute("class", "form-control p-0");
    inputEl.setAttribute("maxlength", "12");
    inputEl.setAttribute("type", "text");
    inputEl.addEventListener("input", (e) => block.value = e.target.value);
    return inputEl;
}

/**
 * Renders an AtomicBlock to a DOM element.
 * @param {AtomicBlock} block
 * @returns {HTMLElement}
 */
function renderAtomicBlock(block) {
    const el = document.createElement("div");
    initBlockElement(block, el);
    el.classList.add("atomic-block-" + block.typeObj.name);
    addBlockName(el, block.typeObj.name);

    let inputContainer = createAtomicInput(block);
    inputContainer.style.position = "absolute";
    inputContainer.style.right = "10px";
    inputContainer.style.top = "30px";
    el.appendChild(inputContainer);

    // Dot
    let dot = new Dot(block.typeObj, el, block.color);
    dot.createElement();
    block.dotObject = dot;

    return el;
}

/**
 * Renders a block to a DOM element based on its type.
 * @param {DefinitionBlock|ConstructorBlock|AtomicBlock} block
 * @returns {HTMLElement}
 */
export function renderBlock(block) {
    if (block instanceof DefinitionBlock) return renderDefinitionBlock(block);
    if (block instanceof ConstructorBlock) return renderConstructorBlock(block);
    if (block instanceof AtomicBlock) return renderAtomicBlock(block);
    throw new Error("Unknown block type for render");
}
