import { debugError, debugLog } from "../services/debug.js";

function toDomSafe(value) {
    return String(value).replace(/[^a-zA-Z0-9_]/g, "-");
}

export default class SidebarView {
    /**
     * @param {Object} store
     */
    constructor(store) {
        this.store = store;

        this.importedListEl = document.getElementById("importedTypesList");
        this.atomicListEl = document.getElementById("atomicTypesList");

        // Render atomic types
        this.store.getAtomicTypes().forEach(typeObj => {
            if (typeObj.sort === "atomic") {
                this.renderAtomicItem(typeObj);
            }
        });

        // Cache for change detection
        this.lastSavedTypesJson = "";
    }

    subscribeToStore() {
        this.store.subscribe(() => {
            this.updateUI();
        });
    }

    /**
     * Re-renders sidebar lists when saved types change.
     */
    updateUI() {
        const savedTypes = this.store.getSavedTypes();
        const currentJson = JSON.stringify(savedTypes);

        // Check for changes, because it may close the accordion unnecessarily (annoying)
        if (currentJson === this.lastSavedTypesJson) {
            return;
        }

        this.lastSavedTypesJson = currentJson;

        // Clear existing lists
        this.importedListEl.innerHTML = "";

        savedTypes.forEach(item => {
            if (item.sort === "clasic") {
                this.renderClasicItem(item);
            }
        });

    }

    /**
     * Renders a single atomic type item in the sidebar.
     * @param {Object} item
     */
    renderAtomicItem(item) {
        debugLog("Rendering atomic type in sidebar:", item);

        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center border-0 pe-2";

        const typeName = item.name ? item.name : "Unknown";

        let dangerBtnHTML = "";
        if (typeName === "string") {
            dangerBtnHTML = `
                <svg id="warning-btn-${item.id}"
                     data-bs-toggle="popover" data-bs-title="Don't forget to add:" 
                     data-bs-content="Require Import String.<br>Open Scope string_scope."
                     data-bs-placement="top" 
                     data-bs-html="true" 
                     data-bs-trigger="click"
                     class="text-warning" 
                     style="cursor: pointer; transition: transform 0.1s, color 0.2s;"
                     xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
                     <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
                </svg>
            `;
        }

        li.innerHTML = `
            <div>${typeName}</div>
            <div class="d-flex align-items-center gap-2">
                ${dangerBtnHTML}
                <svg id="spawn-btn-${item.id}" 
                     class="spawn-btn text-success" 
                     style="cursor: pointer; transition: transform 0.1s, color 0.2s;"
                     onmouseover="this.classList.replace('text-success', 'text-success-emphasis'); this.style.transform='scale(1.1)'" 
                     onmouseout="this.classList.replace('text-success-emphasis', 'text-success'); this.style.transform='scale(1)'"
                     xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                     <path fill-rule="evenodd" d="M8 5.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 .5-.5"/>
                     <path d="m10.273 2.513-.921-.944.715-.698.622.637.89-.011a2.89 2.89 0 0 1 2.924 2.924l-.01.89.636.622a2.89 2.89 0 0 1 0 4.134l-.637.622.011.89a2.89 2.89 0 0 1-2.924 2.924l-.89-.01-.622.636a2.89 2.89 0 0 1-4.134 0l-.622-.637-.89.011a2.89 2.89 0 0 1-2.924-2.924l.01-.89-.636-.622a2.89 2.89 0 0 1 0-4.134l.637-.622-.011-.89a2.89 2.89 0 0 1 2.924-2.924l.89.01.622-.636a2.89 2.89 0 0 1 4.134 0l-.715.698a1.89 1.89 0 0 0-2.704 0l-.92.944-1.32-.016a1.89 1.89 0 0 0-1.911 1.912l.016 1.318-.944.921a1.89 1.89 0 0 0 0 2.704l.944.92-.016 1.32a1.89 1.89 0 0 0 1.912 1.911l1.318-.016.921.944a1.89 1.89 0 0 0 2.704 0l.92-.944 1.32.016a1.89 1.89 0 0 0 1.911-1.912l-.016-1.318.944-.921a1.89 1.89 0 0 0 0-2.704l-.944-.92.016-1.32a1.89 1.89 0 0 0-1.912-1.911z"/>
                </svg>
            </div>
        `;

        this.atomicListEl.appendChild(li);

        // Initialize popover for string type
        if (typeName === "string") {
            const warningBtn = li.querySelector(`#warning-btn-${item.id}`);
            if (warningBtn) {
                new bootstrap.Popover(warningBtn, {
                    customClass: 'warn-popover',
                    trigger: 'hover'
                });

                warningBtn.addEventListener('show.bs.popover', () => {
                    warningBtn.classList.replace('text-warning', 'text-warning-emphasis');
                    warningBtn.style.transform = 'scale(1.1)';
                });

                warningBtn.addEventListener('hide.bs.popover', () => {
                    warningBtn.classList.replace('text-warning-emphasis', 'text-warning');
                    warningBtn.style.transform = 'scale(1)';
                });
            }
        }

        // Listeners
        const spawnBtn = li.querySelector(`#spawn-btn-${item.id}`);
        spawnBtn.addEventListener("click", () => {
            this.store.spawnAtomicBlock(item);
        });
    }

