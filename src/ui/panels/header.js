function renderHeader() {
    return `
<header>
    <h1>CREATE RECIPE GENERATOR</h1>
    <div class="meta"></div>
    <div class="header-version-selector"
        style="display:flex; align-items:center; gap:8px; margin-left:auto; padding-right:15px;">
        <label for="minecraftVersion"
            style="color:#a4a6b5; font-size:11px; font-weight:bold; margin-left:200px; text-transform:uppercase; letter-spacing:0.5px;">
            Target Version:
        </label>
        <select id="minecraftVersion" onchange="onMinecraftVersionChange(this)"
            style="background:#1b1c24; border:1px solid #262836; border-radius:4px; color:#fff; font-size:11px; font-weight:bold; padding:4px 8px; outline:none; cursor:pointer;">
            <option value="1.20.1" selected>Minecraft 1.20.1 ("item")</option>
            <option value="1.21.1">Minecraft 1.21.1 ("id")</option>
        </select>
    </div>
    <button class="header-reset-data-btn" onclick="openResetConfirmationModal()">
        ⚠️ Reset App Data
    </button>
</header>`;
}
