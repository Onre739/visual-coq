import { DefinitionBlock } from "../models/block.js";
import { debugError } from "./debug.js";

export default class SnapManager {
    constructor() {

    }

    /**
     * Helper method to compare two types (which can be strings or recursive objects).
     * @param {string|Object} typeA 
     * @param {string|Object} typeB 
     * @returns {boolean}
     */
    areTypesEqual(typeA, typeB) {

        // 1. Handling "any"
        if (typeA === "any" || typeB === "any") return true;

        // 2. Handling null/undefined
        if (!typeA || !typeB) return false;

        // 3. If they are simple strings (e.g., "nat" === "nat")
        if (typeof typeA === 'string' && typeof typeB === 'string') {
            return typeA === typeB;
        }

        // 4. If one is string and other object -> try to compare string with object.name
        if (typeof typeA === 'string' && typeof typeB === 'object') {
            return typeA === typeB.name && (!typeB.args || typeB.args.length === 0);
        }
        if (typeof typeA === 'object' && typeof typeB === 'string') {
            return typeA.name === typeB && (!typeA.args || typeA.args.length === 0);
        }

        // 5. Structural comparison of Objects (Recursive)
        if (typeof typeA === 'object' && typeof typeB === 'object') {
            // A) Compare names
            if (typeA.name !== typeB.name) return false;

            // B) Compare number of arguments
            const argsA = typeA.args || [];
            const argsB = typeB.args || [];
            if (argsA.length !== argsB.length) return false;

            // C) Recursively compare arguments
            for (let i = 0; i < argsA.length; i++) {
                if (!this.areTypesEqual(argsA[i], argsB[i])) {
                    return false;
                }
            }
            return true;
        }

        return false;
    }

    /**
     * Calculate possible snap targets for a given block.
     * @param {Object} movedBlockObject - The block that is being moved
     * @param {Array} allBlockObjects - All blocks on the scene
     * @returns {Array} Array of snap targets [{x, y, block, plug, for}, ...]
     */
    calculateSnapTargets(movedBlockObject, allBlockObjects) {
        let newTargets = [];

        if (movedBlockObject instanceof DefinitionBlock) {
            return newTargets; // Definition blocks cannot snap
        }

        let requiredType = movedBlockObject.dotObject.type;

        allBlockObjects.forEach((blockObject) => {

            // Cannot snap to self
            if (blockObject !== movedBlockObject) {
                let blockElement = blockObject.element;

                // Check if the first child exists and has the class 'block-plug'
                if (blockElement) {
                    let plugObjects = blockObject.plugObjects;

                    if (plugObjects) {
                        plugObjects.forEach((plugObject) => {

                            // Check if plug is already occupied
                            if (plugObject.occupied) {
                                return;
                            }

                            let plugType = plugObject.type;

                            let plugEl = plugObject.element;
                            let rect = plugEl.getBoundingClientRect();

                            // Compare types
                            if (this.areTypesEqual(plugType, requiredType)) {
                                newTargets.push({

                                    // getBoundingClientRect() dává souřadnice vůči viewportu (oknu)
                                    // Pro absolutními souřadnice v dokumentu se musí přičíst scroll offset
                                    x: rect.left + rect.width + window.scrollX - 3,
                                    y: rect.top + rect.height / 2 + window.scrollY,

                                    block: blockObject,
                                    plug: plugObject,

                                    // Log snap targets, for whom they are (last moved block)
                                    for: movedBlockObject
                                });
                            }
                        });
                    }
                }
            }

        });

        return newTargets;
    }

    /**
     * Helper method to sync 'occupied' flag on plugs based on current snappedBlocks
     * @param {Array} blockObjects 
     * @param {Array} snappedBlocks 
     */
    updatePlugOccupancy(blockObjects, snappedBlocks) {
        // 1. Reset all plugs to unoccupied
        blockObjects.forEach(block => {
            if (block.plugObjects) {
                block.plugObjects.forEach(plug => {
                    plug.occupied = false;
                });
            }
        });

        // 2. Mark plugs involved in snaps as occupied
        snappedBlocks.forEach(snap => {
            if (snap.plug) {
                snap.plug.occupied = true;
            }
        });
    }

