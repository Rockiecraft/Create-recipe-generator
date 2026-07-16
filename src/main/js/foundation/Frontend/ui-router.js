const SIMPLE_OUTPUT_ENGINES = ['crushing', 'milling', 'cutting', 'splashing', 'sequenced_assembly'];

function _modGroupForTabButton(buttonEl) {
  const coreTabsInner = document.getElementById('coreEngineTabsInner');
  if (coreTabsInner && coreTabsInner.contains(buttonEl)) return 'create';
  const pluginInner = buttonEl.closest('[id^="pluginTabsInner_"]');
  if (pluginInner) return pluginInner.id.replace('pluginTabsInner_', '');
  return 'create';
}


function syncModTabDisplayForEngine(tabEl) {
  if (!tabEl) return;
  const mod = _modGroupForTabButton(tabEl);
  const coreTabsInner = document.getElementById('coreEngineTabsInner');
  const pluginTabsOuter = document.getElementById('pluginEngineTabsOuter');
  const comingSoon = document.getElementById('comingSoonPanel');

  if (coreTabsInner) coreTabsInner.style.display = mod === 'create' ? '' : 'none';
  if (pluginTabsOuter) {
    pluginTabsOuter.querySelectorAll('.plugin-engine-tabs-inner').forEach(el => {
      el.style.display = 'none';
    });
    if (mod !== 'create') {
      const pluginInner = document.getElementById(`pluginTabsInner_${mod}`);
      if (pluginInner) {
        pluginInner.style.display = 'flex';
        pluginTabsOuter.style.display = 'block';
      }
    }
  }
  if (comingSoon) comingSoon.classList.add('hidden');

  document.querySelectorAll('.engine-mod-tab').forEach(b => b.classList.remove('active'));
  const modBtn = document.querySelector(`.engine-mod-tab[data-mod="${mod}"]`);
  if (modBtn) modBtn.classList.add('active');
}

window.syncModTabDisplayForEngine = syncModTabDisplayForEngine;


