window.removeBlock = function (target) {
    if (typeof target === 'string') {
        const element = document.getElementById(target);
        if (element) element.remove();
    } else if (target && typeof target.closest === 'function') {
        const block = target.closest('.grid-cell-stacked-box');
        if (block) block.remove();
    }
    const fc = document.getElementById('outputsContainerFluid');
    const sc = document.getElementById('outputsContainerSimple');
    const oc = document.getElementById('outputsContainer');
    if ((!fc || fc.children.length === 0) && (!sc || sc.children.length === 0) && (!oc || oc.children.length === 0)) {
        window._userClearedOutputs = true;
    }
    if (typeof compileRecipe === 'function') compileRecipe();
};

document.addEventListener('DOMContentLoaded', () => {
    const boxWrapper = document.getElementById('useConditional');
    if (boxWrapper) {
        boxWrapper.addEventListener('click', (e) => e.stopPropagation());
    }
});

function getItemKey() {
    const ver = document.getElementById('minecraftVersion');
    return ver && ver.value === '1.21.1' ? 'id' : 'item';
}
window.getItemKey = getItemKey;

function formatChanceAsFloat(jsonString) {
    return jsonString.replace(/"chance"\s*:\s*(-?\d+(?:\.\d+)?)/g, (match, numStr) => {
        if (numStr.includes('.')) return match;
        return match.replace(numStr, `${numStr}.0`);
    });
}
window.formatChanceAsFloat = formatChanceAsFloat;

function compileRecipe() {
    if (window.isSwitchingLayouts || window.isWorkspaceSwappingLayout) return;
    if (window.isParsingRecipe) return;
    if (window._restoringEngineState) return;

    if (typeof activeRightPaneMode !== 'undefined' && activeRightPaneMode === 'preview') {
        window.cachedConditionWrapperTemplate = null;
    }

    if (typeof activeRecipeId === 'undefined' || !activeRecipeId || typeof recipesDatabase === 'undefined' || !recipesDatabase[activeRecipeId]) {
        return;
    }

    const recipe = recipesDatabase[activeRecipeId];

    const engineKey = recipe.engine || 'create:mixing';

    const titleInput = document.getElementById('recipeTitle');
    if (titleInput) recipe.name = titleInput.value.trim();

    const platformRad = document.querySelector('input[name="platform"]:checked');
    if (platformRad) {
        const pv = platformRad.value || 'universal';
        if (!recipe.platformByEngine) recipe.platformByEngine = {};
        recipe.platformByEngine[engineKey] = pv;
        recipe.platform = pv; // legacy fallback
    }

    const module = getEngineModule(engineKey);
    module.save(recipe, engineKey);
    const coreRecipe = module.compile(recipe, engineKey);
    const platformSelection = platformRad ? platformRad.value : 'universal';
    const outputJson = buildConditionWrappedOutput(coreRecipe, platformSelection);

    const version = document.getElementById('minecraftVersion')?.value || '1.20.1';
    const isNeoForge = version === '1.21.1';

    const outputField = document.getElementById('recipeOutput') || document.querySelector('.recipeOutput');
    if (outputField) outputField.value = formatChanceAsFloat(JSON.stringify(outputJson, null, 4));

    const previewEl = document.getElementById('jsonOutput');
    if (previewEl) previewEl.textContent = formatChanceAsFloat(JSON.stringify(outputJson, null, 2));

    if (typeof saveActiveRecipeState === 'function') saveActiveRecipeState();
}
