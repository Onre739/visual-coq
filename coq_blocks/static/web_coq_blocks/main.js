import AppStore from "./store/app_store.js";
import BlockFactory from "./factories/block_factory.js";
import DefinitionLoader from "./services/definition_loader.js";
import COQExporter from "./services/coq_exporter.js";
import SavedTypeManager from "./services/saved_type_manager.js";
import InteractionController from './views/interaction_controller.js';
import SnapManager from './services/snap_manager.js';
import WorkspaceView from './views/workspace_view.js';
import SidebarView from './views/sidebar_view.js';
import { debugLog, debugError } from "./services/debug.js";

const MESSAGES = {
    exportSuccess: "Export successful!!",
    globalSettingsUpdated: "Global settings updated.",
    definitionLoaded: "Definition loaded successfully."
};

// ----- Initialize store and main components -----
const snapManager = new SnapManager();
const savedTypeManager = new SavedTypeManager();
const definitionLoader = new DefinitionLoader();

const store = new AppStore(snapManager, savedTypeManager, null);
const coqExporter = new COQExporter(store);

const blockFactory = new BlockFactory(store);
store.setBlockFactory(blockFactory);

// Handler for exporting
const handleSingleExport = (rootBlock) => {
    const allSnaps = store.getSnappedBlocks();

    try {
        const coqString = coqExporter.exportSingle(rootBlock, allSnaps);

        if (coqString) {
            sidebarView.showExportResult(coqString);
            workspaceView.printAlert(MESSAGES.exportSuccess, "success");

            const showExportsBtn = document.getElementById('showExportsBtn');
            if (showExportsBtn) showExportsBtn.click();
        }

    } catch (error) {
        debugError(error);
        workspaceView.printAlert(error.message, "danger");
    }
};

const workspaceView = new WorkspaceView(store, snapManager, handleSingleExport);
const sidebarView = new SidebarView(store);

// Initialize interaction controller, interact.js
const interactionController = new InteractionController(store, snapManager);
interactionController.initializeAutomaticResizeConfig();

// Subscribe views to store updates
workspaceView.subscribeToStore();
sidebarView.subscribeToStore();

// ----- New Definition Block button -----
const newDefBtn = document.getElementById("newDefBtn");

newDefBtn.addEventListener("click", () => {
    store.spawnDefinitionBlock();
});

// ----- Clear Playground button -----
const clearPlaygroundBtn = document.getElementById("clearPlaygroundBtn");

if (clearPlaygroundBtn) {
    clearPlaygroundBtn.addEventListener("click", () => {
        if (confirm("Do you really want to clear the playground? This action cannot be undone.")) {
            store.clearPlayground();
        }
    });
}

// ----- Global Settings button -----
const globalSettingModalSaveBtn = document.getElementById("globalSettingModalSaveBtn");
const forceExplicitAtCheckbox = document.getElementById("forceExplicitAtCheckbox");
const globalSettingModal = document.getElementById("globalSettingModal");
const globalSettingBtn = document.getElementById("globalSettingBtn");

const syncGlobalSettingsModal = () => {
    if (forceExplicitAtCheckbox) {
        forceExplicitAtCheckbox.checked = store.getForceExplicitAt();
    }
};

// Initialize checkbox state from store
syncGlobalSettingsModal();

if (globalSettingBtn) {
    globalSettingBtn.addEventListener("click", syncGlobalSettingsModal);
}

if (globalSettingModal) {
    globalSettingModal.addEventListener("show.bs.modal", syncGlobalSettingsModal);
}

if (globalSettingModalSaveBtn && forceExplicitAtCheckbox) {
    globalSettingModalSaveBtn.addEventListener("click", () => {
        store.setForceExplicitAt(forceExplicitAtCheckbox.checked);
        workspaceView.printAlert(MESSAGES.globalSettingsUpdated, "success");
    });
}

const infoGlobalAtBtnHTML = document.getElementById("info-global-at-btn");
if (infoGlobalAtBtnHTML) {
    new bootstrap.Popover(infoGlobalAtBtnHTML, {
        customClass: 'info-popover',
        trigger: 'hover'
    });

    infoGlobalAtBtnHTML.addEventListener('show.bs.popover', () => {
        infoGlobalAtBtnHTML.classList.replace('text-info', 'text-info-emphasis');
        infoGlobalAtBtnHTML.style.transform = 'scale(1.1)';
    });

    infoGlobalAtBtnHTML.addEventListener('hide.bs.popover', () => {
        infoGlobalAtBtnHTML.classList.replace('text-info-emphasis', 'text-info');
        infoGlobalAtBtnHTML.style.transform = 'scale(1)';
    });
}

// ----- Classic Type Creation button -----
const loadBtn = document.getElementById("loadBtn");
const defInput = document.getElementById("defInput");

loadBtn.addEventListener("click", async () => {
    const definitionText = defInput.value;

    try {
        const data = await definitionLoader.load(definitionText);
        debugLog("Loaded definition data:", data);

        store.importDefinitions(data);
        defInput.value = "";
        workspaceView.printAlert(MESSAGES.definitionLoaded, "success");

    } catch (error) {
        debugError("Error loading definition:", error);
        workspaceView.printAlert(error.message, "danger");
    }
});

debugLog("Application initialized.");
