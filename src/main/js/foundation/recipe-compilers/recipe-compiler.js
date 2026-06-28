function saveActiveRecipeState() {
    if (!activeRecipeId || !recipesDatabase[activeRecipeId]) return;
    const recipe = recipesDatabase[activeRecipeId];

    const titleInput = document.getElementById('recipeTitle');
    if (titleInput) recipe.name = titleInput.value.trim() || 'Untitled Recipe Template';

    const engineKey = recipe.engine || 'create:pressing';
    // recipe.engine is owned exclusively by switchEngine()/loadRecipeFromState().
    // Never set or derive it here.

    const codeArea = document.getElementById('recipeCodeTextarea');
    if (codeArea && recipe.engine) {
        const pasteEngKey = recipe.engine.replace('create:', '');
        if (!recipe.pasteState) recipe.pasteState = {};
        if (codeArea.value.trim()) recipe.pasteState[pasteEngKey] = codeArea.value;
    }

    const platformRad = document.querySelector('input[name="platform"]:checked');
    const platformValue = platformRad ? platformRad.value : 'universal';

    // Save per-engine (same pattern as conditionsByEngine)
    if (!recipe.platformByEngine) recipe.platformByEngine = {};
    recipe.platformByEngine[engineKey] = platformValue;

    // Keep top-level in sync as a fallback for old saves
    recipe.platform = platformValue;

    if (!recipe.conditionsByEngine) recipe.conditionsByEngine = {};
    const { forgeConditions, fabricConditions, neoConditions } = serializeAllConditions();
    recipe.conditionsByEngine[engineKey] = { forgeConditions, fabricConditions, neoConditions };
    recipe.conditions = forgeConditions;

    try {
        const completePayloadString = JSON.stringify(recipesDatabase);
        localStorage.setItem('create_recipes_db', completePayloadString);
        if (window.electronAPI && typeof window.electronAPI.writeRecipeFile === 'function') {
            window.electronAPI.writeRecipeFile(completePayloadString);
        }
    } catch (saveFault) {
        console.warn('Workspace persistence pipeline temporarily interrupted: ', saveFault);
    }
    localStorage.setItem('create_recipe_generator_cache', JSON.stringify(recipesDatabase));
}

