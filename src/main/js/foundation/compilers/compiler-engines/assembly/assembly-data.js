/**
 * compiler-engines/assembly-recipe-engine.js
 *
 * Self-contained module for Create's Sequenced Assembly recipe type.
 */

const ASSEMBLY_ENGINE_KEY = 'create:sequenced_assembly';

const AssemblyRecipeData = {
    key: ASSEMBLY_ENGINE_KEY,

    createEmptyData() {
        return {
            inputItem: '',
            transitionalItem: '',
            assemblySteps: [], // [{ type, id?, fluidId?, fluidAmount?, fabricMultiplier? }]
            assemblyLoops: 1,
            outputs: [], // [{ id, isTag, chance }]
        };
    },

    // ── DOM -> data ──────────────────────────────────────────────────────
    save(recipe) {
        if (!recipe) return;
        if (!recipe.enginesData) recipe.enginesData = {};
        const data = recipe.enginesData[ASSEMBLY_ENGINE_KEY] || this.createEmptyData();

        const singleInput = document.getElementById('inputItem');
        data.inputItem = singleInput ? singleInput.value.trim() : '';

        const transitionalInput = document.getElementById('transitionalItem');
        data.transitionalItem = transitionalInput ? transitionalInput.value.trim() : '';

        const loopsInput = document.getElementById('assemblyLoops');
        data.assemblyLoops = loopsInput ? parseInt(loopsInput.value, 10) || 1 : 1;

        data.assemblySteps = [];
        const stepBlocks = document.getElementById('assemblyStepsContainer')?.children || [];
        for (const block of stepBlocks) {
            const type = block.querySelector('.step-type')?.value || 'pressing';
            const step = { type };

            if (type === 'deploying') {
                step.id = block.querySelector('.ing-id')?.value.trim() || '';
            } else if (type === 'filling') {
                step.fluidId = block.querySelector('.step-fluid-id')?.value.trim() || '';
                step.fluidAmount = parseInt(block.querySelector('.step-fluid-amount')?.value, 10) || 250;
                step.fabricMultiplier = !!block.querySelector('.step-fluid-fabric-multiplier')?.checked;
            }
            data.assemblySteps.push(step);
        }

        data.outputs = [];
        const outBlocks = [...(document.getElementById('outputsContainerSimple')?.children || [])];
        for (const block of outBlocks) {
            const idInput = block.querySelector('.out-id') || block.querySelector('input[type="text"]');
            if (!idInput || !idInput.value.trim()) continue;
            const raw = idInput.value.trim();
            const isTag = block.querySelector('.out-is-tag')?.checked || raw.startsWith('#');
            const chanceRaw = block.querySelector('.out-chance')?.value.trim();
            const chance = chanceRaw ? parseFloat(chanceRaw) : 1;
            data.outputs.push({ id: raw.replace(/^#/, ''), isTag, chance: isNaN(chance) ? 1 : chance });
        }

        recipe.enginesData[ASSEMBLY_ENGINE_KEY] = data;
    },

    // ── data -> DOM ──────────────────────────────────────────────────────
    restore(recipe) {
        const data = recipe?.enginesData?.[ASSEMBLY_ENGINE_KEY] || this.createEmptyData();

        const singleInput = document.getElementById('inputItem');
        if (singleInput) singleInput.value = data.inputItem || '';

        const transitionalInput = document.getElementById('transitionalItem');
        if (transitionalInput) transitionalInput.value = data.transitionalItem || '';

        const loopsInput = document.getElementById('assemblyLoops');
        if (loopsInput) loopsInput.value = data.assemblyLoops || 1;

        window._restoringEngineState = true; 

        const stepsContainer = document.getElementById('assemblyStepsContainer');
        if (stepsContainer) stepsContainer.innerHTML = '';
        (data.assemblySteps || []).forEach((step) => {
            if (typeof addAssemblyStepBlock !== 'function') return;
            addAssemblyStepBlock();
            const block = stepsContainer?.lastElementChild;
            if (!block) return;
            const typeSelect = block.querySelector('.step-type');
            if (typeSelect) typeSelect.value = step.type || 'pressing';
            if (typeof handleStepTypeFieldsUpdate === 'function') handleStepTypeFieldsUpdate(block.id);

            if (step.type === 'deploying') {
                const idInput = block.querySelector('.ing-id');
                if (idInput) idInput.value = step.id || '';
            } else if (step.type === 'filling') {
                const fluidIdInput = block.querySelector('.step-fluid-id');
                const fluidAmountInput = block.querySelector('.step-fluid-amount');
                const fabricCheck = block.querySelector('.step-fluid-fabric-multiplier');
                if (fluidIdInput) fluidIdInput.value = step.fluidId || '';
                if (fluidAmountInput) fluidAmountInput.value = step.fluidAmount || 250;
                if (fabricCheck) fabricCheck.checked = !!step.fabricMultiplier;
            }
        });

        const outContainer = document.getElementById('outputsContainerSimple');
        if (outContainer) outContainer.innerHTML = '';
        (data.outputs || []).forEach((out) => {
            if (typeof addSequencedOutputBlock !== 'function') return;
            window._seedingOutputBlock = true;
            addSequencedOutputBlock();
            window._seedingOutputBlock = false;
            const block = outContainer?.lastElementChild;
            if (!block) return;
            const idInput = block.querySelector('.out-id');
            const tagCheck = block.querySelector('.out-is-tag');
            const chanceInput = block.querySelector('.out-chance');
            if (idInput) idInput.value = out.id || '';
            if (tagCheck) tagCheck.checked = !!out.isTag;
            if (chanceInput) chanceInput.value = out.chance ?? 1;
        });

        window._restoringEngineState = false;
    },

    
    fromJson(recipeData) {
        const data = this.createEmptyData();
        const ingredientNode = Array.isArray(recipeData.ingredients) ? recipeData.ingredients[0] : recipeData.ingredient;
        if (ingredientNode) data.inputItem = ingredientNode.item || ingredientNode.tag || '';
        if (recipeData.transitionalItem) {
            data.transitionalItem = recipeData.transitionalItem.item || recipeData.transitionalItem || '';
        }
        data.assemblyLoops = recipeData.loops || 1;
        data.assemblySteps = (recipeData.sequence || []).map((step) => {
            const stepType = (step.type || '').replace('create:', '');
            const out = { type: stepType };
            const extra = (step.ingredients || []).find((ing) => (ing.item || ing.tag) !== data.transitionalItem);
            if (stepType === 'deploying' && extra) {
                out.id = extra.item || extra.tag || '';
            } else if (stepType === 'filling' && extra) {
                out.fluidId = extra.fluid || extra.fluidTag || '';
                out.fluidAmount = extra.amount || 250;
                out.fabricMultiplier = false;
            }
            return out;
        });
        data.outputs = (recipeData.results || []).map((node) => ({
            id: node.item || node.tag || '',
            isTag: !!node.tag,
            chance: node.chance !== undefined ? node.chance : 1,
        }));
        return data;
    },

};

window.AssemblyRecipeData = AssemblyRecipeData;
