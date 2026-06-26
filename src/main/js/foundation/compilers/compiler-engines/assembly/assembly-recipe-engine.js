function compileAssemblyRecipe(recipe) {
    const data = recipe?.enginesData?.['create:sequenced_assembly'] || AssemblyRecipeEngine.createEmptyData();
    const out = JSON.parse(JSON.stringify(RECIPE_TEMPLATES['create:sequenced_assembly']));

    const versionEl = document.getElementById('minecraftVersion');
    const itemKey = versionEl?.value === '1.21.1' ? 'id' : 'item';

    // Ingredient (always item:)
    if (data.inputItem) {
        out.ingredient = data.inputItem.startsWith('#')
            ? { tag: data.inputItem.replace('#', '') }
            : { item: data.inputItem };
    }

    // Transitional item (output key)
    if (data.transitionalItem) {
        out.transitionalItem = { [itemKey]: data.transitionalItem };
    }

    // Sequence steps
    out.sequence = (data.assemblySteps || []).map((step) => {
        const stepObj = {
            type: `create:${step.type}`,
            ingredients: [{ item: data.transitionalItem || '' }],
            results: [{ [itemKey]: data.transitionalItem || '' }],
        };
        if (step.type === 'deploying' && step.id) {
            stepObj.ingredients.push(
                step.id.startsWith('#')
                    ? { tag: step.id.replace('#', '') }
                    : { item: step.id }
            );
        } else if (step.type === 'filling' && step.fluidId) {
            stepObj.ingredients.push({
                fluid: step.fluidId,
                amount: step.fabricMultiplier ? step.fluidAmount * 81 : step.fluidAmount,
            });
        }
        return stepObj;
    });

    // Outputs
    let results = (data.outputs || []).map((o) => {
        const r = o.isTag ? { tag: o.id } : { [itemKey]: o.id };
        if (typeof o.chance === 'number' && !isNaN(o.chance)) r.chance = o.chance;
        return r;
    });

    if (results.length === 0) {
        const fallbackEl = document.getElementById('singleOutputProductId');
        if (fallbackEl?.value?.trim()) results.push({ [itemKey]: fallbackEl.value.trim() });
    }

    out.results = results;
    delete out.result;
    out.loops = data.assemblyLoops || 1;
    return out;
}

function addAssemblyStepBlock(defaultValue = 'minecraft:stone') {
    const container = document.getElementById('assemblyStepsContainer');
    if (!container) return;

    const currentCount = container.children.length;
    if (currentCount >= 9) return;

    const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const stepDiv = document.createElement('div');
    stepDiv.id = stepId;
    stepDiv.className = 'grid-cell-stacked-box';
    stepDiv.style.position = 'relative';

    stepDiv.innerHTML = /* HTML */ `
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
            <input type="text" class="ing-id" placeholder="example: minecraft:stone" oninput="if(typeof compileRecipe==='function')compileRecipe();" style="height:26px; font-size:11px; flex:1; min-width:0;" />
        </div>

        <!--  Liquid Filling Dual Input Row -->
        <div class="step-fluid-field-row hidden" style="width:100%; margin-top:6px; display:flex; flex-direction:column; gap:6px; box-sizing:border-box;">
            <div style="display:flex; align-items:center; gap:12px; width:100%;">
                <label style="color:#7d8296; font-size:11px; width:130px; flex-shrink:0; white-space:nowrap;">Operational Fluid ID & mB</label>
                <div style="display:flex; gap:8px; flex:1; min-width:0;">
                    <input type="text" class="step-fluid-id" placeholder="example: minecraft:water" oninput="if(typeof compileRecipe==='function')compileRecipe();" style="height:26px; font-size:11px; flex:1; min-width:0;" placeholder="Fluid Registry ID" />
                    <input type="number" class="step-fluid-amount" value="200" step="100" style="height:26px; font-size:11px; width:75px !important; min-width:75px !important; max-width:75px !important; flex-shrink:0; text-align:center;" oninput="let v=parseInt(this.value)||0; if(v<1)this.value=100; if(v>1000)this.value=1000; if(typeof compileRecipe==='function')compileRecipe();" />
                </div>
            </div>

            <div style="display:flex; align-items:center; gap:12px; width:100%;">
                <div style="width:130px; flex-shrink:0;"></div>
                <label style="margin:0; font-size:10px; color:var(--text-muted); display:inline-flex; align-items:center; gap:4px; cursor:pointer; user-select:none;">
                    <input type="checkbox" class="step-fluid-fabric-multiplier" onchange="if(typeof compileRecipe==='function')compileRecipe();" style="margin:0; width:auto;" />
                    💧 Convert to Fabric Droplets? (x81 Scale)
                </label>
            </div>
        </div>
    `;

    container.appendChild(stepDiv);
    handleStepTypeFieldsUpdate(stepId);
    if (typeof compileRecipe === 'function') compileRecipe();
}

function addSequencedOutputBlock() {
    window._userClearedOutputs = false;
    const container = document.getElementById('outputsContainerSimple');
    if (!container) return;
    container.classList.remove('hidden');
    container.style.display = '';

    const currentCount = container.children.length;
    if (currentCount >= 9) return;

    const outDiv = document.createElement('div');
    outDiv.id = `out_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    outDiv.className = 'grid-cell-stacked-box';
    outDiv.style.position = 'relative';

    outDiv.innerHTML = /* HTML */ `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; font-weight:bold; color:var(--text-muted);">Product Registry Result</span>
            <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;" onclick="removeBlock('${outDiv.id}'); checkOutputCap(); const fc = document.getElementById('outputsContainerFluid'); const sc = document.getElementById('outputsContainerSimple'); if((!fc||fc.children.length===0)&&(!sc||sc.children.length===0)) window._userClearedOutputs = true;">Remove</span>
        </div>
        <input type="text" class="out-id" placeholder="example: minecraft:stone" oninput="if(typeof compileRecipe==='function')compileRecipe();" />
        <div style="display:flex; gap:10px; align-items:center; margin-top:4px;">
            <label style="margin-top:0; font-size:10px; display:inline-flex; align-items:center; cursor:pointer; gap:4px;">
                <input type="checkbox" class="out-is-tag" onchange="if(typeof compileRecipe==='function')compileRecipe();" />
                🏷️ Is Tag?
            </label>
        </div>

        <div class="chance-container" style="flex:1;">
            <label style="margin-top:0;">Weight</label>
            <input type="number" class="out-chance" placeholder="1" value="1" min="0" step="0.01" oninput="compileRecipe()" />
        </div>
    `;

    container.appendChild(outDiv);
    checkOutputCap();
    if (!window._seedingOutputBlock && typeof compileRecipe === 'function') compileRecipe();
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

