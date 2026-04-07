import { Store } from './store.js';
import { debugLog } from '../services/debug.js';

// Design pattern: Singleton Store for application state management
export default class appStore extends Store {

    constructor(snapManager, savedTypeManager, blockFactory) {
        super({

            // Count of types and their blocks using Map.set(), get(), has(), delete()
            typeBlockCount: new Map(),

            // Count of definition blocks
            definitionBlockCount: 0,

            // Count of atomic blocks by id (Map: id -> count)
            atomicBlockCount: new Map(),

            // Objects of blocks and hypotheses from Block.js
            blockObjects: [],
            hypothesisObjects: [],

            // Array of possible snap targets for a dragged block: x, y, block, plug, for
            snapTargets: [],

            // Array of snapped blocks: parent, plugIndex, plug, child
            snappedBlocks: [],

            // Array of ordered snapped blocks for size changes, NOT ORDERED BY PLUGS !!! (1,2,...)
            orderedSnappedBlocks: [],

            // Saved types from SavedTypeManager, constructor blocks
            savedTypes: [],

            // Atomic types, default
            atomicTypes: [],

            // Whether to add '@' prefix to polymorphic types during export
            forceExplicitAt: true,

            zIndexCount: 1,

            resizeMode: "Auto",
        });

        this.snapManager = snapManager;
        this.savedTypeManager = savedTypeManager;
        this.blockFactory = blockFactory;

        // Load saved types from SavedTypeManager into the state
        this.loadSavedTypes();

        // Create atomic types
        const atomicTypeNames = ["nat", "bool", "string"];
        this.state.atomicTypes = atomicTypeNames.map(typeName => this.createAtomicType(typeName));
    }

    // Setter injection for BlockFactory (circular dependency)
    setBlockFactory(blockFactory) {
        this.blockFactory = blockFactory;
    }

    getTypeBlockCount(id) {
        const state = this.getState();
        return state.typeBlockCount.has(id) ? state.typeBlockCount.get(id) : 0;
    }

    getAtomicBlockCount(id) {
        const state = this.getState();
        return state.atomicBlockCount.has(id) ? state.atomicBlockCount.get(id) : 0;
    }

    getDefinitionBlockCount() {
        return this.getState().definitionBlockCount;
    }

    /**
     * Returns and increments z-index counter for new blocks.
     * @returns {number}
     */
    getAndIncrementZIndex() {
        const state = this.getState();
        const z = state.zIndexCount;
        state.zIndexCount += 1;
        return z;
    }

    getBlockObjects() {
        return this.getState().blockObjects;
    }

    getBlockObjectByElement(element) {
        const state = this.getState();
        return state.blockObjects.find(b => b.element === element);
    }

    getSnapTargets() {
        return this.getState().snapTargets;
    }

    getSnappedBlocks() {
        return this.getState().snappedBlocks;
    }

    getOrderedSnappedBlocks() {
        return this.getState().orderedSnappedBlocks;
    }

    getSavedTypes() {
        return this.getState().savedTypes;
    }

    getAtomicTypes() {
        return this.getState().atomicTypes;
    }
    getResizeMode() {
        return this.getState().resizeMode;
    }

    getForceExplicitAt() {
        return this.getState().forceExplicitAt;
    }

    /**
     * Sets whether exported code forces explicit arguments with "@".
     * @param {boolean} value
     */
    setForceExplicitAt(value) {
        this.getState().forceExplicitAt = value;
    }

    /**
     * Updates the name for a definition block instance.
     * @param {Object} block
     * @param {string} newName
     */
    setDefinitionBlockName(block, newName) {
        if (!block) return;
        block.varName = newName;
        this.notify();
    }

    getDotYPosition() {

        const BORDER_WIDTH = 2; // Border width of .block element in px
        const PADDING_TOP = 20; // Must match WorkspaceView.LAYOUT_CONFIG
        const ROW_HEIGHT = 50;  // Must match WorkspaceView.LAYOUT_CONFIG

        const innerCenterY = PADDING_TOP + (ROW_HEIGHT / 2);

        // Must include border width
        return BORDER_WIDTH + innerCenterY;

    }

    loadSavedTypes() {
        const data = this.savedTypeManager.loadData();
        this.state.savedTypes = data;
        this.notify();
    }

    /**
     * Create a new atomic type object from a name and return it.
     * @param {String} name 
     * @returns {Object}
     */
    createAtomicType(name) {
        // ID generation; crypto.randomUUID() or basic fallback
        const newId = self.crypto && self.crypto.randomUUID ? self.crypto.randomUUID() : 'atomic-' + Math.random().toString(36).substr(2, 9);

        // Simulate python type object
        const atomicTypeObj = {
            id: newId,
            name: name,
            sort: "atomic",
            color: "rgb(151, 151, 151)",
            typeParameters: [], // No type parameters
            constructors: [],    // No constructors
            fullText: ""
        };

        return atomicTypeObj
    }