function switchModTab(btn) {
  document.querySelectorAll('.engine-mod-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const mod = btn.getAttribute('data-mod');
  const coreTabsInner = document.getElementById('coreEngineTabsInner');
  const pluginTabsOuter = document.getElementById('pluginEngineTabsOuter');
  const comingSoon = document.getElementById('comingSoonPanel');
  const recipe = (typeof activeRecipeId !== 'undefined' && recipesDatabase[activeRecipeId])
    ? recipesDatabase[activeRecipeId] : null;
  const rememberedEngine = recipe?.lastEngineByModGroup?.[mod];


  if (coreTabsInner) coreTabsInner.style.display = 'none';
  if (pluginTabsOuter) {
    pluginTabsOuter.querySelectorAll('.plugin-engine-tabs-inner').forEach(el => {
      el.style.display = 'none';
    });
  }
  if (comingSoon) comingSoon.classList.add('hidden');

  if (mod === 'create') {
    if (coreTabsInner) coreTabsInner.style.display = '';

    let targetTab = rememberedEngine
      ? coreTabsInner?.querySelector(`.engine-tab[data-engine="${rememberedEngine}"]`)
      : null;
    if (!targetTab) {
      targetTab = coreTabsInner?.querySelector('.engine-tab[data-engine="create:pressing"]')
        || coreTabsInner?.querySelector('.engine-tab');
    }
    if (targetTab && typeof switchEngine === 'function') {
      switchEngine(targetTab);
    }
  } else {

    const pluginInner = document.getElementById(`pluginTabsInner_${mod}`);
    if (pluginInner) {
      pluginInner.style.display = 'flex';
      if (pluginTabsOuter) pluginTabsOuter.style.display = 'block';
      const groupRow = pluginInner.querySelector('.plugin-engine-tabs-row');

      let targetTab = rememberedEngine
        ? groupRow?.querySelector(`.engine-tab[data-engine="${rememberedEngine}"]`)
        : null;
      if (!targetTab) targetTab = groupRow?.querySelector('.engine-tab');
      if (targetTab && typeof switchEngine === 'function') {
        switchEngine(targetTab);
      }
    } else {

      if (comingSoon) comingSoon.classList.remove('hidden');
    }
  }

  // Re-apply 1.21.1 lock state for the newly active mod tab
  const version = document.getElementById('minecraftVersion')?.value || '1.20.1';
  const is121 = version === '1.21.1' && mod === 'create';
  const wrapCheck = document.getElementById('useForgeConditionalWrapper');
  const wrapLabel = wrapCheck?.parentElement;
  if (wrapCheck) { wrapCheck.disabled = is121; if (is121) wrapCheck.checked = false; }
  if (wrapLabel) wrapLabel.style.opacity = is121 ? '0.35' : '1';
  document.querySelectorAll('input[name="platform"]').forEach(r => {
    r.disabled = is121 && r.value !== 'universal';
  });
  document.querySelectorAll('.radio-group label').forEach(l => {
    const r = l.querySelector('input[name="platform"]');
    if (r) l.style.opacity = (is121 && r.value !== 'universal') ? '0.35' : '1';
  });
  if (is121) {
    const uni = document.getElementById('radio_universal');
    if (uni) uni.checked = true;
  }

  if (typeof compileRecipe === 'function') compileRecipe();
}

window.switchModTab = switchModTab;

// ---------------------------------------------------------------------------
// Minecraft version change handler
// Moved here from the inline onchange attribute in the old index.html.
// ---------------------------------------------------------------------------

function onMinecraftVersionChange(selectEl) {
  const activeModTab = document.querySelector('.engine-mod-tab.active')?.getAttribute('data-mod');
  const is121 = selectEl.value === '1.21.1' && activeModTab === 'create';
  const wrapCheck = document.getElementById('useForgeConditionalWrapper');
  const wrapLabel = wrapCheck?.parentElement;
  if (wrapCheck) { wrapCheck.disabled = is121; wrapCheck.checked = false; }
  if (wrapLabel) wrapLabel.style.opacity = is121 ? '0.35' : '1';
  const radios = document.querySelectorAll('input[name="platform"]');
  radios.forEach(r => { r.disabled = is121 && r.value !== 'universal'; });
  document.querySelectorAll('.radio-group label').forEach(l => {
    const r = l.querySelector('input[name="platform"]');
    if (r) l.style.opacity = (is121 && r.value !== 'universal') ? '0.35' : '1';
  });
  if (is121) {
    const uni = document.getElementById('radio_universal');
    if (uni) uni.checked = true;
  }
  setTimeout(() => { if (typeof compileRecipe === 'function') compileRecipe(); }, 0);
}

window.onMinecraftVersionChange = onMinecraftVersionChange;

// ---------------------------------------------------------------------------
// Note: getItemKey() is defined inline in index.html (kept in its original
// location to match the rest of the app's load order expectations).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Engine switching
// ---------------------------------------------------------------------------

function switchEngine(buttonEl) {
  if (!activeRecipeId || !recipesDatabase[activeRecipeId]) return;
  const recipe = recipesDatabase[activeRecipeId];
  const previousEngineKey = recipe.engine || 'create:mixing';
  const newEngineKey = buttonEl.getAttribute('data-engine');

  const codeArea = document.getElementById('recipeCodeTextarea');
  const isMidPaste = window.workspaceIsolatorState && window.workspaceIsolatorState.isParsingLock;
  if (!isMidPaste && codeArea) {
    const oldKey = previousEngineKey.replace('create:', '');
    if (!recipe.pasteState) recipe.pasteState = {};
    if (codeArea.value.trim()) recipe.pasteState[oldKey] = codeArea.value;
  }

  if (typeof saveActiveRecipeState === 'function') saveActiveRecipeState();

  if (typeof captureLayoutSnapshot === 'function') {
    captureLayoutSnapshot(activeRecipeId, previousEngineKey);
  } else {
    getEngineModule(previousEngineKey).save(recipe, previousEngineKey);
  }

  const outgoingPlatformRad = document.querySelector('input[name="platform"]:checked');
  if (outgoingPlatformRad) {
    if (!recipe.platformByEngine) recipe.platformByEngine = {};
    recipe.platformByEngine[previousEngineKey] = outgoingPlatformRad.value;
    recipe.platform = outgoingPlatformRad.value;
  }

  if (previousEngineKey === newEngineKey) return;

  document.querySelectorAll('.engine-tab').forEach((b) => b.classList.remove('active'));
  buttonEl.classList.add('active');
  recipe.engine = newEngineKey;
  window.currentActiveEngine = newEngineKey;
  currentActiveEngine = newEngineKey;
  currentEngineType = newEngineKey;

  if (!recipe.lastEngineByModGroup) recipe.lastEngineByModGroup = {};
  recipe.lastEngineByModGroup[_modGroupForTabButton(buttonEl)] = newEngineKey;

  window.isSwitchingLayouts = true;
  if (typeof toggleEngineFields === 'function') toggleEngineFields();

  ['ingredientsContainer', 'outputsContainerFluid', 'outputsContainerSimple', 'assemblyStepsContainer'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });

  const condContainer = document.getElementById('conditionsContainer');
  if (condContainer) condContainer.innerHTML = '';

  const snapApplied = typeof applyLayoutSnapshot === 'function'
    ? applyLayoutSnapshot(activeRecipeId, newEngineKey)
    : false;

  if (!snapApplied) {
    getEngineModule(newEngineKey).restore(recipe, newEngineKey);
    if (typeof _restoreConditionsForEngine === 'function') {
      _restoreConditionsForEngine(recipe, newEngineKey);
    }
  }

  window.isSwitchingLayouts = false;

  if (!isMidPaste && codeArea) {
    const newKey = newEngineKey.replace('create:', '');
    const saved = recipe.pasteState?.[newKey] || '';
    window._restoringPasteState = true;
    codeArea.value = saved;
    window._restoringPasteState = false;
    if (typeof syncRecipeCodeLineNumbers === 'function') syncRecipeCodeLineNumbers();
    if (typeof autoGrowRecipeTextarea === 'function') autoGrowRecipeTextarea();
  }

  if (typeof renderSidebarList === 'function') renderSidebarList();
  if (typeof compileRecipe === 'function') compileRecipe();
}

