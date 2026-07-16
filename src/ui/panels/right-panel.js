function renderRightPanel() {
    return `
    <!-- Tab navigation row -->
    <div class="code-pane-tabs-header-row"
        style="display:flex; background:#12131a; border-bottom:2px solid #282b3a; box-sizing:border-box;">
        <button id="btnPanePreviewMode" class="pane-toggle-tab active"
            onclick="switchRightPaneMode('preview')"
            style="flex:1; padding:10px; background:none; border:none; color:#20c997; font-size:11px;
                   font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer;
                   border-bottom:2px solid #20c997; margin-bottom:-2px;">
             Preview Mode
        </button>
        <button id="btnPanePasteMode" class="pane-toggle-tab"
            onclick="switchRightPaneMode('paste')"
            style="flex:1; padding:10px; background:none; border:none; color:#6c7192; font-size:11px;
                   font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer;">
             Paste / Edit Mode
        </button>
    </div>

    <!-- Content body -->
    <div style="padding:12px 12px 24px 12px !important; background:#161820; border-radius:0 0 6px 6px;
                box-sizing:border-box; position:relative;">
        <div class="code-preview-header"
            style="display:flex; align-items:center; justify-content:space-between; padding-bottom:8px;">
            <h3 id="rightPaneContextTitle"
                style="margin:0; font-size:11px; color:#6c7192; font-weight:700;
                       text-transform:uppercase; letter-spacing:0.5px;">
                Compiled Code Preview
            </h3>
            <button id="copyTextBtn" onclick="copyToClipboard()"
                style="background:#1a1c24; border:1px solid #43475c; border-radius:4px; color:#ffffff;
                       font-size:11px; font-weight:bold; padding:4px 10px; cursor:pointer;">
                Copy Text
            </button>
        </div>

        <!-- Preview display -->
        <div id="recipeCodePreviewContainer" style="display:block; width:100%;">
            <pre id="jsonOutput">{}</pre>
        </div>

        <!-- Paste / edit workspace -->
        <div id="recipeCodeEditorWrapper"
            style="width:100%; border:1px solid #232530; border-radius:6px; overflow:hidden;
                   background:#0c0c0e; display:none;">
            <div style="display:flex; width:100%;">
                <div id="recipeCodeLineNumbers"
                    style="flex-shrink:0; width:32px; text-align:right; padding:12px 6px 12px 0;
                           box-sizing:border-box; font-family:'Consolas','Courier New',monospace;
                           font-size:12px; line-height:18px; color:#4b4f63; background:#0c0c0e;
                           border-right:1px solid #232530; user-select:none; pointer-events:none; overflow:hidden;">
                    <div data-line="1" style="height:18px; line-height:18px;">1</div>
                </div>
                <textarea id="recipeCodeTextarea" autocomplete="off"
                    oninput="syncRecipeCodeLineNumbers(); autoGrowRecipeTextarea();"
                    onscroll="syncRecipeCodeLineNumberScroll();"
                    placeholder="Paste custom data pack recipe JSON code blocks right here to instantly load them into the recipe form..."
                    style="flex:1; width:0; min-height:300px; padding:12px 8px; border:none;
                           background:transparent; color:#f1f2f6;
                           font-family:'Consolas','Courier New',monospace; font-size:12px;
                           line-height:18px; outline:none; box-sizing:border-box; margin:0;
                           display:block; resize:none;"></textarea>
            </div>
        </div>

        <!-- Syntax error overlay -->
        <div id="recipeParserErrorLogBox"
            style="display:none; margin-top:12px; background:rgba(224,74,58,0.1);
                   border:1px solid #eb5344; border-radius:6px; padding:12px; box-sizing:border-box;">
            <h4 style="margin:0 0 6px 0; font-size:11px; color:#ff5e5b; font-weight:bold;
                       text-transform:uppercase; letter-spacing:0.5px;">
                ⚠️ Structural Validation Check:
            </h4>
            <p id="recipeParserErrorMessage"
                style="margin:0; font-size:11px; color:#f1f2f6; line-height:1.4; font-family:monospace;">
            </p>
        </div>
    </div>`;
}
