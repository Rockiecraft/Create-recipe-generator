/**
 * compiler-engines/timed/timed-data.js
 *
 * Persistence layer for Create's timed kinetic recipes — whichever
 * engines carry a processingTime/duration field. 
 */

const TIMED_SINGLE_OUTPUT_ENGINES = [
];

const TIMED_CHANCE_OUTPUT_ENGINES = [
  'create:crushing', 'create:splashing', 'create:milling'
];

const TimedRecipeData = {
  singleOutputEngines: TIMED_SINGLE_OUTPUT_ENGINES,
  chanceOutputEngines: TIMED_CHANCE_OUTPUT_ENGINES,

  createEmptyData() {
    return {
      inputItem: '',
      inputIsTag: false,
      processingTime: 200,
      outputItem: '',     
      outputIsTag: false,
      outputCount: 1,
      outputs: [],          
    };
  },

  usesChanceOutputs(engineKey) {
    return TIMED_CHANCE_OUTPUT_ENGINES.includes(engineKey);
  },

  // ── DOM -> data ──────────────────────────────────────────────────────
  save(recipe, engineKey) {
    if (!recipe || !engineKey) return;
    if (!recipe.enginesData) recipe.enginesData = {};
    const data = recipe.enginesData[engineKey] || this.createEmptyData();

    const inputEl = document.getElementById('inputItem');
    const rawInput = inputEl ? inputEl.value.trim() : '';
    data.inputIsTag = rawInput.startsWith('#');
    data.inputItem = rawInput.replace(/^#/, '');

    const timeEl = document.getElementById('processingTimeInput');
    const parsedTime = timeEl && timeEl.value.trim() ? parseInt(timeEl.value.trim(), 10) : NaN;
    data.processingTime = !isNaN(parsedTime) && parsedTime > 0 ? parsedTime : 200;

    if (this.usesChanceOutputs(engineKey)) {
      data.outputs = [];
      const outBlocks = document.getElementById('outputsContainerSimple')?.children || [];
      for (const block of outBlocks) {
        const idInput = block.querySelector('.out-id') || block.querySelector('input[type="text"]');
        if (!idInput || !idInput.value.trim()) continue;
        const raw = idInput.value.trim();
        const isTag = block.querySelector('.out-is-tag')?.checked || raw.startsWith('#');
        const countInput = block.querySelector('.out-count');
        const chanceInput = block.querySelector('.out-chance');
        data.outputs.push({
          id: raw.replace(/^#/, ''),
          isTag,
          count: countInput ? countInput.value : '1',
          chance: chanceInput ? chanceInput.value : '100',
        });
      }
    } else {
      const outEl = document.getElementById('singleOutputProductId');
      const rawOut = outEl ? outEl.value.trim() : '';
      data.outputIsTag = rawOut.startsWith('#');
      data.outputItem = rawOut.replace(/^#/, '');
      const outCountEl = document.getElementById('singleOutputProductCount');
      data.outputCount = outCountEl ? (parseInt(outCountEl.value, 10) || 1) : 1;
    }

    recipe.enginesData[engineKey] = data;
  },

  // ── data -> DOM ──────────────────────────────────────────────────────
  restore(recipe, engineKey) {
    const data = recipe?.enginesData?.[engineKey] || this.createEmptyData();
    window._restoringEngineState = true;

    const inputEl = document.getElementById('inputItem');
    if (inputEl) inputEl.value = (data.inputIsTag ? '#' : '') + (data.inputItem || '');

    const timeEl = document.getElementById('processingTimeInput');
    if (timeEl) timeEl.value = data.processingTime || 200;

    if (this.usesChanceOutputs(engineKey)) {
      const outContainer = document.getElementById('outputsContainerSimple');
      if (outContainer) outContainer.innerHTML = '';
      (data.outputs || []).forEach((out) => {
        if (typeof addTimedOutputBlock !== 'function') return;
        window._seedingOutputBlock = true;
        addTimedOutputBlock();
        window._seedingOutputBlock = false;
        const block = outContainer?.lastElementChild;
        if (!block) return;
        const idInput = block.querySelector('.out-id');
        const tagCheck = block.querySelector('.out-is-tag');
        const countInput = block.querySelector('.out-count');
        const chanceInput = block.querySelector('.out-chance');
        if (idInput) idInput.value = out.id || '';
        if (tagCheck) tagCheck.checked = !!out.isTag;
        if (countInput) countInput.value = out.count || '1';
        if (chanceInput) chanceInput.value = out.chance || '100';
      });
    } else {
      const outEl = document.getElementById('singleOutputProductId');
      if (outEl) outEl.value = (data.outputIsTag ? '#' : '') + (data.outputItem || '');
      const outCountEl = document.getElementById('singleOutputProductCount');
      if (outCountEl) outCountEl.value = data.outputCount || 1;
    }

    window._restoringEngineState = false;
  },

  
fromJson(recipeData, engineKey) {
  const data = this.createEmptyData();
  const ingredientNode = Array.isArray(recipeData.ingredients) ? recipeData.ingredients[0] : null;
  if (ingredientNode) {
    data.inputIsTag = !!ingredientNode.tag;
    data.inputItem = ingredientNode.item || ingredientNode.tag || '';
  }
  data.processingTime = recipeData.processingTime || 200;
  data.outputs = (recipeData.results || []).map((node) => ({
    id: node.item || node.tag || '',
    isTag: !!node.tag,
    count: node.count !== undefined ? String(node.count) : '1',
    chance: node.chance !== undefined ? String(Math.round(node.chance * 100)) : '100',
  }));
  return data;
},
};

window.TimedRecipeData = TimedRecipeData;