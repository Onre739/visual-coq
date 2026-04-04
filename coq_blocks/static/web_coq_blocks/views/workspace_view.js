import { DefinitionBlock, ConstructorBlock, AtomicBlock } from "../models/block.js";
import { LAYOUT_CONFIG, constructorHorizontalResize, atomicHorizontalResize, verticalLayoutResize } from "../services/layout_utils.js";
import { bindExportButtons, deleteBtnClassControl, settingsBtnClassControl } from "./block_ui_bindings.js";
import { openLocalBlockSettings } from "./block_settings_view.js";
import { renderBlock } from "./block_render.js";
export default class WorkspaceView {
    constructor(store, snapManager, exportCallback) {
        this.ground = document.getElementById("ground");
        this.store = store;
        this.snapManager = snapManager;
        this.exportCallback = exportCallback;

        this.LAYOUT_CONFIG = LAYOUT_CONFIG;
    }

    subscribeToStore() {
        this.store.subscribe(() => {
            this.updateUI();
        });
    }

    /**
     * Main render entrypoint triggered by store updates.
     */
    updateUI() {
        const blockObjects = this.store.getBlockObjects();
        const currentSnaps = this.store.getSnappedBlocks();
        const dotYPosition = this.store.getDotYPosition();
        const orderedSnaps = this.store.getOrderedSnappedBlocks();

        // 1. Synchronize DOM elements (adding/removing blocks)
        this.syncBlocksWithDOM(blockObjects);

        // 2. Block resize
        this.afterSnapActions(blockObjects, dotYPosition, orderedSnaps, currentSnaps);

        // 3. Delete button control
        const notSnappedBlocks = this.snapManager.getNotSnappedBlocks(blockObjects, currentSnaps);
        const removeBlockCallback = (block) => this.store.removeBlock(block);
        deleteBtnClassControl(notSnappedBlocks, blockObjects, removeBlockCallback);

        // 4. Export button control
        bindExportButtons(blockObjects, this.exportCallback);

        // 5. Settings button control
        settingsBtnClassControl(notSnappedBlocks, blockObjects, (block) => {
            openLocalBlockSettings(block, this.store, (msg, type) => this.printAlert(msg, type));
        });

    }

    /**
     * Automatically syncs the blocks in the DOM with the blocks in the Store.
     * @param {Array} blockObjects
     */
    syncBlocksWithDOM(blockObjects) {
        // 1. Get all current DOM blocks
        const domBlocks = Array.from(this.ground.querySelectorAll('.block'));

        // 2. Set of IDs for quick lookup
        const dataIds = new Set(blockObjects.map(b => b.id));

        // 3. Remove extra DOM blocks
        domBlocks.forEach(domEl => {
            const id = domEl.getAttribute('id');

            // If the block is not in the Store, remove it from DOM
            if (!dataIds.has(id)) {
                domEl.remove();
            }
        });

        // 4. Add missing blocks
        blockObjects.forEach(block => {
            // If the block is not rendered yet, render and append
            if (!block.element) {
                block.element = renderBlock(block);
                if (block.zIndex !== null && block.zIndex !== undefined) {
                    block.element.style.zIndex = block.zIndex;
                }
                this.ground.appendChild(block.element);

                // Default block sizes
                this.initializeBlockLayout(block);

                // Spawn position
                if (!block.element.hasAttribute('data-x')) {
                    const visibleCenterX = this.ground.scrollLeft + (this.ground.clientWidth / 2) - 50;
                    const visibleCenterY = this.ground.scrollTop + (this.ground.clientHeight / 2) - 50;

                    block.element.style.transform = `translate(${visibleCenterX}px, ${visibleCenterY}px)`;
                    block.element.setAttribute('data-x', visibleCenterX);
                    block.element.setAttribute('data-y', visibleCenterY);
                }
            }
            // If the block needs full re-render (e.g., after parameter change)
            else if (block.needsRenderUpdate) {
                const oldEl = block.element;
                const prevX = oldEl.getAttribute('data-x');
                const prevY = oldEl.getAttribute('data-y');
                const prevTransform = oldEl.style.transform;

                oldEl.remove();

                block.element = renderBlock(block);
                if (block.zIndex !== null && block.zIndex !== undefined) {
                    block.element.style.zIndex = block.zIndex;
                }
                this.ground.appendChild(block.element);

                if (prevX !== null) block.element.setAttribute('data-x', prevX);
                if (prevY !== null) block.element.setAttribute('data-y', prevY);
                if (prevTransform) block.element.style.transform = prevTransform;

                this.initializeBlockLayout(block);
                block.needsRenderUpdate = false;
                block.needsLayoutUpdate = false;
            }
            // If the block is not in the DOM (should be rare), add it
            else if (!this.ground.contains(block.element)) {
                this.ground.appendChild(block.element);
            }
            // If the block needs layout update (e.g., after parameter change)
            else if (block.needsLayoutUpdate) {
                this.initializeBlockLayout(block);
                block.needsLayoutUpdate = false;
            }
        });
    }

