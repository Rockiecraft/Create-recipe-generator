
let conditionCount = 0;
let ingredientCount = 0;
let outputCount = 0;
let assemblyStepCount = 0;
let currentActiveEngine = "create:mixing";

let recipesDatabase = {}; 
let activeRecipeId = null;
let uniqueRecipeCounter = 1;
let activeOpenDropdownId = null;
let isSidebarCollapsed = false;

function createNewRecipeLayout() {
    saveActiveRecipeState();

    let customKey = `unnamed_recipe_${uniqueRecipeCounter}.json`;
    while (recipesDatabase[customKey]) {
        uniqueRecipeCounter++;
        customKey = `unnamed_recipe_${uniqueRecipeCounter}.json`;
    }

    recipesDatabase[customKey] = {
        engine: "create:mixing",
        inputItem: "minecraft:iron_ingot",
        platform: "universal",
        useConditional: false,
        heatRequirement: "none",
        ingredients: [{ item: "minecraft:copper_ingot", isFluid: false, count: 1 }],
        outputs: [{ item: "create:brass_ingot", count: 1, chance: 1.0, isFluid: false }],
        conditions: [],
        transitional: "create:incomplete_iron_sheet",
        loops: 4,
        sequenceSteps: []
    };

    activeRecipeId = customKey;
    uniqueRecipeCounter++;
    
    loadRecipeFromState(customKey);
    renderSidebarList();
    compileRecipe(); 
}

function updateRecipeFilenameInline(oldFilename, inputElement) {
    let rawString = inputElement.value.trim();
    let secureCleanName = rawString.toLowerCase().replace(/[^a-z0-9_.]/g, "");
    
    if (!secureCleanName.endsWith(".json")) {
        secureCleanName += ".json";
    }

    if (secureCleanName === ".json" || secureCleanName === oldFilename) {
        inputElement.value = oldFilename.replace(".json", "");
        return;
    }
    
    if (recipesDatabase[secureCleanName]) {
        alert("A file profile matching this identifier name is already registered across your dataset index catalogs!");
        inputElement.value = oldFilename.replace(".json", "");
        return;
    }

    recipesDatabase[secureCleanName] = recipesDatabase[oldFilename];
    delete recipesDatabase[oldFilename];

    if (activeRecipeId === oldFilename) {
        activeRecipeId = secureCleanName;
    }

    renderSidebarList();
    compileRecipe();
}

function toggleSidebarCollapseState() {
    const sidebar = document.getElementById('mainSidebarLayout');
    const toggleBtn = document.getElementById('sidebarCollapseBtn');
    if (!sidebar || !toggleBtn) return;

    isSidebarCollapsed = !isSidebarCollapsed;
    
    if (isSidebarCollapsed) {
        sidebar.classList.add('collapsed-slim');
        toggleBtn.textContent = "❯";
    } else {
        sidebar.classList.remove('collapsed-slim');
        toggleBtn.textContent = "❮";
    }
    
    renderSidebarList();
}

function getRecipeVisualIcon(recipeData) {
    const iconMap = {
        "create:pressing": "🔨", "create:mixing": "🌀", "create:compacting": "🗜️",
        "create:crushing": "⚙️", "create:cutting": "🪚", "create:haunting": "👻",
        "create:splashing": "💧", "create:filling": "🧪", "create:sequenced_assembly": "⚙"
    };
    return iconMap[recipeData.engine] || "📄";
}

