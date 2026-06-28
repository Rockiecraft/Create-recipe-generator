function copyToClipboard() {
    const jsonText = document.getElementById('jsonOutput')?.textContent;
    if (!jsonText) return;

    navigator.clipboard
        .writeText(jsonText)
        .then(() => {
            const copyBtn = document.getElementById('copyTextBtn');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                copyBtn.style.background = '#20c997';
                copyBtn.style.color = '#121212';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.background = '';
                    copyBtn.style.color = '';
                }, 1500);
            }
        })
        .catch((err) => {
            console.error('Failed to copy text: ', err);
        });
}

function downloadRecipeJson() {
    const jsonText = document.getElementById('jsonOutput')?.textContent;
    if (!jsonText) return;

    try {
        const parsed = JSON.parse(jsonText);
        const engineType = (parsed.type || parsed.engine || 'recipe').split(':').pop();

        let filename = 'recipe.json';
        const titleInput = document.getElementById('recipeTitle');
        if (titleInput && titleInput.value.trim()) {
            filename =
                titleInput.value
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '_') + '.json';
        } else {
            filename = `${engineType}_recipe.json`;
        }

        const blob = new Blob([jsonText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    } catch (e) {
        console.error('Failed to generate filename from invalid JSON:', e);
    }
}

function updateCodePreviewPaneOnly() {
    if (typeof activeRecipeId === 'undefined' || !activeRecipeId || !recipesDatabase || !recipesDatabase[activeRecipeId]) return;

    const recipeOutputElement = document.getElementById('codePreview');
    if (!recipeOutputElement) return;

    let ingredientsArray = [];
    let outputsArray = [];

    const containerIngList = document.getElementById('ingredientsContainer');
    if (containerIngList) {
        for (let row of containerIngList.children) {
            let idInput = row.querySelector('.ing-id');
            let fluidCheck = row.querySelector('.ing-is-fluid');
            let countInput = row.querySelector('.ing-count');

            if (idInput && idInput.value.trim() !== '') {
                ingredientsArray.push({
                    id: idInput.value.trim(),
                    isFluid: fluidCheck ? fluidCheck.checked : false,
                    amount: countInput ? parseInt(countInput.value) || 1 : 1
                });
            }
        }
    }

    const containerOutList = document.getElementById('outputsContainer');
    if (containerOutList) {
        for (let row of containerOutList.children) {
            let idInput = row.querySelector('.out-id') || row.querySelector('input[type="text"]');
            let countInput = row.querySelector('.out-count');
            let fluidCheck = row.querySelector('.out-is-fluid');
            let chanceInput = row.querySelector('.out-chance');

            if (idInput && idInput.value.trim() !== '') {
                outputsArray.push({
                    id: idInput.value.trim(),
                    count: countInput ? parseInt(countInput.value) || 1 : 1,
                    isFluid: fluidCheck ? fluidCheck.checked : false,
                    chance: chanceInput ? parseFloat(chanceInput.value) || 1.0 : 1.0
                });
            }
        }
    }

    let coreRecipe = {};
    const rawEngine = currentActiveEngine || 'create:mixing';
    const currentEngineCode = rawEngine.includes('create:') ? rawEngine.split(':')[1] : rawEngine;

    if (['mixing', 'compacting'].includes(currentEngineCode)) {
        if (typeof compileBasinRecipe === 'function') coreRecipe = compileBasinRecipe(currentEngineCode, ingredientsArray, outputsArray);
    } else if (currentEngineCode === 'pressing' && typeof compilePressingRecipe === 'function') {
        coreRecipe = compilePressingRecipe(ingredientsArray, outputsArray);
    } else if (currentEngineCode === 'sequenced_assembly' && typeof compileSequencedAssemblyRecipe === 'function') {
        coreRecipe = compileSequencedAssemblyRecipe(ingredientsArray, outputsArray);
    } else if (currentEngineCode === 'mechanical_crafting' && typeof compileAssemblyRecipe === 'function') {
        coreRecipe = compileAssemblyRecipe(outputsArray);
    }

    recipeOutputElement.textContent = JSON.stringify(coreRecipe, null, 4);
}

function handleAutomatedWorkspacePurge(shouldReset) {
    if (!shouldReset) return;
    // Clear form when paste area is emptied
    syncRecipeCodeLineNumbers();
    autoGrowRecipeTextarea();
}
