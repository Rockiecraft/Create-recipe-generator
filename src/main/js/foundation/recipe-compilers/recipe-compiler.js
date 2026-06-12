function saveActiveRecipeState() {
    if (!activeRecipeId || !recipesDatabase[activeRecipeId]) return;

    const recipe = recipesDatabase[activeRecipeId];

    const titleInput = document.getElementById('recipeTitle');
    if (titleInput) recipe.name = titleInput.value.trim() || 'Untitled Recipe Template';

    recipe.engine = currentActiveEngine;

    const platformRad = document.querySelector('input[name="platform"]:checked');
    recipe.platform = platformRad ? platformRad.value : 'universal';

    const targetEngine = (currentActiveEngine || 'mixing').replace('create:', '');

    if (['mixing', 'compacting'].includes(targetEngine)) {
        recipe.ingredients = [];
        const inputs = document.getElementById('ingredientsContainer')?.children || [];
        for (let container of inputs) {
            const id = container.querySelector('.ing-id')?.value || '';
            const isFluid = container.querySelector('.ing-is-fluid')?.checked || false;
            const amt = parseInt(container.querySelector('.ing-count')?.value) || 1;
            if (id) recipe.ingredients.push({ id, isFluid, amount: amt });
        }
    } else {
        const singleInput = document.getElementById('inputItem');
        if (singleInput && singleInput.value.trim()) {
            recipe.ingredients = [{ item: singleInput.value.trim() }];
        } else {
            recipe.ingredients = [];
        }
    }

    recipe.outputs = [];
    const outputs = document.getElementById('outputsContainer')?.children || [];
    for (let container of outputs) {
        const id = container.querySelector('.out-id')?.value || '';
        const count = parseInt(container.querySelector('.out-count')?.value) || 1;
        const isFluid = container.querySelector('.out-is-fluid')?.checked || false;
        const chance = parseFloat(container.querySelector('.out-chance')?.value) || 1.0;
        if (id) recipe.outputs.push({ id, count, isFluid, chance });
    }

    recipe.conditions = [];
    const conditions = document.getElementById('conditionsContainer')?.children || [];
    for (let container of conditions) {
        const scope = container.querySelector('.cond-route-select')?.value || 'both';
        const type = container.querySelector('.cond-type')?.value || '';
        const key = container.querySelector('.cond-key')?.value || '';
        const val = container.querySelector('.cond-val')?.value || '';
        if (type) recipe.conditions.push({ scope, type, key, value: val });
    }

    if (targetEngine === 'sequenced_assembly') {
        recipe.assemblySteps = [];
        const steps = document.getElementById('assemblyStepsContainer')?.children || [];
        for (let container of steps) {
            const type = container.querySelector('.step-type')?.value || 'pressing';
            const id = container.querySelector('.ing-id')?.value || '';
            recipe.assemblySteps.push({ type, id });
        }
        const loops = document.getElementById('assemblyLoops');
        recipe.assemblyLoops = loops ? parseInt(loops.value) || 1 : 1;
        const trans = document.getElementById('transitionalItem');
        recipe.transitionalItem = trans ? trans.value : '';
    }

    if (typeof recipesDatabase === 'undefined' || !recipesDatabase || !activeRecipeId || !recipesDatabase[activeRecipeId]) return;
    try {
        const recipe = recipesDatabase[activeRecipeId];
        if (typeof currentActiveEngine !== 'undefined' && currentActiveEngine) {
            recipe.engine = currentActiveEngine.includes('create:') ? currentActiveEngine : `create:${currentActiveEngine}`;
        }
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
    if (!recipesDatabase[filename]) return;

    // 1. LOCK STATE: Prevent background updates
    window.isSwitchingLayouts = true;
    window.isWorkspaceSwappingLayout = true;

    activeRecipeId = filename;
    const recipe = recipesDatabase[filename];
    const activeEngineStr = recipe.engine || 'create:mixing';
    window.currentActiveEngine = activeEngineStr;
    const targetEngine = activeEngineStr.replace('create:', '');
    const dataStore = recipe.enginesData ? recipe.enginesData[window.currentActiveEngine] : null;

    const titleInput = document.getElementById('recipeTitle');
    if (titleInput) titleInput.value = recipe.name || 'Untitled Recipe Template';

    const platformRad = document.querySelector(`input[name="platform"][value="${recipe.platform || 'universal'}"]`);
    if (platformRad) platformRad.checked = true;

    const containerIng = document.getElementById('ingredientsContainer');
    const containerOut = document.getElementById('outputsContainer');
    const containerSteps = document.getElementById('assemblyStepsContainer');
    const containerCond = document.getElementById('conditionsContainer');

    if (containerIng) containerIng.innerHTML = '';
    if (containerOut) containerOut.innerHTML = '';
    if (containerSteps) containerSteps.innerHTML = '';
    if (containerCond) containerCond.innerHTML = '';

    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach((ing) => {
            if (typeof addIngredientBlock === 'function') {
                addIngredientBlock();
                const lastChild = containerIng.lastChild;
                if (lastChild) {
                    const idInput = lastChild.querySelector('.ing-id');
                    const fluidCheck = lastChild.querySelector('.ing-is-fluid');
                    const countInput = lastChild.querySelector('.ing-count');

                    if (idInput) idInput.value = ing.id || '';
                    if (fluidCheck) fluidCheck.checked = !!ing.isFluid;
                    if (countInput) countInput.value = ing.amount || '1';
                }
            }
        });
    }

    if (recipe.outputs && Array.isArray(recipe.outputs)) {
        recipe.outputs.forEach((out) => {
            if (typeof addOutputBlock === 'function') {
                const lastChild = containerOut.lastChild;
                if (lastChild) {
                    const idInput = lastChild.querySelector('.out-id') || lastChild.querySelector('input[type="text"]');
                    const countInput = lastChild.querySelector('.out-count');
                    const fluidCheck = lastChild.querySelector('.out-is-fluid');
                    const chanceInput = lastChild.querySelector('.out-chance');

                    if (idInput) idInput.value = out.id || '';
                    if (countInput) countInput.value = out.count || '1';
                    if (fluidCheck) fluidCheck.checked = !!out.isFluid;
                    if (chanceInput) chanceInput.value = out.chance || '1.0';
                }
            }
        });
    }
    if ((!recipe.outputs || recipe.outputs.length === 0) && (!dataStore || !dataStore.outputs || dataStore.outputs.length === 0)) {
        if (typeof addOutputBlock === 'function' && ['mixing', 'compacting'].includes(targetEngine)) {
            addOutputBlock();
        }
    }

    currentActiveEngine = recipe.engine || 'create:mixing';

    document.querySelectorAll('#ingredientsContainer, #outputsContainer, #assemblyStepsContainer, #conditionsContainer').forEach((el) => (el.innerHTML = ''));

    if (targetEngine === 'sequenced_assembly' && dataStore) {
        if (Array.isArray(dataStore.assemblySteps)) {
            dataStore.assemblySteps.forEach((step) => {
                if (typeof addAssemblyStepBlock === 'function') {
                    addAssemblyStepBlock(step.id);
                    const lastChild = containerSteps ? containerSteps.lastElementChild : null;
                    if (lastChild) {
                        const typeSelect = lastChild.querySelector('.step-type') || lastChild.querySelector('select');

                        if (typeSelect && step.type) {
                            typeSelect.value = step.type;
                        }
                    }
                }
            });
        }
    }

    if (targetEngine === 'mechanical_crafting' && dataStore && Array.isArray(dataStore.ingredients)) {
        if (dataStore.ingredients.length > 0) {
            dataStore.ingredients.forEach((ing) => {
                if (typeof addIngredientBlock === 'function') {
                    addIngredientBlock(ing.id);
                    const lastChild = containerIng.lastElementChild;
                    if (lastChild) {
                        const countInput = lastChild.querySelector('.ing-count');
                        if (countInput) countInput.value = ing.amount || 1;
                        const fluidCheck = lastChild.querySelector('.ing-is-fluid');
                        if (fluidCheck) fluidCheck.checked = false;
                    }
                }
            });
        } else {
            if (typeof addIngredientBlock === 'function') addIngredientBlock();
        }
    } else if (['mixing', 'compacting'].includes(targetEngine) && dataStore && Array.isArray(dataStore.ingredients)) {
        if (dataStore.ingredients.length > 0) {
            dataStore.ingredients.forEach((ing) => {
                if (typeof addIngredientBlock === 'function') {
                    addIngredientBlock(ing.id);
                    const lastChild = containerIng.lastElementChild;
                    if (lastChild) {
                        const fluidCheck = lastChild.querySelector('.ing-is-fluid');
                        const countInput = lastChild.querySelector('.ing-count');
                        if (fluidCheck) {
                            fluidCheck.checked = ing.isFluid;
                            if (typeof toggleFluidLabelContext === 'function') toggleFluidLabelContext(fluidCheck, lastChild.id);
                        }
                        if (countInput) countInput.value = ing.amount;
                    }
                }
            });
        } else {
            if (typeof addIngredientBlock === 'function') addIngredientBlock();
        }
    } else {
        const singleInput = document.querySelector('#standardInputs .ing-id') || document.querySelector('.ing-id');
        if (singleInput) {
            singleInput.value = dataStore ? dataStore.inputItem || '' : '';
        }
    }

    if (['mixing', 'compacting'].includes(targetEngine) && dataStore && Array.isArray(dataStore.outputs)) {
        if (dataStore.outputs.length > 0) {
            dataStore.outputs.forEach((out) => {
                if (typeof addOutputBlock === 'function') {
                    addOutputBlock(out.id);
                    const lastChild = containerOut.lastElementChild;
                    if (lastChild) {
                        const countInput = lastChild.querySelector('.out-count');
                        const fluidCheck = lastChild.querySelector('.out-is-fluid');
                        const chanceInput = lastChild.querySelector('.out-chance');

                        if (countInput) countInput.value = out.count || 1;
                        if (fluidCheck) {
                            fluidCheck.checked = !!out.isFluid;
                            if (typeof toggleFluidOutputLabelContext === 'function') {
                                toggleFluidOutputLabelContext(fluidCheck, lastChild.id);
                            }
                        }
                        if (chanceInput) chanceInput.value = out.chance !== undefined ? out.chance : '1.0';
                    }
                }
            });
        } else {
            if (typeof addOutputBlock === 'function') addOutputBlock();
        }
    } else if (targetEngine !== 'mechanical_crafting') {
        const singleOutputInput = document.getElementById('singleOutputProductId') || document.getElementById('outputItem');
        if (singleOutputInput) {
            singleOutputInput.value = dataStore ? dataStore.outputItem || '' : '';
        }
    }

    if (!['mixing', 'compacting'].includes(targetEngine)) {
        if (containerOut) containerOut.innerHTML = '';
    }

    const tabElement = document.querySelector(`.engine-tab[data-engine="${window.currentActiveEngine}"]`) || document.querySelector(`.tab-button[data-engine="${window.currentActiveEngine}"]`);

    if (tabElement) {
        document.querySelectorAll('.engine-tab, .tab-button').forEach((b) => b.classList.remove('active'));
        tabElement.classList.add('active');
    }
    const singleOutputBox = document.getElementById('singleOutputProductId') || document.getElementById('outputItem');
    if (singleOutputBox && dataStore) dataStore.outputItem = singleOutputBox.value.trim();

    if (typeof toggleEngineFields === 'function') toggleEngineFields();
    if (typeof renderSidebarList === 'function') renderSidebarList(filename);

    window.isSwitchingLayouts = false;
    window.isWorkspaceSwappingLayout = false;
    if (typeof compileRecipe === 'function') compileRecipe();
}

function selectActiveRecipeTarget(filename) {
    loadRecipeFromState(filename);
}