function renderSidebarList() {
    const container = document.getElementById('recipeSidebarContainer');
    if (!container) return; 
    container.innerHTML = "";

    Object.keys(recipesDatabase).forEach(filename => {
        let blockItem = document.createElement('div');
        blockItem.className = 'recipe-list-item';
        
        if (filename === activeRecipeId) {
            blockItem.style.borderLeftColor = 'var(--accent)';
            blockItem.style.backgroundColor = 'var(--bg-input)';
        } else {
            blockItem.style.borderLeftColor = '#444';
            blockItem.style.backgroundColor = 'transparent';
        }
        
        if (isSidebarCollapsed) {
            let visualIcon = getRecipeVisualIcon(recipesDatabase[filename]);
            blockItem.setAttribute('title', filename.replace(".json", "")); 
            blockItem.style.padding = "12px 0";
            blockItem.style.display = "flex";
            blockItem.style.justifyContent = "center";
            
            blockItem.innerHTML = `
                <div onclick="selectActiveRecipeTarget('${filename}')" style="font-size: 18px; cursor: pointer; user-select: none;">
                    ${visualIcon}
                </div>
            `;
        } else {
            let renderLabel = filename.replace(".json", "");
            let isDropdownOpen = (activeOpenDropdownId === filename);

            blockItem.innerHTML = `
                <div style="flex: 1; display: flex; flex-direction: column; width: 100%; gap: 4px;">
                    
                    <!-- LINE 1: ROW CONTAINER — Forces Name Left and Buttons Right Side-by-Side -->
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 10px;">
                        
                        <!-- Left-Side Title Field Wrapper -->
                        <div onclick="selectActiveRecipeTarget('${filename}')" style="flex: 1; min-width: 0; cursor: pointer;">
                            <input type="text" class="sidebar-name-input" value="${renderLabel}"
                                onclick="event.stopPropagation();"
                                onmousedown="event.stopPropagation();"
                                onmouseup="event.stopPropagation();"
                                onchange="updateRecipeFilenameInline('${filename}', this);"
                                onkeydown="if(event.key === 'Enter') { this.blur(); }"
                                style="background: transparent; border: none; color: #fff; font-weight: 600; font-family: inherit; padding: 2px 0; font-size: 13px; width: 100%; border-bottom: 1px solid transparent; cursor: text;"
                                onfocus="event.stopPropagation(); this.style.borderBottomColor='var(--accent)';"
                                onblur="event.stopPropagation(); this.style.borderBottomColor='transparent';">
                        </div>

                        <!-- Right-Side Action Buttons Wrapper (Anchors Dot and Trash Together) -->
                        <div class="recipe-item-actions-wrapper" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0; position: relative;">
                            
                            <!-- 1. The Menu Dots Trigger Box -->
                            <button class="btn-dots-context" onclick="toggleContextDropdownMenu(event, '${filename}')">···</button>

                            <!-- 2. Hidden Overlay Context Drawer Dropdown Menu Box -->
                            <div class="context-dropdown-overlay ${isDropdownOpen ? '' : 'hidden'}">
                                <button class="dropdown-action-item" onclick="event.stopPropagation(); cloneRecipeLayoutProfile('${filename}')">
                                    Clone Recipe
                                </button>
                                <button class="dropdown-action-item" onclick="event.stopPropagation(); downloadSingleJsonFileDirectly('${filename}')">
                                    Download JSON
                                </button>
                            </div>

                            <!-- 3. The Deletion Trash Can Trigger Box -->
                            <button class="btn-trash-direct-delete-layout-trash-btn" onclick="event.stopPropagation(); deleteRecipeTarget('${filename}')">
                                🗑️
                            </button>
                        </div>
                    </div>

                    <!-- LINE 2: Engine ID Text Label Drops Completely Down Below Your Buttons Row -->
                    <div onclick="selectActiveRecipeTarget('${filename}')" style="font-size: 11px; color: #5d6275; width: 100%; text-align: left; cursor: pointer; pointer-events: auto;">
                        ${recipesDatabase[filename].engine}
                    </div>

                </div>
            `;
        }
        container.appendChild(blockItem);
    });
}

function toggleContextDropdownMenu(event, filename) {
    event.stopPropagation();
    activeOpenDropdownId = (activeOpenDropdownId === filename) ? null : filename;
    renderSidebarList();
}

function cloneRecipeLayoutProfile(filename) {
    let sourceData = recipesDatabase[filename];
    if (!sourceData) return;
    saveActiveRecipeState();

    let baseName = filename.replace(".json", "");
    let clonedKey = baseName + "_copy.json";
    
    let cycleCounter = 1;
    while (recipesDatabase[clonedKey]) {
        clonedKey = `${baseName}_copy_${cycleCounter}.json`;
        cycleCounter++;
    }

    recipesDatabase[clonedKey] = {
        engine: sourceData.engine,
        inputItem: sourceData.inputItem,
        platform: sourceData.platform,
        useConditional: sourceData.useConditional,
        wrapperNamespace: sourceData.wrapperNamespace,
        ingredients: sourceData.ingredients.map(i => ({...i})),
        outputs: sourceData.outputs.map(o => ({...o})),
        conditions: sourceData.conditions.map(c => ({...c})),
        transitional: sourceData.transitional,
        loops: sourceData.loops,
        sequenceSteps: sourceData.sequenceSteps.map(s => ({...s}))
    };

    activeOpenDropdownId = null;
    activeRecipeId = clonedKey;
    loadRecipeFromState(clonedKey);
    renderSidebarList();
}

function downloadSingleJsonFileDirectly(filename) {
    saveActiveRecipeState();
    activeOpenDropdownId = null;
    renderSidebarList();

    let priorFocusKey = activeRecipeId;
    loadRecipeFromState(filename);
    let targetCodeTextString = document.getElementById('jsonOutput').textContent;

    let jsonBlob = new Blob([targetCodeTextString], { type: "application/json" });
    let temporaryDownloadLinkNode = document.createElement("a");
    temporaryDownloadLinkNode.href = URL.createObjectURL(jsonBlob);
    temporaryDownloadLinkNode.download = filename;
    temporaryDownloadLinkNode.click();

    if(priorFocusKey && recipesDatabase[priorFocusKey]) {
        loadRecipeFromState(priorFocusKey);
    }
}

document.addEventListener('click', function() {
    if (activeOpenDropdownId !== null) {
        activeOpenDropdownId = null;
        renderSidebarList();
    }
});

