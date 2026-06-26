/**
 * compiler-engines/filling/filling-recipe-engine.js
 *
 * JSON compiler for create:filling. Reads from recipe.enginesData
 * (call FillingRecipeData.save() first) instead of touching the DOM.
 */

function compileSpoutRecipe(recipe) {
  const data = recipe?.enginesData?.[FILLING_ENGINE_KEY] || FillingRecipeData.createEmptyData();
  const isFabric = document.getElementById('autoConvertFabricFluids')?.checked ?? false;

  const out = {
    type: 'create:filling',
    ingredients: [],
    results: [],
  };

  out.ingredients.push(
    data.baseItem
      ? (data.baseItem.startsWith('#') ? { tag: data.baseItem.replace('#', '') } : { item: data.baseItem })
      : { item: '' }
  );

  let fluidAmount = data.fluidAmount || 1000;
  if (isFabric) fluidAmount *= 81;

  const fluidName = data.fluidName || '';
  const fluidIsTag = fluidName.startsWith('#');
  const cleanFluidName = fluidIsTag ? fluidName.replace('#', '') : fluidName;

  const fluidObject = { amount: fluidAmount };
  if (fluidIsTag) {
    fluidObject.fluidTag = cleanFluidName;
  } else {
    fluidObject.fluid = cleanFluidName;
  }
  if (data.fluidNbt && data.fluidNbt.trim()) {
    fluidObject.nbt = data.fluidNbt.trim();
  }

  out.ingredients.push(fluidObject);

  if (data.outputItem) {
    out.results.push({ item: data.outputItem });
  }

  return out;
}

window.compileSpoutRecipe = compileSpoutRecipe;