const SIMPLE_OUTPUT_ENGINES = ['crushing', 'milling', 'cutting', 'splashing', 'sequenced_assembly'];

function switchEngine(buttonEl) {
    if (!activeRecipeId || !recipesDatabase[activeRecipeId]) return;
    const recipe = recipesDatabase[activeRecipeId];
    const previousEngineKey = recipe.engine || 'create:mixing';
    const newEngineKey = buttonEl.getAttribute('data-engine');

    const codeArea = document.getElementById('recipeCodeTextarea');
    const isMidPaste = window.workspaceIsolatorState && window.workspaceIsolatorState.isParsingLock;
    if (!isMidPaste && codeArea) {
        const oldKey = previousEngineKey.replace('create:', '');
        if (!recipe.pasteState) recipe.pasteState = {};
        if (codeArea.value.trim()) recipe.pasteState[oldKey] = codeArea.value;
    }

    if (typeof saveActiveRecipeState === 'function') saveActiveRecipeState();

    getEngineModule(previousEngineKey).save(recipe, previousEngineKey);

    const outgoingPlatformRad = document.querySelector('input[name="platform"]:checked');
    if (outgoingPlatformRad) {
        if (!recipe.platformByEngine) recipe.platformByEngine = {};
        recipe.platformByEngine[previousEngineKey] = outgoingPlatformRad.value;
        recipe.platform = outgoingPlatformRad.value;
    }

    if (previousEngineKey === newEngineKey) return;

    document.querySelectorAll('.engine-tab').forEach((b) => b.classList.remove('active'));
    buttonEl.classList.add('active');
    recipe.engine = newEngineKey;
    window.currentActiveEngine = newEngineKey;
    currentActiveEngine = newEngineKey;
    currentEngineType = newEngineKey;

    window.isSwitchingLayouts = true;
    if (typeof toggleEngineFields === 'function') toggleEngineFields();

    ['ingredientsContainer', 'outputsContainerFluid', 'outputsContainerSimple', 'assemblyStepsContainer'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });

   
    const condContainer = document.getElementById('conditionsContainer');
    if (condContainer) condContainer.innerHTML = '';
    if (typeof _restoreConditionsForEngine === 'function') {
        _restoreConditionsForEngine(recipe, newEngineKey);
    }

    getEngineModule(newEngineKey).restore(recipe, newEngineKey);

    const savedPlatform = (recipe.platformByEngine && recipe.platformByEngine[newEngineKey]) || 'universal';
    const incomingPlatformRad = document.querySelector(`input[name="platform"][value="${savedPlatform}"]`);
    if (incomingPlatformRad) incomingPlatformRad.checked = true;

    window.isSwitchingLayouts = false;

    if (!isMidPaste && codeArea) {
        const newKey = newEngineKey.replace('create:', '');
        const saved = recipe.pasteState?.[newKey] || '';
        window._restoringPasteState = true;
        codeArea.value = saved;
        window._restoringPasteState = false;
        if (typeof syncRecipeCodeLineNumbers === 'function') syncRecipeCodeLineNumbers();
        if (typeof autoGrowRecipeTextarea === 'function') autoGrowRecipeTextarea();
    }

    if (typeof renderSidebarList === 'function') renderSidebarList();
    if (typeof compileRecipe === 'function') compileRecipe();
}

