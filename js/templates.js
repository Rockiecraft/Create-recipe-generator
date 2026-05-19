/**
 * CREATE RECIPE GENERATOR - Presets Catalog
 * Dictionary storage mappings for condition template elements
 */
const presets = {
    "custom": { 
        id: "your_mod:config_check", 
        key: "flag", 
        val: "true", 
        hintA: "Maps to your custom code's registry identifier.", 
        hintB: "Defines the key-value config match required to pass." 
    },
    "forge:mod_loaded": { 
        id: "forge:mod_loaded", 
        key: "modid", 
        val: "create", 
        hintA: "Forge check verifying if a dependency mod is loaded.", 
        hintB: "The exact mod id requirement string (e.g., 'jei')." 
    },
    "forge:item_exists": { 
        id: "forge:item_exists", 
        key: "item", 
        val: "create:brass_ingot", 
        hintA: "Forge check confirming if a specific item registry entry exists.", 
        hintB: "The raw item resource path identifier entry key." 
    },
    "fabric:mod_loaded": { 
        id: "fabric:mod_loaded", 
        key: "modid", 
        val: "create", 
        hintA: "Fabric API loader verification rule check.", 
        hintB: "The targeted Fabric mod namespace ID tag value." 
    }
};

