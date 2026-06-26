// ── ui-condition-blocks.js ────────────────────────────────────────────────

const presets = {
    'forge:mod_loaded':       { id: 'forge:mod_loaded',       key: 'modid',  val: '', route: 'forge',    label: 'Forge: Mod Loaded' },
    'forge:item_exists':      { id: 'forge:item_exists',      key: 'item',   val: '', route: 'forge',    label: 'Forge: Item Exists' },
    'forge:tag_empty':        { id: 'forge:tag_empty',        key: 'tag',    val: '', route: 'forge',    label: 'Forge: Tag Empty' },
    'forge:true':             { id: 'forge:true',             key: '',       val: '', route: 'forge',    label: 'Forge: Always True' },
    'forge:false':            { id: 'forge:false',            key: '',       val: '', route: 'forge',    label: 'Forge: Always False' },
    'forge:and':              { id: 'forge:and',              key: 'values', val: '', route: 'forge',    label: 'Forge: And (All must pass)' },
    'forge:or':               { id: 'forge:or',               key: 'values', val: '', route: 'forge',    label: 'Forge: Or (Any must pass)' },
    'forge:not':              { id: 'forge:not',              key: 'value',  val: '', route: 'forge',    label: 'Forge: Not (Invert)' },
    'neoforge:mod_loaded':    { id: 'neoforge:mod_loaded',    key: 'modid',  val: '', route: 'neoforge', label: 'NeoForge: Mod Loaded' },
    'neoforge:item_exists':   { id: 'neoforge:item_exists',   key: 'item',   val: '', route: 'neoforge', label: 'NeoForge: Item Exists' },
    'neoforge:tag_empty':     { id: 'neoforge:tag_empty',     key: 'tag',    val: '', route: 'neoforge', label: 'NeoForge: Tag Empty' },
    'neoforge:true':          { id: 'neoforge:true',          key: '',       val: '', route: 'neoforge', label: 'NeoForge: Always True' },
    'neoforge:false':         { id: 'neoforge:false',         key: '',       val: '', route: 'neoforge', label: 'NeoForge: Always False' },
    'neoforge:and':           { id: 'neoforge:and',           key: 'values', val: '', route: 'neoforge', label: 'NeoForge: And (All must pass)' },
    'neoforge:or':            { id: 'neoforge:or',            key: 'values', val: '', route: 'neoforge', label: 'NeoForge: Or (Any must pass)' },
    'neoforge:not':           { id: 'neoforge:not',           key: 'value',  val: '', route: 'neoforge', label: 'NeoForge: Not (Invert)' },
    'fabric:all_mods_loaded': { id: 'fabric:all_mods_loaded', key: 'values', val: '', route: 'fabric',   label: 'Fabric: All Mods Loaded' },
    'fabric:any_mod_loaded':  { id: 'fabric:any_mod_loaded',  key: 'values', val: '', route: 'fabric',   label: 'Fabric: Any Mod Loaded' },
    'fabric:not':             { id: 'fabric:not',             key: 'value',  val: '', route: 'fabric',   label: 'Fabric: Not (Invert)' },
};

let conditionCount = 0;

// ── Shared styles ──────────────────────────────────────────────────────────
const S = {
    label:  'color:#7d8296;font-size:10px;font-weight:600;text-transform:uppercase;margin:0;display:block;margin-bottom:2px;',
    input:  'height:22px;padding:1px 6px;font-size:11px;background:#0f1014;border:1px solid #2a2b3a;color:#fff;border-radius:4px;outline:none;',
    row:    'display:flex;flex-direction:row;align-items:flex-end;gap:10px;margin-top:10px;flex-wrap:wrap;',
    nested: 'margin-top:8px;background:#0d0e14;border:1px solid #1e1f2a;border-radius:4px;padding:10px;',
    addBtn: 'background:#1e1f2a;color:#7d8296;border:1px solid #2a2b3a;padding:3px 10px;border-radius:4px;font-size:11px;cursor:pointer;margin-top:6px;',
};

