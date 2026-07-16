window.switchRightPaneMode = function (paneModeToken) {
    window.activeRightPaneMode = paneModeToken;

    const previewTabButton = document.getElementById('btnPanePreviewMode');
    const pasteTabButton = document.getElementById('btnPanePasteMode');
    const previewDisplayBox = document.getElementById('recipeCodePreviewContainer');
    const panelContextTitle = document.getElementById('rightPaneContextTitle');
    const pasteEditorWrapper = document.getElementById('recipeCodeEditorWrapper');

    if (paneModeToken === 'preview') {
        if (previewTabButton) {
            previewTabButton.classList.add('active');
            previewTabButton.style.color = '#20c997';
            previewTabButton.style.borderBottom = '2px solid #20c997';
        }
        if (pasteTabButton) {
            pasteTabButton.classList.remove('active');
            pasteTabButton.style.color = '#6c7192';
            pasteTabButton.style.borderBottom = 'none';
        }
        if (panelContextTitle) panelContextTitle.innerText = 'Compiled Code Preview';
        if (previewDisplayBox) previewDisplayBox.style.display = 'block';
        if (pasteEditorWrapper) pasteEditorWrapper.style.display = 'none';

        if (typeof compileRecipe === 'function' && (!window.workspaceIsolatorState || !window.workspaceIsolatorState.isParsingLock)) {
            compileRecipe();
        }
    } else if (paneModeToken === 'paste') {
        if (pasteTabButton) {
            pasteTabButton.classList.add('active');
            pasteTabButton.style.color = '#20c997';
            pasteTabButton.style.borderBottom = '2px solid #20c997';
        }
        if (previewTabButton) {
            previewTabButton.classList.remove('active');
            previewTabButton.style.color = '#6c7192';
            previewTabButton.style.borderBottom = 'none';
        }
        if (panelContextTitle) panelContextTitle.innerText = 'Paste / Edit Recipe Code';
        if (previewDisplayBox) previewDisplayBox.style.display = 'none';
        if (pasteEditorWrapper) pasteEditorWrapper.style.display = 'block';

        if (typeof syncRecipeCodeLineNumbers === 'function') syncRecipeCodeLineNumbers();
        if (typeof autoGrowRecipeTextarea === 'function') autoGrowRecipeTextarea();
        window._needsRestoreSync = false;
    }

    if (typeof switchRightPane === 'function') {
        const activeNodeElement = paneModeToken === 'preview' ? previewTabButton : pasteTabButton;
        if (activeNodeElement) switchRightPane(activeNodeElement, paneModeToken);
    }
};

window.workspaceIsolatorState = window.workspaceIsolatorState || {
    activePastedRawText: {},
    cachedConditionTemplates: {},
    isParsingLock: false
};
window.isFabricConversionActive = false;

/**
 * Master Controller triggered on any input or paste change in the Paste space.
 */
