/**
 * Text Cleanr — 3K Digital
 * script.js
 *
 * All text transformation logic, UI interactions,
 * character counting, and clipboard functionality.
 * Zero dependencies. Pure vanilla JS.
 */

'use strict';

/* ==========================================================================
   Element References
   ========================================================================== */

const inputTextarea  = document.getElementById('input-text');
const outputTextarea = document.getElementById('output-text');
const cleanBtn       = document.getElementById('clean-btn');
const copyBtn        = document.getElementById('copy-btn');
const inputCount     = document.getElementById('input-count');
const outputCount    = document.getElementById('output-count');

// Option checkboxes
const optSpaces       = document.getElementById('opt-spaces');
const optSentenceCase = document.getElementById('opt-sentence-case');
const optUppercase    = document.getElementById('opt-uppercase');
const optLowercase    = document.getElementById('opt-lowercase');
const optLineBreaks   = document.getElementById('opt-linebreaks');
const optSpecial      = document.getElementById('opt-special');

/* ==========================================================================
   Helper — Mutual Exclusion (Uppercase <-> Lowercase <-> Sentence Case)
   ========================================================================== */

/**
 * Ensure only one case transformation is active at a time.
 * When the user enables one, disable the others.
 *
 * @param {HTMLInputElement} source - The checkbox that was just changed.
 */
function enforceCaseMutualExclusion(source) {
  const caseOptions = [optUppercase, optLowercase, optSentenceCase];
  if (source.checked) {
    caseOptions.forEach((opt) => {
      if (opt !== source) opt.checked = false;
    });
  }
}

/* ==========================================================================
   Text Transformation Functions
   ========================================================================== */

/**
 * Collapses multiple consecutive whitespace characters (tabs, spaces)
 * into a single space, preserving newlines.
 *
 * @param {string} text
 * @returns {string}
 */
function removeExtraSpaces(text) {
  // Split into lines, collapse spaces within each line, rejoin
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n');
}

/**
 * Converts text to Sentence case:
 * - Capitalises the first character after '.', '!', '?', or at the start.
 * - Lowercases everything else.
 *
 * @param {string} text
 * @returns {string}
 */
function toSentenceCase(text) {
  // Lowercase entire string first, then capitalise sentence starters
  return text
    .toLowerCase()
    .replace(/(^\s*[\w\u00C0-\u024F])|([.!?]\s+[\w\u00C0-\u024F])/g, (match) =>
      match.toUpperCase()
    );
}

/**
 * Converts text to UPPERCASE.
 *
 * @param {string} text
 * @returns {string}
 */
function toUpperCase(text) {
  return text.toUpperCase();
}

/**
 * Converts text to lowercase.
 *
 * @param {string} text
 * @returns {string}
 */
function toLowerCase(text) {
  return text.toLowerCase();
}

/**
 * Normalises line breaks by collapsing 3+ consecutive newlines
 * into a maximum of 2 (one blank line between paragraphs).
 * Also trims leading/trailing whitespace from the overall string.
 *
 * @param {string} text
 * @returns {string}
 */
function normalizeLineBreaks(text) {
  return text
    .replace(/\r\n/g, '\n')    // Windows → Unix
    .replace(/\r/g, '\n')      // Old Mac → Unix
    .replace(/\n{3,}/g, '\n\n') // 3+ blank lines → 1 blank line
    .trim();
}

/**
 * Removes special characters, keeping:
 * - Alphanumeric (a–z, A–Z, 0–9)
 * - Basic punctuation: . , ! ? ; : ' " - ( ) [ ] / @
 * - Whitespace (spaces and newlines)
 *
 * @param {string} text
 * @returns {string}
 */