    /**
     * Add a new type via SavedTypeManager to localStorage and update state.
     * @param {Object} newTypeObj
     */
    addSavedType(newTypeObj) {
        let typeParams = newTypeObj.typeParameters || [];

        // Transform type parameters from Python format to frontend format
        // Python: ["X", "Y"]; Frontend: [{ "X": null }, { "Y": null }]
        const frontendTypeParams = typeParams.map(paramName => {
            if (typeof paramName === 'object') return paramName;
            return { [paramName]: null };
        });

        // New data to save
        const dataToSave = {
            ...newTypeObj,
            typeParameters: frontendTypeParams
        };

        // Save to localStorage via SavedTypeManager
        const newSavedType = this.savedTypeManager.addItem(
            this.state.savedTypes,
            dataToSave,
        );

        // State update
        this.state.savedTypes = newSavedType;
        this.notify();
    }

    /**
     * Removes a saved type from localStorage.
     * @param {string} id
     */
    removeSavedType(id) {
        const newSavedTypes = this.savedTypeManager.removeItem(this.state.savedTypes, id);
        this.state.savedTypes = newSavedTypes;
        this.notify();
    }

    /**
     * Spawns a new atomic block instance for a saved atomic type.
     * @param {Object} typeItem
     */
    spawnAtomicBlock(typeItem) {
        // 1. Counter
        let currentCount = this.state.atomicBlockCount.get(typeItem.id) || 0;
        this.state.atomicBlockCount.set(typeItem.id, currentCount + 1);

        // 2. Block ID
        const blockId = `${typeItem.id}:${currentCount}`;

        // 3. Color
        const color = typeItem.color || "rgb(151, 151, 151)";

        // 4. Create instance via BlockFactory
        const newBlock = this.blockFactory.createAtomicBlock(typeItem.name, blockId, color);
        newBlock.zIndex = this.getAndIncrementZIndex();

        // 5. Save
        this.state.blockObjects.push(newBlock);
        this.notify();
    }

    /**
     * Spawns a new constructor block instance.
     * @param {Object} constructor
     * @param {string} typeName
     * @param {Array} typeParameters
     * @param {string} typeId
     */
    spawnClassicBlock(constructor, typeName, typeParameters, typeId) {
        // 1. Counter
        let currentCount = this.state.typeBlockCount.get(typeId) || 0;
        this.state.typeBlockCount.set(typeId, currentCount + 1);

        // 2. Block ID
        const blockId = `${typeId}:${currentCount}`;

        // 3. Color
        const typeItem = this.state.savedTypes.find(t => t.id === typeId);
        const defaultColor = "rgb(151, 151, 151)";
        const color = typeItem ? (typeItem.color || defaultColor) : defaultColor;

        // 4. Create instance via BlockFactory
        const newBlock = this.blockFactory.createConstructorBlock(
            constructor,
            typeName,
            typeParameters,
            blockId,
            color
        );
        newBlock.zIndex = this.getAndIncrementZIndex();

        // 5. Save
        this.state.blockObjects.push(newBlock);
        this.notify();
    }

    /**
     * Spawns a new definition block instance.
     */
    spawnDefinitionBlock() {
        const id = `defBlock:${this.state.definitionBlockCount++}`;
        const newBlock = this.blockFactory.createDefinitionBlock(id);
        newBlock.zIndex = this.getAndIncrementZIndex();
        this.state.blockObjects.push(newBlock);
        this.notify();
    }

    /**
     * Clears all blocks and resets the playground state.
     */
    clearPlayground() {
        this.state.blockObjects = [];
        this.state.snappedBlocks = [];
        this.state.orderedSnappedBlocks = [];
        this.state.typeBlockCount.clear();
        this.state.atomicBlockCount.clear();
        this.state.definitionBlockCount = 0;
        this.state.snapTargets.length = 0;
        this.state.zIndexCount = 1;

        this.notify();
    }

    /**
     * Updates color of a saved type and propagates to existing blocks.
     * @param {string} typeId
     * @param {string} newColor
     */
    updateTypeColor(typeId, newColor) {
        // 1. Update savedTypes
        const newSavedTypes = this.state.savedTypes.map(item => {
            if (item.id === typeId) {
                return { ...item, color: newColor };
            }
            return item;
        });

        this.savedTypeManager.saveData(newSavedTypes);
        this.state.savedTypes = newSavedTypes;

        // 2. Update existing blocks of this type
        const relevantBlocks = this.state.blockObjects.filter(block =>
            block.id.startsWith(typeId + ":")
        );

        relevantBlocks.forEach(block => {
            // A) Update block color property
            block.color = newColor;

            // B) Update main element block color
            if (block.element) {
                block.element.style.backgroundColor = newColor;
            }

            // C) Update Dot color, if the block has one
            if (block.dotObject) {
                block.dotObject.color = newColor;
                if (block.dotObject.element) {
                    block.dotObject.element.style.backgroundColor = newColor;
                }
            }

            // D) Update plugs color, if the block has plugs
            if (block.plugObjects && block.plugObjects.length > 0) {
                block.plugObjects.forEach(plug => {
                    plug.color = newColor;
                    if (plug.element) {
                        plug.element.style.backgroundColor = newColor;
                    }
                });
            }
        });

        this.notify();
    }