function reverseCompilePastedRecipe() {
    if (window._restoringPasteState) return;
    if (window.workspaceIsolatorState && window.workspaceIsolatorState.isParsingLock) return;

    const codeArea = document.getElementById('recipeCodeTextarea');
    const errorBox = document.getElementById('recipeParserErrorLogBox');
    const errorMsg = document.getElementById('recipeParserErrorMessage');

    if (!codeArea) return;
    if (typeof syncRecipeCodeLineNumbers === 'function') syncRecipeCodeLineNumbers();

    const clearTextStream = codeArea.value.trim();

    if (!clearTextStream || clearTextStream.length === 0) {
        if (errorBox) errorBox.style.display = 'none';
        return;
    }

    try {
        const rawJsonInput = JSON.parse(clearTextStream);
        const recipeData = extractInnerCreateRecipePayload(rawJsonInput);

        if (!recipeData || !recipeData.type) {
            if (errorMsg && errorBox) {
                errorMsg.innerText = 'Could not find a valid nested Create Mod object block inside your pasted structure.';
                errorBox.style.display = 'block';
                errorBox.style.borderColor = '#eb5344';
            }
            return;
        }

        if (!window.workspaceIsolatorState) {
            window.workspaceIsolatorState = { isParsingLock: false, activePastedRawText: {}, cachedConditionTemplates: {} };
        }
        window.workspaceIsolatorState.isParsingLock = true;

        const engineKey = recipeData.type;
        const trueMachineCode = engineKey.replace('create:', '');
        window.workspaceIsolatorState.activePastedRawText[trueMachineCode] = clearTextStream;
        window.workspaceIsolatorState.cachedConditionTemplates[trueMachineCode] = JSON.parse(JSON.stringify(rawJsonInput));

        if (activeRecipeId && recipesDatabase[activeRecipeId]) {
            const _recipe = recipesDatabase[activeRecipeId];
            const _oldEngineKey = (_recipe.engine || window.currentActiveEngine || 'create:pressing').replace('create:', '');
            const _newEngineKey = trueMachineCode;

            if (_oldEngineKey !== _newEngineKey) {
                if (_recipe.pasteState) {
                    _recipe.pasteState[_oldEngineKey] = '';
                }
                if (codeArea) codeArea.value = '';
            }

            if (!_recipe.pasteState) _recipe.pasteState = {};
            _recipe.pasteState[_newEngineKey] = clearTextStream;
        }

        // Auto-detect Fabric fluid units
        const allFluidNodes = [...(recipeData.ingredients || []), ...(recipeData.results || [])];
        let requiresFabricConversion = false;
        allFluidNodes.forEach((node) => {
            if (node.fluid && node.amount !== undefined) {
                const amt = parseInt(node.amount, 10);
                if (amt > 0 && amt % 81 === 0 && amt !== 1000) requiresFabricConversion = true;
            }
        });
        const fabricUnitsCheck = document.getElementById('autoConvertFabricFluids');
        if (fabricUnitsCheck) {
            fabricUnitsCheck.checked = requiresFabricConversion;
            fabricUnitsCheck.dispatchEvent(new Event('change', { bubbles: true }));
        }
        window.isFabricConversionActive = requiresFabricConversion;

        if (!activeRecipeId || !recipesDatabase[activeRecipeId]) {
            const newId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            recipesDatabase[newId] = {
                id: newId,
                name: 'Untitled Recipe Template',
                engine: engineKey,
                platform: 'universal',
                enginesData: {}
            };
            activeRecipeId = newId;
            window.currentActiveEngine = engineKey;
            currentActiveEngine = engineKey;
        }

        const recipe = recipesDatabase[activeRecipeId];
        if (!recipe.enginesData) recipe.enginesData = {};

        // Populate engine data from parsed JSON
        const module = typeof getEngineModule === 'function' ? getEngineModule(engineKey) : null;
        if (module && typeof module.fromJson === 'function') {
            recipe.enginesData[engineKey] = module.fromJson(recipeData, engineKey);
        }

        recipe.engine = engineKey;
        window.currentActiveEngine = engineKey;
        currentActiveEngine = engineKey;

        // Activate the correct engine tab visually
        document.querySelectorAll('.engine-tab, .tab-button').forEach((b) => b.classList.remove('active'));
        const tabEl = document.querySelector(`.engine-tab[data-engine="${engineKey}"]`) || document.querySelector(`.engine-tab[data-engine="${engineKey.replace('create:', '')}"]`);
        if (tabEl) tabEl.classList.add('active');

        if (tabEl && typeof syncModTabDisplayForEngine === 'function') syncModTabDisplayForEngine(tabEl);

        if (tabEl && typeof _modGroupForTabButton === 'function') {
            if (!recipe.lastEngineByModGroup) recipe.lastEngineByModGroup = {};
            recipe.lastEngineByModGroup[_modGroupForTabButton(tabEl)] = engineKey;
        }

        // Clear containers and restore engine layout
        window.isSwitchingLayouts = true;
        ['ingredientsContainer', 'outputsContainerFluid', 'outputsContainerSimple', 'assemblyStepsContainer'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });
        if (typeof toggleEngineFields === 'function') toggleEngineFields();
        if (module && typeof module.restore === 'function') module.restore(recipe, engineKey);
        window.isSwitchingLayouts = false;

        synchronizePlatformFrameworkRadios(rawJsonInput);

        setTimeout(() => {
            try {
                hydrateCustomConditionBlockRows(rawJsonInput);
            } catch (innerFault) {
                console.error('hydrateCustomConditionBlockRows failed:', innerFault);
            }

            try {
                if (typeof serializeAllConditions === 'function') {
                    const { forgeConditions, fabricConditions, neoConditions } = serializeAllConditions();
                    if (!recipe.conditionsByEngine) recipe.conditionsByEngine = {};
                    recipe.conditionsByEngine[engineKey] = { forgeConditions, fabricConditions, neoConditions };
                    recipe.conditions = forgeConditions;
                }
            } catch (condSyncFault) {
                console.error('Failed to sync pasted conditions into recipe.conditionsByEngine:', condSyncFault);
            }

            setTimeout(() => {
                if (errorBox) errorBox.style.display = 'none';
                if (typeof clearRecipeCodeErrorHighlight === 'function') clearRecipeCodeErrorHighlight();

                window.workspaceIsolatorState.isParsingLock = false;
                try {
                    if (typeof compileRecipe === 'function') compileRecipe();
                } catch (compileFault) {
                    console.error('compileRecipe failed after paste-import:', compileFault);
                }

               
                if (typeof _persistRecipesDatabase === 'function') {
                    _persistRecipesDatabase();
                }

                if (typeof renderSidebarList === 'function') renderSidebarList(activeRecipeId);

                if (codeArea) {
                    window._restoringPasteState = true;
                    codeArea.value = clearTextStream;
                    window._restoringPasteState = false;
                    if (typeof syncRecipeCodeLineNumbers === 'function') syncRecipeCodeLineNumbers();
                    if (typeof autoGrowRecipeTextarea === 'function') autoGrowRecipeTextarea();
                }
            }, 40);
        }, 30);
    } catch (syntaxFault) {
        if (window.workspaceIsolatorState) window.workspaceIsolatorState.isParsingLock = false;
        if (errorBox && errorMsg) {
            errorMsg.innerText = `SyntaxError: ${syntaxFault.message}`;
            errorBox.style.display = 'block';
            errorBox.style.borderColor = '#eb5344';
        }
        if (typeof highlightRecipeCodeErrorLine === 'function') highlightRecipeCodeErrorLine(syntaxFault.message);
        if (typeof syncRecipeCodeLineNumbers === 'function') syncRecipeCodeLineNumbers();
    }
}

