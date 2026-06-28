/**
 * recipe-isolation.js
 *
 * Each recipe layout owns a domSnapshot keyed by engine.
 * Switching layouts serializes the outgoing DOM into the outgoing snapshot,
 * then deserializes the incoming snapshot into the DOM.
 * No clearing, no restore pipelines — the DOM state is the snapshot.
 */

// ── Snapshot helpers ───────────────────────────────────────────────────────────

function captureLayoutSnapshot(recipeId, engineKey) {
    if (!recipeId || !recipesDatabase[recipeId]) return;
    const recipe = recipesDatabase[recipeId];
    if (!recipe.domSnapshot) recipe.domSnapshot = {};

    const snap = {};

    // Title
    snap.name = document.getElementById('recipeTitle')?.value.trim() || recipe.name || '';

    // Platform
    const platformRad = document.querySelector('input[name="platform"]:checked');
    snap.platform = platformRad?.value || 'universal';

    // Wrapper checkbox
    snap.useForgeWrapper = document.getElementById('useForgeConditionalWrapper')?.checked || false;

    // Paste textarea
    snap.pasteText = document.getElementById('recipeCodeTextarea')?.value || '';

    // Conditions — serialize via existing function
    if (typeof serializeAllConditions === 'function') {
        const { forgeConditions, fabricConditions, neoConditions } = serializeAllConditions();
        snap.conditions = { forgeConditions, fabricConditions, neoConditions };
    }

    // Engine-specific fields
    const eng = engineKey.replace('create:', '');

    if (['mixing', 'compacting'].includes(eng)) {
        snap.heatRequirement = document.getElementById('basinHeatRequirement')?.value || 'none';
        snap.ingredients = _captureBlockList('ingredientsContainer', (block) => ({
            id: block.querySelector('.ing-id')?.value || '',
            isTag: block.querySelector('.ing-is-tag')?.checked || false,
            isFluid: block.querySelector('.ing-is-fluid')?.checked || false,
            amount: block.querySelector('.ing-count')?.value || '1000',
        }));
        snap.outputs = _captureBlockList('outputsContainerFluid', (block) => ({
            id: block.querySelector('.out-id')?.value || '',
            isTag: block.querySelector('.out-is-tag')?.checked || false,
            isFluid: block.querySelector('.out-is-fluid')?.checked || false,
            count: block.querySelector('.out-count')?.value || '1',
        }));
    } else if (eng === 'filling') {
        snap.baseItem = document.getElementById('inputItemFilling')?.value || '';
        snap.fluidName = document.getElementById('fluidInputName')?.value || '';
        snap.fluidAmount = document.getElementById('fluidInputAmount')?.value || '1000';
        snap.fluidNbt = document.getElementById('fluidInputNbt')?.value || '';
        snap.outputItem = document.getElementById('singleOutputProductId')?.value || '';
    } else if (eng === 'sequenced_assembly') {
        snap.inputItem = document.getElementById('inputItem')?.value || '';
        snap.transitionalItem = document.getElementById('transitionalItem')?.value || '';
        snap.assemblyLoops = document.getElementById('assemblyLoops')?.value || '1';
        snap.outputs = _captureBlockList('outputsContainerSimple', (block) => ({
            id: block.querySelector('.out-id')?.value || '',
            isTag: block.querySelector('.out-is-tag')?.checked || false,
            chance: block.querySelector('.out-chance')?.value || '1',
        }));
        snap.steps = [];
        const stepBlocks = document.getElementById('assemblyStepsContainer')?.children || [];
        for (const block of stepBlocks) {
            const type = block.querySelector('.step-type')?.value || 'pressing';
            const step = { type };
            if (type === 'deploying') step.id = block.querySelector('.ing-id')?.value || '';
            if (type === 'filling') {
                step.fluidId = block.querySelector('.step-fluid-id')?.value || '';
                step.fluidAmount = block.querySelector('.step-fluid-amount')?.value || '250';
                step.fabricMultiplier = block.querySelector('.step-fluid-fabric-multiplier')?.checked || false;
            }
            snap.steps.push(step);
        }
    } else if (eng === 'mechanical_crafting') {
        snap.width = document.getElementById('craftingWidth')?.value || '3';
        snap.height = document.getElementById('craftingHeight')?.value || '3';
        snap.acceptMirrored = document.getElementById('acceptMirrored')?.value || 'false';
        snap.outputItem = document.getElementById('singleOutputProductId')?.value || '';
        snap.outputCount = document.getElementById('singleOutputProductCount')?.value || '1';
        snap.gridMatrix = {};
        const w = parseInt(snap.width), h = parseInt(snap.height);
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                const cell = document.querySelector(`.craft-cell[data-row="${r}"][data-col="${c}"]`);
                if (cell?.value) snap.gridMatrix[`${r},${c}`] = cell.value;
            }
        }
        snap.keyDefinitions = {};
        document.querySelectorAll('.craft-key-resource').forEach(el => {
            const key = el.getAttribute('data-key');
            const type = document.querySelector(`.craft-key-type[data-key="${key}"]`)?.value || 'item';
            if (key) snap.keyDefinitions[key] = { type, value: el.value };
        });
    } else {
        // Standard / timed engines
        snap.inputItem = document.getElementById('inputItem')?.value || '';
        snap.inputItem2 = document.getElementById('inputItem2')?.value || '';
        snap.processingTime = document.getElementById('processingTimeInput')?.value || '';
        snap.outputItem = document.getElementById('singleOutputProductId')?.value || '';
        snap.outputCount = document.getElementById('singleOutputProductCount')?.value || '1';
        snap.outputs = _captureBlockList('outputsContainerSimple', (block) => ({
            id: block.querySelector('.out-id')?.value || '',
            isTag: block.querySelector('.out-is-tag')?.checked || false,
            count: block.querySelector('.out-count')?.value || '1',
            chance: block.querySelector('.out-chance')?.value || '100',
        }));
    }

    recipe.domSnapshot[engineKey] = snap;

    // Also keep enginesData and conditionsByEngine in sync for compile
    if (typeof getEngineModule === 'function') {
        getEngineModule(engineKey).save(recipe, engineKey);
    }
    if (snap.conditions) {
        if (!recipe.conditionsByEngine) recipe.conditionsByEngine = {};
        recipe.conditionsByEngine[engineKey] = snap.conditions;
        recipe.conditions = snap.conditions.forgeConditions || [];
    }
    if (!recipe.platformByEngine) recipe.platformByEngine = {};
    recipe.platformByEngine[engineKey] = snap.platform;
    recipe.platform = snap.platform;
    if (snap.name) recipe.name = snap.name;

    try {
        localStorage.setItem('create_recipe_generator_cache', JSON.stringify(recipesDatabase));
    } catch(e) {}
}

