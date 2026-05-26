function saveActiveRecipeState() {
    if (!activeRecipeId || !recipesDatabase[activeRecipeId]) return;
    
    const recipe = recipesDatabase[activeRecipeId];
    
    const titleInput = document.getElementById('recipeTitle');
    if (titleInput) recipe.name = titleInput.value.trim() || "Untitled Recipe Template";
    
    recipe.engine = currentActiveEngine;
    
    const platformRad = document.querySelector('input[name="platform"]:checked');
    recipe.platform = platformRad ? platformRad.value : "universal";

    const targetEngine = (currentActiveEngine || 'mixing').replace('create:', '');
    
    if (['mixing', 'compacting'].includes(targetEngine)) {
        recipe.ingredients = [];
        const inputs = document.getElementById('ingredientsContainer')?.children || [];
        for (let container of inputs) {
            const id = container.querySelector('.ing-id')?.value || "";
            const isFluid = container.querySelector('.ing-is-fluid')?.checked || false;
            const amt = parseInt(container.querySelector('.ing-count')?.value) || 1;
            if (id) recipe.ingredients.push({ id, isFluid, amount: amt });
        }
    } else {
        const singleInput = document.getElementById('inputItem');
        if (singleInput && singleInput.value.trim()) {
            recipe.ingredients = [{ "item": singleInput.value.trim() }];
        } else {
            recipe.ingredients = [];
        }
    }

    recipe.outputs = [];
    const outputs = document.getElementById('outputsContainer')?.children || [];
    for (let container of outputs) {
        const id = container.querySelector('.out-id')?.value || "";
        const count = parseInt(container.querySelector('.out-count')?.value) || 1;
        const isFluid = container.querySelector('.out-is-fluid')?.checked || false;
        const chance = parseFloat(container.querySelector('.out-chance')?.value) || 1.0;
        if (id) recipe.outputs.push({ id, count, isFluid, chance });
    }

    recipe.conditions = [];
    const conditions = document.getElementById('conditionsContainer')?.children || [];
    for (let container of conditions) {
        const scope = container.querySelector('.cond-route-select')?.value || "both";
        const type = container.querySelector('.cond-type')?.value || "";
        const key = container.querySelector('.cond-key')?.value || "";
        const val = container.querySelector('.cond-val')?.value || "";
        if (type) recipe.conditions.push({ scope, type, key, value: val });
    }

    if (targetEngine === 'sequenced_assembly') {
        recipe.assemblySteps = [];
        const steps = document.getElementById('assemblyStepsContainer')?.children || [];
        for (let container of steps) {
            const type = container.querySelector('.step-type')?.value || "pressing";
            const id = container.querySelector('.ing-id')?.value || "";
            recipe.assemblySteps.push({ type, id });
        }
        const loops = document.getElementById('assemblyLoops');
        recipe.assemblyLoops = loops ? (parseInt(loops.value) || 1) : 1;
        const trans = document.getElementById('transitionalItem');
        recipe.transitionalItem = trans ? trans.value : "";
    }

    localStorage.setItem('create_recipe_generator_cache', JSON.stringify(recipesDatabase));
}

function loadRecipeFromState(filename) {
    if (!recipesDatabase[filename]) return;
    
    activeRecipeId = filename;
    const recipe = recipesDatabase[filename];
    
    currentActiveEngine = recipe.engine || "create:mixing";
    currentEngineType = currentActiveEngine;

    const titleInput = document.getElementById('recipeTitle');
    if (titleInput) titleInput.value = recipe.name || "Untitled Recipe Template";

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

    const targetEngine = currentActiveEngine.replace('create:', '');

    if (['mixing', 'compacting'].includes(targetEngine) && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ing => {
            if (typeof addIngredientBlock === 'function') {
                addIngredientBlock(ing.id);
                const lastChild = containerIng.lastChild;
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
        const singleInput = document.querySelector('#standardInputs .ing-id') || document.querySelector('.ing-id');
        if (singleInput && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
            singleInput.value = recipe.ingredients[0].id || "";
        } else if (singleInput) {
            singleInput.value = "";
        }
    }

    if (Array.isArray(recipe.outputs)) {
        recipe.outputs.forEach(out => {
            if (typeof addOutputBlock === 'function') {
                addOutputBlock(out.id);
                const lastChild = containerOut.lastChild;
                if (lastChild) {
                    const countInput = lastChild.querySelector('.out-count');
                    const fluidCheck = lastChild.querySelector('.out-is-fluid');
                    const chanceInput = lastChild.querySelector('.out-chance');
                    if (countInput) countInput.value = out.count;
                    if (fluidCheck) {
                        fluidCheck.checked = out.isFluid;
                        if (typeof toggleFluidOutputLabelContext === 'function') toggleFluidOutputLabelContext(fluidCheck, lastChild.id);
                    }
                    if (chanceInput) chanceInput.value = out.chance;
                }
            }
        });
    }

    if (Array.isArray(recipe.conditions)) {
        recipe.conditions.forEach(cond => {
            if (typeof addConditionBlock === 'function') {
                addConditionBlock();
                const lastChild = containerCond.lastChild;
                if (lastChild) {
                    const scopeSelect = lastChild.querySelector('.cond-route-select');
                    const typeInput = lastChild.querySelector('.cond-type');
                    const keyInput = lastChild.querySelector('.cond-key');
                    const valInput = lastChild.querySelector('.cond-val');
                    if (scopeSelect) scopeSelect.value = cond.scope;
                    if (typeInput) typeInput.value = cond.type;
                    if (keyInput) keyInput.value = cond.key;
                    if (valInput) valInput.value = cond.value;
                }
            }
        });
    }

    if (targetEngine === 'sequenced_assembly' && Array.isArray(recipe.assemblySteps)) {
        recipe.assemblySteps.forEach(step => {
            if (typeof addAssemblyStepBlock === 'function') {
                addAssemblyStepBlock(step.id);
                const lastChild = containerSteps.lastChild;
                if (lastChild) {
                    const typeSelect = lastChild.querySelector('.step-type');
                    if (typeSelect) typeSelect.value = step.type;
                }
            }
        });
        const loops = document.getElementById('assemblyLoops');
        if (loops) loops.value = recipe.assemblyLoops || 1;
        const trans = document.getElementById('transitionalItem');
        if (trans) trans.value = recipe.transitionalItem || "";
    }

    const tabElement = document.querySelector(`.engine-tab[data-engine="${currentActiveEngine}"]`);
    if (tabElement) {
        document.querySelectorAll('.engine-tab').forEach(b => b.classList.remove('active'));
        tabElement.classList.add('active');
    }

    if (typeof toggleEngineFields === 'function') toggleEngineFields();
    if (typeof compileRecipe === 'function') compileRecipe();
    if (typeof renderSidebarList === 'function') renderSidebarList();
}

function selectActiveRecipeTarget(filename) {
    saveActiveRecipeState();
    loadRecipeFromState(filename);
}


