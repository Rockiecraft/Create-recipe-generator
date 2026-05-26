function updateJEIPreview(currentActiveEngine, compiledIngredients, compiledResultsArray, firstOutputItemName) {
    const isBasinStyle = (currentActiveEngine === 'create:mixing' || currentActiveEngine === 'create:compacting');
    const jeiInEl = document.getElementById('jeiIn');
    const jeiGridEl = document.getElementById('jeiGrid');
    if (jeiInEl) jeiInEl.classList.toggle('hidden', !isBasinStyle);
    if (jeiGridEl) jeiGridEl.classList.toggle('hidden', !isBasinStyle);

    let graphicContainer = document.getElementById('jeiMachineSymbol');
    let outputClean = firstOutputItemName.includes(':') ? firstOutputItemName.split(':').pop() : firstOutputItemName;
    const jeiOutEl = document.getElementById('jeiOut');
    const jeiLabelEl = document.getElementById('jeiLabel');

    if (isBasinStyle) {
        if (jeiGridEl) {
            const gridSlots = jeiGridEl.children;
            for (let i = 0; i < gridSlots.length; i++) {
                gridSlots[i].innerHTML = "";
            }
            let textSlotIndex = 0;
            compiledIngredients.forEach(item => {
                if (item.item && textSlotIndex < gridSlots.length) {
                    let clean = item.item.includes(':') ? item.item.split(':').pop() : item.item;
                    gridSlots[textSlotIndex].innerHTML = `<span title="${item.item}">${clean}</span>`;
                    textSlotIndex++;
                }
            });
        }
        if (jeiInEl) {
            jeiInEl.innerHTML = "";
            compiledIngredients.forEach(item => {
                if (item.fluid) {
                    let cleanFluid = item.fluid.includes(':') ? item.fluid.split(':').pop() : item.fluid;
                    jeiInEl.innerHTML += `<div class="fluid-preview-bar-node" title="${item.fluid}">${cleanFluid} <br> ${item.amount}mB</div>`;
                }
            });
        }
        if (graphicContainer) {
            if (currentActiveEngine === 'create:mixing') {
                graphicContainer.innerHTML = `<div class="machine-base-casing"><div class="machine-mixer-head"></div></div>`;
            } else {
                graphicContainer.innerHTML = `<div class="machine-base-casing"><div class="machine-press-piston"></div></div>`;
            }
        }
        if (jeiOutEl) {
            jeiOutEl.innerHTML = "";
            compiledResultsArray.forEach(item => {
                let cleanRes = item.item || item.fluid || 'unknown';
                if (cleanRes.includes(':')) cleanRes = cleanRes.split(':').pop();
                let countTxt = item.count ? `x${item.count}` : `${item.amount}mB`;
                let chanceTxt = item.chance ? ` (${Math.round(item.chance * 100)}%)` : '';
                jeiOutEl.innerHTML += `<div class="jei-item-badge">${cleanRes} ${countTxt}${chanceTxt}</div>`;
            });
        }
        if (jeiLabelEl) {
            jeiLabelEl.textContent = currentActiveEngine === 'create:mixing' ? "Mechanical Mixer Basin Processing" : "Mechanical Press Compacting Process";
        }
    } else if (currentActiveEngine === 'create:sequenced_assembly') {
        if (graphicContainer) {
            graphicContainer.innerHTML = `<div class="assembly-conveyor-belt"><div class="assembly-track-arrow"></div></div>`;
        }
        if (jeiOutEl) {
            jeiOutEl.innerHTML = `<div class="jei-item-badge">${outputClean}</div>`;
        }
        if (jeiLabelEl) {
            jeiLabelEl.textContent = "Sequenced Assembly Factory Line Loop";
        }
    } else {
        if (graphicContainer) {
            if (currentActiveEngine === 'create:pressing') {
                graphicContainer.innerHTML = `<div class="kinetic-press-anim"></div>`;
            } else if (currentActiveEngine === 'create:cutting') {
                graphicContainer.innerHTML = `<div class="kinetic-saw-anim"></div>`;
            } else if (currentActiveEngine === 'create:crushing') {
                graphicContainer.innerHTML = `<div class="kinetic-wheels-anim"></div>`;
            } else if (currentActiveEngine === 'create:splashing') {
                graphicContainer.innerHTML = `<div class="kinetic-fan-water-anim"></div>`;
            } else if (currentActiveEngine === 'create:haunting') {
                graphicContainer.innerHTML = `<div class="kinetic-fan-soul-anim"></div>`;
            } else {
                graphicContainer.innerHTML = `<div class="kinetic-generic-gear"></div>`;
            }
        }
        if (jeiOutEl) {
            jeiOutEl.innerHTML = "";
            compiledResultsArray.forEach(item => {
                let cleanRes = item.item || 'unknown';
                if (cleanRes.includes(':')) cleanRes = cleanRes.split(':').pop();
                let chanceTxt = item.chance ? ` (${Math.round(item.chance * 100)}%)` : '';
                jeiOutEl.innerHTML += `<div class="jei-item-badge">${cleanRes} x${item.count || 1}${chanceTxt}</div>`;
            });
        }
        if (jeiLabelEl) {
            let engineClean = currentActiveEngine.split(':').pop().replace('_', ' ');
            jeiLabelEl.textContent = `Kinetic ${engineClean.toUpperCase()} Machine Process`;
        }
    }
}

function copyToClipboard() {
    const jsonText = document.getElementById('jsonOutput')?.textContent;
    if (!jsonText) return;

    navigator.clipboard.writeText(jsonText).then(() => {
        const copyBtn = document.querySelector('.code-card-header .add-slot-btn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied! ✅';
            copyBtn.style.background = '#4caf50';
            copyBtn.style.color = '#fff';

            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
                copyBtn.style.color = '';
            }, 1500);
        }
    }).catch(err => {
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
            filename = titleInput.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '.json';
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
