/**
 * app.js — FileCompare application logic
 * FileCompare · 3K Digital
 *
 * Depends on:
 *   diff.js  → window.diffLines()
 *   pdf.js   → window.readPDF()
 *
 * Sections:
 *   1. State
 *   2. Navigation (landing ↔ app)
 *   3. File handling (drag-drop, input, reading)
 *   4. Comparison orchestration
 *   5. Panel rendering (side-by-side + inline)
 *   6. Scroll synchronisation
 *   7. View mode (side / inline)
 *   8. Panel resizer
 *   9. Loading overlay
 *  10. Reset helpers
 *  11. Landing form
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════════
     1. State
  ══════════════════════════════════════════════════════════════════════════ */
  const state = {
    left:  { file: null, content: null },
    right: { file: null, content: null },
    diffRows:    [],
    syncScroll:  true,
    viewMode:    'side',   // 'side' | 'inline'
    syncing:     false,    // re-entrancy guard for scroll sync
  };


  /* ══════════════════════════════════════════════════════════════════════════
     2. Navigation
  ══════════════════════════════════════════════════════════════════════════ */

  /** Switch from landing page to the app. */
  function launchApp() {
    document.getElementById('landing').style.display = 'none';
    document.getElementById('app').style.display     = 'flex';
  }

  /** Switch back from app to landing page. */
  function backToLanding() {
    document.getElementById('app').style.display     = 'none';
    document.getElementById('landing').style.display = 'flex';
  }


  /* ══════════════════════════════════════════════════════════════════════════
     3. File handling
  ══════════════════════════════════════════════════════════════════════════ */

  /** Called when a drag enters a drop zone. */
  function dzDrag(event, side, active) {
    event.preventDefault();
    document.getElementById('dz-' + side).classList.toggle('drag', active);
  }

  /** Called when a file is dropped onto a drop zone. */
  function dzDrop(event, side) {
    event.preventDefault();
    dzDrag(event, side, false);
    const file = event.dataTransfer.files[0];
    if (file) loadFile(file, side);
  }

  /** Called when the hidden <input type="file"> changes. */
  function fileChosen(event, side) {
    const file = event.target.files[0];
    if (file) loadFile(file, side);
  }

  /**
   * Load a file into state[side], then trigger comparison if both sides ready.
   * @param {File}   file
   * @param {string} side  'left' | 'right'
   */
  async function loadFile(file, side) {
    showError(side, '');
    hideChip(side);

    state[side].file    = file;
    state[side].content = null;

    try {
      const content        = await readFile(file);
      state[side].content  = content;
      showChip(side, file);
      maybeCompare();
    } catch (err) {
      showError(side, err.message);
      state[side].file = null;
    }
  }

  /**
   * Dispatch to the correct reader based on file extension.
   * @param {File} file
   * @returns {Promise<string>}
   */
  function readFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return window.readPDF(file);
    return readTextFile(file);
  }

  /**
   * Read a plain-text file as UTF-8 string.
   * @param {File} file
   * @returns {Promise<string>}
   */
  function readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = (e) => resolve(e.target.result);
      reader.onerror = ()  => reject(new Error('Could not read file. It may be binary or corrupt.'));
      reader.readAsText(file, 'utf-8');
    });
  }


  /* ══════════════════════════════════════════════════════════════════════════
     4. Comparison orchestration
  ══════════════════════════════════════════════════════════════════════════ */

  /** Run diff and render once both files are loaded. */
  function maybeCompare() {
    if (!state.left.content || !state.right.content) return;

    showLoading(true);

    // Defer to the next task so the browser can paint the loading overlay first
    setTimeout(() => {
      const aLines = state.left.content.split('\n');
      const bLines = state.right.content.split('\n');

      state.diffRows = window.diffLines(aLines, bLines);
      renderCompare();
      showLoading(false);
    }, 30);
  }

  /** Update headers, stats, then switch to the comparison view. */
  function renderCompare() {
    const rows = state.diffRows;
    const adds = rows.filter((r) => r.type === 'ins').length;
    const dels = rows.filter((r) => r.type === 'del').length;
    const chgs = rows.filter((r) => r.type === 'chg').length;

    // Panel headers
    document.getElementById('ph-left-name').textContent  = state.left.file?.name  || 'Left';
    document.getElementById('ph-right-name').textContent = state.right.file?.name || 'Right';
    document.getElementById('ph-left-stat').textContent  = `-${dels + chgs}`;
    document.getElementById('ph-right-stat').textContent = `+${adds + chgs}`;

    // Status bar
    document.getElementById('sb-adds').textContent = `+${adds}`;
    document.getElementById('sb-dels').textContent = `-${dels}`;
    document.getElementById('sb-chgs').textContent = `~${chgs}`;

    const al = state.left.content.split('\n').length;
    const bl = state.right.content.split('\n').length;
    document.getElementById('sb-lines').textContent =
      `${al.toLocaleString()} → ${bl.toLocaleString()} lines`;

    // Render both diff panels
    renderSidePanel('left',  rows);
    renderSidePanel('right', rows);

    // Switch views
    document.getElementById('upload-view').style.display  = 'none';
    document.getElementById('compare-view').style.display = 'flex';
    document.getElementById('app-controls').style.display = 'flex';
  }


  /* ══════════════════════════════════════════════════════════════════════════
     5. Panel rendering
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Render one side of the side-by-side diff view.
   * Empty placeholder rows are added for lines that exist only on the other side,
   * so both panels stay vertically aligned.
   *
   * @param {'left'|'right'} side
   * @param {DiffRow[]} rows
   */
  function renderSidePanel(side, rows) {
    const isLeft = side === 'left';
    const el     = document.getElementById('body-' + side);
    const frag   = document.createDocumentFragment();

    for (const row of rows) {
      const div = document.createElement('div');
      div.className = 'dl';

      if (row.type === 'eq') {
        const lineNum  = isLeft ? row.aN : row.bN;
        const lineText = isLeft ? row.aL : row.bL;
        appendGutter(div, lineNum, '');
        appendContent(div, lineText, null);

      } else if (row.type === 'del') {
        if (!isLeft) {
          div.classList.add('empty');
          frag.appendChild(div);
          continue;
        }
        div.classList.add('del');
        appendGutter(div, row.aN, '-');
        appendContent(div, row.aL, null);

      } else if (row.type === 'ins') {
        if (isLeft) {
          div.classList.add('empty');
          frag.appendChild(div);
          continue;
        }
        div.classList.add('add');
        appendGutter(div, row.bN, '+');
        appendContent(div, row.bL, null);

      } else if (row.type === 'chg') {
        if (isLeft) {
          div.classList.add('chg-d');
          appendGutter(div, row.aN, '-');
          appendContent(div, row.aL, row.ar);
        } else {
          div.classList.add('chg-a');
          appendGutter(div, row.bN, '+');
          appendContent(div, row.bL, row.br);
        }
      }

      frag.appendChild(div);
    }

    el.innerHTML = '';
    el.appendChild(frag);
  }

  /**
   * Render the inline (unified) diff view into the left panel only.
   * The right panel is hidden in inline mode.
   */
  function renderInlinePanel() {
    const el   = document.getElementById('body-left');
    const frag = document.createDocumentFragment();

    for (const row of state.diffRows) {
      if (row.type === 'eq') {
        const div = makeLine('', row.aN, '', row.aL, null);
        frag.appendChild(div);

      } else if (row.type === 'del' || row.type === 'chg') {
        const div = makeLine(
          row.type === 'del' ? 'del' : 'chg-d',
          row.aN, '-',
          row.aL,
          row.ar || null
        );
        frag.appendChild(div);
      }

      if (row.type === 'ins' || row.type === 'chg') {
        const div = makeLine(
          row.type === 'ins' ? 'add' : 'chg-a',
          row.bN, '+',
          row.bL,
          row.br || null
        );
        frag.appendChild(div);
      }
    }

    el.innerHTML = '';
    el.appendChild(frag);

    // Update header to show both filenames
    document.getElementById('ph-left-name').textContent =
      (state.left.file?.name  || 'Left') +
      ' → ' +
      (state.right.file?.name || 'Right');
  }

  /** Build a complete diff line element. */
  function makeLine(typeClass, lineNum, sign, text, chars) {
    const div = document.createElement('div');
    div.className = 'dl' + (typeClass ? ' ' + typeClass : '');
    appendGutter(div, lineNum, sign);
    appendContent(div, text, chars);
    return div;
  }

  /** Append the line-number + sign gutter to a diff row element. */
  function appendGutter(div, lineNum, sign) {
    const gutter = document.createElement('div');
    gutter.className = 'dl-gutter';

    const numEl = document.createElement('div');
    numEl.className = 'dl-num';
    numEl.textContent = lineNum != null ? lineNum : '';

    const signEl = document.createElement('div');
    signEl.className = 'dl-sign';
    signEl.textContent = sign;

    gutter.appendChild(numEl);
    gutter.appendChild(signEl);
    div.appendChild(gutter);
  }

  /**
   * Append the text content area to a diff row element.
   * If chars is provided, render character-level highlights.
   * @param {HTMLElement}        div
   * @param {string}             text   — full line text (fallback)
   * @param {CharToken[]|null}   chars  — character-level diff tokens
   */
  function appendContent(div, text, chars) {
    const content = document.createElement('div');
    content.className = 'dl-content';

    if (chars && chars.length > 0) {
      for (const token of chars) {
        const span = document.createElement('span');
        if (token.c === 'a') span.className = 'ch-a';
        if (token.c === 'd') span.className = 'ch-d';
        span.textContent = token.ch;
        content.appendChild(span);
      }
    } else {
      content.textContent = text || '';
    }

    div.appendChild(content);
  }


  /* ══════════════════════════════════════════════════════════════════════════
     6. Scroll synchronisation
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Mirror the scroll position of one panel onto the other.
   * The syncing flag prevents infinite event loops.
   * @param {'left'|'right'} side — which panel triggered the scroll
   */
  function onScroll(side) {
    if (!state.syncScroll || state.syncing) return;
    state.syncing = true;

    const src = document.getElementById('body-' + side);
    const dst = document.getElementById('body-' + (side === 'left' ? 'right' : 'left'));

    dst.scrollTop  = src.scrollTop;
    dst.scrollLeft = src.scrollLeft;

    requestAnimationFrame(() => { state.syncing = false; });
  }

  /** Toggle scroll sync on/off. */
  function toggleSync() {
    state.syncScroll = !state.syncScroll;
    const btn = document.getElementById('sync-btn');
    btn.textContent = state.syncScroll ? 'Sync scroll ✓' : 'Sync scroll';
    btn.classList.toggle('on', state.syncScroll);
  }


  /* ══════════════════════════════════════════════════════════════════════════
     7. View mode (side-by-side / inline)
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Switch between 'side' and 'inline' diff views.
   * @param {'side'|'inline'} mode
   */
  function setView(mode) {
    state.viewMode = mode;

    document.getElementById('side-btn').classList.toggle('on',   mode === 'side');
    document.getElementById('inline-btn').classList.toggle('on', mode === 'inline');

    const resizer     = document.getElementById('resizer');
    const panelRight  = document.getElementById('panel-right');

    if (mode === 'inline') {
      resizer.style.display    = 'none';
      panelRight.style.display = 'none';
      renderInlinePanel();
    } else {
      resizer.style.display    = '';
      panelRight.style.display = '';
      renderSidePanel('left',  state.diffRows);
      renderSidePanel('right', state.diffRows);
      // Restore the header that inline mode overwrites
      document.getElementById('ph-left-name').textContent =
        state.left.file?.name || 'Left';
    }
  }


  /* ══════════════════════════════════════════════════════════════════════════
     8. Panel resizer
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Begin a drag-resize of the left panel.
   * Uses mousemove/mouseup on document so the drag works even if the cursor
   * leaves the resizer element.
   * @param {MouseEvent} e
   */
  function startResize(e) {
    e.preventDefault();

    const wrap       = document.getElementById('panels-wrap');
    const panelLeft  = document.getElementById('panel-left');
    const panelRight = document.getElementById('panel-right');
    const resizer    = document.getElementById('resizer');

    const startX  = e.clientX;
    const startW  = panelLeft.offsetWidth;
    const totalW  = wrap.offsetWidth - resizer.offsetWidth;
    const minW    = 160;

    resizer.classList.add('active');

    function onMove(ev) {
      const delta  = ev.clientX - startX;
      const newW   = Math.max(minW, Math.min(totalW - minW, startW + delta));
      panelLeft.style.flex  = 'none';
      panelLeft.style.width = newW + 'px';
      panelRight.style.flex  = '1';
      panelRight.style.width = 'auto';
    }

    function onUp() {
      resizer.classList.remove('active');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }


  /* ══════════════════════════════════════════════════════════════════════════
     9. Loading overlay
  ══════════════════════════════════════════════════════════════════════════ */
  let loadingEl = null;

  /**
   * Show or hide the full-screen loading overlay.
   * @param {boolean} visible
   */
  function showLoading(visible) {
    if (visible) {
      if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.className = 'loading';
        loadingEl.innerHTML = '<div class="spinner"></div><p>Computing differences…</p>';
      }
      const app = document.getElementById('app');
      app.style.position = 'relative';
      app.appendChild(loadingEl);
    } else {
      if (loadingEl && loadingEl.parentNode) {
        loadingEl.parentNode.removeChild(loadingEl);
      }
    }
  }


  /* ══════════════════════════════════════════════════════════════════════════
     10. Reset helpers
  ══════════════════════════════════════════════════════════════════════════ */

  /** Full reset: clear state and go back to upload view. */
  function resetCompare() {
    state.left     = { file: null, content: null };
    state.right    = { file: null, content: null };
    state.diffRows = [];
    resetToUploadView();
  }

  /** Return to upload view without clearing file state. */
  function resetToUploadView() {
    document.getElementById('compare-view').style.display = 'none';
    document.getElementById('upload-view').style.display  = 'grid';
    document.getElementById('app-controls').style.display = 'none';

    ['left', 'right'].forEach((side) => {
      hideChip(side);
      showError(side, '');
    });

    // Reset panel widths to equal split
    const panelLeft  = document.getElementById('panel-left');
    const panelRight = document.getElementById('panel-right');
    panelLeft.style.flex  = '1';
    panelLeft.style.width = '';
    panelRight.style.flex  = '1';
    panelRight.style.width = '';
    panelRight.style.display = '';

    document.getElementById('resizer').style.display = '';

    // Reset view-mode buttons
    if (state.viewMode !== 'side') {
      state.viewMode = 'side';
      document.getElementById('side-btn').classList.add('on');
      document.getElementById('inline-btn').classList.remove('on');
    }
  }

  /**
   * Clear one side — removes file state and hides chip.
   * If a comparison was active, return to upload view.
   * @param {'left'|'right'} side
   */
  function clearFile(side) {
    state[side].file    = null;
    state[side].content = null;
    hideChip(side);
    showError(side, '');

    if (state.diffRows.length) {
      resetToUploadView();
    }
  }


  /* ══════════════════════════════════════════════════════════════════════════
     DOM helpers — chip, error, byte formatting
  ══════════════════════════════════════════════════════════════════════════ */

  function showChip(side, file) {
    const chip = document.getElementById('chip-' + side);
    document.getElementById('chip-' + side + '-name').textContent = file.name;
    document.getElementById('chip-' + side + '-size').textContent = formatBytes(file.size);
    chip.style.display = 'flex';
  }

  function hideChip(side) {
    document.getElementById('chip-' + side).style.display = 'none';
  }

  function showError(side, message) {
    const el = document.getElementById('err-' + side);
    el.textContent     = message;
    el.style.display   = message ? 'block' : 'none';
  }

  /** Human-readable file size (B / KB / MB). */
  function formatBytes(bytes) {
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1_048_576)   return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1_048_576).toFixed(1) + ' MB';
  }


  /* ══════════════════════════════════════════════════════════════════════════
     11. Landing form
  ══════════════════════════════════════════════════════════════════════════ */

  function handleFormSubmit(event) {
    event.preventDefault();
    document.getElementById('form-success').style.display = 'block';
  }


  /* ══════════════════════════════════════════════════════════════════════════
     Expose public API on window so inline HTML event handlers can call them
  ══════════════════════════════════════════════════════════════════════════ */
  window.launchApp        = launchApp;
  window.backToLanding    = backToLanding;
  window.dzDrag           = dzDrag;
  window.dzDrop           = dzDrop;
  window.fileChosen       = fileChosen;
  window.clearFile        = clearFile;
  window.onScroll         = onScroll;
  window.toggleSync       = toggleSync;
  window.setView          = setView;
  window.startResize      = startResize;
  window.resetCompare     = resetCompare;
  window.handleFormSubmit = handleFormSubmit;
})();
