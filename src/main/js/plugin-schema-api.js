/**
 * plugin-schema-api.js
*/

(function () {

// ── DOM builders: schema field -> HTML string ──────────────────────

function _escAttr(v) {
  return String(v ?? '').replace(/"/g, '&quot;');
}

function _fieldWrapperOpen(field, extraStyle) {
  const cls = ['grid-cell-stacked-box', field.className].filter(Boolean).join(' ');
  const combinedStyle = [extraStyle, field.style].filter(Boolean).join('; ');
  const styleAttr = combinedStyle ? ` style="${_escAttr(combinedStyle)}"` : '';
  return `<div class="${cls}" data-field-key="${_escAttr(field.key)}"${styleAttr}>`;
}

function _hintHtml(field) {
  return field.hint
    ? `<div class="grid-cell-context-hint">${field.hint}</div>`
    : '';
}

function _renderItemField(field) {
  return `
    ${_fieldWrapperOpen(field)}
      <label style="margin-top:0;">${field.label || field.key}</label>
      <input type="text" class="plugin-field plugin-field-item" data-key="${_escAttr(field.key)}"
        placeholder="${_escAttr(field.placeholder || 'example: minecraft:iron_ingot')}"
        oninput="compileRecipe()">
    </div>
    ${_hintHtml(field)}`;
}

function _renderFluidField(field) {
  return `
    ${_fieldWrapperOpen(field)}
      <label style="margin-top:0;">${field.label || field.key}</label>
      <div style="display:flex; gap:10px; width:100%;">
        <input type="text" class="plugin-field plugin-field-fluid-id" data-key="${_escAttr(field.key)}"
          placeholder="${_escAttr(field.placeholder || 'example: minecraft:water')}"
          style="flex:1; width:100% !important;" oninput="compileRecipe()">
        <input type="number" class="plugin-field plugin-field-fluid-amount" data-key="${_escAttr(field.key)}"
          value="${_escAttr(field.default?.amount ?? 1000)}" step="100" min="0"
          style="flex:0 0 90px; width:90px !important;" oninput="compileRecipe()">
      </div>
    </div>
    ${_hintHtml(field)}`;
}

function _renderNumberField(field) {
  return `
    ${_fieldWrapperOpen(field)}
      <label style="margin-top:0;">${field.label || field.key}</label>
      <input type="number" class="plugin-field plugin-field-number" data-key="${_escAttr(field.key)}"
        value="${_escAttr(field.default ?? '')}"
        ${field.min !== undefined ? `min="${_escAttr(field.min)}"` : ''}
        ${field.max !== undefined ? `max="${_escAttr(field.max)}"` : ''}
        oninput="compileRecipe()">
    </div>
    ${_hintHtml(field)}`;
}

function _renderTextField(field) {
  return `
    ${_fieldWrapperOpen(field)}
      <label style="margin-top:0;">${field.label || field.key}</label>
      <input type="text" class="plugin-field plugin-field-text" data-key="${_escAttr(field.key)}"
        value="${_escAttr(field.default ?? '')}"
        placeholder="${_escAttr(field.placeholder || '')}"
        oninput="compileRecipe()">
    </div>
    ${_hintHtml(field)}`;
}

function _renderBooleanField(field) {
  return `
    ${_fieldWrapperOpen(field, 'flex-direction:row; align-items:center; gap:8px;')}
      <input type="checkbox" class="plugin-field plugin-field-boolean" data-key="${_escAttr(field.key)}"
        ${field.default ? 'checked' : ''} onchange="compileRecipe()">
      <label style="margin:0;">${field.label || field.key}</label>
    </div>
    ${_hintHtml(field)}`;
}

function _renderSelectField(field) {
  const opts = (field.options || []).map(o =>
    `<option value="${_escAttr(o.value)}" ${o.value === field.default ? 'selected' : ''}>${o.label || o.value}</option>`
  ).join('');
  return `
    ${_fieldWrapperOpen(field)}
      <label style="margin-top:0;">${field.label || field.key}</label>
      <select class="plugin-field plugin-field-select" data-key="${_escAttr(field.key)}" onchange="compileRecipe()">
        ${opts}
      </select>
    </div>
    ${_hintHtml(field)}`;
}

// Renders the inner fields of a single list/step row (used by both
// `list` and `steps` types when building one repeatable row's markup).
function _renderInlineSubFields(fields, prefix) {
  return (fields || []).map(f => {
    const inputId = `${prefix}-${f.key}`;
    switch (f.type) {
      case 'item':
        return `<div style="display:flex; flex-direction:column; gap:4px; flex:1; min-width:120px;">
          <label style="margin:0; font-size:10px;">${f.label || f.key}</label>
          <input type="text" class="plugin-subfield plugin-subfield-item" data-key="${_escAttr(f.key)}"
            placeholder="${_escAttr(f.placeholder || 'item id')}" oninput="compileRecipe()" style="width:100% !important;">
        </div>`;
      case 'number':
        return `<div style="display:flex; flex-direction:column; gap:4px; flex:0 0 90px;">
          <label style="margin:0; font-size:10px;">${f.label || f.key}</label>
          <input type="number" class="plugin-subfield plugin-subfield-number" data-key="${_escAttr(f.key)}"
            value="${_escAttr(f.default ?? '')}" oninput="compileRecipe()" style="width:90px !important;">
        </div>`;
      case 'text':
        return `<div style="display:flex; flex-direction:column; gap:4px; flex:1; min-width:120px;">
          <label style="margin:0; font-size:10px;">${f.label || f.key}</label>
          <input type="text" class="plugin-subfield plugin-subfield-text" data-key="${_escAttr(f.key)}"
            value="${_escAttr(f.default ?? '')}" oninput="compileRecipe()" style="width:100% !important;">
        </div>`;
      case 'boolean':
        return `<div style="display:flex; align-items:center; gap:6px; flex:0 0 auto;">
          <input type="checkbox" class="plugin-subfield plugin-subfield-boolean" data-key="${_escAttr(f.key)}"
            ${f.default ? 'checked' : ''} onchange="compileRecipe()">
          <label style="margin:0; font-size:10px;">${f.label || f.key}</label>
        </div>`;
      case 'select': {
        const opts = (f.options || []).map(o =>
          `<option value="${_escAttr(o.value)}" ${o.value === f.default ? 'selected' : ''}>${o.label || o.value}</option>`
        ).join('');
        return `<div style="display:flex; flex-direction:column; gap:4px; flex:0 0 140px;">
          <label style="margin:0; font-size:10px;">${f.label || f.key}</label>
          <select class="plugin-subfield plugin-subfield-select" data-key="${_escAttr(f.key)}" onchange="compileRecipe()" style="width:140px !important;">${opts}</select>
        </div>`;
      }
      default:
        return '';
    }
  }).join('');
}

function _renderListField(field) {
  return `
    ${_fieldWrapperOpen(field, 'width:100%;')}
      <label style="margin-top:0;">${field.label || field.key}</label>
      <div class="plugin-list-container" data-key="${_escAttr(field.key)}" data-field-type="list"
        style="display:flex; flex-direction:column; gap:8px; margin-top:6px;"></div>
      <button type="button" class="btn-util" style="margin-top:8px; width:auto;"
        onclick="window._pluginListAddRow(this, ${JSON.stringify(field.itemFields).replace(/"/g, '&quot;')})">
        + Add ${field.label || field.key}
      </button>
    </div>
    ${_hintHtml(field)}`;
}

function _renderStepsField(field) {
  const typeOptions = (field.stepTypes || []).map(st =>
    `<option value="${_escAttr(st.value)}">${st.label || st.value}</option>`
  ).join('');
  return `
    ${_fieldWrapperOpen(field, 'width:100%;')}
      <label style="margin-top:0;">${field.label || field.key}</label>
      <div class="plugin-steps-container" data-key="${_escAttr(field.key)}" data-field-type="steps"
        style="display:flex; flex-direction:column; gap:10px; margin-top:6px;"></div>
      <button type="button" class="btn-util" style="margin-top:8px; width:auto;"
        onclick="window._pluginStepsAddRow(this, '${_escAttr(field.key)}')"
        data-step-types="${_escAttr(JSON.stringify(field.stepTypes || []))}"
      >
        + Add Step
      </button>
    </div>
    ${_hintHtml(field)}`;
}

function _renderGridField(field) {
  return `
    ${_fieldWrapperOpen(field, 'width:100%;')}
      <label style="margin-top:0;">${field.label || field.key}</label>
      <div style="display:flex; gap:16px; margin:8px 0;">
        <div style="display:flex; flex-direction:column; gap:4px; width:70px;">
          <label style="font-size:10px;">Width</label>
          <input type="number" class="plugin-grid-width" data-key="${_escAttr(field.key)}" value="3" min="1" max="9"
            onchange="window._pluginGridRebuild(this)" style="width:70px !important;">
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; width:70px;">
          <label style="font-size:10px;">Height</label>
          <input type="number" class="plugin-grid-height" data-key="${_escAttr(field.key)}" value="3" min="1" max="9"
            onchange="window._pluginGridRebuild(this)" style="width:70px !important;">
        </div>
      </div>
      <div class="plugin-grid-matrix" data-key="${_escAttr(field.key)}" data-field-type="grid"
        style="display:flex; flex-direction:column; gap:4px; background:#14151c; padding:10px; border-radius:4px; border:1px solid #232530; width:fit-content;"></div>
      <div class="plugin-grid-keys" data-key="${_escAttr(field.key)}"
        style="display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-top:10px;"></div>
    </div>
    ${_hintHtml(field)}
    ${_gridAutoInitHtml(field.key)}`;
}

function _gridAutoInitHtml(fieldKey) {
  const key = _escAttr(fieldKey);
  return `<img src="" alt="" style="display:none" data-grid-autoinit-for="${key}"
    onerror="this.remove(); var w=this.closest('[data-field-key=&quot;${key}&quot;]'); var m=w&&w.querySelector('.plugin-grid-matrix'); if(m&&!m.children.length){var wi=w.querySelector('.plugin-grid-width'); if(wi&&window._pluginGridRebuild)window._pluginGridRebuild(wi);}">`;
}

const FIELD_RENDERERS = {
  item: _renderItemField,
  fluid: _renderFluidField,
  number: _renderNumberField,
  text: _renderTextField,
  boolean: _renderBooleanField,
  select: _renderSelectField,
  list: _renderListField,
  steps: _renderStepsField,
  grid: _renderGridField,
};

// ── Extensible field-type registry ──────────────────────────────────

const _customFieldTypes = {};

function registerFieldType(typeName, definition) {
  if (!typeName || typeof definition !== 'object' || definition === null) {
    console.error('registerFieldType: requires a type name and a definition object.');
    return;
  }
  if (typeof definition.render !== 'function') {
    console.error(`registerFieldType('${typeName}'): definition.render(field) is required.`);
    return;
  }
  if (FIELD_RENDERERS[typeName]) {
    console.error(`registerFieldType('${typeName}'): that name is already a built-in field type.`);
    return;
  }
  _customFieldTypes[typeName] = definition;
}

function _rendererFor(type) {
  return FIELD_RENDERERS[type] || (_customFieldTypes[type] && ((field) => _customFieldTypes[type].render(field)));
}


const GRID_FIELD_TYPES = new Set(['item', 'fluid', 'number', 'text', 'boolean', 'select']);


function _isCompactField(field) {
  if (field.layout === 'compact') return true;
  if (field.layout === 'full') return false;
  if (GRID_FIELD_TYPES.has(field.type)) return true;
  const custom = _customFieldTypes[field.type];
  return !!(custom && custom.layout === 'compact');
}

function _renderFieldRun(fields) {
  let html = '';
  let i = 0;
  let renderedAny = false;

  while (i < fields.length) {
    const field = fields[i];
    const renderer = _rendererFor(field.type);
    if (!renderer) {
      console.warn(`Plugin schema: unknown field type "${field.type}" for field "${field.key}". Skipping.`);
      i++;
      continue;
    }

    if (_isCompactField(field)) {
      let groupHtml = '';
      while (i < fields.length && _isCompactField(fields[i])) {
        const r = _rendererFor(fields[i].type);
        if (!r) { i++; continue; }
        groupHtml += r(fields[i]);
        i++;
      }
      html += `<div class="left-aligned-layout-grid" style="margin-top:${renderedAny ? '10px' : '0'};">${groupHtml}</div>`;
    } else {
      html += `<div style="margin-top:${renderedAny ? '12px' : '0'}; width:100%;">${renderer(field)}</div>`;
      i++;
    }
    renderedAny = true;
  }

  return html;
}

function _rootIdFor(engineKey) {
  return 'plugin-engine-root-' + String(engineKey).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function renderSchemaForm(schema) {
  const fields = schema.fields || [];
  const sectionDefs = {};
  (schema.sections || []).forEach(s => { sectionDefs[s.id] = s; });


  const runs = [];
  fields.forEach(field => {
    const sid = field.section || null;
    const last = runs[runs.length - 1];
    if (last && last.sid === sid) last.fields.push(field);
    else runs.push({ sid, fields: [field] });
  });

  const sectionsHtml = runs.map((run, idx) => {
    const inner = _renderFieldRun(run.fields);
    const divider = idx > 0 ? 'margin-top:20px; padding-top:18px; border-top:1px solid #3c3f54;' : '';

    if (!run.sid) {
      return `<div style="${divider} width:100%;">${inner}</div>`;
    }

    const def = sectionDefs[run.sid];
    const title = (def && (def.label || def.title)) || run.sid;
    const align = def && (def.align === 'center' || def.align === 'right') ? def.align : 'left';
    const sectionCls = def && def.className ? ` ${def.className}` : '';
    const sectionStyle = def && def.style ? `; ${def.style}` : '';

    return `
    <div class="plugin-section${sectionCls}" style="${divider} width:100%${sectionStyle};">
      <div style="font-size:13px; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:0.5px; text-align:${align}; margin-bottom:12px;">${title}</div>
      ${inner}
    </div>`;
  }).join('\n');

  const rootId = _rootIdFor(schema.key);
  const rootCls = ['plugin-engine-root', schema.className].filter(Boolean).join(' ');
  const rootStyle = schema.style ? ` style="${_escAttr(schema.style)}"` : '';
  const cssBlock = schema.css ? `<style>${schema.css}</style>` : '';

  return `${cssBlock}<div id="${rootId}" class="${rootCls}" data-engine-key="${_escAttr(schema.key)}"${rootStyle}>${sectionsHtml}</div>`;
}

// ── Dynamic row helpers for list / steps / grid (exposed globally so
// inline onclick handlers in the generated HTML can call them) ──

window._pluginListAddRow = function (btnEl, itemFields) {
  const wrapper = btnEl.closest('[data-field-key]');
  const container = wrapper?.querySelector('.plugin-list-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'plugin-list-row';
  row.style.cssText = 'display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; background:#14151c; border:1px solid #232530; border-radius:6px; padding:10px;';
  row.innerHTML = _renderInlineSubFields(itemFields, `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const removeBtn = document.createElement('span');
  removeBtn.textContent = '✕ Remove';
  removeBtn.style.cssText = 'color:var(--danger); font-size:10px; cursor:pointer; flex-shrink:0; align-self:center;';
  removeBtn.onclick = () => { row.remove(); if (typeof compileRecipe === 'function') compileRecipe(); };
  row.appendChild(removeBtn);
  container.appendChild(row);
  if (typeof compileRecipe === 'function') compileRecipe();
};

window._pluginStepsAddRow = function (btnEl, fieldKey) {
  const stepTypes = JSON.parse(btnEl.getAttribute('data-step-types') || '[]');
  const wrapper = btnEl.closest('[data-field-key]');
  const container = wrapper?.querySelector('.plugin-steps-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'plugin-step-row';
  row.style.cssText = 'background:#14151c; border:1px solid #3c3f54; border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:8px;';

  const typeOptions = stepTypes.map(st => `<option value="${st.value}">${st.label || st.value}</option>`).join('');
  const header = document.createElement('div');
  header.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
  header.innerHTML = `
    <select class="plugin-step-type-select" style="width:auto;">${typeOptions}</select>
    <span style="color:var(--danger); font-size:10px; cursor:pointer;">✕ Remove</span>
  `;
  header.querySelector('span').onclick = () => { row.remove(); if (typeof compileRecipe === 'function') compileRecipe(); };
  row.appendChild(header);

  const subFieldsContainer = document.createElement('div');
  subFieldsContainer.style.cssText = 'display:flex; gap:10px; flex-wrap:wrap;';
  row.appendChild(subFieldsContainer);

  function rebuildSubFields() {
    const selected = stepTypes.find(st => st.value === header.querySelector('select').value);
    subFieldsContainer.innerHTML = _renderInlineSubFields(selected?.fields || [], `step-${Date.now()}`);
    if (typeof compileRecipe === 'function') compileRecipe();
  }
  header.querySelector('select').onchange = rebuildSubFields;
  rebuildSubFields();

  container.appendChild(row);
  if (typeof compileRecipe === 'function') compileRecipe();
};

window._pluginGridRebuild = function (inputEl) {
  const fieldKey = inputEl.getAttribute('data-key');
  const wrapper = inputEl.closest('[data-field-key]');
  if (!wrapper) return;
  const widthEl = wrapper.querySelector('.plugin-grid-width');
  const heightEl = wrapper.querySelector('.plugin-grid-height');
  const matrixEl = wrapper.querySelector('.plugin-grid-matrix');
  const keysEl = wrapper.querySelector('.plugin-grid-keys');
  const w = parseInt(widthEl.value, 10) || 3;
  const h = parseInt(heightEl.value, 10) || 3;

  matrixEl.innerHTML = '';
  for (let r = 0; r < h; r++) {
    const rowDiv = document.createElement('div');
    rowDiv.style.cssText = 'display:flex; gap:4px;';
    for (let c = 0; c < w; c++) {
      const cell = document.createElement('input');
      cell.type = 'text';
      cell.maxLength = 1;
      cell.className = 'plugin-grid-cell';
      cell.setAttribute('data-row', r);
      cell.setAttribute('data-col', c);
      cell.style.cssText = 'width:32px; height:32px; text-align:center; text-transform:uppercase; background:#0c0c0e; border:1px solid #232530; border-radius:4px; color:#fff; font-weight:bold;';
      cell.oninput = () => {
        cell.value = cell.value.toUpperCase();
        _pluginGridSyncKeys(wrapper);
        if (typeof compileRecipe === 'function') compileRecipe();
      };
      rowDiv.appendChild(cell);
    }
    matrixEl.appendChild(rowDiv);
  }
  _pluginGridSyncKeys(wrapper);
  if (typeof compileRecipe === 'function') compileRecipe();
};

function _pluginGridSyncKeys(wrapper) {
  const keysEl = wrapper.querySelector('.plugin-grid-keys');
  const usedSymbols = new Set();
  wrapper.querySelectorAll('.plugin-grid-cell').forEach(c => {
    if (c.value.trim()) usedSymbols.add(c.value.trim());
  });
  const existing = {};
  keysEl.querySelectorAll('[data-symbol]').forEach(row => {
    existing[row.getAttribute('data-symbol')] = row.querySelector('input').value;
  });
  keysEl.innerHTML = '';
  usedSymbols.forEach(sym => {
    const row = document.createElement('div');
    row.setAttribute('data-symbol', sym);
    row.style.cssText = 'display:flex; gap:6px; align-items:center;';
    row.innerHTML = `
      <span style="width:20px; text-align:center; font-weight:bold; color:var(--accent);">${sym}</span>
      <input type="text" value="${existing[sym] || ''}" placeholder="item id"
        style="flex:1; height:22px; background:#14151c; border:1px solid #232530; border-radius:4px; color:#fff; padding:0 6px; font-size:11px;"
        oninput="if(typeof compileRecipe==='function')compileRecipe();">
    `;
    keysEl.appendChild(row);
  });
}

// ── Save: DOM -> data, driven by the schema ─────────────────────────

function readFieldValue(field, container) {
  const custom = _customFieldTypes[field.type];
  if (custom) {
    return typeof custom.read === 'function'
      ? custom.read(container, field)
      : (field.default !== undefined ? field.default : '');
  }
  switch (field.type) {
    case 'item':
    case 'text':
      return container.querySelector(`[data-key="${field.key}"]`)?.value || '';
    case 'fluid': {
      const idEl = container.querySelector(`.plugin-field-fluid-id[data-key="${field.key}"]`);
      const amtEl = container.querySelector(`.plugin-field-fluid-amount[data-key="${field.key}"]`);
      return { id: idEl?.value || '', amount: amtEl?.value || '1000' };
    }
    case 'number':
      return container.querySelector(`[data-key="${field.key}"]`)?.value || '';
    case 'boolean':
      return !!container.querySelector(`[data-key="${field.key}"]`)?.checked;
    case 'select':
      return container.querySelector(`[data-key="${field.key}"]`)?.value || '';
    case 'list': {
      const listContainer = container.querySelector(`.plugin-list-container[data-key="${field.key}"]`);
      if (!listContainer) return [];
      return Array.from(listContainer.children).map(row => {
        const rowData = {};
        (field.itemFields || []).forEach(sf => {
          const el = row.querySelector(`[data-key="${sf.key}"]`);
          if (!el) return;
          rowData[sf.key] = sf.type === 'boolean' ? !!el.checked : el.value;
        });
        return rowData;
      });
    }
    case 'steps': {
      const stepsContainer = container.querySelector(`.plugin-steps-container[data-key="${field.key}"]`);
      if (!stepsContainer) return [];
      return Array.from(stepsContainer.children).map(row => {
        const type = row.querySelector('.plugin-step-type-select')?.value || '';
        const stepDef = (field.stepTypes || []).find(st => st.value === type);
        const stepData = { type };
        (stepDef?.fields || []).forEach(sf => {
          const el = row.querySelector(`[data-key="${sf.key}"]`);
          if (!el) return;
          stepData[sf.key] = sf.type === 'boolean' ? !!el.checked : el.value;
        });
        return stepData;
      });
    }
    case 'grid': {
      const wrapper = container.querySelector(`[data-field-key="${field.key}"]`);
      if (!wrapper) return { width: 3, height: 3, pattern: [], key: {} };
      const width = parseInt(wrapper.querySelector('.plugin-grid-width')?.value, 10) || 3;
      const height = parseInt(wrapper.querySelector('.plugin-grid-height')?.value, 10) || 3;
      const pattern = [];
      for (let r = 0; r < height; r++) {
        let row = '';
        for (let c = 0; c < width; c++) {
          const cell = wrapper.querySelector(`.plugin-grid-cell[data-row="${r}"][data-col="${c}"]`);
          row += cell?.value?.trim() || ' ';
        }
        pattern.push(row);
      }
      const key = {};
      wrapper.querySelectorAll('.plugin-grid-keys [data-symbol]').forEach(row => {
        const sym = row.getAttribute('data-symbol');
        const val = row.querySelector('input')?.value || '';
        if (sym && val) key[sym] = val;
      });
      return { width, height, pattern, key };
    }
    default:
      return null;
  }
}

function _engineContainer(engineKey) {
  const slot = document.getElementById('pluginRecipeFormSlot');
  if (!slot) return null;
  return document.getElementById(_rootIdFor(engineKey)) || slot;
}

function saveSchemaData(schema, recipe, engineKey) {
  if (!recipe.enginesData) recipe.enginesData = {};
  const container = _engineContainer(engineKey);
  if (!container) return;
  const data = {};
  (schema.fields || []).forEach(field => {
    data[field.key] = readFieldValue(field, container);
  });
  recipe.enginesData[engineKey] = data;
}

// ── Restore: data -> DOM, driven by the schema ──────────────────────

function writeFieldValue(field, container, value) {
  const custom = _customFieldTypes[field.type];
  if (custom) {
    if (typeof custom.write === 'function') custom.write(container, field, value);
    return;
  }
  switch (field.type) {
    case 'item':
    case 'text': {
      const el = container.querySelector(`[data-key="${field.key}"]`);
      if (el) el.value = value || '';
      break;
    }
    case 'fluid': {
      const idEl = container.querySelector(`.plugin-field-fluid-id[data-key="${field.key}"]`);
      const amtEl = container.querySelector(`.plugin-field-fluid-amount[data-key="${field.key}"]`);
      if (idEl) idEl.value = value?.id || '';
      if (amtEl) amtEl.value = value?.amount || '1000';
      break;
    }
    case 'number': {
      const el = container.querySelector(`[data-key="${field.key}"]`);
      if (el) el.value = value ?? field.default ?? '';
      break;
    }
    case 'boolean': {
      const el = container.querySelector(`[data-key="${field.key}"]`);
      if (el) el.checked = !!value;
      break;
    }
    case 'select': {
      const el = container.querySelector(`[data-key="${field.key}"]`);
      if (el) el.value = value || field.default || '';
      break;
    }
    case 'list': {
      const wrapper = container.querySelector(`[data-field-key="${field.key}"]`);
      const listContainer = wrapper?.querySelector('.plugin-list-container');
      const addBtn = wrapper?.querySelector('button');
      if (!listContainer) break;
      listContainer.innerHTML = '';
      (value || []).forEach(rowData => {
        if (addBtn) addBtn.click();
        const row = listContainer.lastElementChild;
        if (!row) return;
        (field.itemFields || []).forEach(sf => {
          const el = row.querySelector(`[data-key="${sf.key}"]`);
          if (!el) return;
          if (sf.type === 'boolean') el.checked = !!rowData[sf.key];
          else el.value = rowData[sf.key] ?? '';
        });
      });
      break;
    }
    case 'steps': {
      const wrapper = container.querySelector(`[data-field-key="${field.key}"]`);
      const stepsContainer = wrapper?.querySelector('.plugin-steps-container');
      const addBtn = wrapper?.querySelector('button');
      if (!stepsContainer) break;
      stepsContainer.innerHTML = '';
      (value || []).forEach(stepData => {
        if (addBtn) addBtn.click();
        const row = stepsContainer.lastElementChild;
        if (!row) return;
        const typeSel = row.querySelector('.plugin-step-type-select');
        if (typeSel) {
          typeSel.value = stepData.type || '';
          typeSel.dispatchEvent(new Event('change'));
        }
        const stepDef = (field.stepTypes || []).find(st => st.value === stepData.type);
        (stepDef?.fields || []).forEach(sf => {
          const el = row.querySelector(`[data-key="${sf.key}"]`);
          if (!el) return;
          if (sf.type === 'boolean') el.checked = !!stepData[sf.key];
          else el.value = stepData[sf.key] ?? '';
        });
      });
      break;
    }
    case 'grid': {
      const wrapper = container.querySelector(`[data-field-key="${field.key}"]`);
      if (!wrapper) break;
      const widthEl = wrapper.querySelector('.plugin-grid-width');
      const heightEl = wrapper.querySelector('.plugin-grid-height');
      if (widthEl) widthEl.value = value?.width || 3;
      if (heightEl) heightEl.value = value?.height || 3;
      window._pluginGridRebuild(widthEl);
      (value?.pattern || []).forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          const cell = wrapper.querySelector(`.plugin-grid-cell[data-row="${r}"][data-col="${c}"]`);
          if (cell && row[c] !== ' ') cell.value = row[c];
        }
      });
      _pluginGridSyncKeys(wrapper);
      Object.entries(value?.key || {}).forEach(([sym, itemId]) => {
        const symRow = wrapper.querySelector(`[data-symbol="${sym}"] input`);
        if (symRow) symRow.value = itemId;
      });
      break;
    }
  }
}

function restoreSchemaData(schema, recipe, engineKey) {
  const data = recipe?.enginesData?.[engineKey] || {};
  const container = _engineContainer(engineKey);
  if (!container) return;
  (schema.fields || []).forEach(field => {
    writeFieldValue(field, container, data[field.key]);
  });
}

// ── Helpers passed into the author's compile() function ─────────────

function buildItemNode(value) {
  const itemKey = typeof getItemKey === 'function' ? getItemKey() : 'item';
  if (!value) return {};
  return value.startsWith('#')
    ? { tag: value.replace(/^#/, '') }
    : { [itemKey]: value };
}

function buildFluidNode(value) {
  if (!value || !value.id) return {};
  const idClean = value.id.replace(/^#/, '');
  return value.id.startsWith('#')
    ? { fluidTag: idClean, amount: parseInt(value.amount, 10) || 1000 }
    : { fluid: idClean, amount: parseInt(value.amount, 10) || 1000 };
}

function parseItemNode(node) {
  if (!node || typeof node !== 'object') return '';
  if (node.tag) return '#' + node.tag;
  if (node.item) return node.item;
  return '';
}

function parseFluidNode(node) {
  if (!node || typeof node !== 'object') return { id: '', amount: '1000' };
  if (node.fluidTag) return { id: '#' + node.fluidTag, amount: String(node.amount ?? 1000) };
  if (node.fluid) return { id: node.fluid, amount: String(node.amount ?? 1000) };
  return { id: '', amount: '1000' };
}

const schemaHelpers = {
  buildItemNode,
  buildFluidNode,
  parseItemNode,
  parseFluidNode,
};


function defaultFromJson(schema, recipeData) {
  const data = {};
  (schema.fields || []).forEach(field => {
    if (field.type === 'grid') {
      
      const raw = field.jsonPath ? _getByPath(recipeData, field.jsonPath) : recipeData;
      data[field.key] = _parseGridValue(raw);
      return;
    }

    if (!field.jsonPath) {
      data[field.key] = field.default !== undefined
        ? field.default
        : (field.type === 'list' || field.type === 'steps' ? [] : '');
      return;
    }

    const raw = _getByPath(recipeData, field.jsonPath);

    if (field.type === 'list' && Array.isArray(raw)) {
      data[field.key] = raw.map(rowRaw => _autoParseRow(field.itemFields, rowRaw));
    } else if (field.type === 'steps' && Array.isArray(raw)) {
      data[field.key] = raw.map(rawStep => {
        const type = rawStep?.type || '';
        const stepDef = (field.stepTypes || []).find(st => st.value === type);
        const row = _autoParseRow(stepDef?.fields, rawStep);
        row.type = type;
        return row;
      });
    } else {
      data[field.key] = _autoParseFieldValue(field, raw);
    }
  });
  return data;
}

function _autoParseFieldValue(field, rawValue) {
  if (rawValue === undefined || rawValue === null) {
    return field.default !== undefined ? field.default : '';
  }
  const custom = _customFieldTypes[field.type];
  if (custom) {
    return typeof custom.parseJson === 'function' ? custom.parseJson(rawValue, field) : rawValue;
  }
  switch (field.type) {
    case 'item': return parseItemNode(rawValue);
    case 'fluid': return parseFluidNode(rawValue);
    case 'boolean': return !!rawValue;
    case 'number': return field.percent
      ? String((parseFloat(rawValue) || 0) * 100)
      : String(rawValue);
    default: return String(rawValue);
  }
}


function _autoParseRow(subFields, rawRow) {
  const row = {};
  (subFields || []).forEach(sf => {
    const raw = (sf.spread && (sf.type === 'item' || sf.type === 'fluid')) ? rawRow : rawRow?.[sf.key];
    row[sf.key] = _autoParseFieldValue(sf, raw);
  });
  return row;
}

function _parseGridValue(raw) {
  const pattern = Array.isArray(raw?.pattern) ? raw.pattern : [];
  const height = pattern.length || 3;
  const width = pattern.length ? Math.max(...pattern.map(r => r.length)) : 3;
  const key = {};
  Object.entries(raw?.key || {}).forEach(([symbol, node]) => {
    key[symbol.toUpperCase()] = parseItemNode(node);
  });
  return { width, height, pattern, key };
}

function _getByPath(obj, path) {
  if (!path) return undefined;
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  return parts.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

// ── Public entry point ───────────────────────────────────────────────

function registerSimpleEngine(schema) {
  if (!schema || typeof schema !== 'object') {
    console.error('registerSimpleEngine: schema must be an object.');
    return;
  }
  if (!schema.key || !schema.label || !Array.isArray(schema.fields)) {
    console.error('registerSimpleEngine: schema requires key, label, and fields[].');
    return;
  }
  if (typeof schema.compile !== 'function') {
    console.error('registerSimpleEngine: schema requires a compile(data, helpers) function.');
    return;
  }
  if (schema.sections && !Array.isArray(schema.sections)) {
    console.error('registerSimpleEngine: schema.sections must be an array of {id, label}.');
    return;
  }

  const dataModule = {
    createEmptyData() {
      const data = {};
      (schema.fields || []).forEach(f => { data[f.key] = f.default ?? (f.type === 'list' || f.type === 'steps' ? [] : ''); });
      return data;
    },
    save(recipe, engineKey) {
      saveSchemaData(schema, recipe, engineKey);
    },
    restore(recipe, engineKey) {
      restoreSchemaData(schema, recipe, engineKey);
    },
    fromJson(recipeData) {
      return typeof schema.fromJson === 'function'
        ? schema.fromJson(recipeData, schemaHelpers)
        : defaultFromJson(schema, recipeData);
    },
  };

  RecipeGeneratorAPI.registerEngine({
    key: schema.key,
    label: schema.label,
    modGroup: schema.modGroup || 'create',
    template: schema.template || { type: schema.key, ingredients: [], results: [] },
    data: dataModule,
    compile(recipe, engineKey) {
      const data = recipe?.enginesData?.[engineKey] || dataModule.createEmptyData();
      return schema.compile(data, schemaHelpers);
    },
    ui: {
      inputPanel: () => renderSchemaForm(schema),
      outputPanel: schema.outputPanel || 'simple',
      hasProcessingTime: !!schema.hasProcessingTime,
      hasHeatRequirement: !!schema.hasHeatRequirement,
    },
  });
}

window.RecipeGeneratorAPI = window.RecipeGeneratorAPI || {};
window.RecipeGeneratorAPI.registerSimpleEngine = registerSimpleEngine;
window.RecipeGeneratorAPI.registerFieldType = registerFieldType;
window.RecipeGeneratorAPI.schemaHelpers = schemaHelpers;
})();