    /**
     * Initializes the block layout (width, height, specific styles) based on its type.
     * @param {Block} block - The block to initialize.
     */
    initializeBlockLayout(block) {
        if (block instanceof DefinitionBlock) {
            block.element.style.width = "150px";
            verticalLayoutResize(block, null, this.LAYOUT_CONFIG);
        }
        else if (block instanceof ConstructorBlock) {
            constructorHorizontalResize(block);
            verticalLayoutResize(block, null, this.LAYOUT_CONFIG);
        }
        else if (block instanceof AtomicBlock) {
            atomicHorizontalResize(block);
            verticalLayoutResize(block, null, this.LAYOUT_CONFIG);

            // Atomic block input listener for dynamic resizing
            const input = block.element.querySelector("input");
            if (input) {
                input.addEventListener("input", () => {
                    atomicHorizontalResize(block);
                });
            }
        }
    }

    /**
     * Manages the logic after a snap (changing parent sizes, new positions).
     * Changes DOM elements' height and position.
     * @param {number} dotYPosition - Y position of the dot in pixels
     * @param {Array} orderedSnappedBlocks - Ordered snaps (array of arrays)
     */
    afterSnapActions(blockObjects, dotYPosition, orderedSnappedBlocks, allSnaps) {
        const activeParents = new Set();

        // 1. --- Height recount (Bottom-Up: from leaves to root) ---
        orderedSnappedBlocks.forEach(tree => {
            tree.forEach(snap => {
                activeParents.add(snap.parent);
            });
        });

        // CLEANUP, for blocks that have NO children snapped, only for ConstructorBlocks
        blockObjects.forEach(block => {
            if (block instanceof ConstructorBlock && !activeParents.has(block)) {
                verticalLayoutResize(block, allSnaps, this.LAYOUT_CONFIG);
            }
        });

        const processedParents = new Set();

        // orderedSnappedBlocks is sorted from root to leaves -> must go backwards (from the deepest child up) to correctly sum heights
        // Includes plugs and dot positioning
        orderedSnappedBlocks.forEach(tree => {
            // Make a copy and reverse the order
            [...tree].reverse().forEach(snap => {
                const parent = snap.parent;

                // Recalculate layout for the parent block, only for ConstructorBlocks
                if (parent instanceof ConstructorBlock) {
                    verticalLayoutResize(parent, allSnaps, this.LAYOUT_CONFIG);
                    processedParents.add(parent);
                }
            });
        });

        // 2. --- New positions (Top-Down: from root to leaves) ---
        const groundEl = this.ground;
        const groundRect = groundEl.getBoundingClientRect();
        const groundStyle = getComputedStyle(groundEl);

        // Scroll for window is disabled, but ground might be scrolled
        // Difference between position 0,0 of the page and 0,0 of the ground element, because interact.js takes 0,0 from ground
        // getBoundingClientRect is position before border and padding -> so I have to add it

        const groundBorderLeft = parseFloat(groundStyle.borderLeftWidth) || 0;
        const groundBorderTop = parseFloat(groundStyle.borderTopWidth) || 0;
        const groundPaddingLeft = parseFloat(groundStyle.paddingLeft) || 0;
        const groundPaddingTop = parseFloat(groundStyle.paddingTop) || 0;

        // Position of upper left corner of ground element
        const groundContentX = groundRect.left + groundBorderLeft + groundPaddingLeft;
        const groundContentY = groundRect.top + groundBorderTop + groundPaddingTop;

        orderedSnappedBlocks.forEach((snappedDef) => {
            snappedDef.forEach((snappedBlock) => {
                let plugEl = snappedBlock.plug.element;
                let plugRect = plugEl.getBoundingClientRect();

                let plugX = plugRect.left;
                let plugY = plugRect.top;

                let plugWidth = plugRect.width;
                let plugHeight = plugRect.height;

                let x = (plugX + plugWidth) - groundContentX - 3;
                let y = (plugY + plugHeight / 2) - dotYPosition - groundContentY;

                // Ground scroll offset
                x += groundEl.scrollLeft;
                y += groundEl.scrollTop;

                snappedBlock.child.element.style.transform = `translate(${x}px, ${y}px)`;
                snappedBlock.child.element.setAttribute('data-x', x);
                snappedBlock.child.element.setAttribute('data-y', y);
            });
        });
    }

    /**
     * Prints alert message.
     * @param {string} msg - The alert message.
     * @param {string} type - The type of alert (e.g., "danger", "success").
     */
    printAlert(msg, type) {
        let alertPlaceholder = document.getElementById("alertPlaceholder");

        const alertEl = document.createElement('div');
        alertEl.className = `alert alert-${type} alert-dismissible m-0 shadow-sm`;
        alertEl.setAttribute('role', 'alert');
        alertEl.innerHTML = [
            `   <div>${msg}</div>`,
            '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
        ].join('');

        alertPlaceholder.append(alertEl);

        setTimeout(() => {
            alertEl.remove();
        }, 10000);
    }

}