function saveActiveRecipeState() {
    if (!activeRecipeId) return;

    let activeDataNode = recipesDatabase[activeRecipeId];
    if (!activeDataNode) return;

    
    activeDataNode.inputItem = document.getElementById('inputItem').value;
    activeDataNode.useConditional = document.getElementById('useConditional').checked;
    activeDataNode.transitional = document.getElementById('transitionalItem').value;
    activeDataNode.loops = parseInt(document.getElementById('loopsCount').value) || 4;
    activeDataNode.platform = document.querySelector('input[name="platform"]:checked')?.value || "universal";
    

    const heatEl = document.getElementById('heatRequirement');
    if (heatEl) {
        activeDataNode.heatRequirement = heatEl.value || "none";
    }

    
    activeDataNode.autoConvertFabricFluids = document.getElementById('autoConvertFabricFluids')?.checked || false;

  
    const ingElements = document.getElementById('ingredientsContainer').children;
    let ingredientsList = [];

    for (let el of ingElements) {
        let inputField = el.querySelector('.ing-id');
        let fluidCheck = el.querySelector('.ing-is-fluid');
        let countField = el.querySelector('.ing-count');
        
        if (inputField && inputField.value) {
            let isFluid = fluidCheck ? fluidCheck.checked : false;
            let exactCount = countField ? parseInt(countField.value) : 1000;
            
            if (isNaN(exactCount)) exactCount = 1000;
            
            // Clean numeric clamp: Restricts fluid amount to 1000 mB max
            if (isFluid) {
                exactCount = Math.min(1000, exactCount);
            }

            ingredientsList.push({
                item: inputField.value,
                isFluid: isFluid,
                count: exactCount
            });
        }
    }
    activeDataNode.ingredients = ingredientsList;

    
    const outElements = document.getElementById('outputsContainer').children;
    let outputsList = [];

    for (let el of outElements) {
        let inputField = el.querySelector('.out-id');
        let countField = el.querySelector('.out-count');
        let chanceField = el.querySelector('.out-chance');
        let fluidCheck = el.querySelector('.out-is-fluid');

        if (inputField && inputField.value) {
            let isFluid = fluidCheck ? fluidCheck.checked : false;
            let exactCount = countField ? parseInt(countField.value) : 1;
            
            if (isNaN(exactCount)) exactCount = isFluid ? 1000 : 1;
            
           
            if (isFluid) {
                exactCount = Math.min(1000, exactCount);
            }

            outputsList.push({
                item: inputField.value,
                count: exactCount,
                chance: chanceField ? chanceField.value : "",
                isFluid: isFluid
            });
        }
    }
    activeDataNode.outputs = outputsList;

   
    const stepElements = document.getElementById('assemblyStepsContainer').children;
    let stepsList = [];
    for (let el of stepElements) {
        let typeSelect = el.querySelector('.step-type-select');
        let extraInput = el.querySelector('.step-extra-id');
        if (typeSelect) {
            stepsList.push({
                type: typeSelect.value,
                extraInput: extraInput ? extraInput.value : "",
                count: 1
            });
        }
    }
    activeDataNode.sequenceSteps = stepsList;

    
    const condElements = document.getElementById('conditionsContainer').children;
    let conditionsList = [];
    for (let el of condElements) {
        let typeSelect = el.querySelector('.cond-type-select');
        let keyInput = el.querySelector('.cond-key-id');
        let valInput = el.querySelector('.cond-val-id');
        let routeSelect = el.querySelector('.cond-route-select');
        if (typeSelect) {
            conditionsList.push({
                type: typeSelect.value,
                key: keyInput ? keyInput.value : "",
                val: valInput ? valInput.value : "",
                route: routeSelect ? routeSelect.value : "universal"
            });
        }
    }
    activeDataNode.conditions = conditionsList;

  
    renderSidebarList();
    
    
    commitApplicationCacheToDisk();
}

