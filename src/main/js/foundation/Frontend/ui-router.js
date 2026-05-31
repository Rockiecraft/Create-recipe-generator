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
    const fillingPanel = document.getElementById('fillingInputsPanel');
    const heatGroupEl = document.getElementById('heatRequirementGroup');
    const heatRow = document.getElementById('advancedHeatRow');
    const fluidRow = document.getElementById('advancedFluidRow');
    const kineticRow = document.getElementById('processDurationRow');

    [standardBox, multiPanel, assemblyBox, craftingGridBox, fillingPanel].forEach(el => el?.classList.add('hidden'));
    [heatRow, fluidRow, kineticRow].forEach(row => row?.classList.add('hidden'));

    const targetEngine = (currentActiveEngine || 'create:pressing').replace('create:', '');


    window.allowsFluid = ['mixing', 'compacting', 'filling'].includes(targetEngine);
    heatGroupEl?.classList.toggle('hidden', !['mixing', 'compacting'].includes(targetEngine));

    if (targetEngine === 'filling') {
        fillingPanel?.classList.remove('hidden');
    } else if (['mixing', 'compacting'].includes(targetEngine)) {
        multiPanel?.classList.remove('hidden');
    } else if (targetEngine === 'sequenced_assembly') {
        [standardBox, assemblyBox].forEach(el => el?.classList.remove('hidden'));
    } else if (targetEngine === 'mechanical_crafting') {
        multiPanel?.classList.remove('hidden');
        craftingGridBox?.classList.remove('hidden');
        if (typeof generateCraftingGrid === 'function') generateCraftingGrid();
    } else if (['milling', 'crushing'].includes(targetEngine)) {

        standardBox?.classList.remove('hidden');
    } else {
        standardBox?.classList.remove('hidden');
    }

    if (['mixing', 'compacting'].includes(targetEngine)) {
        heatRow?.classList.remove('hidden');
        fluidRow?.classList.remove('hidden');
    } else if (targetEngine === 'filling') {
        fluidRow?.classList.remove('hidden');
    } else if (['milling', 'crushing', 'cutting'].includes(targetEngine)) {

        kineticRow?.classList.remove('hidden');


        const timeInput = document.getElementById('processingTimeInput');
        if (timeInput) {
            timeInput.value = "200";
        }
    }
    const singleOutputPanel = document.getElementById('singleOutputInputsPanel');
    if (singleOutputPanel) {
        if (['pressing', 'filling', 'smoking', 'blasting', 'haunting', 'sequenced_assembly', 'deploying', 'mechanical_crafting'].includes(targetEngine)) {
            singleOutputPanel.classList.remove('hidden');
        } else {
            singleOutputPanel.classList.add('hidden');
        }
    }

    document.querySelectorAll('.chance-container').forEach(el =>
        el.classList.toggle('hidden', !['crushing', 'sequenced_assembly', 'milling', 'splashing', 'cutting'].includes(targetEngine)));
    document.querySelectorAll('.fluid-toggle-row').forEach(el => el.classList.toggle('hidden', !window.allowsFluid));

    const allowsFluidOutput = ['mixing', 'compacting'].includes(targetEngine);
    document.querySelectorAll('.fluid-output-toggle-row').forEach(el =>
        el.classList.toggle('hidden', !allowsFluidOutput));

    if (!allowsFluidOutput) {
        document.querySelectorAll('.out-is-fluid').forEach(checkbox => {
            if (checkbox.checked) checkbox.checked = false;
            const label = checkbox.closest('.grid-cell-stacked-box')?.querySelector('.out-count-label, label');
            if (label) label.textContent = "Amount";
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
    const hidesMultiOutputs = ['pressing', 'filling', 'blasting', 'smoking', 'haunting', 'sequenced_assembly', 'deploying', 'mechanical_crafting'].includes(targetEngine);

  
    const outputsCardWrapper = document.getElementById('outputsContainer')?.closest('.recipe-group-card') || 
                               document.getElementById('outputsContainer')?.parentElement;
    const addOutputNodeBtn = document.querySelector('button[onclick*="addOutputBlock"]');

    
    if (hidesMultiOutputs) {
       
        outputsCardWrapper?.classList.add('hidden');
        addOutputNodeBtn?.classList.add('hidden');
    } else {
    
        outputsCardWrapper?.classList.remove('hidden');
        addOutputNodeBtn?.classList.remove('hidden');
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
