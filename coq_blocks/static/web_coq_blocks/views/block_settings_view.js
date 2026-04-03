import { DefinitionBlock, ConstructorBlock } from "../models/block.js";
import { formatType } from "../services/type_utils.js";

export function openLocalBlockSettings(block, store, printAlert) {
    if (block instanceof DefinitionBlock) {
        // Title
        document.getElementById("settingModalTitle").innerText = `Name settings for Definition Block`;

        // Reset body
        let settingModalBody = document.getElementById("settingModalBody");
        settingModalBody.innerHTML = "";

        // Name label
        let nameLabel = document.createElement("div");
        nameLabel.innerText = "Name: ";
        nameLabel.className = "form-label fw-bold mt-3";
        settingModalBody.appendChild(nameLabel);

        // Name input
        let nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "form-control";
        nameInput.value = block.varName || "";
        settingModalBody.appendChild(nameInput);

        // Note
        let note = document.createElement("div");
        note.innerText = "Note: Changing the name will affect name of definition when exporting.";
        note.className = "form-text mt-2 fst-italic";
        settingModalBody.appendChild(note);

        // New listener for Save button, to save name
        const saveBtn = document.querySelector("#settingModalSaveBtn");
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

        newSaveBtn.addEventListener("click", () => {

            const newName = nameInput.value.trim();

            if (newName.length === 0) {
                printAlert("Definition name cannot be empty.", "warning");
                return;
            }

            store.setDefinitionBlockName(block, newName);
            printAlert(`Name of definition block ${block.id} updated to "${newName}".`, "success");
        });
    }

    else if (block instanceof ConstructorBlock) {

        const typeParameters = block.typeParameters;

        // Title
        document.getElementById("settingModalTitle").innerText = `Parameter settings for block`;

        // Reset body
        let settingModalBody = document.getElementById("settingModalBody");
        settingModalBody.innerHTML = "";

        let infoNoteBtnHTML = "";
        let noParamDiv = "";

        // Parameter check
        if (!typeParameters || typeParameters.length === 0) {
            noParamDiv = "This type has no type parameters.";
        } else {
            infoNoteBtnHTML = `
                <svg id="info-btn-${block.id}"
                    data-bs-toggle="popover" data-bs-title="Smart Suggestions" 
                    data-bs-content="Smart suggestions include:<br>&bull; All atomic types<br>&bull; Local parameters<br>&bull; <strong>Types of all spawned blocks</strong>"
                    data-bs-placement="top" 
                    data-bs-html="true" 
                    data-bs-trigger="click"
                    class="text-info ms-2" 
                    style="cursor: pointer; transition: transform 0.1s, color 0.2s;" 
                    xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-info-square" viewBox="0 0 16 16">
                    <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                </svg>
            `;
        }

        // Parameters label
        let paramLabel = document.createElement("div");
        paramLabel.className = "form-label fw-bold mt-3 d-flex align-items-center";
        paramLabel.innerHTML = `
            <div>
                <div class="d-flex align-items-center">
                    Parameters:
                    ${infoNoteBtnHTML}
                </div>
                <span class="fw-normal text-muted">${noParamDiv}</span>
            </div>
        `;
        settingModalBody.appendChild(paramLabel);

        // Initialize popover for info button
        if (infoNoteBtnHTML !== "") {
            const infoSvgElement = document.getElementById(`info-btn-${block.id}`);

            if (infoSvgElement) {
                new bootstrap.Popover(infoSvgElement, {
                    customClass: 'info-popover',
                    trigger: 'hover'
                });

                infoSvgElement.addEventListener('show.bs.popover', () => {
                    infoSvgElement.classList.replace('text-info', 'text-info-emphasis');
                    infoSvgElement.style.transform = 'scale(1.1)';
                });

                infoSvgElement.addEventListener('hide.bs.popover', () => {
                    infoSvgElement.classList.replace('text-info-emphasis', 'text-info');
                    infoSvgElement.style.transform = 'scale(1)';
                });
            }
        }

        // Smart suggestions for type parameters
        const availableTypes = getAvailableTypes(block, typeParameters, store);
        const optionsList = Array.from(availableTypes.optionsList); // List of options for select, includes local parameters and smart suggestions
        const smartSuggestionsMap = availableTypes.smartSuggestionsMap; // Map for saving original object type for smart suggestions

        // Select for each type parameter
        typeParameters.forEach((param, index) => {
            // Param structure: { "A": "value" } or { "A": null }
            const typeKey = Object.keys(param)[0];
            const storedValue = param[typeKey];

            let rowDiv = document.createElement("div");
            rowDiv.className = "d-flex align-items-center mb-3";

            let paramDivLabel = document.createElement("label");
            paramDivLabel.innerText = `${typeKey}:`;
            paramDivLabel.className = "form-label me-3 mb-0 text-nowrap";
            paramDivLabel.htmlFor = `typeParamSelect_${block.id}_${index}`;

            // Create select element
            let paramSelect = document.createElement("select");
            paramSelect.className = "form-select";
            paramSelect.id = `typeParamSelect_${block.id}_${index}`;

            // Fill select with options
            optionsList.forEach(optVal => {
                let option = document.createElement("option");
                option.value = optVal;
                option.innerText = optVal === "" ? "-- Vyberte typ --" : optVal;

                if (storedValue === optVal) {
                    option.selected = true;
                }
                paramSelect.appendChild(option);
            });

            rowDiv.appendChild(paramDivLabel);
            rowDiv.appendChild(paramSelect);
            settingModalBody.appendChild(rowDiv);
        });

        // 3. New listener for Save button, to save parameters only for this block
        const saveBtn = document.querySelector("#settingModalSaveBtn");
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

        newSaveBtn.addEventListener("click", () => {
            console.log("Ukládám parametry pouze pro blok:", block.id);

            if (typeParameters && typeParameters.length > 0) {
                // A) Collect updated parameters from the selects
                const updatedParameters = typeParameters.map((param, index) => {
                    const typeKey = Object.keys(param)[0];
                    const selectEl = document.getElementById(`typeParamSelect_${block.id}_${index}`);
                    const selectedString = selectEl.value;

                    let newValue = null;
                    if (selectedString !== "") {
                        if (smartSuggestionsMap.has(selectedString)) {
                            newValue = smartSuggestionsMap.get(selectedString);
                        } else {
                            newValue = selectedString;
                        }
                    }

                    return { [typeKey]: newValue };
                });

                // B) Check if parameters changed
                const paramsChanged = JSON.stringify(typeParameters) !== JSON.stringify(updatedParameters);

                if (paramsChanged) {
                    console.log(`Parameters changed for local block ${block.id} changed.`);

                    store.updateBlockInstanceParameters(block, updatedParameters);
                }
            }
        });
    }
}

