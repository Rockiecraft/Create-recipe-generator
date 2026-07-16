function renderRecipeForm() {
    return `
<div class="recipe-form">
<div class="config-card">
    <h3>Recipe Ingredients Configuration</h3>

    <!-- Standard single-input panel (pressing, smoking, blasting, etc.) -->
    <div id="standardInputs" class="hidden">
        <div class="left-aligned-layout-grid" style="margin-top:0;">
            <div class="grid-cell-stacked-box">
                <label style="margin-top:0;">Single Input Item ID</label>
                <input type="text" id="inputItem" placeholder="example: minecraft:iron_ingot"
                    oninput="compileRecipe()">
            </div>
            <div class="grid-cell-context-hint">
                ➔ Resource item parameter passed into standard process lines.
            </div>
        </div>
        <div id="inputItem2Row" class="grid-cell-stacked-box hidden">
            <label style="margin-top:0;">Applied Item ID</label>
            <input type="text" id="inputItem2" placeholder="example: minecraft:bone_meal"
                oninput="compileRecipe()">
            <div class="grid-cell-context-hint">
                ➔ The item being used on the block (second ingredient).
            </div>
        </div>
    </div>

    <!-- Filling panel (spout) -->
    <div id="fillingInputsPanel" class="hidden">
        <div class="left-aligned-layout-grid" style="margin-top:0;">
            <div class="grid-cell-stacked-box">
                <label style="margin-top:0;">Base Container Item ID</label>
                <input type="text" id="inputItemFilling" placeholder="example: minecraft:glass_bottle"
                    oninput="compileRecipe()">
            </div>
            <div class="grid-cell-context-hint">
                → The empty container item passed into the Spout tracking lane.
            </div>
            <div class="grid-cell-stacked-box" style="margin-top:12px;">
                <label style="margin-top:0;">Fluid Registry ID</label>
                <input type="text" id="fluidInputName" placeholder="example: minecraft:water"
                    oninput="compileRecipe()">
            </div>
            <div style="display:flex; gap:16px; margin-top:12px; width:100%;">
                <div class="grid-cell-stacked-box" style="flex:1;">
                    <label style="margin-top:0;">Amount (mB)</label>
                    <input type="number" id="fluidInputAmount" style="width:64px !important;"
                        value="1000" step="100" min="0" oninput="compileRecipe()">
                </div>
                <div class="grid-cell-stacked-box" style="flex:3;">
                    <label style="margin-top:0;">Fluid Optional NBT Compound String</label>
                    <input type="text" id="fluidInputNbt" placeholder="{}" oninput="compileRecipe()">
                </div>
            </div>
        </div>
    </div>

    <!-- Multi-input panel (basin: mixing, compacting; mechanical crafting) -->
    <div id="multiInputsPanel">
        <label style="margin-top:0;">Ingredients Inventory Setup (Max 9 Items):</label>
        <div id="ingredientsContainer"></div>
        <button type="button" class="btn-secondary" id="addIngredientBtn"
            style="width:auto; margin-top:8px; display:block;"
            onclick="addBasinIngredientBlock()">
            + Add Basin Input Node
        </button>
    </div>

    <!-- Sequenced assembly panel -->
    <div id="assemblyPanel" class="hidden"
        style="border-bottom:1px solid var(--border-color); padding-bottom:15px; margin-bottom:10px;">
        <div class="left-aligned-layout-grid" style="margin-top:0;">
            <div class="grid-cell-stacked-box">
                <label style="margin-top:0;">Transitional Incomplete Item ID</label>
                <input type="text" id="transitionalItem" placeholder="example: minecraft:stone"
                    oninput="compileRecipe()">
            </div>
            <div class="grid-cell-context-hint">
                ➔ The item ID tracked in intermediate progression states.
            </div>
        </div>
        <div class="left-aligned-layout-grid">
            <div class="grid-cell-stacked-box">
                <label style="margin-top:0;">Loop Cycles Required</label>
                <input type="number" id="assemblyLoops" value="1" min="1"
                    oninput="if(typeof compileRecipe === 'function') compileRecipe();">
            </div>
            <div class="grid-cell-context-hint">
                ➔ Total loop sequence executions required for execution verification passes.
            </div>
        </div>
        <div style="margin-top:15px; border-top:1px dashed var(--border-color); padding-top:15px;">
            <label style="color:var(--accent); margin-bottom:8px;">
                Sequence Manufacturing Steps Pipeline:
            </label>
            <div id="assemblyStepsContainer"
                style="display:flex; flex-direction:column; gap:10px; width:100%; margin-bottom:12px;">
                <!-- Step blocks appended dynamically -->
            </div>
            <div class="left-aligned-layout-grid"
                style="margin-top:12px; display:flex; justify-content:flex-start; width:100%;">
                <button type="button" class="btn-util"
                    style="background:var(--accent); color:#121212; font-weight:bold; height:35px; width:180px; border:none; border-radius:var(--radius-md); cursor:pointer;"
                    onclick="addAssemblyStepBlock()">
                    + Append Sequence Step
                </button>
            </div>
        </div>
    </div>

    <!-- Output products panel -->
    <div id="outputsPanel">
        <label style="font-size:11px; color:var(--text-muted); margin-bottom:4px; display:block;">
            Recipe Output Products List:
        </label>
        <div id="outputsContainerFluid" style="display:none; flex-direction:column; gap:8px;"></div>
        <div id="outputsContainerSimple" style="display:none; flex-direction:column; gap:8px;"></div>
        <button type="button" id="addOutputBtnFluid" class="btn-util hidden"
            style="width:auto; margin-top:12px; background:var(--accent); color:#121212; font-weight:bold; height:32px;"
            onclick="addBasinOutputBlock()">
            + Add Extra Output Product Node
        </button>
        <button type="button" id="addOutputBtnSimple" class="btn-util hidden"
            style="width:auto; margin-top:12px; background:var(--accent); color:#121212; font-weight:bold; height:32px;"
            onclick="addStandardOutputBlock()">
            + Add Extra Output Product Node
        </button>
    </div>

    <!-- Single output panel (pressing, filling, mechanical crafting, etc.) -->
    <div id="singleOutputInputsPanel" class="recipe-group-card hidden" style="margin-top:12px;">
        <div class="left-aligned-layout-grid">
            <div class="grid-cell-stacked-box">
                <label style="margin-top:0;">Single Output Product Result</label>
                <input type="text" id="singleOutputProductId" placeholder="example: minecraft:stone"
                    oninput="compileRecipe()">
            </div>
            <div class="grid-cell-context-hint">
                Determines the solid item resulting profile generated.
            </div>
            <div class="grid-cell-stacked-box" id="outputAmountField">
                <label style="margin-top:0;">Output Amount</label>
                <input type="number" id="singleOutputProductCount" value="1" min="1" max="64"
                    oninput="compileRecipe()">
            </div>
            <div class="grid-cell-context-hint" id="outputAmountHint">
                How many of the result item are produced per craft.
            </div>
        </div>
    </div>

    <!-- Mechanical crafting grid panel -->
    <div id="mechanicalCraftingContainer" class="config-card hidden"
        style="flex:0 1 auto; width:100%; margin:16px 0 0 0; padding:12px !important; box-sizing:border-box;">
        <div style="display:flex; gap:16px; background:#14151c; padding:8px 12px; border-radius:4px;
                    border:1px solid #232530; align-items:center; width:100%; box-sizing:border-box; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="color:#7d8296; font-size:11px; white-space:nowrap; font-weight:500; user-select:none;">
                    Width (Cols):
                </span>
                <input type="number" id="craftingWidth" value="3" min="1" max="9"
                    onchange="generateCraftingGrid(); compileRecipe();"
                    style="width:48px !important; min-width:48px !important; max-width:48px !important;
                           height:22px !important; text-align:center !important; background:#1b1c24 !important;
                           border:1px solid #262836 !important; border-radius:4px !important; color:#fff !important;
                           font-size:11px !important; font-weight:bold !important; outline:none !important;
                           padding:0 !important; box-sizing:border-box !important;">
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="color:#7d8296; font-size:11px; white-space:nowrap; font-weight:500; user-select:none;">
                    Height (Rows):
                </span>
                <input type="number" id="craftingHeight" value="3" min="1" max="9"
                    onchange="generateCraftingGrid(); compileRecipe();"
                    style="width:48px !important; min-width:48px !important; max-width:48px !important;
                           height:22px !important; text-align:center !important; background:#1b1c24 !important;
                           border:1px solid #262836 !important; border-radius:4px !important; color:#fff !important;
                           font-size:11px !important; font-weight:bold !important; outline:none !important;
                           padding:0 !important; box-sizing:border-box !important;">
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex:1;">
                <span style="color:#7d8296; font-size:11px; white-space:nowrap; font-weight:500; user-select:none;">
                    Mirroring:
                </span>
                <select id="acceptMirrored" onchange="compileRecipe();"
                    style="height:22px !important; width:max-content !important; min-width:175px !important;
                           background:#1b1c24 !important; border:1px solid #262836 !important;
                           border-radius:4px !important; color:#fff !important; font-size:11px !important;
                           outline:none !important; padding:0 24px 0 6px !important; cursor:pointer !important;
                           box-sizing:border-box !important;">
                    <option value="false">false (Exact Pattern Only)</option>
                    <option value="true">true (Allow Mirroring)</option>
                </select>
            </div>
        </div>
        <div id="craftingGridMatrix"
            style="display:flex !important; flex-direction:column !important; gap:4px !important;
                   background:#14151c; padding:12px; border-radius:4px; border:1px solid #232530;
                   align-items:center !important; justify-content:center !important; min-height:40px;
                   width:fit-content !important; margin:0 auto 12px auto !important; box-sizing:border-box !important;">
        </div>
        <div style="font-size:10px; color:#5c6370; line-height:1.3; border-top:1px dashed #2d2e31;
                    padding-top:8px; margin-bottom:12px;">
            Type single letters inside the box array below to structure your crafting configuration.
            Leave squares blank (spaces) for empty slots.
        </div>
        <div style="display:flex; flex-direction:column; gap:4px;">
            <span style="font-size:10px; font-weight:bold; color:var(--accent); text-transform:uppercase; letter-spacing:0.5px;">
                Item Key Legend Definitions
            </span>
            <div id="craftingKeysLegendContainer"
                style="display:grid !important; grid-template-columns:repeat(2, 1fr) !important;
                       gap:8px !important; max-height:300px; overflow-y:auto; background:#14151c;
                       padding:8px; border-radius:4px; border:1px solid #232530;
                       box-sizing:border-box; width:100%;">
                <div style="font-size:11px; color:#53586d; grid-column:span 2; text-align:center;">
                    Type letters into the grid matrix below to assign custom items.
                </div>
            </div>
        </div>
    </div>

    <!-- Plugin custom recipe form slot — plugin panels are rendered into this container -->
    <div id="pluginRecipeFormSlot" class="hidden"></div>

    <!-- Advanced processing options -->
    <div id="advancedProcessingDrawer" style="margin-top:15px; width:100%;">
        <div id="advancedHeatRow" class="form-control-wrapper hidden"
            style="background:#14151c; border:1px solid #232530; border-radius:6px; padding:12px; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <label style="margin:0; color:#7d8296; font-size:11px; font-weight:500; min-width:120px;">
                    🔥 Heat Requirement
                </label>
                <select id="basinHeatRequirement" onchange="compileRecipe()"
                    style="height:22px !important; flex:1; background:#1b1c24 !important;
                           border:1px solid #262836 !important; border-radius:4px; color:#fff;
                           font-size:11px; outline:none; padding:0 6px; cursor:pointer;">
                    <option value="none">None (Cold Processing)</option>
                    <option value="heated">Heated</option>
                    <option value="superheated">Superheated</option>
                </select>
            </div>
            <span style="display:block; font-size:10px; color:#5c6370; margin-top:4px; margin-left:128px;">
                Specifies the temperature constraint required by the mixing or compacting machine.
            </span>
        </div>

        <div id="advancedFluidRow" class="form-control-wrapper hidden"
            style="background:#14151c; border:1px solid #232530; border-radius:6px; padding:12px;
                   margin-bottom:12px; display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="autoConvertFabricFluids" onchange="compileRecipe()"
                    style="margin:0; cursor:pointer;">
                <label for="autoConvertFabricFluids"
                    style="margin:0; color:#7d8296; font-size:11px; font-weight:500; cursor:pointer;
                           display:flex; align-items:center; gap:4px;">
                    💧 Auto-Convert Fluid mB to Fabric Units (Droplets ×81)
                </label>
            </div>
            <span style="display:block; font-size:10px; color:#5c6370; margin-left:22px;">
                Applies automatic scaling multipliers to fluid amounts within the compiled output.
            </span>
        </div>

        <div id="processDurationRow" class="form-control-wrapper hidden"
            style="background:#14151c; border:1px solid #232530; border-radius:6px; padding:12px;
                   display:flex; align-items:center; gap:12px;">
            <label for="processingTimeInput"
                style="margin:0; color:#7d8296; font-size:11px; font-weight:500;">
                Kinetic Processing Time:
            </label>
            <input type="number" id="processingTimeInput" value="50" min="1" oninput="compileRecipe()"
                style="width:48px !important; min-width:48px !important; height:22px !important;
                       text-align:center; background:#1b1c24 !important; border:1px solid #262836 !important;
                       border-radius:4px; color:#fff; font-size:11px; font-weight:bold; outline:none; padding:0;">
            <span style="font-size:10px; color:#5c6370;">
                (Ticks — Only applies to Milling, Cutting &amp; Crushing recipe types)
            </span>
        </div>
    </div>

    <!-- Conditional & Framework Rules drawer -->
    <div class="expandable-toolbar-row"
        style="display:flex; flex-direction:row; flex-wrap:wrap; align-items:flex-start;
               gap:10px; margin-top:15px; margin-bottom:15px; width:100%;">
        <div class="config-card"
            style="flex:0 1 auto; width:max-content; margin:0; padding:6px 12px !important;">
            <details class="advanced-options-disclosure" style="cursor:pointer;">
                <summary style="font-size:11px; font-weight:bold; color:var(--accent, #e19524);
                                text-transform:uppercase; letter-spacing:0.5px; list-style:none;
                                display:flex; align-items:center; gap:6px; outline:none;
                                user-select:none; white-space:nowrap;">
                    <span class="disclosure-arrow-marker"
                        style="transition:transform 0.15s ease; display:inline-block;">▶</span>
                    Conditional &amp; Framework Rules
                </summary>
                <div class="expandable-drawer-content-box"
                    style="margin-top:12px; display:flex; flex-direction:column; gap:15px;
                           cursor:default; width:516px; box-sizing:border-box;"
                    onclick="event.stopPropagation();">

                    <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
                        <label style="color:#7d8296; font-size:10px; font-weight:600; text-transform:uppercase;">
                            Environment Platform Restrictions
                        </label>
                        <div class="radio-group"
                            style="display:flex; gap:15px; background:#14151c; padding:6px 12px;
                                   border-radius:4px; border:1px solid #232530; width:100%;
                                   box-sizing:border-box; justify-content:flex-start;">
                            <label style="color:#fff; font-size:11px; cursor:pointer; display:flex; align-items:center; gap:4px; text-transform:none;">
                                <input type="radio" id="radio_universal" name="platform" value="universal"
                                    checked onchange="compileRecipe()"
                                    style="width:11px; height:11px; margin:0; accent-color:var(--accent);">
                                Universal Setup
                            </label>
                            <label style="color:#fff; font-size:11px; cursor:pointer; display:flex; align-items:center; gap:4px; text-transform:none;">
                                <input type="radio" id="radio_forge" name="platform" value="forge_only"
                                    onchange="compileRecipe()"
                                    style="width:11px; height:11px; margin:0; accent-color:var(--accent);">
                                Forge Only Layer
                            </label>
                            <label style="color:#fff; font-size:11px; cursor:pointer; display:flex; align-items:center; gap:4px; text-transform:none;">
                                <input type="radio" id="radio_fabric" name="platform" value="fabric_only"
                                    onchange="compileRecipe()"
                                    style="width:11px; height:11px; margin:0; accent-color:var(--accent);">
                                Fabric Only Layer
                            </label>
                            <label style="color:#fff; font-size:11px; cursor:pointer; display:flex; align-items:center; gap:4px; text-transform:none;">
                                <input type="radio" id="radio_neoforge" name="platform" value="neoforge_only"
                                    onchange="compileRecipe()"
                                    style="width:11px; height:11px; margin:0; accent-color:var(--accent);">
                                NeoForge Only Layer
                            </label>
                        </div>
                        <div class="grid-cell-context-hint"
                            style="color:#53586d; font-size:10px; margin-top:2px; line-height:1.3;">
                            → Applies automatic cross-compatibility mod checks depending on the system platform choice.
                        </div>
                    </div>

                    <div id="conditionalConfig"
                        style="margin-top:2px; border:1px solid var(--border-color); background-color:#14151c;
                               padding:12px; border-radius:4px; display:flex; flex-direction:column; gap:10px;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                            <input type="checkbox" id="useForgeConditionalWrapper" onchange="compileRecipe()"
                                style="margin:0; cursor:pointer; accent-color:var(--accent);">
                            <label for="useForgeConditionalWrapper"
                                style="margin:0; color:#7d8296; font-size:11px; font-weight:500; cursor:pointer;">
                                Wrap in <code style="color:var(--accent);">forge:conditional</code>
                                (legacy 1.20.1 Forge multi-recipe format)
                            </label>
                        </div>
                        <div class="form-group"
                            style="display:flex; flex-direction:column; gap:4px; width:100%; margin:0;">
                            <label for="conditionSelector"
                                style="color:var(--accent); font-weight:600; font-size:11px;">
                                Condition Logic Type Check Preset:
                            </label>
                            <select id="conditionSelector"
                                style="height:22px; padding:2px 6px; font-size:11px; background-color:#1b1c24;
                                       border:1px solid #232530; color:#fff; border-radius:4px; width:100%;">
                                <option value="custom">✨ Custom Condition Block (Blank Canvas)</option>
                                <optgroup label="── Forge ──">
                                    <option value="forge:mod_loaded">Forge: Mod Loaded check</option>
                                    <option value="forge:item_exists">Forge: Item Exists check</option>
                                    <option value="forge:tag_empty">Forge: Tag Empty check</option>
                                    <option value="forge:true">Forge: Always True</option>
                                    <option value="forge:false">Forge: Always False</option>
                                    <option value="forge:and">Forge: And (All must pass)</option>
                                    <option value="forge:or">Forge: Or (Any must pass)</option>
                                    <option value="forge:not">Forge: Not (Invert)</option>
                                </optgroup>
                                <optgroup label="── NeoForge ──">
                                    <option value="neoforge:mod_loaded">NeoForge: Mod Loaded check</option>
                                    <option value="neoforge:item_exists">NeoForge: Item Exists check</option>
                                    <option value="neoforge:tag_empty">NeoForge: Tag Empty check</option>
                                    <option value="neoforge:true">NeoForge: Always True</option>
                                    <option value="neoforge:false">NeoForge: Always False</option>
                                    <option value="neoforge:and">NeoForge: And (All must pass)</option>
                                    <option value="neoforge:or">NeoForge: Or (Any must pass)</option>
                                    <option value="neoforge:not">NeoForge: Not (Invert)</option>
                                </optgroup>
                                <optgroup label="── Fabric ──">
                                    <option value="fabric:all_mods_loaded">Fabric: All Mods Loaded check</option>
                                    <option value="fabric:any_mod_loaded">Fabric: Any Mod Loaded check</option>
                                    <option value="fabric:not">Fabric: Not (Invert condition)</option>
                                </optgroup>
                            </select>
                        </div>
                        <div style="margin-top:4px; display:flex; justify-content:flex-start; width:100%;">
                            <button type="button" class="btn-util" onclick="addConditionBlock()"
                                style="background:var(--accent); color:#121212; font-weight:bold; border:none;
                                       padding:6px 14px; border-radius:4px; font-size:12px; cursor:pointer;
                                       height:28px; display:flex; align-items:center; justify-content:center;">
                                + Add Condition Block
                            </button>
                        </div>
                    </div>

                    <div style="margin-top:4px; border-top:1px dashed #2d2e31; padding-top:10px;
                                display:flex; flex-direction:column; gap:6px; width:100%;">
                        <label style="color:#8da6c2; font-size:11px; font-weight:500;">
                            Assigned Custom Evaluation Steps:
                        </label>
                        <div id="conditionsContainer"
                            style="display:flex; flex-direction:column; gap:10px; width:100%; min-height:0;">
                        </div>
                    </div>
                </div>
            </details>
        </div>
    </div>
</div>
</div>`;
}
