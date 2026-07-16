function renderSidebarList(forcedActiveId = null) {
  const listContainer = document.getElementById('recipeSidebarContainer');
  if (!listContainer) return;

  document.querySelectorAll('body > .context-dropdown-menu').forEach((el) => el.remove());
  activeOpenDropdownId = null;

  listContainer.innerHTML = '';

  const keys = Object.keys(recipesDatabase);
  if (keys.length === 0) {
    listContainer.innerHTML = '<div style="color:var(--text-muted); font-size:11px; text-align:center; padding:10px 0;">No Recipes Found</div>';
    return;
  }

  keys.forEach((filename) => {
    const item = recipesDatabase[filename];
    const currentCheckId = forcedActiveId || activeRecipeId;
    const isActive = String(filename) === String(currentCheckId);

    let badgeColor = 'var(--accent)';
    if (item.engine === 'create:mixing') badgeColor = '#5db0e5';
    if (item.engine === 'create:compacting') badgeColor = '#e57d5d';
    if (item.engine === 'create:sequenced_assembly') badgeColor = '#b55de5';
    if (item.engine === 'create:mechanical_crafting') badgeColor = '#e19524';


    const cleanType = item.engine || 'create:mixing';
    const itemDiv = document.createElement('div');
    itemDiv.className = `recipe-list-item ${isActive ? 'active' : ''}`;

    if (isActive) {
      itemDiv.style.borderLeftColor = 'var(--accent)';
      itemDiv.style.backgroundColor = 'var(--bg-input)';
    } else {
      itemDiv.style.borderLeftColor = '#444';
      itemDiv.style.backgroundColor = 'transparent';
    }

    if (isSidebarCollapsed) {
      let visualIconHtml = typeof getRecipeVisualIcon === 'function' ? getRecipeVisualIcon(item.engine) : '🔨';
      itemDiv.setAttribute('title', item.name || 'Untitled Recipe');

      itemDiv.innerHTML = `
        <div onclick="selectActiveRecipeTarget('${filename}')" style="cursor: pointer; user-select: none; width: 100%; display: flex; align-items: center; justify-content: center; padding: 4px 0;">
          ${visualIconHtml}
        </div>
      `;
    } else {
      itemDiv.setAttribute('onclick', `loadRecipeFromState('${filename}')`);
      itemDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:8px; box-sizing:border-box; position:relative;">
          <div style="display:flex; flex-direction:column; gap:2px; min-width:0; flex:1;">
            <input type="text" class="sidebar-rename-field" value="${item.name || 'Untitled Recipe'}"
              onclick="event.stopPropagation();"
              oninput="updateRecipeFilenameInline('${filename}', this)"
              style="background:#14151c !important; border:1px solid #262836 !important; border-radius:4px !important; color:#fff !important; font-weight:600 !important; font-size:11px !important; padding:4px 6px !important; margin:0 0 2px 0 !important; outline:none !important; width:100% !important; min-width:0 !important; text-overflow:ellipsis; box-sizing:border-box !important;" />
            <span style="font-size:9px; color:${badgeColor}; font-weight:bold; text-transform:uppercase; letter-spacing:0.3px; user-select:none;">${cleanType}</span>
          </div>
          <div class="recipe-item-actions-wrapper" onclick="event.stopPropagation();" style="display:flex; gap:8px; align-items:center; flex-shrink:0;">
            <span class="sidebar-action-icon-tile dots-trigger" title="More Actions" onclick="toggleContextDropdownMenu(event, '${filename}')" style="cursor:pointer; font-size:14px; opacity:0.6; padding:4px; user-select:none; line-height:1;">⋮</span>
            <span class="sidebar-action-icon-tile" title="Delete Card Entry" onclick="deleteRecipeTarget('${filename}')" style="cursor:pointer; font-size:12px; opacity:0.6; padding:4px; color:var(--danger); line-height:1;">🗑️</span>

            <div id="dropdown_${filename}" class="context-dropdown-menu hidden" style="background:#1b1c24; border:1px solid #262836; border-radius:4px; padding:4px 0; z-index:1000; min-width:130px; box-shadow:0 4px 10px rgba(0,0,0,0.5);">
              <div onclick="duplicateRecipeTarget('${filename}')" style="padding:6px 12px; font-size:11px; color:#fff; cursor:pointer; hover:background:#232530;"> Duplicate</div>
              <div onclick="downloadSingleJsonFileDirectly('${filename}')" style="padding:6px 12px; font-size:11px; color:#fff; cursor:pointer; hover:background:#232530;"> Download JSON</div>
            </div>
          </div>
        </div>
      `;
    }
    listContainer.appendChild(itemDiv);
  });
}

function executeSidebarCollapseToggle() {
  const sidebar = document.getElementById('mainSidebarLayout') || document.querySelector('.sidebar-left');
  const toggleBtn = document.getElementById('sidebarCollapseBtn') || document.querySelector('.btn-collapse-toggle');

  if (!sidebar) {
    console.error('Critical Error: Left sidebar element container not found in DOM.');
    return;
  }

  isSidebarCollapsed = !isSidebarCollapsed;

  sidebar.classList.toggle('collapsed-slim', isSidebarCollapsed);

  if (toggleBtn) {
    toggleBtn.textContent = isSidebarCollapsed ? '<' : '>';
  }

  if (typeof renderSidebarList === 'function') {
    renderSidebarList();
  }
}

window.toggleSidebarCollapseState = function () {
  executeSidebarCollapseToggle();
};

function createNewRecipeLayout() {

  const id = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  recipesDatabase[id] = {
    id: id,
    name: 'Untitled Template Module',
    engine: 'create:pressing',
    platform: 'universal',
    enginesData: {},
    conditionsByEngine: {},
    conditions: [],
    pasteState: {},
    platformByEngine: {},
  };

  if (window.workspaceIsolatorState) {
    window.workspaceIsolatorState.isParsingLock = false;
  }

  if (typeof loadRecipeFromState === 'function') loadRecipeFromState(id);
}

function updateRecipeFilenameInline(oldFilename, inputElement) {
  if (!inputElement) return;
  const newName = inputElement.value;
  if (recipesDatabase[oldFilename]) {
    recipesDatabase[oldFilename].name = newName;
    const titleInput = document.getElementById('recipeTitle');
    if (titleInput && oldFilename === activeRecipeId) {
      titleInput.value = newName;
    }
    if (typeof saveActiveRecipeState === 'function') saveActiveRecipeState();
  }
}

function cloneRecipeLayoutProfile(filename) {
  if (!recipesDatabase[filename]) return;
  const source = recipesDatabase[filename];
  const cloneId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  recipesDatabase[cloneId] = JSON.parse(JSON.stringify(source));
  recipesDatabase[cloneId].id = cloneId;
  recipesDatabase[cloneId].name = `${source.name || 'Untitled'} (Copy)`;
  if (typeof loadRecipeFromState === 'function') loadRecipeFromState(cloneId);
  renderSidebarList();
  if (typeof compileRecipe === 'function') compileRecipe();
}

function downloadSingleJsonFileDirectly(filename) {
  if (!recipesDatabase[filename]) return;
  if (typeof loadRecipeFromState === 'function') loadRecipeFromState(filename);
  if (typeof downloadRecipeJson === 'function') downloadRecipeJson();
}


function duplicateRecipeTarget(id) {
  cloneRecipeLayoutProfile(id);
}

function getRecipeVisualIcon(recipeEngine) {
  let icon = '🔨';
  const engine = (recipeEngine || '').replace('create:', '');
  if (engine === 'mixing') icon = '🌀';
  if (engine === 'compacting') icon = '📦';
  if (engine === 'pressing') icon = '🖨️';
  if (engine === 'cutting') icon = '🪚';
  if (engine === 'milling') icon = '⚙️';
  if (engine === 'crushing') icon = '🛞';
  if (engine === 'filling') icon = '🧪';
  if (engine === 'splashing') icon = '💦';
  if (engine === 'smoking') icon = '💨';
  if (engine === 'blasting') icon = '🔥';
  if (engine === 'haunting') icon = '👻';
  if (engine === 'deploying') icon = '🤖';
  if (engine === 'sequenced_assembly') icon = '⛓️';
  if (engine === 'mechanical_crafting') icon = '🧩';
  return icon;
}


window._activeDropdownTrigger = window._activeDropdownTrigger || null;

function _positionContextDropdown(dropdown, trigger) {
  if (!dropdown || !trigger) return;
  const rect = trigger.getBoundingClientRect();
  const menuWidth = 130;
  const menuHeightEstimate = 74; // ~2 rows

  let left = rect.right - menuWidth;
  let top = rect.bottom + 4;


  if (top + menuHeightEstimate > window.innerHeight) {
    top = rect.top - menuHeightEstimate - 4;
  }

  if (left < 8) left = 8;
  if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;

  dropdown.style.position = 'fixed';
  dropdown.style.top = `${top}px`;
  dropdown.style.left = `${left}px`;
  dropdown.style.right = 'auto';
}

function toggleContextDropdownMenu(event, filename) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById(`dropdown_${filename}`);
  if (!dropdown) return;

  if (activeOpenDropdownId && activeOpenDropdownId !== `dropdown_${filename}`) {
    const openDropdown = document.getElementById(activeOpenDropdownId);
    if (openDropdown) openDropdown.classList.add('hidden');
  }

  const willOpen = dropdown.classList.contains('hidden');
  dropdown.classList.toggle('hidden');
  activeOpenDropdownId = dropdown.classList.contains('hidden') ? null : `dropdown_${filename}`;

  if (willOpen) {
    const trigger = (event && event.target && event.target.closest('.dots-trigger')) || (event && event.target) || dropdown;


    document.body.appendChild(dropdown);
    _positionContextDropdown(dropdown, trigger);
    window._activeDropdownTrigger = trigger;
  } else {
    window._activeDropdownTrigger = null;
  }
}


window.addEventListener('resize', () => {
  if (!activeOpenDropdownId || !window._activeDropdownTrigger) return;
  const dropdown = document.getElementById(activeOpenDropdownId);
  if (!dropdown || dropdown.classList.contains('hidden')) return;
  _positionContextDropdown(dropdown, window._activeDropdownTrigger);
});

document.addEventListener('click', () => {
  if (activeOpenDropdownId) {
    const openDropdown = document.getElementById(activeOpenDropdownId);
    if (openDropdown) openDropdown.classList.add('hidden');
    activeOpenDropdownId = null;
    window._activeDropdownTrigger = null;
  }
});
