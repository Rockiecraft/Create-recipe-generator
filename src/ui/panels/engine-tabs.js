function renderEngineTabs() {
  return `
<div class="engine-tabs-bar">
  <!-- Mod group selector strip — deliberately its OWN horizontal scroll
       region, separate from the engine-tab rows below. Previously this
       row and the engine-tab rows shared a single scrolling container, so
       scrolling right to reach a far engine tab dragged the mod-tab row
       out of view along with it. The "+" add-plugin button also used to
       live inside this same scrollable row, getting more cramped as more
       mod groups were added — it's now pinned outside the scroll strip,
       always reachable regardless of scroll position or tab count. -->
  <div class="mod-tabs-bar-wrapper">
    <div class="mod-tabs-scroll" id="modGroupTabsScroll">
      <div class="engine-tabs-row" id="modGroupTabsRow">
        <button class="engine-mod-tab active" data-mod="create" onclick="switchModTab(this)">
          Create
        </button>
        <!-- Plugin mod group tabs are appended here by RecipeGeneratorAPI.registerEngine() -->
      </div>
    </div>
    <button id="addPluginTabBtn" class="mod-tab-add-btn" title="Load a plugin/addon"
      onclick="openAddPluginModal()">+</button>
  </div>

  <!-- Engine tab rows (core + plugin) — their own independent horizontal
       scroll region, unaffected by the mod-tab strip's scroll position. -->
  <div class="engine-tabs-scroll-region">
    <!-- Core Create engine tabs (always present, never touched by plugin API) -->
    <div class="engine-tabs-inner" id="coreEngineTabsInner">
      <div class="engine-tabs-row">
        <button class="engine-tab active" data-engine="create:pressing"
          onclick="switchEngine(this)">Pressing</button>
        <button class="engine-tab" data-engine="create:compacting"
          onclick="switchEngine(this)">Compacting</button>
        <button class="engine-tab" data-engine="create:mixing"
          onclick="switchEngine(this)">Mixing</button>
        <button class="engine-tab" data-engine="create:crushing"
          onclick="switchEngine(this)">CrushingWheels</button>
        <button class="engine-tab" data-engine="create:cutting"
          onclick="switchEngine(this)">Cutting</button>
        <button class="engine-tab" data-engine="create:milling"
          onclick="switchEngine(this)">Milling</button>
        <button class="engine-tab" data-engine="create:sandpaper_polishing"
          onclick="switchEngine(this)">Polishing</button>
        <button class="engine-tab" data-engine="create:splashing"
          onclick="switchEngine(this)">Splashing</button>
      </div>
      <div class="engine-tabs-row">
        <button class="engine-tab" data-engine="create:smoking"
          onclick="switchEngine(this)">Smoking</button>
        <button class="engine-tab" data-engine="create:blasting"
          onclick="switchEngine(this)">Blasting</button>
        <button class="engine-tab" data-engine="create:haunting"
          onclick="switchEngine(this)">Haunting</button>
        <button class="engine-tab" data-engine="create:filling"
          onclick="switchEngine(this)">Filling</button>
        <button class="engine-tab" data-engine="create:deploying"
          onclick="switchEngine(this)">Deploying</button>
        <button class="engine-tab" data-engine="create:sequenced_assembly"
          onclick="switchEngine(this)">Sequenced Assembly</button>
        <button class="engine-tab" data-engine="create:mechanical_crafting"
          onclick="switchEngine(this)">Mechanical Crafting</button>
        <button class="engine-tab" data-engine="create:item_application"
          onclick="switchEngine(this)">Item Application</button>
      </div>
    </div>

    <!-- Plugin engine tabs container — one inner block per registered mod group,
         injected and shown/hidden by plugin-api.js and switchModTab() -->
    <div id="pluginEngineTabsOuter" style="display:none;">
      <!-- Plugin mod group tab rows injected here -->
    </div>
  </div>
</div>`;
}
