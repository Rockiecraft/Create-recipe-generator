/**
 * compiler-engines/engine-dispatch.js
 *
 * Single source of truth mapping an engine key to the module that owns it.
 * Every module is called the same way — save(recipe, engineKey),
 * restore(recipe, engineKey), compile(recipe, engineKey) — engineKey is
 * always passed explicitly, even to modules that only ever serve one key.
 *
 * Core engines are hardcoded here and never touched by the plugin API.
 * Plugin engines live in window.PLUGIN_DISPATCH (plugin-api.js) and are
 * checked as a fallback by getEngineModule().
 */

const ENGINE_DISPATCH = {
    'create:mixing':    { save: (r, e) => BasinRecipeData.save(r, e), restore: (r, e) => BasinRecipeData.restore(r, e), compile: (r, e) => compileBasinRecipe(r, e, document.getElementById('autoConvertFabricFluids')?.checked), fromJson: (d, e) => BasinRecipeData.fromJson(d, e, document.getElementById('autoConvertFabricFluids')?.checked) },
    'create:compacting':{ save: (r, e) => BasinRecipeData.save(r, e), restore: (r, e) => BasinRecipeData.restore(r, e), compile: (r, e) => compileBasinRecipe(r, e, document.getElementById('autoConvertFabricFluids')?.checked), fromJson: (d, e) => BasinRecipeData.fromJson(d, e, document.getElementById('autoConvertFabricFluids')?.checked) },
    'create:filling':   { save: (r) => FillingRecipeData.save(r), restore: (r) => FillingRecipeData.restore(r), compile: (r) => compileSpoutRecipe(r), fromJson: (d) => FillingRecipeData.fromJson(d, document.getElementById('autoConvertFabricFluids')?.checked) },
    'create:sequenced_assembly':  { save: (r) => AssemblyRecipeData.save(r), restore: (r) => AssemblyRecipeData.restore(r), compile: (r) => compileAssemblyRecipe(r), fromJson: (d) => AssemblyRecipeData.fromJson(d) },
    'create:mechanical_crafting': { save: (r) => MechanicalCraftingData.save(r), restore: (r) => MechanicalCraftingData.restore(r), compile: (r) => compileMechanicalCraftingRecipe(r), fromJson: (d) => MechanicalCraftingData.fromJson(d) },
};

['create:pressing', 'create:smoking', 'create:blasting', 'create:haunting', 'create:deploying', 'create:sandpaper_polishing', 'create:splashing', 'create:item_application'].forEach((key) => {
    ENGINE_DISPATCH[key] = {
        save:     (r, e) => StandardRecipeData.save(r, e),
        restore:  (r, e) => StandardRecipeData.restore(r, e),
        compile:  (r, e) => compileStandardKineticRecipe(r, e),
        fromJson: (d, e) => StandardRecipeData.fromJson(d, e),
    };
});

['create:milling', 'create:crushing', 'create:cutting'].forEach((key) => {
    ENGINE_DISPATCH[key] = {
        save:     (r, e) => TimedRecipeData.save(r, e),
        restore:  (r, e) => TimedRecipeData.restore(r, e),
        compile:  (r, e) => compileTimedKineticRecipe(r, e),
        fromJson: (d, e) => TimedRecipeData.fromJson(d, e),
    };
});

/**
 * Resolve an engine module by key.
 * Checks core engines first, then plugin engines, then falls back to pressing.
 */
function getEngineModule(engineKey) {
    return ENGINE_DISPATCH[engineKey]
        || (window.PLUGIN_DISPATCH && window.PLUGIN_DISPATCH[engineKey])
        || ENGINE_DISPATCH['create:pressing'];
}

window.ENGINE_DISPATCH = ENGINE_DISPATCH;
window.getEngineModule = getEngineModule;
