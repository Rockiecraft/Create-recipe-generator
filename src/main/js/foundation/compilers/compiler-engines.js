function compileBasinRecipe(rawEngine, resultsArray, isFabric) {
    let ingredientsArray = [];
    const inputContainers = document.getElementById('ingredientsContainer')?.children || [];

    for (let container of inputContainers) {
        // Multi-selector fallbacks to guarantee the elements are always found
        const idInput = container.querySelector('.ing-id') || container.querySelector('input[type="text"]');
        const fluidCheck = container.querySelector('.ing-is-fluid') || container.querySelector('input[type="checkbox"]');
        const countInput = container.querySelector('.ing-count') || container.querySelector('input[type="number"]');

        if (!idInput || !idInput.value || !idInput.value.trim()) continue;

        const val = idInput.value.trim();

        // Safe evaluation path for the active checkbox state
        if (fluidCheck && fluidCheck.checked) {
            let amount = countInput ? (parseInt(countInput.value, 10) || 1000) : 1000;
            if (isFabric) amount *= 81;

            ingredientsArray.push({
                "fluid": val,
                "amount": amount
            });
        } else {
            // Standard block item format completely stripped of "count" properties
            if (val.startsWith('#')) {
                ingredientsArray.push({
                    "tag": val.replace('#', '')
                });
            } else {
                ingredientsArray.push({
                    "item": val
                });
            }
        }
    }

  
    const heatEl = document.getElementById('basinHeatRequirement') || document.getElementById('heatRequirement');
    const targetHeatValue = (heatEl && heatEl.value !== "none") ? heatEl.value.toLowerCase() : null;

  
    let recipe = {};
    
    recipe.type = rawEngine;
    
    if (targetHeatValue) {
        recipe.heatRequirement = targetHeatValue;
    }
    
    recipe.ingredients = ingredientsArray;
    recipe.results = resultsArray;

    return recipe;
}



function compileStandardKineticRecipe(rawEngine, resultsArray) {
    let recipe = JSON.parse(JSON.stringify(RECIPE_TEMPLATES[rawEngine] || { "type": rawEngine, "ingredients": [], "results": [] }));
    let ingredientsArray = [];
    
    const singleInput = document.getElementById('inputItem');
    
    if (singleInput && singleInput.value.trim()) {
        const val = singleInput.value.trim();
        if (val.startsWith('#')) {
            ingredientsArray.push({ "tag": val.replace('#', '') });
        } else {
            ingredientsArray.push({ "item": val });
        }
    }
    
    recipe.ingredients = ingredientsArray;
    recipe.results = resultsArray;
    
    return recipe;
}

function compileSpoutRecipe(resultsArray, demandsFabricFormat) {
    let recipe = {
        "type": "create:filling",
        "ingredients": [],
        "results": resultsArray
    };

    const baseItemInput = document.getElementById('inputItemFilling');
    const fluidNameInput = document.getElementById('fluidInputName');
    const fluidAmountInput = document.getElementById('fluidInputAmount');
    const fluidNbtInput = document.getElementById('fluidInputNbt');

  
    if (baseItemInput && baseItemInput.value.trim()) {
        const val = baseItemInput.value.trim();
        recipe.ingredients.push(val.startsWith('#') ? { "tag": val.replace('#', '') } : { "item": val });
    } else {
        recipe.ingredients.push({ "item": "minecraft:glass_bottle" });
    }

   
    let fluidAmount = fluidAmountInput && fluidAmountInput.value.trim() ? parseInt(fluidAmountInput.value.trim(), 10) : 1000;
    if (isNaN(fluidAmount)) fluidAmount = 1000;
    
    if (demandsFabricFormat) {
        fluidAmount *= 81; 
    }

    const fluidName = fluidNameInput && fluidNameInput.value.trim() ? fluidNameInput.value.trim() : "minecraft:water";

    let fluidObject = {
        "amount": fluidAmount,
        "fluid": fluidName
    };

   
    if (fluidNbtInput && fluidNbtInput.value.trim()) {
        try {
            fluidObject.nbt = JSON.parse(fluidNbtInput.value.trim());
        } catch(e) {
            fluidObject.nbt = {};
        }
    } else {
        fluidObject.nbt = {};
    }

    recipe.ingredients.push(fluidObject);
    return recipe;
}

function compileTimedKineticRecipe(rawEngine, resultsArray) {
   
    let ingredientsArray = [];
    const singleInput = document.getElementById('inputItem');
    
    if (singleInput && singleInput.value.trim()) {
        const val = singleInput.value.trim();
        if (val.startsWith('#')) {
            ingredientsArray.push({ "tag": val.replace('#', '') });
        } else {
            ingredientsArray.push({ "item": val });
        }
    } else {
        ingredientsArray.push({ "item": "minecraft:air" });
    }

  
    const timeInput = document.getElementById('processingTimeInput');
   
    const defaultTicks = 200;
    let processingTicks = defaultTicks;

    if (timeInput && timeInput.value.trim()) {
        const parsedTime = parseInt(timeInput.value.trim(), 10);
        if (!isNaN(parsedTime) && parsedTime > 0) {
            processingTicks = parsedTime;
        }
    }

   
    let recipe = {};
    
    recipe.type = rawEngine;
    recipe.ingredients = ingredientsArray;
    recipe.processingTime = processingTicks; 
    recipe.results = resultsArray;

    return recipe;
}




