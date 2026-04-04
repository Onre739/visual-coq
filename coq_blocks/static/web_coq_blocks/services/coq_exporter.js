import { DefinitionBlock, AtomicBlock } from "../models/block.js";
import { formatType } from "./type_utils.js";

export default class COQExporter {
    /**
     * @param {Object} store
     */
    constructor(store) {
        this.store = store;
    }

    /**
     * Exports all definition blocks to a single Coq string.
     * @param {Array} blockObjects
     * @param {Array} snappedBlocks
     * @returns {string}
     */
    export(blockObjects, snappedBlocks) {

        let traversalResult = this.DFSTraverse(blockObjects, snappedBlocks);

        return traversalResult.output;
    }

    /**
     * Exports a single definition block to a Coq string.
     * @param {Object} rootBlock
     * @param {Array} snappedBlocks
     * @returns {string}
     */
    exportSingle(rootBlock, snappedBlocks) {

        // Object tree
        let defObj = this.traverseBlock(rootBlock, snappedBlocks);

        let finalOutput = this.stringifyDefinition(defObj, 0) + ".";

        return finalOutput;
    }

    /**
     * Depth-first traversal of all definition roots.
     * @param {Array} blockObjects
     * @param {Array} snappedBlocks
     * @returns {{result: Array, output: string}}
     */
    DFSTraverse(blockObjects, snappedBlocks) {
        let definitions = [];

        // Find all root blocks (DefinitionBlocks)
        let rootBlocks = blockObjects.filter(
            block => block instanceof DefinitionBlock
        );

        if (rootBlocks.length === 0) {
            throw new Error("Export failed: No Definition blocks found.");
        }

        // For each root block, get the object tree
        rootBlocks.forEach(rootBlock => {
            let defObj = this.traverseBlock(rootBlock, snappedBlocks);
            definitions.push(defObj);
        });

        // Build output strings
        let outputStrings = definitions.map(def => this.stringifyDefinition(def, 0) + ".");
        let finalOutput = outputStrings.join("\n");

        return {
            result: definitions,
            output: finalOutput
        };
    }

    /**
     * Recursive traversal of a block and its snapped children.
     * @param {Object} block
     * @param {Array} snappedBlocks
     * @returns {Object}
     */
    traverseBlock(block, snappedBlocks) {
        // Object for tree representation for return
        let ret = {
            // Auto-generated kind based on class name (e.g., "DefinitionBlock", "ConstructorBlock", "AtomicBlock")
            kind: (block instanceof AtomicBlock) ? "AtomicBlock" : block.constructor.name,
            block: block,
            children: []
        };

        block.plugObjects.forEach(plug => {
            let snap = snappedBlocks.find(s => s.plug === plug);

            if (snap) {
                ret.children.push(this.traverseBlock(snap.child, snappedBlocks));
            } else {
                let blockId =
                    block.blockName ||            // ConstructorBlock ("nat : S")
                    block.varName ||              // DefinitionBlock ("myFunction")
                    (block.typeObj ? block.typeObj.name : null) || // AtomicBlock ("nat")
                    "Unknown Block";

                throw new Error(`Export failed: Block '${blockId}' has an unconnected plug.`);
            }
        });

        return ret;
    }

    /**
     * Recursive stringification of the definition object.
     * @param {Object} def
     * @param {number} i
     * @returns {string}
     */
    stringifyDefinition(def, i) {
        let children = def.children.map(p => this.stringifyDefinition(p, i + 1));

        const forceExplicit = this.store ? this.store.getForceExplicitAt() : true;
        const isPolymorphic = def.kind === "ConstructorBlock" &&
            def.block.returnTypeObj &&
            def.block.returnTypeObj.args &&
            def.block.returnTypeObj.args.length > 0;
        const atPrefix = (forceExplicit && isPolymorphic) ? "@" : "";

        // Definition Block (i == 0)
        if (def.kind === "DefinitionBlock") {
            if (children.length === 0) throw new Error(`Definition '${def.block.varName}' is empty.`);
            return `Definition ${def.block.varName} ${children[0]}`;
        }

        // First behind definition (i == 1) -> ": Type := Value"
        else if (i === 1) {
            let typeStr = "Unknown";
            let valueStr = "";

            if (def.kind === "AtomicBlock") {
                typeStr = formatType(def.block.typeObj, false, forceExplicit);
                if (def.block.value === null || def.block.value === undefined || def.block.value === "") {
                    throw new Error(`Export failed: Atomic block '${typeStr}' has no value.`);
                }
                valueStr = def.block.value;
            }
            else if (def.kind === "ConstructorBlock") {
                typeStr = formatType(def.block.returnTypeObj, false, forceExplicit);

                // Constructor
                let parts = [`${atPrefix}${def.block.constructorName}`];

                if (def.block.returnTypeObj && def.block.returnTypeObj.args && def.block.returnTypeObj.args.length > 0) {
                    parts.push(def.block.returnTypeObj.args.map(arg => formatType(arg, true, forceExplicit)).join(" "));
                }
                if (children.length > 0) {
                    parts.push(children.join(" "));
                }

                valueStr = parts.join(" ");
            }

            return `: ${typeStr} := ${valueStr}`;
        }

        // Inner values (i > 1) -> Parantheses
        else {
            if (def.kind === "AtomicBlock") {
                const val = String(def.block.value);
                return val.includes(" ") ? `(${val})` : val;
            }
            else {
                // Constructor
                let parts = [`${atPrefix}${def.block.constructorName}`];

                if (def.block.returnTypeObj && def.block.returnTypeObj.args && def.block.returnTypeObj.args.length > 0) {
                    parts.push(def.block.returnTypeObj.args.map(arg => formatType(arg, true, forceExplicit)).join(" "));
                }
                if (children.length > 0) {
                    parts.push(children.join(" "));
                }

                // Add ( ) if there are blank spaces in the result
                const joinedParts = parts.join(" ");
                return joinedParts.includes(" ") ? `(${joinedParts})` : joinedParts;
            }
        }
    }
}
