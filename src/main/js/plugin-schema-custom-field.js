/**
 * plugin-schema-custom-field.js
 */

(function () {
  if (!window.RecipeGeneratorAPI || typeof window.RecipeGeneratorAPI.registerFieldType !== 'function') {
    console.error('plugin-schema-custom-field.js: RecipeGeneratorAPI.registerFieldType not found — load plugin-schema-api.js first.');
    return;
  }

  window.RecipeGeneratorAPI.registerFieldType('custom', {
    render(field) {
      if (typeof field.render !== 'function') {
        console.error(`Custom field "${field.key}": missing a render(field) function.`);
        return `<div style="color:#e05252; font-size:11px; padding:8px;">Custom field "${field.key}" has no render().</div>`;
      }
      return field.render(field);
    },

    read(container, field) {
      if (typeof field.read !== 'function') {
        console.error(`Custom field "${field.key}": missing a read(container, field) function.`);
        return field.default !== undefined ? field.default : '';
      }
      return field.read(container, field);
    },

    write(container, field, value) {
      if (typeof field.write !== 'function') {
        console.error(`Custom field "${field.key}": missing a write(container, field, value) function.`);
        return;
      }
      field.write(container, field, value === undefined ? field.default : value);
    },

    parseJson(rawValue, field) {
      if (typeof field.parseJson === 'function') return field.parseJson(rawValue, field);
      return rawValue !== undefined ? rawValue : field.default;
    },
  });
})();
