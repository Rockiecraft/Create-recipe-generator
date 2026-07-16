/**
 * plugin-api.js
 *
 * Provides window.RecipeGeneratorAPI for third-party addon authors to register
 * new recipe engines without touching any core files.
 *
 * Core engines (ENGINE_DISPATCH, RECIPE_TEMPLATES) are never modified here.
 * Plugin engines live in PLUGIN_DISPATCH / PLUGIN_TEMPLATES, which are checked
 * as a fallback by getEngineModule() and the compiler.
 *
 * Load order: after recipe-templates.js, before engine-dispatch.js's patched
 * getEngineModule, before main.js.
 */

window.PLUGIN_DISPATCH = {};
window.PLUGIN_TEMPLATES = {};

// Internal registry of mod groups: { id, label, color }
const _pluginModGroups = {};

// Internal registry of engines per mod group: { groupId: [engineKey, ...] }
const _pluginGroupEngines = {};

/**
 * Validate a plugin config object. Throws a descriptive error on bad input
 * so plugin authors get an immediate, readable message in the console.
 */
function _validatePluginConfig(config) {
    if (!config || typeof config !== 'object') {
        throw new Error('RecipeGeneratorAPI.registerEngine: config must be an object.');
    }
    if (typeof config.key !== 'string' || !config.key.includes(':')) {
        throw new Error('RecipeGeneratorAPI.registerEngine: config.key must be a namespaced string (e.g. "myaddon:my_machine").');
    }
    if (typeof config.label !== 'string' || !config.label.trim()) {
        throw new Error('RecipeGeneratorAPI.registerEngine: config.label must be a non-empty string.');
    }
    if (!config.template || typeof config.template !== 'object') {
        throw new Error('RecipeGeneratorAPI.registerEngine: config.template must be an object.');
    }
    if (!config.data || typeof config.data.save !== 'function' || typeof config.data.restore !== 'function' || typeof config.data.fromJson !== 'function' || typeof config.data.createEmptyData !== 'function') {
        throw new Error('RecipeGeneratorAPI.registerEngine: config.data must implement save(), restore(), fromJson(), and createEmptyData().');
    }
    if (typeof config.compile !== 'function') {
        throw new Error('RecipeGeneratorAPI.registerEngine: config.compile must be a function.');
    }
    if (!config.ui || typeof config.ui !== 'object') {
        throw new Error('RecipeGeneratorAPI.registerEngine: config.ui must be an object.');
    }
}

/**
 * Resolve the mod group for a plugin engine config.
 * - string 'create'  → slot into the existing Create tab group
 * - string (other)   → treated as a group id; must have been registered already or creates a minimal group
 * - object           → { id, label, color } — creates the group if it doesn't exist yet
 * Returns the resolved group id string.
 */
function _resolveModGroup(modGroup) {
    
    if (!modGroup) return 'create';

    if (typeof modGroup === 'string') {
        if (modGroup === 'create') return 'create';
       
        if (!_pluginModGroups[modGroup]) {
            _pluginModGroups[modGroup] = { id: modGroup, label: modGroup, color: 'var(--accent)' };
            _ensureModGroupTabExists(modGroup);
        }
        return modGroup;
    }

    if (typeof modGroup === 'object') {
        const id = modGroup.id;
        if (!id || typeof id !== 'string') {
            throw new Error('RecipeGeneratorAPI.registerEngine: modGroup.id must be a string.');
        }
        if (!_pluginModGroups[id]) {
            _pluginModGroups[id] = {
                id,
                label: modGroup.label || id,
                color: modGroup.color || 'var(--accent)'
            };
            _ensureModGroupTabExists(id);
        }
        return id;
    }

    throw new Error('RecipeGeneratorAPI.registerEngine: modGroup must be a string or object.');
}

/**
 * Create a mod group tab button in the tab bar if it doesn't already exist.
 * For the 'create' group this is a no-op (it's hardcoded in engine-tabs.js).
 */