function getAvailableTypes(block, typeParameters, store) {
    const atomicTypes = store.getAtomicTypes();
    const allBlocksOnCanvas = store.getBlockObjects();

    const targetTypeName = block.typeName; // Name of current block (e.g., "list")
    const smartSuggestionsMap = new Map(); // Map for saving original object type

    // Name of local parameter names (e.g. "Key", "Value" from head)
    const localParams = typeParameters.map(p => Object.keys(p)[0]);

    // Recursive search, helper function
    const findUsages = (node) => {
        if (!node) return;

        // If we find the target type with arguments, we can suggest those arguments as relevant for suggestions
        if (node.name === targetTypeName && node.args && node.args.length > 0) {
            node.args.forEach(arg => {
                const formattedStr = formatType(arg);
                if (!smartSuggestionsMap.has(formattedStr)) {
                    // Save the original type object for this formatted string, to be able to replace type parameters later
                    smartSuggestionsMap.set(formattedStr, JSON.parse(JSON.stringify(arg)));
                }
            });
        }

        // Continue searching in arguments
        if (node.args) {
            node.args.forEach(child => findUsages(child));
        }
    };

    // 1. Add Atomic typeds to smart suggestions
    atomicTypes.forEach(savedType => {
        if (savedType.sort === "atomic") {
            if (!smartSuggestionsMap.has(savedType.name)) {
                smartSuggestionsMap.set(savedType.name, savedType.name);
            }
        }
    });

    // 2. Search through all live blocks
    allBlocksOnCanvas.forEach(canvasBlock => {

        // Skip the current block
        if (canvasBlock.id === block.id) return;

        if (canvasBlock instanceof ConstructorBlock) {

            // Příklad: block je `list`, hledáme co do něj dát. 
            // canvasBlock je `SuperTree`. 
            // My ale chceme, aby se nám do listu nabídl `SuperTree nat bool`.

            let typeObj = { name: canvasBlock.typeName, args: [] };

            if (canvasBlock.typeParameters) {
                canvasBlock.typeParameters.forEach(param => {
                    const key = Object.keys(param)[0];
                    const val = param[key];
                    // If param has no value, we still want to offer it with deafault args (e.g. `A` in `list A`)
                    if (val === null || val === undefined || val === "") {
                        typeObj.args.push({ name: key, args: [] });
                    } else if (typeof val === 'string') {
                        // Je to odkaz na parametr nebo jednoduchý typ (musíme zjistit, jestli má args v původním mapě)
                        if (smartSuggestionsMap.has(val)) {
                            typeObj.args.push(smartSuggestionsMap.get(val));
                        } else {
                            typeObj.args.push({ name: val, args: [] });
                        }
                    } else {
                        typeObj.args.push(val);
                    }
                });
            }

            const formattedStr = formatType(typeObj);

            if (!smartSuggestionsMap.has(formattedStr)) {
                smartSuggestionsMap.set(formattedStr, typeObj);
            }
        }
    });

    // Union
    const combinedOptions = new Set([
        "",
        ...localParams,
        ...Array.from(smartSuggestionsMap.keys()),
    ]);

    return {
        optionsList: Array.from(combinedOptions).sort((a, b) => a.localeCompare(b)), // Sorted alphabetically
        smartSuggestionsMap: smartSuggestionsMap
    };
}
