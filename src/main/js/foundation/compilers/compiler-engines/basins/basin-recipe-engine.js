/**
 * compiler-engines/basin/basin-recipe-engine.js
 *
 * DOM block builders + JSON compiler for mixing & compacting, fully
 * self-contained — nothing here is named generically, so no other
 * engine file can accidentally depend on (or silently break without) it.
 */

window.toggleBasinFluidIngredientVisibility = function (checkbox, blockId) {
  const block = document.getElementById(blockId);
  if (!block) return;
  const volumeContainer = block.querySelector('.ing-volume-container');
  if (volumeContainer) volumeContainer.classList.toggle('hidden', !checkbox.checked);
  if (typeof compileRecipe === 'function') compileRecipe();
};

window.toggleBasinFluidOutputVisibility = function (checkbox, blockId) {
  const block = document.getElementById(blockId);
  if (!block) return;
  const chanceContainer = block.querySelector('.chance-container');
  const countLabel = block.querySelector('.out-count-label');
  if (chanceContainer) chanceContainer.classList.toggle('hidden', checkbox.checked);
  if (countLabel) countLabel.textContent = checkbox.checked ? 'mB' : 'Amount';
  if (typeof compileRecipe === 'function') compileRecipe();
};

function addBasinIngredientBlock(defaultValue = '', engineKeyHint = null) {
  const container = document.getElementById('ingredientsContainer');
  if (!container) return;
  if (container.children.length >= 9) return;

  const ingDiv = document.createElement('div');
  ingDiv.id = `basinIng_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  ingDiv.className = 'grid-cell-stacked-box';
  ingDiv.style.position = 'relative';

  const targetEngine = (engineKeyHint || currentActiveEngine || 'mixing').replace('create:', '');
  const isFluidEngine = targetEngine === 'mixing' || targetEngine === 'compacting';
  const fluidVisibility = isFluidEngine ? '' : 'hidden';
  const valueAttr = defaultValue ? `value="${defaultValue}"` : '';

  ingDiv.innerHTML = /* HTML */ `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:11px; font-weight:bold; color:var(--text-muted);">Slot ${container.children.length + 1} ID</span>
      <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;" onclick="removeBlock('${ingDiv.id}'); checkIngredientCap();">Remove</span>
    </div>
    <input type="text" class="ing-id" ${valueAttr} placeholder="example: minecraft:stone" oninput="if(typeof updateCraftingKeysLegend==='function')updateCraftingKeysLegend(); if(typeof compileRecipe==='function')compileRecipe();" />

    <div class="fluid-toggle-row ${fluidVisibility}" style="display:flex; gap:10px; align-items:center; margin-top:6px;">
      <label style="margin-top:0; font-size:10px; display:inline-flex; align-items:center; cursor:pointer;">
        <input type="checkbox" class="ing-is-fluid" onchange="toggleBasinFluidIngredientVisibility(this, '${ingDiv.id}');" />
        💧 Is Fluid?
      </label>
      <div class="ing-volume-container hidden" style="flex:1; display:flex; align-items:center; gap:6px;">
        <span style="font-size:10px; font-weight:bold; color:var(--accent);">mB:</span>
        <input type="number" class="ing-count" value="1000" step="100" style="padding:6px; font-size:11px; width:40% !important;"
          oninput="let p=parseInt(this.value)||0; if(p<1)p=1; if(p>1000)p=1000; this.value=p; if(typeof compileRecipe==='function')compileRecipe();" />
      </div>
    </div>

    <div style="display:flex; gap:10px; align-items:center; margin-top:4px;">
      <label style="margin-top:0; font-size:10px; display:inline-flex; align-items:center; cursor:pointer; gap:4px;">
        <input type="checkbox" class="ing-is-tag" onchange="if(typeof compileRecipe==='function')compileRecipe();" />
        🏷️ Is Tag?
      </label>
    </div>
  `;

  container.appendChild(ingDiv);
  if (typeof checkIngredientCap === 'function') checkIngredientCap();
  if (!window._restoringEngineState && typeof compileRecipe === 'function') compileRecipe();
}

function addBasinOutputBlock(defaultValue = '', engineKeyHint = null) {
  window._userClearedOutputs = false;
  const container = document.getElementById('outputsContainerFluid') || document.getElementById('outputsContainer');
  if (!container) return;
  container.classList.remove('hidden');
  container.style.display = '';
  if (container.children.length >= 9) return;

  const outDiv = document.createElement('div');
  outDiv.id = `basinOut_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  outDiv.className = 'grid-cell-stacked-box';
  outDiv.style.position = 'relative';

  const valueAttr = defaultValue ? `value="${defaultValue}"` : '';
  const targetEngine = (engineKeyHint || currentActiveEngine || 'create:mixing').replace('create:', '');
  const isFluidOutputEngine = targetEngine === 'mixing' || targetEngine === 'compacting';

  outDiv.innerHTML = /* HTML */ `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:11px; font-weight:bold; color:var(--text-muted);">Product Registry Result</span>
      <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;"
        onclick="removeBlock('${outDiv.id}'); checkOutputCap();
          const fc=document.getElementById('outputsContainerFluid'), sc=document.getElementById('outputsContainerSimple');
          if((!fc||fc.children.length===0)&&(!sc||sc.children.length===0)) window._userClearedOutputs = true;">Remove</span>
    </div>
    <input type="text" class="out-id" ${valueAttr} placeholder="example: minecraft:stone" oninput="if(typeof compileRecipe==='function')compileRecipe();" />

    <div class="fluid-output-toggle-row ${isFluidOutputEngine ? '' : 'hidden'}" style="display:flex; gap:10px; align-items:center; margin-top:6px;">
      <label style="margin-top:0; font-size:10px; display:inline-flex; align-items:center; cursor:pointer;">
        <input type="checkbox" class="out-is-fluid" onchange="toggleBasinFluidOutputVisibility(this, '${outDiv.id}');" />
        💧 Is Fluid Output Result?
      </label>
    </div>

    <div style="display:flex; gap:10px; margin-top:6px;">
      <div style="flex:1;">
        <label class="out-count-label" style="margin-top:0;">Amount</label>
        <input type="number" class="out-count" value="1" min="0" max="1000" style="padding:4px; font-size:11px;"
          oninput="let p=parseInt(this.value); const isFluid=this.closest('.grid-cell-stacked-box').querySelector('.out-is-fluid')?.checked;
            if(isFluid){if(p>1000)this.value=1000;} else {if(p>64)this.value=64;} if(typeof compileRecipe==='function')compileRecipe();" />
      </div>
    </div>
  `;


  container.appendChild(outDiv);
  if (typeof checkOutputCap === 'function') checkOutputCap();
  if (!window._seedingOutputBlock && !window._restoringEngineState && typeof compileRecipe === 'function') compileRecipe();
}

