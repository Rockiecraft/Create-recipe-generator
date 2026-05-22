function addIngredientBlock(defaultValue = "minecraft:stone") {
    const container = document.getElementById('ingredientsContainer');
    if (!container) return;

    const currentCount = container.children.length;
    if (currentCount >= 9) return;

    const ingDiv = document.createElement('div');
    ingDiv.id = `ing_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    ingDiv.className = 'grid-cell-stacked-box';
    ingDiv.style.position = 'relative';

    const targetEngine = (currentActiveEngine || 'mixing').replace('create:', '');
    const isFluidEngine = (targetEngine === 'mixing' || targetEngine === 'compacting' || targetEngine === 'sequenced_assembly');
    const fluidVisibility = isFluidEngine ? '' : 'hidden';

    ingDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; font-weight:bold; color:var(--text-muted);">Slot ${container.children.length + 1} ID</span>
            <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;" onclick="removeBlock('${ingDiv.id}'); checkIngredientCap();">Remove</span>
        </div>
        <input type="text" class="ing-id" value="${defaultValue}" oninput="if(typeof updateCraftingKeysLegend==='function')updateCraftingKeysLegend(); if(typeof compileRecipe==='function')compileRecipe();">
        
        <div class="fluid-toggle-row ${fluidVisibility}" style="display:flex; gap:10px; align-items:center; margin-top:6px;">
            <label style="margin-top:0; font-size:10px; display:inline-flex; align-items:center; cursor:pointer;">
                <input type="checkbox" class="ing-is-fluid" onchange="if(typeof toggleFluidLabelContext==='function')toggleFluidLabelContext(this, '${ingDiv.id}')"> 💧 Is Fluid?
            </label>
            <div class="ing-volume-container hidden" style="flex:1; display:flex; align-items:center; gap:6px;">
                <span style="font-size:10px; font-weight:bold; color:var(--accent);">mB:</span>
                <input type="number" class="ing-count" value="1000" step="100" style="padding:6px; font-size:11px; width:40% !important;"
                     oninput="let parsed = parseInt(this.value) || 0; if (parsed < 1) parsed = 1; if (parsed > 1000) parsed = 1000; this.value = parsed; if(typeof compileRecipe==='function')compileRecipe();"
                     onchange="let parsed = parseInt(this.value) || 1000; if (parsed < 1) parsed = 1; if (parsed > 1000) parsed = 1000; this.value = parsed; if(typeof compileRecipe==='function')compileRecipe();">
            </div>
        </div>
    `;
    window.toggleFluidLabelContext = function(checkbox, blockId) {
    const block = document.getElementById(blockId);
    if (!block) return;
    

    const volumeContainer = block.querySelector('.ing-volume-container');
    
            if (volumeContainer) {
            if (checkbox.checked) {
  
            volumeContainer.classList.remove('hidden');
            } else {
                volumeContainer.classList.add('hidden');
            }
         }
    

         if (typeof compileRecipe === 'function') {
         compileRecipe();
        }
    };
    container.appendChild(ingDiv);
    checkIngredientCap();
    if (typeof compileRecipe === 'function') compileRecipe();
}

