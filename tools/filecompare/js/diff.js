/**
 * diff.js — Myers diff algorithm implementation
 * FileCompare · 3K Digital
 *
 * Exports (attached to window):
 *   diffLines(aLines, bLines) → DiffRow[]
 *
 * DiffRow shapes:
 *   { type: 'eq',  aL, bL, aN, bN }
 *   { type: 'del', aL, bL, aN, bN }
 *   { type: 'ins', aL, bL, aN, bN }
 *   { type: 'chg', aL, bL, aN, bN, ar, br }  ← merged del+ins with char diffs
 *
 * ar/br are arrays of { ch: string, c: '' | 'a' | 'd' }
 */

(function () {
  'use strict';

  /**
   * Myers shortest-edit-script algorithm.
   * Returns the trace (array of V snapshots) needed for backtracking.
   * @param {Array} A
   * @param {Array} B
   * @returns {Int32Array[]}
   */
  function myersTrace(A, B) {
    const n = A.length;
    const m = B.length;
    const max = n + m;
    const V = new Int32Array(2 * max + 2);
    const trace = [];

    for (let d = 0; d <= max; d++) {
      trace.push(V.slice());

      for (let k = -d; k <= d; k += 2) {
        let x;
        if (k === -d || (k !== d && V[k - 1 + max] < V[k + 1 + max])) {
          x = V[k + 1 + max];       // move down
        } else {
          x = V[k - 1 + max] + 1;   // move right
        }
        let y = x - k;

        // Extend along the diagonal (equal elements)
        while (x < n && y < m && A[x] === B[y]) {
          x++;
          y++;
        }

        V[k + max] = x;

        if (x >= n && y >= m) {
          trace.push(V.slice());
          return trace;
        }
      }
    }

    return trace; // should never reach here for valid input
  }

  /**
   * Backtrack through the Myers trace to produce edit operations.
   * @param {Array} A
   * @param {Array} B
   * @returns {{ t: '=' | '-' | '+', a: number, b: number }[]}
   */
  function buildOps(A, B) {
    const trace = myersTrace(A, B);
    const max = A.length + B.length;
    const ops = [];
    let x = A.length;
    let y = B.length;

    for (let d = trace.length - 1; d >= 0; d--) {
      const V = trace[d];
      const k = x - y;
      let prevK;

      if (k === -d || (k !== d && V[k - 1 + max] < V[k + 1 + max])) {
        prevK = k + 1;
      } else {
        prevK = k - 1;
      }

      const prevX = V[prevK + max];
      const prevY = prevX - prevK;

      // Diagonal (equal) moves
      while (x > prevX && y > prevY) {
        x--;
        y--;
        ops.unshift({ t: '=', a: x, b: y });
      }

      // Single edit move
      if (d > 0) {
        if (x > prevX) {
          x--;
          ops.unshift({ t: '-', a: x, b: y }); // deletion
        } else if (y > prevY) {
          y--;
          ops.unshift({ t: '+', a: x, b: y }); // insertion
        }
      }
    }

    return ops;
  }

  /**
   * Character-level diff between two strings.
   * @param {string} a
   * @param {string} b
   * @returns {{ ar: CharToken[], br: CharToken[] }}
   *   CharToken: { ch: string, c: '' | 'a' | 'd' }
   */
  function charDiff(a, b) {
    const ac = Array.from(a);
    const bc = Array.from(b);
    const ops = buildOps(ac, bc);
    const ar = [];
    const br = [];

    for (const op of ops) {
      if (op.t === '=') {
        ar.push({ ch: ac[op.a], c: '' });
        br.push({ ch: bc[op.b], c: '' });
      } else if (op.t === '-') {
        ar.push({ ch: ac[op.a], c: 'd' });
      } else {
        br.push({ ch: bc[op.b], c: 'a' });
      }
    }

    return { ar, br };
  }

  /**
   * Diff two arrays of lines and return structured DiffRow[].
   * Adjacent deletions and insertions are merged into 'chg' rows
   * and enriched with character-level diffs.
   *
   * @param {string[]} aLines
   * @param {string[]} bLines
   * @returns {DiffRow[]}
   */
  function diffLines(aLines, bLines) {
    const ops = buildOps(aLines, bLines);
    const raw = [];

    for (const op of ops) {
      if (op.t === '=') {
        raw.push({ type: 'eq',  aL: aLines[op.a], bL: bLines[op.b], aN: op.a + 1, bN: op.b + 1 });
      } else if (op.t === '-') {
        raw.push({ type: 'del', aL: aLines[op.a], bL: null,         aN: op.a + 1, bN: null });
      } else {
        raw.push({ type: 'ins', aL: null,          bL: bLines[op.b], aN: null,     bN: op.b + 1 });
      }
    }

    // Merge consecutive del + ins pairs into 'chg' rows with char diffs
    const merged = [];
    let i = 0;

    while (i < raw.length) {
      if (
        i + 1 < raw.length &&
        raw[i].type === 'del' &&
        raw[i + 1].type === 'ins'
      ) {
        const { ar, br } = charDiff(raw[i].aL || '', raw[i + 1].bL || '');
        merged.push({
          type: 'chg',
          aL: raw[i].aL,
          bL: raw[i + 1].bL,
          aN: raw[i].aN,
          bN: raw[i + 1].bN,
          ar,
          br,
        });
        i += 2;
      } else {
        merged.push(raw[i]);
        i++;
      }
    }

    return merged;
  }

  // Expose on window so other scripts can use it
  window.diffLines = diffLines;
})();
