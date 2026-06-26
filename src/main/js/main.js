
let ingredientCount = 0;
let outputCount = 0;
let assemblyStepCount = 0;
let currentActiveEngine = 'create:pressing';

let recipesDatabase = {};
let activeRecipeId = null;
let uniqueRecipeCounter = 1;
let activeOpenDropdownId = null;
let isSidebarCollapsed = false;
let activeRightPaneMode = 'preview';

function quickFillAsset(assetId) {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.classList.contains('ing-id') || activeElement.classList.contains('out-id') || activeElement.classList.contains('cond-key'))) {
        activeElement.value = assetId;
        if (typeof compileRecipe === 'function') compileRecipe();
        if (typeof updateCraftingKeysLegend === 'function') updateCraftingKeysLegend();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const localCache = localStorage.getItem('create_recipe_generator_cache');
    if (localCache) {
        try {
            recipesDatabase = JSON.parse(localCache);
            const keys = Object.keys(recipesDatabase);
            if (keys.length > 0) {
                activeRecipeId = keys[0];
                currentActiveEngine = recipesDatabase[activeRecipeId].engine || 'create:pressing';
            }
        } catch (e) {
            console.error('Failed to parse local storage cache stack:', e);
        }
    }

    if (Object.keys(recipesDatabase).length === 0) {
        const defaultId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        recipesDatabase[defaultId] = {
            id: defaultId,
            name: 'Untitled Recipe Template',
            engine: 'create:pressing',
            platform: 'universal',
            ingredients: [],
            outputs: [],
            conditions: [],
            assemblySteps: [],
            assemblyLoops: 1,
            transitionalItem: '',
            heatRequirement: 'none',
        };
        activeRecipeId = defaultId;
    }

    const titleInput = document.getElementById('recipeTitle');
    if (titleInput && activeRecipeId && recipesDatabase[activeRecipeId]) {
        titleInput.value = recipesDatabase[activeRecipeId].name || 'Untitled Recipe Template';
    }

    const tabElement = document.querySelector(`.engine-tab[data-engine="${currentActiveEngine}"]`);
    if (tabElement) {
        document.querySelectorAll('.engine-tab').forEach((b) => b.classList.remove('active'));
        tabElement.classList.add('active');
    }
    if (activeRecipeId && recipesDatabase[activeRecipeId]) {
    currentActiveEngine = recipesDatabase[activeRecipeId].engine || 'create:pressing';
}

    if (typeof toggleEngineFields === 'function') toggleEngineFields();
    if (typeof renderSidebarList === 'function') renderSidebarList();
    if (typeof loadRecipeFromState === 'function' && activeRecipeId) loadRecipeFromState(activeRecipeId);
});
