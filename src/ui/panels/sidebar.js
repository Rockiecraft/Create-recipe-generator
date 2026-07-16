function renderSidebar() {
    return `
    <div style="display:flex; justify-content:flex-start; margin-bottom:5px;">
        <button class="btn-collapse-toggle" id="sidebarCollapseBtn"
            onclick="toggleSidebarCollapseState()">></button>
    </div>
    <button class="btn-action" id="sidebarNewBtn" onclick="createNewRecipeLayout()">
        + New Recipe Layout
    </button>
    <div id="recipeSidebarContainer"
        style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; flex:1;">
        <!-- Sidebar dynamic recipe entries injected here -->
    </div>`;
}
