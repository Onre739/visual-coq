export const LAYOUT_CONFIG = {
    PADDING_TOP: 20,      // Padding for block name
    PADDING_BOTTOM: 10,
    MIN_ROW_HEIGHT: 50,   // Row for plug, minimum height if no child is snapped
    ROW_GAP: 2,           // Gap between rows
};

/**
 * Sets the width for ConstructorBlock based on its content.
 * @param {ConstructorBlock} block - The ConstructorBlock to set the width for.
 */
export function constructorHorizontalResize(block) {
    let blockNameEl = block.element.querySelector(".blockName");
    let blockDeleteBtnEl = block.element.querySelector(".delete-block-btn");
    let blockSettingsBtnEl = block.element.querySelector(".settings-block-btn");

    let nameWidth = blockNameEl ? blockNameEl.offsetWidth : 0;

    let widestLabel = nameWidth
        + (blockDeleteBtnEl ? blockDeleteBtnEl.offsetWidth : 20)
        + (blockSettingsBtnEl ? blockSettingsBtnEl.offsetWidth : 20);

    // plug.width and dotLabelWidth are atributes computed in createElement
    let dotLabelWidth = block.dotObject ? block.dotObject.dotLabelWidth : 0;

    if (block.plugObjects && block.plugObjects.length > 0) {
        block.plugObjects.forEach(plug => {
            let total = plug.width + dotLabelWidth;

            if (total > widestLabel) {
                widestLabel = total;
            }
        });
    }

    if (dotLabelWidth > widestLabel) {
        widestLabel = dotLabelWidth;
    }

    block.element.style.width = (widestLabel + 50) + "px";
}

/**
 * Resizes the AtomicBlock based on its input content AND dot label width.
 * @param {AtomicBlock} block - The AtomicBlock to resize.
 */
export function atomicHorizontalResize(block) {
    const input = block.element.querySelector("input");
    const select = block.element.querySelector("select");
    const nameEl = block.element.querySelector(".blockName"); // Pro jistotu, kdyby tam ještě byl

    const activeEl = input || select;
    if (!activeEl) return;

    // 1. Calculate text width
    // Canvas method for accurate text width measurement
    const context = document.createElement("canvas").getContext("2d");
    context.font = getComputedStyle(activeEl).font;

    let text = "";
    let extraPadding = 0;

    if (input) { // For NatBlock and StringBlock
        text = input.value || input.placeholder || "";
    } else if (select) { // For BoolBlock
        text = select.options[select.selectedIndex]?.text || select.value || "";
        extraPadding = 25;
    }

    const textWidth = context.measureText(text).width;

    // 2. Set element width (min 50px, max 200px, padding cca 10px)
    const newWidth = Math.max(50, textWidth + extraPadding);
    const newWidthLimited = Math.min(newWidth, 200);

    activeEl.style.width = `${newWidthLimited}px`;

    // 3. Get widths of other elements
    const nameWidth = nameEl ? nameEl.offsetWidth : 0;

    // 4. Calculate final block width
    const inputLeft = activeEl.offsetLeft || 0;
    const widthForInput = inputLeft + newWidthLimited + 10; // Input + right padding of block
    const widthForName = nameWidth + 60; // Name + padding

    const blockWidth = Math.max(widthForName, widthForInput);

    block.element.style.width = `${blockWidth}px`;
}

/**
 * Calculates exact positions for plugs, dot and height for the parent block based on children sizes.
 * @param {Block} parentBlock 
 * @param {Array} currentSnaps - Array of all snap objects used to lookup children
 * @param {Object} layoutConfig - Layout configuration
 */
export function verticalLayoutResize(parentBlock, currentSnaps, layoutConfig = LAYOUT_CONFIG) {
    let currentY = layoutConfig.PADDING_TOP;

    // 1. Dot positioning
    if (parentBlock.dotObject) {
        const firstRowCenter = currentY + (layoutConfig.MIN_ROW_HEIGHT / 2);
        const dotTop = firstRowCenter - (parentBlock.dotObject.element.offsetHeight / 2);

        parentBlock.dotObject.element.style.top = `${dotTop}px`;
    }

    // 2. Plugs positioning
    if (parentBlock.plugObjects && parentBlock.plugObjects.length > 0) {
        parentBlock.plugObjects.forEach(plug => {

            let rowHeight = layoutConfig.MIN_ROW_HEIGHT;

            const snap = currentSnaps ? currentSnaps.find(s => s.plug === plug) : null;
            const lastPlug = parentBlock.plugObjects[parentBlock.plugObjects.length - 1];

            // If child exists, use its height
            if (snap && snap.child) {
                rowHeight = Math.max(layoutConfig.MIN_ROW_HEIGHT, snap.child.element.offsetHeight);

                // Last plug has extra padding space, blocks starts 30px above its row, so in the last row its extra
                if (plug === lastPlug) {
                    rowHeight = rowHeight - layoutConfig.PADDING_TOP - layoutConfig.PADDING_BOTTOM;
                }
            }

            // Place plug, not in the center of the row, but in the center of default row height !
            const plugCenterY = currentY + (layoutConfig.MIN_ROW_HEIGHT / 2);
            plug.element.style.top = `${plugCenterY - (plug.element.offsetHeight / 2)}px`;

            // Increment Y position for next row
            currentY += rowHeight + layoutConfig.ROW_GAP;
        });
    }
    else {
        currentY += layoutConfig.MIN_ROW_HEIGHT;
    }

    // 3. Final height of the parent block, minus the last ROW_GAP
    const finalHeight = currentY + layoutConfig.PADDING_BOTTOM - (parentBlock.plugObjects.length > 0 ? layoutConfig.ROW_GAP : 0);
    parentBlock.element.style.height = `${finalHeight}px`;
}