    /**
     * Calculate which blocks have just snapped together.
     * @param {Array} blockObjects - All blocks
     * @param {Array} snapTargets - All active snap targets
     * @param {number} dotOffset - Fixed pixel distance of the Dot from top of block (e.g. 60)
     * @returns {Array} Array of new snaps [{parent, plugIndex, plug, child}, ...]
     */
    checkForSnap(blockObjects, snapTargets, dotOffset) {
        let newSnappedBlocks = [];

        // Check positions of each block against snap targets
        blockObjects.forEach(blockObject => {
            // Check if there is at least one target designated for this block
            const relevantTargets = snapTargets.filter(t => t.for === blockObject);

            if (relevantTargets.length === 0) {
                return; // This block is not looking for anyone, skip
            }

            let rect = blockObject.element.getBoundingClientRect();
            let blockLeft = rect.left + window.scrollX;
            let blockTop = rect.top + window.scrollY;

            let candidates = [];

            relevantTargets.forEach(snapTarget => {
                let currentDotY = blockTop + dotOffset;
                let deltaX = Math.abs(snapTarget.x - blockLeft);
                let deltaY = Math.abs(snapTarget.y - currentDotY);

                // If it is within range
                if (deltaX < 15 && deltaY < 15) { // Tolerance 15px
                    candidates.push({
                        parent: snapTarget.block,
                        plugIndex: snapTarget.plug.index,
                        plug: snapTarget.plug,
                        child: blockObject,
                        distance: deltaX + deltaY
                    });
                }
            });

            // If there are multiple options, choose the closest one
            if (candidates.length > 0) {
                // Sort by distance (smallest first)
                candidates.sort((a, b) => a.distance - b.distance);

                // Take only the first one (the winner)
                const winner = candidates[0];

                // Remove the auxiliary 'distance' property and save the clean object
                newSnappedBlocks.push({
                    parent: winner.parent,
                    plugIndex: winner.plugIndex,
                    plug: winner.plug,
                    child: winner.child
                });
            }

        });
        return newSnappedBlocks;
    }

    /**
     * Compare two lists of snaps to see if they contain the same connections.
     * Assumes that the order of blocks in the Store is stable (which it usually is).
     * @param {Array} snapsA 
     * @param {Array} snapsB 
     * @returns {boolean} True if the snaps are equal, false otherwise
     */
    areSnapsEqual(snapsA, snapsB) {
        // 1. Check length
        if (snapsA.length !== snapsB.length) return false;

        // 2. Check content (item by item)
        for (let i = 0; i < snapsA.length; i++) {
            const a = snapsA[i];
            const b = snapsB[i];

            // Compare references to objects (parent, child, plug)
            // These references are stable as long as blocks are not deleted/created.
            if (a.parent !== b.parent ||
                a.child !== b.child ||
                a.plug !== b.plug) {
                return false;
            }
        }

        return true;
    }

    /**
     * Function for ordering blocks (flattening the tree).
     * @param {Array} snappedBlocks - List of connections
     * @returns {Array} Array of arrays of ordered blocks
     */
    // Ordering snapped blocks due to resizing and re-parsing
    orderSnappedBlocks(snappedBlocks) {
        // Find roots = blocks that are not children of any other block
        let rootBlocks = snappedBlocks.filter(block =>
            !snappedBlocks.some(otherBlock => otherBlock.child === block.parent)
        );

        let allOrdered = [];

        // For each root block, there is a separate queue and array of ordered blocks 
        rootBlocks.forEach(root => {
            let ordered = [];
            let queue = [root];

            while (queue.length > 0) {
                let currentBlock = queue.shift(); // Remove the first block from the queue
                ordered.push(currentBlock); // Add the block to the ordered array

                // Find all children of the current block
                let children = snappedBlocks.filter(b => b.parent === currentBlock.child);
                queue = queue.concat(children); // Add children to the queue
            }

            allOrdered.push(ordered);
        });

        // Check if we processed all blocks
        let flat = allOrdered.flat();
        if (flat.length !== snappedBlocks.length) {
            debugError("ORDERING BLOCK FAIL");
        }

        return allOrdered;
    }

    /**
     * Calculates which blocks are not snapped.
     * @param {Array} blockObjects - All blocks
     * @param {Array} snappedBlocks - All snapped blocks
     * @returns {Array} Array of blocks that are not snapped
     */
    getNotSnappedBlocks(blockObjects, snappedBlocks) {
        let notSnappedBlocks = blockObjects.filter(
            b1 => !snappedBlocks.some(b2 => b1 === b2.parent) &&
                !snappedBlocks.some(b3 => b1 === b3.child)
        );

        return notSnappedBlocks;
    }

}
