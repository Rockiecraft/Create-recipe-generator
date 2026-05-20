
function compileRecipe() {
    const platformSelection = document.querySelector('input[name="platform"]:checked').value;
    let coreRecipe = {};

   
    const isBasinStyle = (currentActiveEngine === 'create:mixing' || currentActiveEngine === 'create:compacting');
    document.getElementById('jeiIn').classList.toggle('hidden', !isBasinStyle);
    document.getElementById('jeiGrid').classList.toggle('hidden', !isBasinStyle);

  
    let demandsFabricFormat = (platformSelection === "fabric_only");
    const manualFabricFluidsChecked = document.getElementById('autoConvertFabricFluids')?.checked || false;
    if (manualFabricFluidsChecked) {
        demandsFabricFormat = true;
    }

  
    let compiledResultsArray = [];
    const outputContainers = document.getElementById('outputsContainer').children;
    const allowsChance = (currentActiveEngine === 'create:crushing' || currentActiveEngine === 'create:sequenced_assembly');

    for (let outputEl of outputContainers) {
        let itemInput = outputEl.querySelector('.out-id');
        let countInput = outputEl.querySelector('.out-count');
        let chanceInput = outputEl.querySelector('.out-chance');
        let isFluidCheckbox = outputEl.querySelector('.out-is-fluid');

        if (itemInput && itemInput.value) {
            let resultNode = {};

            
            if (isFluidCheckbox && isFluidCheckbox.checked) {
                let amountInMb = parseInt(countInput.value) || 1000;

                
                if (demandsFabricFormat) {
                    resultNode = {
                        "fluid": itemInput.value,
                        "amount": amountInMb * 81
                    };
                } else {
                    resultNode = {
                        "fluid": itemInput.value,
                        "amount": amountInMb 
                    };
                }
            } else {
                resultNode = {
                    "item": itemInput.value,
                    "count": parseInt(countInput.value) || 1
                };
            }

            if (allowsChance && chanceInput && chanceInput.value !== "") {
                let chanceValue = parseFloat(chanceInput.value);
                if (!isNaN(chanceValue) && chanceValue < 1.0) {
                    resultNode.chance = chanceValue;
                }
            }
            compiledResultsArray.push(resultNode);
        }
    }


    if (compiledResultsArray.length === 0) {
        compiledResultsArray.push({ "item": "create:brass_ingot", "count": 1 });
    }

    
    let firstOutputNode = compiledResultsArray[0] || { "item": "create:brass_ingot" };
    let firstOutputItemName = firstOutputNode.fluid ? firstOutputNode.fluid : (firstOutputNode.item ? firstOutputNode.item : "create:brass_ingot");

   
    if (isBasinStyle) {
        const ingElements = document.getElementById('ingredientsContainer').children;
        const compiledIngredients = [];
        const gridSlots = document.getElementById('jeiGrid').children;
        for(let slot of gridSlots) slot.textContent = "";
        
        for (let i = 0; i < ingElements.length; i++) {
            const val = ingElements[i].querySelector('.ing-id').value;
            const isIngFluid = ingElements[i].querySelector('.ing-is-fluid');
            const ingCountField = ingElements[i].querySelector('.ing-count');
            const ingCount = ingCountField ? parseInt(ingCountField.value) : 1000;

            if(val) {
                if (isIngFluid && isIngFluid.checked) {
                    if (demandsFabricFormat) {
                        compiledIngredients.push({ 
                            "fluid": val, 
                            "amount": ingCount * 81 
                        });
                    } else {
                        compiledIngredients.push({ 
                            "fluid": val, 
                            "amount": ingCount 
                        });
                    }
                } else {
                    compiledIngredients.push({ "item": val });
                }

                if(gridSlots[i]) {
                    let cleanTextName = val.includes(':') ? val.split(':').pop() : val;
                    gridSlots[i].innerHTML = cleanTextName.replace('_', '<br>');
                }
            }
        }
        coreRecipe = { 
            "type": currentActiveEngine, 
            "ingredients": compiledIngredients, 
            "results": compiledResultsArray 
        };
        const enablesHeatFormatting = (currentActiveEngine === 'create:mixing' || currentActiveEngine === 'create:compacting');
        let selectedHeatValue = "none";
        if (enablesHeatFormatting) {
            selectedHeatValue = document.getElementById('heatRequirement')?.value || "none";
        }

       
        coreRecipe = {
            "type": currentActiveEngine
        };

       
        if (enablesHeatFormatting && selectedHeatValue !== "none") {
            coreRecipe["heatRequirement"] = selectedHeatValue;
        }

       
        coreRecipe["ingredients"] = compiledIngredients;
        coreRecipe["results"] = compiledResultsArray;
        let graphicContainer = document.getElementById('jeiMachineSymbol');
        if (graphicContainer) {
            if (currentActiveEngine === 'create:mixing') {
                graphicContainer.innerHTML = `<div class="machine-base-casing"><div class="machine-mixer-head"></div></div>`;
            } else {
                graphicContainer.innerHTML = `<div class="machine-base-casing"><div class="machine-piston-shaft" style="animation-duration: 2s;"><div class="machine-press-head" style="background:#5c5e63;"></div></div></div>`;
            }
        }
        
        let outputClean = firstOutputItemName.includes(':') ? firstOutputItemName.split(':').pop() : firstOutputItemName;
        document.getElementById('jeiOut').innerHTML = outputClean.replace('_', '<br>') + (compiledResultsArray.length > 1 ? '<br><i>+more</i>' : '');
        document.getElementById('jeiLabel').textContent = `${currentActiveEngine.replace('create:', '').toUpperCase()} VIEW (${compiledIngredients.length}/9)`;

    } else if (currentActiveEngine === 'create:sequenced_assembly') {
        const inputItem = document.getElementById('inputItem').value;
        const transitional = document.getElementById('transitionalItem').value;
        const loops = parseInt(document.getElementById('loopsCount').value) || 1;

        // --- COMPILE DYNAMIC MANUFACTURING PIPELINE STEPS SEQUENCES ARRAY ---
        let compiledStepsSequence = [];
        const dynamicStepNodes = document.getElementById('assemblyStepsContainer').children;

        for (let stepEl of dynamicStepNodes) {
            let stepType = stepEl.querySelector('.step-engine-type').value;
            let extraInputVal = stepEl.querySelector('.step-extra-input').value;
            let stepCountVal = stepEl.querySelector('.step-count-input') ? parseInt(stepEl.querySelector('.step-count-input').value) : 1000;

            let sequenceStepNode = {
                "type": stepType,
                "ingredients": [
                    { "item": transitional }
                ],
                "results": [
                    { "item": transitional }
                ]
            };

            if (stepType === 'create:filling' && extraInputVal) {
                if (demandsFabricFormat) {
                    sequenceStepNode.ingredients.push({
                        "fluid": extraInputVal,
                        "amount": stepCountVal * 81
                    });
                } else {
                    sequenceStepNode.ingredients.push({
                        "fluid": extraInputVal,
                        "amount": stepCountVal
                    });
                }
            } else if (stepType === 'create:deploying' && extraInputVal) {
                sequenceStepNode.ingredients.push({
                    "item": extraInputVal
                });
            }

            compiledStepsSequence.push(sequenceStepNode);
        }

        if (compiledStepsSequence.length === 0) {
            compiledStepsSequence.push({
                "type": "create:pressing",
                "ingredients": [{ "item": transitional }],
                "results": [{ "item": transitional }]
            });
        }

        coreRecipe = {
            "type": "create:sequenced_assembly",
            "ingredient": { "item": inputItem },
            "transitionalItem": { "item": transitional },
            "sequence": compiledStepsSequence,
            "results": compiledResultsArray,
            "loops": loops
        };

        let graphicContainer = document.getElementById('jeiMachineSymbol');
        if (graphicContainer) {
            graphicContainer.innerHTML = `<div class="machine-crusher-wrapper"><div class="machine-crushing-drum drum-left" style="width:22px; height:22px; animation-duration:0.5s;"></div><div class="machine-crushing-drum drum-right" style="width:22px; height:22px; animation-duration:0.5s;"></div></div>`;
        }
        let inputClean = inputItem.includes(':') ? inputItem.split(':').pop() : inputItem;
        let outputClean = firstOutputItemName.includes(':') ? firstOutputItemName.split(':').pop() : firstOutputItemName;
        
        document.getElementById('jeiIn').innerHTML = inputClean.replace('_', '<br>');
        document.getElementById('jeiOut').innerHTML = outputClean.replace('_', '<br>') + (compiledResultsArray.length > 1 ? '<br><i>+more</i>' : '');
        document.getElementById('jeiLabel').textContent = `SEQUENCED ASSEMBLY (${compiledStepsSequence.length} STEPS)`;

    } else {
        const inputItem = document.getElementById('inputItem').value;
        coreRecipe = { 
            "type": currentActiveEngine, 
            "ingredients": [{ "item": inputItem }], 
            "results": compiledResultsArray 
        };
        
        let graphicContainer = document.getElementById('jeiMachineSymbol');
        if (graphicContainer) {
            if (currentActiveEngine === 'create:pressing') {
                graphicContainer.innerHTML = `<div class="machine-base-casing"><div class="machine-piston-shaft"><div class="machine-press-head"></div></div></div>`;
            } else if (currentActiveEngine === 'create:crushing') {
                graphicContainer.innerHTML = `<div class="machine-crusher-wrapper"><div class="machine-crushing-drum drum-left"></div><div class="machine-crushing-drum drum-right"></div></div>`;
            } else if (currentActiveEngine === 'create:cutting') {
                graphicContainer.innerHTML = `<div class="machine-saw-blade"></div>`;
            } else if (currentActiveEngine === 'create:filling') {
                graphicContainer.innerHTML = `<div class="machine-base-casing" style="background:#b06c37;"><div class="machine-spout-nozzle"></div></div>`;
            } else {
                graphicContainer.innerHTML = `<div class="machine-base-casing" style="border-radius:50%; width:32px; height:32px; background:transparent; border-style:dashed;"></div>`;
            }
        }
        
        let inputClean = inputItem.includes(':') ? inputItem.split(':').pop() : inputItem;
        let outputClean = firstOutputItemName.includes(':') ? firstOutputItemName.split(':').pop() : firstOutputItemName;
        
        document.getElementById('jeiIn').innerHTML = inputClean.replace('_', '<br>');
        document.getElementById('jeiOut').innerHTML = outputClean.replace('_', '<br>') + (compiledResultsArray.length > 1 ? '<br><i>+more</i>' : '');
        document.getElementById('jeiLabel').textContent = `${currentActiveEngine.replace('create:', '').toUpperCase()} LAYER`;
    }

    // --- HYBRID DUAL-LOADER DATAPACK BUNDLER MATRIX ---
    let outputJson = coreRecipe;
    let isConditionalChecked = document.getElementById('useConditional').checked;

    let rawInputsList = [];
    if (isConditionalChecked) {
        const condElements = document.getElementById('conditionsContainer').children;
        for (let condEl of condElements) {
            const condType = condEl.querySelector('.cond-type').value;
            const keyName = condEl.querySelector('.cond-key').value;
            const valName = condEl.querySelector('.cond-val').value;
            const routeTarget = condEl.querySelector('.cond-route-select') ? condEl.querySelector('.cond-route-select').value : "both";
            if (condType) {
                rawInputsList.push({ type: condType, key: keyName, val: valName, route: routeTarget });
            }
        }
    }

    if (platformSelection === "forge_only") {
        let forgeConditionsArray = [];
        if (rawInputsList.length > 0) {
            rawInputsList.forEach(input => {
                let condObj = { "type": input.type };
                if (input.key && input.val) condObj[input.key] = input.val;
                forgeConditionsArray.push(condObj);
            });
        } else {
            forgeConditionsArray.push({ "type": "your_mod:custom_condition_type", "config": "your_config_key_here" });
        }

        let fabricLoadConditionsArray = [{ "condition": "fabric:all_mods_loaded", "values": ["forge"] }];

        outputJson = {
            "type": "forge:conditional",
            "recipes": [{
                "conditions": forgeConditionsArray,
                "fabric:load_conditions": fabricLoadConditionsArray,
                "recipe": coreRecipe
            }]
        };

    } else if (platformSelection === "fabric_only") {
        let forgeConditionsArray = [{ "type": "forge:mod_loaded", "modid": "fabric" }];
        let fabricLoadConditionsArray = [];
        
        if (rawInputsList.length > 0) {
            rawInputsList.forEach(input => {
                let condObj = { "condition": input.type };
                if (input.key && input.val) condObj[input.key] = input.val;
                fabricLoadConditionsArray.push(condObj);
            });
        } else {
            fabricLoadConditionsArray.push({ "condition": "your_mod:custom_condition_type", "config": "your_config_key_here" });
        }

        outputJson = {
            "type": "forge:conditional",
            "recipes": [{
                "conditions": forgeConditionsArray,
                "fabric:load_conditions": fabricLoadConditionsArray,
                "recipe": coreRecipe
            }]
        };

    } else {
        
        if (isConditionalChecked && rawInputsList.length > 0) {
            let forgeArray = [];
            let fabricArray = [];

            rawInputsList.forEach(i => {
                if (i.route === "both" || i.route === "forge") {
                    let fObj = { "type": i.type };
                    if (i.key && i.val) fObj[i.key] = i.val;
                    forgeArray.push(fObj);
                }
                if (i.route === "both" || i.route === "fabric") {
                    let fabObj = { "condition": i.type };
                    if (i.key && i.val) fabObj[i.key] = i.val;
                    fabricArray.push(fabObj);
                }
            });

                if (forgeArray.length === 0 && fabricArray.length > 0) {
                    
                    outputJson = {
                        "fabric:load_conditions": fabricArray,
                        "recipe": coreRecipe
                    };
                } else if (fabricArray.length === 0 && forgeArray.length > 0) {
                    outputJson = { "type": "forge:conditional", "recipes": [{ "conditions": forgeArray, "recipe": coreRecipe }] };
                } else {
                    outputJson = {
                        "type": "forge:conditional",
                        "recipes": [{
                            "conditions": forgeArray,
                            "fabric:load_conditions": fabricArray,
                            "recipe": coreRecipe
                        }]
                    };
                }
        }
    }

    document.getElementById('jsonOutput').textContent = JSON.stringify(outputJson, null, 2);
}