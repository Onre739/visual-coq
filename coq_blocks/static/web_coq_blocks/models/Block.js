import { resolveTypeParams } from "../services/type_utils.js";
import { debugLog } from "../services/debug.js";

/**
 * Base class for all blocks in the workspace.
 */
class BaseBlock {
    /**
     * @param {string} id
     * @param {string} color
     */
    constructor(id, color) {
        this.id = id;
        this.color = color;
        this.element = null; // DOM element (assigned by renderer)
        this.needsLayoutUpdate = false; // Flag to indicate if layout update is needed after parameter change
        this.needsRenderUpdate = false; // Flag to indicate DOM re-render is needed
        this.zIndex = null; // z-index assigned by store, applied by view
    }
}

/**
 * Represents a definition block (e.g., `Definition def := ...`).
 */
export class DefinitionBlock extends BaseBlock {
    /**
     * @param {string} varName
     * @param {string} id
     */
    constructor(varName, id) {
        super(id, "rgb(128, 128, 128)");
        this.plugObjects = [];
        this.varName = varName; // Name of the variable for definition
        this.plugsCount = 1;
    }
}

/**
 * Represents a constructor block for an inductive type.
 */
export class ConstructorBlock extends BaseBlock {
    /**
     * @param {Object} constructorObj - JSON Object representing the constructor
     * @param {string} typeName - Name of the data type (e.g., "nat", "bool")
     * @param {Array} typeParameters - [{ "X": "nat" }]
     * @param {string} id 
     * @param {string} color 
     */
    constructor(constructorObj, typeName, typeParameters, id, color) {
        super(id, color);

        this.typeName = typeName;
        this.constructorName = constructorObj.name;
        this.typeParameters = typeParameters;
        this.constructorObj = constructorObj;
        this.blockName = `${typeName} : ${constructorObj.name}`;
        this.returnTypeObj = null;

        this.plugObjects = [];
        this.plugsCount = 0;
        this.dotObject = null;

        this.calculateReturnType();

        debugLog("ConstructorBlock: Created for constructor:", this.constructorObj, "of type:", typeName, "with typeParameters:", typeParameters);
    }

    /**
     * Creates a map of type parameters for substitution (e.g., { "X": "nat" }).
     * @return {Object}
     */
    getTypeParamMap() {
        const typeParamMap = {};
        if (Array.isArray(this.typeParameters)) {
            this.typeParameters.forEach(obj => {
                const k = Object.keys(obj)[0];
                const v = obj[k];
                if (v) typeParamMap[k] = v;
            });
        }
        return typeParamMap;
    }

    /**
     * Calculates and sets the return type of the block (Dot).
     */
    calculateReturnType() {
        // If explicit returnType is given, use it, otherwise build from typeName and typeParameters
        const typeParamMap = this.getTypeParamMap();

        // Arrow style (explicit returnType given)
        const explicitReturnType = this.constructorObj.returnType;
        if (explicitReturnType && explicitReturnType.name !== "Unknown") {
            this.returnTypeObj = resolveTypeParams(explicitReturnType, typeParamMap); // Apply type parameter substitution
        }

        // Binder style (returnType not given)
        else {

            // Get name of type parameter and use it, if not given, use the key as placeholder
            // {X: "nat"} uses nat; {X: null} uses X
            // Does not need substitution here, we are building the type

            const paramArgs = [];
            if (this.typeParameters && Array.isArray(this.typeParameters)) {
                this.typeParameters.forEach(p => {
                    const key = Object.keys(p)[0];
                    const val = p[key];

                    if (val && typeof val === 'object') {                   // If value is already an object
                        paramArgs.push(JSON.parse(JSON.stringify(val)));
                    } else if (val) {                                       // If value is given as string, must create type object
                        paramArgs.push({ name: val, args: [] });
                    } else {                                                // If value is not given, use key as placeholder
                        paramArgs.push({ name: key, args: [] });
                    }
                });
            }
            this.returnTypeObj = { name: this.typeName, args: paramArgs };
        }
    }

    /**
     * Updates the block's type parameters and marks it for re-render.
     * @param {Array} newParams
     */
    updatePolymorphicParams(newParams) {
        this.typeParameters = newParams;

        this.plugObjects = [];
        this.plugsCount = 0;

        // Re-calculate return type with new parameters
        this.calculateReturnType();

        // Mark block for re-render in the workspace after updating parameters
        this.needsRenderUpdate = true;
        this.needsLayoutUpdate = true;
    }
}

/**
 * Represents an atomic block (base class for nat/bool/string).
 */
export class AtomicBlock extends BaseBlock {
    /**
     * @param {string} typeName
     * @param {string} id
     * @param {string} color
     */
    constructor(typeName, id, color) {
        super(id, color);

        this.typeObj = { name: typeName, args: [] };
        this.value = null;
        this.dotObject = null;
        this.plugObjects = [];

    }
}

/**
 * Atomic block for natural numbers.
 */
export class NatBlock extends AtomicBlock {
    /**
     * @param {string} id
     * @param {string} color
     */
    constructor(id, color) {
        super("nat", id, color); // Type name is "nat"
        this.value = "0"; // Default value
    }
}

/**
 * Atomic block for booleans.
 */
export class BoolBlock extends AtomicBlock {
    /**
     * @param {string} id
     * @param {string} color
     */
    constructor(id, color) {
        super("bool", id, color); // Type name is "bool"
        this.value = "true"; // Deafault value
    }
}

/**
 * Atomic block for strings.
 */
export class StringBlock extends AtomicBlock {
    /**
     * @param {string} id
     * @param {string} color
     */
    constructor(id, color) {
        super("string", id, color); // Type name is "string"
        this.value = '""'; // Default value is an empty string in Coq
    }
}