function loadRecipeFromState(filename) {
    let data = recipesDatabase[filename];
    if (!data) return;

    activeRecipeId = filename;

    document.getElementById('inputItem').value = data.inputItem;
    document.getElementById('useConditional').checked = data.useConditional;
    document.getElementById('transitionalItem').value = data.transitional;
    document.getElementById('loopsCount').value = data.loops;

    document.querySelector(`input[name="platform"][value="${data.platform}"]`).checked = true;
    const fabricCheckboxEl = document.getElementById('autoConvertFabricFluids');
    if (fabricCheckboxEl) {
        // Restores the checkmark true/false state from your saved dataset dictionary
        fabricCheckboxEl.checked = data.autoConvertFabricFluids || false;
    }
    document.getElementById('ingredientsContainer').innerHTML = "";
    document.getElementById('outputsContainer').innerHTML = "";
    document.getElementById('conditionsContainer').innerHTML = "";
    document.getElementById('assemblyStepsContainer').innerHTML = "";

    ingredientCount = 0;
    outputCount = 0;
    conditionCount = 0;
    assemblyStepCount = 0;

   
    const heatEl = document.getElementById('heatRequirement');
    if (heatEl) {
        heatEl.value = data.heatRequirement || "none";
    }

    const allowsHeat = (data.engine === 'create:mixing' || data.engine === 'create:compacting');
    const heatGroupEl = document.getElementById('heatRequirementGroup');
    if (heatGroupEl) {
        heatGroupEl.classList.toggle('hidden', !allowsHeat);
    }

    if (data.ingredients && data.ingredients.length > 0) {
        data.ingredients.forEach(ing => {
            
            let exactCount = parseInt(ing.count) || 1;
            if (ing.isFluid) {
                exactCount = Math.min(1000, exactCount);
            }
            addIngredientBlock(ing.item, ing.isFluid, exactCount);
        });
    }

    if (data.outputs && data.outputs.length > 0) {
        data.outputs.forEach(out => {
            let exactOutCount = parseInt(out.count) || 1;
            if (out.isFluid) {
                exactOutCount = Math.min(1000, exactOutCount);
            }
            addOutputBlock(out.item, exactOutCount, out.chance, out.isFluid);
        });
    } else {
        addOutputBlock("create:brass_ingot", 1, "", false);
    }

   if (data.sequenceSteps && data.sequenceSteps.length > 0) {
        data.sequenceSteps.forEach(s => addAssemblyStepBlock(s.type, s.extraInput, s.count));
    }

    toggleConditionalFields();
    
    data.conditions.forEach(c => {
        conditionCount++;
        const container = document.getElementById('conditionsContainer');
        const condDiv = document.createElement('div');
        condDiv.className = 'cond-block';
        condDiv.id = `cond_${conditionCount}`;
        condDiv.innerHTML = getConditionHTMLString(conditionCount, c.type, c.key, c.val);
        const selectRoute = condDiv.querySelector('.cond-route-select');
        if (selectRoute && c.route) selectRoute.value = c.route;
        container.appendChild(condDiv);
    });

    currentActiveEngine = data.engine;
    let activeTabButton = document.querySelector(`.engine-tab[data-engine="${data.engine}"]`);
    if (activeTabButton) {
        document.querySelectorAll('.engine-tab').forEach(b => b.classList.remove('active'));
        activeTabButton.classList.add('active');
    }

    toggleEngineFields();
}

function selectActiveRecipeTarget(filename) {
    saveActiveRecipeState();
    loadRecipeFromState(filename);
    renderSidebarList();
    compileRecipe(); 
    commitApplicationCacheToDisk();
}

function deleteRecipeTarget(filename) {
    delete recipesDatabase[filename];
    let keys = Object.keys(recipesDatabase);
    if (activeRecipeId === filename) {
        if (keys.length > 0) loadRecipeFromState(keys[0]);
        else activeRecipeId = null;
    }
    renderSidebarList();
    compileRecipe();
    commitApplicationCacheToDisk();
}

function getConditionHTMLString(id, cType, cKey, cVal) {
    return `
        <div class="cond-header-line" style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-bottom: 1px solid var(--border-color, #2d2e31); padding-bottom: 6px; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: bold; color: var(--accent); text-transform: uppercase; letter-spacing: 0.5px;">EVALUATION BLOCK LAYER</span>
            <span style="color: var(--danger, #ff4d4d); cursor: pointer; font-size: 11px; font-weight: bold;" onclick="removeBlock('cond_${id}')">Delete</span>
        </div>
        
        <!-- ROW 1: SCOPE ROUTING SELECTION -->
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start; width: 100%; gap: 14px; margin-top: 10px;">
            <div style="display: flex; flex-direction: column; gap: 4px; flex: 0 0 auto; width: 280px;">
                <label style="color: #7d8296; font-size: 10px; font-weight: 600; text-transform: uppercase; margin: 0;">Target Module Scope Routing</label>
                <select class="cond-route-select" onchange="compileRecipe()" style="width: 100%; height: 22px; padding: 1px 6px; font-size: 11px; background-color: #14151c; border: 1px solid #232530; color: #fff; border-radius: 4px; outline: none; cursor: pointer;">
                    <option value="both" ${cType === 'both' ? 'selected' : ''}>🌐 Both Platforms (Inject into Forge & Fabric)</option>
                    <option value="forge" ${cType === 'forge' ? 'selected' : ''}>🛠️ Forge Only Module (conditions)</option>
                    <option value="fabric" ${cType === 'fabric' ? 'selected' : ''}>🔮 Fabric Only Module (fabric:load_conditions)</option>
                </select>
            </div>
            <div style="font-size: 11px; color: #7d8296; line-height: 1.4; flex: 1; text-align: left; white-space: normal; word-break: break-word;">Determines whether this specific sub-property maps into one or both loader tracking arrays.</div>
        </div>

        <!-- ROW 2: CONDITION TYPE ID (SELF-RESIZING TEXT BOX) -->
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start; width: 100%; gap: 14px; margin-top: 12px;">
            <div style="display: flex; flex-direction: column; gap: 4px; flex: 0 1 auto;">
                <label style="color: #7d8296; font-size: 10px; font-weight: 600; text-transform: uppercase; margin: 0;">Condition Type ID</label>
                <input type="text" class="cond-type" value="${cType}" 
                    oninput="this.style.width = Math.max(120, (this.value.length * 7.5)) + 'px'; compileRecipe();" 
                    style="width: 140px; min-width: 120px; max-width: 400px; height: 22px; padding: 1px 6px; font-size: 11px; background-color: #14151c; border: 1px solid #232530; color: #fff; border-radius: 4px; outline: none; transition: width 0.05s ease;">
            </div>
            <div style="font-size: 11px; color: #7d8296; line-height: 1.4; flex: 1; text-align: left; white-space: normal; word-break: break-word;">Dynamic rule deserializer footprint tracking loop.</div>
        </div>

        <!-- ROW 3: PARAMETER KEY & EXPECTED VALUE (DUAL FLUID SHRINKS) -->
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start; width: 100%; gap: 14px; margin-top: 12px;">
            <div style="display: flex; flex-direction: row; align-items: center; gap: 10px; flex: 0 1 auto;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="color: #7d8296; font-size: 10px; font-weight: 600; text-transform: uppercase; margin: 0;">Parameter Key</label>
                    <input type="text" class="cond-key" value="${cKey}" 
                        oninput="this.style.width = Math.max(60, (this.value.length * 7.5)) + 'px'; compileRecipe();" 
                        style="width: 70px; min-width: 60px; max-width: 200px; height: 22px; padding: 1px 6px; font-size: 11px; background-color: #14151c; border: 1px solid #232530; color: #fff; border-radius: 4px; outline: none; transition: width 0.05s ease;">
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="color: #7d8296; font-size: 10px; font-weight: 600; text-transform: uppercase; margin: 0;">Expected Value</label>
                    <input type="text" class="cond-val" value="${cVal}" 
                        oninput="this.style.width = Math.max(80, (this.value.length * 7.5)) + 'px'; compileRecipe();" 
                        style="width: 90px; min-width: 80px; max-width: 200px; height: 22px; padding: 1px 6px; font-size: 11px; background-color: #14151c; border: 1px solid #232530; color: #fff; border-radius: 4px; outline: none; transition: width 0.05s ease;">
                </div>
            </div>
            <div style="font-size: 11px; color: #7d8296; line-height: 1.4; flex: 1; text-align: left; white-space: normal; word-break: break-word;">Parameter verification check property.</div>
        </div>
    `;
}