function addOutputBlock(defaultValue = "create:brass_ingot") {
    const container = document.getElementById('outputsContainer');
    if (!container) return;

    const currentCount = container.children.length;
    if (currentCount >= 9) return;

    const outDiv = document.createElement('div');
    outDiv.id = `out_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    outDiv.className = 'grid-cell-stacked-box';
    outDiv.style.position = 'relative';


    const rawEngine = currentActiveEngine || 'create:mixing';
    const targetEngine = rawEngine.replace('create:', '');
    const isFluidOutputEngine = (targetEngine === 'mixing' || targetEngine === 'compacting');
    

    const fluidOutputVisibilityClass = isFluidOutputEngine ? '' : 'hidden';

    outDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; font-weight:bold; color:var(--text-muted);">Product Registry Result</span>
            <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;" onclick="removeBlock('${outDiv.id}'); checkOutputCap();">Remove</span>
        </div>
        <input type="text" class="out-id" value="${defaultValue}" oninput="if(typeof compileRecipe==='function')compileRecipe();">
        
       
        <div class="fluid-output-toggle-row ${fluidOutputVisibilityClass}" style="display:flex; gap:10px; align-items:center; margin-top:6px;">
            <label style="margin-top:0; font-size:10px; display:inline-flex; align-items:center; cursor:pointer;">
                <input type="checkbox" class="out-is-fluid" onchange="if(typeof toggleFluidOutputLabelContext==='function')toggleFluidOutputLabelContext(this, '${outDiv.id}')"> 💧 Is Fluid Output Result?
            </label>
        </div>
        
        <div style="display:flex; gap:10px; margin-top:6px;">
            <div style="flex:1;">
                <label class="out-count-label" style="margin-top:0;">Amount</label>
<input type="number" class="out-count" value="1" min="0" max="10000" step="1" style="padding:4px; font-size:11px;"
     oninput="if(typeof compileRecipe==='function')compileRecipe();"
     onchange="let block = this.closest('.grid-cell-stacked-box'); let isFluid = block ? block.querySelector('.out-is-fluid')?.checked : false; if (isFluid) { let parsed = parseInt(this.value) || 0; if (parsed < 1) parsed = 100; if (parsed > 1000) parsed = 1000; this.value = parsed; } else { let parsed = parseInt(this.value) || 0; if (parsed < 1 || parsed > 64) parsed = 1; this.value = parsed; } if(typeof compileRecipe==='function')compileRecipe();">

            </div>
            <div class="chance-container" style="flex:1;">
                <label style="margin-top:0;">Chance</label>
                <input type="number" class="out-chance" value="1.0" min="0.0" max="1.0" step="0.1" style="padding:4px; font-size:11px;" oninput="if(typeof compileRecipe==='function')compileRecipe();">
            </div>
        </div>
    `;

    container.appendChild(outDiv);
    checkOutputCap();

   
    if (typeof toggleEngineFields === 'function') toggleEngineFields();
    if (typeof compileRecipe === 'function') compileRecipe();
}


