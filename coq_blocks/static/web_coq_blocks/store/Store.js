export class Store {
    constructor(initialState = {}) {
        this.state = initialState;
        this.listeners = [];
    }

    /**
     * Returns current application state.
     * @returns {Object}
     */
    getState() {
        return this.state;
    }

    /**
     * Subscribes to state changes.
     * @param {Function} fn
     * @returns {Function} unsubscribe
     */
    subscribe(fn) {
        this.listeners.push(fn);
        this.notify();
        return () => {
            this.listeners = this.listeners.filter(l => l !== fn);
        };
    }

    /**
     * Notifies all subscribers about state changes.
     */
    notify() {
        this.listeners.forEach(fn => fn());
    }

    /**
     * Applies a shallow patch to state.
     * @param {Object} patch
     */
    setState(patch) {
        Object.assign(this.state, patch);
        this.notify();
    }
}