// ── Nested row HTML (recursive, used by not/and/or) ──────────────────────
function getNestedRowHTML(nestId) {
    return `
    <div class="cond-nested-row" id="nested_${nestId}" style="${S.nested}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <select class="cond-nested-preset" style="height:22px;padding:1px 6px;font-size:11px;background:#09090d;border:1px solid #2a2b3a;color:#fff;border-radius:4px;"
                onchange="applyNestedPreset(this, 'nested_${nestId}'); compileRecipe();">
                <option value="custom">✨ Custom</option>
                <optgroup label="── Forge ──">
                    <option value="forge:mod_loaded">Forge: Mod Loaded</option>
                    <option value="forge:item_exists">Forge: Item Exists</option>
                    <option value="forge:tag_empty">Forge: Tag Empty</option>
                    <option value="forge:true">Forge: Always True</option>
                    <option value="forge:false">Forge: Always False</option>
                    <option value="forge:and">Forge: And</option>
                    <option value="forge:or">Forge: Or</option>
                    <option value="forge:not">Forge: Not</option>
                </optgroup>
                <optgroup label="── NeoForge ──">
                    <option value="neoforge:mod_loaded">NeoForge: Mod Loaded</option>
                    <option value="neoforge:item_exists">NeoForge: Item Exists</option>
                    <option value="neoforge:tag_empty">NeoForge: Tag Empty</option>
                    <option value="neoforge:true">NeoForge: Always True</option>
                    <option value="neoforge:false">NeoForge: Always False</option>
                    <option value="neoforge:and">NeoForge: And</option>
                    <option value="neoforge:or">NeoForge: Or</option>
                    <option value="neoforge:not">NeoForge: Not</option>
                </optgroup>
                <optgroup label="── Fabric ──">
                    <option value="fabric:all_mods_loaded">Fabric: All Mods Loaded</option>
                    <option value="fabric:any_mod_loaded">Fabric: Any Mod Loaded</option>
                    <option value="fabric:not">Fabric: Not</option>
                </optgroup>
            </select>
            <span style="color:#ff4d4d;font-size:11px;cursor:pointer;" onclick="document.getElementById('nested_${nestId}').remove(); compileRecipe();">✕ Remove</span>
        </div>
        <div class="nested-fields" style="${S.row}">
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Condition Type</label>
                <input type="text" class="cond-type" value="" style="${S.input}width:160px;" oninput="compileRecipe();"/>
            </div>
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Key</label>
                <input type="text" class="cond-key" value="" style="${S.input}width:80px;" oninput="compileRecipe();"/>
            </div>
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Value</label>
                <input type="text" class="cond-val" value="" style="${S.input}width:120px;" oninput="compileRecipe();"/>
            </div>
        </div>
        <div class="nested-children"></div>
    </div>`;
}

function applyNestedPreset(selectEl, nestId) {
    const val = selectEl.value;
    const preset = presets[val] || { id: '', key: '', val: '' };
    const row = document.getElementById(nestId);
    if (!row) return;

    const fields = row.querySelector('.nested-fields');
    const childrenDiv = row.querySelector('.nested-children');
    childrenDiv.innerHTML = '';

    if (val.endsWith(':true') || val.endsWith(':false')) {
        fields.innerHTML = `
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Condition Type</label>
                <input type="text" class="cond-type" value="${preset.id}" style="${S.input}width:160px;" oninput="compileRecipe();"/>
            </div>
            <span style="font-size:11px;color:#7d8296;align-self:flex-end;padding-bottom:3px;">No additional fields required.</span>`;
    } else if (val.endsWith(':and') || val.endsWith(':or')) {
        fields.innerHTML = `
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Condition Type</label>
                <input type="text" class="cond-type" value="${preset.id}" style="${S.input}width:160px;" oninput="compileRecipe();"/>
            </div>`;
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.style.cssText = S.addBtn;
        addBtn.textContent = '+ Add Child Condition';
        addBtn.onclick = () => { addNestedChild(childrenDiv); compileRecipe(); };
        childrenDiv.appendChild(addBtn);
    } else if (val.endsWith(':not')) {
        fields.innerHTML = `
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Condition Type</label>
                <input type="text" class="cond-type" value="${preset.id}" style="${S.input}width:160px;" oninput="compileRecipe();"/>
            </div>`;
        const id = ++conditionCount;
        childrenDiv.innerHTML = getNestedRowHTML('not_' + nestId + '_' + id);
    } else {
        fields.innerHTML = `
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Condition Type</label>
                <input type="text" class="cond-type" value="${preset.id}" style="${S.input}width:160px;" oninput="compileRecipe();"/>
            </div>
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">${preset.key || 'Key'}</label>
                <input type="text" class="cond-key" value="${preset.key}" style="${S.input}width:80px;" oninput="compileRecipe();"/>
            </div>
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Value</label>
                <input type="text" class="cond-val" value="${preset.val}" style="${S.input}width:120px;" oninput="compileRecipe();"/>
            </div>`;
    }
}

function addNestedChild(container) {
    const id = ++conditionCount;
    const div = document.createElement('div');
    div.innerHTML = getNestedRowHTML('child_' + id);
    container.appendChild(div.firstElementChild);
}

// ── Top-level block HTML builders ─────────────────────────────────────────

