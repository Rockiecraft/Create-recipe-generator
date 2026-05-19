/**
 * CREATE RECIPE GENERATOR - Core Workspace Engine
 * Handles full UI states, responsive sidebar collapse, multiple inputs/outputs,
 * state isolation saving, inline file renaming, and fluid volume conversions.
 */
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
        wrapperNamespace: "forge:conditional",
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
                <div onclick="selectActiveRecipeTarget('${filename}')" style="flex:1; display:flex; flex-direction:column; gap:2px; margin-right:8px; cursor:pointer;">
                    <input type="text" class="sidebar-name-input" value="${renderLabel}" 
                        onclick="event.stopPropagation(); selectActiveRecipeTarget('${filename}');" 
                        onchange="updateRecipeFilenameInline('${filename}', this)"
                        onkeydown="if(event.key === 'Enter') { this.blur(); }"
                        style="background:transparent; border:none; color:#fff; font-weight:600; font-family:inherit; padding:2px 0; font-size:13px; width:100%; border-bottom:1px solid transparent; cursor:text;"
                        onfocus="this.style.borderBottomColor='var(--accent)';"
                        onblur="this.style.borderBottomColor='transparent';">
                    <div style="font-size:11px; color:var(--text-muted); pointer-events:none;">${recipesDatabase[filename].engine}</div>
                </div>
                
                <div class="recipe-item-actions-wrapper" style="display: flex; align-items: center; gap: 6px;">
                    <!-- 1. Context Options Menu Button (Three Dots) -->
                    <button class="btn-dots-context" onclick="toggleContextDropdownMenu(event, '${filename}')">···</button>
                    
                    <!-- 2. Cleaned Dropdown Overlay Menu (Red Delete Button Completely Removed) -->
                    <div class="context-dropdown-overlay ${isDropdownOpen ? '' : 'hidden'}">
                        <button class="dropdown-action-item" onclick="event.stopPropagation(); cloneRecipeLayoutProfile('${filename}')">
                            📋 Clone Recipe
                        </button>
                        <button class="dropdown-action-item" onclick="event.stopPropagation(); downloadSingleJsonFileDirectly('${filename}')">
                            📥 Download JSON
                        </button>
                    </div>

                    <!-- 3. Direct Trash Can Button (Positioned on the Right Side of the dots) -->
                    <button class="btn-trash-direct delete-layout-trash-btn" 
                            onclick="event.stopPropagation(); deleteRecipeTarget('${filename}')"
                            title="Delete Layout"
                            style="background: transparent; border: none; cursor: pointer; color: #ff4d4d; font-size: 14px; padding: 4px; display: flex; align-items: center; justify-content: center; line-height: 1;">
                        🗑️
                    </button>
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
    if (!activeRecipeId || !recipesDatabase[activeRecipeId]) return;

    let ingredientsList = [];
    const ingElements = document.getElementById('ingredientsContainer').children;
    for (let el of ingElements) {
        let inputField = el.querySelector('.ing-id');
        let fluidCheck = el.querySelector('.ing-is-fluid');
        let countField = el.querySelector('.ing-count');
        if (inputField) {
            ingredientsList.push({
                item: inputField.value,
                isFluid: fluidCheck ? fluidCheck.checked : false,
                count: countField ? parseInt(countField.value) : 1000
            });
        }
    }

    let outputsList = [];
    const outElements = document.getElementById('outputsContainer').children;
    for (let el of outElements) {
        let itemInput = el.querySelector('.out-id');
        let countInput = el.querySelector('.out-count');
        let chanceInput = el.querySelector('.out-chance');
        let fluidCheck = el.querySelector('.out-is-fluid');
        if (itemInput) {
            outputsList.push({
                item: itemInput.value,
                count: countInput ? parseInt(countInput.value) : 1,
                chance: chanceInput ? chanceInput.value : "",
                isFluid: fluidCheck ? fluidCheck.checked : false
            });
        }
    }

    let stepsList = [];
    const stepElements = document.getElementById('assemblyStepsContainer').children;
    for (let el of stepElements) {
        let typeField = el.querySelector('.step-engine-type');
        let extraField = el.querySelector('.step-extra-input');
        let countField = el.querySelector('.step-count-input');
        if (typeField) {
            stepsList.push({
                type: typeField.value,
                extraInput: extraField ? extraField.value : "",
                count: countField ? parseInt(countField.value) : 1000
            });
        }
    }

    let customConditions = [];
    const condElements = document.getElementById('conditionsContainer').children;
    for (let el of condElements) {
        customConditions.push({
            type: el.querySelector('.cond-type').value,
            key: el.querySelector('.cond-key').value,
            val: el.querySelector('.cond-val').value,
            route: el.querySelector('.cond-route-select') ? el.querySelector('.cond-route-select').value : "both"
        });
    }

    recipesDatabase[activeRecipeId] = {
        engine: currentActiveEngine,
        inputItem: document.getElementById('inputItem').value,
        platform: document.querySelector('input[name="platform"]:checked').value,
        useConditional: document.getElementById('useConditional').checked,
        ingredients: ingredientsList,
        outputs: outputsList,
        conditions: customConditions,
        transitional: document.getElementById('transitionalItem').value,
        loops: parseInt(document.getElementById('loopsCount').value) || 4,
        sequenceSteps: stepsList
    };

        localStorage.setItem('create_studio_recipe_cache', JSON.stringify(recipesDatabase));
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

    document.getElementById('ingredientsContainer').innerHTML = "";
    document.getElementById('outputsContainer').innerHTML = "";
    document.getElementById('conditionsContainer').innerHTML = "";
    document.getElementById('assemblyStepsContainer').innerHTML = "";

    ingredientCount = 0;
    outputCount = 0;
    conditionCount = 0;
    assemblyStepCount = 0;

    if (data.ingredients && data.ingredients.length > 0) {
        data.ingredients.forEach(ing => addIngredientBlock(ing.item, ing.isFluid, ing.count));
    }

    if (data.outputs && data.outputs.length > 0) {
        data.outputs.forEach(out => addOutputBlock(out.item, out.count, out.chance, out.isFluid));
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
}

