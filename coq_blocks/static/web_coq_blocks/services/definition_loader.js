export default class DefinitionLoader {

    /**
     * Loads and parses a Coq definition from backend.
     * @param {string} definitionString
     * @returns {Promise<Object>}
     */
    async load(definitionString) {
        // Value check
        if (!definitionString || definitionString.trim() === "") {
            throw new Error("Definition string is empty");
        }

        let response = await fetch("/api/newdef/", {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: definitionString,
        });

        const responseText = await response.text();

        if (!response.ok) {
            let msg = response.statusText || "Failed to load definition";
            try {
                const errData = JSON.parse(responseText);
                if (errData && errData.error) {
                    msg = errData.error;
                }
            } catch {
                if (responseText && responseText.trim().length > 0) {
                    msg = responseText;
                }
            }
            throw new Error(msg);
        }

        const data = JSON.parse(responseText);
        return data;
    }

}