// ── data -> final recipe JSON ───────────────────────────────────────────
function compileBasinRecipe(recipe, engineKey, isFabric) {
  const data = recipe?.enginesData?.[engineKey] || BasinRecipeData.createEmptyData();

  const versionDropdown = document.getElementById('minecraftVersion');
  const selectedVersion = versionDropdown ? versionDropdown.value : '1.20.1';
  const itemKeyType = selectedVersion === '1.21.1' ? 'id' : 'item';
  const fluidKeyType = selectedVersion === '1.21.1' ? 'id' : 'fluid';

  const ingredients = (data.ingredients || []).map((ing) => {
    if (ing.isFluid) {
      let amount = parseInt(ing.amount, 10) || 1000;
      if (isFabric) amount *= 81;
      return ing.isTag ? { fluidTag: ing.id, amount } : { [fluidKeyType]: ing.id, amount };
    }
    return ing.isTag ? { tag: ing.id } : { [itemKeyType]: ing.id };
  });

  const results = (data.outputs || []).map((out) => {
    if (out.isFluid) {
      let amount = parseInt(out.count, 10) || 1000;
      if (isFabric) amount *= 81;
      return out.isTag ? { fluidTag: out.id, amount } : { [fluidKeyType]: out.id, amount };
    }
    const count = parseInt(out.count, 10) || 1;
    return out.isTag ? { tag: out.id, count } : { [itemKeyType]: out.id, count };
  });

  const recipeOut = { type: engineKey };
  if (data.heatRequirement && data.heatRequirement !== 'none') {
    recipeOut.heatRequirement = data.heatRequirement.toLowerCase();
  }
  recipeOut.ingredients = ingredients;
  recipeOut.results = results;
  return recipeOut;
}