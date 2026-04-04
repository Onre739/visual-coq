import { debugLog } from "../services/debug.js";

export default class InteractionController {
    constructor(store, snapManager) {
        this.store = store;
        this.snapManager = snapManager;
        this.currentMovedBlock = null;
        this.draggingCluster = [];
    }

    /**
     * Initializes interact.js drag configuration and listeners.
     */
    initializeAutomaticResizeConfig() {
        interact('.draggable').draggable({
            inertia: false,
            autoScroll: true,
            listeners: {
                start: (event) => {
                    let target = event.target;

                    // 1. Find the main dragged block
                    let movedBlockObject = this.store.getBlockObjectByElement(target);

                    if (movedBlockObject) {
                        this.currentMovedBlock = movedBlockObject;

                        // 2. CLUSTER LOGIC: Find all children to move along
                        this.draggingCluster = this.store.getSubtree(movedBlockObject);

                        // 3. Update Z-Index for the WHOLE cluster
                        this.draggingCluster.forEach(block => {
                            const newZIndex = this.store.getAndIncrementZIndex();
                            block.zIndex = newZIndex;
                            block.element.style.zIndex = newZIndex;
                        });

                        // 4. Recalculate snap targets (Only for the head block!)
                        // Find new snap targets silently (without notify)
                        this.store.recalculateSnapTargetsSilent(movedBlockObject);
                        debugLog("Updated snap targets:", this.store.getSnapTargets());
                    }
                    else {
                        debugLog("Moved block not found in appStore");
                        this.draggingCluster = [];
                    }
                },

                move: (event) => {
                    // Loop through ALL blocks in the cluster and apply the SAME delta
                    if (this.draggingCluster.length > 0) {

                        this.draggingCluster.forEach(block => {
                            const el = block.element;

                            // Calculate new position based on previous attribute + delta
                            // IMPORTANT, x and y are calculated from GROUND ELEMENT !! not from the start of the document
                            let x = (parseFloat(el.getAttribute('data-x')) || 0) + event.dx;
                            let y = (parseFloat(el.getAttribute('data-y')) || 0) + event.dy;

                            // Update DOM
                            el.style.transform = `translate(${x}px, ${y}px)`;

                            // Save new state to DOM attributes
                            el.setAttribute('data-x', x);
                            el.setAttribute('data-y', y);
                        });
                    }
                },

                end: (event) => {
                    if (this.currentMovedBlock) {

                        // Actions after block drop: snap check, resize, drag control, delete buttons
                        this.store.handleBlockDrop(this.currentMovedBlock);

                        // Reset
                        this.currentMovedBlock = null;
                        this.draggingCluster = [];
                    }

                    debugLog('Drag ended', event);
                }
            },
            modifiers: [
                interact.modifiers.snap({
                    targets: this.store.getSnapTargets(),
                    range: 30,
                    relativePoints: [{ x: 0, y: 0 }],
                    offset: {
                        x: 0,
                        y: -this.store.getDotYPosition()
                    }
                }),
                interact.modifiers.restrictRect({
                    restriction: 'document',
                    endOnly: true
                })
            ]
        });
    }
}
