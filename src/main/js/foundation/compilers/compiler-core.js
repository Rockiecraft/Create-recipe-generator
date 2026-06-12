function compileRecipe() {
    if (window.isSwitchingLayouts || window.isWorkspaceSwappingLayout) return;

    let dataStore = null;

    if (typeof activeRecipeId !== 'undefined' && activeRecipeId && typeof recipesDatabase !== 'undefined' && recipesDatabase[activeRecipeId]) {
        const recipe = recipesDatabase[activeRecipeId];
        const activeTabEl = document.querySelector('.engine-tab.active, .tab-button.active, .recipe-tab.active');
        const rawEngine = activeTabEl ? activeTabEl.getAttribute('data-engine') || activeTabEl.dataset.engine || activeTabEl.id : 'create:mixing';

        const currentEngine = rawEngine.includes('create:') ? rawEngine : `create:${rawEngine}`;
        const targetEngine = currentEngine.replace('create:', '');

        if (!recipe.enginesData) recipe.enginesData = {};
        if (!recipe.enginesData[currentEngine]) {
            recipe.enginesData[currentEngine] = {
                inputItem: '',
                outputItem: '',
                processingTime: 200,
                ingredients: [],
                outputs: [],
                conditions: [],
                assemblySteps: [],
                assemblyLoops: 1,
                transitionalItem: '',
            };
        }

        dataStore = recipe.enginesData[currentEngine];

        const titleInput = document.getElementById('recipeTitle');
        if (titleInput) recipe.name = titleInput.value.trim();

        const platformRad = document.querySelector('input[name="platform"]:checked');
        if (platformRad) recipe.platform = platformRad.value || 'universal';

        dataStore.ingredients = [];
        const containerIng = document.getElementById('ingredientsContainer');
        if (containerIng) {
            for (let row of containerIng.children) {
                const idInput = row.querySelector('.ing-id');
                const fluidCheck = row.querySelector('input[type="checkbox"]');
                const countInput = row.querySelector('.ing-count');

                if (idInput && idInput.value.trim() !== '') {
                    dataStore.ingredients.push({
                        id: idInput.value.trim(),
                        isFluid: fluidCheck ? fluidCheck.checked : false,
                        amount: countInput ? countInput.value : '1',
                    });
                }
            }
        }

        dataStore.outputs = [];
        const containerOut = document.getElementById('outputsContainer');
        if (containerOut) {
            for (let row of containerOut.children) {
                const idInput = row.querySelector('.out-id') || row.querySelector('input[type="text"]');
                const countInput = row.querySelector('.out-count');
                const fluidCheck = row.querySelector('input[type="checkbox"]');
                const chanceInput = row.querySelector('.out-chance');

                if (idInput && idInput.value.trim() !== '') {
                    dataStore.outputs.push({
                        id: idInput.value.trim(),
                        count: countInput ? countInput.value : '1',
                        isFluid: fluidCheck ? fluidCheck.checked : false,
                        chance: chanceInput ? chanceInput.value : '1.0',
                    });
                }
            }
        }

        if (targetEngine === 'sequenced_assembly') {
            const loopsBox = document.getElementById('assemblyLoops');
            if (loopsBox) dataStore.assemblyLoops = parseInt(loopsBox.value, 10) || 1;

            const transitionalBox = document.getElementById('transitionalItem');
            if (transitionalBox) dataStore.transitionalItem = transitionalBox.value.trim();

            const singleInputBox = document.getElementById('inputItem') || document.getElementById('recipeInputItem');
            if (singleInputBox) dataStore.inputItem = singleInputBox.value.trim();

            dataStore.assemblySteps = [];
            const assemblyContainer = document.getElementById('assemblyStepsContainer');
            if (assemblyContainer) {
                for (let stepRow of assemblyContainer.children) {
                    const typeSelect = stepRow.querySelector('.step-type') || stepRow.querySelector('select');
                    if (typeSelect && typeSelect.value) {
                        dataStore.assemblySteps.push({
                            id: stepRow.id,
                            type: typeSelect.value,
                        });
                    }
                }
            }
        }
        if (targetEngine === 'mechanical_crafting') {
            if (!dataStore.gridMatrix) dataStore.gridMatrix = {};

            const widthBox = document.getElementById('craftingWidth');
            if (widthBox) dataStore.width = parseInt(widthBox.value, 10) || 3;

            const heightBox = document.getElementById('craftingHeight');
            if (heightBox) dataStore.height = parseInt(heightBox.value, 10) || 3;

            const mirroringSelect = document.getElementById('acceptMirrored');
            if (mirroringSelect) dataStore.mirroring = mirroringSelect.value || 'false';

            const width = dataStore.width || 3;
            const height = dataStore.height || 3;

            for (let r = 0; r < height; r++) {
                for (let c = 0; c < width; c++) {
                    const cell = document.querySelector(`.craft-cell[data-row="${r}"][data-col="${c}"]`);
                    const coordinateKey = `${r},${c}`;
                    if (cell) {
                        dataStore.gridMatrix[coordinateKey] = cell.value.trim().toUpperCase();
                    }
                }
            }

            dataStore.ingredients = [];
            const containerIng = document.getElementById('ingredientsContainer');
            if (containerIng) {
                for (let row of containerIng.children) {
                    const idInput = row.querySelector('.ing-id');
                    const countInput = row.querySelector('.ing-count');

                    if (idInput && idInput.value.trim() !== '') {
                        dataStore.ingredients.push({
                            id: idInput.value.trim(),
                            isFluid: false,
                            amount: countInput ? parseInt(countInput.value, 10) || 1 : 1,
                        });
                    }
                }
            }

            dataStore.outputs = [...recipe.outputs];
            const singleOutputBox = document.getElementById('singleOutputProductId') || document.getElementById('outputItem');
            if (singleOutputBox) dataStore.outputItem = singleOutputBox.value.trim();
        }

        recipe.engine = currentEngine;

        if (typeof saveActiveRecipeState === 'function') {
            saveActiveRecipeState();
        }
    }
    const activeRadio = document.querySelector('input[name="platform"]:checked');
    const platformSelection = activeRadio ? activeRadio.value : 'universal';
    let coreRecipe = {};



    const rawEngine = currentActiveEngine || 'mixing';
    const targetEngine = rawEngine.replace('create:', '');

    let demandsFabricFormat = platformSelection === 'fabric_only' || document.getElementById('autoConvertFabricFluids')?.checked;
    let compiledResultsArray = [];
    const outputContainers = document.getElementById('outputsContainer').children;
    const allowsChance = ['crushing', 'sequenced_assembly', 'milling', 'splashing', 'cutting'].includes(targetEngine);

    const ALLOWED_FLUID_ENGINES = ['mixing', 'compacting', 'filling'];
    const ENGINES_WITH_CHANCE = ['crushing', 'sequenced_assembly', 'splashing', 'cutting'];
    const SEQUENCED_ASSEMBLY_STEP_TYPES = ['pressing', 'deploying', 'filling'];

    const versionDropdown = document.getElementById('minecraftVersion');
    const selectedVersion = versionDropdown ? versionDropdown.value : '1.20.1';
    const itemKeyType = selectedVersion === '1.21.1' ? 'id' : 'item';
    const fluidKeyType = (selectedVersion === '1.21.1' && ['mixing', 'compacting'].includes(targetEngine)) ? 'id' : 'fluid';

    for (let container of outputContainers) {
        const idInput = container.querySelector('.out-id') || container.querySelector('input[type="text"]');
        const countInput = container.querySelector('.out-count') || container.querySelector('input[type="number"]:not(.out-chance):not(.chance-input)');
        const fluidCheck = container.querySelector('.out-is-fluid') || container.querySelector('input[type="checkbox"]');
        const chanceInput = container.querySelector('.out-chance') || container.querySelector('.chance-input');

        if (!idInput || !idInput.value || !idInput.value.trim()) continue;

        const cleanId = idInput.value.trim();

        if (fluidCheck && fluidCheck.checked) {
            let amountVal = countInput ? parseInt(countInput.value, 10) : 1000;
            if (isNaN(amountVal)) amountVal = 1000;
            if (demandsFabricFormat) amountVal *= 81;

            compiledResultsArray.push({
                [fluidKeyType]: cleanId,
                amount: amountVal,
            });
        } else {
            let countVal = countInput ? parseInt(countInput.value, 10) : 1;
            if (isNaN(countVal)) countVal = 1;

            let itemObject = {
                [itemKeyType]: cleanId,
                count: countVal,
            };

            if (allowsChance && chanceInput) {
                const rawChanceString = chanceInput.value ? chanceInput.value.trim() : '';
                let inputPercent = parseFloat(rawChanceString);

                if (rawChanceString !== '' && !isNaN(inputPercent)) {
                    inputPercent = Math.max(0, Math.min(100, inputPercent));
                    let chanceVal = inputPercent / 100;
                    chanceVal = parseFloat(chanceVal.toFixed(2));

                    if (chanceVal < 1.0) {
                        itemObject.chance = chanceVal;
                    }
                }
            }

            compiledResultsArray.push(itemObject);
        }
    }
    if (['pressing', 'filling', 'smoking', 'blasting', 'haunting', 'sequenced_assembly', 'deploying'].includes(targetEngine)) {
        compiledResultsArray = [];
        const singleOutInput = document.getElementById('singleOutputProductId') || document.getElementById('outputItem');
        if (singleOutInput && singleOutInput.value.trim()) {
            compiledResultsArray.push({
                [itemKeyType]: singleOutInput.value.trim(),
            });
        }
    }
    if (targetEngine === 'filling') {
        coreRecipe = compileSpoutRecipe(compiledResultsArray, demandsFabricFormat);
    } else if (['mixing', 'compacting'].includes(targetEngine)) {
        coreRecipe = compileBasinRecipe(rawEngine, compiledResultsArray, demandsFabricFormat);
    } else if (targetEngine === 'sequenced_assembly') {
        coreRecipe = compileAssemblyRecipe(compiledResultsArray, demandsFabricFormat);
    } else if (targetEngine === 'mechanical_crafting') {
        coreRecipe = compileMechanicalCraftingRecipe();
    } else if (['milling', 'crushing', 'cutting'].includes(targetEngine)) {
        coreRecipe = compileTimedKineticRecipe(rawEngine, compiledResultsArray);
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
                const condKeyEl = condEl.querySelector('.cond-key') || condEl.querySelector('input[placeholder*="Key"]') || condEl.querySelectorAll('input')[1];

                rawInputsList.push({
                    route: condRouteEl ? condRouteEl.value : 'both',
                    type: condTypeEl.value.trim(),

                    key: condKeyEl ? condKeyEl.value.trim() : '',
                    value: condValEl ? condValEl.value.trim() : '',
                });
            }
        }
    }

    if (platformSelection === 'forge_only') {
        let compiledConditionsArray = [];
        if (isConditionalChecked && rawInputsList.length > 0) {
            for (let input of rawInputsList) {
                if (input.route === 'forge' || input.route === 'both') {
                    let finalValue = input.value || '';

                    let dynamicKey = input.key && input.key !== '' ? input.key : 'config';

                    compiledConditionsArray.push({
                        type: input.type,
                        [dynamicKey]: finalValue,
                    });
                }
            }
        }

        let recipeInnerBlock = {
            'fabric:load_conditions': [
                {
                    condition: 'fabric:all_mods_loaded',
                    values: ['forge'],
                },
            ],
            ...coreRecipe,
        };

        if (compiledConditionsArray.length > 0) {
            recipeInnerBlock = {
                conditions: compiledConditionsArray,
                ...recipeInnerBlock,
            };
        }

        outputJson = {
            type: 'forge:conditional',
            recipes: [recipeInnerBlock],
        };
    } else if (platformSelection === 'fabric_only') {
        let compiledConditionsArray = [];
        if (isConditionalChecked && rawInputsList.length > 0) {
            for (let input of rawInputsList) {
                if (input.route === 'fabric' || input.route === 'both') {
                    let finalValue = input.value || '';

                    let dynamicKey = input.key && input.key !== '' ? input.key : 'config';

                    compiledConditionsArray.push({
                        type: input.type,
                        [dynamicKey]: finalValue,
                    });
                }
            }
        }

        let recipeInnerBlock = {
            conditions: [
                {
                    type: 'forge:mod_loaded',
                    modid: 'fabricloader',
                },
            ],
            ...coreRecipe,
        };

        if (compiledConditionsArray.length > 0) {
            recipeInnerBlock = {
                conditions: [
                    {
                        type: 'forge:mod_loaded',
                        modid: 'fabricloader',
                    },
                ],
                'fabric:load_conditions': compiledConditionsArray,
                ...coreRecipe,
            };
        }

        outputJson = {
            type: 'forge:conditional',
            recipes: [recipeInnerBlock],
        };
    } else {
        if (isConditionalChecked && rawInputsList.length > 0) {
            let forgeConditions = [];
            let fabricConditions = [];

            for (let input of rawInputsList) {
                let finalValue = input.value || '';

                let dynamicKey = input.key && input.key !== '' ? input.key : 'config';

                if (input.route === 'forge' || input.route === 'both') {
                    forgeConditions.push({
                        type: input.type,
                        [dynamicKey]: finalValue,
                    });
                }

                if (input.route === 'fabric' || input.route === 'both') {
                    fabricConditions.push({
                        type: input.type,
                        [dynamicKey]: finalValue,
                    });
                }
            }

            if (forgeConditions.length > 0) {
                let recipesBlock = {
                    conditions: forgeConditions,
                    recipe: coreRecipe,
                };

                if (fabricConditions.length > 0) {
                    recipesBlock = {
                        conditions: forgeConditions,
                        'fabric:load_conditions': fabricConditions,
                        recipe: coreRecipe,
                    };
                }

                outputJson = {
                    type: 'forge:conditional',
                    recipes: [recipesBlock],
                };
            } else if (fabricConditions.length > 0) {
                outputJson = {
                    'fabric:load_conditions': fabricConditions,
                    ...coreRecipe,
                };
            } else {
                outputJson = coreRecipe;
            }
        } else {
            outputJson = coreRecipe;
        }
    }

    const outputField = document.getElementById('recipeOutput') || document.querySelector('.recipeOutput');
    if (outputField) {
        outputField.value = JSON.stringify(outputJson, null, 4);
    }

    window.toggleConditionalFields = function () {
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

    window.removeBlock = function (target) {
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
            boxWrapper.addEventListener('click', (e) => {
                e.stopPropagation();
            });
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
        const firstOutputItemName = compiledResultsArray.length > 0 ? compiledResultsArray[0].item || compiledResultsArray[0].fluid || 'minecraft:air' : 'minecraft:air';

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
                    amount: parseInt(countInput?.value) || 1,
                });
            }
        }
        const standardInput = document.getElementById('inputItem');
        if (standardInput && standardInput.value.trim()) {
            compiledIngredients.push({
                item: standardInput.value.trim(),
                amount: 1,
            });
        }

        updateJEIPreview(rawEngine, compiledIngredients, compiledResultsArray, firstOutputItemName);
    }
}