// ---------------------------------------------------------------------------
// toggleEngineFields
// Handles core engine panel visibility + plugin engine fallback.
// ---------------------------------------------------------------------------

function toggleEngineFields() {
  if (window._toggleEngineFieldsRunning) return;
  window._toggleEngineFieldsRunning = true;

  const standardBox = document.getElementById('standardInputs');
  const multiPanel = document.getElementById('multiInputsPanel');
  const assemblyBox = document.getElementById('assemblyPanel');
  const craftingGridBox = document.getElementById('mechanicalCraftingContainer');
  const fillingPanel = document.getElementById('fillingInputsPanel');
  const pluginFormSlot = document.getElementById('pluginRecipeFormSlot');
  const heatGroupEl = document.getElementById('heatRequirementGroup');
  const heatRow = document.getElementById('advancedHeatRow');
  const fluidRow = document.getElementById('advancedFluidRow');
  const kineticRow = document.getElementById('processDurationRow');

  const singleOutputPanel = document.getElementById('singleOutputInputsPanel');
  const inputItem2RowEl = document.getElementById('inputItem2Row');
  const outputsContainerFluidEl = document.getElementById('outputsContainerFluid');
  const outputsContainerSimpleEl = document.getElementById('outputsContainerSimple');
  const addOutputBtnFluidEl = document.getElementById('addOutputBtnFluid');
  const addOutputBtnSimpleEl = document.getElementById('addOutputBtnSimple');

  // Hide all panels
  [standardBox, multiPanel, assemblyBox, craftingGridBox, fillingPanel, singleOutputPanel, inputItem2RowEl]
    .forEach(el => el?.classList.add('hidden'));
  [outputsContainerFluidEl, outputsContainerSimpleEl, addOutputBtnFluidEl, addOutputBtnSimpleEl]
    .forEach(el => el?.classList.add('hidden'));
  [heatRow, fluidRow, kineticRow].forEach(row => row?.classList.add('hidden'));
  if (pluginFormSlot) { pluginFormSlot.innerHTML = ''; pluginFormSlot.classList.add('hidden'); }

  const fullEngineKey = currentActiveEngine || 'create:pressing';
  const isPluginEngine = !!(window.PLUGIN_DISPATCH && window.PLUGIN_DISPATCH[fullEngineKey]);

  // --- Plugin engine: delegate panel setup to its ui config ---
  if (isPluginEngine) {
    const pluginUI = window.RecipeGeneratorAPI?.getPluginEngineUI(fullEngineKey);
    if (pluginUI) {
      if (typeof pluginUI.inputPanel === 'function') {
        if (pluginFormSlot) {
          pluginFormSlot.innerHTML = pluginUI.inputPanel();
          pluginFormSlot.classList.remove('hidden');
        }
      } else {
        _showBuiltinPanel(pluginUI.inputPanel, multiPanel, standardBox, fillingPanel, assemblyBox, craftingGridBox);
        if (pluginUI.hasHeatRequirement) heatRow?.classList.remove('hidden');
        if (pluginUI.hasProcessingTime) kineticRow?.classList.remove('hidden');
        _configureOutputPanels(fullEngineKey, pluginUI.outputPanel === 'fluid' ? 'fluid' : 'simple', pluginUI);
      }
    }
    heatGroupEl?.classList.add('hidden');
    window._toggleEngineFieldsRunning = false;
    return;
  }

  // --- Core engine ---
  const targetEngine = fullEngineKey.replace('create:', '');
  window.allowsFluid = ['mixing', 'compacting', 'filling'].includes(targetEngine);
  heatGroupEl?.classList.toggle('hidden', !['mixing', 'compacting'].includes(targetEngine));

  if (targetEngine === 'filling') {
    fillingPanel?.classList.remove('hidden');
  } else if (['mixing', 'compacting'].includes(targetEngine)) {
    multiPanel?.classList.remove('hidden');
    const addIngBtn = document.getElementById('addIngredientBtn');
    if (addIngBtn) addIngBtn.style.display = '';
    const ingLabel = multiPanel?.querySelector('label');
    if (ingLabel) ingLabel.style.display = '';
    const ingredientsContainer = document.getElementById('ingredientsContainer');
    if (ingredientsContainer) ingredientsContainer.style.display = '';
  } else if (targetEngine === 'sequenced_assembly') {
    [standardBox, assemblyBox].forEach(el => el?.classList.remove('hidden'));
  } else if (targetEngine === 'mechanical_crafting') {
    multiPanel?.classList.remove('hidden');
    craftingGridBox?.classList.remove('hidden');
    const addIngBtn = document.getElementById('addIngredientBtn');
    if (addIngBtn) addIngBtn.style.display = 'none';
    const ingLabel = multiPanel?.querySelector('label');
    if (ingLabel) ingLabel.style.display = 'none';
    const ingredientsContainer = document.getElementById('ingredientsContainer');
    if (ingredientsContainer) ingredientsContainer.style.display = 'none';
    if (typeof generateCraftingGrid === 'function') generateCraftingGrid();
  } else {
    // pressing, smoking, blasting, haunting, deploying, milling, crushing,
    // cutting, sandpaper_polishing, splashing, item_application
    standardBox?.classList.remove('hidden');
  }

  // Advanced rows
  if (['mixing', 'compacting'].includes(targetEngine)) {
    heatRow?.classList.remove('hidden');
    fluidRow?.classList.remove('hidden');
  } else if (targetEngine === 'filling') {
    fluidRow?.classList.remove('hidden');
  } else if (['milling', 'crushing', 'cutting'].includes(targetEngine)) {
    kineticRow?.classList.remove('hidden');
    const timeInput = document.getElementById('processingTimeInput');
    if (timeInput && (!timeInput.value || timeInput.value === '')) timeInput.value = '200';
  }

  // Single output panel
  const singleOutputPanelEl = document.getElementById('singleOutputInputsPanel');
  if (singleOutputPanelEl) {
    const showSingle = ['pressing', 'filling', 'smoking', 'blasting', 'haunting',
      'deploying', 'mechanical_crafting', 'sandpaper_polishing', 'item_application'].includes(targetEngine);
    singleOutputPanelEl.classList.toggle('hidden', !showSingle);
  }

  // Second input field (item_application only)
  const inputItem2Row = document.getElementById('inputItem2Row');
  if (inputItem2Row) {
    inputItem2Row.classList.toggle('hidden', targetEngine !== 'item_application');
  }

  // Output panel label visibility
  const outputsPanel = document.getElementById('outputsPanel');
  const outputsPanelLabel = outputsPanel?.querySelector('label');
  if (outputsPanelLabel) {
    const hideLabel = ['pressing', 'filling', 'smoking', 'blasting', 'haunting',
      'deploying', 'sandpaper_polishing', 'mechanical_crafting', 'item_application'].includes(targetEngine);
    outputsPanelLabel.style.display = hideLabel ? 'none' : '';
  }

  // Fluid output toggles
  const allowsFluidOutput = ['mixing', 'compacting'].includes(targetEngine);
  document.querySelectorAll('.fluid-output-toggle-row').forEach(el => {
    el.classList.toggle('hidden', !allowsFluidOutput);
  });

  // Output amount field (mechanical crafting only)
  const outputAmountField = document.getElementById('outputAmountField');
  const outputAmountHint = document.getElementById('outputAmountHint');
  const showOutputAmount = targetEngine === 'mechanical_crafting';
  outputAmountField?.classList.toggle('hidden', !showOutputAmount);
  outputAmountHint?.classList.toggle('hidden', !showOutputAmount);
  if (!showOutputAmount) {
    const countInput = document.getElementById('singleOutputProductCount');
    if (countInput) countInput.value = '1';
  }

  // Clear fluid checkboxes when engine doesn't allow fluid
  if (!window.allowsFluid && !window._hydratingFluid) {
    document.querySelectorAll('.ing-is-fluid').forEach(checkbox => {
      if (checkbox.checked) {
        checkbox.checked = false;
        if (typeof checkbox.onchange === 'function') checkbox.onchange();
      }
    });
  }
  if (!allowsFluidOutput) {
    document.querySelectorAll('.out-is-fluid').forEach(checkbox => {
      if (checkbox.checked) checkbox.checked = false;
      const label = checkbox.closest('.grid-cell-stacked-box')?.querySelector('.out-count-label');
      if (label) label.textContent = 'Amount';
    });
  }

  // Multi-output containers
  const containerFluid = document.getElementById('outputsContainerFluid');
  const containerSimple = document.getElementById('outputsContainerSimple');
  const btnFluid = document.getElementById('addOutputBtnFluid');
  const btnSimple = document.getElementById('addOutputBtnSimple');

  containerFluid?.classList.add('hidden');
  containerSimple?.classList.add('hidden');
  btnFluid?.classList.add('hidden');
  btnSimple?.classList.add('hidden');

  if (['mixing', 'compacting'].includes(targetEngine)) {
    containerFluid?.classList.remove('hidden');
    btnFluid?.classList.remove('hidden');
    containerFluid?.querySelectorAll('.fluid-output-toggle-row').forEach(el => el.classList.remove('hidden'));
  } else if (SIMPLE_OUTPUT_ENGINES.includes(targetEngine)) {
    containerSimple?.classList.remove('hidden');
    btnSimple?.classList.remove('hidden');
    if (btnSimple) {
      let addFn = 'addSequencedOutputBlock()';
      if (targetEngine !== 'sequenced_assembly') {
        const fullKey = `create:${targetEngine}`;
        if (typeof TimedRecipeData !== 'undefined' && TimedRecipeData.chanceOutputEngines.includes(fullKey)) {
          addFn = 'addTimedOutputBlock()';
        } else {
          addFn = 'addStandardOutputBlock()';
        }
      }
      btnSimple.setAttribute('onclick', addFn);
    }
  }

  window._toggleEngineFieldsRunning = false;
}

