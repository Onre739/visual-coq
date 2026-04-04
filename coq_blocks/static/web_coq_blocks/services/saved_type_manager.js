export default class SavedTypeManager {
    constructor() {
        this.STORAGE_KEY = "myData";
    }

    /**
     * Loads saved types from localStorage.
     * @returns {Array}
     */
    loadData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Saves types to localStorage.
     * @param {Array} data
     */
    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    /**
     * Adds a new type and persists it.
     * @param {Array} dataArray
     * @param {Object} newItem
     * @returns {Array}
     */
    addItem(dataArray, newItem) {
        const newData = [...dataArray, newItem];

        this.saveData(newData);
        return newData;
    }

    /**
     * Removes a type by id and persists the change.
     * @param {Array} dataArray
     * @param {string} id
     * @returns {Array}
     */
    removeItem(dataArray, id) {
        const newData = dataArray.filter(item => item.id !== id);

        this.saveData(newData);
        return newData;
    }
}
