/**
 * 3K Digital — Lottery Number Generator
 * script.js
 *
 * Handles:
 *  - Lottery type configuration
 *  - Strategy-based number generation (Hot, Cold, Balanced, Random)
 *  - Ball rendering with staggered pop-in animation
 *  - Copy to clipboard
 *  - Footer year
 *
 * NOTE: All strategies are simulated behaviors for entertainment.
 * No statistical advantage over random selection is implied.
 */

// ─────────────────────────────────────────────
// 1. LOTTERY GAME CONFIGURATIONS
// ─────────────────────────────────────────────

const LOTTERY_CONFIGS = {
  powerball: {
    label: 'Powerball',
    mainCount: 5,
    mainMin: 1,
    mainMax: 69,
    specialCount: 1,
    specialMin: 1,
    specialMax: 26,
    specialLabel: 'Powerball',
    allowDuplicates: false,
    type: 'jackpot'
  },
  megamillions: {
    label: 'Mega Millions',
    mainCount: 5,
    mainMin: 1,
    mainMax: 70,
    specialCount: 1,
    specialMin: 1,
    specialMax: 25,
    specialLabel: 'Mega Ball',
    allowDuplicates: false,
    type: 'jackpot'
  },
  pick3: {
    label: 'Pick 3',
    mainCount: 3,
    mainMin: 0,
    mainMax: 9,
    specialCount: 0,
    allowDuplicates: true,
    type: 'pick'
  },
  pick4: {
    label: 'Pick 4',
    mainCount: 4,
    mainMin: 0,
    mainMax: 9,
    specialCount: 0,
    allowDuplicates: true,
    type: 'pick'
  }
};

// ─────────────────────────────────────────────
// 2. DOM REFERENCES
// ─────────────────────────────────────────────

const lotterySelect   = document.getElementById('lottery-type');
const strategyBtns    = document.querySelectorAll('.strategy-btn');
const generateBtn     = document.getElementById('generate-btn');
const resultsWrapper  = document.getElementById('results-wrapper');
const ballsContainer  = document.getElementById('balls-container');
const resultsLabel    = document.getElementById('results-game-label');
const copyBtn         = document.getElementById('copy-btn');
const footerYear      = document.getElementById('footer-year');

// ─────────────────────────────────────────────
// 3. STATE
// ─────────────────────────────────────────────

let currentStrategy = 'random'; // Default strategy
let lastNumbers     = [];        // Store last generated numbers for copy

// ─────────────────────────────────────────────
// 4. UTILITY FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Returns a random integer between min and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffles an array in-place using Fisher-Yates algorithm.
 * @param {Array} arr
 * @returns {Array}
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pads a single-digit number with a leading zero (for Pick games).
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

// ─────────────────────────────────────────────
// 5. NUMBER GENERATION — STRATEGY LOGIC
// ─────────────────────────────────────────────

/**
 * Pure random: picks `count` unique numbers from [min, max].
 * Allows duplicates if specified (Pick 3/4).
 */
function generateRandom(count, min, max, allowDuplicates) {
  const nums = [];
  const used = new Set();
  let attempts = 0;
  const maxAttempts = 1000;

  while (nums.length < count && attempts < maxAttempts) {
    const n = randomInt(min, max);
    if (allowDuplicates || !used.has(n)) {
      nums.push(n);
      used.add(n);
    }
    attempts++;
  }
  return nums;
}

/**
 * Hot Numbers: simulates "frequently drawn" numbers by biasing
 * selection toward the LOWER third of the valid range.
 * Achieves this by sampling 2 random numbers and taking the lower one
 * (classic tournament selection / simulated frequency bias).
 */
function generateHot(count, min, max, allowDuplicates) {
  const nums = [];
  const used = new Set();
  let attempts = 0;
  const maxAttempts = 1000;

  while (nums.length < count && attempts < maxAttempts) {
    // Pick two candidates, bias toward lower value
    const a = randomInt(min, max);
    const b = randomInt(min, max);
    const n = Math.min(a, b);

    if (allowDuplicates || !used.has(n)) {
      nums.push(n);
      used.add(n);
    }
    attempts++;
  }
  return nums;
}

/**
 * Cold Numbers: simulates "rarely drawn" numbers by biasing
 * selection toward the UPPER third of the valid range.
 * Mirror of Hot — takes the higher of two random samples.
 */
function generateCold(count, min, max, allowDuplicates) {
  const nums = [];
  const used = new Set();
  let attempts = 0;
  const maxAttempts = 1000;

  while (nums.length < count && attempts < maxAttempts) {
    const a = randomInt(min, max);
    const b = randomInt(min, max);
    const n = Math.max(a, b); // bias toward higher numbers

    if (allowDuplicates || !used.has(n)) {
      nums.push(n);
      used.add(n);
    }
    attempts++;
  }
  return nums;
}