/**
 * Component 1 Seeker: Deep scans JSON nodes to find the valid Create Mod recipe payload.
 */
function extractInnerCreateRecipePayload(node) {
    if (!node || typeof node !== 'object') return null;

    if (node.type && typeof node.type === 'string' && node.type.includes(':')) {
        if (Array.isArray(node.ingredients) || Array.isArray(node.results) || node.key !== undefined || node.pattern !== undefined) {
            return node;
        }
    }

    if (node.recipe && typeof node.recipe === 'object') {
        const directInnerCheck = extractInnerCreateRecipePayload(node.recipe);
        if (directInnerCheck) return directInnerCheck;
    }

    if (Array.isArray(node.recipes)) {
        for (let nestedElement of node.recipes) {
            let foundNode = extractInnerCreateRecipePayload(nestedElement);
            if (foundNode) return foundNode;
        }
    }

    for (let key in node) {
        if (node.hasOwnProperty(key) && typeof node[key] === 'object' && node[key] !== null) {
            if (key !== 'recipe' && key !== 'recipes') {
                let foundNode = extractInnerCreateRecipePayload(node[key]);
                if (foundNode) return foundNode;
            }
        }
    }

    return null;
}

/**
 * Component 2 Tab Automator: Directs the layout tab views to shift engines natively.
 */
