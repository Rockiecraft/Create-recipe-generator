function renderModals() {
    return `
<div id="resetConfirmationModal" class="modal-backdrop-overlay"
    style="display:none; position:fixed !important; top:0 !important; left:0 !important;
           right:0 !important; bottom:0 !important; width:100vw !important; height:100vh !important;
           background:rgba(0,0,0,0.75) !important; z-index:99999 !important;
           justify-content:center !important; align-items:center !important;
           transform:scale(calc(1 / 0.85)) !important; transform-origin:top left !important;
           box-sizing:border-box !important;">
    <div class="modal-content-card"
        style="background:#1a1c24; border:2px solid #282b3a; border-radius:8px; width:420px;
               padding:24px; box-shadow:0 10px 30px rgba(0,0,0,0.5); text-align:center;
               color:#ffffff; font-family:sans-serif;">
        <h3 style="margin-top:0; color:#ff5e5b; font-size:16px; font-weight:700; letter-spacing:0.5px;">
            Confirm Complete Database Reset
        </h3>
        <p style="color:#a4a6b5; font-size:13px; line-height:1.5; margin:16px 0 24px 0;">
            This operation will completely erase all saved recipes, recipe configurations, and tab
            history inside your browser cache memory layer. This action cannot be undone.
        </p>
        <div style="display:flex; justify-content:center; gap:12px;">
            <button onclick="closeResetConfirmationModal()"
                style="background:#282b3a; border:1px solid #3f4152; border-radius:4px; color:#b9bbc9;
                       font-size:12px; font-weight:600; padding:8px 16px; cursor:pointer; outline:none;">
                Cancel
            </button>
            <button onclick="executeMasterApplicationDataReset()"
                style="background:#e04a3a; border:1px solid #ff6352; border-radius:4px; color:#ffffff;
                       font-size:12px; font-weight:700; padding:8px 16px; cursor:pointer; outline:none;
                       box-shadow:0 0 10px rgba(224,74,58,0.2);">
                Yes, Delete Everything
            </button>
        </div>
    </div>
</div>

<div id="addPluginModal" class="modal-backdrop-overlay"
    style="display:none; position:fixed !important; top:0 !important; left:0 !important;
           right:0 !important; bottom:0 !important; width:100vw !important; height:100vh !important;
           background:rgba(0,0,0,0.75) !important; z-index:99999 !important;
           justify-content:center !important; align-items:center !important;
           transform:scale(calc(1 / 0.85)) !important; transform-origin:top left !important;
           box-sizing:border-box !important;">
    <div class="modal-content-card"
        style="background:#1a1c24; border:2px solid #282b3a; border-radius:8px; width:460px;
               padding:24px; box-shadow:0 10px 30px rgba(0,0,0,0.5); text-align:left;
               color:#ffffff; font-family:sans-serif;">
        <h3 style="margin-top:0; color:var(--accent); font-size:16px; font-weight:700; letter-spacing:0.5px;">
            Load Plugin / Addon
        </h3>
        <p style="color:#a4a6b5; font-size:12px; line-height:1.5; margin:12px 0 16px 0;">
            Select a plugin <code style="color:var(--accent);">.js</code> file that calls
            <code style="color:var(--accent);">RecipeGeneratorAPI.registerEngine(...)</code>.
            The plugin will register its engine(s) immediately.
        </p>
        <input type="file" id="pluginFileInput" accept=".js" multiple style="display:none;"
            onchange="handlePluginFilesSelected(this.files)">
        <button onclick="document.getElementById('pluginFileInput').click()"
            style="width:100%; background:var(--accent); color:#14151c; border:none; border-radius:4px;
                   font-size:12px; font-weight:700; padding:10px; cursor:pointer; margin-bottom:12px;">
            Choose Plugin File(s)...
        </button>
        <div id="addPluginStatus" style="font-size:11px; color:#7d8296; min-height:16px; margin-bottom:12px;"></div>
        <div style="border-top:1px solid #282b3a; padding-top:12px; margin-bottom:12px;">
            <div style="font-size:10px; font-weight:700; color:#53586d; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">
                Loaded Plugins — right-click or click ✕ to remove
            </div>
            <div id="loadedPluginList" style="display:flex; flex-direction:column; gap:6px;">
                <div style="font-size:11px; color:#53586d;">No plugins loaded.</div>
            </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:12px;">
            <button onclick="closeAddPluginModal()"
                style="background:#282b3a; border:1px solid #3f4152; border-radius:4px; color:#b9bbc9;
                       font-size:12px; font-weight:600; padding:8px 16px; cursor:pointer; outline:none;">
                Close
            </button>
        </div>
    </div>
</div>`;
}