function _ensureModGroupTabExists(groupId) {
    if (groupId === 'create') return;

    const tabRow = document.getElementById('modGroupTabsRow');
    if (!tabRow) return; 

    if (tabRow.querySelector(`[data-mod="${groupId}"]`)) return; // already exists

    const group = _pluginModGroups[groupId];
    const btn = document.createElement('button');
    btn.className = 'engine-mod-tab';
    btn.setAttribute('data-mod', groupId);
    btn.textContent = group.label;
    if (group.color) btn.style.setProperty('--mod-tab-accent', group.color);
    btn.addEventListener('click', function () {
        if (typeof switchModTab === 'function') switchModTab(this);
    });
    tabRow.appendChild(btn);

    const outer = document.getElementById('pluginEngineTabsOuter');
    if (outer) outer.style.display = '';

    if (!document.getElementById(`pluginTabsInner_${groupId}`)) {
        const inner = document.createElement('div');
        inner.id = `pluginTabsInner_${groupId}`;
        inner.className = 'engine-tabs-inner plugin-engine-tabs-inner';
        inner.style.display = 'none'; 
        const row = document.createElement('div');
        row.className = 'engine-tabs-row plugin-engine-tabs-row';
        row.id = `pluginTabsRow_${groupId}`;
        inner.appendChild(row);
        if (outer) {
            outer.appendChild(inner);
            outer.style.display = 'block'; 
        }
    }
}

/**
 * Add an engine tab button into the appropriate group's tab row.
 */
function _appendEngineTab(engineKey, label, groupId) {
    if (groupId === 'create') {

        const coreInner = document.getElementById('coreEngineTabsInner');
        if (!coreInner) return;
        let pluginRow = document.getElementById('pluginTabsRowCreate');
        if (!pluginRow) {
            pluginRow = document.createElement('div');
            pluginRow.className = 'engine-tabs-row plugin-engine-tabs-row';
            pluginRow.id = 'pluginTabsRowCreate';
            coreInner.appendChild(pluginRow);
        }
        const btn = document.createElement('button');
        btn.className = 'engine-tab plugin-engine-tab';
        btn.setAttribute('data-engine', engineKey);
        btn.textContent = label;
        btn.addEventListener('click', function () {
            if (typeof switchEngine === 'function') switchEngine(this);
        });
        pluginRow.appendChild(btn);
        return;
    }

    const row = document.getElementById(`pluginTabsRow_${groupId}`);
    if (!row) return;
    const btn = document.createElement('button');
    btn.className = 'engine-tab plugin-engine-tab';
    btn.setAttribute('data-engine', engineKey);
    btn.textContent = label;
    btn.addEventListener('click', function () {
        if (typeof switchEngine === 'function') switchEngine(this);
    });
    row.appendChild(btn);
}

/**
 * Build the recipe form panel for a plugin engine and inject it into
 * #pluginRecipeFormSlot. Called by the engine restore path when a plugin
 * engine is activated.
 *
 * config.ui shape:
 * {
 *   inputPanel: 'standard' | 'basin' | 'filling' | 'assembly' | 'mechanical_crafting' | fn → htmlString,
 *   outputPanel: 'simple' | 'fluid',
 *   hasProcessingTime: bool,
 *   hasHeatRequirement: bool,
 * }
 */
function renderPluginRecipeForm(config) {
    const slot = document.getElementById('pluginRecipeFormSlot');
    if (!slot) return;

    if (typeof config.ui.inputPanel === 'function') {
        slot.innerHTML = config.ui.inputPanel();
        slot.classList.remove('hidden');
    } else {
        slot.innerHTML = '';
        slot.classList.add('hidden');
    }
}

