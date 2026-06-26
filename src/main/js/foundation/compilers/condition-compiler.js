// ── condition-compiler.js ──────────────────────────────────────────────────

function buildConditionWrappedOutput(coreRecipe, platformSelection) {
    const version = document.getElementById('minecraftVersion')?.value || '1.20.1';
    const activeModTab = document.querySelector('.engine-mod-tab.active')?.getAttribute('data-mod');
    const is121 = version === '1.21.1' && activeModTab === 'create';

    const { forgeConditions, fabricConditions, neoConditions } = serializeAllConditions();
    const hasAny = forgeConditions.length > 0 || fabricConditions.length > 0 || neoConditions.length > 0;
    const useWrapper = document.getElementById('useForgeConditionalWrapper')?.checked || false;

    
    if (is121) {
        if (!hasAny) return coreRecipe;
        return {
            ...(forgeConditions.length > 0 && { conditions: forgeConditions }),
            ...(fabricConditions.length > 0 && { 'fabric:load_conditions': fabricConditions }),
            ...(neoConditions.length > 0 && { 'neoforge:conditions': neoConditions }),
            ...coreRecipe
        };
    }

    // Platform-only modes always need the forge:conditional wrapper
    // because the platform blockers only work inside that structure
    if (platformSelection === 'forge_only') {
        const block = {
            ...(forgeConditions.length > 0 && { conditions: forgeConditions }),
            'fabric:load_conditions': [{ condition: 'fabric:all_mods_loaded', values: ['forge_only_blocker'] }],
            'neoforge:conditions': [{ type: 'neoforge:mod_loaded', modid: 'forge_only_blocker' }],
            recipe: { ...coreRecipe }
        };
        return { type: 'forge:conditional', recipes: [block] };
    } else if (platformSelection === 'fabric_only') {
        const block = {
            conditions: [{ type: 'forge:mod_loaded', modid: 'fabric_only_blocker' }],
            'neoforge:conditions': [{ type: 'neoforge:mod_loaded', modid: 'fabric_only_blocker' }],
            ...(fabricConditions.length > 0 && { 'fabric:load_conditions': fabricConditions }),
            recipe: { ...coreRecipe }
        };
        return { type: 'forge:conditional', recipes: [block] };
    } else if (platformSelection === 'neoforge_only') {
        const block = {
            conditions: [{ type: 'forge:mod_loaded', modid: 'neoforge_only_blocker' }],
            'fabric:load_conditions': [{ condition: 'fabric:all_mods_loaded', values: ['neoforge_only_blocker'] }],
            ...(neoConditions.length > 0 && { 'neoforge:conditions': neoConditions }),
            recipe: { ...coreRecipe }
        };
        return { type: 'forge:conditional', recipes: [block] };
    } else {
        // Universal
        if (!hasAny) return coreRecipe;

        if (useWrapper) {
            // Explicit forge:conditional wrapper (legacy 1.20.1 Forge style)
            const block = {
                ...(forgeConditions.length > 0 && { conditions: forgeConditions }),
                ...(fabricConditions.length > 0 && { 'fabric:load_conditions': fabricConditions }),
                ...(neoConditions.length > 0 && { 'neoforge:conditions': neoConditions }),
                recipe: coreRecipe
            };
            return { type: 'forge:conditional', recipes: [block] };
        }

        // Default: conditions at root (modern style, works for Create addon mods and 1.21.1 NeoForge)
        return {
            ...(forgeConditions.length > 0 && { conditions: forgeConditions }),
            ...(fabricConditions.length > 0 && { 'fabric:load_conditions': fabricConditions }),
            ...(neoConditions.length > 0 && { 'neoforge:conditions': neoConditions }),
            ...coreRecipe
        };
    }
}

function serializeConditionBlock(blockEl) {
    const type = blockEl.querySelector('.cond-type')?.value?.trim() || '';
    if (!type) return null;

    // Boolean — no fields needed
    if (type.endsWith(':true') || type.endsWith(':false')) {
        return { type };
    }

    // Nested list — forge:and, forge:or, neoforge:and, neoforge:or
    if (type.endsWith(':and') || type.endsWith(':or')) {
        const childRows = blockEl.querySelectorAll('.cond-nested-row');
        const values = [];
        for (const row of childRows) {
            const childType = row.querySelector('.cond-type')?.value?.trim();
            if (!childType) continue;
            const childBlock = serializeConditionBlock(row);
            if (childBlock) values.push(childBlock);
        }
        return { type, values };
    }

    // Nested single — forge:not, neoforge:not, fabric:not
    if ((type.startsWith('forge:') || type.startsWith('neoforge:')) && type.endsWith(':not')) {
        const childRow = blockEl.querySelector('.cond-nested-row');
        if (!childRow) return { type };
        const childBlock = serializeConditionBlock(childRow);
        return { type, value: childBlock || {} };
    }

    // Fabric multi-mod — values is array of mod ID rows
    if (type === 'fabric:all_mods_loaded' || type === 'fabric:any_mod_loaded') {
        const modRows = blockEl.querySelectorAll('.fabric-mod-row');
        if (modRows.length > 0) {
            const values = [...modRows].map((r) => r.querySelector('input')?.value?.trim()).filter(Boolean);
            return { condition: type, values };
        }
        // Fallback to single cond-val
        const val = blockEl.querySelector('.cond-val')?.value?.trim();
        const values = val
            ? val
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
            : [];
        return { condition: type, values };
    }

    // Fabric not
    if (type === 'fabric:not') {
        const childRow = blockEl.querySelector('.cond-nested-row');
        if (!childRow) return { condition: type };
        const childBlock = serializeConditionBlock(childRow);
        return { condition: type, value: childBlock || {} };
    }

    // Simple — mod_loaded, item_exists, tag_empty etc.
    const key = blockEl.querySelector('.cond-key')?.value?.trim();
    const val = blockEl.querySelector('.cond-val')?.value?.trim();
    const isFabric = type.startsWith('fabric:');
    const obj = isFabric ? { condition: type } : { type };
    if (key && val) obj[key] = val;
    return obj;
}

function serializeAllConditions() {
    const blocks = document.querySelectorAll('#conditionsContainer > .condition-node-wrapper');
    const forgeConditions = [];
    const fabricConditions = [];
    const neoConditions = [];

    for (const block of blocks) {
        const route = block.querySelector('.cond-route-select')?.value || 'both';
        const serialized = serializeConditionBlock(block);
        if (!serialized) continue;
        if (route === 'forge' || route === 'both') forgeConditions.push(serialized);
        if (route === 'fabric' || route === 'both') fabricConditions.push(serialized);
        if (route === 'neoforge' || route === 'both') neoConditions.push(serialized);
    }

    return { forgeConditions, fabricConditions, neoConditions };
}

window.buildConditionWrappedOutput = buildConditionWrappedOutput;
window.serializeConditionBlock = serializeConditionBlock;
window.serializeAllConditions = serializeAllConditions;