    /**
     * Renders a single inductive type item in the sidebar.
     * @param {Object} item
     */
    renderClasicItem(item) {
        const newTypeObj = item;
        const typeName = newTypeObj.name;
        const typeParameters = newTypeObj.typeParameters;
        const id = newTypeObj.id;

        const constructors = newTypeObj.constructors || [];

        // --- 1. Main element (Accordion Item) ---
        const typeEl = document.createElement("div");
        typeEl.className = "accordion-item";

        // --- 2. Header ---
        const headerEl = document.createElement("h5");
        headerEl.className = "accordion-header d-flex align-items-center bg-light-subtle pe-2";

        headerEl.innerHTML = `
            <button id="accordion-button-${toDomSafe(typeName)}"
                    class="accordion-button collapsed px-3 py-2 bg-light-subtle text-success flex-grow-1" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#collapse-${item.id}" 
                    aria-expanded="false" 
                    aria-controls="collapse-${item.id}"
                    style="font-weight: 500; box-shadow: none;"> 
                ${typeName}
            </button>
            
            <div class="d-flex align-items-center gap-2">
                <svg class="settings-btn text-secondary" style="cursor: pointer; transition: color 0.2s;"
                     data-bs-toggle="modal" 
                     data-bs-target="#settingModal" 
                     onmouseover="this.classList.replace('text-secondary', 'text-dark'); this.style.transform='scale(1.1)'" 
                     onmouseout="this.classList.replace('text-dark', 'text-secondary'); this.style.transform='scale(1)'" 
                    xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-sliders" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M11.5 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M9.05 3a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0V3zM4.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M2.05 8a2.5 2.5 0 0 1 4.9 0H16v1H6.95a2.5 2.5 0 0 1-4.9 0H0V8zm9.45 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m-2.45 1a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0v-1z"/>
                </svg>

                <svg class="delete-type-btn text-danger" style="cursor: pointer; transition: color 0.2s;"
                     onmouseover="this.classList.replace('text-danger', 'text-danger-emphasis'); this.style.transform='scale(1.1)'" 
                     onmouseout="this.classList.replace('text-danger-emphasis', 'text-danger'); this.style.transform='scale(1)'"
                     xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                </svg>
            </div>
        `;

        // --- 2.1 Setting button listener ---
        const settingsBtn = headerEl.querySelector(".settings-btn");
        settingsBtn.addEventListener("click", (e) => {
            e.stopPropagation();

            // Title
            document.getElementById("settingModalTitle").innerText = `Settings for type: ${typeName}`;

            // Reset body
            let settingModalBody = document.getElementById("settingModalBody");
            settingModalBody.innerHTML = "";

            // --- 2.1.1 Original Definiton ---
            let codeLabel = document.createElement("label");
            codeLabel.innerText = "Original Definition: ";
            codeLabel.className = "form-label fw-bold";

            let codeArea = document.createElement("div");
            codeArea.className = "form-control font-monospace bg-light";
            codeArea.style.fontSize = "0.85em";

            codeArea.style.whiteSpace = "pre-wrap"; // Respektuje \n a zalamuje řádky
            // codeArea.style.whiteSpace = "pre";   // Respektuje \n, ale NEZALAMUJE dlouhé řádky (udělá scrollbar)

            codeArea.style.maxHeight = "200px";     // Omezení výšky
            codeArea.style.overflowY = "auto";      // Scrollbar, pokud je text dlouhý
            codeArea.textContent = item.fullText || "Definition source not available.";

            settingModalBody.appendChild(codeLabel);
            settingModalBody.appendChild(codeArea);

            // --- 2.1.2 --- Color picker ---
            let colorLabel = document.createElement("label");
            colorLabel.innerText = "Block Color: ";
            colorLabel.className = "form-label fw-bold mt-3";
            settingModalBody.appendChild(colorLabel);

            let colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "form-control form-control-color mb-3";
            colorInput.value = item.color || "rgb(151, 151, 151)"; // Actual color
            colorInput.title = "Choose your color";

            let colorDiv = document.createElement("div");
            colorDiv.className = "d-flex gap-2";
            colorDiv.appendChild(colorInput);

            settingModalBody.appendChild(colorDiv);

            // --- 2.1.3 Save button in modal listener ---
            const saveBtn = document.querySelector("#settingModalSaveBtn");

            // Tricks for removing old listeners (cloneNode)
            // It's necessary because the modal is in the DOM only once and is shared
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

            // New listener
            newSaveBtn.addEventListener("click", () => {
                // A) Get new color
                const newColor = colorInput.value;

                // B) Call Store to update
                this.store.updateTypeColor(id, newColor);
            });
        });

        // --- 2.2 Delete button listener ---
        const deleteTypeBtn = headerEl.querySelector(".delete-type-btn");
        deleteTypeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.store.removeSavedType(id);
        });

        typeEl.appendChild(headerEl);

        // --- 3. Body (Collapse Content) ---
        const contentEl = document.createElement("div");
        contentEl.id = `collapse-${id}`;
        contentEl.className = "accordion-collapse collapse";

        const bodyEl = document.createElement("div");
        bodyEl.className = "accordion-body p-0";

        const listGroup = document.createElement("ul");
        listGroup.className = "list-group";

        // --- 4. Constructors ---
        constructors.forEach(constructor => {
            const listItem = document.createElement("li");
            listItem.className = "list-group-item d-flex justify-content-between align-items-center border-0 ps-3 pe-2";

            listItem.innerHTML = `
                <div>${constructor.name}</div>
                
                <svg id="spawn-${toDomSafe(typeName)}-${toDomSafe(constructor.name)}-btn"
                     class="spawn-cons-btn text-success" 
                     style="cursor: pointer; transition: transform 0.1s, color 0.2s;"
                     onmouseover="this.classList.replace('text-success', 'text-success-emphasis'); this.style.transform='scale(1.1)'" 
                     onmouseout="this.classList.replace('text-success-emphasis', 'text-success'); this.style.transform='scale(1)'"
                     xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 5.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 .5-.5"/>
                    <path d="m10.273 2.513-.921-.944.715-.698.622.637.89-.011a2.89 2.89 0 0 1 2.924 2.924l-.01.89.636.622a2.89 2.89 0 0 1 0 4.134l-.637.622.011.89a2.89 2.89 0 0 1-2.924 2.924l-.89-.01-.622.636a2.89 2.89 0 0 1-4.134 0l-.622-.637-.89.011a2.89 2.89 0 0 1-2.924-2.924l.01-.89-.636-.622a2.89 2.89 0 0 1 0-4.134l.637-.622-.011-.89a2.89 2.89 0 0 1 2.924-2.924l.89.01.622-.636a2.89 2.89 0 0 1 4.134 0l-.715.698a1.89 1.89 0 0 0-2.704 0l-.92.944-1.32-.016a1.89 1.89 0 0 0-1.911 1.912l.016 1.318-.944.921a1.89 1.89 0 0 0 0 2.704l.944.92-.016 1.32a1.89 1.89 0 0 0 1.912 1.911l1.318-.016.921.944a1.89 1.89 0 0 0 2.704 0l.92-.944 1.32.016a1.89 1.89 0 0 0 1.911-1.912l-.016-1.318.944-.921a1.89 1.89 0 0 0 0-2.704l-.944-.92.016-1.32a1.89 1.89 0 0 0-1.912-1.911z"/>
                </svg>
            `;

            const spawnBtn = listItem.querySelector(".spawn-cons-btn");
            spawnBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.store.spawnClassicBlock(constructor, typeName, typeParameters, id);
            });

            listGroup.appendChild(listItem);
        });

        bodyEl.appendChild(listGroup);
        contentEl.appendChild(bodyEl);
        typeEl.appendChild(contentEl);

        // Append to main list
        this.importedListEl.appendChild(typeEl);
    }

    /**
     * Prints the export result into the export result list.
     * @param {string} str - The COQ string to display.
     */
    /**
     * Appends an export result to the sidebar list.
     * @param {string} str
     */
    showExportResult(str) {
        let li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = str;

        // Smart copy to clipboard on click
        li.style.cursor = "pointer";
        li.title = "Click to copy to clipboard";

        li.addEventListener("click", async (event) => {
            try {
                await navigator.clipboard.writeText(li.textContent);

                // Visual feedback for successful copy
                const baseBg = li.dataset.baseBg || getComputedStyle(li).backgroundColor;
                li.dataset.baseBg = baseBg;
                li.style.backgroundColor = "#d4edda";

                // Small tooltip near cursor
                if (li._copyTooltip) {
                    li._copyTooltip.remove();
                    li._copyTooltip = null;
                }

                const tooltip = document.createElement("div");
                tooltip.textContent = "Copied";
                tooltip.style.position = "fixed";
                tooltip.style.left = `${event.clientX + 8}px`;
                tooltip.style.top = `${event.clientY - 8}px`;
                tooltip.style.padding = "2px 6px";
                tooltip.style.fontSize = "0.75em";
                tooltip.style.backgroundColor = "#198754";
                tooltip.style.color = "#fff";
                tooltip.style.borderRadius = "4px";
                tooltip.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
                tooltip.style.pointerEvents = "none";
                tooltip.style.zIndex = "9999";
                tooltip.style.opacity = "0";
                tooltip.style.transition = "opacity 0.15s";
                document.body.appendChild(tooltip);

                requestAnimationFrame(() => {
                    tooltip.style.opacity = "1";
                });

                li._copyTooltip = tooltip;

                if (li._copyTimeout) {
                    clearTimeout(li._copyTimeout);
                }

                li._copyTimeout = setTimeout(() => {
                    li.style.backgroundColor = baseBg;
                    tooltip.style.opacity = "0";
                    setTimeout(() => tooltip.remove(), 150);
                    li._copyTooltip = null;
                    li._copyTimeout = null;
                }, 500);

            } catch (err) {
                debugError("Copy failed: ", err);
            }
        });

        const resultList = document.getElementById("result");
        if (resultList) {
            resultList.appendChild(li);
        }
    }
}