function selectActiveMachineryTabElement(recipeTypeId) {
    if (!recipeTypeId) return;
    const cleanToken = recipeTypeId.trim();
    const matchButton = document.querySelector(`.engine-tab[data-engine="${cleanToken}"]`) || Array.from(document.querySelectorAll('.engine-tab')).find((b) => b.getAttribute('data-engine') === cleanToken);

    if (matchButton && typeof switchEngine === 'function') {
        switchEngine(matchButton);
    } else if (matchButton && typeof matchButton.click === 'function') {
        matchButton.click();
    }
}

/**
 * Component 5 Radio Sync Box: Switches platform radio buttons on paste.
 */
function synchronizePlatformFrameworkRadios(rawJsonInput) {
    if (!rawJsonInput || typeof rawJsonInput !== 'object') return;

    const version = document.getElementById('minecraftVersion')?.value || '1.20.1';
    const activeModTab = document.querySelector('.engine-mod-tab.active')?.getAttribute('data-mod');
    const is121 = version === '1.21.1' && activeModTab === 'create';

    const radioUniversal = document.querySelector('input[name="platform"][value="universal"]');
    const radioForge = document.querySelector('input[name="platform"][value="forge_only"]');
    const radioFabric = document.querySelector('input[name="platform"][value="fabric_only"]');
    const radioNeoForge = document.querySelector('input[name="platform"][value="neoforge_only"]');
    const conditionalConfigCard = document.getElementById('conditionalConfig');

    let hasConditions = false;
    const checkNode = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node.conditions) && node.conditions.length > 0) hasConditions = true;
        if (Array.isArray(node['fabric:load_conditions']) && node['fabric:load_conditions'].length > 0) hasConditions = true;
        if (Array.isArray(node['neoforge:conditions']) && node['neoforge:conditions'].length > 0) hasConditions = true;
        if (Array.isArray(node.recipes)) node.recipes.forEach(checkNode);
        if (node.recipe && typeof node.recipe === 'object') checkNode(node.recipe);
    };
    checkNode(rawJsonInput);

    const raw = JSON.stringify(rawJsonInput).toLowerCase();
    const usedWrapper = rawJsonInput.type === 'forge:conditional';

    // On 1.21.1: always stay universal, never switch platform radios,
    // never check the forge:conditional wrapper box.
    if (is121) {
        setTimeout(() => {
            if (radioUniversal) radioUniversal.checked = true;
            const wrapperCheck = document.getElementById('useForgeConditionalWrapper');
            if (wrapperCheck) wrapperCheck.checked = false;
            if (hasConditions && conditionalConfigCard) {
                conditionalConfigCard.classList.remove('hidden');
                conditionalConfigCard.style.setProperty('display', 'flex', 'important');
            }
        }, 10);
        return;
    }

    let targetRadio = radioUniversal;
    if (raw.includes('forge_only_blocker')) {
        targetRadio = radioForge;
    } else if (raw.includes('fabric_only_blocker')) {
        targetRadio = radioFabric;
    } else if (raw.includes('neoforge_only_blocker')) {
        targetRadio = radioNeoForge;
    }

    setTimeout(() => {
        [radioUniversal, radioForge, radioFabric, radioNeoForge].forEach((r) => {
            if (r) r.checked = false;
        });
        if (targetRadio) {
            targetRadio.checked = true;
            targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (hasConditions && conditionalConfigCard) {
            conditionalConfigCard.classList.remove('hidden');
            conditionalConfigCard.style.setProperty('display', 'flex', 'important');
        }
        const wrapperCheck = document.getElementById('useForgeConditionalWrapper');
        if (wrapperCheck) wrapperCheck.checked = usedWrapper;
    }, 10);
}

/**
 * Component 6 Deep Scanner: Strips boilerplates and builds custom criteria block rows.
 */