function loadRecipeFromState(filename) {
    if (activeRecipeId && recipesDatabase[activeRecipeId]) {
        if (typeof captureLayoutSnapshot === 'function') {
            const outgoing = recipesDatabase[activeRecipeId];
            captureLayoutSnapshot(activeRecipeId, outgoing.engine || 'create:pressing');
        }
    }

    const outgoingCodeArea = document.getElementById('recipeCodeTextarea');
    if (activeRecipeId && recipesDatabase[activeRecipeId] && outgoingCodeArea) {
        const outgoingRecipe = recipesDatabase[activeRecipeId];
        const outgoingEngineKey = outgoingRecipe.engine || 'create:mixing';
        const outgoingEngKey = outgoingEngineKey.replace('create:', '');
        if (!outgoingRecipe.pasteState) outgoingRecipe.pasteState = {};
        const outVal = outgoingCodeArea.value.trim();
        if (outVal) outgoingRecipe.pasteState[outgoingEngKey] = outVal;

        // Persist the outgoing engine's live DOM state before tearing it down.
        getEngineModule(outgoingEngineKey).save(outgoingRecipe, outgoingEngineKey);
        outgoingCodeArea.value = '';
    }

    window._userHasPasted = false;
    if (window.workspaceIsolatorState) {
        window.workspaceIsolatorState.activePastedRawText = {};
        window.workspaceIsolatorState.cachedConditionTemplates = {};
    }

    if (!recipesDatabase[filename]) return;

    window._userClearedOutputs = false;
    window.isSwitchingLayouts = true;
    window.isWorkspaceSwappingLayout = true;

    activeRecipeId = filename;
    const recipe = recipesDatabase[filename];
    const engineKey = recipe.engine || 'create:mixing';
    window.currentActiveEngine = engineKey;
    currentActiveEngine = engineKey;

    const titleInput = document.getElementById('recipeTitle');
    if (titleInput) titleInput.value = recipe.name || 'Untitled Recipe Template';

    const savedPlatform = (recipe.platformByEngine && recipe.platformByEngine[engineKey]) || recipe.platform || 'universal';
    const platformRad = document.querySelector(`input[name="platform"][value="${savedPlatform}"]`);
    if (platformRad) platformRad.checked = true;

    window._loadingRecipeState = true;

    ['ingredientsContainer', 'assemblyStepsContainer', 'conditionsContainer', 'outputsContainerFluid', 'outputsContainerSimple'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });

    const tabElement = document.querySelector(`.engine-tab[data-engine="${engineKey}"]`) || document.querySelector(`.engine-tab[data-engine="${engineKey.replace('create:', '')}"]`) || document.querySelector(`.tab-button[data-engine="${engineKey}"]`);
    if (tabElement) {
        document.querySelectorAll('.engine-tab, .tab-button').forEach((b) => b.classList.remove('active'));
        tabElement.classList.add('active');
    }

    window._userClearedOutputs = true;
    if (typeof toggleEngineFields === 'function') toggleEngineFields();
    window._userClearedOutputs = false;
      

    if (typeof renderSidebarList === 'function') renderSidebarList(filename);

    window.isSwitchingLayouts = false;
    window.isWorkspaceSwappingLayout = false;

    const pasteCodeArea = document.getElementById('recipeCodeTextarea');
    if (pasteCodeArea && recipe.pasteState) {
        const pasteKey = engineKey.replace('create:', '');
        const savedPaste = recipe.pasteState[pasteKey] || '';
        window._restoringPasteState = true;
        pasteCodeArea.value = savedPaste;
        window._restoringPasteState = false;
        if (savedPaste) window._userHasPasted = true;
    }

    if (typeof syncRecipeCodeLineNumbers === 'function') syncRecipeCodeLineNumbers();
    if (typeof autoGrowRecipeTextarea === 'function') autoGrowRecipeTextarea();

    window._loadingRecipeState = false;
    if (typeof compileRecipe === 'function') compileRecipe();
}

function _restoreConditionsForEngine(recipe, engineKey) {
    const container = document.getElementById('conditionsContainer');
    if (!container) return;
    container.innerHTML = '';

    const saved = recipe.conditionsByEngine?.[engineKey];
    if (!saved) return;

    if (saved.forgeConditions || saved.fabricConditions || saved.neoConditions) {
        const syntheticNode = { recipes: [{}] };
        const inner = syntheticNode.recipes[0];
        if (saved.forgeConditions?.length) inner.conditions = saved.forgeConditions;
        if (saved.fabricConditions?.length) inner['fabric:load_conditions'] = saved.fabricConditions;
        if (saved.neoConditions?.length) inner['neoforge:conditions'] = saved.neoConditions;
        if (typeof hydrateCustomConditionBlockRows === 'function') {
            hydrateCustomConditionBlockRows(syntheticNode);
        }
        return;
    }

    // Legacy format: flat array of { scope, type, key, value }
    if (!Array.isArray(saved) || saved.length === 0) return;
    saved.forEach((cond) => {
        if (!cond.type) return;
        if (typeof addConditionBlock !== 'function') return;
        const beforeCount = container.children.length;
        addConditionBlock();
        const block = container.children[beforeCount] || container.lastElementChild;
        if (!block) return;
        const routeSel = block.querySelector('.cond-route-select');
        const typeInput = block.querySelector('.cond-type');
        const keyInput = block.querySelector('.cond-key');
        const valInput = block.querySelector('.cond-val');
        if (routeSel) routeSel.value = cond.scope || 'both';
        if (typeInput) typeInput.value = cond.type || '';
        if (keyInput) keyInput.value = cond.key || '';
        if (valInput) valInput.value = cond.value || '';
    });
}
function selectActiveRecipeTarget(filename) {
    loadRecipeFromState(filename);
}
