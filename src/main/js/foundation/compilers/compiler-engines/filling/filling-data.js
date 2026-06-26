/**
 * compiler-engines/filling/filling-data.js
 *
 * Persistence layer for create:filling. No repeatable blocks here —
 * just a handful of static fields, so save()/restore() are plain copies.
 */

const FILLING_ENGINE_KEY = 'create:filling';

const FillingRecipeData = {
  key: FILLING_ENGINE_KEY,

  createEmptyData() {
    return {
      baseItem: '',
      fluidName: '',
      fluidAmount: 1000,
      fluidNbt: '',     // raw SNBT text, stored as-is — see filling-recipe-engine.js
      outputItem: '',
    };
  },

  // ── DOM -> data ──────────────────────────────────────────────────────
  save(recipe) {
    if (!recipe) return;
    if (!recipe.enginesData) recipe.enginesData = {};
    const data = recipe.enginesData[FILLING_ENGINE_KEY] || this.createEmptyData();

    data.baseItem = document.getElementById('inputItemFilling')?.value.trim() || '';
    data.fluidName = document.getElementById('fluidInputName')?.value.trim() || '';
    const amountVal = parseInt(document.getElementById('fluidInputAmount')?.value, 10);
    data.fluidAmount = isNaN(amountVal) ? 1000 : amountVal;
    data.fluidNbt = document.getElementById('fluidInputNbt')?.value.trim() || '';
    data.outputItem = document.getElementById('singleOutputProductId')?.value.trim() || '';

    recipe.enginesData[FILLING_ENGINE_KEY] = data;
  },

  // ── data -> DOM ──────────────────────────────────────────────────────
  restore(recipe) {
    const data = recipe?.enginesData?.[FILLING_ENGINE_KEY] || this.createEmptyData();

    const baseItemEl = document.getElementById('inputItemFilling');
    if (baseItemEl) baseItemEl.value = data.baseItem || '';

    const fluidNameEl = document.getElementById('fluidInputName');
    if (fluidNameEl) fluidNameEl.value = data.fluidName || '';

    const fluidAmountEl = document.getElementById('fluidInputAmount');
    if (fluidAmountEl) fluidAmountEl.value = data.fluidAmount || 1000;

    const fluidNbtEl = document.getElementById('fluidInputNbt');
    if (fluidNbtEl) fluidNbtEl.value = data.fluidNbt || '';

    const outputEl = document.getElementById('singleOutputProductId');
    if (outputEl) outputEl.value = data.outputItem || '';
  },
  
fromJson(recipeData, isFabric) {
  const data = this.createEmptyData();
  const ingredients = recipeData.ingredients || [];
  const baseNode = ingredients.find((n) => n.item || n.tag) || {};
  const fluidNode = ingredients.find((n) => n.fluid || n.fluidTag) || {};
  data.baseItem = baseNode.item || baseNode.tag || '';
  data.fluidName = fluidNode.fluid || fluidNode.fluidTag || '';
  let amount = fluidNode.amount !== undefined ? parseInt(fluidNode.amount, 10) : 1000;
  if (isFabric) amount = Math.round(amount / 81);
  data.fluidAmount = amount;
  data.fluidNbt = typeof fluidNode.nbt === 'string' ? fluidNode.nbt : '';
  const resultNode = Array.isArray(recipeData.results) ? recipeData.results[0] : null;
  data.outputItem = resultNode ? (resultNode.item || '') : '';
  return data;
},
};

window.FillingRecipeData = FillingRecipeData;