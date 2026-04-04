import {
    ConstructorBlock, DefinitionBlock, AtomicBlock, NatBlock, BoolBlock, StringBlock
} from "../models/block.js";

export default class BlockFactory {
    constructor() { }

    /**
     * @param {Object} constructorObj - JSON constructor object
     * @param {string} typeName - Name of the data type (e.g., "nat", "bool")
     * @param {Array} typeParameters - Parameters of the data type[{ "X": null }, ...]
     * @param {string} id 
     * @param {string} color 
     */
    createConstructorBlock(constructorObj, typeName, typeParameters, id, color) {
        return new ConstructorBlock(constructorObj, typeName, typeParameters, id, color);
    }

    /**
     * @param {string} typeName - Name of the atomic data type (e.g., "nat", "bool")
     * @param {string} id 
     * @param {string} color 
     */
    createAtomicBlock(typeName, id, color) {
        switch (typeName) {
            case "nat":
                return new NatBlock(id, color);
            case "bool":
                return new BoolBlock(id, color);
            case "string":
                return new StringBlock(id, color);
            default:
                // Fallback to a generic AtomicBlock if the type is not recognized
                return new AtomicBlock(typeName, id, color);
        }
    }

    /**
     * Creates a new definition block instance.
     * @param {string} id
     * @returns {DefinitionBlock}
     */
    createDefinitionBlock(id) {
        const varName = "def"; // Name of the variable for definition: Definition def: nat := ......
        return new DefinitionBlock(varName, id);
    }
}