/**
 * Balanced: enforces a mix of:
 *  - Even and Odd numbers (~50/50)
 *  - Low (lower half) and High (upper half) numbers (~50/50)
 *
 * Builds separate pools, then fills remaining slots from whichever
 * is needed, then pads with pure random if necessary.
 *
 * Only applies meaningful balance logic to jackpot games (5 numbers).
 * Falls back to random for Pick 3/4.
 */
function generateBalanced(count, min, max, allowDuplicates) {
  // For small-range Pick games, just return random
  if (allowDuplicates || count < 4) {
    return generateRandom(count, min, max, allowDuplicates);
  }

  const mid   = Math.floor((min + max) / 2);
  const nums  = new Set();

  // Build pools
  const evens = [];
  const odds  = [];
  const lows  = [];
  const highs = [];

  for (let i = min; i <= max; i++) {
    if (i % 2 === 0) evens.push(i); else odds.push(i);
    if (i <= mid)    lows.push(i);  else highs.push(i);
  }

  shuffle(evens); shuffle(odds); shuffle(lows); shuffle(highs);

  const halfCount = Math.floor(count / 2);

  // Pick ~half even, ~half odd
  let eIdx = 0, oIdx = 0;
  while (nums.size < halfCount && eIdx < evens.length) {
    nums.add(evens[eIdx++]);
  }
  while (nums.size < count && oIdx < odds.length) {
    nums.add(odds[oIdx++]);
  }

  // Enforce low/high balance by replacing if unbalanced
  const numArr = [...nums];
  const lowCount  = numArr.filter(n => n <= mid).length;
  const highCount = numArr.filter(n => n >  mid).length;

  // If heavily skewed, swap some for balance — limit 3 swaps
  let swaps = 0;
  if (lowCount - highCount > 1 && swaps < 3) {
    const lowNums  = numArr.filter(n => n <= mid);
    const highPool = highs.filter(n => !nums.has(n));
    if (lowNums.length && highPool.length) {
      nums.delete(lowNums[0]);
      nums.add(highPool[0]);
      swaps++;
    }
  }

  // Pad to exact count if rounding left us short
  let attempts = 0;
  while (nums.size < count && attempts < 200) {
    nums.add(randomInt(min, max));
    attempts++;
  }

  return [...nums].slice(0, count);
}

/**
 * Master generator — routes to the right strategy function.
 * Always returns numbers in ascending order for main balls.
 *
 * @param {string} strategy  — 'random' | 'hot' | 'cold' | 'balanced'
 * @param {Object} config    — LOTTERY_CONFIGS entry
 * @returns {{ main: number[], special: number[] }}
 */
function generateNumbers(strategy, config) {
  const { mainCount, mainMin, mainMax,
          specialCount, specialMin, specialMax,
          allowDuplicates } = config;

  let genFn;
  switch (strategy) {
    case 'hot':      genFn = generateHot;      break;
    case 'cold':     genFn = generateCold;     break;
    case 'balanced': genFn = generateBalanced; break;
    default:         genFn = generateRandom;   break;
  }

  // Generate main numbers
  const main = genFn(mainCount, mainMin, mainMax, allowDuplicates);

  // Sort ascending if no duplicates (jackpot games)
  if (!allowDuplicates) main.sort((a, b) => a - b);

  // Generate special ball (independent — always random for authenticity)
  const special = specialCount > 0
    ? generateRandom(specialCount, specialMin, specialMax, false)
    : [];

  return { main, special };
}

// ─────────────────────────────────────────────
// 6. UI — BALL RENDERING
// ─────────────────────────────────────────────

/**
 * Creates a single number ball DOM element.
 * @param {string|number} value
 * @param {string} cssClass — 'ball-main' | 'ball-special' | 'ball-pick'
 * @param {number} delay    — animation stagger delay in ms
 * @param {string} ariaLabel
 * @returns {HTMLElement}
 */
function createBall(value, cssClass, delay, ariaLabel) {
  const li = document.createElement('li');
  li.className   = `ball ${cssClass}`;
  li.textContent = value;
  li.style.animationDelay = `${delay}ms`;
  li.setAttribute('role', 'listitem');
  li.setAttribute('aria-label', ariaLabel);
  return li;
}

/**
 * Creates the "+" divider element shown between main balls and special ball.
 * @returns {HTMLElement}
 */
function createDivider() {
  const div = document.createElement('span');
  div.className   = 'ball-divider';
  div.textContent = '+';
  div.setAttribute('aria-hidden', 'true');
  return div;
}

/**
 * Renders all balls into the container with staggered animation.
 * @param {number[]} main
 * @param {number[]} special
 * @param {Object}   config
 */
function renderBalls(main, special, config) {
  // Clear previous
  ballsContainer.innerHTML = '';

  const isPick    = config.type === 'pick';
  const stagger   = isPick ? 90 : 110; // ms between each ball appearing

  // Render main balls
  main.forEach((num, i) => {
    const display = isPick ? pad(num) : num;
    const label   = isPick
      ? `Digit ${i + 1}: ${display}`
      : `Number ${i + 1}: ${display}`;
    const ball = createBall(display, isPick ? 'ball-pick' : 'ball-main', i * stagger, label);
    ballsContainer.appendChild(ball);
  });

  // Render special ball (jackpot games only)
  if (special.length > 0) {
    // Add visual divider
    const divider = createDivider();
    divider.style.animationDelay = `${main.length * stagger}ms`;
    ballsContainer.appendChild(divider);

    special.forEach((num, i) => {
      const delay = (main.length + 1 + i) * stagger;
      const label = `${config.specialLabel}: ${num}`;
      const ball  = createBall(num, 'ball-special', delay, label);
      ballsContainer.appendChild(ball);
    });
  }
}