/**
 * Show a built-in panel by name string (used by plugin engines that reuse core panels).
 */
function _showBuiltinPanel(panelName, multiPanel, standardBox, fillingPanel, assemblyBox, craftingGridBox) {
  switch (panelName) {
    case 'basin':
      multiPanel?.classList.remove('hidden');
      break;
    case 'filling':
      fillingPanel?.classList.remove('hidden');
      break;
    case 'assembly':
      assemblyBox?.classList.remove('hidden');
      break;
    case 'mechanical_crafting':
      craftingGridBox?.classList.remove('hidden');
      break;
    case 'standard':
    default:
      standardBox?.classList.remove('hidden');
      break;
  }
}

/**
 * Configure the output panel containers for a plugin engine.
 */
function _configureOutputPanels(engineKey, outputType, pluginUI) {
  const containerFluid = document.getElementById('outputsContainerFluid');
  const containerSimple = document.getElementById('outputsContainerSimple');
  const btnFluid = document.getElementById('addOutputBtnFluid');
  const btnSimple = document.getElementById('addOutputBtnSimple');
  const singlePanel = document.getElementById('singleOutputInputsPanel');

  containerFluid?.classList.add('hidden');
  containerSimple?.classList.add('hidden');
  btnFluid?.classList.add('hidden');
  btnSimple?.classList.add('hidden');
  singlePanel?.classList.add('hidden');

  if (outputType === 'fluid') {
    containerFluid?.classList.remove('hidden');
    btnFluid?.classList.remove('hidden');
  } else {
    containerSimple?.classList.remove('hidden');
    btnSimple?.classList.remove('hidden');
  }
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