function hydrateCustomConditionBlockRows(rawJsonInput) {
    const container = document.getElementById('conditionsContainer');
    if (!container) return;
    container.innerHTML = '';

    // Boilerplate patterns to skip (auto-injected cross-loader blockers)
    const isBoilerplate = (c) => {
        const s = JSON.stringify(c).toLowerCase();
        return s.includes('"modid":"fabricloader"') || s.includes('"modid":"neoforge"') || s.includes('"values":["forge"]') || s.includes('"values":["neoforge"]') || s.includes('"values":["fabricloader"]');
    };

    // Collect real conditions per channel with their route
    const discovered = [];

    const scanNode = (node) => {
        if (!node || typeof node !== 'object') return;

        (node.conditions || []).forEach((c) => {
            if (!isBoilerplate(c)) discovered.push({ cond: c, route: 'forge' });
        });
        (node['fabric:load_conditions'] || []).forEach((c) => {
            if (!isBoilerplate(c)) discovered.push({ cond: c, route: 'fabric' });
        });
        (node['neoforge:conditions'] || []).forEach((c) => {
            if (!isBoilerplate(c)) discovered.push({ cond: c, route: 'neoforge' });
        });

        if (Array.isArray(node.recipes)) node.recipes.forEach((n) => scanNode(n));
        if (node.recipe && typeof node.recipe === 'object') scanNode(node.recipe);
    };

    scanNode(rawJsonInput);

    // Deduplicate by JSON string
    const seen = new Set();
    const unique = discovered.filter(({ cond, route }) => {
        const key = route + JSON.stringify(cond);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Merge routes — if same condition appears in both forge and fabric, set route to 'both'
    const merged = [];
    unique.forEach(({ cond, route }) => {
        const condStr = JSON.stringify(cond);
        const existing = merged.find((m) => JSON.stringify(m.cond) === condStr);
        if (existing) {
            existing.route = 'both';
        } else {
            merged.push({ cond, route });
        }
    });

    if (merged.length === 0) return;

    merged.forEach(({ cond, route }, index) => {
        const condType = cond.type || cond.condition || '';

        const selector = document.getElementById('conditionSelector');
        if (selector && presets && presets[condType]) {
            selector.value = condType;
        } else if (selector) {
            selector.value = 'custom';
        }

        if (typeof addConditionBlock === 'function') addConditionBlock();

        setTimeout(
            () => {
                const block = container.children[index];
                if (!block) return;

                const routeSel = block.querySelector('.cond-route-select');
                if (routeSel) routeSel.value = route;

                const typeInput = block.querySelector('.cond-type');
                if (typeInput) typeInput.value = condType;

                if (condType === 'fabric:all_mods_loaded' || condType === 'fabric:any_mod_loaded') {
                    const rowsDiv = block.querySelector('.fabric-mod-rows');
                    if (rowsDiv && Array.isArray(cond.values)) {
                        rowsDiv.innerHTML = '';
                        cond.values.forEach((modId) => {
                            if (typeof addFabricModRow === 'function') addFabricModRow(block.id);
                            setTimeout(() => {
                                const lastRow = rowsDiv.lastElementChild;
                                if (lastRow) {
                                    const inp = lastRow.querySelector('input');
                                    if (inp) inp.value = modId;
                                }
                            }, 10);
                        });
                    }
                } else if (condType.endsWith(':not')) {
                    const childRow = block.querySelector('.cond-nested-row');
                    if (childRow && cond.value) {
                        const childType = cond.value.type || cond.value.condition || '';
                        const childTypeInput = childRow.querySelector('.cond-type');
                        if (childTypeInput) childTypeInput.value = childType;
                        const childKey = Object.keys(cond.value).find((k) => k !== 'type' && k !== 'condition');
                        if (childKey) {
                            const childKeyInput = childRow.querySelector('.cond-key');
                            const childValInput = childRow.querySelector('.cond-val');
                            if (childKeyInput) childKeyInput.value = childKey;
                            if (childValInput) childValInput.value = cond.value[childKey];
                        }
                    }
                } else if (condType.endsWith(':and') || condType.endsWith(':or')) {
                    const childrenDiv = block.querySelector('.nested-children');
                    if (childrenDiv && Array.isArray(cond.values)) {
                        cond.values.forEach((childCond, i) => {
                            if (typeof addListChild === 'function') addListChild(block.id);
                            setTimeout(
                                () => {
                                    const childRows = childrenDiv.querySelectorAll('.cond-nested-row');
                                    const childRow = childRows[i];
                                    if (!childRow) return;
                                    const childType = childCond.type || childCond.condition || '';
                                    const typeInp = childRow.querySelector('.cond-type');
                                    if (typeInp) typeInp.value = childType;
                                    const childKey = Object.keys(childCond).find((k) => k !== 'type' && k !== 'condition');
                                    if (childKey) {
                                        const keyInp = childRow.querySelector('.cond-key');
                                        const valInp = childRow.querySelector('.cond-val');
                                        if (keyInp) keyInp.value = childKey;
                                        if (valInp) valInp.value = childCond[childKey];
                                    }
                                },
                                20 * (i + 1)
                            );
                        });
                    }
                } else {
                    const keyInput = block.querySelector('.cond-key');
                    const valInput = block.querySelector('.cond-val');
                    const dataKey = Object.keys(cond).find((k) => k !== 'type' && k !== 'condition');
                    if (dataKey) {
                        if (keyInput) keyInput.value = dataKey;
                        if (valInput) valInput.value = Array.isArray(cond[dataKey]) ? cond[dataKey].join(', ') : cond[dataKey];
                    }
                }

                if (typeof compileRecipe === 'function') compileRecipe();
            },
            30 + index * 60
        );
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const codeArea = document.getElementById('recipeCodeTextarea');
    if (!codeArea) return;

    let _parseDebounceTimer = null;
    codeArea.addEventListener('input', () => {
        clearTimeout(_parseDebounceTimer);
        _parseDebounceTimer = setTimeout(() => {
            reverseCompilePastedRecipe();
        }, 300);
    });

    // Also handle explicit paste events immediately after the clipboard lands
    codeArea.addEventListener('paste', () => {
        clearTimeout(_parseDebounceTimer);
        // Small delay so the pasted content is actually in codeArea.value
        _parseDebounceTimer = setTimeout(() => {
            reverseCompilePastedRecipe();
        }, 50);
    });

    // Handle clear-by-keyboard (delete/backspace empties the field)
    codeArea.addEventListener('keydown', (keyEvent) => {
        if ((keyEvent.key === 'Delete' || keyEvent.key === 'Backspace') && codeArea.value.trim() !== '') {
            const textLengthBeforeUpdate = codeArea.value.length;
            setTimeout(() => {
                if (codeArea.value.trim() === '' && textLengthBeforeUpdate > 0) {
                    if (typeof handleAutomatedWorkspacePurge === 'function') handleAutomatedWorkspacePurge(true);
                }
            }, 10);
        }
    });

    // Handle cut-to-empty
    codeArea.addEventListener('cut', () => {
        setTimeout(() => {
            if (codeArea.value.trim() === '') {
                if (typeof handleAutomatedWorkspacePurge === 'function') handleAutomatedWorkspacePurge(true);
            }
        }, 10);
    });
});

function hydrateMechanicalCraftingRecipe(recipeData) {
    const multiPanel = document.getElementById('multiInputsPanel');
    if (multiPanel) multiPanel.style.removeProperty('display');

    if (!recipeData.pattern || !recipeData.key) return;

    const pattern = recipeData.pattern;
    const height = pattern.length;
    const width = pattern[0] ? pattern[0].length : 3;

    const widthEl = document.getElementById('craftingWidth');
    const heightEl = document.getElementById('craftingHeight');
    if (widthEl) widthEl.value = width;
    if (heightEl) heightEl.value = height;
    generateCraftingGrid();

    const mirrorEl = document.getElementById('acceptMirrored');
    if (mirrorEl && recipeData.acceptMirrored !== undefined) {
        mirrorEl.value = recipeData.acceptMirrored ? 'true' : 'false';
    }

    setTimeout(() => {
        for (let r = 0; r < height; r++) {
            const row = pattern[r] || '';
            for (let c = 0; c < width; c++) {
                const cell = document.querySelector(`.craft-cell[data-row="${r}"][data-col="${c}"]`);
                if (cell) {
                    cell.value = row[c] !== undefined && row[c] !== ' ' ? row[c].toUpperCase() : '';
                }
            }
        }

        updateCraftingKeysLegend();

        setTimeout(() => {
            for (let symbol in recipeData.key) {
                const keyNode = recipeData.key[symbol];
                const itemVal = keyNode.item || keyNode.tag || '';
                const keyType = keyNode.tag ? 'tag' : 'item';

                const typeSelect = document.querySelector(`.craft-key-type[data-key="${symbol.toUpperCase()}"]`);
                const resourceInput = document.querySelector(`.craft-key-resource[data-key="${symbol.toUpperCase()}"]`);
                if (typeSelect) typeSelect.value = keyType;
                if (resourceInput) {
                    resourceInput.value = itemVal;
                    resourceInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            const result = recipeData.result;
            if (result) {
                const outEl = document.getElementById('singleOutputProductId');
                if (outEl) {
                    outEl.value = result.item || result.id || '';
                    outEl.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            if (typeof compileRecipe === 'function') compileRecipe();
        }, 60);
    }, 80);
}

function hydrateSequencedAssemblyRecipe(recipeData) {
    const inputEl = document.getElementById('inputItem');
    const ingredient = Array.isArray(recipeData.ingredients) ? recipeData.ingredients[0] : recipeData.ingredient;
    if (inputEl && ingredient) {
        inputEl.value = ingredient.item || ingredient.tag || '';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const transitionalEl = document.getElementById('transitionalItem');
    if (transitionalEl && recipeData.transitionalItem) {
        transitionalEl.value = recipeData.transitionalItem.item || recipeData.transitionalItem || '';
        transitionalEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const loopsEl = document.getElementById('assemblyLoops');
    if (loopsEl) {
        loopsEl.value = recipeData.loops || 1;
        loopsEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const outEl = document.getElementById('singleOutputProductId');
    const result = Array.isArray(recipeData.results) ? recipeData.results[0] : recipeData.result;
    if (outEl && result) {
        outEl.value = result.item || result.id || '';
        outEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const stepsContainer = document.getElementById('assemblyStepsContainer');
    if (stepsContainer && Array.isArray(recipeData.sequence)) {
        stepsContainer.innerHTML = '';
        recipeData.sequence.forEach((step, index) => {
            if (typeof addAssemblyStepBlock === 'function') addAssemblyStepBlock();

            setTimeout(
                () => {
                    const stepEl = stepsContainer.children[index] || stepsContainer.lastElementChild;
                    if (!stepEl) return;

                    const typeSelect = stepEl.querySelector('.step-type') || stepEl.querySelector('select');
                    const stepType = step.type ? step.type.replace('create:', '') : 'pressing';
                    if (typeSelect) {
                        typeSelect.value = stepType;
                        typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    if (stepType === 'filling') {
                        const fluidIngredient = step.ingredients ? step.ingredients.find((i) => i.fluid) : null;
                        if (fluidIngredient) {
                            const fluidIdEl = stepEl.querySelector('.step-fluid-id');
                            const fluidAmountEl = stepEl.querySelector('.step-fluid-amount');
                            if (fluidIdEl) fluidIdEl.value = fluidIngredient.fluid;
                            if (fluidAmountEl) fluidAmountEl.value = fluidIngredient.amount || 250;
                        }
                    }
                },
                index * 30 + 20
            );
        });
    }
}

window.reverseCompilePastedRecipe = reverseCompilePastedRecipe;
window.extractInnerCreateRecipePayload = extractInnerCreateRecipePayload;
window.selectActiveMachineryTabElement = selectActiveMachineryTabElement;
window.synchronizePlatformFrameworkRadios = synchronizePlatformFrameworkRadios;
window.hydrateCustomConditionBlockRows = hydrateCustomConditionBlockRows;
window.hydrateMechanicalCraftingRecipe = hydrateMechanicalCraftingRecipe;
window.hydrateSequencedAssemblyRecipe = hydrateSequencedAssemblyRecipe;
