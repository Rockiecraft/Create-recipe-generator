/**
 * ui-loader.js
 *
 * Runs first on DOMContentLoaded. Renders all panel HTML strings into their
 * mount points, then fires the app initialisation sequence that the rest of
 * the JS files depend on (toggleEngineFields, renderSidebarList,
 * loadRecipeFromState, etc.).
 *
 * Load order in index.html:
 *   1. All foundation JS (data, engines, dispatch, compiler, ui-*.js)
 *   2. plugin-api.js
 *   3. ui/panels/*.js   (renderHeader, renderSidebar, … functions)
 *   4. ui/ui-loader.js  ← this file
 *   5. main.js          ← defines DOMContentLoaded handler that calls initApp()
 *
 * ui-loader.js mounts the DOM synchronously so that by the time main.js's
 * DOMContentLoaded fires every element ID already exists.
 */

(function mountPanels() {
    function mount(id, html) {
        const el = document.getElementById(id);
        if (!el) { console.warn('ui-loader: mount point not found:', id); return; }
        el.innerHTML = html;
    }

    mount('mount-header',       renderHeader());

    mount('mount-sidebar',      renderSidebar());

    const sidebarMount = document.getElementById('mount-sidebar');
    if (sidebarMount) sidebarMount.id = 'mainSidebarLayout';

    mount('mount-engine-tabs',  renderEngineTabs());
    mount('mount-recipe-form',  renderRecipeForm());
    mount('mount-right-panel',  renderRightPanel());

    mount('mount-footer',       renderFooter());
    mount('mount-modals',       renderModals());
})();
