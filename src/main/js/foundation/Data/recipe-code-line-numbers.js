const LINE_HEIGHT = 18;

function autoGrowRecipeTextarea() {
  const ta = document.getElementById('recipeCodeTextarea');
  if (!ta) return;

  const currentHeight = parseFloat(ta.style.height) || 0;
  ta.style.height = '0px';
  const newHeight = Math.max(300, ta.scrollHeight);
  ta.style.height = newHeight + 'px';
  ta.style.minHeight = newHeight + 'px';

  if (document.activeElement === ta) {
  }
}

function syncRecipeCodeLineNumbers() {
  const codeArea = document.getElementById('recipeCodeTextarea');
  const gutter = document.getElementById('recipeCodeLineNumbers');
  if (!codeArea || !gutter) return;


  const wrapper = document.getElementById('recipeCodeEditorWrapper');
  if (wrapper && wrapper.style.display === 'none') return;


  const taStyle = window.getComputedStyle(codeArea);
  const font = `${taStyle.fontSize} ${taStyle.fontFamily}`;

  if (!syncRecipeCodeLineNumbers._canvas) {
    syncRecipeCodeLineNumbers._canvas = document.createElement('canvas');
  }
  const ctx = syncRecipeCodeLineNumbers._canvas.getContext('2d');
  ctx.font = font;


  const paddingL = parseFloat(taStyle.paddingLeft) || 8;
  const paddingR = parseFloat(taStyle.paddingRight) || 8;
  const availWidth = codeArea.clientWidth - paddingL - paddingR;


  const canWrap = availWidth > 0;

  const lines = codeArea.value === '' ? [''] : codeArea.value.split('\n');

  let html = '';
  lines.forEach((line, i) => {
    let visualRows = 1;
    if (canWrap && line.length > 0) {
      
      const lineWidth = ctx.measureText(line).width;
      visualRows = Math.max(1, Math.ceil(lineWidth / availWidth));
    }
    const height = visualRows * LINE_HEIGHT;
    html += `<div data-line="${i + 1}" style="height:${height}px;line-height:${LINE_HEIGHT}px;">${i + 1}</div>`;
  });

  gutter.innerHTML = html;
  gutter.style.minHeight = codeArea.scrollHeight + 'px';
}

function syncRecipeCodeLineNumberScroll() {
  const codeArea = document.getElementById('recipeCodeTextarea');
  const gutter = document.getElementById('recipeCodeLineNumbers');
  if (!codeArea || !gutter) return;
  gutter.scrollTop = codeArea.scrollTop;
}

function highlightRecipeCodeErrorLine(message) {
  const gutter = document.getElementById('recipeCodeLineNumbers');
  if (!gutter) return;
  clearRecipeCodeErrorHighlight();

  const match = /line (\d+)/i.exec(message || '');
  if (!match) return;
  const target = gutter.querySelector(`[data-line="${match[1]}"]`);
  if (target) {
    target.style.color = '#ff5e5b';
    target.style.fontWeight = 'bold';
  }
}

function clearRecipeCodeErrorHighlight() {
  const gutter = document.getElementById('recipeCodeLineNumbers');
  if (!gutter) return;
  gutter.querySelectorAll('[data-line]').forEach((el) => {
    el.style.color = '';
    el.style.fontWeight = '';
  });
}

function waitForTextareaRestore() {
  const ta = document.getElementById('recipeCodeTextarea');
  if (!ta) return;

  let lastValue = null;
  let stableCount = 0;

  const check = setInterval(function () {
    if (ta.value === lastValue) {
      stableCount++;
      if (stableCount >= 3) {
        clearInterval(check);
        if (ta.value.trim() !== '') {
          window._needsRestoreSync = true;
          syncRecipeCodeLineNumbers();
          autoGrowRecipeTextarea();
        }
      }
    } else {
      lastValue = ta.value;
      stableCount = 0;
    }
  }, 100);

  setTimeout(() => clearInterval(check), 3000);
}

window.addEventListener('pageshow', waitForTextareaRestore);

// Re-sync on window resize since available width changes
window.addEventListener('resize', () => {
  syncRecipeCodeLineNumbers();
  autoGrowRecipeTextarea();
});