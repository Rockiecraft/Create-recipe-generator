/**
 * compiler-engines/basin/basin-data.js
 *
 * Persistence layer for the Basin engines: mixing & compacting.
 */

const BASIN_ENGINE_KEYS = ['create:mixing', 'create:compacting'];

const BasinRecipeData = {
    keys: BASIN_ENGINE_KEYS,

    createEmptyData() {
        return {
            ingredients: [], // [{ id, isTag, isFluid, amount }]
            outputs: [], // [{ id, isTag, isFluid, count }]
            heatRequirement: 'none',
        };
    },

    // ── DOM -> data ──────────────────────────────────────────────────────
    save(recipe, engineKey) {
        if (!recipe || !engineKey) return;
        if (!recipe.enginesData) recipe.enginesData = {};
        const data = recipe.enginesData[engineKey] || this.createEmptyData();

        data.ingredients = [];
        const ingBlocks = document.getElementById('ingredientsContainer')?.children || [];
        for (const block of ingBlocks) {
            const idInput = block.querySelector('.ing-id') || block.querySelector('input[type="text"]');
            if (!idInput || !idInput.value.trim()) continue;
            const raw = idInput.value.trim();
            const isTag = block.querySelector('.ing-is-tag')?.checked || raw.startsWith('#');
            const isFluid = !!(block.querySelector('.ing-is-fluid') || block.querySelector('input[type="checkbox"]'))?.checked;
            const countInput = block.querySelector('.ing-count');
            data.ingredients.push({
                id: raw.replace(/^#/, ''),
                isTag,
                isFluid,
                amount: countInput ? countInput.value : '1000',
            });
        }

        data.outputs = [];
        const outBlocks = document.getElementById('outputsContainerFluid')?.children || [];
        for (const block of outBlocks) {
            const idInput = block.querySelector('.out-id') || block.querySelector('input[type="text"]');
            if (!idInput || !idInput.value.trim()) continue;
            const raw = idInput.value.trim();
            const isTag = block.querySelector('.out-is-tag')?.checked || raw.startsWith('#');
            const isFluid = !!block.querySelector('.out-is-fluid')?.checked;
            const countInput = block.querySelector('.out-count');
            data.outputs.push({
                id: raw.replace(/^#/, ''),
                isTag,
                isFluid,
                count: countInput ? countInput.value : '1',
            });
        }

        const heatEl = document.getElementById('basinHeatRequirement') || document.getElementById('heatRequirement');
        data.heatRequirement = heatEl ? heatEl.value : 'none';

        recipe.enginesData[engineKey] = data;
    },

    // ── data -> DOM ──────────────────────────────────────────────────────
    restore(recipe, engineKey) {
        const data = recipe?.enginesData?.[engineKey] || this.createEmptyData();
        window._restoringEngineState = true;

        const ingContainer = document.getElementById('ingredientsContainer');
        if (ingContainer) ingContainer.innerHTML = '';
        (data.ingredients || []).forEach((ing) => {
            if (typeof addBasinIngredientBlock !== 'function') return;
            addBasinIngredientBlock('', engineKey);
            const block = ingContainer?.lastElementChild;
            if (!block) return;
            const idInput = block.querySelector('.ing-id');
            const tagCheck = block.querySelector('.ing-is-tag');
            const fluidCheck = block.querySelector('.ing-is-fluid');
            const countInput = block.querySelector('.ing-count');
            if (idInput) idInput.value = ing.id || '';
            if (tagCheck) tagCheck.checked = !!ing.isTag;
            if (fluidCheck) {
                fluidCheck.checked = !!ing.isFluid;
                if (typeof toggleBasinFluidIngredientVisibility === 'function') toggleBasinFluidIngredientVisibility(fluidCheck, block.id);
            }
            if (countInput) countInput.value = ing.amount || '1000';
        });

        const outContainer = document.getElementById('outputsContainerFluid');
        if (outContainer) outContainer.innerHTML = '';
        (data.outputs || []).forEach((out) => {
            if (typeof addBasinOutputBlock !== 'function') return;
            window._seedingOutputBlock = true;
            addBasinOutputBlock('', engineKey);
            window._seedingOutputBlock = false;
            const block = outContainer?.lastElementChild;
            if (!block) return;
            const idInput = block.querySelector('.out-id');
            const tagCheck = block.querySelector('.out-is-tag');
            const fluidCheck = block.querySelector('.out-is-fluid');
            const countInput = block.querySelector('.out-count');
            if (idInput) idInput.value = out.id || '';
            if (tagCheck) tagCheck.checked = !!out.isTag;
            if (fluidCheck) {
                fluidCheck.checked = !!out.isFluid;
                if (typeof toggleBasinFluidOutputVisibility === 'function') toggleBasinFluidOutputVisibility(fluidCheck, block.id);
            }
            if (countInput) countInput.value = out.count || '1';
        });

        const heatEl = document.getElementById('basinHeatRequirement') || document.getElementById('heatRequirement');
        if (heatEl) heatEl.value = data.heatRequirement || 'none';

        window._restoringEngineState = false;
    },
   
fromJson(recipeData, engineKey, isFabric) {
  const data = this.createEmptyData();
  data.heatRequirement = recipeData.heatRequirement || 'none';
  data.ingredients = (recipeData.ingredients || []).map((node) => {
    const isFluid = !!(node.fluid || node.fluidTag);
    let amount = node.amount !== undefined ? parseInt(node.amount, 10) : 1000;
    if (isFluid && isFabric) amount = Math.round(amount / 81);
    return { id: node.item || node.tag || node.fluid || node.fluidTag || '', isTag: !!(node.tag || node.fluidTag), isFluid, amount: String(amount) };
  });
  data.outputs = (recipeData.results || []).map((node) => {
    const isFluid = !!(node.fluid || node.fluidTag);
    let amount = node.amount !== undefined ? parseInt(node.amount, 10) : (node.count !== undefined ? node.count : 1);
    if (isFluid && isFabric) amount = Math.round(amount / 81);
    return { id: node.item || node.tag || node.fluid || node.fluidTag || '', isTag: !!(node.tag || node.fluidTag), isFluid, count: String(amount) };
  });
  return data;
},
};

window.BasinRecipeData = BasinRecipeData;