function switchEngine(buttonEl) {
    document.querySelectorAll('.engine-tab').forEach(b => b.classList.remove('active'));
    buttonEl.classList.add('active');
    currentActiveEngine = buttonEl.getAttribute('data-engine');
    if (activeRecipeId && recipesDatabase[activeRecipeId]) {
        recipesDatabase[activeRecipeId].engine = currentActiveEngine;
    }
    toggleEngineFields();
    renderSidebarList();
}

function toggleEngineFields() {
    const standardBox = document.getElementById('standardInputs');
    const multiPanel = document.getElementById('multiInputsPanel');
    const assemblyBox = document.getElementById('assemblyPanel');
    
    if (standardBox) standardBox.classList.add('hidden');
    if (multiPanel) multiPanel.classList.add('hidden');
    if (assemblyBox) assemblyBox.classList.add('hidden');
    
  
    const allowsFluid = (currentActiveEngine === 'create:mixing' || currentActiveEngine === 'create:compacting' || currentActiveEngine === 'create:filling');

    const allowsHeat = (currentActiveEngine === 'create:mixing' || currentActiveEngine === 'create:compacting');
    const heatGroupEl = document.getElementById('heatRequirementGroup');
    if (heatGroupEl) {
        heatGroupEl.classList.toggle('hidden', !allowsHeat);
    }

    if (currentActiveEngine === 'create:mixing' || currentActiveEngine === 'create:compacting') {
        if (multiPanel) multiPanel.classList.remove('hidden');
    } else if (currentActiveEngine === 'create:sequenced_assembly') {
        if (standardBox) standardBox.classList.remove('hidden');
        if (assemblyBox) assemblyBox.classList.remove('hidden');
    } else {
        if (standardBox) standardBox.classList.remove('hidden');
    }

   
    const allowsChance = (currentActiveEngine === 'create:crushing' || currentActiveEngine === 'create:sequenced_assembly');
    document.querySelectorAll('.out-chance-field-wrapper').forEach(el => el.classList.toggle('hidden', !allowsChance));

  
    document.querySelectorAll('.fluid-toggle-row').forEach(el => el.classList.toggle('hidden', !allowsFluid));

 
    if (!allowsFluid) {
        document.querySelectorAll('.ing-is-fluid, .out-is-fluid').forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
             
                if (checkbox.onchange) checkbox.onchange();
            }
        });
    }

    compileRecipe();
}

function updateFluidLabel(checkbox, elementId) {
    const label = document.getElementById(elementId);
    if (!label) return;
    label.textContent = checkbox.checked ? "Volume (mB)" : "Amount";
    compileRecipe();
}