window.RecipeGeneratorAPI = {
    /**
     * Register a new recipe engine.
     *
     * @param {object} config
     * @param {string}          config.key          Namespaced engine key, e.g. 'myaddon:my_machine'
     * @param {string}          config.label         Tab button label
     * @param {string|object}  [config.modGroup]    'create' | groupId string | { id, label, color }
     * @param {object}          config.template      Base JSON template object
     * @param {object}          config.data          { save, restore, fromJson, createEmptyData }
     * @param {function}        config.compile       (recipe, engineKey) => compiledObject
     * @param {object}          config.ui            { inputPanel, outputPanel, hasProcessingTime, hasHeatRequirement }
     */
    registerEngine(config) {
        try {
            _validatePluginConfig(config);
        } catch (err) {
            console.error(err.message);
            return;
        }

        const key = config.key;

        if (window.ENGINE_DISPATCH && window.ENGINE_DISPATCH[key]) {
            console.warn(`RecipeGeneratorAPI: engine key "${key}" is already registered as a core engine. Skipping.`);
            return;
        }
        if (window.PLUGIN_DISPATCH[key]) {
            console.warn(`RecipeGeneratorAPI: engine key "${key}" is already registered as a plugin engine. Skipping.`);
            return;
        }

        window.PLUGIN_DISPATCH[key] = {
            save:     (recipe, engineKey) => config.data.save(recipe, engineKey),
            restore:  (recipe, engineKey) => {
                renderPluginRecipeForm(config);
                config.data.restore(recipe, engineKey);
            },
            compile:  (recipe, engineKey) => config.compile(recipe, engineKey),
            fromJson: (data, engineKey)   => config.data.fromJson(data, engineKey),
            ui: config.ui,
        };
        window.PLUGIN_TEMPLATES[key] = config.template;

        window.PLUGIN_DISPATCH[key]._label = config.label;

        const groupId = _resolveModGroup(config.modGroup || 'create');
        if (!_pluginGroupEngines[groupId]) _pluginGroupEngines[groupId] = [];
        _pluginGroupEngines[groupId].push(key);

        _appendEngineTab(key, config.label, groupId);

        console.log(`RecipeGeneratorAPI: registered engine "${key}" under group "${groupId}".`);
    },

    getPluginEngine(key) {
        return window.PLUGIN_DISPATCH[key] || null;
    },

  
    getAllPluginEngineKeys() {
        return Object.keys(window.PLUGIN_DISPATCH);
    },

    getAllPluginModGroups() {
        return Object.values(_pluginModGroups);
    },


    getPluginEngineUI(key) {
        return window.PLUGIN_DISPATCH[key]?.ui || null;
    },
};


document.addEventListener('DOMContentLoaded', function () {

    _restorePersistedPlugins();

   
    Object.keys(_pluginModGroups).forEach(function (groupId) {
        _ensureModGroupTabExists(groupId);
    });
    Object.keys(window.PLUGIN_DISPATCH).forEach(function (key) {
        if (!document.querySelector(`.engine-tab[data-engine="${key}"]`)) {
            const groupId = Object.keys(_pluginGroupEngines).find(
                g => _pluginGroupEngines[g].includes(key)
            ) || 'create';
            _appendEngineTab(key, window.PLUGIN_DISPATCH[key]._label || key, groupId);
        }
    });

    // Render the loaded plugins list in the modal
    _renderLoadedPluginList();
});

// ---------------------------------------------------------------------------
// In-app plugin loading UI
// Lets the user pick a local .js plugin file via the "+" button next to the
// mod group tabs, and dynamically injects it as a <script> tag so it can call
// RecipeGeneratorAPI.registerEngine(...) immediately.
// ---------------------------------------------------------------------------

function openAddPluginModal() {
    const modal = document.getElementById('addPluginModal');
    if (modal) modal.style.display = 'flex';
    const status = document.getElementById('addPluginStatus');
    if (status) status.textContent = '';
    _renderLoadedPluginList();
}
window.openAddPluginModal = openAddPluginModal;

function closeAddPluginModal() {
    const modal = document.getElementById('addPluginModal');
    if (modal) modal.style.display = 'none';
}
window.closeAddPluginModal = closeAddPluginModal;