function getConditionHTMLString(id, cType, cKey, cVal) {
    return `
        <div class="cond-header-line">
            <span style="font-size:11px; font-weight:bold; color:var(--accent);">EVALUATION BLOCK LAYER</span>
            <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;" onclick="removeBlock('cond_${id}')">Delete</span>
        </div>
        <div class="left-aligned-layout-grid" style="margin-top:8px;">
            <div class="grid-cell-stacked-box">
                <label style="margin-top:0; color:#5dade2;">Target Module Scope Routing</label>
                <select class="cond-route-select" onchange="compileRecipe()" style="margin-top:4px;">
                    <option value="both" selected>🌐 Both Platforms (Inject into Forge & Fabric)</option>
                    <option value="forge">🔨 Forge Only Module (conditions)</option>
                    <option value="fabric">🌀 Fabric Only Module (fabric:load_conditions)</option>
                </select>
            </div>
            <div class="grid-cell-context-hint">➔ Determines whether this specific sub-property maps into one or both loader tracking arrays.</div>
        </div>
        <div class="left-aligned-layout-grid" style="margin-top:8px;">
            <div class="grid-cell-stacked-box">
                <label style="margin-top:0;">Condition Type ID</label>
                <input type="text" class="cond-type" value="${cType}" oninput="compileRecipe()">
            </div>
            <div class="grid-cell-context-hint">➔ Dynamic rule deserializer footprint tracking loop.</div>
        </div>
        <div class="left-aligned-layout-grid" style="margin-top:8px;">
            <div class="grid-cell-stacked-box" style="flex-direction:row; gap:10px;">
                <div style="flex:1;">
                    <label style="margin-top:0;">Parameter Key</label>
                    <input type="text" class="cond-key" value="${cKey}" oninput="compileRecipe()">
                </div>
                <div style="flex:1;">
                    <label style="margin-top:0;">Expected Value</label>
                    <input type="text" class="cond-val" value="${cVal}" oninput="compileRecipe()">
                </div>
            </div>
            <div class="grid-cell-context-hint">➔ Parameter verification check property.</div>
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
    
    // Check if the current engine type natively supports fluid variables
    const allowsFluid = (currentActiveEngine === 'create:mixing' || currentActiveEngine === 'create:compacting' || currentActiveEngine === 'create:filling');

    if (currentActiveEngine === 'create:mixing' || currentActiveEngine === 'create:compacting') {
        if (multiPanel) multiPanel.classList.remove('hidden');
    } else if (currentActiveEngine === 'create:sequenced_assembly') {
        if (standardBox) standardBox.classList.remove('hidden');
        if (assemblyBox) assemblyBox.classList.remove('hidden');
    } else {
        if (standardBox) standardBox.classList.remove('hidden');
    }

    // Dynamic visibility enforcement for Chance boxes (restricted to crushing/assembly)
    const allowsChance = (currentActiveEngine === 'create:crushing' || currentActiveEngine === 'create:sequenced_assembly');
    document.querySelectorAll('.out-chance-field-wrapper').forEach(el => el.classList.toggle('hidden', !allowsChance));

    // DYNAMIC FLUID OPTION ENFORCEMENT LAYER
    // Hide fluid toggle option rows entirely across non-fluid processing cogs
    document.querySelectorAll('.fluid-toggle-row').forEach(el => el.classList.toggle('hidden', !allowsFluid));

    // Safety fallback correction loop: Uncheck fluid boxes and force item re-evaluation if user clicks a dry machine
    if (!allowsFluid) {
        document.querySelectorAll('.ing-is-fluid, .out-is-fluid').forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                // Trigger the text change listener to swap label styles back to item counts
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
            <span style="font-size:11px; font-weight:bold; color:var(--text-muted);">Slot ${container.children.length + 1} ID</span>
            <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;" onclick="removeBlock('${ingDiv.id}'); checkIngredientCap();">Remove</span>
        </div>
        <input type="text" class="ing-id" value="${defaultValue}" oninput="compileRecipe()">
        
        <!-- WRAPPED AND LABELED FOR AUTOMATED VISIBILITY TOGGLES -->
        <div class="fluid-toggle-row ${allowsFluid ? '' : 'hidden'}" style="display:flex; gap:10px; align-items:center; margin-top:6px;">
            <label style="margin-top:0; font-size:10px; display:inline-flex; align-items:center; cursor:pointer;">
                <input type="checkbox" class="ing-is-fluid" onchange="toggleFluidLabelContext(this, '${ingDiv.id}')"> 💧 Is Fluid?
            </label>
            <div class="ing-volume-container hidden" style="flex:1; display:flex; align-items:center; gap:6px;">
                <span style="font-size:10px; font-weight:bold; color:var(--accent);">mB:</span>
                <input type="number" class="ing-count" value="1000" min="1" step="100" style="padding:4px; font-size:11px;" oninput="compileRecipe()">
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
        <div class="grid-cell-stacked-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:11px; font-weight:bold; color:var(--text-muted);">Product Registry Result</span>
                <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;" onclick="removeBlock('${outDiv.id}')">Remove</span>
            </div>
            <input type="text" class="out-id" value="${defaultValue}" oninput="compileRecipe()">
            
            <!-- WRAPPED AND LABELED FOR AUTOMATED VISIBILITY TOGGLES -->
            <div class="fluid-toggle-row ${allowsFluid ? '' : 'hidden'}" style="margin-top:6px;">
                <label style="font-size:10px; display:inline-flex; align-items:center; cursor:pointer; margin-top:0;">
                    <input type="checkbox" class="out-is-fluid" onchange="toggleFluidLabelContext(this, '${outDiv.id}')"> 💧 Is Fluid Output Result?
                </label>
            </div>

            <div style="display:flex; gap:10px; margin-top:6px;">
                <div style="flex:1;">
                    <label class="out-count-label" style="margin-top:0;">Amount</label>
                    <input type="number" class="out-count" value="${defaultCount}" min="1" oninput="compileRecipe()">
                </div>
                <div style="flex:1;" class="out-chance-field-wrapper ${allowsChance ? '' : 'hidden'}">
                    <label style="margin-top:0; color:var(--accent);">Chance (0.0 - 1.0)</label>
                    <input type="number" class="out-chance" value="${defaultChance}" step="0.1" min="0" max="1" oninput="compileRecipe()">
                </div>
            </div>
        </div>
        <div class="grid-cell-context-hint">➔ Drop parameter results settings map node.</div>
    `;
    container.appendChild(outDiv);
    compileRecipe();
}

