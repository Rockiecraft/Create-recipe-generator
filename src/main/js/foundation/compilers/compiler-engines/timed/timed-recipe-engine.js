/**
 * compiler-engines/timed/timed-recipe-engine.js
 */
const TIMED_NO_AMOUNT_ENGINES = ['create:crushing'];

function addTimedOutputBlock(defaultValue = '') {
  window._userClearedOutputs = false;
  const container = document.getElementById('outputsContainerSimple');
  if (!container) return;
  container.classList.remove('hidden');
  container.style.display = '';
  if (container.children.length >= 9) return;

  const outDiv = document.createElement('div');
  outDiv.id = `timedOut_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  outDiv.className = 'grid-cell-stacked-box';
  outDiv.style.position = 'relative';

  const valueAttr = defaultValue ? `value="${defaultValue}"` : '';
  const showAmount = !TIMED_NO_AMOUNT_ENGINES.includes(window.currentActiveEngine);

  const amountHtml = showAmount ? `
      <div style="flex:1;">
        <label style="margin-top:0;">Amount</label>
        <input type="number" class="out-count" value="1" min="1" max="64" style="padding:4px; font-size:11px;"
          oninput="let p=parseInt(this.value)||1; if(p>64)p=64; if(p<1)p=1; this.value=p; if(typeof compileRecipe==='function')compileRecipe();" />
      </div>` : '';

  outDiv.innerHTML = /* HTML */ `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:11px; font-weight:bold; color:var(--text-muted);">Product Registry Result</span>
      <span style="color:var(--danger); cursor:pointer; font-size:11px; font-weight:bold;"
        onclick="removeBlock('${outDiv.id}'); checkOutputCap();
          const sc=document.getElementById('outputsContainerSimple');
          if(!sc||sc.children.length===0) window._userClearedOutputs = true;">Remove</span>
    </div>
    <input type="text" class="out-id" ${valueAttr} placeholder="example: minecraft:stone" oninput="if(typeof compileRecipe==='function')compileRecipe();" />

    <div style="display:flex; gap:10px; align-items:center; margin-top:4px;">
      <label style="margin-top:0; font-size:10px; display:inline-flex; align-items:center; cursor:pointer; gap:4px;">
        <input type="checkbox" class="out-is-tag" onchange="if(typeof compileRecipe==='function')compileRecipe();" />
        🏷️ Is Tag?
      </label>
    </div>

    <div style="display:flex; gap:10px; margin-top:6px;">${amountHtml}
      <div class="chance-container" style="flex:1;">
        <label style="margin-top:0;">Chance (%)</label>
        <input type="number" class="out-chance" value="100" min="0" max="100" style="padding:4px; font-size:11px;"
          oninput="let p=parseFloat(this.value); if(isNaN(p))p=100; if(p>100)p=100; if(p<0)p=0; this.value=p; if(typeof compileRecipe==='function')compileRecipe();" />
      </div>
    </div>
  `;

  container.appendChild(outDiv);
  if (typeof checkOutputCap === 'function') checkOutputCap();
  if (!window._seedingOutputBlock && !window._restoringEngineState && typeof compileRecipe === 'function') compileRecipe();
}

// ── data -> final recipe JSON ───────────────────────────────────────────
function compileTimedKineticRecipe(recipe, engineKey) {
  const data = recipe?.enginesData?.[engineKey] || TimedRecipeData.createEmptyData();
  const out = JSON.parse(JSON.stringify(RECIPE_TEMPLATES[engineKey] || { type: engineKey, ingredients: [], results: [] }));
  const itemKey = (typeof getItemKey === 'function') ? getItemKey() : 'item';
  out.ingredients = data.inputItem
    ? [data.inputIsTag ? { tag: data.inputItem } : { item: data.inputItem }]
    : [{ item: '' }]; 

  out.processingTime = data.processingTime || 200;

  if (TimedRecipeData.usesChanceOutputs(engineKey)) {
    const includeCount = !TIMED_NO_AMOUNT_ENGINES.includes(engineKey);
    out.results = (data.outputs || []).map((o) => {
      const result = o.isTag ? { tag: o.id } : { [itemKey]: o.id };
      if (includeCount) {
        result.count = parseInt(o.count, 10) || 1;
      }
      const chancePct = parseFloat(o.chance);
      if (!isNaN(chancePct) && chancePct < 100) {
        result.chance = parseFloat((chancePct / 100).toFixed(2));
      }
      return result;
    });
  } else {
    out.results = data.outputItem
      ? [(() => {
          const count = data.outputCount || 1;
          const base = data.outputIsTag ? { tag: data.outputItem } : { [itemKey]: data.outputItem };
          if (count !== 1) base.count = count;
          return base;
        })()]
      : [];
  }

  return out;
}

window.addTimedOutputBlock = addTimedOutputBlock;
window.compileTimedKineticRecipe = compileTimedKineticRecipe;