function toggleEngineFields() {
    if (window._toggleEngineFieldsRunning) return;
    window._toggleEngineFieldsRunning = true;
    const standardBox = document.getElementById('standardInputs');
    const multiPanel = document.getElementById('multiInputsPanel');
    const assemblyBox = document.getElementById('assemblyPanel');
    const craftingGridBox = document.getElementById('mechanicalCraftingContainer');
    const fillingPanel = document.getElementById('fillingInputsPanel');
    const heatGroupEl = document.getElementById('heatRequirementGroup');
    const heatRow = document.getElementById('advancedHeatRow');
    const fluidRow = document.getElementById('advancedFluidRow');
    const kineticRow = document.getElementById('processDurationRow');

    [standardBox, multiPanel, assemblyBox, craftingGridBox, fillingPanel].forEach((el) => el?.classList.add('hidden'));
    [heatRow, fluidRow, kineticRow].forEach((row) => row?.classList.add('hidden'));

    const targetEngine = (currentActiveEngine || 'create:pressing').replace('create:', '');
    window.allowsFluid = ['mixing', 'compacting', 'filling'].includes(targetEngine);
    heatGroupEl?.classList.toggle('hidden', !['mixing', 'compacting'].includes(targetEngine));

    if (targetEngine === 'filling') {
        fillingPanel?.classList.remove('hidden');
    } else if (['mixing', 'compacting'].includes(targetEngine)) {
        multiPanel?.classList.remove('hidden');
        const addIngBtn = document.getElementById('addIngBtn');
        if (addIngBtn) addIngBtn.style.display = '';
        const ingLabel = multiPanel?.querySelector('label');
        if (ingLabel) ingLabel.style.display = '';
        const ingredientsContainer = document.getElementById('ingredientsContainer');
        if (ingredientsContainer) ingredientsContainer.style.display = '';
    } else if (targetEngine === 'sequenced_assembly') {
        [standardBox, assemblyBox].forEach((el) => el?.classList.remove('hidden'));
    } else if (targetEngine === 'mechanical_crafting') {
        multiPanel?.classList.remove('hidden');
        craftingGridBox?.classList.remove('hidden');
        const addIngBtn = document.getElementById('addIngBtn');
        if (addIngBtn) addIngBtn.style.display = 'none';
        const ingLabel = multiPanel?.querySelector('label');
        if (ingLabel) ingLabel.style.display = 'none';
        const ingredientsContainer = document.getElementById('ingredientsContainer');
        if (ingredientsContainer) ingredientsContainer.style.display = 'none';
        if (typeof generateCraftingGrid === 'function') generateCraftingGrid();
    } else if (['milling', 'crushing'].includes(targetEngine)) {
        standardBox?.classList.remove('hidden');
    } else {
        standardBox?.classList.remove('hidden');
    }

    if (['mixing', 'compacting'].includes(targetEngine)) {
        heatRow?.classList.remove('hidden');
        fluidRow?.classList.remove('hidden');
    } else if (targetEngine === 'filling') {
        fluidRow?.classList.remove('hidden');
    } else if (['milling', 'crushing', 'cutting'].includes(targetEngine)) {
        kineticRow?.classList.remove('hidden');
        const timeInput = document.getElementById('processingTimeInput');
        if (timeInput) {
            if (!timeInput.value || timeInput.value === '') timeInput.value = '200';
        }
    }

    const singleOutputPanel = document.getElementById('singleOutputInputsPanel');
    if (singleOutputPanel) {
        if (['pressing', 'filling', 'smoking', 'blasting', 'haunting', 'deploying', 'mechanical_crafting', 'sandpaper_polishing', 'item_application'].includes(targetEngine)) {
            singleOutputPanel.classList.remove('hidden');
        } else {
            singleOutputPanel.classList.add('hidden');
        }
    }
    const inputItem2Row = document.getElementById('inputItem2Row');
    if (inputItem2Row) {
        inputItem2Row.classList.toggle('hidden', targetEngine !== 'item_application');
    }
    const outputsPanel = document.getElementById('outputsPanel');
    const outputsPanelLabel = outputsPanel?.querySelector('label');
    if (outputsPanelLabel) {
        const hideLabel = ['pressing', 'filling', 'smoking', 'blasting', 'haunting', 'deploying', 'sandpaper_polishing', 'mechanical_crafting', 'item_application'].includes(targetEngine);
        outputsPanelLabel.style.display = hideLabel ? 'none' : '';
    }

    const allowsFluidOutput = ['mixing', 'compacting'].includes(targetEngine);
    document.querySelectorAll('.fluid-output-toggle-row').forEach((el) => el.classList.toggle('hidden', !allowsFluidOutput));

    const outputAmountField = document.getElementById('outputAmountField');
    const outputAmountHint = document.getElementById('outputAmountHint');
    const showOutputAmount = targetEngine === 'mechanical_crafting';
    outputAmountField?.classList.toggle('hidden', !showOutputAmount);
    outputAmountHint?.classList.toggle('hidden', !showOutputAmount);
    if (!showOutputAmount) {
        const countInput = document.getElementById('singleOutputProductCount');
        if (countInput) countInput.value = '1';
    }

    if (!allowsFluidOutput) {
        document.querySelectorAll('.out-is-fluid').forEach((checkbox) => {
            if (checkbox.checked) checkbox.checked = false;
            const label = checkbox.closest('.grid-cell-stacked-box')?.querySelector('.out-count-label');
            if (label) label.textContent = 'Amount';
        });
    }

    if (!window.allowsFluid && !window._hydratingFluid) {
        document.querySelectorAll('.ing-is-fluid').forEach((checkbox) => {
            if (checkbox.checked) {
                checkbox.checked = false;
                if (typeof checkbox.onchange === 'function') checkbox.onchange();
            }
        });
    }

    const hidesMultiOutputs = ['pressing', 'filling', 'blasting', 'smoking', 'haunting', 'deploying', 'sandpaper_polishing'].includes(targetEngine);

    const containerFluid = document.getElementById('outputsContainerFluid');
    const containerSimple = document.getElementById('outputsContainerSimple');
    const btnFluid = document.getElementById('addOutputBtnFluid');
    const btnSimple = document.getElementById('addOutputBtnSimple');

    containerFluid?.classList.add('hidden');
    containerSimple?.classList.add('hidden');
    btnFluid?.classList.add('hidden');
    btnSimple?.classList.add('hidden');

    if (['mixing', 'compacting'].includes(targetEngine)) {
        containerFluid?.classList.remove('hidden');
        btnFluid?.classList.remove('hidden');
        containerFluid?.querySelectorAll('.fluid-output-toggle-row').forEach((el) => el.classList.remove('hidden'));
    } else if (SIMPLE_OUTPUT_ENGINES.includes(targetEngine)) {
        containerSimple?.classList.remove('hidden');
        btnSimple?.classList.remove('hidden');
        if (btnSimple) {
            let addFn = 'addSequencedOutputBlock()';
            if (targetEngine !== 'sequenced_assembly') {
                const fullKey = `create:${targetEngine}`;
                if (typeof TimedRecipeData !== 'undefined' && TimedRecipeData.chanceOutputEngines.includes(fullKey)) {
                    addFn = 'addTimedOutputBlock()';
                } else {
                    addFn = 'addStandardOutputBlock()';
                }
            }
            btnSimple.setAttribute('onclick', addFn);
        }
    }

    window._toggleEngineFieldsRunning = false;
}

function setAdvancedRulesVisibility(shouldShow) {
    const advancedBox = document.querySelector('.advanced-options-disclosure');
    if (advancedBox) {
        if (shouldShow) {
            advancedBox.classList.remove('hidden');
        } else {
            advancedBox.classList.add('hidden');
            advancedBox.removeAttribute('open');
        }
    }
}
