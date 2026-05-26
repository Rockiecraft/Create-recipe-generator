function generateCraftingGrid() {
    const container = document.getElementById('craftingGridMatrix');
    if (!container) return;


    if (container.parentElement) {
        container.parentElement.style.setProperty('display', 'flex', 'important');
        container.parentElement.style.setProperty('flex-direction', 'column', 'important');
        container.parentElement.style.setProperty('gap', '16px', 'important');
    }

    const width = parseInt(document.getElementById('craftingWidth').value, 10) || 3;
    const height = parseInt(document.getElementById('craftingHeight').value, 10) || 3;
    let html = '';
    for (let r = 0; r < height; r++) {
        html += '<div class="craft-matrix-row" style="display: flex !important; flex-direction: row !important; gap: 6px !important; justify-content: center !important; width: 100% !important; margin-bottom: 2px !important;">';
        for (let c = 0; c < width; c++) {
            html += `<input type="text" class="craft-cell" data-row="${r}" data-col="${c}" maxlength="1" value=" " oninput="updateCraftingKeysLegend(); if(typeof compileRecipe==='function')compileRecipe();" style="width: 24px !important; max-width: 24px !important; min-width: 24px !important; height: 24px !important; min-height: 24px !important; text-align: center !important; font-weight: bold !important; text-transform: uppercase !important; font-size: 12px !important; background: #1b1c24 !important; border: 1px solid #262836 !important; border-radius: 4px !important; color: #fff !important; outline: none !important; padding: 0 !important; flex: 0 0 24px !important;">`;
        }
        html += '</div>';
    }
    container.innerHTML = html;
    updateCraftingKeysLegend();
}

function updateCraftingKeysLegend() {
    const container = document.getElementById('craftingKeysLegendContainer');
    if (!container) return;


    if (container.parentElement && container.parentElement.style.width !== '100%') {
        container.parentElement.style.setProperty('width', '100%', 'important');
        container.parentElement.style.setProperty('max-width', '100%', 'important');
    }

    const width = parseInt(document.getElementById('craftingWidth').value, 10) || 3;
    const height = parseInt(document.getElementById('craftingHeight').value, 10) || 3;
    let discoveredKeys = new Set();
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            const input = document.querySelector(`.craft-cell[data-row="${r}"][data-col="${c}"]`);
            const char = input && input.value ? input.value.toUpperCase().trim() : "";
            if (char !== "") discoveredKeys.add(char);
        }
    }
    if (discoveredKeys.size === 0) {
        container.innerHTML = '<div style="font-size: 11px; color: #53586d; text-align: center; padding: 4px;">Type letters in the matrix array grid below to assign item mappings.</div>';
        return;
    }
    const ingredientInputs = document.querySelectorAll('#ingredientsContainer .ing-id, #standardInputs .ing-id');
    let dynamicOptionsHtml = '';
    ingredientInputs.forEach((inputField) => {
        const rawValue = inputField.value ? inputField.value.trim() : "";
        if (rawValue) dynamicOptionsHtml += `<option value="${rawValue}">${rawValue}</option>`;
    });
    if (!dynamicOptionsHtml) {
        dynamicOptionsHtml = `<option value="create:andesite_alloy">create:andesite_alloy</option><option value="minecraft:iron_ingot">minecraft:iron_ingot</option>`;
    }
    let html = '';
    Array.from(discoveredKeys).sort().forEach(key => {
        html += `
        <div style="display: flex; gap: 6px; align-items: center; width: 48%; min-width: 230px; background: #1b1c24; padding: 4px 6px; border-radius: 4px; border: 1px solid #262836; box-sizing: border-box;">
            <span style="font-size: 11px; font-weight: bold; color: var(--accent); width: 14px; text-align: center;">${key}</span>
            <select class="craft-key-type" data-key="${key}" onchange="if(typeof compileRecipe==='function')compileRecipe();" style="height: 24px !important; width: 60px !important; font-size: 11px !important; background: #14151c; color: #fff; border: 1px solid #232530; border-radius: 4px;">
                <option value="item">item</option>
                <option value="tag">tag</option>
            </select>
            <select class="craft-key-resource" data-key="${key}" onchange="if(typeof compileRecipe==='function')compileRecipe();" style="height: 24px !important; flex: 1 !important; font-size: 11px !important; background: #14151c !important; color: #fff; border: 1px solid #232530; border-radius: 4px; padding: 0 4px; width: 100%; min-width: 0;">
                ${dynamicOptionsHtml}
            </select>
        </div>`;
    });
    container.innerHTML = html;
}