function addAssemblyStepBlock(defaultValue = "minecraft:stone") {
    const container = document.getElementById('assemblyStepsContainer');
    if (!container) return;

    const currentCount = container.children.length;
    if (currentCount >= 9) return;

    const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const stepDiv = document.createElement('div');
    stepDiv.id = stepId;
    stepDiv.className = 'grid-cell-stacked-box';
    stepDiv.style.position = 'relative';

    stepDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; font-weight:bold; color:var(--text-muted);">Step Processing Operation</span>
            <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;" onclick="removeBlock('${stepDiv.id}')">Remove</span>
        </div>
        
        <!-- Machine Type Selection Row Row -->
        <div style="display:flex; align-items:center; gap:12px; width:100%; margin-top:6px; box-sizing:border-box;">
            <label style="color:#7d8296; font-size:11px; width:130px; flex-shrink:0; white-space:nowrap;">Operation Mechanical Type</label>
            <select class="step-type" onchange="handleStepTypeFieldsUpdate('${stepId}'); if(typeof compileRecipe==='function')compileRecipe();" style="height:26px; font-size:11px; flex:1; min-width:0;">
                <option value="pressing">Pressing (Mechanical Press)</option>
                <option value="deploying">Deploying (Mechanical Hand)</option>
                <option value="filling">Filling (Spout Fluid Injection)</option>
            </select>
        </div>
        
        <!-- Item ID Deployment Input Row -->
        <div class="step-item-field-row hidden" style="display:flex; align-items:center; gap:12px; width:100%; margin-top:6px; box-sizing:border-box;">
            <label style="color:#7d8296; font-size:11px; width:130px; flex-shrink:0; white-space:nowrap;">Extra Operational Item ID</label>
            <input type="text" class="ing-id" value="${defaultValue}" oninput="if(typeof compileRecipe==='function')compileRecipe();" style="height:26px; font-size:11px; flex:1; min-width:0;">
        </div>

        <!--  Liquid Filling Dual Input Row -->
        <div class="step-fluid-field-row hidden" style="width:100%; margin-top:6px; display:flex; flex-direction:column; gap:6px; box-sizing:border-box;">
            <div style="display:flex; align-items:center; gap:12px; width:100%;">
                <label style="color:#7d8296; font-size:11px; width:130px; flex-shrink:0; white-space:nowrap;">Operational Fluid ID & mB</label>
                <div style="display:flex; gap:8px; flex:1; min-width:0;">
                    <input type="text" class="step-fluid-id" value="minecraft:water" oninput="if(typeof compileRecipe==='function')compileRecipe();" style="height:26px; font-size:11px; flex:1; min-width:0;" placeholder="Fluid Registry ID">
                    <input type="number" class="step-fluid-amount" value="200" step="100" style="height:26px; font-size:11px; width:75px !important; min-width:75px !important; max-width:75px !important; flex-shrink:0; text-align:center;" oninput="let v=parseInt(this.value)||0; if(v<1)this.value=100; if(v>1000)this.value=1000; if(typeof compileRecipe==='function')compileRecipe();">
                </div>
            </div>
            
            <div style="display:flex; align-items:center; gap:12px; width:100%;">
                <div style="width:130px; flex-shrink:0;"></div>
                <label style="margin:0; font-size:10px; color:var(--text-muted); display:inline-flex; align-items:center; gap:4px; cursor:pointer; user-select:none;">
                    <input type="checkbox" class="step-fluid-fabric-multiplier" onchange="if(typeof compileRecipe==='function')compileRecipe();" style="margin:0; width:auto;"> 💧 Convert to Fabric Droplets? (x81 Scale)
                </label>
            </div>
        </div>
    `;

    container.appendChild(stepDiv);
    handleStepTypeFieldsUpdate(stepId);
    if (typeof compileRecipe === 'function') compileRecipe();
}

function handleStepTypeFieldsUpdate(stepBlockId) {
    const block = document.getElementById(stepBlockId);
    if (!block) return;

    const selectEl = block.querySelector('.step-type');
    const itemRow = block.querySelector('.step-item-field-row');
    const fluidRow = block.querySelector('.step-fluid-field-row');
    
    if (!selectEl || !itemRow || !fluidRow) return;

    const chosenType = selectEl.value;

  
    if (chosenType === 'deploying') {
        itemRow.classList.remove('hidden');
        fluidRow.classList.add('hidden');
    } else if (chosenType === 'filling') {
        itemRow.classList.add('hidden');
        fluidRow.classList.remove('hidden');
    } else {
        itemRow.classList.add('hidden');
        fluidRow.classList.add('hidden');
    }
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

function removeBlock(blockId) {
    const element = document.getElementById(blockId);
    if (element) {
        element.remove();
    }
    checkIngredientCap();
    checkOutputCap();
    if (typeof updateCraftingKeysLegend === 'function') updateCraftingKeysLegend();
    if (typeof compileRecipe === 'function') compileRecipe();
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



function toggleFluidOutputLabelContext(checkbox, blockId) {
    const block = document.getElementById(blockId);
    if (!block) return;
    
    const countLabel = block.querySelector('.out-count-label') || block.querySelector('label');
    const countInput = block.querySelector('.out-count');
    
    if (countLabel && countInput) {
        const rawEngine = currentActiveEngine || 'mixing';
        const targetEngine = rawEngine.replace('create:', '');
        const allowsFluidOutput = (targetEngine === 'mixing' || targetEngine === 'compacting');
        
        if (checkbox.checked && allowsFluidOutput) {
            countLabel.textContent = "Volume (mB)";
            countInput.setAttribute('step', '100');
        
            countInput.value = 1000; 
        } else {
            countLabel.textContent = "Amount";
            countInput.setAttribute('step', '1');
            checkbox.checked = false;
          
            countInput.value = 1; 
        }
    }

    if (typeof saveActiveRecipeState === 'function') {
        saveActiveRecipeState();
    }
    if (typeof compileRecipe === 'function') {
        compileRecipe();
    }
}

function checkIngredientCap() {
    const container = document.getElementById('ingredientsContainer');
    const addBtn = document.getElementById('addIngredientBtn');
    if (container && addBtn) {
        addBtn.style.display = container.children.length >= 9 ? 'none' : 'inline-block';
    }
}

function checkOutputCap() {
    const container = document.getElementById('outputsContainer');
    const addBtn = document.getElementById('addOutputBtn');
    if (container && addBtn) {
        addBtn.style.display = container.children.length >= 9 ? 'none' : 'inline-block';
    }
}