function handlePluginFilesSelected(files) {
    const status = document.getElementById('addPluginStatus');
    if (!files || files.length === 0) return;

    const jsFiles = Array.from(files).filter(f => f.name.endsWith('.js'));
    if (jsFiles.length === 0) {
        if (status) { status.style.color = '#ff5e5b'; status.textContent = 'Please select .js files only.'; }
        return;
    }

    let loaded = 0;
    let failed = 0;

    function updateStatus() {
        const total = jsFiles.length;
        if (loaded + failed < total) return;
        if (failed === 0) {
            status.style.color = '#20c997';
            status.textContent = total === 1
                ? `Loaded "${jsFiles[0].name}" successfully.`
                : `Loaded ${total} plugins successfully.`;
        } else {
            status.style.color = '#ff5e5b';
            status.textContent = `${loaded} loaded, ${failed} failed.`;
        }
        const input = document.getElementById('pluginFileInput');
        if (input) input.value = '';
    }

    jsFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const code = e.target.result;
                const scriptEl = document.createElement('script');
                scriptEl.textContent = code;
                scriptEl.setAttribute('data-plugin-source', file.name);
                document.body.appendChild(scriptEl);
                _persistPlugin(file.name, code);
                loaded++;
            } catch (err) {
                console.error(`Failed to execute plugin "${file.name}":`, err);
                failed++;
            }
            updateStatus();
        };
        reader.onerror = function () {
            console.error(`Failed to read plugin file "${file.name}"`);
            failed++;
            updateStatus();
        };
        reader.readAsText(file);
    });
}
window.handlePluginFilesSelected = handlePluginFilesSelected;

// Keep the old single-file name as an alias so any existing callers don't break
window.handlePluginFileSelected = (file) => handlePluginFilesSelected(file ? [file] : []);

// ---------------------------------------------------------------------------
// Plugin persistence
// Loaded plugin code is stored in localStorage under 'plugin_registry' so
// plugins survive app restarts. The user can remove individual plugins via
// right-click -> Remove in the plugin modal's loaded list.
// ---------------------------------------------------------------------------

const PLUGIN_REGISTRY_KEY = 'create_recipe_generator_plugins';

function _loadPluginRegistry() {
    try {
        return JSON.parse(localStorage.getItem(PLUGIN_REGISTRY_KEY) || '[]');
    } catch (e) { return []; }
}

function _savePluginRegistry(registry) {
    try { localStorage.setItem(PLUGIN_REGISTRY_KEY, JSON.stringify(registry)); } catch (e) {}
}

function _persistPlugin(name, code) {
    const registry = _loadPluginRegistry();
    if (!registry.find(p => p.name === name)) {
        registry.push({ name, code });
        _savePluginRegistry(registry);
    }
    _renderLoadedPluginList();
}

function _removePlugin(name) {
    const registry = _loadPluginRegistry().filter(p => p.name !== name);
    _savePluginRegistry(registry);
    _renderLoadedPluginList();
    const status = document.getElementById('addPluginStatus');
    if (status) { status.style.color = '#e09e3a'; status.textContent = `"${name}" removed. Restart the app to fully unload it.`; }
}

function _renderLoadedPluginList() {
    const list = document.getElementById('loadedPluginList');
    if (!list) return;
    const registry = _loadPluginRegistry();
    if (registry.length === 0) {
        list.innerHTML = '<div style="font-size:11px; color:#53586d;">No plugins loaded.</div>';
        return;
    }
    list.innerHTML = registry.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#14151c; border:1px solid #232530; border-radius:4px; padding:6px 10px; font-size:11px; color:#a4a6b5;"
            oncontextmenu="event.preventDefault(); _removePlugin('${p.name.replace(/'/g, "\\'")}')">
            <span>📦 ${p.name}</span>
            <span style="color:#53586d; font-size:10px; cursor:pointer;" onclick="_removePlugin('${p.name.replace(/'/g, "\\'")}')">✕ Remove</span>
        </div>
    `).join('');
}
window._removePlugin = _removePlugin;
window._renderLoadedPluginList = _renderLoadedPluginList;

// Restore persisted plugins on startup (called from DOMContentLoaded below)
function _restorePersistedPlugins() {
    _loadPluginRegistry().forEach(p => {
        try {
            const scriptEl = document.createElement('script');
            scriptEl.textContent = p.code;
            scriptEl.setAttribute('data-plugin-source', p.name);
            scriptEl.setAttribute('data-plugin-persisted', 'true');
            document.body.appendChild(scriptEl);
        } catch (err) {
            console.error(`Failed to restore plugin "${p.name}":`, err);
        }
    });
}
