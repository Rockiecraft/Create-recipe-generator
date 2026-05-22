let conditionCount = 0;
let ingredientCount = 0;
let outputCount = 0;
let assemblyStepCount = 0;
let currentActiveEngine = "create:mixing";

let recipesDatabase = {};
let activeRecipeId = null;
let uniqueRecipeCounter = 1;
let activeOpenDropdownId = null;
let isSidebarCollapsed = false;

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
                currentActiveEngine = recipesDatabase[activeRecipeId].engine || "create:mixing";
            }
        } catch (e) {
            console.error("Failed to parse local storage cache stack:", e);
        }
    }

    if (Object.keys(recipesDatabase).length === 0) {
        const defaultId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        recipesDatabase[defaultId] = {
            id: defaultId,
            name: "Untitled Recipe Template",
            engine: "create:mixing",
            platform: "universal",
            ingredients: [],
            outputs: [],
            conditions: [],
            assemblySteps: [],
            assemblyLoops: 1,
            transitionalItem: ""
        };
        activeRecipeId = defaultId;
    }

    const titleInput = document.getElementById('recipeTitle');
    if (titleInput && activeRecipeId && recipesDatabase[activeRecipeId]) {
        titleInput.value = recipesDatabase[activeRecipeId].name || "Untitled Recipe Template";
    }

    const tabElement = document.querySelector(`.engine-tab[data-engine="${currentActiveEngine}"]`);
    if (tabElement) {
        document.querySelectorAll('.engine-tab').forEach(b => b.classList.remove('active'));
        tabElement.classList.add('active');
    }

    if (typeof toggleEngineFields === 'function') toggleEngineFields();
    if (typeof renderSidebarList === 'function') renderSidebarList();
    if (typeof loadRecipeFromState === 'function' && activeRecipeId) loadRecipeFromState(activeRecipeId);
});

(function() {
    const enforceUniversalDefault = () => {

        const universalRadio = document.querySelector('input[name="platform"][value="universal"]');
        if (universalRadio) {
            universalRadio.checked = true;
        }

        const fabricRadio = document.querySelector('input[name="platform"][value="fabric_only"]');
        if (fabricRadio) {
            fabricRadio.checked = false;
        }

        if (typeof activeRecipeId !== 'undefined' && activeRecipeId && typeof recipesDatabase !== 'undefined' && recipesDatabase[activeRecipeId]) {
            recipesDatabase[activeRecipeId].platform = "universal";
        }


        if (typeof compileRecipe === 'function') {
            compileRecipe();
        }
    };


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enforceUniversalDefault);
    } else {
        enforceUniversalDefault();
    }


    setTimeout(enforceUniversalDefault, 150);
})();