function applyLayoutSnapshot(recipeId, engineKey) {
    if (!recipeId || !recipesDatabase[recipeId]) return false;
    const recipe = recipesDatabase[recipeId];
    const snap = recipe.domSnapshot?.[engineKey];
    if (!snap) return false;

    const eng = engineKey.replace('create:', '');

    // Title
    const titleInput = document.getElementById('recipeTitle');
    if (titleInput && snap.name) titleInput.value = snap.name;

    // Platform
    if (snap.platform) {
        const rad = document.querySelector(`input[name="platform"][value="${snap.platform}"]`);
        if (rad) rad.checked = true;
    }

    // Wrapper checkbox
    const wrapCheck = document.getElementById('useForgeConditionalWrapper');
    if (wrapCheck) wrapCheck.checked = snap.useForgeWrapper || false;

    // Paste textarea
    const codeArea = document.getElementById('recipeCodeTextarea');
    if (codeArea) {
        window._restoringPasteState = true;
        codeArea.value = snap.pasteText || '';
        window._restoringPasteState = false;
        if (typeof syncRecipeCodeLineNumbers === 'function') syncRecipeCodeLineNumbers();
        if (typeof autoGrowRecipeTextarea === 'function') autoGrowRecipeTextarea();
    }

    // Engine fields
    if (['mixing', 'compacting'].includes(eng)) {
        const heatEl = document.getElementById('basinHeatRequirement');
        if (heatEl) heatEl.value = snap.heatRequirement || 'none';

        const ingContainer = document.getElementById('ingredientsContainer');
        if (ingContainer) ingContainer.innerHTML = '';
        (snap.ingredients || []).forEach(ing => {
            if (typeof addBasinIngredientBlock === 'function') addBasinIngredientBlock('', engineKey);
            const block = ingContainer?.lastElementChild;
            if (!block) return;
            const idEl = block.querySelector('.ing-id');
            const tagEl = block.querySelector('.ing-is-tag');
            const fluidEl = block.querySelector('.ing-is-fluid');
            const countEl = block.querySelector('.ing-count');
            if (idEl) idEl.value = ing.id;
            if (tagEl) tagEl.checked = ing.isTag;
            if (fluidEl) {
                fluidEl.checked = ing.isFluid;
                if (typeof toggleBasinFluidIngredientVisibility === 'function')
                    toggleBasinFluidIngredientVisibility(fluidEl, block.id);
            }
            if (countEl) countEl.value = ing.amount;
        });

        const outContainer = document.getElementById('outputsContainerFluid');
        if (outContainer) outContainer.innerHTML = '';
        (snap.outputs || []).forEach(out => {
            if (typeof addBasinOutputBlock === 'function') addBasinOutputBlock('', engineKey);
            const block = outContainer?.lastElementChild;
            if (!block) return;
            const idEl = block.querySelector('.out-id');
            const tagEl = block.querySelector('.out-is-tag');
            const fluidEl = block.querySelector('.out-is-fluid');
            const countEl = block.querySelector('.out-count');
            if (idEl) idEl.value = out.id;
            if (tagEl) tagEl.checked = out.isTag;
            if (fluidEl) {
                fluidEl.checked = out.isFluid;
                if (typeof toggleBasinFluidOutputVisibility === 'function')
                    toggleBasinFluidOutputVisibility(fluidEl, block.id);
            }
            if (countEl) countEl.value = out.count;
        });

    } else if (eng === 'filling') {
        const f = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        f('inputItemFilling', snap.baseItem);
        f('fluidInputName', snap.fluidName);
        f('fluidInputAmount', snap.fluidAmount);
        f('fluidInputNbt', snap.fluidNbt);
        f('singleOutputProductId', snap.outputItem);

    } else if (eng === 'sequenced_assembly') {
        const f = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        f('inputItem', snap.inputItem);
        f('transitionalItem', snap.transitionalItem);
        f('assemblyLoops', snap.assemblyLoops);

        const stepsContainer = document.getElementById('assemblyStepsContainer');
        if (stepsContainer) stepsContainer.innerHTML = '';
        (snap.steps || []).forEach(step => {
            if (typeof addAssemblyStepBlock === 'function') addAssemblyStepBlock();
            const block = stepsContainer?.lastElementChild;
            if (!block) return;
            const typeEl = block.querySelector('.step-type');
            if (typeEl) typeEl.value = step.type;
            if (typeof handleStepTypeFieldsUpdate === 'function') handleStepTypeFieldsUpdate(block.id);
            if (step.type === 'deploying') {
                const idEl = block.querySelector('.ing-id');
                if (idEl) idEl.value = step.id || '';
            } else if (step.type === 'filling') {
                const fIdEl = block.querySelector('.step-fluid-id');
                const fAmtEl = block.querySelector('.step-fluid-amount');
                const fFabEl = block.querySelector('.step-fluid-fabric-multiplier');
                if (fIdEl) fIdEl.value = step.fluidId || '';
                if (fAmtEl) fAmtEl.value = step.fluidAmount || '250';
                if (fFabEl) fFabEl.checked = step.fabricMultiplier || false;
            }
        });

        const outContainer = document.getElementById('outputsContainerSimple');
        if (outContainer) outContainer.innerHTML = '';
        (snap.outputs || []).forEach(out => {
            if (typeof addSequencedOutputBlock === 'function') addSequencedOutputBlock();
            const block = outContainer?.lastElementChild;
            if (!block) return;
            const idEl = block.querySelector('.out-id');
            const tagEl = block.querySelector('.out-is-tag');
            const chanceEl = block.querySelector('.out-chance');
            if (idEl) idEl.value = out.id;
            if (tagEl) tagEl.checked = out.isTag;
            if (chanceEl) chanceEl.value = out.chance;
        });

    } else if (eng === 'mechanical_crafting') {
        const widthEl = document.getElementById('craftingWidth');
        const heightEl = document.getElementById('craftingHeight');
        const mirrorEl = document.getElementById('acceptMirrored');
        if (widthEl) widthEl.value = snap.width || '3';
        if (heightEl) heightEl.value = snap.height || '3';
        if (mirrorEl) mirrorEl.value = snap.acceptMirrored || 'false';
        if (typeof generateCraftingGrid === 'function') generateCraftingGrid(snap.gridMatrix || {});
        Object.entries(snap.keyDefinitions || {}).forEach(([key, def]) => {
            const typeEl = document.querySelector(`.craft-key-type[data-key="${key}"]`);
            const valEl = document.querySelector(`.craft-key-resource[data-key="${key}"]`);
            if (typeEl) typeEl.value = def.type;
            if (valEl) valEl.value = def.value;
        });
        const outEl = document.getElementById('singleOutputProductId');
        if (outEl) outEl.value = snap.outputItem || '';
        const outCountEl = document.getElementById('singleOutputProductCount');
        if (outCountEl) outCountEl.value = snap.outputCount || '1';

    } else {
        // Standard / timed
        const f = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
        f('inputItem', snap.inputItem);
        f('inputItem2', snap.inputItem2);
        f('processingTimeInput', snap.processingTime);
        f('singleOutputProductId', snap.outputItem);
        f('singleOutputProductCount', snap.outputCount);

        const outContainer = document.getElementById('outputsContainerSimple');
        if (outContainer) outContainer.innerHTML = '';
        (snap.outputs || []).forEach(out => {
            const addFn = typeof addStandardOutputBlock === 'function' ? addStandardOutputBlock
                        : typeof addTimedOutputBlock === 'function' ? addTimedOutputBlock : null;
            if (!addFn) return;
            window._seedingOutputBlock = true;
            addFn();
            window._seedingOutputBlock = false;
            const block = outContainer?.lastElementChild;
            if (!block) return;
            const idEl = block.querySelector('.out-id');
            const tagEl = block.querySelector('.out-is-tag');
            const countEl = block.querySelector('.out-count');
            const chanceEl = block.querySelector('.out-chance');
            if (idEl) idEl.value = out.id;
            if (tagEl) tagEl.checked = out.isTag;
            if (countEl) countEl.value = out.count;
            if (chanceEl) chanceEl.value = out.chance;
        });
    }

    // Conditions
    if (snap.conditions && typeof hydrateCustomConditionBlockRows === 'function') {
        const container = document.getElementById('conditionsContainer');
        if (container) container.innerHTML = '';
        const syntheticNode = {};
        if (snap.conditions.forgeConditions?.length) syntheticNode.conditions = snap.conditions.forgeConditions;
        if (snap.conditions.fabricConditions?.length) syntheticNode['fabric:load_conditions'] = snap.conditions.fabricConditions;
        if (snap.conditions.neoConditions?.length) syntheticNode['neoforge:conditions'] = snap.conditions.neoConditions;
        if (Object.keys(syntheticNode).length > 0) hydrateCustomConditionBlockRows(syntheticNode);
    }

    return true;
}