function getBlockHeader(id, label, route) {
    return `
    <div class="cond-header-line" style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2a2b3a;padding-bottom:6px;margin-bottom:8px;">
        <span style="font-size:11px;font-weight:bold;color:var(--accent);text-transform:uppercase;letter-spacing:0.5px;">${label}</span>
        <span style="color:#ff4d4d;cursor:pointer;font-size:11px;font-weight:bold;" onclick="document.getElementById('cond_${id}').remove(); compileRecipe();">Delete</span>
    </div>
    <div style="${S.row}margin-top:0;">
        <div style="display:flex;flex-direction:column;gap:2px;">
            <label style="${S.label}">Target Module Scope Routing</label>
            <select class="cond-route-select" onchange="compileRecipe();"
                style="height:22px;padding:1px 6px;font-size:11px;background:#09090d;border:1px solid #2a2b3a;color:#fff;border-radius:4px;width:260px;">
                <option value="both" ${route==='both'?'selected':''}>🌐 Global (Inject into all platforms)</option>
                <option value="forge" ${route==='forge'?'selected':''}>🛠 Forge Only Module (conditions)</option>
                <option value="fabric" ${route==='fabric'?'selected':''}>🔮 Fabric Only Module (fabric:load_conditions)</option>
                <option value="neoforge" ${route==='neoforge'?'selected':''}>⚙️ NeoForge Only Module (neoforge:conditions)</option>
            </select>
        </div>
    </div>`;
}

function getSimpleBlockHTML(id, preset) {
    const keyLabel = preset.key || 'Value';
    return `
    <div class="condition-node-wrapper" id="cond_${id}" style="margin-top:12px;background:#09090d;border:1px solid #2a2b3a;padding:12px;border-radius:6px;">
        ${getBlockHeader(id, preset.label, preset.route)}
        <div style="${S.row}">
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Condition Type</label>
                <input type="text" class="cond-type" value="${preset.id}"
                    style="${S.input}width:180px;" oninput="compileRecipe();"/>
            </div>
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">${keyLabel}</label>
                <input type="text" class="cond-key" value="${preset.key}"
                    style="${S.input}width:80px;display:none;" oninput="compileRecipe();"/>
                <input type="text" class="cond-val" placeholder="Enter ${keyLabel}..."
                    style="${S.input}width:200px;" oninput="compileRecipe();"/>
            </div>
        </div>
    </div>`;
}

function getBooleanBlockHTML(id, preset) {
    return `
    <div class="condition-node-wrapper" id="cond_${id}" style="margin-top:12px;background:#09090d;border:1px solid #2a2b3a;padding:12px;border-radius:6px;">
        ${getBlockHeader(id, preset.label, preset.route)}
        <div style="${S.row}">
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Condition Type</label>
                <input type="text" class="cond-type" value="${preset.id}"
                    style="${S.input}width:180px;" oninput="compileRecipe();"/>
            </div>
            <span style="font-size:11px;color:#7d8296;align-self:flex-end;padding-bottom:3px;">No additional fields required.</span>
        </div>
    </div>`;
}

function getFabricModsBlockHTML(id, preset) {
    return `
    <div class="condition-node-wrapper" id="cond_${id}" style="margin-top:12px;background:#09090d;border:1px solid #2a2b3a;padding:12px;border-radius:6px;">
        ${getBlockHeader(id, preset.label, preset.route)}
        <div style="${S.row}">
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Condition Type</label>
                <input type="text" class="cond-type" value="${preset.id}"
                    style="${S.input}width:180px;" oninput="compileRecipe();"/>
            </div>
        </div>
        <div class="fabric-mod-rows" style="display:flex;flex-direction:column;gap:6px;margin-top:10px;">
            <div class="fabric-mod-row" style="display:flex;align-items:center;gap:6px;">
                <input type="text" placeholder="mod_id" class="cond-val"
                    style="${S.input}width:200px;" oninput="compileRecipe();"/>
                <span style="color:#ff4d4d;font-size:11px;cursor:pointer;"
                    onclick="this.parentElement.remove(); compileRecipe();">✕</span>
            </div>
        </div>
        <button type="button" style="${S.addBtn}" onclick="addFabricModRow('cond_${id}')">+ Add Mod ID</button>
    </div>`;
}

function getNotBlockHTML(id, preset) {
    const firstNestedId = 'not_' + id + '_1';
    return `
    <div class="condition-node-wrapper" id="cond_${id}" style="margin-top:12px;background:#09090d;border:1px solid #2a2b3a;padding:12px;border-radius:6px;">
        ${getBlockHeader(id, preset.label, preset.route)}
        <div style="${S.row}">
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Condition Type</label>
                <input type="text" class="cond-type" value="${preset.id}"
                    style="${S.input}width:180px;" oninput="compileRecipe();"/>
            </div>
        </div>
        <div style="margin-top:8px;">
            <label style="${S.label}margin-bottom:4px;">Inverted Condition</label>
            ${getNestedRowHTML(firstNestedId)}
        </div>
    </div>`;
}

