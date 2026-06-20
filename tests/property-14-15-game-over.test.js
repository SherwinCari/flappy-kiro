const fc = require('fast-check');

/**
 * Properties 14-15: Game-Over Mechanics
 * Validates: Requirements 8.3, 8.5, 8.6
 *
 * Pure functions extracted from game-over logic in index.html.
 */

// ═══════════════════════════════════════
// CONSTANTS (matching CONFIG in index.html)
// ═══════════════════════════════════════

const SHAKE_DURATION = 300;    // ms
const SHAKE_INTENSITY = 5;     // pixels
const RESTART_DELAY = 500;     // ms

// ═══════════════════════════════════════
// PURE FUNCTIONS UNDER TEST
// ═══════════════════════════════════════

/**
 * Property 14: Screen shake linear decay
 * Computes the shake intensity multiplier based on elapsed time since activation.
 * Returns 0 if elapsed >= SHAKE_DURATION.
 */
function computeShakeIntensity(elapsed) {
  if (elapsed >= SHAKE_DURATION) return 0;
  return SHAKE_INTENSITY * (1 - elapsed / SHAKE_DURATION);
}

/**
 * Property 15: Restart delay enforcement
 * Returns true if enough time has passed since game-over for a restart to be allowed.
 */
function canRestart(elapsedSinceGameOver) {
  return elapsedSinceGameOver >= RESTART_DELAY;
}

// ═══════════════════════════════════════
// PROPERTY TESTS
// ═══════════════════════════════════════

describe('Property 14: Screen shake linear decay', () => {
  /**
   * **Validates: Requirements 8.3**
   */
  test('intensity multiplier equals (1 - t/300) for elapsed in [0, 300]', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 300, noNaN: true }),
        (elapsed) => {
          const result = computeShakeIntensity(elapsed);
          const expectedMultiplier = 1 - elapsed / SHAKE_DURATION;
          const expected = SHAKE_INTENSITY * expectedMultiplier;
          expect(result).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('intensity is always in range [0, 5] for elapsed in [0, 300]', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 300, noNaN: true }),
        (elapsed) => {
          const result = computeShakeIntensity(elapsed);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(SHAKE_INTENSITY);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('at t=0, intensity equals SHAKE_INTENSITY (5)', () => {
    const result = computeShakeIntensity(0);
    expect(result).toBe(SHAKE_INTENSITY);
  });

  test('at t=300, intensity equals 0', () => {
    const result = computeShakeIntensity(300);
    expect(result).toBe(0);
  });

  test('intensity decreases monotonically as elapsed increases', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 299, noNaN: true }),
        fc.double({ min: 0.001, max: 1, noNaN: true }),
        (t1, delta) => {
          const t2 = Math.min(t1 + delta, 300);
          const intensity1 = computeShakeIntensity(t1);
          const intensity2 = computeShakeIntensity(t2);
          expect(intensity2).toBeLessThanOrEqual(intensity1 + 1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('offsets would be in [-intensity, intensity] for any random value in [-1, 1]', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 300, noNaN: true }),
        fc.double({ min: -1, max: 1, noNaN: true }),
        (elapsed, randomFactor) => {
          const intensity = computeShakeIntensity(elapsed);
          const offset = randomFactor * intensity;
          expect(offset).toBeGreaterThanOrEqual(-intensity);
          expect(offset).toBeLessThanOrEqual(intensity);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('beyond 300ms, intensity is 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 300, max: 2000, noNaN: true }),
        (elapsed) => {
          const result = computeShakeIntensity(elapsed);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 500 }
    );
  });
});

describe('Property 15: Restart delay enforcement', () => {
  /**
   * **Validates: Requirements 8.5, 8.6**
   */
  test('restart permitted iff elapsed >= 500ms', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 2000, noNaN: true }),
        (elapsed) => {
          const result = canRestart(elapsed);
          const expected = elapsed >= RESTART_DELAY;
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('at exactly 500ms, restart is permitted', () => {
    expect(canRestart(500)).toBe(true);
  });

  test('below 500ms, restart is not permitted', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 499.999, noNaN: true }),
        (elapsed) => {
          expect(canRestart(elapsed)).toBe(false);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('at or above 500ms, restart is always permitted', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 500, max: 10000, noNaN: true }),
        (elapsed) => {
          expect(canRestart(elapsed)).toBe(true);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('restart delay is a strict threshold (499.99ms is not permitted, 500ms is)', () => {
    expect(canRestart(499.99)).toBe(false);
    expect(canRestart(500)).toBe(true);
    expect(canRestart(500.01)).toBe(true);
  });
});