function toggleFluidLabelContext(checkbox, blockId) {
    const parent = document.getElementById(blockId);
    if (!parent) return;

    if (checkbox.classList.contains('ing-is-fluid')) {
        const volumeContainer = parent.querySelector('.ing-volume-container');
        if (volumeContainer) volumeContainer.classList.toggle('hidden', !checkbox.checked);
    } else {
        const label = parent.querySelector('.out-count-label');
        if (label) label.textContent = checkbox.checked ? "Volume (mB)" : "Amount";
        const countInput = parent.querySelector('.out-count');
        if (countInput && checkbox.checked && countInput.value === "1") {
            countInput.value = "1000"; // Dynamic helper defaults to full bucket millibuckets values
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
// ========================================================
// PERSISTENT CACHE RECOVERY LOAD LAYER (Milestone 2) [1]
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Maintain your exact internal database schema records untouched
    // If you have other default recipes below mixing_recipe, they will remain safely here.
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

    // 2. Safely merge previous layouts from browser storage without overwriting defaults [1]
    const savedCacheData = localStorage.getItem('create_recipe_studio_db');
    if (savedCacheData) {
        try {
            const parsedDatabase = JSON.parse(savedCacheData);
            // Dynamic merge: Loop and append saved layouts back into active runtime memory [1]
            Object.keys(parsedDatabase).forEach(filename => {
                recipesDatabase[filename] = parsedDatabase[filename];
            });
        } catch (error) {
            console.warn("Corrupted recipe database cache encountered. Reverting to structural defaults.", error);
        }
    }

    // 3. Define active display targets and redraw the workspace elements out of cache [1]
    const availableLayoutKeys = Object.keys(recipesDatabase);
    if (availableLayoutKeys.length > 0) {
        // Fall back to first valid file element record if activeRecipeId is blank
        activeRecipeId = availableLayoutKeys[0];
        
        // Native render loops inside your repository to refresh UI panels [1]
        if (typeof renderSidebarList === 'function') renderSidebarList();
        if (typeof loadRecipeFromState === 'function') loadRecipeFromState(activeRecipeId);
    }
});

recipesDatabase["mixing_recipe.json"] = {
    engine: "create:mixing",
    inputItem: "minecraft:iron_ingot",
    platform: "universal",
    useConditional: false,
    wrapperNamespace: "forge:conditional",
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
