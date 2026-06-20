const fc = require('fast-check');

/**
 * Properties 11-13: Scoring System
 * Validates: Requirements 6.1, 6.2, 6.5, 7.2, 7.4
 *
 * Pure functions extracted from scoring logic in index.html.
 */

// ═══════════════════════════════════════
// CONSTANTS (matching CONFIG in index.html)
// ═══════════════════════════════════════

const PIPE_WIDTH = 50;
const POPUP_DURATION = 800;  // ms
const POPUP_RISE = 30;       // pixels

// ═══════════════════════════════════════
// PURE FUNCTIONS UNDER TEST
// ═══════════════════════════════════════

/**
 * Property 11: Score increment logic
 * Checks if ghost has passed the pipe trailing edge and scores once.
 */
function checkScoring(ghostX, pipe) {
  // pipe: { x, width: 50, scored: boolean }
  if (ghostX > pipe.x + pipe.width && !pipe.scored) {
    return { scored: true, increment: 1 };
  }
  return { scored: pipe.scored, increment: 0 };
}

/**
 * Property 12: Score popup animation
 * Computes popup opacity and vertical offset based on elapsed time.
 */
function computePopupState(elapsed) {
  // elapsed in ms, [0, 800]
  const opacity = 1 - elapsed / POPUP_DURATION;
  const offsetY = POPUP_RISE * (elapsed / POPUP_DURATION);
  return { opacity, offsetY };
}

/**
 * Property 13: High score persistence logic
 * Determines whether to save a new high score.
 */
function shouldSaveHighScore(currentScore, storedHighScore) {
  return currentScore > storedHighScore;
}

/**
 * Property 13: Parse high score from localStorage value.
 * Returns 0 for invalid/absent values.
 */
function parseHighScore(value) {
  return parseInt(value, 10) || 0;
}

// ═══════════════════════════════════════
// PROPERTY TESTS
// ═══════════════════════════════════════

describe('Property 11: Score increments exactly once per pipe', () => {
  /**
   * **Validates: Requirements 6.1, 6.2**
   */
  test('ghost past trailing edge of unscored pipe increments score by exactly 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 400 }),       // ghostX
        fc.integer({ min: -100, max: 400 }),    // pipe.x
        (ghostX, pipeX) => {
          const pipe = { x: pipeX, width: PIPE_WIDTH, scored: false };
          const result = checkScoring(ghostX, pipe);

          if (ghostX > pipeX + PIPE_WIDTH) {
            // Ghost has passed pipe trailing edge
            expect(result.scored).toBe(true);
            expect(result.increment).toBe(1);
          } else {
            // Ghost hasn't passed yet
            expect(result.scored).toBe(false);
            expect(result.increment).toBe(0);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('already-scored pipe never increments again regardless of ghost position', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 400 }),       // ghostX
        fc.integer({ min: -100, max: 400 }),    // pipe.x
        (ghostX, pipeX) => {
          const pipe = { x: pipeX, width: PIPE_WIDTH, scored: true };
          const result = checkScoring(ghostX, pipe);

          // Once scored, increment is always 0
          expect(result.increment).toBe(0);
          expect(result.scored).toBe(true);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('simulated multi-frame sequence: pipe scores at most once', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 400 }),       // ghostX (past pipe)
        fc.integer({ min: -100, max: 400 }),    // pipe.x
        fc.integer({ min: 2, max: 10 }),        // number of subsequent frames
        (ghostX, pipeX, frameCount) => {
          const pipe = { x: pipeX, width: PIPE_WIDTH, scored: false };

          let totalIncrements = 0;

          // Simulate multiple frames where ghost is past pipe
          for (let i = 0; i < frameCount; i++) {
            const result = checkScoring(ghostX, pipe);
            totalIncrements += result.increment;
            // Update pipe state after scoring check (as game loop does)
            pipe.scored = result.scored;
          }

          // Should increment at most 1 time total
          if (ghostX > pipeX + PIPE_WIDTH) {
            expect(totalIncrements).toBe(1);
          } else {
            expect(totalIncrements).toBe(0);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });
});

describe('Property 12: Score popup animation decay', () => {
  /**
   * **Validates: Requirements 6.5**
   */
  test('opacity = (1 - t/800) and offsetY = 30 * (t/800) for elapsed in [0, 800]', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 800, noNaN: true }),
        (elapsed) => {
          const result = computePopupState(elapsed);
          const expectedOpacity = 1 - elapsed / POPUP_DURATION;
          const expectedOffsetY = POPUP_RISE * (elapsed / POPUP_DURATION);

          expect(Math.abs(result.opacity - expectedOpacity)).toBeLessThan(1e-10);
          expect(Math.abs(result.offsetY - expectedOffsetY)).toBeLessThan(1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('opacity starts at 1.0 when elapsed is 0', () => {
    const result = computePopupState(0);
    expect(result.opacity).toBe(1);
    expect(result.offsetY).toBe(0);
  });

  test('opacity reaches 0.0 and offset reaches 30px at elapsed = 800ms', () => {
    const result = computePopupState(800);
    expect(Math.abs(result.opacity)).toBeLessThan(1e-10);
    expect(Math.abs(result.offsetY - 30)).toBeLessThan(1e-10);
  });

  test('opacity is monotonically decreasing as elapsed increases', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 799, noNaN: true }),
        fc.double({ min: 0.001, max: 1, noNaN: true }),  // small positive delta
        (t1, delta) => {
          const t2 = Math.min(t1 + delta, 800);
          const state1 = computePopupState(t1);
          const state2 = computePopupState(t2);

          expect(state2.opacity).toBeLessThanOrEqual(state1.opacity + 1e-10);
          expect(state2.offsetY).toBeGreaterThanOrEqual(state1.offsetY - 1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });
});

describe('Property 13: High score persistence logic', () => {
  /**
   * **Validates: Requirements 7.2, 7.4**
   */
  test('shouldSaveHighScore returns true iff currentScore > storedHighScore', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),   // currentScore
        fc.integer({ min: 0, max: 1000 }),   // storedHighScore
        (currentScore, storedHighScore) => {
          const result = shouldSaveHighScore(currentScore, storedHighScore);

          if (currentScore > storedHighScore) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('equal scores do not trigger save', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (score) => {
          expect(shouldSaveHighScore(score, score)).toBe(false);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('parseHighScore returns 0 for invalid localStorage values (null, undefined, non-numeric)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant('abc'),
          fc.constant(''),
          fc.constant('hello world'),
          fc.constant('NaN')
        ),
        (value) => {
          const result = parseHighScore(value);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('parseHighScore correctly parses valid numeric strings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }).map(String),
        (value) => {
          const result = parseHighScore(value);
          expect(result).toBe(parseInt(value, 10));
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('parseHighScore handles mixed valid/invalid localStorage values', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant('abc'),
          fc.constant(''),
          fc.constant('42'),
          fc.constant('100'),
          fc.constant('0'),
          fc.integer({ min: 0, max: 10000 }).map(String)
        ),
        (value) => {
          const result = parseHighScore(value);
          // Result must always be a non-negative integer or 0
          expect(Number.isInteger(result)).toBe(true);
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 500 }
    );
  });
});
