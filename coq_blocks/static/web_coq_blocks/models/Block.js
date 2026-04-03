import { resolveTypeParams } from "../services/type_utils.js";

class BaseBlock {
    constructor(id, color) {
        this.id = id;
        this.color = color;
        this.element = null; // DOM element (assigned by renderer)
        this.needsLayoutUpdate = false; // Flag to indicate if layout update is needed after parameter change
        this.needsRenderUpdate = false; // Flag to indicate DOM re-render is needed
        this.zIndex = null; // z-index assigned by store, applied by view
    }
}

export class DefinitionBlock extends BaseBlock {
    constructor(varName, id) {
        super(id, "rgb(128, 128, 128)");
        this.plugObjects = [];
        this.varName = varName; // Name of the variable for definition
        this.plugsCount = 1;
    }
}

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

        this.typeName = typeName; // Name of the data type
        this.constructorName = constructorObj.name; // Name of the constructor
        this.typeParameters = typeParameters; // Parameters of the data type
        this.constructorObj = constructorObj;
        this.blockName = `${typeName} : ${constructorObj.name}`; // Name of entire block
        this.returnTypeObj = null;

        this.plugObjects = [];
        this.plugsCount = 0;
        this.dotObject = null;

        this.calculateReturnType();

        console.log("ConstructorBlock: Created for constructor:", this.constructorObj, "of type:", typeName, "with typeParameters:", typeParameters);
    }

    /**
     * Helper method: Creates and returns a map of type parameters for substitution (e.g., { "X": "nat" })
     * @return {Object} Map of type parameters
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
     * Helper method: Calculates and sets the return type of the block (Dot)
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
     * Updates the block's type parameters and refreshes the plugs and dot accordingly
     * @param {Array} newParams - New type parameters (e.g., [{ "X": "nat" }])
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

export class AtomicBlock extends BaseBlock {
    constructor(typeName, id, color) {
        super(id, color);

        this.typeObj = { name: typeName, args: [] };
        this.value = null;
        this.dotObject = null;
        this.plugObjects = [];

    }
}

export class NatBlock extends AtomicBlock {
    constructor(id, color) {
        super("nat", id, color); // Type name is "nat"
        this.value = "0"; // Default value
    }
}

export class BoolBlock extends AtomicBlock {
    constructor(id, color) {
        super("bool", id, color); // Type name is "bool"
        this.value = "true"; // Deafault value
    }
}

export class StringBlock extends AtomicBlock {
    constructor(id, color) {
        super("string", id, color);
        this.value = '""'; // Default value is an empty string in Coq
    }
}