    /**
     * Change parameters for a specific block instance on the canvas.
     * @param {Block} block
     * @param {Array} newParameters
     */
    updateBlockInstanceParameters(block, newParameters) {
        if (block) {
            block.updatePolymorphicParams(newParameters);

            this.notify();
        }
    }

    /**
     * Removes a block from state and cleans related snap targets/snaps.
     * @param {Block} blockToRemove
     */
    removeBlock(blockToRemove) {
        const state = this.state;

        // 1) Remove from blockObjects
        state.blockObjects = state.blockObjects.filter(b => b !== blockToRemove);

        // 2) Remove from snappedBlocks, not needed
        state.snappedBlocks = state.snappedBlocks.filter(
            s => s.parent !== blockToRemove && s.child !== blockToRemove
        );

        // 3) Remove snapTargets 
        const validTargets = state.snapTargets.filter(
            t => t.block !== blockToRemove && t.plug.parentBlockEl !== blockToRemove.element
        );

        // CANT reassign, MUST keep reference for interact.js!!!
        state.snapTargets.length = 0;
        state.snapTargets.push(...validTargets);

        this.notify();
    }

    /**
     * Recalculates snap targets without notifying subscribers.
     * @param {Block} movedBlockObject
     */
    recalculateSnapTargetsSilent(movedBlockObject) {
        const state = this.state;

        // Free the plug occupied by movedBlockObject (if any)
        const currentSnap = state.snappedBlocks.find(s => s.child === movedBlockObject);
        if (currentSnap) {
            currentSnap.plug.occupied = false;
        }

        const newTargets = this.snapManager.calculateSnapTargets(movedBlockObject, state.blockObjects);
        // Update in-place, CAN'T reassign !!! KEEP REFERENCE !!!
        state.snapTargets.length = 0;
        state.snapTargets.push(...newTargets);

        // NO this.notify() !!!
    }

    /**
     * Handles logic after a block is dropped (snapping, targets update).
     * @param {Block} movedBlock
     */
    handleBlockDrop(movedBlock) {
        const state = this.state;
        const prevSnaps = state.snappedBlocks; // Old snaps
        const dotOffset = this.getDotYPosition();

        // 1. Keep previous snaps except those involving movedBlock
        const snapsToKeep = prevSnaps.filter(s => s.child !== movedBlock);

        // 2. New snaps for movedBlock, snapTargets exists only for movedBlock
        const newConnection = this.snapManager.checkForSnap(
            state.blockObjects,
            state.snapTargets,
            dotOffset
        );

        // 3. Combine previous and new snaps
        const nextSnaps = [...snapsToKeep, ...newConnection];

        // 4. Diff - check if snaps changed
        const hasChanged = !this.snapManager.areSnapsEqual(prevSnaps, nextSnaps);

        if (!hasChanged) {
            debugLog("Drop without changes - skip update");

            // Still need to update plug occupancy, just in case
            this.snapManager.updatePlugOccupancy(state.blockObjects, state.snappedBlocks);
            return;
        }

        // 5. Update state with new snaps
        const orderedSnaps = this.snapManager.orderSnappedBlocks(nextSnaps);

        this.state.snappedBlocks = nextSnaps;
        this.state.orderedSnappedBlocks = orderedSnaps;

        // 6. Update plug occupancy
        this.snapManager.updatePlugOccupancy(state.blockObjects, state.snappedBlocks);

        this.notify();
    }

    /**
     * Recursively finds the block and all its children.
     * @param {Object} rootBlock
     * @returns {Array} Array of Block objects (the cluster).
     */
    getSubtree(rootBlock) {
        let cluster = [rootBlock];

        const childrenSnaps = this.state.snappedBlocks.filter(
            s => s.plug.parentBlockEl === rootBlock.element
        );

        childrenSnaps.forEach(snap => {
            // Recursively add the child and its subtree
            const descendants = this.getSubtree(snap.child);
            cluster = cluster.concat(descendants);
        });

        return cluster;
    }

    /**
     * Saves new definitions as new types to localStorage and updates state.
     * @param {Object} data 
     */
    importDefinitions(data) {
        if (data) {
            data.forEach(newType => {
                this.addSavedType(newType);
            });
        }

        this.notify();
    }

}
