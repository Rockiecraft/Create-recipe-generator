function compileBasinRecipe(rawEngine, resultsArray, isFabric) {
    let recipe = JSON.parse(JSON.stringify(RECIPE_TEMPLATES[rawEngine] || RECIPE_TEMPLATES["create:mixing"]));
    let ingredientsArray = [];
    
    const inputContainers = document.getElementById('ingredientsContainer')?.children || [];
    for (let container of inputContainers) {
        const idInput = container.querySelector('.ing-id');
        const fluidCheck = container.querySelector('.ing-is-fluid');
        const countInput = container.querySelector('.ing-count');
        
        if (!idInput || !idInput.value) continue;
        
        if (fluidCheck && fluidCheck.checked) {
            let amount = parseInt(countInput.value) || 1000;
            if (isFabric) amount *= 81;
            
            ingredientsArray.push({
                "fluid": idInput.value.trim(),
                "amount": amount
            });
        } else {
            const count = parseInt(countInput.value) || 1;
            const val = idInput.value.trim();
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
    
    recipe.ingredients = ingredientsArray;
    recipe.results = resultsArray;
    
    const heatEl = document.getElementById('heatRequirement');
    if (heatEl && heatEl.value !== "none") {
        recipe.heatRequirement = heatEl.value;
    } else {
        delete recipe.heatRequirement;
    }
    
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