function addIngredientBlock(defaultValue = "minecraft:iron_ingot") {
    const container = document.getElementById('ingredientsContainer');
    if (!container || container.children.length >= 9) return;
    ingredientCount++;
    const ingDiv = document.createElement('div');
    ingDiv.className = 'ingredient-block';
    ingDiv.id = `ing_${ingredientCount}`;

    const allowsFluid = (currentActiveEngine === 'create:mixing' || currentActiveEngine === 'create:compacting' || currentActiveEngine === 'create:filling');

    ingDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; font-weight:bold; color:var(--text-muted);">$Slot ${container.children.length + 1} ID</span>
            <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;" onclick="removeBlock('${ingDiv.id}'); checkIngredientCap();">Remove</span>
        </div>
        <input type="text" class="ing-id" value="${defaultValue}" oninput="compileRecipe()">
        
        <div class="fluid-toggle-row ${allowsFluid ? '' : 'hidden'}" style="display:flex; gap:10px; align-items:center; margin-top:6px;">
            <label style="margin-top:0; font-size:10px; display:inline-flex; align-items:center; cursor:pointer;">
                <input type="checkbox" class="ing-is-fluid" onchange="toggleFluidLabelContext(this, '${ingDiv.id}')"> 💧 Is Fluid?
            </label>
            <div class="ing-volume-container hidden" style="flex:1; display:flex; align-items:center; gap:6px;">
                <span style="font-size:10px; font-weight:bold; color:var(--accent);">mB:</span>
                <input type="number" class="ing-count" value="1000" min="0" max="1000" step="50"
                    oninput="let parsed = parseInt(this.value); if (parsed > 1000) this.value = 1000; compileRecipe();"
                    onchange="let parsed = parseInt(this.value); if (isNaN(parsed) || parsed < 0) parsed = 0; if (parsed > 1000) parsed = 1000; this.value = parsed; compileRecipe();">
            </div>
        </div>
    `;
    container.appendChild(ingDiv);
    checkIngredientCap();
    compileRecipe();
}

function checkIngredientCap() {
    const container = document.getElementById('ingredientsContainer');
    const btn = document.getElementById('addIngBtn');
    if (!container || !btn) return;
    btn.classList.toggle('hidden', container.children.length >= 9);
}

function addOutputBlock(defaultValue = "create:brass_ingot", defaultCount = 1, defaultChance = 1.0) {
    outputCount++;
    const container = document.getElementById('outputsContainer');
    if (!container) return;

    const outDiv = document.createElement('div');
    outDiv.className = 'ingredient-block left-aligned-layout-grid';
    outDiv.id = `out_${outputCount}`;

    const allowsChance = (currentActiveEngine === 'create:crushing' || currentActiveEngine === 'create:sequenced_assembly');
    const allowsFluid = (currentActiveEngine === 'create:mixing' || currentActiveEngine === 'create:compacting' || currentActiveEngine === 'create:filling');

    outDiv.innerHTML = `
        <div class="grid-cell-stacked-box" style="padding: 1px 1px; min-height: 100px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:11px; font-weight:bold; color:var(--text-muted);">Product Registry Result</span>
                <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;" onclick="removeBlock('${outDiv.id}')">Remove</span>
            </div>
            <input type="text" class="out-id" value="${defaultValue}" oninput="compileRecipe()">

            <!-- WRAPPED AND LABELED FOR AUTOMATED VISIBILITY TOGGLES -->
            <div class="fluid-toggle-row ${allowsFluid ? '' : 'hidden'}" style="margin-top:6px;">
                <label style="font-size:10px; display:inline-flex; align-items:center; cursor:pointer; margin-top:0;">
                    <input type="checkbox" class="out-is-fluid" onchange="
                        let block = this.closest('.grid-cell-stacked-box');
                        let numInput = block ? block.querySelector('.out-count') : null;
                        if (numInput) {
                            if (this.checked) {
                                numInput.step = '100';
                                numInput.max = '1000';
                                numInput.value = '1000';
                            } else {
                                numInput.removeAttribute('step');
                                numInput.removeAttribute('max');
                                numInput.value = '1';
                            }
                        }
                        toggleFluidLabelContext(this, '${outDiv.id}');
                    "> 💧 Is Fluid Output Result?
                </label>
            </div>

            <div style="display:flex; gap:10px; margin-top:6px;">
                <div style="flex:1;">
                    <label class="out-count-label" style="margin-top:0;">Amount</label>
                    <input type="number" class="out-count" value="${defaultValue}" min="0" max="1000" style="padding:4px; font-size:11px;"
                        oninput="let block = this.closest('.grid-cell-stacked-box'); let isFluid = block ? block.querySelector('.out-is-fluid')?.checked : false; let parsed = parseInt(this.value); if (isFluid && parsed > 1000) this.value = 1000; compileRecipe();"
                        onchange="let block = this.closest('.grid-cell-stacked-box'); let isFluid = block ? block.querySelector('.out-is-fluid')?.checked : false; let parsed = parseInt(this.value); if (isNaN(parsed)) parsed = 1; if (isFluid) { if (parsed < 0) parsed = 0; if (parsed > 1000) parsed = 1000; } else { if (parsed < 1) parsed = 1; } this.value = parsed; compileRecipe();">
                </div>
                <div style="flex:1;" class="out-chance-field-wrapper ${allowsChance ? '' : 'hidden'}">
                    <label style="margin-top:0; color:var(--accent);">Chance (0.0 - 1.0)</label>
                    <input type="number" class="out-chance" value="${defaultChance}" step="0.1" min="0" max="1" oninput="compileRecipe()">
                </div>
            </div>
        </div>
    `;

    container.appendChild(outDiv);
    compileRecipe();
}

function toggleFluidLabelContext(checkbox, blockId) {
    const parent = document.getElementById(blockId);
    if (!parent) return;

    if (checkbox.classList.contains('ing-is-fluid')) {
        const volumeContainer = parent.querySelector('.ing-volume-container');
        if (volumeContainer) {
            volumeContainer.classList.toggle('hidden', !checkbox.checked);
            

            const ingCountInput = parent.querySelector('.ing-count');
            if (ingCountInput) {
                let parsedVal = parseInt(ingCountInput.value) || 1000;

                if (parsedVal === 1 || ingCountInput.value === "1") {
                    ingCountInput.value = "1000";
                } else {
                    ingCountInput.value = Math.min(1000, parsedVal).toString();
                }
            }
        }
    } else {
        const label = parent.querySelector('.out-count-label');
        if (label) label.textContent = checkbox.checked ? "Volume (mB)" : "Amount";
        
        const countInput = parent.querySelector('.out-count');
        if (countInput && checkbox.checked) {
            let parsedOutVal = parseInt(countInput.value) || 1000;
            // Clean dynamic default fallback execution path
            if (parsedOutVal === 1 || countInput.value === "1") {
                countInput.value = "1000"; // Defaults to full bucket millibuckets values
            } else {
                countInput.value = Math.min(1000, parsedOutVal).toString();
            }
        }
    }

    compileRecipe();
}


function addAssemblyStepBlock(type = null, inputVal = "", defaultCount = 1000) {
    assemblyStepCount++;
    const container = document.getElementById('assemblyStepsContainer');
    if (!container) return;

    const selectValue = type || document.getElementById('stepTypeSelector').value;
    const stepDiv = document.createElement('div');
    stepDiv.className = 'ingredient-block cond-block';
    stepDiv.id = `step_${assemblyStepCount}`;
    
    let placeholderText = "minecraft:air";
    let inputLabel = "Extra Input Item ID";
    const isFilling = (selectValue === 'create:filling');
    
    if (isFilling) {
        placeholderText = "minecraft:water";
        inputLabel = "Fluid ID Required";
    } else if (selectValue === 'create:deploying') {
        placeholderText = "minecraft:cogwheel";
        inputLabel = "Item To Deploy / Handheld Tool ID";
    }

    stepDiv.innerHTML = `
        <div class="cond-header-line">
            <strong style="font-size:11px; color:var(--accent); text-transform:uppercase;">STEP ${container.children.length + 1}: ${selectValue.replace('create:', '')}</strong>
            <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;" onclick="removeBlock('${stepDiv.id}')">Delete Step</span>
        </div>
        <input type="hidden" class="step-engine-type" value="${selectValue}">
        <div class="left-aligned-layout-grid" style="margin-top:6px; ${ (selectValue === 'create:pressing' || selectValue === 'create:cutting') ? 'display:none;' : '' }">
            <div class="grid-cell-stacked-box">
                <label style="margin-top:0;">${inputLabel}</label>
                <input type="text" class="step-extra-input" value="${inputVal}" placeholder="${placeholderText}" oninput="compileRecipe()">
                <div style="margin-top:6px; ${isFilling ? '' : 'display:none;'}">
                    <label style="margin:0; font-size:10px;">Volume (mB)</label>
                    <input type="number" class="step-count-input" value="${defaultCount}" min="1" oninput="compileRecipe()">
                </div>
            </div>
            <div class="grid-cell-context-hint">➔ Additional sequence track fluid or item requirement properties.</div>
        </div>
    `;
    container.appendChild(stepDiv);
    compileRecipe();
}

function changePlatformConstraints(mode) {
    const wrapper = document.getElementById('wrapperNamespace');
    if(mode === 'forge_only') wrapper.value = 'forge:conditional';
    if(mode === 'fabric_only') wrapper.value = 'fabric:conditional';
    compileRecipe();
}

function addConditionBlock() {
    const selectValue = document.getElementById('conditionSelector').value;
    const preset = presets[selectValue];
    conditionCount++;
    const container = document.getElementById('conditionsContainer');
    const condDiv = document.createElement('div');
    condDiv.className = 'cond-block';
    condDiv.id = `cond_${conditionCount}`;
    condDiv.innerHTML = getConditionHTMLString(conditionCount, preset.id, preset.key, preset.val);
    container.appendChild(condDiv);
    compileRecipe();
}

function quickFillAsset(assetId) {
    if (currentActiveEngine === 'create:mixing' || currentActiveEngine === 'create:compacting') { 
        addIngredientBlock(assetId); 
    } else { 
        const inputField = document.getElementById('inputItem');
        if (inputField) inputField.value = assetId; 
        compileRecipe(); 
    }
}

function removeBlock(id) { const el = document.getElementById(id); if (el) el.remove(); compileRecipe(); }
function toggleConditionalFields() { 
    const cb = document.getElementById('useConditional');
    const config = document.getElementById('conditionalConfig');
    if (!cb || !config) return;
    config.classList.toggle('hidden', !cb.checked); 
    compileRecipe(); 
}
document.addEventListener('DOMContentLoaded', () => {
    recipesDatabase["mixing_recipe.json"] = {
        engine: "create:mixing",
        inputItem: "minecraft:iron_ingot",
        platform: "universal",
        useConditional: false,
        wrapperNamespace: "forge:conditional",
        ingredients: [
            { item: "minecraft:copper_ingot", isFluid: false, count: 1 }, 
            { item: "minecraft:zinc_ingot", isFluid: false, count: 1 }
        ],
        outputs: [{ item: "create:brass_ingot", count: 1, chance: "", isFluid: false }],
        conditions: [],
        transitional: "create:incomplete_iron_sheet",
        loops: 4,
        sequenceSteps: []
    };

  
    const savedCacheData = localStorage.getItem('create_recipe_studio_db');
    if (savedCacheData) {
        try {
            const parsedDatabase = JSON.parse(savedCacheData);
        
            Object.keys(parsedDatabase).forEach(filename => {
                recipesDatabase[filename] = parsedDatabase[filename];
            });
        } catch (error) {
            console.warn("Corrupted recipe database cache encountered. Reverting to structural defaults.", error);
        }
    }


    const availableLayoutKeys = Object.keys(recipesDatabase);
    if (availableLayoutKeys.length > 0) {
  
        activeRecipeId = availableLayoutKeys[0];
        
   
        if (typeof renderSidebarList === 'function') renderSidebarList();
        if (typeof loadRecipeFromState === 'function') loadRecipeFromState(activeRecipeId);
    }
});

recipesDatabase["mixing_recipe.json"] = {
    engine: "create:mixing",
    inputItem: "minecraft:iron_ingot",
    platform: "universal",
    useConditional: false,
    heatRequirement: "none",
    ingredients: [{ item: "minecraft:copper_ingot", isFluid: false, count: 1 }, { item: "minecraft:zinc_ingot", isFluid: false, count: 1 }],
    outputs: [{ item: "create:brass_ingot", count: 1, chance: "", isFluid: false }],
    conditions: [],
    transitional: "create:incomplete_iron_sheet",
    loops: 4,
    sequenceSteps: []
};
activeRecipeId = "mixing_recipe.json";
loadRecipeFromState(activeRecipeId);
renderSidebarList();


function copyToClipboard() {
    
    const codeContainer = document.getElementById('jsonOutput');
    if (!codeContainer) {
        console.error("Could not find element with id 'jsonOutput' to copy from.");
        return;
    }

   
    const codeText = codeContainer.textContent || codeContainer.innerText;

    navigator.clipboard.writeText(codeText)
        .then(() => {
           
            const copyBtn = document.querySelector('.code-card-header .add-slot-btn');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = "✓ Copied!";
                copyBtn.style.color = "#a7f3d0";
                
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.color = "";
                }, 2000);
            }
        })
        .catch(err => {
            console.error('Failed to copy compiled code strings to clipboard: ', err);
            alert('Could not copy automatically. Please select the code manually and use Ctrl+C.');
        });
}






function commitApplicationCacheToDisk() {
    try {
        if (!recipesDatabase || typeof recipesDatabase !== 'object') return;
        
   
        const serializedPayload = JSON.stringify(recipesDatabase);
        localStorage.setItem('create_recipe_generator_cache', serializedPayload);
        
  
        if (activeRecipeId) {
            localStorage.setItem('create_recipe_generator_last_active_id', activeRecipeId);
        }
    } catch (error) {
        console.error("[Storage Cache] Failed to write data payload to disk:", error);
    }
}

function hydrateApplicationCacheFromDisk() {
    try {
        const storedPayload = localStorage.getItem('create_recipe_generator_cache');
        
        if (storedPayload) {
            const parsedData = JSON.parse(storedPayload);
            

            if (parsedData && Object.keys(parsedData).length > 0) {
                recipesDatabase = parsedData;
                console.log("[Storage Cache] Successfully loaded recipes from local cache.");
            }
        } else {
            console.log("[Storage Cache] No cache found. Running application layout defaults.");
        }


        const lastSavedActiveId = localStorage.getItem('create_recipe_generator_last_active_id');
        if (lastSavedActiveId && recipesDatabase[lastSavedActiveId]) {
            activeRecipeId = lastSavedActiveId;
        } else {

            const databaseKeys = Object.keys(recipesDatabase);
            if (databaseKeys.length > 0) {
                activeRecipeId = databaseKeys[0];
            }
        }


        renderSidebarList();
        if (activeRecipeId) {
            loadRecipeFromState(activeRecipeId);
        }
    } catch (error) {
        console.error("[Storage Cache] Failed to hydrate layout data loops from cache:", error);
    }
}

