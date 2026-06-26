/**
 * compiler-engines/standard/standard-data.js
 *
 * Persistence layer for Create's single-input kinetic recipes: pressing,
 * cutting, milling, sandpaper_polishing, splashing, smoking, blasting,
 * haunting, deploying, crushing. One module backs all of them (same as
 * basin backs mixing/compacting) — every function takes an explicit
 * engineKey.
 *
 * Two output shapes:
 *  - SINGLE_OUTPUT engines: one output field, no chance support
 *  - CHANCE_OUTPUT engines: repeatable output blocks with a chance %
 */

const STANDARD_SINGLE_OUTPUT_ENGINES = ['create:pressing', 'create:smoking', 'create:blasting', 'create:haunting', 'create:deploying', 'create:sandpaper_polishing', 'create:item_application'];

const STANDARD_CHANCE_OUTPUT_ENGINES = ['create:crushing', 'create:cutting', 'create:splashing', 'create:milling'];

const StandardRecipeData = {
    singleOutputEngines: STANDARD_SINGLE_OUTPUT_ENGINES,
    chanceOutputEngines: STANDARD_CHANCE_OUTPUT_ENGINES,

    createEmptyData() {
        return {
            inputItem: '',
            inputIsTag: false,
            inputItem2: '',
            outputItem: '', // single-output engines
            outputIsTag: false,
            outputCount: 1,
            outputs: [] // chance-output engines: [{ id, isTag, count, chance }]
        };
    },

    usesChanceOutputs(engineKey) {
        return STANDARD_CHANCE_OUTPUT_ENGINES.includes(engineKey);
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
        if (engineKey === 'create:item_application') {
            const inputEl2 = document.getElementById('inputItem2');
            const rawInput2 = inputEl2 ? inputEl2.value.trim() : '';
            data.inputIsTag2 = rawInput2.startsWith('#');
            data.inputItem2 = rawInput2.replace(/^#/, '');
        }
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
                    chance: chanceInput ? chanceInput.value : '100'
                });
            }
        } else {
            const outEl = document.getElementById('singleOutputProductId');
            const rawOut = outEl ? outEl.value.trim() : '';
            data.outputIsTag = rawOut.startsWith('#');
            data.outputItem = rawOut.replace(/^#/, '');
            const outCountEl = document.getElementById('singleOutputProductCount');
            data.outputCount = outCountEl ? parseInt(outCountEl.value, 10) || 1 : 1;
        }

        recipe.enginesData[engineKey] = data;
    },

    // ── data -> DOM ──────────────────────────────────────────────────────
    restore(recipe, engineKey) {
        const data = recipe?.enginesData?.[engineKey] || this.createEmptyData();
        window._restoringEngineState = true;

        const inputEl = document.getElementById('inputItem');
        if (inputEl) inputEl.value = (data.inputIsTag ? '#' : '') + (data.inputItem || '');
        if (engineKey === 'create:item_application') {
            const inputEl2 = document.getElementById('inputItem2');
            if (inputEl2) inputEl2.value = (data.inputIsTag2 ? '#' : '') + (data.inputItem2 || '');
        }
        if (this.usesChanceOutputs(engineKey)) {
            const outContainer = document.getElementById('outputsContainerSimple');
            if (outContainer) outContainer.innerHTML = '';
            (data.outputs || []).forEach((out) => {
                if (typeof addStandardOutputBlock !== 'function') return;
                window._seedingOutputBlock = true;
                addStandardOutputBlock();
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
        const ingredientNode2 = Array.isArray(recipeData.ingredients) ? recipeData.ingredients[1] : null;
        if (ingredientNode2) {
            data.inputIsTag2 = !!ingredientNode2.tag;
            data.inputItem2 = ingredientNode2.item || ingredientNode2.tag || '';
        }
        if (this.usesChanceOutputs(engineKey)) {
            data.outputs = (recipeData.results || []).map((node) => ({
                id: node.item || node.tag || '',
                isTag: !!node.tag,
                count: node.count !== undefined ? String(node.count) : '1',
                chance: node.chance !== undefined ? String(Math.round(node.chance * 100)) : '100'
            }));
        } else {
            const resultNode = Array.isArray(recipeData.results) ? recipeData.results[0] : null;
            if (resultNode) {
                data.outputIsTag = !!resultNode.tag;
                data.outputItem = resultNode.item || resultNode.tag || '';
                data.outputCount = resultNode.count || 1;
            }
        }
        return data;
    }
};

window.StandardRecipeData = StandardRecipeData;
