function addSimpleOutputBlock(defaultValue = '') {
    window._userClearedOutputs = false;
    const container = document.getElementById('outputsContainerSimple') || document.getElementById('outputsContainer');
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
            <span
                style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;"
                onclick="removeBlock('${outDiv.id}'); checkOutputCap(); const fc = document.getElementById('outputsContainerFluid'); const sc = document.getElementById('outputsContainerSimple'); if((!fc||fc.children.length===0)&&(!sc||sc.children.length===0)) window._userClearedOutputs = true;">
                Remove
            </span>
        </div>
        <input type="text" class="out-id" placeholder="example: minecraft:stone" oninput="if(typeof compileRecipe==='function')compileRecipe();" />
        <div style="display:flex; gap:10px; margin-top:6px;">
            <div style="flex:1;">
                <label class="out-count-label" style="margin-top:0;">Amount</label>
                <input
                    type="number"
                    class="out-count"
                    value="1"
                    min="1"
                    max="64"
                    step="1"
                    style="padding:4px; font-size:11px;"
                    oninput="compileRecipe();"
                    onchange="let v = parseInt(this.value); if(isNaN(v)||v<1) v=1; if(v>64) v=64; this.value=v; compileRecipe();" />
            </div>

            <div class="chance-container" style="flex:1;">
                <label style="margin-top:0;">Chance (%)</label>
                <input type="number" class="out-chance" placeholder="100" value="100" min="0" max="100" step="5" oninput="compileRecipe()" />
            </div>
        </div>
        <div style="display:flex; gap:10px; align-items:center; margin-top:4px;">
            <label style="margin-top:0; font-size:10px; display:inline-flex; align-items:center; cursor:pointer; gap:4px;">
                <input type="checkbox" class="out-is-tag" onchange="if(typeof compileRecipe==='function')compileRecipe();" />
                🏷️ Is Tag?
            </label>
        </div>
    `;

    container.appendChild(outDiv);
    checkOutputCap();
    if (!window._seedingOutputBlock && typeof compileRecipe === 'function') compileRecipe();
}

function changePlatformConstraints(mode) {
    
    const wrapper = document.getElementById('recipeWrapper') || document.getElementById('recipeNamespace') || document.getElementById('recipeWrapperNamespace') || document.getElementById('wrapperNamespace');

    if (wrapper) {
        if (mode === 'forge_only') wrapper.value = 'forge:conditional';
        if (mode === 'fabric_only') wrapper.value = 'fabric:conditional';
        if (mode === 'universal') wrapper.value = 'universal';
    }

    if (typeof compileRecipe === 'function') {
        compileRecipe();
    }
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

function toggleFluidOutputLabelContext(checkbox, blockId) {
    const block = document.getElementById(blockId);
    if (!block) return;

    const countLabel = block.querySelector('.out-count-label') || block.querySelector('label');
    const countInput = block.querySelector('.out-count');

    if (countLabel && countInput) {
        const rawEngine = currentActiveEngine || 'mixing';
        const targetEngine = rawEngine.replace('create:', '');
        const allowsFluidOutput = targetEngine === 'mixing' || targetEngine === 'compacting';

        if (checkbox.checked && allowsFluidOutput) {
            countLabel.textContent = 'Volume (mB)';
            countInput.setAttribute('step', '100');
            console.trace('resetting to 1000');
            if (!window._hydratingFluid) {
                countInput.value = 1000;
            }
        } else {
            countLabel.textContent = 'Amount';
            countInput.setAttribute('step', '1');
            checkbox.checked = false;
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
    const fluidContainer = document.getElementById('outputsContainerFluid');
    const simpleContainer = document.getElementById('outputsContainerSimple');
    const btnFluid = document.getElementById('addOutputBtnFluid');
    const btnSimple = document.getElementById('addOutputBtnSimple');

    if (fluidContainer && btnFluid) {
        btnFluid.style.display = fluidContainer.children.length >= 9 ? 'none' : '';
    }
    if (simpleContainer && btnSimple) {
        btnSimple.style.display = simpleContainer.children.length >= 9 ? 'none' : '';
    }
}