function compileAssemblyRecipe(resultsArray, isFabric) {
    let recipe = JSON.parse(JSON.stringify(RECIPE_TEMPLATES["create:sequenced_assembly"]));
    
    const singleInput = document.getElementById('inputItem');
    if (singleInput && singleInput.value.trim()) {
        const val = singleInput.value.trim();
        if (val.startsWith('#')) {
            recipe.ingredient = { "tag": val.replace('#', '') };
        } else {
            recipe.ingredient = { "item": val };
        }
    }
    
    const transitionalInput = document.getElementById('transitionalItem');
    const transitionalValue = transitionalInput && transitionalInput.value.trim() ? transitionalInput.value.trim() : "minecraft:air";
    if (transitionalInput && transitionalInput.value.trim()) {
        recipe.transitionalItem = { "item": transitionalValue };
    }
    
    let sequenceArray = [];
    const stepContainers = document.getElementById('assemblyStepsContainer')?.children || [];
    
    for (let container of stepContainers) {
        const stepType = container.querySelector('.step-type')?.value || 'pressing';
        let stepObject = {
            "type": `create:${stepType}`,
            "ingredients": [],
            "results": []
        };
        
       
        stepObject.ingredients.push({ "item": transitionalValue });

        
        if (stepType === 'deploying') {
            const idInput = container.querySelector('.ing-id');
            if (idInput && idInput.value.trim()) {
                const val = idInput.value.trim();
                if (val.startsWith('#')) {
                    stepObject.ingredients.push({ "tag": val.replace('#', '') });
                } else {
                    stepObject.ingredients.push({ "item": val });
                }
            }
        } else if (stepType === 'filling') {
            const fluidIdInput = container.querySelector('.step-fluid-id');
            const fluidAmountInput = container.querySelector('.step-fluid-amount');
            const fabricCheck = container.querySelector('.step-fluid-fabric-multiplier');
            
            if (fluidIdInput && fluidIdInput.value.trim()) {
                let amount = parseInt(fluidAmountInput?.value) || 250;
                
               
                if (fabricCheck && fabricCheck.checked) {
                    amount *= 81;
                }
                
                stepObject.ingredients.push({
                    "fluid": fluidIdInput.value.trim(),
                    "amount": amount
                });
            }
        }
        
       
        stepObject.results.push({ "item": transitionalValue });
        sequenceArray.push(stepObject);
    }
    
    recipe.sequence = sequenceArray;
    recipe.results = resultsArray;
    
    const loopsInput = document.getElementById('assemblyLoops');
    recipe.loops = loopsInput ? (parseInt(loopsInput.value) || 1) : 1;
    return recipe;
}

function compileMechanicalCraftingRecipe() {
    let recipe = JSON.parse(JSON.stringify(RECIPE_TEMPLATES["create:mechanical_crafting"]));

    const width = parseInt(document.getElementById('craftingWidth').value, 10) || 3;
    const height = parseInt(document.getElementById('craftingHeight').value, 10) || 3;

    recipe.acceptMirrored = document.getElementById('acceptMirrored').value === "true";

    let patternArray = [];
    let discoveredKeys = new Set();

    for (let r = 0; r < height; r++) {
        let rowString = "";
        for (let c = 0; c < width; c++) {
            const cell = document.querySelector(`.craft-cell[data-row="${r}"][data-col="${c}"]`);
            
            
            if (cell && cell.value === " ") {
                cell.value = "";
            }

            const char = cell && cell.value ? cell.value.toUpperCase().trim() : "";
            if (char && char !== "") {
                rowString += char;
                discoveredKeys.add(char);
            } else {
                rowString += " ";
            }
        }
        patternArray.push(rowString);
    }
    recipe.pattern = patternArray;

    let keyMap = {};
    discoveredKeys.forEach(key => {
        const typeSelect = document.querySelector(`.craft-key-type[data-key="${key}"]`);
        const valueSelect = document.querySelector(`.craft-key-resource[data-key="${key}"]`);

        const type = typeSelect ? typeSelect.value : "item";
        const val = valueSelect ? valueSelect.value : "minecraft:stone";

        keyMap[key] = {};
        keyMap[key][type] = val;
    });
    recipe.key = keyMap;

    const firstOutputRow = document.querySelector('#outputsContainer > div');
    if (firstOutputRow) {
        const outIdInput = firstOutputRow.querySelector('.out-id');
        const outCountInput = firstOutputRow.querySelector('.out-count');

        recipe.result = {
            "item": outIdInput ? (outIdInput.value || "minecraft:air") : "minecraft:air",
            "count": outCountInput ? (parseInt(outCountInput.value, 10) || 1) : 1
        };
    } else {
        recipe.result = { "item": "minecraft:air", "count": 1 };
    }

    return recipe;
}


