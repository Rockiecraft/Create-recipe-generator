function switchEngine(buttonEl) {
    document.querySelectorAll('.engine-tab').forEach(b => b.classList.remove('active'));
    buttonEl.classList.add('active');
    
    currentActiveEngine = buttonEl.getAttribute('data-engine');
    currentEngineType = currentActiveEngine;
    
    if (activeRecipeId && recipesDatabase[activeRecipeId]) {
        recipesDatabase[activeRecipeId].engine = currentActiveEngine;
    }
    
    toggleEngineFields();
    if (typeof renderSidebarList === 'function') renderSidebarList();
}

function toggleEngineFields() {
    const standardBox = document.getElementById('standardInputs');
    const multiPanel = document.getElementById('multiInputsPanel');
    const assemblyBox = document.getElementById('assemblyPanel');
    const craftingGridBox = document.getElementById('mechanicalCraftingContainer');

    if (standardBox) standardBox.classList.add('hidden');
    if (multiPanel) multiPanel.classList.add('hidden');
    if (assemblyBox) assemblyBox.classList.add('hidden');
    if (craftingGridBox) craftingGridBox.classList.add('hidden');

    const rawEngine = currentActiveEngine || 'create:mixing';
    const targetEngine = rawEngine.replace('create:', '');

    window.allowsFluid = (targetEngine === 'mixing' || targetEngine === 'compacting' || targetEngine === 'filling');

    const allowsHeat = (targetEngine === 'mixing' || targetEngine === 'compacting');

    
    const heatGroupEl = document.getElementById('heatRequirementGroup');
    if (heatGroupEl) {
        heatGroupEl.classList.toggle('hidden', !allowsHeat);
    }

    if (targetEngine === 'mixing' || targetEngine === 'compacting') {
        if (multiPanel) multiPanel.classList.remove('hidden');
    } else if (targetEngine === 'sequenced_assembly') {
        if (standardBox) standardBox.classList.remove('hidden');
        if (assemblyBox) assemblyBox.classList.remove('hidden');
    } else if (targetEngine === 'mechanical_crafting') {
        if (standardBox) standardBox.classList.add('hidden');
        if (multiPanel) multiPanel.classList.remove('hidden');
        if (craftingGridBox) {
            craftingGridBox.classList.remove('hidden');
            if (typeof generateCraftingGrid === 'function') generateCraftingGrid();
        }
    } else {
        if (standardBox) standardBox.classList.remove('hidden');
    }

    const allowsChance = (targetEngine === 'crushing' || targetEngine === 'sequenced_assembly' || targetEngine === 'milling' || targetEngine === 'splashing' || targetEngine === 'cutting');
    document.querySelectorAll('.chance-container').forEach(el => {
        el.classList.toggle('hidden', !allowsChance);
    });

    document.querySelectorAll('.fluid-toggle-row').forEach(el => el.classList.toggle('hidden', !window.allowsFluid));

    const allowsFluidOutput = (targetEngine === 'mixing' || targetEngine === 'compacting');
    document.querySelectorAll('.fluid-output-toggle-row').forEach(el => {
        el.classList.toggle('hidden', !allowsFluidOutput);
    });

    if (!allowsFluidOutput) {
        document.querySelectorAll('.out-is-fluid').forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
            }
            const block = checkbox.closest('.grid-cell-stacked-box');
            if (block) {
                const label = block.querySelector('.out-count-label') || block.querySelector('label');
                if (label) label.textContent = "Amount";
            }
        });
    }

    if (!window.allowsFluid) {
        document.querySelectorAll('.ing-is-fluid').forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                if (typeof checkbox.onchange === 'function') checkbox.onchange();
            }
        });
    }

    if (typeof compileRecipe === 'function') compileRecipe();
}

function setAdvancedRulesVisibility(shouldShow) {
    const advancedBox = document.querySelector('.advanced-options-disclosure');
    if (advancedBox) {
        if (shouldShow) {
            advancedBox.classList.remove('hidden');
        } else {
            advancedBox.classList.add('hidden');
   
            advancedBox.removeAttribute('open');
        }
    }
}
function toggleConditionalFields() {
    const detailsElement = document.querySelector('.advanced-options-disclosure');
    if (detailsElement) {
        if (detailsElement.hasAttribute('open')) {
            detailsElement.removeAttribute('open');
        } else {
            detailsElement.setAttribute('open', '');
        }
    }
}
