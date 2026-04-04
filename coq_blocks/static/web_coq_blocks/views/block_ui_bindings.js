import { DefinitionBlock, ConstructorBlock } from "../models/block.js";

/**
 * Binds export button listeners for rendered blocks.
 * @param {Array} blockObjects
 * @param {Function} exportCallback
 */
export function bindExportButtons(blockObjects, exportCallback) {
    blockObjects.forEach(block => {
        const icon = block.element.querySelector(".export-icon");

        // Custom flag 'hasExportListener' -> in HTML atribute: data-has-export-listener="true" 
        if (icon && !icon.dataset.hasExportListener) {

            icon.addEventListener("click", (e) => {
                e.stopPropagation();

                if (exportCallback) {
                    exportCallback(block);
                }
            });

            icon.dataset.hasExportListener = "true";
        }
    });
}

/**
 * Controls delete button visibility and click handlers.
 * @param {Array} notSnappedBlocks
 * @param {Array} blockObjects
 * @param {Function} removeBlockCallback
 */
export function deleteBtnClassControl(notSnappedBlocks, blockObjects, removeBlockCallback) {
    // 1. Set for quick lookup
    const notSnappedSet = new Set(notSnappedBlocks);

    // 2. Traverse all blocks and add/remove delete button
    blockObjects.forEach((blockObject) => {
        let deleteBtn = blockObject.element.querySelector(".delete-block-btn");
        if (!deleteBtn) return;

        const shouldBeEnabled = notSnappedSet.has(blockObject);

        // Enabled/Disabled control via CSS
        if (shouldBeEnabled) {
            deleteBtn.style.display = "flex";
            deleteBtn.style.opacity = "1";
            deleteBtn.style.pointerEvents = "auto";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.title = "Delete this block";
        } else {
            deleteBtn.style.display = "flex";
            deleteBtn.style.opacity = "0.4";
            deleteBtn.style.pointerEvents = "none"; // Disables click events!
            deleteBtn.style.cursor = "not-allowed"; // Mouse cursor icon
            deleteBtn.title = "Cannot delete snapped block";
        }

        // Listener control
        if (!deleteBtn.dataset.hasDeleteListener) {
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                removeBlockCallback(blockObject);
            });

            // Custom flag to avoid multiple listeners
            deleteBtn.dataset.hasDeleteListener = "true";
        }
    });
}

/**
 * Controls settings button visibility and click handlers.
 * @param {Array} notSnappedBlocks
 * @param {Array} blockObjects
 * @param {Function} openLocalBlockSettings
 */
export function settingsBtnClassControl(notSnappedBlocks, blockObjects, openLocalBlockSettings) {

    // 1. Set for quick lookup
    const notSnappedSet = new Set(notSnappedBlocks);

    // 2. Traverse all blocks and add/remove settings button
    blockObjects.forEach((blockObject) => {
        let settingBtn = blockObject.element.querySelector(".settings-block-btn");
        if (!settingBtn) return;

        const supportsSettings = blockObject instanceof DefinitionBlock || blockObject instanceof ConstructorBlock;

        if (!supportsSettings) {
            settingBtn.style.display = "none";
            return;
        }

        settingBtn.style.display = "flex";
        const isNotSnapped = notSnappedSet.has(blockObject);

        // Visibility / Disabled control

        if (isNotSnapped || blockObject instanceof DefinitionBlock) {
            settingBtn.style.opacity = "1";
            settingBtn.style.pointerEvents = "auto";
            settingBtn.style.cursor = "pointer";
            settingBtn.title = blockObject instanceof DefinitionBlock ? "Setting for this Definition block" : "Parameters settings for this block";
        } else {
            settingBtn.style.opacity = "0.4";
            settingBtn.style.pointerEvents = "none";
            settingBtn.style.cursor = "not-allowed";
            settingBtn.title = "Cannot modify settings of a connected block";
        }

        // Listener control
        if (!settingBtn.dataset.hasSettingsListener) {
            settingBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                // Just in case CSS fails
                if (settingBtn.style.pointerEvents === "none") return;

                openLocalBlockSettings(blockObject);
            });

            // Custom flag to avoid multiple listeners
            settingBtn.dataset.hasSettingsListener = "true";
        }
    });
}
