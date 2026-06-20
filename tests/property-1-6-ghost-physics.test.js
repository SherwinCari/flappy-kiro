const fc = require('fast-check');

/**
 * Properties 1-6: Ghost Physics
 * Validates: Requirements 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8
 *
 * Pure functions extracted from ghost physics logic in index.html.
 */

// ═══════════════════════════════════════
// CONSTANTS (matching CONFIG in index.html)
// ═══════════════════════════════════════

const GRAVITY = 800;           // px/s²
const FLAP_VELOCITY = -300;    // px/s
const MAX_FALL_SPEED = 600;    // px/s
const MAX_RISE_SPEED = -720;   // px/s
const MAX_DELTA_TIME = 0.05;   // seconds

// ═══════════════════════════════════════
// PURE FUNCTIONS UNDER TEST
// ═══════════════════════════════════════

/**
 * Property 1: Flap velocity override
 * On any flap input, velocity is set to FLAP_VELOCITY regardless of current velocity.
 */
function applyFlap(currentVy) {
  return FLAP_VELOCITY; // -300 px/s
}

/**
 * Property 2: Delta-time clamping
 * Clamp raw delta-time to [0, MAX_DELTA_TIME]. Non-finite or negative values → 0.
 */
function clampDeltaTime(rawDt) {
  if (!isFinite(rawDt) || rawDt < 0) return 0;
  return Math.min(rawDt, MAX_DELTA_TIME);
}

/**
 * Property 3: Gravity application
 * Apply gravity acceleration to velocity (before clamping).
 */
function applyGravity(vy, dt) {
  return vy + GRAVITY * dt;
}

/**
 * Property 4: Position update
 * Integrate position using velocity and delta-time.
 */
function updatePosition(y, vy, dt) {
  return y + vy * dt;
}

/**
 * Property 5: Velocity clamping
 * Clamp velocity to [MAX_RISE_SPEED, MAX_FALL_SPEED].
 */
function clampVelocity(vy) {
  return Math.max(MAX_RISE_SPEED, Math.min(vy, MAX_FALL_SPEED));
}

/**
 * Property 6: Top-edge boundary clamping
 * If position is above top edge (y < 0), clamp to 0 and kill velocity.
 */
function clampTopEdge(y, vy) {
  if (y < 0) {
    return { y: 0, vy: 0 };
  }
  return { y, vy };
}

// ═══════════════════════════════════════
// PROPERTY TESTS
// ═══════════════════════════════════════

describe('Property 1: Flap velocity override', () => {
  /**
   * **Validates: Requirements 2.1, 2.2, 3.7**
   */
  test('flap always produces exactly -300 px/s regardless of current velocity', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10000, max: 10000, noNaN: true }),
        (currentVy) => {
          const result = applyFlap(currentVy);
          expect(result).toBe(FLAP_VELOCITY);
        }
      ),
      { numRuns: 1000 }
    );
  });
});

describe('Property 2: Delta-time clamping', () => {
  /**
   * **Validates: Requirements 3.1**
   */
  test('output is always in [0, 0.05] for any input including edge cases', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ min: -1000, max: 1000 }),
          fc.constant(NaN),
          fc.constant(Infinity),
          fc.constant(-Infinity),
          fc.constant(0)
        ),
        (rawDt) => {
          const result = clampDeltaTime(rawDt);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(MAX_DELTA_TIME);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('non-finite values (NaN, Infinity, -Infinity) produce 0', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(NaN),
          fc.constant(Infinity),
          fc.constant(-Infinity)
        ),
        (rawDt) => {
          const result = clampDeltaTime(rawDt);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('negative values produce 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: -Number.MIN_VALUE, noNaN: true }),
        (rawDt) => {
          const result = clampDeltaTime(rawDt);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('values above MAX_DELTA_TIME are clamped to 0.05', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.05 + Number.EPSILON, max: 1000, noNaN: true }),
        (rawDt) => {
          const result = clampDeltaTime(rawDt);
          expect(result).toBe(MAX_DELTA_TIME);
        }
      ),
      { numRuns: 500 }
    );
  });
});

describe('Property 3: Gravity application', () => {
  /**
   * **Validates: Requirements 3.2**
   */
  test('new velocity equals vy + 800 * dt for valid (vy, dt) pairs', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: 1000, noNaN: true }),   // vy
        fc.double({ min: 0, max: 0.05, noNaN: true }),       // dt
        (vy, dt) => {
          const result = applyGravity(vy, dt);
          const expected = vy + GRAVITY * dt;
          expect(Math.abs(result - expected)).toBeLessThan(1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });
});

describe('Property 4: Position update', () => {
  /**
   * **Validates: Requirements 3.3**
   */
  test('new position equals y + vy * dt for valid (y, vy, dt) triples', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: 1000, noNaN: true }),   // y
        fc.double({ min: -1000, max: 1000, noNaN: true }),   // vy
        fc.double({ min: 0, max: 0.05, noNaN: true }),       // dt
        (y, vy, dt) => {
          const result = updatePosition(y, vy, dt);
          const expected = y + vy * dt;
          expect(Math.abs(result - expected)).toBeLessThan(1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });
});

describe('Property 5: Velocity clamping invariant', () => {
  /**
   * **Validates: Requirements 3.4, 3.5**
   */
  test('clamped velocity is always within [-720, 600] px/s', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10000, max: 10000, noNaN: true }),
        (vy) => {
          const result = clampVelocity(vy);
          expect(result).toBeGreaterThanOrEqual(MAX_RISE_SPEED);
          expect(result).toBeLessThanOrEqual(MAX_FALL_SPEED);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('values within range are unchanged', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -720, max: 600, noNaN: true }),
        (vy) => {
          const result = clampVelocity(vy);
          expect(result).toBe(vy);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('values below -720 are clamped to -720', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10000, max: -720 - Number.EPSILON, noNaN: true }),
        (vy) => {
          const result = clampVelocity(vy);
          expect(result).toBe(MAX_RISE_SPEED);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('values above 600 are clamped to 600', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 600 + Number.EPSILON, max: 10000, noNaN: true }),
        (vy) => {
          const result = clampVelocity(vy);
          expect(result).toBe(MAX_FALL_SPEED);
        }
      ),
      { numRuns: 500 }
    );
  });
});

describe('Property 6: Top-edge boundary clamping', () => {
  /**
   * **Validates: Requirements 3.8**
   */
  test('positions below 0 are clamped to y=0 and vy=0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: -0.001, noNaN: true }),  // negative y
        fc.double({ min: -1000, max: 1000, noNaN: true }),    // any vy
        (y, vy) => {
          const result = clampTopEdge(y, vy);
          expect(result.y).toBe(0);
          expect(result.vy).toBe(0);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('positions at or above 0 are unchanged', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000, noNaN: true }),        // non-negative y
        fc.double({ min: -1000, max: 1000, noNaN: true }),    // any vy
        (y, vy) => {
          const result = clampTopEdge(y, vy);
          expect(result.y).toBe(y);
          expect(result.vy).toBe(vy);
        }
      ),
      { numRuns: 1000 }
    );
  });
});