function getListBlockHTML(id, preset) {
    return `
    <div class="condition-node-wrapper" id="cond_${id}" style="margin-top:12px;background:#09090d;border:1px solid #2a2b3a;padding:12px;border-radius:6px;">
        ${getBlockHeader(id, preset.label, preset.route)}
        <div style="${S.row}">
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Condition Type</label>
                <input type="text" class="cond-type" value="${preset.id}"
                    style="${S.input}width:180px;" oninput="compileRecipe();"/>
            </div>
        </div>
        <div class="nested-children" style="margin-top:8px;display:flex;flex-direction:column;gap:6px;"></div>
        <button type="button" style="${S.addBtn}" onclick="addListChild('cond_${id}')">+ Add Child Condition</button>
    </div>`;
}

function getCustomBlockHTML(id) {
    return `
    <div class="condition-node-wrapper" id="cond_${id}" style="margin-top:12px;background:#09090d;border:1px solid #2a2b3a;padding:12px;border-radius:6px;">
        ${getBlockHeader(id, 'Custom Condition Block', 'both')}
        <div style="${S.row}">
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Condition Type</label>
                <input type="text" class="cond-type" value=""
                    style="${S.input}width:180px;" oninput="compileRecipe();"/>
            </div>
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Parameter Key</label>
                <input type="text" class="cond-key" value=""
                    style="${S.input}width:90px;" oninput="compileRecipe();"/>
            </div>
            <div style="display:flex;flex-direction:column;">
                <label style="${S.label}">Expected Value</label>
                <input type="text" class="cond-val" value=""
                    style="${S.input}width:140px;" oninput="compileRecipe();"/>
            </div>
        </div>
    </div>`;
}

// ── Public: add/remove fabric mod rows, list children ─────────────────────

function addFabricModRow(blockId) {
    const block = document.getElementById(blockId);
    if (!block) return;
    const rowsDiv = block.querySelector('.fabric-mod-rows');
    if (!rowsDiv) return;
    const div = document.createElement('div');
    div.className = 'fabric-mod-row';
    div.style.cssText = 'display:flex;align-items:center;gap:6px;';
    div.innerHTML = `
        <input type="text" placeholder="mod_id" class="cond-val"
            style="${S.input}width:200px;" oninput="compileRecipe();"/>
        <span style="color:#ff4d4d;font-size:11px;cursor:pointer;"
            onclick="this.parentElement.remove(); compileRecipe();">✕</span>`;
    rowsDiv.appendChild(div);
    compileRecipe();
}

function addListChild(blockId) {
    const block = document.getElementById(blockId);
    if (!block) return;
    const childrenDiv = block.querySelector('.nested-children');
    if (!childrenDiv) return;
    const id = ++conditionCount;
    const div = document.createElement('div');
    div.innerHTML = getNestedRowHTML('child_' + id);
    childrenDiv.appendChild(div.firstElementChild);
    compileRecipe();
}

// ── Main entry point ──────────────────────────────────────────────────────

function addConditionBlock() {
    const selectDropdown = document.getElementById('conditionSelector');
    const selectValue = selectDropdown ? selectDropdown.value : 'custom';
    const preset = presets[selectValue];
    conditionCount++;
    const id = conditionCount;

    const container = document.getElementById('conditionsContainer');
    const div = document.createElement('div');

    if (!preset || selectValue === 'custom') {
        div.innerHTML = getCustomBlockHTML(id);
    } else if (selectValue.endsWith(':true') || selectValue.endsWith(':false')) {
        div.innerHTML = getBooleanBlockHTML(id, preset);
    } else if (selectValue === 'fabric:all_mods_loaded' || selectValue === 'fabric:any_mod_loaded') {
        div.innerHTML = getFabricModsBlockHTML(id, preset);
    } else if (selectValue.endsWith(':not')) {
        div.innerHTML = getNotBlockHTML(id, preset);
    } else if (selectValue.endsWith(':and') || selectValue.endsWith(':or')) {
        div.innerHTML = getListBlockHTML(id, preset);
    } else {
        div.innerHTML = getSimpleBlockHTML(id, preset);
    }

    container.appendChild(div.firstElementChild);
    compileRecipe();
}

window.addConditionBlock = addConditionBlock;
window.addFabricModRow = addFabricModRow;
window.addListChild = addListChild;
window.applyNestedPreset = applyNestedPreset;
window.presets = presets;