// ─────────────────────────────────────────────
// 7. UI — RESULTS DISPLAY
// ─────────────────────────────────────────────

/**
 * Updates the results label text showing game + strategy.
 * @param {Object} config
 * @param {string} strategy
 */
function updateResultsLabel(config, strategy) {
  const strategyNames = {
    random:   'Random',
    hot:      'Hot Numbers',
    cold:     'Cold Numbers',
    balanced: 'Balanced'
  };
  resultsLabel.textContent = `${config.label} — ${strategyNames[strategy]} Strategy`;
}

/**
 * Formats numbers for clipboard copy.
 * @param {number[]} main
 * @param {number[]} special
 * @param {Object}   config
 * @returns {string}
 */
function formatForCopy(main, special, config) {
  const isPick = config.type === 'pick';
  const mainStr = main.map(n => isPick ? pad(n) : n).join(' - ');

  if (special.length > 0) {
    return `${mainStr} + ${config.specialLabel}: ${special[0]}`;
  }
  return mainStr;
}

// ─────────────────────────────────────────────
// 8. GENERATE — MAIN ACTION
// ─────────────────────────────────────────────

/**
 * Triggered on Generate button click.
 * Applies loading state, generates numbers, then renders them.
 */
function handleGenerate() {
  const lotteryType = lotterySelect.value;
  const config      = LOTTERY_CONFIGS[lotteryType];

  if (!config) return;

  // Set loading state
  generateBtn.disabled = true;
  generateBtn.classList.add('loading');
  generateBtn.querySelector('.btn-text').textContent = 'Generating…';

  // Short delay for UX feedback (feels intentional, not instant)
  setTimeout(() => {
    const { main, special } = generateNumbers(currentStrategy, config);

    // Store for copy
    lastNumbers = { main, special, config };

    // Update label
    updateResultsLabel(config, currentStrategy);

    // Render balls
    renderBalls(main, special, config);

    // Show results section
    resultsWrapper.hidden = false;

    // Reset copy button state
    copyBtn.textContent = '⎋ Copy Numbers';
    copyBtn.classList.remove('copied');

    // Restore button
    generateBtn.disabled = false;
    generateBtn.classList.remove('loading');
    generateBtn.querySelector('.btn-text').textContent = 'Generate My Numbers';

    // Smooth scroll to results on mobile
    if (window.innerWidth < 600) {
      resultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

  }, 480); // Short intentional delay
}

// ─────────────────────────────────────────────
// 9. COPY TO CLIPBOARD
// ─────────────────────────────────────────────

/**
 * Copies the last generated numbers to clipboard.
 */
function handleCopy() {
  if (!lastNumbers.main) return;

  const { main, special, config } = lastNumbers;
  const text = formatForCopy(main, special, config);

  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = '✓ Copied!';
    copyBtn.classList.add('copied');

    // Reset after 2.5 seconds
    setTimeout(() => {
      copyBtn.innerHTML = '<span>⎋</span> Copy Numbers';
      copyBtn.classList.remove('copied');
    }, 2500);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);

    copyBtn.textContent = '✓ Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.innerHTML = '<span>⎋</span> Copy Numbers';
      copyBtn.classList.remove('copied');
    }, 2500);
  });
}

// ─────────────────────────────────────────────
// 10. STRATEGY BUTTON SELECTION
// ─────────────────────────────────────────────

/**
 * Handles strategy button toggle (single-select).
 * @param {HTMLElement} clickedBtn
 */
function handleStrategySelect(clickedBtn) {
  strategyBtns.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
  });

  clickedBtn.classList.add('active');
  clickedBtn.setAttribute('aria-pressed', 'true');
  currentStrategy = clickedBtn.dataset.strategy;
}

// ─────────────────────────────────────────────
// 11. EVENT LISTENERS
// ─────────────────────────────────────────────

// Generate button
generateBtn.addEventListener('click', handleGenerate);

// Strategy buttons
strategyBtns.forEach(btn => {
  btn.addEventListener('click', () => handleStrategySelect(btn));
});

// Copy button
copyBtn.addEventListener('click', handleCopy);

// Allow Enter key on generate button (accessibility)
generateBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleGenerate();
  }
});

// ─────────────────────────────────────────────
// 12. INIT
// ─────────────────────────────────────────────

/**
 * Initializes the app on page load.
 */
function init() {
  // Set current year in footer
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  // Ensure results are hidden on load
  resultsWrapper.hidden = true;
}

// Run init on DOM ready
document.addEventListener('DOMContentLoaded', init);