function _captureBlockList(containerId, mapper) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.children).map(mapper);
}

// ── Safe outgoing save (used by delete and new recipe) ─────────────────────

function saveOutgoingRecipeState(outgoingId) {
    if (!outgoingId || !recipesDatabase[outgoingId]) return;
    const recipe = recipesDatabase[outgoingId];
    const engineKey = recipe.engine || 'create:pressing';
    captureLayoutSnapshot(outgoingId, engineKey);
}

// ── Delete ─────────────────────────────────────────────────────────────────

function deleteRecipeTarget(id) {
    if (!recipesDatabase[id]) return;
    const name = recipesDatabase[id].name || 'Untitled';
    if (!confirm(`Are you absolutely sure you want to delete "${name}"?`)) return;

    const isDeletingActive = activeRecipeId === id;

    if (!isDeletingActive) {
        delete recipesDatabase[id];
        try { localStorage.setItem('create_recipe_generator_cache', JSON.stringify(recipesDatabase)); } catch(e) {}
        if (typeof renderSidebarList === 'function') renderSidebarList();
        return;
    }

    // Save current DOM before removing
    saveOutgoingRecipeState(id);
    delete recipesDatabase[id];

    const remainingKeys = Object.keys(recipesDatabase);
    if (remainingKeys.length > 0) {
        const nextId = remainingKeys[0];
        const nextRecipe = recipesDatabase[nextId];
        const nextEngineKey = nextRecipe.engine || 'create:pressing';

        activeRecipeId = null; // prevent loadRecipeFromState from saving empty DOM
        window.currentActiveEngine = nextEngineKey;
        currentActiveEngine = nextEngineKey;

        // Switch engine tab
        document.querySelectorAll('.engine-tab, .tab-button').forEach(b => b.classList.remove('active'));
        const tabEl = document.querySelector(`.engine-tab[data-engine="${nextEngineKey}"]`);
        if (tabEl) tabEl.classList.add('active');

        activeRecipeId = nextId;

        window.isSwitchingLayouts = true;
        if (typeof toggleEngineFields === 'function') toggleEngineFields();
        window.isSwitchingLayouts = false;

        // Try snapshot first, fall back to enginesData restore
        const snapApplied = applyLayoutSnapshot(nextId, nextEngineKey);
        if (!snapApplied && typeof getEngineModule === 'function') {
            getEngineModule(nextEngineKey).restore(nextRecipe, nextEngineKey);
            if (typeof _restoreConditionsForEngine === 'function') {
                _restoreConditionsForEngine(nextRecipe, nextEngineKey);
            }
        }

        // Title and platform
        const titleInput = document.getElementById('recipeTitle');
        if (titleInput) titleInput.value = nextRecipe.name || '';

        if (!snapApplied) {
            const savedPlatform = nextRecipe.platformByEngine?.[nextEngineKey] || nextRecipe.platform || 'universal';
            const rad = document.querySelector(`input[name="platform"][value="${savedPlatform}"]`);
            if (rad) rad.checked = true;
        }

        try { localStorage.setItem('create_recipe_generator_cache', JSON.stringify(recipesDatabase)); } catch(e) {}
        if (typeof renderSidebarList === 'function') renderSidebarList(nextId);
        if (typeof compileRecipe === 'function') compileRecipe();

    } else {
        activeRecipeId = '';
        currentActiveEngine = 'create:pressing';
        ['ingredientsContainer', 'outputsContainer', 'assemblyStepsContainer',
         'conditionsContainer', 'outputsContainerFluid', 'outputsContainerSimple'].forEach(elId => {
            const el = document.getElementById(elId);
            if (el) el.innerHTML = '';
        });
        const titleInput = document.getElementById('recipeTitle');
        if (titleInput) titleInput.value = '';
        document.getElementById('singleOutputProductId') && (document.getElementById('singleOutputProductId').value = '');
        document.getElementById('inputItem') && (document.getElementById('inputItem').value = '');
        const tabEl = document.querySelector('.engine-tab[data-engine="create:pressing"]');
        if (tabEl) {
            document.querySelectorAll('.engine-tab').forEach(b => b.classList.remove('active'));
            tabEl.classList.add('active');
        }
        if (typeof toggleEngineFields === 'function') toggleEngineFields();
        try { localStorage.setItem('create_recipe_generator_cache', JSON.stringify(recipesDatabase)); } catch(e) {}
        if (typeof renderSidebarList === 'function') renderSidebarList();
        if (typeof compileRecipe === 'function') compileRecipe();
    }
}

window.captureLayoutSnapshot = captureLayoutSnapshot;
window.applyLayoutSnapshot = applyLayoutSnapshot;
window.saveOutgoingRecipeState = saveOutgoingRecipeState;
window.deleteRecipeTarget = deleteRecipeTarget;