function removeSpecialChars(text) {
  return text.replace(/[^a-zA-Z0-9\s.,!?;:'"()\[\]\-\/@\n]/g, '');
}

/* ==========================================================================
   Core — Apply All Selected Transformations
   ========================================================================== */

/**
 * Reads the active options and applies each enabled transformation
 * in a logical sequence to avoid conflicts (e.g., normalise spaces
 * before case, strip specials last so punctuation rules still apply).
 *
 * Sequence:
 *   1. Remove extra spaces (before case, so capitalisation is clean)
 *   2. Normalise line breaks (structural cleanup)
 *   3. Case transformation (only one active at a time)
 *   4. Remove special characters (last, so case is already applied)
 *
 * @param {string} rawText
 * @returns {string}
 */
function applyTransformations(rawText) {
  let result = rawText;

  // 1. Extra spaces
  if (optSpaces.checked) {
    result = removeExtraSpaces(result);
  }

  // 2. Line break normalisation
  if (optLineBreaks.checked) {
    result = normalizeLineBreaks(result);
  }

  // 3. Case — only one can be active due to mutual exclusion
  if (optSentenceCase.checked) {
    result = toSentenceCase(result);
  } else if (optUppercase.checked) {
    result = toUpperCase(result);
  } else if (optLowercase.checked) {
    result = toLowerCase(result);
  }

  // 4. Special character removal
  if (optSpecial.checked) {
    result = removeSpecialChars(result);
  }

  return result;
}

/* ==========================================================================
   UI Helpers
   ========================================================================== */

/**
 * Formats a character count into a readable string.
 *
 * @param {number} count
 * @returns {string}
 */
function formatCount(count) {
  if (count === 0) return '0 chars';
  if (count === 1) return '1 char';
  return `${count.toLocaleString()} chars`;
}

/**
 * Updates the character counter element for the given textarea.
 *
 * @param {HTMLTextAreaElement} textarea
 * @param {HTMLElement} countEl
 */
function updateCharCount(textarea, countEl) {
  const len = textarea.value.length;
  countEl.textContent = formatCount(len);
  countEl.classList.toggle('has-content', len > 0);
}

/**
 * Sets the clean button into processing state (spinner, disabled).
 */
function setProcessing(isProcessing) {
  cleanBtn.classList.toggle('is-processing', isProcessing);
  cleanBtn.disabled = isProcessing;
  cleanBtn.querySelector('.btn-text').textContent = isProcessing
    ? 'Processing…'
    : 'Clean Text';
}

/**
 * Writes cleaned text to the output textarea with a fade-in effect.
 *
 * @param {string} text
 */
function renderOutput(text) {
  outputTextarea.classList.remove('has-content');

  // Short RAF to allow CSS transition to reset before re-adding
  requestAnimationFrame(() => {
    outputTextarea.value = text;
    updateCharCount(outputTextarea, outputCount);

    if (text.length > 0) {
      requestAnimationFrame(() => {
        outputTextarea.classList.add('has-content');
        copyBtn.disabled = false;
      });
    } else {
      copyBtn.disabled = true;
    }
  });
}

/* ==========================================================================
   Event Handlers
   ========================================================================== */

/**
 * Live character count update on input.
 */
inputTextarea.addEventListener('input', () => {
  updateCharCount(inputTextarea, inputCount);
});

/**
 * Mutual exclusion for case options.
 */
[optUppercase, optLowercase, optSentenceCase].forEach((opt) => {
  opt.addEventListener('change', () => enforceCaseMutualExclusion(opt));
});

/**
 * Main clean action with artificial processing delay for UX polish.
 */
cleanBtn.addEventListener('click', () => {
  const raw = inputTextarea.value;

  if (!raw.trim()) {
    // Nothing to clean — briefly shake the button
    cleanBtn.style.animation = 'none';
    cleanBtn.offsetHeight; // force reflow
    cleanBtn.style.animation = '';
    return;
  }

  // Enter processing state
  setProcessing(true);

  // Short delay for UX feedback (feels deliberate, not instant)
  setTimeout(() => {
    const cleaned = applyTransformations(raw);
    renderOutput(cleaned);
    setProcessing(false);
    cleanBtn.querySelector('.btn-text').textContent = 'Clean Text';
  }, 380);
});

/**
 * Copy to clipboard with success feedback.
 */
copyBtn.addEventListener('click', async () => {
  const text = outputTextarea.value;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);

    // Success feedback
    const copyText = copyBtn.querySelector('.copy-text');
    const copyIcon = copyBtn.querySelector('.copy-icon');

    copyBtn.classList.add('copied');
    copyText.textContent = 'Copied!';
    copyIcon.textContent = '✓';

    // Reset after 2 seconds
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyText.textContent = 'Copy';
      copyIcon.textContent = '⎘';
    }, 2000);

  } catch (err) {
    // Fallback for browsers without clipboard API
    outputTextarea.select();
    document.execCommand('copy');

    const copyText = copyBtn.querySelector('.copy-text');
    copyText.textContent = 'Copied!';
    setTimeout(() => { copyText.textContent = 'Copy'; }, 2000);

    console.warn('Clipboard API unavailable, used execCommand fallback.', err);
  }
});

/* ==========================================================================
   Keyboard Shortcut — Ctrl/Cmd + Enter to Clean
   ========================================================================== */

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    cleanBtn.click();
  }
});

/* ==========================================================================
   Init — Set initial counts
   ========================================================================== */

updateCharCount(inputTextarea, inputCount);
updateCharCount(outputTextarea, outputCount);
