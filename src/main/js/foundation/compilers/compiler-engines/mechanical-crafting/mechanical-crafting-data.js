/**
 * compiler-engines/mechanicalcrafting/mechanicalcrafting-data.js
 *
 * Persistence layer for create:mechanical_crafting.
 */

const MECHANICAL_CRAFTING_ENGINE_KEY = 'create:mechanical_crafting';

const MechanicalCraftingData = {
  key: MECHANICAL_CRAFTING_ENGINE_KEY,

  createEmptyData() {
    return {
      width: 3,
      height: 3,
      acceptMirrored: false,
      gridMatrix: {},       // { "row,col": "A" }
      keyDefinitions: {},   // { "A": { type: "item"|"tag", value: "minecraft:..." } }
      outputItem: '',
      outputIsTag: false,
      outputCount: 1,
    };
  },

  // ── DOM -> data ──────────────────────────────────────────────────────
  save(recipe) {
    if (!recipe) return;
    if (!recipe.enginesData) recipe.enginesData = {};
    const data = recipe.enginesData[MECHANICAL_CRAFTING_ENGINE_KEY] || this.createEmptyData();

    data.width = parseInt(document.getElementById('craftingWidth')?.value, 10) || 3;
    data.height = parseInt(document.getElementById('craftingHeight')?.value, 10) || 3;
    data.acceptMirrored = document.getElementById('acceptMirrored')?.value === 'true';

    data.gridMatrix = {};
    const discoveredKeys = new Set();
    for (let r = 0; r < data.height; r++) {
      for (let c = 0; c < data.width; c++) {
        const cell = document.querySelector(`.craft-cell[data-row="${r}"][data-col="${c}"]`);
        const char = cell && cell.value && cell.value !== ' ' ? cell.value.toUpperCase().trim() : '';
        if (char) {
          data.gridMatrix[`${r},${c}`] = char;
          discoveredKeys.add(char);
        }
      }
    }

    data.keyDefinitions = {};
    discoveredKeys.forEach((key) => {
      const typeEl = document.querySelector(`.craft-key-type[data-key="${key}"]`);
      const valueEl = document.querySelector(`.craft-key-resource[data-key="${key}"]`);
      data.keyDefinitions[key] = {
        type: typeEl ? typeEl.value : 'item',
        value: valueEl ? valueEl.value.trim() : '',
      };
    });

    const outEl = document.getElementById('singleOutputProductId');
    const rawOut = outEl ? outEl.value.trim() : '';
    data.outputIsTag = rawOut.startsWith('#');
    data.outputItem = rawOut.replace(/^#/, '');

    const outCountEl = document.getElementById('singleOutputProductCount');
    data.outputCount = outCountEl ? (parseInt(outCountEl.value, 10) || 1) : 1;

    recipe.enginesData[MECHANICAL_CRAFTING_ENGINE_KEY] = data;
  },

  // ── data -> DOM ──────────────────────────────────────────────────────
  restore(recipe) {
    const data = recipe?.enginesData?.[MECHANICAL_CRAFTING_ENGINE_KEY] || this.createEmptyData();
    window._restoringEngineState = true;

    const widthEl = document.getElementById('craftingWidth');
    if (widthEl) widthEl.value = data.width || 3;
    const heightEl = document.getElementById('craftingHeight');
    if (heightEl) heightEl.value = data.height || 3;
    const mirrorEl = document.getElementById('acceptMirrored');
    if (mirrorEl) mirrorEl.value = data.acceptMirrored ? 'true' : 'false';

    if (typeof generateCraftingGrid === 'function') generateCraftingGrid(data.gridMatrix);

    Object.entries(data.keyDefinitions || {}).forEach(([key, def]) => {
      const typeEl = document.querySelector(`.craft-key-type[data-key="${key}"]`);
      const valueEl = document.querySelector(`.craft-key-resource[data-key="${key}"]`);
      if (typeEl) typeEl.value = def.type || 'item';
      if (valueEl) valueEl.value = def.value || '';
    });

    const outEl = document.getElementById('singleOutputProductId');
    if (outEl) outEl.value = (data.outputIsTag ? '#' : '') + (data.outputItem || '');
    const outCountEl = document.getElementById('singleOutputProductCount');
    if (outCountEl) outCountEl.value = data.outputCount || 1;

    window._restoringEngineState = false;
  },

  // mechanicalcrafting-data.js — add to MechanicalCraftingData
fromJson(recipeData) {
  const data = this.createEmptyData();
  const pattern = recipeData.pattern || [];
  data.height = pattern.length || 3;
  data.width = pattern[0] ? pattern[0].length : 3;
  data.acceptMirrored = !!recipeData.acceptMirrored;

  data.gridMatrix = {};
  pattern.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch && ch !== ' ') data.gridMatrix[`${r},${c}`] = ch.toUpperCase();
    }
  });

  data.keyDefinitions = {};
  Object.entries(recipeData.key || {}).forEach(([symbol, node]) => {
    data.keyDefinitions[symbol.toUpperCase()] = { type: node.tag ? 'tag' : 'item', value: node.item || node.tag || '' };
  });

  if (recipeData.result) {
    data.outputItem = recipeData.result.item || recipeData.result.tag || '';
    data.outputIsTag = !!recipeData.result.tag;
    data.outputCount = recipeData.result.count || 1;
  }
  return data;
},
};

window.MechanicalCraftingData = MechanicalCraftingData;