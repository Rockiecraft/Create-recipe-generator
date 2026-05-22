function compileRecipe() {
        const activeRadio = document.querySelector('input[name="platform"]:checked');
    const platformSelection = activeRadio ? activeRadio.value : "universal";
    let coreRecipe = {};
    const rawEngine = currentActiveEngine || 'mixing';
    const targetEngine = rawEngine.replace('create:', '');
    
    let demandsFabricFormat = (platformSelection === "fabric_only") || document.getElementById('autoConvertFabricFluids')?.checked;
    let compiledResultsArray = [];
    const outputContainers = document.getElementById('outputsContainer').children;
    const allowsChance = ['crushing', 'sequenced_assembly', 'milling', 'splashing'].includes(targetEngine);

    const ALLOWED_FLUID_ENGINES = ['mixing', 'compacting', 'filling'];
    const ENGINES_WITH_CHANCE = ['crushing', 'sequenced_assembly', 'splashing'];
    const SEQUENCED_ASSEMBLY_STEP_TYPES = ['pressing', 'deploying', 'filling'];


    for (let container of outputContainers) {
        const idInput = container.querySelector('.out-id');
        const countInput = container.querySelector('.out-count');
        const fluidCheck = container.querySelector('.out-is-fluid');
        const chanceInput = container.querySelector('.out-chance');

        if (!idInput || !idInput.value) continue;

        if (fluidCheck && fluidCheck.checked) {
            let amount = parseInt(countInput.value) || 1000;
            if (demandsFabricFormat) amount *= 81;
            
            compiledResultsArray.push({
                "fluid": idInput.value,
                "amount": amount
            });
        } else {
            let itemObject = {
                "item": idInput.value,
                "count": parseInt(countInput.value) || 1
            };
            if (allowsChance && chanceInput) {
                const chanceVal = parseFloat(chanceInput.value);
                if (!isNaN(chanceVal) && chanceVal < 1.0) {
                    itemObject.chance = chanceVal;
                }
            }
            compiledResultsArray.push(itemObject);
        }
    }

    if (['mixing', 'compacting'].includes(targetEngine)) {
        coreRecipe = compileBasinRecipe(rawEngine, compiledResultsArray, demandsFabricFormat);
    } else if (targetEngine === 'sequenced_assembly') {
        coreRecipe = compileAssemblyRecipe(compiledResultsArray, demandsFabricFormat);
    } else if (targetEngine === 'mechanical_crafting') {
        coreRecipe = compileMechanicalCraftingRecipe();
    } else {
        coreRecipe = compileStandardKineticRecipe(rawEngine, compiledResultsArray);
    }
    let outputJson = coreRecipe; 
    
    let isConditionalChecked = document.getElementById('useConditional')?.checked || false;
    let rawInputsList = [];

    if (isConditionalChecked) {
        const conditionsContainer = document.getElementById('conditionContainers') || document.getElementById('conditionsContainer');
        const condElements = conditionsContainer ? conditionsContainer.children : [];
        
        for (let condEl of condElements) {
            const condRouteEl = condEl.querySelector('.cond-route-select');
            const condTypeEl = condEl.querySelector('.cond-type');
            const condKeyEl = condEl.querySelector('.cond-key');
            const condValEl = condEl.querySelector('.cond-val');

            if (condTypeEl && condTypeEl.value) {
                rawInputsList.push({
                    type: condTypeEl.value,
                    key: condKeyEl ? condKeyEl.value : '',
                    val: condValEl ? condValEl.value : '',
                    route: condRouteEl ? condRouteEl.value : 'both'
                });
            }
        }
    }


    if (platformSelection === "forge_only") {
        let compiledConditionsArray = [];
        if (isConditionalChecked && rawInputsList.length > 0) {
            for (let input of rawInputsList) {
                if (input.route === 'forge' || input.route === 'both') {
                    compiledConditionsArray.push({ "type": input.type, "modid": input.key });
                }
            }
        }
        if (compiledConditionsArray.length === 0) {
            compiledConditionsArray.push({ "type": "forge:mod_loaded", "modid": "create" });
        }
        outputJson = {
            "type": "forge:conditional",
            "recipes": [{ "conditions": compiledConditionsArray, "recipe": coreRecipe }]
        };

    } else if (platformSelection === "fabric_only") {
        let compiledConditionsArray = [];
        if (isConditionalChecked && rawInputsList.length > 0) {
            for (let input of rawInputsList) {
                if (input.route === 'fabric' || input.route === 'both') {
                    compiledConditionsArray.push({ "condition": input.type, "values": [input.key] });
                }
            }
        }
        if (compiledConditionsArray.length === 0) {
            compiledConditionsArray.push({ "condition": "fabric:all_mods_loaded", "values": ["create"] });
        }
        outputJson = { 
            "fabric:load_conditions": compiledConditionsArray, 
            ...coreRecipe 
        };

    } else {

        if (isConditionalChecked && rawInputsList.length > 0) {
            let forgeConditions = [];
            let fabricConditions = [];

            for (let input of rawInputsList) {
                if (input.route === 'forge' || input.route === 'both') {
                    forgeConditions.push({ "type": input.type, "modid": input.key });
                }
                if (input.route === 'fabric' || input.route === 'both') {
                    fabricConditions.push({ "condition": input.type, "values": [input.key] });
                }
            }

            let finalDualRecipe = { ...coreRecipe };
            if (fabricConditions.length > 0) {
                finalDualRecipe = { "fabric:load_conditions": fabricConditions, ...coreRecipe };
            }

            if (forgeConditions.length > 0) {
                outputJson = { "type": "forge:conditional", "recipes": [{ "conditions": forgeConditions, "recipe": finalDualRecipe }] };
            } else {
                outputJson = finalDualRecipe;
            }
        } else {

            outputJson = coreRecipe; 
        }
    }

    const outputField = document.getElementById('recipeOutput') || document.querySelector('.recipeOutput');
    if (outputField) {
        outputField.value = JSON.stringify(outputJson, null, 4);
    }



window.toggleConditionalFields = function() {
    const useConditionalEl = document.getElementById('useConditional');
    const conditionalConfigEl = document.getElementById('conditionalConfig');
    
    if (useConditionalEl && conditionalConfigEl) {
        if (useConditionalEl.checked) {
            conditionalConfigEl.classList.remove('hidden');
            conditionalConfigEl.style.setProperty('display', 'flex', 'important');
        } else {
            conditionalConfigEl.classList.add('hidden');
            conditionalConfigEl.style.setProperty('display', 'none', 'important');
        }
    }
};


window.removeBlock = function(target) {
    if (typeof target === 'string') {
        const element = document.getElementById(target);
        if (element) element.remove();
    } else if (target && typeof target.closest === 'function') {
        const block = target.closest('.grid-cell-stacked-box');
        if (block) block.remove();
    }

    if (typeof compileRecipe === 'function') compileRecipe();
};


document.addEventListener('DOMContentLoaded', () => {
    const boxWrapper = document.getElementById('useConditional');
    if (boxWrapper) {
        boxWrapper.addEventListener('click', (e) => { e.stopPropagation(); });
    }

    if (typeof window.toggleConditionalFields === 'function') {
        window.toggleConditionalFields();
    }
});


    const previewEl = document.getElementById('jsonOutput');
    if (previewEl) {
        previewEl.textContent = JSON.stringify(outputJson, null, 2);
    }
    if (typeof updateJEIPreview === 'function') {
        const firstOutputItemName = compiledResultsArray.length > 0 ? (compiledResultsArray[0].item || compiledResultsArray[0].fluid || "minecraft:air") : "minecraft:air";
        
        let compiledIngredients = [];
        const inputContainers = document.getElementById('ingredientsContainer')?.children || [];
        for (let container of inputContainers) {
            const idInput = container.querySelector('.ing-id');
            const fluidCheck = container.querySelector('.ing-is-fluid');
            const countInput = container.querySelector('.ing-count');
            if (idInput && idInput.value) {
                compiledIngredients.push({
                    item: !fluidCheck?.checked ? idInput.value : null,
                    fluid: fluidCheck?.checked ? idInput.value : null,
                    amount: parseInt(countInput?.value) || 1
                });
            }
        }
        const standardInput = document.getElementById('inputItem');
        if (standardInput && standardInput.value.trim()) {
            compiledIngredients.push({ 
                item: standardInput.value.trim(), 
                amount: 1 
            });
        }

        updateJEIPreview(rawEngine, compiledIngredients, compiledResultsArray, firstOutputItemName);
    }
}
